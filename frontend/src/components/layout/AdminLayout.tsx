import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Download, ArrowLeftRight, LogOut, ChevronLeft, Menu } from 'lucide-react'
import { useAuthStore } from '../../store/auth'
import { useThemeStore } from '../../store/theme'
import { authApi } from '../../lib/api'
import { getInitials } from '../../lib/utils'
import { Sun, Moon } from 'lucide-react'

const adminNavItems = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/deposits', label: 'Deposit Requests', icon: Download },
  { to: '/admin/transactions', label: 'Transactions', icon: ArrowLeftRight },
]

function AdminSidebar({ onClose, onLogout }: { onClose: () => void; onLogout: () => void }) {
  const { user } = useAuthStore()
  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full bg-surface-900 border-r border-theme">
      <div className="p-6 border-b border-theme">
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
            onClick={onClose}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}

        <div className="pt-2">
          <NavLink to="/dashboard" onClick={onClose} className="nav-item">
            <ChevronLeft size={18} />
            Back to Banking
          </NavLink>
        </div>
      </nav>

      <div className="p-4 border-t border-theme">
        <div className="flex items-center gap-3 p-3 rounded-xl">
          {user?.profilePicture ? (
            <img src={user.profilePicture} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-rose to-accent-amber flex items-center justify-center text-white text-xs font-semibold">
              {user ? getInitials(user.firstName, user.lastName) : 'A'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.firstName}</p>
            <p className="text-accent-rose text-xs">Administrator</p>
          </div>
          <button onClick={onLogout} className="text-surface-400 hover:text-accent-rose transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  )
}

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout } = useAuthStore()
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
        <AdminSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64">
            <AdminSidebar onClose={() => setSidebarOpen(false)} onLogout={handleLogout} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-surface-900/80 border-b border-theme flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              className="lg:hidden text-surface-400 hover:text-white mr-1"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="w-2 h-2 rounded-full bg-accent-rose animate-pulse" />
            <span className="text-surface-400 text-xs sm:text-sm font-medium">Admin Mode</span>
          </div>
          <button
            onClick={() => useThemeStore.getState().toggleTheme()}
            className="text-surface-400 hover:text-white transition-colors p-2 rounded-lg hover-surface"
            title="Toggle theme"
          >
            {useThemeStore.getState().theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
