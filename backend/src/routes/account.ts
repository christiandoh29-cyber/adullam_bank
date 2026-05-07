// src/routes/account.ts
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { generateBankingInfo, generateCardNumber, generateCVV, generateCardExpiry } from '../lib/banking'

export const accountRouter = Router()
accountRouter.use(authenticate)

// GET /api/accounts — my accounts
accountRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      include: {
        cards: { select: { id: true, network: true, status: true, expiryMonth: true, expiryYear: true } },
        _count: { select: { sentTransactions: true, receivedTransactions: true } },
      },
    })
    res.json({ success: true, accounts })
  } catch (err) {
    next(err)
  }
})

// GET /api/accounts/rib — my RIB
accountRouter.get('/rib', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await prisma.account.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' },
      include: { user: { select: { firstName: true, lastName: true } } },
    })
    if (!account) {
      res.status(404).json({ success: false, message: 'No active account found' })
      return
    }
    res.json({
      success: true,
      rib: {
        bankCode: account.bankCode,
        branchCode: account.branchCode,
        accountNumber: account.accountNumber,
        ribKey: account.ribKey,
        iban: account.iban,
        accountHolder: `${account.user.firstName} ${account.user.lastName}`,
        bic: 'ADULFRPP',
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/accounts/:id — specific account
accountRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await prisma.account.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        cards: true,
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    })
    if (!account) {
      res.status(404).json({ success: false, message: 'Account not found' })
      return
    }
    res.json({ success: true, account })
  } catch (err) {
    next(err)
  }
})

// POST /api/accounts/create — create additional account (idempotent: only one per user)
accountRouter.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const existing = await prisma.account.findFirst({ where: { userId: req.user!.userId } })
    if (existing) {
      res.status(409).json({ success: false, message: 'You already have an account. Contact support for additional accounts.' })
      return
    }
    const banking = generateBankingInfo()
    const expiry = generateCardExpiry()
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } })

    const account = await prisma.account.create({
      data: {
        userId: req.user!.userId,
        ...banking,
        cards: {
          create: {
            cardNumber: generateCardNumber('4539'),
            cardHolder: `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`,
            expiryMonth: expiry.month,
            expiryYear: expiry.year,
            cvv: generateCVV(),
            network: 'VISA',
          },
        },
      },
      include: { cards: true },
    })
    res.status(201).json({ success: true, account })
  } catch (err) {
    next(err)
  }
})
