import { useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BedDouble,
  UserRound,
  CalendarDays,
  KeyRound,
  DoorOpen,
  Wrench,
  Sparkles,
  Users,
  ClipboardList,
  Wallet,
  BarChart3,
  Settings,
  History,
  UserCog,
  Inbox,
  Menu,
  X,
  LogOut,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import type { UserRole } from '../types'

const navigation: {
  name: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Rooms', href: '/dashboard/rooms', icon: BedDouble, roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Guests', href: '/dashboard/guests', icon: UserRound, roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Reservations', href: '/dashboard/reservations', icon: CalendarDays, roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Check-in', href: '/dashboard/checkin', icon: KeyRound, roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Check-out', href: '/dashboard/checkout', icon: DoorOpen, roles: ['ADMIN', 'RECEPTIONIST'] },
  { name: 'Maintenance', href: '/dashboard/maintenance', icon: Wrench, roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Housekeeping', href: '/dashboard/housekeeping', icon: Sparkles, roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Staff', href: '/dashboard/staff', icon: Users, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Schedule', href: '/dashboard/schedule', icon: ClipboardList, roles: ['ADMIN', 'MANAGER'] },
  { name: 'Billing', href: '/dashboard/billing', icon: Wallet, roles: ['ADMIN', 'RECEPTIONIST', 'MANAGER'] },
  { name: 'Reports', href: '/dashboard/reports', icon: BarChart3, roles: ['ADMIN', 'MANAGER'] },

  // Phase 9 — Settings & Admin
  { name: 'Booking Requests', href: '/dashboard/booking-requests', icon: Inbox, roles: ['ADMIN'] },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['ADMIN'] },
  { name: 'Audit Log', href: '/dashboard/audit', icon: History, roles: ['ADMIN'] },
  { name: 'Users', href: '/dashboard/users', icon: UserCog, roles: ['ADMIN'] },
]

function filterByRole(items: typeof navigation, role: UserRole) {
  return items.filter((item) => item.roles.includes(role))
}

export default function DashboardLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const filteredNav = user ? filterByRole(navigation, user.role) : []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Top header — Yale Blue with Goldenrod accent edge */}
      <header className="relative z-40 flex h-16 shrink-0 items-center gap-3 border-b-2 border-accent-500 bg-primary-500 px-4 shadow-md md:px-6">
        <button
          className="md:hidden rounded-md p-2 text-primary-200 transition-colors hover:bg-primary-600 hover:text-white"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <img
          src="/AH_Logo.png"
          alt="ALTONS Hotel logo"
          className="h-10 w-10 shrink-0 object-contain"
        />
        <div className="min-w-0 leading-tight">
          <h1 className="truncate font-display text-base font-bold text-white sm:text-lg">
            ALTONS<span className="text-accent-400">HOTEL</span>
          </h1>
          <p className="hidden text-[11px] text-primary-200 sm:block">
            Management System
          </p>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden text-right leading-tight sm:block">
            <p className="max-w-[180px] truncate text-sm font-medium text-white">
              {user?.full_name}
            </p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-accent-300">
              {user?.role}
            </p>
          </div>
          <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-sm font-bold text-primary-900 ring-2 ring-accent-300/40 sm:flex">
            {user?.full_name?.charAt(0)}
          </div>
          <button
            onClick={handleLogout}
            className="rounded-md p-2 text-primary-200 transition-all duration-200 hover:bg-primary-600 hover:text-white"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`fixed bottom-0 left-0 top-16 z-50 flex w-64 flex-col bg-primary-700 text-white transition-transform duration-300 md:static md:top-auto md:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between border-b border-primary-600 px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-accent-400">
              Menu
            </span>
            <button
              className="text-primary-300 transition-colors hover:text-white md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            {filteredNav.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg border-l-[3px] px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'border-accent-500 bg-primary-500 text-white shadow-sm'
                      : 'border-transparent text-primary-200 hover:bg-primary-600/60 hover:text-white'
                  }`
                }
              >
                <item.icon className="h-[18px] w-[18px] shrink-0" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t border-primary-600 p-4">
            <p className="text-[11px] text-primary-400">
              &copy; {new Date().getFullYear()} ALTONS Hotel
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div
            key={location.pathname}
            className="animate-fade-in p-4 md:p-8"
          >
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
