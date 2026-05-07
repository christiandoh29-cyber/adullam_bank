// src/routes/auth.ts
import { Router, Request, Response, NextFunction } from 'express'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { redis, RedisKeys, TTL } from '../lib/redis'
import { signAccessToken, signRefreshToken, verifyRefreshToken, cookieOptions } from '../lib/jwt'
import { generateBankingInfo, generateCardNumber, generateCVV, generateCardExpiry } from '../lib/banking'
import { sendVerificationEmail, sendPasswordResetEmail } from '../lib/mailer'
import { authenticate } from '../middleware/auth'
import { authLimiter, sensitiveOpLimiter } from '../middleware/rateLimit'

export const authRouter = Router()

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 12

// Schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  firstName: z.string().min(2).max(50),
  lastName: z.string().min(2).max(50),
  phone: z.string().optional(),
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().optional(),
})

const forgotPasswordSchema = z.object({ email: z.string().email() })

const resetPasswordSchema = z.object({
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] })

// POST /api/auth/register
authRouter.post('/register', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = registerSchema.parse(req.body)
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      res.status(409).json({ success: false, message: 'Email already registered' })
      return
    }

    const hashed = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
    const verifyToken = uuidv4()
    const banking = generateBankingInfo()
    const expiry = generateCardExpiry()

    const user = await prisma.user.create({
      data: {
        email: data.email,
        password: hashed,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        emailVerifyToken: verifyToken,
        accounts: {
          create: {
            ...banking,
            cards: {
              create: {
                cardNumber: generateCardNumber('4539'),
                cardHolder: `${data.firstName.toUpperCase()} ${data.lastName.toUpperCase()}`,
                expiryMonth: expiry.month,
                expiryYear: expiry.year,
                cvv: generateCVV(),
                network: 'VISA',
              },
            },
          },
        },
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    })

    await redis.setex(RedisKeys.emailVerify(verifyToken), TTL.emailVerify, user.id)

    try {
      await sendVerificationEmail(user.email, verifyToken, user.firstName)
    } catch (err) {
      console.error('Email send failed (non-blocking):', err)
    }

    res.status(201).json({
      success: true,
      message: 'Account created. Please verify your email.',
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/verify-email/:token
authRouter.get('/verify-email/:token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params
    const userId = await redis.get(RedisKeys.emailVerify(token))
    if (!userId) {
      res.status(400).json({ success: false, message: 'Invalid or expired verification link' })
      return
    }

    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true, emailVerifyToken: null },
    })
    await redis.del(RedisKeys.emailVerify(token))

    res.json({ success: true, message: 'Email verified successfully' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/login
authRouter.post('/login', authLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: data.email } })
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    // Check login attempts
    const attemptsKey = RedisKeys.loginAttempts(data.email)
    const attempts = await redis.get(attemptsKey)
    if (attempts && parseInt(attempts) >= 5) {
      res.status(429).json({ success: false, message: 'Account temporarily locked. Try again in 15 minutes.' })
      return
    }

    const validPassword = await bcrypt.compare(data.password, user.password)
    if (!validPassword) {
      const newAttempts = (parseInt(attempts || '0') + 1)
      await redis.setex(attemptsKey, TTL.loginAttempts, String(newAttempts))
      res.status(401).json({ success: false, message: 'Invalid credentials' })
      return
    }

    // Clear attempts on success
    await redis.del(attemptsKey)

    // Verify email before allowing login
    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        message: 'Please verify your email address before logging in',
      })
      return
    }

    // 2FA check
    if (user.twoFactorEnabled) {
      if (!data.totpCode) {
        const tempToken = uuidv4()
        await redis.setex(RedisKeys.twoFaSession(user.id), TTL.twoFaSession, user.id)
        res.json({ success: true, requiresTwoFactor: true, tempToken })
        return
      }
      const { authenticator } = await import('otplib')
      const valid = authenticator.verify({ token: data.totpCode, secret: user.twoFactorSecret! })
      if (!valid) {
        res.status(401).json({ success: false, message: 'Invalid 2FA code' })
        return
      }
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    await redis.setex(RedisKeys.refreshToken(user.id), TTL.refreshToken, refreshToken)

    res
      .cookie('access_token', accessToken, cookieOptions(TTL.accessToken * 1000))
      .cookie('refresh_token', refreshToken, cookieOptions(TTL.refreshToken * 1000))
      .json({
        success: true,
        message: 'Logged in successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          profilePicture: user.profilePicture,
          twoFactorEnabled: user.twoFactorEnabled,
        },
        accessToken,
      })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/logout
authRouter.post('/logout', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await redis.del(RedisKeys.refreshToken(req.user!.userId))
    res
      .clearCookie('access_token')
      .clearCookie('refresh_token')
      .json({ success: true, message: 'Logged out' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/refresh-token
authRouter.post('/refresh-token', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.cookies?.refresh_token || req.body.refreshToken
    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token required' })
      return
    }

    const payload = verifyRefreshToken(token)
    const stored = await redis.get(RedisKeys.refreshToken(payload.userId))
    if (!stored || stored !== token) {
      res.status(401).json({ success: false, message: 'Invalid refresh token' })
      return
    }

    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user) {
      res.status(401).json({ success: false, message: 'User not found' })
      return
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role }
    const newAccessToken = signAccessToken(newPayload)
    const newRefreshToken = signRefreshToken(newPayload)

    await redis.setex(RedisKeys.refreshToken(user.id), TTL.refreshToken, newRefreshToken)

    res
      .cookie('access_token', newAccessToken, cookieOptions(TTL.accessToken * 1000))
      .cookie('refresh_token', newRefreshToken, cookieOptions(TTL.refreshToken * 1000))
      .json({ success: true, accessToken: newAccessToken })
  } catch (err) {
    next(err)
  }
})

// GET /api/auth/me
authRouter.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isEmailVerified: true,
        twoFactorEnabled: true, createdAt: true, profilePicture: true,
      },
    })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/forgot-password
authRouter.post('/forgot-password', sensitiveOpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email } })

    // Always return success to avoid email enumeration
    if (user) {
      const token = uuidv4()
      await redis.setex(RedisKeys.passwordReset(token), TTL.passwordReset, user.id)
      try {
        await sendPasswordResetEmail(email, token, user.firstName)
      } catch (err) {
        console.error('Password reset email failed:', err)
      }
    }

    res.json({ success: true, message: 'If this email is registered, you will receive a reset link.' })
  } catch (err) {
    next(err)
  }
})

// POST /api/auth/reset-password/:token
authRouter.post('/reset-password/:token', sensitiveOpLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.params
    const { password } = resetPasswordSchema.parse(req.body)

    const userId = await redis.get(RedisKeys.passwordReset(token))
    if (!userId) {
      res.status(400).json({ success: false, message: 'Invalid or expired reset link' })
      return
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS)
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } })

    // Invalidate all sessions
    await redis.del(RedisKeys.passwordReset(token))
    await redis.del(RedisKeys.refreshToken(userId))

    res.json({ success: true, message: 'Password reset successfully. Please log in.' })
  } catch (err) {
    next(err)
  }
})
