// src/lib/ai/tools.ts
import { prisma } from '../prisma'

export interface ToolResult {
  success: boolean
  data?: unknown
  error?: string
}

export class AgentTools {
  private userId: string

  constructor(userId: string) {
    this.userId = userId
  }

  async getUserProfile(): Promise<ToolResult> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: this.userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          createdAt: true,
        },
      })
      return { success: true, data: user }
    } catch {
      return { success: false, error: 'Failed to fetch user profile' }
    }
  }

  async getAccounts(): Promise<ToolResult> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: this.userId },
        select: {
          id: true,
          accountNumber: true,
          iban: true,
          balance: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      })
      return { success: true, data: accounts }
    } catch {
      return { success: false, error: 'Failed to fetch accounts' }
    }
  }

  async getAccountBalances(): Promise<ToolResult> {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId: this.userId },
        select: { id: true, accountNumber: true, balance: true, currency: true },
      })
      const total = accounts.reduce((sum, a) => sum + Number(a.balance), 0)
      return {
        success: true,
        data: {
          accounts,
          totalBalance: total,
          currency: accounts[0]?.currency || 'EUR',
        },
      }
    } catch {
      return { success: false, error: 'Failed to fetch balances' }
    }
  }

  async getTransactions(params: {
    limit?: number
    type?: string
    dateFrom?: string
    dateTo?: string
  }): Promise<ToolResult> {
    try {
      const accountIds = (
        await prisma.account.findMany({
          where: { userId: this.userId },
          select: { id: true },
        })
      ).map((a) => a.id)

      const where: Record<string, unknown> = {
        OR: [
          { fromAccountId: { in: accountIds } },
          { toAccountId: { in: accountIds } },
        ],
      }

      if (params.type) where.type = params.type
      if (params.dateFrom || params.dateTo) {
        where.createdAt = {
          ...(params.dateFrom ? { gte: new Date(params.dateFrom) } : {}),
          ...(params.dateTo ? { lte: new Date(params.dateTo) } : {}),
        }
      }

      const transactions = await prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: params.limit || 50,
        include: {
          fromAccount: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
          toAccount: {
            select: {
              user: { select: { firstName: true, lastName: true } },
            },
          },
        },
      })

      return { success: true, data: transactions }
    } catch {
      return { success: false, error: 'Failed to fetch transactions' }
    }
  }

  async getTransactionStats(params: {
    period?: string
  }): Promise<ToolResult> {
    try {
      const accountIds = (
        await prisma.account.findMany({
          where: { userId: this.userId },
          select: { id: true },
        })
      ).map((a) => a.id)

      let dateFrom = new Date()
      if (params.period === 'month') {
        dateFrom = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), 1)
      } else if (params.period === 'year') {
        dateFrom = new Date(dateFrom.getFullYear(), 0, 1)
      } else {
        dateFrom = new Date(dateFrom.getFullYear(), dateFrom.getMonth() - 1, 1)
      }

      const [sent, received, pending] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            fromAccountId: { in: accountIds },
            status: 'COMPLETED',
            createdAt: { gte: dateFrom },
          },
          _sum: { amount: true },
          _count: true,
          _avg: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            toAccountId: { in: accountIds },
            status: 'COMPLETED',
            createdAt: { gte: dateFrom },
          },
          _sum: { amount: true },
          _count: true,
          _avg: { amount: true },
        }),
        prisma.transaction.count({
          where: {
            OR: [
              { fromAccountId: { in: accountIds } },
              { toAccountId: { in: accountIds } },
            ],
            status: 'PENDING',
          },
        }),
      ])

      return {
        success: true,
        data: {
          period: params.period || '30days',
          dateFrom: dateFrom.toISOString(),
          sent: {
            total: Number(sent._sum.amount ?? 0),
            count: sent._count,
            average: (sent._avg as { amount: number | null } | null)?.amount ?? 0,
          },
          received: {
            total: Number(received._sum.amount ?? 0),
            count: received._count,
            average: (received._avg as { amount: number | null } | null)?.amount ?? 0,
          },
          pendingCount: pending,
          netFlow: Number(sent._sum.amount ?? 0) - Number(received._sum.amount ?? 0),
        },
      }
    } catch {
      return { success: false, error: 'Failed to fetch transaction stats' }
    }
  }

  async getCards(): Promise<ToolResult> {
    try {
      const cards = await prisma.card.findMany({
        where: {
          account: { userId: this.userId },
        },
        select: {
          id: true,
          cardNumber: true,
          cardHolder: true,
          expiryMonth: true,
          expiryYear: true,
          network: true,
          status: true,
          dailyLimit: true,
          monthlyLimit: true,
          createdAt: true,
        },
      })
      return { success: true, data: cards }
    } catch {
      return { success: false, error: 'Failed to fetch cards' }
    }
  }

  async getNotifications(params: {
    limit?: number
    unreadOnly?: boolean
  }): Promise<ToolResult> {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          userId: this.userId,
          ...(params.unreadOnly ? { status: 'UNREAD' } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: params.limit || 20,
      })
      return { success: true, data: notifications }
    } catch {
      return { success: false, error: 'Failed to fetch notifications' }
    }
  }

  async getDepositRequests(): Promise<ToolResult> {
    try {
      const deposits = await prisma.depositRequest.findMany({
        where: { userId: this.userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
      return { success: true, data: deposits }
    } catch {
      return { success: false, error: 'Failed to fetch deposit requests' }
    }
  }

  async getMonthlyBreakdown(months: number = 6): Promise<ToolResult> {
    try {
      const accountIds = (
        await prisma.account.findMany({
          where: { userId: this.userId },
          select: { id: true },
        })
      ).map((a) => a.id)

      const now = new Date()
      const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

      const transactions = await prisma.transaction.findMany({
        where: {
          OR: [
            { fromAccountId: { in: accountIds } },
            { toAccountId: { in: accountIds } },
          ],
          status: 'COMPLETED',
          createdAt: { gte: startDate },
        },
        orderBy: { createdAt: 'asc' },
      })

      const monthlyData: Record<string, {
        income: number
        expenses: number
        net: number
        transactionCount: number
      }> = {}

      for (const tx of transactions) {
        const monthKey = tx.createdAt.toISOString().slice(0, 7)
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { income: 0, expenses: 0, net: 0, transactionCount: 0 }
        }

        const isOutgoing = tx.fromAccountId && accountIds.includes(tx.fromAccountId)
        if (isOutgoing) {
          monthlyData[monthKey].expenses += Number(tx.amount) + Number(tx.fee)
        } else {
          monthlyData[monthKey].income += Number(tx.amount)
        }
        monthlyData[monthKey].net += isOutgoing ? -(Number(tx.amount) + Number(tx.fee)) : Number(tx.amount)
        monthlyData[monthKey].transactionCount++
      }

      return { success: true, data: monthlyData }
    } catch {
      return { success: false, error: 'Failed to compute monthly breakdown' }
    }
  }
}