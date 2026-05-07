// src/routes/user.ts
import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

export const userRouter = Router()
userRouter.use(authenticate)

const profileSchema = z.object({
  firstName: z.string().min(2).max(50).optional(),
  lastName: z.string().min(2).max(50).optional(),
  phone: z.string().optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
})

// PUT /api/users/profile
userRouter.put('/profile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = profileSchema.parse(req.body)
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: { id: true, email: true, firstName: true, lastName: true, phone: true },
    })
    res.json({ success: true, user })
  } catch (err) {
    next(err)
  }
})

// PUT /api/users/password
userRouter.put('/password', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body)
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } })

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) {
      res.status(401).json({ success: false, message: 'Current password is incorrect' })
      return
    }

    const hashed = await bcrypt.hash(newPassword, Number(process.env.BCRYPT_ROUNDS) || 12)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    res.json({ success: true, message: 'Password updated successfully' })
  } catch (err) {
    next(err)
  }
})
