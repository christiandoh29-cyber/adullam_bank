// src/routes/card.ts
import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'
import { generateCardNumber, generateCVV, generateCardExpiry } from '../lib/banking'

export const cardRouter = Router()
cardRouter.use(authenticate)

// GET /api/cards
cardRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const accounts = await prisma.account.findMany({
      where: { userId: req.user!.userId },
      select: { id: true },
    })
    const accountIds = accounts.map((a) => a.id)
    const cards = await prisma.card.findMany({
      where: { accountId: { in: accountIds } },
      include: { account: { select: { balance: true, currency: true } } },
    })
    res.json({ success: true, cards })
  } catch (err) {
    next(err)
  }
})

// POST /api/cards/create
cardRouter.post('/create', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const account = await prisma.account.findFirst({
      where: { userId: req.user!.userId, status: 'ACTIVE' },
    })
    if (!account) {
      res.status(404).json({ success: false, message: 'No active account found' })
      return
    }

    // Max 3 cards per account
    const cardCount = await prisma.card.count({ where: { accountId: account.id } })
    if (cardCount >= 3) {
      res.status(409).json({ success: false, message: 'Maximum 3 cards per account' })
      return
    }

    const expiry = generateCardExpiry()
    const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.userId } })

    const card = await prisma.card.create({
      data: {
        accountId: account.id,
        cardNumber: generateCardNumber('5425'), // Mastercard BIN
        cardHolder: `${user.firstName.toUpperCase()} ${user.lastName.toUpperCase()}`,
        expiryMonth: expiry.month,
        expiryYear: expiry.year,
        cvv: generateCVV(),
        network: 'MASTERCARD',
      },
    })
    res.status(201).json({ success: true, card })
  } catch (err) {
    next(err)
  }
})

// GET /api/cards/:id/details — full card with CVV
cardRouter.get('/:id/details', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
        account: { userId: req.user!.userId },
      },
    })
    if (!card) {
      res.status(404).json({ success: false, message: 'Card not found' })
      return
    }
    res.json({ success: true, card })
  } catch (err) {
    next(err)
  }
})

// PUT /api/cards/:id/block
cardRouter.put('/:id/block', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, account: { userId: req.user!.userId } },
    })
    if (!card) {
      res.status(404).json({ success: false, message: 'Card not found' })
      return
    }
    if (card.status === 'BLOCKED') {
      res.status(409).json({ success: false, message: 'Card is already blocked' })
      return
    }
    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: { status: 'BLOCKED' },
    })
    res.json({ success: true, card: updated })
  } catch (err) {
    next(err)
  }
})

// PUT /api/cards/:id/unblock
cardRouter.put('/:id/unblock', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, account: { userId: req.user!.userId } },
    })
    if (!card) {
      res.status(404).json({ success: false, message: 'Card not found' })
      return
    }
    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data: { status: 'ACTIVE' },
    })
    res.json({ success: true, card: updated })
  } catch (err) {
    next(err)
  }
})

// PUT /api/cards/:id/limits
const limitsSchema = z.object({
  dailyLimit: z.number().min(0).max(10000).optional(),
  monthlyLimit: z.number().min(0).max(50000).optional(),
})

cardRouter.put('/:id/limits', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = limitsSchema.parse(req.body)
    const card = await prisma.card.findFirst({
      where: { id: req.params.id, account: { userId: req.user!.userId } },
    })
    if (!card) {
      res.status(404).json({ success: false, message: 'Card not found' })
      return
    }
    const updated = await prisma.card.update({
      where: { id: req.params.id },
      data,
    })
    res.json({ success: true, card: updated })
  } catch (err) {
    next(err)
  }
})
