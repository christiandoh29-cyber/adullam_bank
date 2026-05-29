// src/pages/admin/AdminDashboard.tsx
import { useQuery } from '@tanstack/react-query'
import { Users, ArrowLeftRight, Download, TrendingUp, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { formatAmount, formatRelative, getTransactionColor } from '../../lib/utils'

interface Transaction {
  id: string
  type: string
  amount: number | string
  currency: string
  reference: string
  createdAt: string
  fromAccount?: { user?: { firstName?: string; lastName?: string } }
  toAccount?: { user?: { firstName?: string; lastName?: string } }
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats().then((r) => r.data),
    refetchInterval: 30_000,
  })

  const stats = data?.stats

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers ?? 0, icon: Users, color: 'text-brand-400', bg: 'bg-brand-500/10' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: Users, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    { label: 'Total Transactions', value: stats?.totalTransactions ?? 0, icon: ArrowLeftRight, color: 'text-accent-teal', bg: 'bg-accent-teal/10' },
    { label: 'Pending Deposits', value: stats?.pendingDeposits ?? 0, icon: Download, color: 'text-accent-amber', bg: 'bg-accent-amber/10', urgent: (stats?.pendingDeposits ?? 0) > 0 },
    { label: 'Total Volume', value: formatAmount(Number(stats?.totalVolume ?? 0)), icon: TrendingUp, color: 'text-accent-purple', bg: 'bg-accent-purple/10' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Admin Overview</h1>
        <p className="text-surface-400 text-sm mt-1">Platform statistics and recent activity</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {statCards.map((s) => (
          <div key={s.label} className={`stat-card ${s.urgent ? 'border-accent-amber/30 animate-pulse-glow' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-surface-400 text-xs">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
            <p className="text-white text-xl font-bold">
              {isLoading ? <span className="w-12 h-5 shimmer-bg rounded inline-block" /> : s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent transactions */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-theme flex items-center justify-between">
          <h3 className="text-white font-semibold text-sm">Recent Transactions</h3>
          <a href="/admin/transactions" className="text-brand-400 text-xs hover:text-brand-300 transition-colors">View all →</a>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-9 h-9 shimmer-bg rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-2/3 h-3 shimmer-bg rounded" />
                  <div className="w-1/3 h-2.5 shimmer-bg rounded" />
                </div>
                <div className="w-20 h-4 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {(stats?.recentTransactions ?? []).map((tx: Transaction) => {
              const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover-surface transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-accent-green/10' : 'bg-accent-rose/10'}`}>
                    {isCredit
                      ? <ArrowDownLeft size={16} className="text-accent-green" />
                      : <ArrowUpRight size={16} className="text-accent-rose" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {tx.type.replace(/_/g, ' ')}
                    </p>
                    <p className="text-surface-500 text-xs">{formatRelative(tx.createdAt)}</p>
                  </div>
                  <p className={`text-sm font-bold flex-shrink-0 ${getTransactionColor(tx.type)}`}>
                    {formatAmount(Number(tx.amount), tx.currency)}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
