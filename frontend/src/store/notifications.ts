// src/store/notifications.ts
import { create } from 'zustand'
import type { Notification } from '../lib/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isOpen: boolean
  setNotifications: (notifications: Notification[]) => void
  setUnreadCount: (count: number) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  removeNotification: (id: string) => void
  addNotification: (notification: Notification) => void
  setIsOpen: (open: boolean) => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  isOpen: false,
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  markAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, status: 'READ' } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, status: 'READ' })),
      unreadCount: 0,
    })),
  removeNotification: (id) =>
    set((state) => {
      const n = state.notifications.find((n) => n.id === id)
      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: n?.status === 'UNREAD'
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      }
    }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.status === 'UNREAD'
        ? state.unreadCount + 1
        : state.unreadCount,
    })),
  setIsOpen: (isOpen) => set({ isOpen }),
}))
