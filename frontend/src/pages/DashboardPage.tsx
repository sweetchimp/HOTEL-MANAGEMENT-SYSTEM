import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import type { DashboardStats } from '../types'

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const res = await api.get<DashboardStats>('/dashboard/stats')
    if (res.success && res.data) {
      setStats(res.data)
    } else {
      setError(res.error || 'Failed to load dashboard')
    }
    setLoading(false)
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-surface-900">
        Welcome back, {user?.full_name}
      </h1>
      <p className="text-surface-500 mt-1">
        Here's what's happening at ALTONSHOTEL today.
      </p>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Arrivals</p>
          <p className="text-3xl font-bold text-primary-500 mt-1">
            {loading ? '...' : stats?.todayArrivals ?? '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Departures</p>
          <p className="text-3xl font-bold text-accent-500 mt-1">
            {loading ? '...' : stats?.todayDepartures ?? '—'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Occupancy Rate</p>
          <p className="text-3xl font-bold text-green-600 mt-1">
            {loading ? '...' : stats ? `${stats.occupancyRate}%` : '—%'}
          </p>
        </div>
        <div className="card">
          <p className="text-sm font-medium text-surface-500">Today's Revenue</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">
            {loading ? '...' : stats ? `$${stats.todayRevenue.toLocaleString()}` : '$—'}
          </p>
        </div>
      </div>
    </div>
  )
}
