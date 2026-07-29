import { useState, useEffect, useCallback } from 'react'
import { api } from '../services/api'
import type {
  ReportSummary, MonthlyOccupancy, MonthlyRevenue,
  RoomTypeReport, PopularGuest,
} from '../types'

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function ReportsPage() {
  const [period, setPeriod] = useState('6')
  const [summary, setSummary] = useState<ReportSummary | null>(null)
  const [occupancy, setOccupancy] = useState<MonthlyOccupancy[]>([])
  const [revenue, setRevenue] = useState<MonthlyRevenue[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomTypeReport[]>([])
  const [popularGuests, setPopularGuests] = useState<PopularGuest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sumRes, occRes, revRes, rtRes, pgRes] = await Promise.all([
        api.get<ReportSummary>('/reports/summary'),
        api.get<MonthlyOccupancy[]>(`/reports/occupancy?months=${period}`),
        api.get<MonthlyRevenue[]>(`/reports/revenue?months=${period}`),
        api.get<RoomTypeReport[]>('/reports/room-types'),
        api.get<PopularGuest[]>('/reports/popular-guests?limit=10'),
      ])
      if (sumRes.success && sumRes.data) setSummary(sumRes.data)
      if (occRes.success && occRes.data) setOccupancy(occRes.data)
      if (revRes.success && revRes.data) setRevenue(revRes.data)
      if (rtRes.success && rtRes.data) setRoomTypes(rtRes.data)
      if (pgRes.success && pgRes.data) setPopularGuests(pgRes.data)
      if (!sumRes.success) setError(sumRes.error || 'Failed to load reports')
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }, [period])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const maxRevenue = Math.max(...revenue.map(r => r.amount), 1)
  const maxOccupancy = Math.max(...occupancy.map(o => o.rate), 1)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Reports</h1>
          <p className="text-surface-500 mt-1">Analytics, occupancy rates, and revenue reports.</p>
        </div>
        <div className="flex gap-2">
          {['3', '6', '12'].map((m) => (
            <button
              key={m}
              onClick={() => setPeriod(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === m
                  ? 'bg-primary-500 text-white'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {m} mo
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-surface-400">Loading reports...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="card p-4">
              <p className="text-xs text-surface-500 uppercase font-medium">Total Revenue</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">${(summary?.totalRevenue ?? 0).toLocaleString()}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-surface-500 uppercase font-medium">Occupancy Rate</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{summary?.occupancyRate ?? 0}%</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-surface-500 uppercase font-medium">Total Guests</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{summary?.totalGuests ?? 0}</p>
            </div>
            <div className="card p-4">
              <p className="text-xs text-surface-500 uppercase font-medium">Avg Stay</p>
              <p className="text-2xl font-bold text-surface-900 mt-1">{summary?.avgStayLength ?? 0} days</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-700">Monthly Occupancy Rate</h3>
                <button
                  onClick={() => downloadCSV('occupancy.csv', ['Month', 'Rate (%)'], occupancy.map(o => [o.month, String(o.rate)]))}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Export CSV
                </button>
              </div>
              <div className="flex items-end gap-2 h-40">
                {occupancy.map((o) => (
                  <div key={o.month} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-surface-500 mb-1">{o.rate}%</span>
                    <div
                      className="w-full bg-accent-400 rounded-t"
                      style={{ height: `${Math.max(4, (o.rate / maxOccupancy) * 100)}%` }}
                    />
                    <span className="text-xs text-surface-500 mt-1 truncate w-full text-center">
                      {o.month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-700">Monthly Revenue</h3>
                <button
                  onClick={() => downloadCSV('revenue.csv', ['Month', 'Amount ($)'], revenue.map(r => [r.month, String(r.amount)]))}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Export CSV
                </button>
              </div>
              <div className="flex items-end gap-2 h-40">
                {revenue.map((r) => (
                  <div key={r.month} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-surface-500 mb-1">${(r.amount / 1000).toFixed(0)}k</span>
                    <div
                      className="w-full bg-primary-400 rounded-t"
                      style={{ height: `${Math.max(4, (r.amount / maxRevenue) * 100)}%` }}
                    />
                    <span className="text-xs text-surface-500 mt-1 truncate w-full text-center">
                      {r.month.slice(5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-700">Revenue by Room Type</h3>
                <button
                  onClick={() => downloadCSV('room-types.csv', ['Room Type', 'Bookings', 'Revenue ($)', 'Avg Rate ($)'], roomTypes.map(rt => [rt.type_name, String(rt.bookings), String(rt.revenue), String(rt.avg_rate)]))}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Export CSV
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="p-2 text-xs text-surface-500 uppercase">Room Type</th>
                    <th className="p-2 text-xs text-surface-500 uppercase">Bookings</th>
                    <th className="p-2 text-xs text-surface-500 uppercase">Revenue</th>
                    <th className="p-2 text-xs text-surface-500 uppercase">Avg Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {roomTypes.length === 0 ? (
                    <tr><td colSpan={4} className="p-4 text-center text-surface-400">No data.</td></tr>
                  ) : (
                    roomTypes.map((rt, i) => (
                      <tr key={i} className="border-b border-surface-100">
                        <td className="p-2 text-surface-700 font-medium">{rt.type_name}</td>
                        <td className="p-2 text-surface-600">{rt.bookings}</td>
                        <td className="p-2 text-surface-900 font-medium">${Number(rt.revenue).toLocaleString()}</td>
                        <td className="p-2 text-surface-600">${Number(rt.avg_rate).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-surface-700">Top Guests</h3>
                <button
                  onClick={() => downloadCSV('popular-guests.csv', ['Guest', 'Stays', 'Total Spend ($)'], popularGuests.map(g => [`${g.first_name} ${g.last_name}`, String(g.total_stays), String(g.total_spend)]))}
                  className="text-xs text-primary-600 hover:text-primary-800 font-medium"
                >
                  Export CSV
                </button>
              </div>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-surface-200">
                    <th className="p-2 text-xs text-surface-500 uppercase">Guest</th>
                    <th className="p-2 text-xs text-surface-500 uppercase">Stays</th>
                    <th className="p-2 text-xs text-surface-500 uppercase">Total Spend</th>
                  </tr>
                </thead>
                <tbody>
                  {popularGuests.length === 0 ? (
                    <tr><td colSpan={3} className="p-4 text-center text-surface-400">No data.</td></tr>
                  ) : (
                    popularGuests.map((g, i) => (
                      <tr key={i} className="border-b border-surface-100">
                        <td className="p-2 text-surface-700 font-medium">{g.first_name} {g.last_name}</td>
                        <td className="p-2 text-surface-600">{g.total_stays}</td>
                        <td className="p-2 text-surface-900 font-medium">${Number(g.total_spend).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
