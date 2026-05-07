// src/components/layout/DashboardLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Download,
  FileText, User, LogOut, Menu, X, ChevronDown, Bell, Shield
} from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { authApi } from '../../lib/api'
import { getInitials } from '../../lib/utils'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/dashboard/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/dashboard/cards', label: 'My Cards', icon: CreditCard },
  { to: '/dashboard/deposit', label: 'Deposit', icon: Download },
  { to: '/dashboard/rib', label: 'My RIB / IBAN', icon: FileText },
  { to: '/dashboard/profile', label: 'Profile', icon: User },
]

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/auth/login')
  }

  const Sidebar = () => (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-900 border-r border-white/5">
      {/* Logo */}
      <div className="p-6 border-b border-white/5">
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

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={() => setSidebarOpen(false)}
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

      {/* User section */}
      <div className="p-4 border-t border-white/5">
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer group">
          <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
            {user ? getInitials(user.firstName, user.lastName) : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName} {user?.lastName}</p>
            <p className="text-surface-400 text-xs truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-surface-400 hover:text-accent-rose transition-colors p-1"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64">
            <Sidebar />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="h-16 bg-surface-900/80 backdrop-blur-sm border-b border-white/5 flex items-center justify-between px-6 flex-shrink-0">
          <button
            className="lg:hidden text-surface-400 hover:text-white"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-xl bg-surface-800 border border-white/5 flex items-center justify-center text-surface-400 hover:text-white transition-colors">
              <Bell size={17} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-accent-purple" />
            </button>

            <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-white/10">
              <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-white text-xs font-semibold">
                {user ? getInitials(user.firstName, user.lastName) : 'U'}
              </div>
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
