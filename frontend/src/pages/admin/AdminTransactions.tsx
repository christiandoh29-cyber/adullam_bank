// src/pages/admin/AdminTransactions.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { formatAmount, formatDateTime, getTransactionColor, getStatusBadge } from '../../lib/utils'

const TX_TYPES = ['ALL', 'DEPOSIT', 'TRANSFER_SENT', 'TRANSFER_RECEIVED', 'FEE']
const TX_STATUSES = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'CANCELLED']

interface Transaction {
  id: string
  reference: string
  type: string
  status: string
  amount: number | string
  fee: number | string
  currency: string
  description?: string
  createdAt: string
  fromAccount?: { user?: { firstName?: string; lastName?: string; email?: string } }
  toAccount?: { user?: { firstName?: string; lastName?: string; email?: string } }
}

export default function AdminTransactions() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('ALL')
  const [status, setStatus] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-transactions', { page, type, status }],
    queryFn: () =>
      adminApi.getTransactions({
        page,
        limit: 20,
        ...(type !== 'ALL' ? { type } : {}),
        ...(status !== 'ALL' ? { status } : {}),
      }).then((r) => r.data),
  })

  const transactions: Transaction[] = data?.transactions ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-white text-2xl font-bold">All Transactions</h1>
          <p className="text-surface-400 text-sm mt-1">Platform-wide transaction history</p>
        </div>
        {pagination && (
          <span className="text-surface-400 text-xs sm:text-sm">{pagination.total} transactions</span>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1) }}
          className="bg-surface-800 border border-theme text-white text-sm rounded-lg px-3 py-1.5 outline-none"
        >
          {TX_TYPES.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace('_', ' ')}</option>)}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="bg-surface-800 border border-theme text-white text-sm rounded-lg px-3 py-1.5 outline-none"
        >
          {TX_STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <div className="w-9 h-9 shimmer-bg rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-2/5 h-3 shimmer-bg rounded" />
                  <div className="w-1/3 h-2.5 shimmer-bg rounded" />
                </div>
                <div className="w-20 h-4 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-surface-400 text-sm">No transactions found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
              const from = tx.fromAccount?.user
              const to = tx.toAccount?.user

              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover-surface transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-accent-green/10' : 'bg-accent-rose/10'}`}>
                    {isCredit
                      ? <ArrowDownLeft size={16} className="text-accent-green" />
                      : <ArrowUpRight size={16} className="text-accent-rose" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-xs sm:text-sm font-medium">{tx.type.replace(/_/g, ' ')}</p>
                      <span className={`badge ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2 text-surface-500 text-xs mt-0.5">
                      <span>{formatDateTime(tx.createdAt)}</span>
                      <div className="flex items-center gap-1 flex-wrap">
                        {from && <><span>{from.firstName} {from.lastName}</span></>}
                        {to && <><span>→ {to.firstName} {to.lastName}</span></>}
                      </div>
                    </div>
                    <p className="text-surface-600 text-xs font-mono truncate">{tx.reference}</p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${getTransactionColor(tx.type)}`}>
                      {formatAmount(Number(tx.amount), tx.currency)}
                    </p>
                    {Number(tx.fee) > 0 && (
                      <p className="text-surface-500 text-xs">fee {formatAmount(Number(tx.fee))}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-theme flex items-center justify-center text-surface-400 hover:text-white disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>
          <span className="text-surface-400 text-sm">Page <span className="text-white">{page}</span> of {pagination.pages}</span>
          <button onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))} disabled={page >= pagination.pages}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-theme flex items-center justify-center text-surface-400 hover:text-white disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
