import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Empêcher les boucles infinies de refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (value?: unknown) => void
  reject: (reason?: unknown) => void
}> = []

const processQueue = (error: unknown) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Response interceptor — handle 401 by redirecting to login
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Si c'est une requête de refresh qui échoue, ne pas réessayer
    if (original.url === '/auth/refresh-token') {
      localStorage.clear()
      return Promise.reject(error)
    }

    // Si 401 et pas déjà retenté
    if (error.response?.status === 401 && !original._retry) {
      // Si un refresh est déjà en cours, mettre en file d'attente
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then(() => api(original))
          .catch(() => Promise.reject(error))
      }

      original._retry = true
      isRefreshing = true

      try {
        await api.post('/auth/refresh-token')
        processQueue(null)
        return api(original)
      } catch {
        processQueue(error)
        localStorage.clear()
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

// Auth
export const authApi = {
  register: (data: RegisterInput) => api.post('/auth/register', data),
  login: (data: LoginInput) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, data: ResetPasswordInput) => api.post(`/auth/reset-password/${token}`, data),
  verifyEmail: (token: string) => api.get(`/auth/verify-email/${token}`),
}

// Accounts
export const accountApi = {
  getAll: () => api.get('/accounts'),
  getById: (id: string) => api.get(`/accounts/${id}`),
  getRib: () => api.get('/accounts/rib'),
  create: () => api.post('/accounts/create'),
}

// Cards
export const cardApi = {
  getAll: () => api.get('/cards'),
  create: () => api.post('/cards/create'),
  getDetails: (id: string) => api.get(`/cards/${id}/details`),
  block: (id: string) => api.put(`/cards/${id}/block`),
  unblock: (id: string) => api.put(`/cards/${id}/unblock`),
  setLimits: (id: string, limits: { dailyLimit?: number; monthlyLimit?: number }) =>
    api.put(`/cards/${id}/limits`, limits),
}

// Transactions
export const transactionApi = {
  getAll: (params?: Record<string, unknown>) => api.get('/transactions', { params }),
  getById: (id: string) => api.get(`/transactions/${id}`),
  getStats: () => api.get('/transactions/stats'),
  transfer: (data: TransferInput) => api.post('/transactions/transfer', data),
  requestDeposit: (data: { amount: number; note?: string }) =>
    api.post('/transactions/deposit-request', data),
  getMyDepositRequests: () => api.get('/transactions/my/deposit-requests'),
  getBalanceHistory: () => api.get('/transactions/balance-history'),
}

// Admin
export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  getUserById: (id: string) => api.get(`/admin/users/${id}`),
  suspendUser: (id: string) => api.put(`/admin/users/${id}/suspend`),
  activateUser: (id: string) => api.put(`/admin/users/${id}/activate`),
  getDeposits: (params?: Record<string, unknown>) => api.get('/admin/deposits', { params }),
  approveDeposit: (id: string, adminNote?: string) =>
    api.post(`/admin/deposits/${id}/approve`, { adminNote }),
  rejectDeposit: (id: string, adminNote?: string) =>
    api.post(`/admin/deposits/${id}/reject`, { adminNote }),
  getTransactions: (params?: Record<string, unknown>) =>
    api.get('/admin/transactions', { params }),
}

// Users
export const userApi = {
  updateProfile: (data: Partial<{ firstName: string; lastName: string; phone: string }>) =>
    api.put('/users/profile', data),
  updatePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/password', data),
  uploadProfilePicture: async (file: File) => {
    const formData = new FormData()
    formData.append('picture', file)
    const res = await api.post<{ success: boolean; profilePicture: string }>(
      '/users/profile-picture',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    return res
  },
  deleteProfilePicture: () =>
    api.delete('/users/profile-picture'),
}

// Notifications
export interface Notification {
  id: string
  type: string
  title: string
  message: string
  status: 'UNREAD' | 'READ'
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface NotificationsResponse {
  success: boolean
  notifications: Notification[]
  unreadCount: number
  pagination: { page: number; limit: number; total: number; pages: number }
}

export const notificationApi = {
  getAll: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get<NotificationsResponse>('/notifications', { params }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get<{ success: boolean; count: number }>('/notifications/unread-count'),
}

// Types
export interface RegisterInput {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
}

export interface LoginInput {
  email: string
  password: string
  totpCode?: string
}

export interface ResetPasswordInput {
  password: string
  confirmPassword: string
}

export interface TransferInput {
  toIban: string
  amount: number
  description?: string
}

// AI Agents
export interface AgentChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

export interface AgentStreamChunk {
  type: 'chunk' | 'done' | 'error'
  content?: string
  agent?: string
  message?: string
}

export const agentApi = {
  chatStream: async (
    message: string,
    agent: 'accountant' | 'account-manager' = 'accountant',
    onChunk: (text: string) => void,
    onDone: () => void,
    onError: (err: Error) => void
  ): Promise<void> => {
    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message, agent }),
      })

      if (!response.body) {
        onError(new Error('No response body'))
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'chunk' && data.content) {
                onChunk(data.content)
              } else if (data.type === 'done') {
                onDone()
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }
    } catch (err) {
      onError(err instanceof Error ? err : new Error('Request failed'))
    }
  },

  getFinancialReport: (params: { period?: 'month' | 'quarter' | 'year'; includeTransactions?: boolean }) =>
    api.post('/agents/accountant/report', params),

  getAccountGuidance: () =>
    api.get('/agents/account-manager/guidance'),

  getCardGuidance: () =>
    api.get('/agents/account-manager/card-guidance'),

  getModels: () =>
    api.get('/agents/models'),
}
