// src/lib/redis.ts
import Redis from 'ioredis'

export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
})

redis.on('error', (err) => {
  console.error('Redis error:', err)
})

// Key helpers
export const RedisKeys = {
  refreshToken: (userId: string) => `refresh:${userId}`,
  emailVerify: (token: string) => `email_verify:${token}`,
  passwordReset: (token: string) => `pwd_reset:${token}`,
  loginAttempts: (email: string) => `login_attempts:${email}`,
  twoFaSession: (userId: string) => `2fa_session:${userId}`,
  session: (sessionId: string) => `session:${sessionId}`,
}

export const TTL = {
  accessToken: 15 * 60,           // 15 min
  refreshToken: 7 * 24 * 3600,    // 7 days
  emailVerify: 24 * 3600,         // 24 hours
  passwordReset: 15 * 60,         // 15 min
  loginAttempts: 15 * 60,         // 15 min window
  twoFaSession: 5 * 60,           // 5 min
}
