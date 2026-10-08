import { useEffect, useState } from 'react'
import { CalendarCheck, DoorOpen, BedDouble, Banknote, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DashboardStats } from '../types'

const stats = [
  {
    key: 'todayArrivals',
    label: "Today's Arrivals",
    icon: CalendarCheck,
    accent: 'bg-accent-500',
    iconColor: 'text-primary-900',
  },
  {
    key: 'todayDepartures',
    label: "Today's Departures",
    icon: DoorOpen,
    accent: 'bg-primary-500',
    iconColor: 'text-white',
  },
  {
    key: 'occupancyRate',
    label: 'Occupancy Rate',
    icon: BedDouble,
    accent: 'bg-steel-500',
    iconColor: 'text-white',
  },
  {
    key: 'todayRevenue',
    label: "Today's Revenue",
    icon: Banknote,
    accent: 'bg-green-600',
    iconColor: 'text-white',
  },
] as const

export default function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    setLoading(true)
    const res = await api.get<DashboardStats>('/dashboard/stats')
    if (res.success && res.data) {
      setData(res.data)
    } else {
      setError(res.error || 'Failed to load dashboard')
    }
    setLoading(false)
  }

  function formatValue(key: (typeof stats)[number]['key']): string {
    if (!data) return '—'
    switch (key) {
      case 'todayArrivals':
        return String(data.todayArrivals)
      case 'todayDepartures':
        return String(data.todayDepartures)
      case 'occupancyRate':
        return `${data.occupancyRate}%`
      case 'todayRevenue':
        return formatCurrency(data.todayRevenue)
    }
  }

  return (
    <div>
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">
          Welcome back, {user?.full_name}
        </h1>
        <p className="mt-1 text-steel-600">
          Here's what's happening at ALTONS HOTEL today.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <Card
            key={stat.key}
            className="animate-slide-up overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
            style={{ animationDelay: `${i * 75}ms` }}
          >
            <div className={`h-1 w-full ${stat.accent}`} />
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-steel-600">
                    {stat.label}
                  </p>
                  {loading ? (
                    <Skeleton className="mt-2 h-9 w-24" />
                  ) : (
                    <p className="mt-1 truncate text-3xl font-bold text-primary-500">
                      {formatValue(stat.key)}
                    </p>
                  )}
                </div>
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${stat.accent}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
