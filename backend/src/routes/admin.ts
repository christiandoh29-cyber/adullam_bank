// src/routes/admin.ts
import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate, requireAdmin } from '../middleware/auth'
import { generateTransactionReference } from '../lib/banking'
import { sendDepositApprovedEmail } from '../lib/mailer'
import { notifyDepositApproved, notifyDepositRejected } from '../lib/notifications'

export const adminRouter = Router()
adminRouter.use(authenticate, requireAdmin)

// GET /api/admin/stats
adminRouter.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalTransactions,
      pendingDeposits,
      totalVolume,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { accounts: { some: { status: 'ACTIVE' } } } }),
      prisma.transaction.count(),
      prisma.depositRequest.count({ where: { status: 'PENDING' } }),
      prisma.transaction.aggregate({ _sum: { amount: true }, where: { status: 'COMPLETED' } }),
    ])

    const recentTransactions = await prisma.transaction.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        fromAccount: {
          select: {
            iban: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
        toAccount: {
          select: {
            iban: true,
            user: { select: { firstName: true, lastName: true } },
          },
        },
      },
    })

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        totalTransactions,
        pendingDeposits,
        totalVolume: totalVolume._sum.amount ?? 0,
        recentTransactions,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/users
adminRouter.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', search } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const where = search
      ? {
          OR: [
            { email: { contains: search as string, mode: 'insensitive' as const } },
            { firstName: { contains: search as string, mode: 'insensitive' as const } },
            { lastName: { contains: search as string, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true, email: true, firstName: true, lastName: true,
          role: true, isEmailVerified: true, createdAt: true,
          accounts: { select: { id: true, balance: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ])

    res.json({
      success: true,
      users,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/users/:id
adminRouter.get('/users/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        accounts: { include: { cards: true } },
        depositRequests: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    })
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' })
      return
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, twoFactorSecret, ...safeUser } = user
    res.json({ success: true, user: safeUser })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/users/:id/suspend
adminRouter.put('/users/:id/suspend', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.account.updateMany({
      where: { userId: req.params.id },
      data: { status: 'SUSPENDED' },
    })
    res.json({ success: true, message: 'User accounts suspended' })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/users/:id/activate
adminRouter.put('/users/:id/activate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.account.updateMany({
      where: { userId: req.params.id },
      data: { status: 'ACTIVE' },
    })
    res.json({ success: true, message: 'User accounts activated' })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/deposits
adminRouter.get('/deposits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'PENDING', page = '1', limit = '20' } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, parseInt(limit as string))

    const where = status !== 'ALL' ? { status: status as 'PENDING' | 'APPROVED' | 'REJECTED' } : {}

    const [deposits, total] = await Promise.all([
      prisma.depositRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true, firstName: true, lastName: true, email: true,
              accounts: { select: { id: true, balance: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.depositRequest.count({ where }),
    ])

    res.json({
      success: true,
      deposits,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  } catch (err) {
    next(err)
  }
})

const depositActionSchema = z.object({ adminNote: z.string().max(500).optional() })

// POST /api/admin/deposits/:id/approve
adminRouter.post('/deposits/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminNote } = depositActionSchema.parse(req.body)

    const deposit = await prisma.depositRequest.findUnique({
      where: { id: req.params.id },
      include: { user: { include: { accounts: { where: { status: 'ACTIVE' }, take: 1 } } } },
    })
    if (!deposit) {
      res.status(404).json({ success: false, message: 'Deposit request not found' })
      return
    }
    if (deposit.status !== 'PENDING') {
      res.status(409).json({ success: false, message: 'Deposit already processed' })
      return
    }
    const account = deposit.user.accounts[0]
    if (!account) {
      res.status(404).json({ success: false, message: 'User has no active account' })
      return
    }

    const reference = generateTransactionReference()

    await prisma.$transaction([
      prisma.depositRequest.update({
        where: { id: deposit.id },
        data: { status: 'APPROVED', adminNote, processedAt: new Date() },
      }),
      prisma.account.update({
        where: { id: account.id },
        data: { balance: { increment: deposit.amount } },
      }),
      prisma.transaction.create({
        data: {
          reference,
          type: 'DEPOSIT',
          status: 'COMPLETED',
          amount: deposit.amount,
          currency: deposit.currency,
          description: `Deposit approved by admin${adminNote ? ': ' + adminNote : ''}`,
          toAccountId: account.id,
        },
      }),
    ])

    Promise.all([
      sendDepositApprovedEmail(
        deposit.user.email,
        deposit.user.firstName,
        Number(deposit.amount),
        deposit.currency
      ),
      notifyDepositApproved(
        deposit.user.id,
        Number(deposit.amount),
        deposit.currency
      ),
    ]).catch((err) => console.error('Deposit notification error:', err))

    res.json({ success: true, message: 'Deposit approved and funds credited' })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/deposits/:id/reject
adminRouter.post('/deposits/:id/reject', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { adminNote } = depositActionSchema.parse(req.body)

    const deposit = await prisma.depositRequest.findUnique({ where: { id: req.params.id } })
    if (!deposit) {
      res.status(404).json({ success: false, message: 'Deposit request not found' })
      return
    }
    if (deposit.status !== 'PENDING') {
      res.status(409).json({ success: false, message: 'Deposit already processed' })
      return
    }

    await prisma.depositRequest.update({
      where: { id: deposit.id },
      data: { status: 'REJECTED', adminNote, processedAt: new Date() },
    })

    notifyDepositRejected(
      deposit.userId,
      Number(deposit.amount),
      deposit.currency,
      adminNote ?? undefined
    ).catch((err) => console.error('Deposit rejection notification error:', err))

    res.json({ success: true, message: 'Deposit rejected' })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/transactions
adminRouter.get('/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', type, status } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, parseInt(limit as string))

    const where: Record<string, unknown> = {}
    if (type) where.type = type
    if (status) where.status = status

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          fromAccount: {
            select: {
              iban: true,
              accountNumber: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
          toAccount: {
            select: {
              iban: true,
              accountNumber: true,
              user: { select: { id: true, firstName: true, lastName: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
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
