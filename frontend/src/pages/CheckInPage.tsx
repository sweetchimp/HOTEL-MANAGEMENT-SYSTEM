import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { CheckinRecord, ReservationListItem, RoomListItem, PaginatedResponse } from '../types'

export default function CheckInPage() {
  const [checkins, setCheckins] = useState<CheckinRecord[]>([])
  const [confirmedReservations, setConfirmedReservations] = useState<ReservationListItem[]>([])
  const [availableRooms, setAvailableRooms] = useState<RoomListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check-in form
  const [showForm, setShowForm] = useState(false)
  const [selectedReservation, setSelectedReservation] = useState<ReservationListItem | null>(null)
  const [selectedRoom, setSelectedRoom] = useState<number>(0)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadData() {
    setLoading(true)
    await Promise.all([loadCheckins(), loadConfirmedReservations()])
    setLoading(false)
  }

  async function loadCheckins() {
    const res = await api.get<CheckinRecord[]>('/checkin/list')
    if (res.success && res.data) {
      setCheckins(res.data)
    } else {
      setError(res.error || 'Failed to load check-ins')
    }
  }

  async function loadConfirmedReservations() {
    const res = await api.get<PaginatedResponse<ReservationListItem>>('/reservations?status=CONFIRMED')
    if (res.success && res.data) {
      setConfirmedReservations(res.data.items)
    }
  }

  function openCheckIn(reservation: ReservationListItem) {
    setSelectedReservation(reservation)
    setSelectedRoom(0)
    setNotes('')
    setShowForm(true)
    loadAvailableRoomsFor(reservation)
  }

  async function loadAvailableRoomsFor(reservation: ReservationListItem) {
    const res = await api.get<{ available: number; rooms: RoomListItem[] }>(
      `/reservations/availability?check_in=${reservation.CHECK_IN_DATE}&check_out=${reservation.CHECK_OUT_DATE}&room_type=${reservation.ROOM_TYPE_ID}`
    )
    if (res.success && res.data) {
      setAvailableRooms(res.data.rooms || [])
    }
  }

  async function handleCheckIn() {
    if (!selectedReservation || !selectedRoom) return

    // First, we need to create a booking for this reservation
    // Then process the check-in
    // For simplicity, we'll use the reservation ID as booking reference
    // In a real system, there would be a booking already created

    const res = await api.post('/checkin/process', {
      booking_id: selectedReservation.RESERVATION_ID, // Using reservation ID as booking ID for demo
      room_id: selectedRoom,
      notes,
    })

    if (res.success) {
      setShowForm(false)
      loadData()
    } else {
      setError(res.error || 'Failed to process check-in')
    }
  }

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Check-in</h1>
        <p className="text-surface-500 mt-1">Process guest arrivals and room assignments.</p>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Pending Check-ins */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Arrivals Today</h2>
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : confirmedReservations.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No arrivals pending</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Reservation</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room Type</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-in Date</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-out Date</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Action</th>
                </tr>
              </thead>
              <tbody>
                {confirmedReservations.map(res => (
                  <tr key={res.RESERVATION_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4">#{res.RESERVATION_ID}</td>
                    <td className="py-3 px-4 font-medium">Guest #{res.GUEST_ID}</td>
                    <td className="py-3 px-4">Type #{res.ROOM_TYPE_ID}</td>
                    <td className="py-3 px-4">{res.CHECK_IN_DATE}</td>
                    <td className="py-3 px-4">{res.CHECK_OUT_DATE}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="btn-primary text-sm"
                        onClick={() => openCheckIn(res)}
                      >
                        Check In
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Check-ins */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold mb-4">Recent Check-ins</h2>
        {checkins.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No check-ins yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">ID</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-in Time</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Notes</th>
                </tr>
              </thead>
              <tbody>
                {checkins.map(c => (
                  <tr key={c.CHECKIN_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4">{c.CHECKIN_ID}</td>
                    <td className="py-3 px-4 font-medium">{c.FIRST_NAME} {c.LAST_NAME}</td>
                    <td className="py-3 px-4">{c.ROOM_NUMBER}</td>
                    <td className="py-3 px-4">{new Date(c.ACTUAL_CHECK_IN).toLocaleString()}</td>
                    <td className="py-3 px-4 text-surface-500">{c.NOTES || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Check-in Form Modal */}
      {showForm && selectedReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">Process Check-in</h2>
            <div className="space-y-4">
              <div className="bg-surface-50 rounded-lg p-4">
                <p className="text-sm text-surface-600">Reservation #{selectedReservation.RESERVATION_ID}</p>
                <p className="text-sm text-surface-600">Guest #{selectedReservation.GUEST_ID}</p>
                <p className="text-sm text-surface-600">
                  {selectedReservation.CHECK_IN_DATE} to {selectedReservation.CHECK_OUT_DATE}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Assign Room *</label>
                <select
                  className="input-field"
                  value={selectedRoom}
                  onChange={e => setSelectedRoom(Number(e.target.value))}
                >
                  <option value={0}>Select a room...</option>
                  {availableRooms.map(r => (
                    <option key={r.ROOM_ID} value={r.ROOM_ID}>
                      Room {r.ROOM_NUMBER} (Floor {r.FLOOR})
                    </option>
                  ))}
                </select>
                {availableRooms.length === 0 && (
                  <p className="text-sm text-surface-500 mt-1">No available rooms for this type/dates</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Notes</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleCheckIn}
                disabled={!selectedRoom}
              >
                Confirm Check-in
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
