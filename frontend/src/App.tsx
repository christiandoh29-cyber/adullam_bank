// src/App.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/auth'
import { authApi } from './lib/api'

// Layouts
import DashboardLayout from './components/layout/DashboardLayout'
import AuthLayout from './components/layout/AuthLayout'

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

// Dashboard pages
import DashboardHome from './pages/dashboard/DashboardHome'
import CardsPage from './pages/dashboard/CardsPage'
import TransactionsPage from './pages/dashboard/TransactionsPage'
import TransferPage from './pages/dashboard/TransferPage'
import RibPage from './pages/dashboard/RibPage'
import ProfilePage from './pages/dashboard/ProfilePage'
import DepositPage from './pages/dashboard/DepositPage'

// Admin pages
import AdminLayout from './components/layout/AdminLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import AdminUsers from './pages/admin/AdminUsers'
import AdminDeposits from './pages/admin/AdminDeposits'
import AdminTransactions from './pages/admin/AdminTransactions'

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore()
  if (isAuthenticated) {
    return <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/dashboard'} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { setUser, logout } = useAuthStore()

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => logout())
  }, [])

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Auth routes */}
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="reset-password/:token" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />
        <Route path="verify-email/:token" element={<VerifyEmailPage />} />
      </Route>

      {/* Dashboard routes */}
      <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardHome />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="transfer" element={<TransferPage />} />
        <Route path="rib" element={<RibPage />} />
        <Route path="deposit" element={<DepositPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="deposits" element={<AdminDeposits />} />
        <Route path="transactions" element={<AdminTransactions />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}
