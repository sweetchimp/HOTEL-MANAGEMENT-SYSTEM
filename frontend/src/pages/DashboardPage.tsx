import { useAuth } from '../hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()

  return (
    <div>
      <h1 className="text-2xl font-semibold text-surface-900">
        Welcome back, {user?.full_name}
      </h1>
      <p className="text-surface-500 mt-1">
        Here's what's happening at ALTONSHOTEL today.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Arrivals</p>
          <p className="text-3xl font-bold text-primary-500 mt-1">—</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Departures</p>
          <p className="text-3xl font-bold text-accent-500 mt-1">—</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Occupancy Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">—%</p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">$—</p>
        </div>
      </div>
    </div>
  )
}
