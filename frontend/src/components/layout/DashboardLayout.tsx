// src/components/layout/DashboardLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Download,
  FileText, User, LogOut, Menu, Shield, Bot
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { authApi } from '../../lib/api'
import { getInitials } from '../../lib/utils'
import NotificationBell from '../NotificationBell'
import { Sun, Moon } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/dashboard/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/dashboard/cards', label: 'My Cards', icon: CreditCard },
  { to: '/dashboard/deposit', label: 'Deposit', icon: Download },
  { to: '/dashboard/rib', label: 'My RIB / IBAN', icon: FileText },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
  { to: '/dashboard/ai-assistant', label: 'AI Assistant', icon: Bot },
]

interface SidebarProps {
  user: import('../../store/auth').AuthUser | null
  onClose: () => void
  onLogout: () => void
}

function Sidebar({ user, onClose, onLogout }: SidebarProps) {
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-900 border-r border-theme">
      <div className="p-6 border-b border-theme">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-sm">
            <span className="text-white font-bold">A</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">Adullam Bank</p>
            <p className="text-surface-400 text-xs mt-0.5">Digital Banking</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        {user?.role === 'ADMIN' && (
          <>
            <div className="pt-4 pb-2">
              <p className="text-surface-600 text-xs font-semibold uppercase tracking-wider px-4">Admin</p>
            </div>
            <NavLink to="/admin" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <Shield size={18} />
              Admin Panel
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-theme">
        <div className="flex items-center gap-3 p-3 rounded-xl hover-surface cursor-pointer group">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
              {user ? getInitials(user.firstName, user.lastName) : 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-surface-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={onLogout}
            className="text-surface-400 hover:text-accent-rose transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar user={user} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64">
            <Sidebar user={user} onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-surface-900/80 backdrop-blur-sm border-b border-theme flex items-center justify-between px-6 flex-shrink-0">
          <button
            className="lg:hidden text-surface-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            <button
              onClick={() => useThemeStore.getState().toggleTheme()}
              className="text-surface-400 hover:text-white transition-colors p-2 rounded-lg hover-surface"
              title="Toggle theme"
            >
              {useThemeStore.getState().theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <NotificationBell />

            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-theme">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-semibold">
                  {user ? getInitials(user.firstName, user.lastName) : 'U'}
                </div>
              )}
              <span className="text-white text-sm font-medium">{user?.firstName}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
