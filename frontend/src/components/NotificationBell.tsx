// src/components/NotificationBell.tsx
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck, X, ArrowDownLeft, ArrowUpRight, CreditCard, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import { notificationApi } from '../lib/api'
import { useNotificationStore } from '../store/notifications'
import { formatRelative } from '../lib/utils'

const notificationIcons: Record<string, React.ReactNode> = {
  TRANSFER_RECEIVED: <ArrowDownLeft size={16} className="text-accent-green" />,
  TRANSFER_SENT: <ArrowUpRight size={16} className="text-accent-rose" />,
  DEPOSIT_APPROVED: <CheckCircle size={16} className="text-accent-green" />,
  DEPOSIT_REJECTED: <XCircle size={16} className="text-accent-rose" />,
  CARD_CREATED: <CreditCard size={16} className="text-brand-400" />,
  CARD_BLOCKED: <CreditCard size={16} className="text-accent-amber" />,
  ACCOUNT_SUSPENDED: <ShieldAlert size={16} className="text-accent-rose" />,
  ACCOUNT_ACTIVATED: <CheckCircle size={16} className="text-accent-green" />,
  SECURITY_ALERT: <ShieldAlert size={16} className="text-accent-amber" />,
}

const notificationColors: Record<string, string> = {
  TRANSFER_RECEIVED: 'border-l-accent-green',
  TRANSFER_SENT: 'border-l-accent-rose',
  DEPOSIT_APPROVED: 'border-l-accent-green',
  DEPOSIT_REJECTED: 'border-l-accent-rose',
  CARD_CREATED: 'border-l-brand-400',
  CARD_BLOCKED: 'border-l-accent-amber',
  ACCOUNT_SUSPENDED: 'border-l-accent-rose',
  ACCOUNT_ACTIVATED: 'border-l-accent-green',
  SECURITY_ALERT: 'border-l-accent-amber',
}

export default function NotificationBell() {
  const {
    notifications, unreadCount, isOpen, setIsOpen,
    setNotifications, setUnreadCount, markAsRead, markAllAsRead, removeNotification
  } = useNotificationStore()
  const bellRef = useRef<HTMLButtonElement>(null)
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll({ limit: 20 }).then((r) => r.data),
    enabled: isOpen,
    staleTime: 30_000,
  })

  useEffect(() => {
    if (data) {
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    }
  }, [data])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: (_, id) => markAsRead(id),
  })

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      markAllAsRead()
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationApi.delete(id),
    onSuccess: (_, id) => removeNotification(id),
  })

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <button
        ref={bellRef}
        id="notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-9 h-9 rounded-xl bg-surface-800 border border-theme flex items-center justify-center text-surface-400 hover:text-white transition-colors"
      >
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-accent-rose text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-fade-in">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-end p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false)
          }}
        >
          <div className="relative w-96 max-h-[calc(100vh-8rem)] bg-surface-900 border border-theme rounded-2xl shadow-2xl animate-scale-up overflow-hidden flex flex-col mt-14">
            <div className="flex items-center justify-between p-4 border-b border-theme shrink-0">
              <h3 className="text-white font-semibold text-sm">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllReadMutation.mutate()}
                    className="text-brand-400 hover:text-brand-300 text-xs flex items-center gap-1 transition-colors"
                  >
                    <CheckCheck size={14} />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-surface-400 hover:text-white transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <div className="p-4 space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-lg shimmer-bg flex-shrink-0" />
                      <div className="flex-1 space-y-1.5">
                        <div className="w-3/4 h-3 shimmer-bg rounded" />
                        <div className="w-full h-2.5 shimmer-bg rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={32} className="text-surface-600 mx-auto mb-3" />
                  <p className="text-surface-400 text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-4 hover:bg-surface-800 transition-colors border-l-2 ${notificationColors[n.type] ?? 'border-l-surface-600'} ${n.status === 'UNREAD' ? 'bg-brand-500/5' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                          {notificationIcons[n.type] ?? <Bell size={16} className="text-surface-400" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-white text-xs font-semibold truncate">{n.title}</p>
                            {n.status === 'UNREAD' && (
                              <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-surface-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-surface-600 text-[10px]">{formatRelative(n.createdAt)}</span>
                            <div className="flex items-center gap-2">
                              {n.status === 'UNREAD' && (
                                <button
                                  onClick={() => markReadMutation.mutate(n.id)}
                                  className="text-brand-400 hover:text-brand-300 text-[10px] transition-colors"
                                >
                                  Mark read
                                </button>
                              )}
                              <button
                                onClick={() => deleteMutation.mutate(n.id)}
                                className="text-surface-600 hover:text-accent-rose text-[10px] transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-3 border-t border-theme text-center shrink-0">
                <p className="text-surface-500 text-[11px]">{notifications.length} notifications shown</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}