// src/index.ts
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

import { authRouter } from './routes/auth'
import { accountRouter } from './routes/account'
import { cardRouter } from './routes/card'
import { transactionRouter } from './routes/transaction'
import { adminRouter } from './routes/admin'
import { userRouter } from './routes/user'
import { errorHandler } from './middleware/error'
import { prisma } from './lib/prisma'
import { redis } from './lib/redis'

const app = express()
const PORT = process.env.PORT || 3998
const APP_URL = process.env.APP_URL || 'http://localhost:'

// Security middleware
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: APP_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'))
}

// Health check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    await redis.ping()
    res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'Adullam Bank API' })
  } catch (error) {
    res.status(503).json({ status: 'error', message: 'Service unavailable' })
  }
})

// Routes
app.use('/api/auth', authRouter)
app.use('/api/accounts', accountRouter)
app.use('/api/cards', cardRouter)
app.use('/api/transactions', transactionRouter)
app.use('/api/admin', adminRouter)
app.use('/api/users', userRouter)

// 404
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' })
})

// Error handler
app.use(errorHandler)

// Startup
async function start() {
  try {
    await prisma.$connect()
    console.log('✅ PostgreSQL connected')
    await redis.ping()
    console.log('✅ Redis connected')
    app.listen(PORT, () => {
      console.log(`🚀 Adullam Bank API running on port ${PORT}`)
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error)
    process.exit(1)
  }
}

start()

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...')
  await prisma.$disconnect()
  redis.disconnect()
  process.exit(0)
})
