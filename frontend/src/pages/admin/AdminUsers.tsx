// src/pages/admin/AdminUsers.tsx
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, UserCheck, UserX, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { adminApi } from '../../lib/api'
import { formatDate, formatAmount, getInitials } from '../../lib/utils'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  isEmailVerified: boolean
  createdAt: string
  accounts: { id: string; balance: number | string; status: string }[]
}

export default function AdminUsers() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', { page, search }],
    queryFn: () => adminApi.getUsers({ page, limit: 15, search: search || undefined }).then((r) => r.data),
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => adminApi.suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })
  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const users: User[] = data?.users ?? []
  const pagination = data?.pagination

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Users</h1>
          <p className="text-surface-400 text-sm mt-1">Manage platform users</p>
        </div>
        {pagination && (
          <span className="text-surface-400 text-sm">{pagination.total} total users</span>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400" />
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(1) } }}
          placeholder="Search by name or email... (press Enter)"
          className="input-field pl-11 w-full"
        />
      </div>

      <div className="glass-card overflow-hidden">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-2">
                <div className="w-9 h-9 shimmer-bg rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-1/3 h-3 shimmer-bg rounded" />
                  <div className="w-1/2 h-2.5 shimmer-bg rounded" />
                </div>
                <div className="w-24 h-4 shimmer-bg rounded" />
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-surface-400 text-sm">No users found</div>
        ) : (
          <div className="divide-y divide-white/5">
            {users.map((user) => {
              const account = user.accounts?.[0]
              const isSuspended = account?.status === 'SUSPENDED'

              return (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-white/3 transition-colors">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                    user.role === 'ADMIN' ? 'bg-gradient-to-br from-accent-rose to-accent-amber' : 'bg-brand-gradient'
                  }`}>
                    {getInitials(user.firstName, user.lastName)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-white text-sm font-medium truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      {user.role === 'ADMIN' && <span className="badge badge-red text-xs">Admin</span>}
                      {!user.isEmailVerified && <span className="badge badge-yellow text-xs">Unverified</span>}
                      {isSuspended && <span className="badge badge-red text-xs">Suspended</span>}
                    </div>
                    <p className="text-surface-500 text-xs truncate">{user.email}</p>
                  </div>

                  <div className="hidden md:block text-right flex-shrink-0">
                    <p className="text-white text-sm font-medium">
                      {account ? formatAmount(Number(account.balance)) : '—'}
                    </p>
                    <p className="text-surface-500 text-xs">{formatDate(user.createdAt)}</p>
                  </div>

                  {user.role !== 'ADMIN' && (
                    <div className="flex-shrink-0">
                      {isSuspended ? (
                        <button
                          onClick={() => activateMutation.mutate(user.id)}
                          disabled={activateMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-green/10 hover:bg-accent-green/20 text-accent-green text-xs font-medium transition-colors"
                        >
                          {activateMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={13} />}
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendMutation.mutate(user.id)}
                          disabled={suspendMutation.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-rose/10 hover:bg-accent-rose/20 text-accent-rose text-xs font-medium transition-colors"
                        >
                          {suspendMutation.isPending ? <Loader2 size={12} className="animate-spin" /> : <UserX size={13} />}
                          Suspend
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

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
