// src/routes/notification.ts
import { Router, Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { authenticate } from '../middleware/auth'

export const notificationRouter = Router()
notificationRouter.use(authenticate)

notificationRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '20', unreadOnly } = req.query
    const pageNum = Math.max(1, parseInt(page as string))
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)))

    const where: Record<string, unknown> = { userId: req.user!.userId }
    if (unreadOnly === 'true') where.status = 'UNREAD'

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user!.userId, status: 'UNREAD' } }),
    ])

    res.json({
      success: true,
      notifications,
      unreadCount,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    })
  } catch (err) {
    next(err)
  }
})

notificationRouter.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' })
      return
    }
    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'READ' },
    })
    res.json({ success: true, notification: updated })
  } catch (err) {
    next(err)
  }
})

notificationRouter.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, status: 'UNREAD' },
      data: { status: 'READ' },
    })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

notificationRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const notification = await prisma.notification.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    })
    if (!notification) {
      res.status(404).json({ success: false, message: 'Notification not found' })
      return
    }
    await prisma.notification.delete({ where: { id: notification.id } })
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
})

notificationRouter.get('/unread-count', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user!.userId, status: 'UNREAD' },
    })
    res.json({ success: true, count })
  } catch (err) {
    next(err)
  }
})
