// src/pages/dashboard/TransactionsPage.tsx
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpRight, ArrowDownLeft, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { transactionApi } from '../../lib/api'
import {
  formatAmount, formatDateTime, getTransactionColor,
  getStatusBadge, getTransactionSign
} from '../../lib/utils'

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
  fromAccountId?: string
  toAccountId?: string
  fromAccount?: { user?: { firstName?: string; lastName?: string } }
  toAccount?: { user?: { firstName?: string; lastName?: string } }
}

export default function TransactionsPage() {
  const [page, setPage] = useState(1)
  const [type, setType] = useState('ALL')
  const [status, setStatus] = useState('ALL')

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', { page, type, status }],
    queryFn: () =>
      transactionApi.getAll({
        page,
        limit: 15,
        ...(type !== 'ALL' ? { type } : {}),
        ...(status !== 'ALL' ? { status } : {}),
      }).then((r) => r.data),
  })

  const transactions: Transaction[] = data?.transactions ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5 max-w-5xl mx-auto animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Transactions</h1>
        <p className="text-surface-400 text-sm mt-1">Your complete transaction history</p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-2 text-surface-400">
          <Filter size={16} />
          <span className="text-sm font-medium text-surface-300">Filter</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={type}
            onChange={(e) => { setType(e.target.value); setPage(1) }}
            className="bg-surface-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-brand-500/50"
          >
            {TX_TYPES.map((t) => <option key={t} value={t}>{t === 'ALL' ? 'All Types' : t.replace('_', ' ')}</option>)}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="bg-surface-800 border border-white/10 text-white text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-brand-500/50"
          >
            {TX_STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s}</option>)}
          </select>
        </div>

        {pagination && (
          <span className="ml-auto text-surface-400 text-xs">
            {pagination.total} transactions
          </span>
        )}
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-3">
                <div className="w-10 h-10 shimmer-bg rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="w-1/3 h-3 shimmer-bg rounded" />
                  <div className="w-1/4 h-2.5 shimmer-bg rounded" />
                </div>
                <div className="w-20 h-4 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center">
            <Search className="text-surface-600 mx-auto mb-3" size={36} />
            <p className="text-surface-400 text-sm">No transactions found</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const isCredit = tx.type === 'DEPOSIT' || tx.type === 'TRANSFER_RECEIVED'
              const counterparty = isCredit
                ? tx.fromAccount?.user
                : tx.toAccount?.user

              return (
                <div key={tx.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCredit ? 'bg-accent-green/10' : 'bg-accent-rose/10'}`}>
                    {isCredit
                      ? <ArrowDownLeft size={18} className="text-accent-green" />
                      : <ArrowUpRight size={18} className="text-accent-rose" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-white text-sm font-medium truncate">
                        {tx.description || tx.type.replace(/_/g, ' ')}
                      </p>
                      <span className={`badge text-xs ${getStatusBadge(tx.status)}`}>{tx.status}</span>
                    </div>
                    <div className="flex items-center gap-2 text-surface-500 text-xs">
                      <span>{formatDateTime(tx.createdAt)}</span>
                      {counterparty && (
                        <>
                          <span>·</span>
                          <span>{counterparty.firstName} {counterparty.lastName}</span>
                        </>
                      )}
                      <span>·</span>
                      <span className="font-mono">{tx.reference}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className={`text-sm font-bold ${getTransactionColor(tx.type)}`}>
                      {isCredit ? '+' : '-'}{formatAmount(Number(tx.amount), tx.currency)}
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

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center text-surface-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-surface-400 text-sm">
            Page <span className="text-white font-medium">{page}</span> of {pagination.pages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
            disabled={page >= pagination.pages}
            className="w-9 h-9 rounded-xl bg-surface-800 border border-white/10 flex items-center justify-center text-surface-400 hover:text-white disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
