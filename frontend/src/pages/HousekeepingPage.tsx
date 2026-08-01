import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { HousekeepingTask } from '../types'

export default function HousekeepingPage() {
  const [tasks, setTasks] = useState<HousekeepingTask[]>([])
  const [cleaned, setCleaned] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showConfirm, setShowConfirm] = useState(false)
  const [confirmBookingId, setConfirmBookingId] = useState(0)
  const [confirmStaff, setConfirmStaff] = useState('')

  useEffect(() => {
    loadTasks()
  }, [])

  async function loadTasks() {
    setLoading(true)
    const res = await api.get<HousekeepingTask[]>('/housekeeping/tasks')
    if (res.success && res.data) {
      setTasks(res.data)
    } else {
      setError(res.error || 'Failed to load tasks')
    }
    setLoading(false)
  }

  async function handleComplete() {
    if (!confirmBookingId || !confirmStaff) return
    const today = new Date().toISOString().split('T')[0]
    const res = await api.post(`/housekeeping/tasks/${confirmBookingId}/complete`, {
      completed_date: today,
      notes: '',
      assigned_staff: confirmStaff,
    })
    if (res.success) {
      setCleaned(prev => [...prev, confirmBookingId])
      setShowConfirm(false)
      setConfirmBookingId(0)
      setConfirmStaff('')
      loadTasks()
    } else {
      setError(res.error || 'Failed to complete task')
    }
  }

  const remaining = tasks.filter(t => !cleaned.includes(t.booking_id))

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Housekeeping</h1>
        <p className="text-surface-500 mt-1">Manage cleaning tasks for checkout rooms.</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-3xl font-bold text-primary-600">{tasks.length}</p>
          <p className="text-sm text-surface-500 mt-1">Total Tasks</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-green-600">{cleaned.length}</p>
          <p className="text-sm text-surface-500 mt-1">Cleaned</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-bold text-yellow-600">{remaining.length}</p>
          <p className="text-sm text-surface-500 mt-1">Remaining</p>
        </div>
      </div>

      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Today's Tasks</h2>
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : tasks.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No cleaning tasks for today</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Last Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Checkout Time</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {remaining.map(t => (
                  <tr key={t.booking_id} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">{t.room_number}</td>
                    <td className="py-3 px-4">{t.guest_name}</td>
                    <td className="py-3 px-4">{t.check_out_date}</td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="btn-primary text-sm"
                        onClick={() => { setConfirmBookingId(t.booking_id); setConfirmStaff(''); setShowConfirm(true) }}
                      >
                        Mark Complete
                      </button>
                    </td>
                  </tr>
                ))}
                {cleaned.map(id => {
                  const t = tasks.find(task => task.booking_id === id)
                  if (!t) return null
                  return (
                    <tr key={`cleaned-${t.booking_id}`} className="border-b border-surface-100 bg-green-50">
                      <td className="py-3 px-4 font-medium">{t.room_number}</td>
                      <td className="py-3 px-4">{t.guest_name}</td>
                      <td className="py-3 px-4">{t.check_out_date}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Cleaned
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-green-600 text-sm font-medium">Done</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Confirm Task Complete</h2>
            <div className="space-y-4">
              <p className="text-sm text-surface-600">
                Mark room cleaning as complete for booking #{confirmBookingId}?
              </p>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Assigned Staff *</label>
                <input
                  className="input-field"
                  value={confirmStaff}
                  onChange={e => setConfirmStaff(e.target.value)}
                  placeholder="Staff name..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleComplete}
                disabled={!confirmStaff}
              >
                Confirm Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
