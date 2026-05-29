// src/pages/admin/AdminDeposits.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { formatAmount, formatDate, getInitials } from '../../lib/utils'

const STATUS_TABS = ['PENDING', 'APPROVED', 'REJECTED', 'ALL']

interface DepositRequest {
  id: string
  amount: number | string
  currency: string
  status: string
  note?: string
  adminNote?: string
  createdAt: string
  processedAt?: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    accounts: { id: string; balance: number | string }[]
  }
}

export default function AdminDeposits() {
  const [status, setStatus] = useState('PENDING')
  const [page, setPage] = useState(1)
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [adminNote, setAdminNote] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deposits', { status, page }],
    queryFn: () => adminApi.getDeposits({ status, page, limit: 15 }).then((r) => r.data),
  })

  const approveMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.approveDeposit(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-deposits'] })
      qc.invalidateQueries({ queryKey: ['admin-stats'] })
      setApprovingId(null)
      setAdminNote('')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) => adminApi.rejectDeposit(id, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-deposits'] })
      setRejectingId(null)
      setAdminNote('')
    },
  })

  const deposits: DepositRequest[] = data?.deposits ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-white text-2xl font-bold">Deposit Requests</h1>
        <p className="text-surface-400 text-sm mt-1">Review and process user deposit requests</p>
      </div>

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              status === s
                ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                : 'bg-surface-800 text-surface-400 border border-theme hover:text-white hover:border-theme'
            }`}
          >
            {s}
            {s === 'PENDING' && (pagination?.total ?? 0) > 0 && status !== 'PENDING' && (
              <span className="ml-1.5 w-4 h-4 rounded-full bg-accent-amber text-black text-xs flex items-center justify-center inline-flex">
                !
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="p-3 space-y-2">
                <div className="w-1/3 h-4 shimmer-bg rounded" />
                <div className="w-1/2 h-3 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        ) : deposits.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="text-surface-600 mx-auto mb-3" size={32} />
            <p className="text-surface-400 text-sm">No {status.toLowerCase()} deposit requests</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {deposits.map((deposit) => (
              <div key={deposit.id} className="p-5">
                <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* User avatar */}
                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                      {getInitials(deposit.user.firstName, deposit.user.lastName)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-white font-semibold text-sm">
                          {deposit.user.firstName} {deposit.user.lastName}
                        </p>
                        <span className={`badge ${
                          deposit.status === 'PENDING' ? 'badge-yellow' :
                          deposit.status === 'APPROVED' ? 'badge-green' : 'badge-red'
                        }`}>
                          {deposit.status}
                        </span>
                      </div>
                      <p className="text-surface-400 text-xs mb-1">{deposit.user.email}</p>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs text-surface-500">
                        <span>Requested: {formatDate(deposit.createdAt)}</span>
                        {deposit.user.accounts?.[0] && (
                          <span>Balance: {formatAmount(Number(deposit.user.accounts[0].balance))}</span>
                        )}
                      </div>
                      {deposit.note && (
                        <p className="mt-2 text-surface-300 text-xs bg-surface-800 rounded-lg px-3 py-2">
                          <span className="text-surface-500">Note: </span>{deposit.note}
                        </p>
                      )}
                      {deposit.adminNote && (
                        <p className="mt-1 text-surface-400 text-xs italic">
                          Admin: "{deposit.adminNote}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right flex-shrink-0">
                    <p className="text-white text-lg sm:text-xl font-bold">{formatAmount(Number(deposit.amount), deposit.currency)}</p>
                  </div>
                </div>

                {/* Actions for PENDING */}
                {deposit.status === 'PENDING' && (
                  <div className="mt-4 sm:ml-14">
                    {/* Admin note input */}
                    {(approvingId === deposit.id || rejectingId === deposit.id) && (
                      <div className="mb-3">
                        <input
                          value={adminNote}
                          onChange={(e) => setAdminNote(e.target.value)}
                          placeholder="Admin note (optional)..."
                          className="input-field text-sm"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      {approvingId === deposit.id ? (
                        <>
                          <button
                            onClick={() => approveMutation.mutate({ id: deposit.id, note: adminNote })}
                            disabled={approveMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-green text-black text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            {approveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                            Confirm
                          </button>
                          <button
                            onClick={() => { setApprovingId(null); setAdminNote('') }}
                            className="px-4 py-2 rounded-xl bg-surface-700 text-surface-300 text-sm hover:bg-surface-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : rejectingId === deposit.id ? (
                        <>
                          <button
                            onClick={() => rejectMutation.mutate({ id: deposit.id, note: adminNote })}
                            disabled={rejectMutation.isPending}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent-rose text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                          >
                            {rejectMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                            Confirm
                          </button>
                          <button
                            onClick={() => { setRejectingId(null); setAdminNote('') }}
                            className="px-4 py-2 rounded-xl bg-surface-700 text-surface-300 text-sm hover:bg-surface-600 transition-colors"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => { setApprovingId(deposit.id); setRejectingId(null); setAdminNote('') }}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-sm font-medium transition-colors"
                          >
                            <CheckCircle size={14} /> Approve
                          </button>
                          <button
                            onClick={() => { setRejectingId(deposit.id); setApprovingId(null); setAdminNote('') }}
                            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-sm font-medium transition-colors"
                          >
                            <XCircle size={14} /> Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
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
