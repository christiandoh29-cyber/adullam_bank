// src/routes/transaction.ts
import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { Decimal } from '@prisma/client/runtime/library'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { generateTransactionReference, calculateFee } from '../lib/banking'
import { sendTransferReceivedEmail, sendTransferSentEmail } from '../lib/mailer'

export const transactionRouter = Router()
transactionRouter.use(authenticate)

// GET /api/transactions
transactionRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', type, status, dateFrom, dateTo } = req.query

    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    const accountIds = accounts.map((a) => a.id)

    const where: Record<string, unknown> = {
      OR: [
        { fromAccountId: { in: accountIds } },
        { toAccountId: { in: accountIds } },
      ],
    }
    if (type) where.type = type
    if (status) where.status = status
    if (dateFrom || dateTo) {
      where.createdAt = {
        ...(dateFrom ? { gte: new Date(dateFrom as string) } : {}),
        ...(dateTo ? { lte: new Date(dateTo as string) } : {}),
      }
    }

    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          fromAccount: { include: { user: { select: { firstName: true, lastName: true } } } },
          toAccount: { include: { user: { select: { firstName: true, lastName: true } } } },
        },
      }),
      prisma.transaction.count({ where }),
    ])

    res.json({
      success: true,
      transactions,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/transactions/stats
transactionRouter.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    const accountIds = accounts.map((a) => a.id)

    const now = new Date()
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const [sent, received, pending] = await Promise.all([
      prisma.transaction.aggregate({
        where: { fromAccountId: { in: accountIds }, status: 'COMPLETED', createdAt: { gte: firstOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.aggregate({
        where: { toAccountId: { in: accountIds }, status: 'COMPLETED', createdAt: { gte: firstOfMonth } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.transaction.count({
        where: {
          OR: [{ fromAccountId: { in: accountIds } }, { toAccountId: { in: accountIds } }],
          status: 'PENDING',
        },
      }),
    ])

    // Last 6 months balance evolution (approximate)
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      return { label: d.toLocaleString('fr-FR', { month: 'short', year: '2-digit' }), date: d }
    }).reverse()

    res.json({
      success: true,
      stats: {
        thisMonth: {
          sent: sent._sum.amount ?? 0,
          received: received._sum.amount ?? 0,
          sentCount: sent._count,
          receivedCount: received._count,
        },
        pending,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/transactions/:id
transactionRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    const accountIds = accounts.map((a) => a.id)

    const tx = await prisma.transaction.findFirst({
      where: {
        id: req.params.id,
        OR: [{ fromAccountId: { in: accountIds } }, { toAccountId: { in: accountIds } }],
      },
      include: {
        fromAccount: { include: { user: { select: { firstName: true, lastName: true } } } },
        toAccount: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
    })
    if (!tx) {
      res.status(404).json({ success: false, message: 'Transaction not found' })
      return
    }
    res.json({ success: true, transaction: tx })
  } catch (err) {
    next(err)
  }
})

// POST /api/transactions/transfer
const transferSchema = z.object({
  toIban: z.string().min(10),
  amount: z.number().positive().max(999999999),
  description: z.string().max(200).optional(),
})

transactionRouter.post('/transfer', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = transferSchema.parse(req.body)
    const normalizedIban = data.toIban.replace(/\s/g, '')

    const fromAccount = await prisma.account.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' },
      include: { user: true },
    })
    if (!fromAccount) {
      res.status(404).json({ success: false, message: 'No active account found' })
      return
    }

    const toAccount = await prisma.account.findFirst({
      where: { iban: { contains: normalizedIban.slice(-20) } },
      include: { user: true },
    })
    if (!toAccount) {
      res.status(404).json({ success: false, message: 'Destination IBAN not found' })
      return
    }
    if (toAccount.id === fromAccount.id) {
      res.status(400).json({ success: false, message: 'Cannot transfer to your own account' })
      return
    }
    if (toAccount.status !== 'ACTIVE') {
      res.status(400).json({ success: false, message: 'Destination account is not active' })
      return
    }

    const fee = calculateFee(data.amount)
    const totalDebit = data.amount + fee

    if (Number(fromAccount.balance) < totalDebit) {
      res.status(400).json({ success: false, message: 'Insufficient balance' })
      return
    }

    const reference = generateTransactionReference()

    // Atomic transaction
    const [, , tx] = await prisma.$transaction([
      prisma.account.update({
        where: { id: fromAccount.id },
        data: { balance: { decrement: new Decimal(totalDebit) } },
      }),
      prisma.account.update({
        where: { id: toAccount.id },
        data: { balance: { increment: new Decimal(data.amount) } },
      }),
      prisma.transaction.create({
        data: {
          reference,
          type: 'TRANSFER_SENT',
          status: 'COMPLETED',
          amount: new Decimal(data.amount),
          fee: new Decimal(fee),
          currency: fromAccount.currency,
          description: data.description,
          fromAccountId: fromAccount.id,
          toAccountId: toAccount.id,
        },
      }),
    ])

    // Async notifications (non-blocking)
    Promise.all([
      sendTransferSentEmail(
        fromAccount.user.email,
        fromAccount.user.firstName,
        data.amount,
        fromAccount.currency,
        `${toAccount.user.firstName} ${toAccount.user.lastName}`,
        reference
      ),
      sendTransferReceivedEmail(
        toAccount.user.email,
        toAccount.user.firstName,
        data.amount,
        toAccount.currency,
        `${fromAccount.user.firstName} ${fromAccount.user.lastName}`,
        reference
      ),
    ]).catch((err) => console.error('Notification email error:', err))

    res.status(201).json({
      success: true,
      message: 'Transfer completed successfully',
      transaction: tx,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/transactions/deposit-request (user requests deposit)
const depositSchema = z.object({
  amount: z.number().positive().max(999999999),
  note: z.string().max(500).optional(),
})

transactionRouter.post('/deposit-request', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = depositSchema.parse(req.body)
    const deposit = await prisma.depositRequest.create({
      data: {
        userId: req.user!.userId,
        amount: new Decimal(data.amount),
        note: data.note,
      },
    })
    res.status(201).json({ success: true, deposit })
  } catch (err) {
    next(err)
  }
})

// GET /api/transactions/deposit-requests (my requests)
transactionRouter.get('/my/deposit-requests', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deposits = await prisma.depositRequest.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
    })
    res.json({ success: true, deposits })
  } catch (err) {
    next(err)
  }
})
