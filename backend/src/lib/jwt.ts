// src/lib/jwt.ts
import jwt from 'jsonwebtoken'

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_change_me'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_change_me'
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN || '15m'
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || '7d'

export interface TokenPayload {
  userId: string
  email: string
  role: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES } as jwt.SignOptions)
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES } as jwt.SignOptions)
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload
}

export function cookieOptions(maxAgeMs: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge: maxAgeMs,
  }
}
