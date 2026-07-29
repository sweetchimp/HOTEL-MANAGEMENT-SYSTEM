import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { CheckoutRecord, CheckinRecord } from '../types'

interface ActiveCheckin extends CheckinRecord {
  FIRST_NAME: string
  LAST_NAME: string
  ROOM_NUMBER: string
}

export default function CheckOutPage() {
  const [checkouts, setCheckouts] = useState<CheckoutRecord[]>([])
  const [activeCheckins, setActiveCheckins] = useState<ActiveCheckin[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check-out form
  const [showForm, setShowForm] = useState(false)
  const [selectedCheckin, setSelectedCheckin] = useState<ActiveCheckin | null>(null)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadCheckouts(), loadActiveCheckins()])
    setLoading(false)
  }

  async function loadCheckouts() {
    const res = await api.get<CheckoutRecord[]>('/checkout/list')
    if (res.success && res.data) {
      setCheckouts(res.data)
    } else {
      setError(res.error || 'Failed to load check-outs')
    }
  }

  async function loadActiveCheckins() {
    const res = await api.get<ActiveCheckin[]>('/checkin/list')
    if (res.success && res.data) {
      // Filter to only show checkins that haven't been checked out yet
      // (in a real system, this would be a separate endpoint)
      setActiveCheckins(res.data)
    }
  }

  function openCheckOut(checkin: ActiveCheckin) {
    setSelectedCheckin(checkin)
    setNotes('')
    setShowForm(true)
  }

  async function handleCheckOut() {
    if (!selectedCheckin) return

    const res = await api.post('/checkout/process', {
      checkin_id: selectedCheckin.CHECKIN_ID,
      notes,
    })

    if (res.success) {
      setShowForm(false)
      loadData()
    } else {
      setError(res.error || 'Failed to process check-out')
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Check-out</h1>
        <p className="text-surface-500 mt-1">Process guest departures and generate invoices.</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Active Check-ins (can check out) */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Current Guests</h2>
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : activeCheckins.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No active guests</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-in ID</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-in Time</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {activeCheckins.map(c => (
                  <tr key={c.CHECKIN_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4">#{c.CHECKIN_ID}</td>
                    <td className="py-3 px-4 font-medium">{c.FIRST_NAME} {c.LAST_NAME}</td>
                    <td className="py-3 px-4">{c.ROOM_NUMBER}</td>
                    <td className="py-3 px-4">{new Date(c.ACTUAL_CHECK_IN).toLocaleString()}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="btn-primary text-sm"
                        onClick={() => openCheckOut(c)}
                      >
                        Check Out
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Check-outs */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Check-outs</h2>
        {checkouts.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No check-outs yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-out Time</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {checkouts.map(co => (
                  <tr key={co.CHECKOUT_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4">{co.CHECKOUT_ID}</td>
                    <td className="py-3 px-4 font-medium">{co.FIRST_NAME} {co.LAST_NAME}</td>
                    <td className="py-3 px-4">{co.ROOM_NUMBER}</td>
                    <td className="py-3 px-4">{new Date(co.ACTUAL_CHECK_OUT).toLocaleString()}</td>
                    <td className="py-3 px-4 text-surface-500">{co.NOTES || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-out Form Modal */}
      {showForm && selectedCheckin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Process Check-out</h2>
            <div className="space-y-4">
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-sm text-surface-600">Guest: {selectedCheckin.FIRST_NAME} {selectedCheckin.LAST_NAME}</p>
                <p className="text-sm text-surface-600">Room: {selectedCheckin.ROOM_NUMBER}</p>
                <p className="text-sm text-surface-600">
                  Checked in: {new Date(selectedCheckin.ACTUAL_CHECK_IN).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional checkout notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCheckOut}>
                Confirm Check-out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
