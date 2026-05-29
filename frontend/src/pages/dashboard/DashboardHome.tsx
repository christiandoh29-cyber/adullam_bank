// src/pages/dashboard/DashboardHome.tsx
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight, ArrowDownLeft, CreditCard, Download,
  ArrowLeftRight, TrendingUp, Clock, Wallet
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { accountApi, transactionApi } from '../../lib/api'
import { useAuthStore } from '../../store/auth'
import {
  formatAmount, formatRelative, getTransactionColor,
  getStatusBadge
} from '../../lib/utils'

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { value: number; payload?: { change?: number } }[]; label?: string }) => {
  if (active && payload && payload.length) {
    const change = payload[0].payload?.change
    return (
      <div className="bg-surface-800 border border-theme rounded-xl p-3 text-sm shadow-lg">
        <p className="text-surface-400 text-xs mb-1">{label}</p>
        <p className="text-white font-semibold">{formatAmount(payload[0].value)}</p>
        {change !== undefined && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-accent-green' : 'text-accent-rose'}`}>
            {change >= 0 ? '+' : ''}{formatAmount(change)}
          </p>
        )}
      </div>
    )
  }
  return null
}

export default function DashboardHome() {
  const { user } = useAuthStore()

  const { data: accountsData, isLoading: loadingAccounts } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountApi.getAll().then((r) => r.data),
  })

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['transactions', { limit: 5 }],
    queryFn: () => transactionApi.getAll({ limit: 5 }).then((r) => r.data),
  })

  const { data: statsData } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => transactionApi.getStats().then((r) => r.data),
  })

  const { data: balanceHistoryData } = useQuery({
    queryKey: ['balance-history'],
    queryFn: () => transactionApi.getBalanceHistory().then((r) => r.data),
  })

  const account = accountsData?.accounts?.[0]
  const balance = Number(account?.balance ?? 0)
  const chartData = balanceHistoryData?.history ?? []
  const stats = statsData?.stats

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-white text-2xl font-bold">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-transparent bg-clip-text bg-brand-gradient">{user?.firstName}</span> 👋
        </h1>
        <p className="text-surface-400 text-sm mt-1">Here's what's happening with your account</p>
      </div>

      {/* Balance + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        {/* Balance card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-accent-purple p-4 sm:p-6 shadow-brand animate-pulse-glow">
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/5 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-64 h-32 rounded-full bg-black/10 blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-white/70 text-sm font-medium">Total Balance</p>
                {loadingAccounts ? (
                  <div className="w-40 h-10 shimmer-bg rounded-lg mt-1" />
                ) : (
                  <p className="text-white text-2xl sm:text-4xl font-bold mt-1 tracking-tight">
                    {formatAmount(balance)}
                  </p>
                )}
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                <Wallet className="text-white" size={22} />
              </div>
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span>Account Active</span>
              {account && (
                <span className="ml-auto text-white/50 text-xs font-mono">
                  ••{account.accountNumber?.slice(-4)}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Transfer', icon: ArrowLeftRight, to: '/dashboard/transfer', color: 'from-brand-600 to-brand-500' },
            { label: 'Deposit', icon: Download, to: '/dashboard/deposit', color: 'from-accent-teal/80 to-accent-teal' },
            { label: 'Cards', icon: CreditCard, to: '/dashboard/cards', color: 'from-surface-700 to-surface-600' },
            { label: 'My RIB', icon: Wallet, to: '/dashboard/rib', color: 'from-surface-700 to-surface-600' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.to}
              className={`glass-card flex flex-col items-center justify-center gap-2 p-4 hover:scale-[1.02] transition-all cursor-pointer group`}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:shadow-brand-sm transition-shadow`}>
                <action.icon size={18} className="text-white" />
              </div>
              <span className="text-surface-300 text-xs font-medium group-hover:text-white transition-colors">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Sent this month',
            value: formatAmount(Number(stats?.thisMonth?.sent ?? 0)),
            icon: ArrowUpRight,
            color: 'text-accent-rose',
            bg: 'bg-accent-rose/10',
          },
          {
            label: 'Received this month',
            value: formatAmount(Number(stats?.thisMonth?.received ?? 0)),
            icon: ArrowDownLeft,
            color: 'text-accent-green',
            bg: 'bg-accent-green/10',
          },
          {
            label: 'Transactions sent',
            value: stats?.thisMonth?.sentCount ?? 0,
            icon: TrendingUp,
            color: 'text-brand-400',
            bg: 'bg-brand-500/10',
          },
          {
            label: 'Pending',
            value: stats?.pending ?? 0,
            icon: Clock,
            color: 'text-accent-amber',
            bg: 'bg-accent-amber/10',
          },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="flex items-center justify-between">
              <span className="text-surface-400 text-xs font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon size={16} className={s.color} />
              </div>
            </div>
            <p className="text-white text-xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart + Recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Balance chart */}
        <div className="lg:col-span-3 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-white font-semibold text-sm">Balance Evolution</h3>
              <p className="text-surface-400 text-xs">Last 6 months</p>
            </div>
            <span className="badge-purple">EUR</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C3CE1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C3CE1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="month" stroke="#555578" tick={{ fontSize: 11, fill: '#7a7a9b' }} />
              <YAxis stroke="#555578" tick={{ fontSize: 11, fill: '#7a7a9b' }} tickFormatter={(v) => `€${v}`} domain={['auto', 'auto']} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="balance" stroke="#6C3CE1" strokeWidth={2} fill="url(#balanceGrad)" dot={false} activeDot={{ r: 5, fill: '#A855F7' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent transactions */}
        <div className="lg:col-span-2 glass-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold text-sm">Recent Activity</h3>
            <Link to="/dashboard/transactions" className="text-brand-400 hover:text-brand-300 text-xs transition-colors">
              View all →
            </Link>
          </div>

          {loadingTx ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl shimmer-bg flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="w-3/4 h-3 shimmer-bg rounded" />
                    <div className="w-1/2 h-2.5 shimmer-bg rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : txData?.transactions?.length === 0 ? (
            <div className="text-center py-8 text-surface-500 text-sm">No transactions yet</div>
          ) : (
            <div className="space-y-3">
              {txData?.transactions?.slice(0, 5).map((tx: {
                id: string; type: string; amount: number | string; currency: string;
                description?: string; createdAt: string; status: string;
                fromAccount?: { user?: { firstName?: string; lastName?: string } };
                toAccount?: { user?: { firstName?: string; lastName?: string } };
              }) => (
                <div key={tx.id} className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
                      ? 'bg-accent-green/10'
                      : 'bg-accent-rose/10'
                  }`}>
                    {tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
                      ? <ArrowDownLeft size={16} className="text-accent-green" />
                      : <ArrowUpRight size={16} className="text-accent-rose" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {tx.description || tx.type.replace('_', ' ')}
                    </p>
                    <p className="text-surface-500 text-xs">{formatRelative(tx.createdAt)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-xs font-semibold ${getTransactionColor(tx.type)}`}>
                      {tx.type === 'TRANSFER_SENT' ? '-' : '+'}
                      {formatAmount(Number(tx.amount), tx.currency)}
                    </p>
                    <span className={`text-xs ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
