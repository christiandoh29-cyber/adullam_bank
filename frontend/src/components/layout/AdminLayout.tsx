// src/components/layout/AdminLayout.tsx
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Download, ArrowLeftRight, LogOut, ChevronLeft } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { authApi } from '../../lib/api'
import { getInitials } from '../../lib/utils'

const adminNavItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/deposits', label: 'Deposit Requests', icon: Download },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

export default function AdminLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch {}
    logout()
    navigate('/auth/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-950">
      <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-900 border-r border-white/5">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-rose to-accent-amber flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div>
              <p className="text-white font-bold text-sm">Admin Panel</p>
              <p className="text-accent-rose text-xs mt-0.5">Adullam Bank</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}

          <div className="pt-2">
            <NavLink to="/dashboard" className="nav-item">
              <ChevronLeft size={18} />
              Back to Banking
            </NavLink>
          </div>
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-rose to-accent-amber flex items-center justify-center text-white text-xs font-semibold">
              {user ? getInitials(user.firstName, user.lastName) : 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.firstName}</p>
              <p className="text-accent-rose text-xs">Administrator</p>
            </div>
            <button onClick={handleLogout} className="text-surface-400 hover:text-accent-rose transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-surface-900/80 border-b border-white/5 flex items-center px-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
            <span className="text-surface-400 text-sm font-medium">Admin Mode</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
