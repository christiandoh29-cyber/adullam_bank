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
      // Nettoyer et rediriger
      localStorage.clear()
      window.location.href = '/auth/login'
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
        // Rediriger vers login après échec du refresh
        localStorage.clear()
        window.location.href = '/auth/login'
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
