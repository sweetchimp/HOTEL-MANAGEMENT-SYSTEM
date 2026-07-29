import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Rooms', href: '/dashboard/rooms', icon: '🛏️', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Guests', href: '/dashboard/guests', icon: '👤', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Reservations', href: '/dashboard/reservations', icon: '📅', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Check-in', href: '/dashboard/checkin', icon: '🔑', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Check-out', href: '/dashboard/checkout', icon: '🚪', roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Maintenance', href: '/dashboard/maintenance', icon: '🔧', roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: '🧹', roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Staff', href: '/dashboard/staff', icon: '👥', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Schedule', href: '/dashboard/schedule', icon: '📋', roles: ['ADMIN', 'MANAGER'] },
  { name: 'Billing', href: '/dashboard/billing', icon: '💰', roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Reports', href: '/dashboard/reports', icon: '📈', roles: ['ADMIN', 'MANAGER'] },

  // Phase 9 — Settings & Admin
  { name: 'Settings', href: '/dashboard/settings', icon: '⚙️', roles: ['ADMIN'] },
  { name: 'Audit Log', href: '/dashboard/audit', icon: '📋', roles: ['ADMIN'] },
  { name: 'Users', href: '/dashboard/users', icon: '👥', roles: ['ADMIN'] },
]

function filterByRole(items: typeof navigation, role: UserRole) {
  return items.filter((item) => item.roles.includes(role))
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const filteredNav = user ? filterByRole(navigation, user.role) : []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-primary-500 text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-primary-600">
          <h1 className="font-display text-xl font-bold text-accent-400">
            ALTONSHOTEL
          </h1>
          <p className="text-primary-200 text-xs mt-1">Management System</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {filteredNav.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-primary-200 hover:bg-primary-600/50 hover:text-white'
                }`
              }
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-primary-600">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center text-sm font-bold text-white">
              {user?.full_name?.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-xs text-primary-300 truncate">
                {user?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-left text-sm text-primary-300 hover:text-white transition-colors duration-200 px-1"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
