// src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit'
import { RedisStore } from 'rate-limit-redis'
import { redis } from '../lib/redis'

const createRedisStore = (prefix: string) =>
  new RedisStore({
    sendCommand: async (...args: (string | number)[]) => {
      return await redis.call(args[0] as string, ...(args.slice(1) as (string | number)[])) as never
    },
    prefix,
  } as never)

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  store: createRedisStore('rl:auth:'),
  message: { success: false, message: 'Too many attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
})

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  store: createRedisStore('rl:api:'),
  message: { success: false, message: 'Too many requests, slow down' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
})

export const sensitiveOpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  store: createRedisStore('rl:sensitive:'),
  message: { success: false, message: 'Too many sensitive operations, try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip ?? 'unknown',
})
