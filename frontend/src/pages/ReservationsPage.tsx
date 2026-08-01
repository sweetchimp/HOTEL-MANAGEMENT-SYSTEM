import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import type { ReservationListItem, GuestListItem, RoomType, PaginatedResponse } from '../types'

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<ReservationListItem[]>([])
  const [guests, setGuests] = useState<GuestListItem[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingRes, setEditingRes] = useState<ReservationListItem | null>(null)
  const [guestSearch, setGuestSearch] = useState('')
  const [selectedGuest, setSelectedGuest] = useState<GuestListItem | null>(null)
  const [form, setForm] = useState({
    guest_id: 0,
    room_type_id: 1,
    check_in_date: '',
    check_out_date: '',
    special_requests: '',
  })

  useEffect(() => {
    loadRoomTypes()
  }, [])

  useEffect(() => {
    loadReservations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus])

  useEffect(() => {
    if (guestSearch.length >= 2) {
      searchGuests()
    } else {
      setGuests([])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestSearch])

  async function loadRoomTypes() {
    const res = await api.get<RoomType[]>('/rooms/types')
    if (res.success && res.data) setRoomTypes(res.data)
  }

  async function loadReservations() {
    setLoading(true)
    let url = `/reservations?page=${page}&pageSize=10`
    if (filterStatus) url += `&status=${filterStatus}`

    const res = await api.get<PaginatedResponse<ReservationListItem>>(url)
    if (res.success && res.data) {
      setReservations(res.data.items)
      setTotal(res.data.total)
    } else {
      setError(res.error || 'Failed to load reservations')
    }
    setLoading(false)
  }

  async function searchGuests() {
    const res = await api.get<GuestListItem[]>(`/guests/search?q=${encodeURIComponent(guestSearch)}`)
    if (res.success && res.data) setGuests(res.data)
  }

  function openCreate() {
    setEditingRes(null)
    setSelectedGuest(null)
    setGuestSearch('')
    setForm({ guest_id: 0, room_type_id: 1, check_in_date: '', check_out_date: '', special_requests: '' })
    setShowForm(true)
  }

  function openEdit(reservation: ReservationListItem) {
    setEditingRes(reservation)
    setForm({
      guest_id: reservation.GUEST_ID,
      room_type_id: reservation.ROOM_TYPE_ID,
      check_in_date: reservation.CHECK_IN_DATE,
      check_out_date: reservation.CHECK_OUT_DATE,
      special_requests: reservation.SPECIAL_REQUESTS,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.guest_id || !form.check_in_date || !form.check_out_date) return

    if (editingRes) {
      const res = await api.put(`/reservations/${editingRes.RESERVATION_ID}`, {
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        room_type_id: form.room_type_id,
        special_requests: form.special_requests,
      })
      if (res.success) {
        setShowForm(false)
        loadReservations()
      } else {
        setError(res.error || 'Failed to update reservation')
      }
    } else {
      const res = await api.post('/reservations', form)
      if (res.success) {
        setShowForm(false)
        loadReservations()
      } else {
        setError(res.error || 'Failed to create reservation')
      }
    }
  }

  async function handleConfirm(id: number) {
    if (!confirm('Confirm this reservation?')) return
    const res = await api.post(`/reservations/${id}/confirm`)
    if (res.success) {
      loadReservations()
    } else {
      setError(res.error || 'Failed to confirm reservation')
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this reservation?')) return
    const res = await api.post(`/reservations/${id}/cancel`)
    if (res.success) {
      loadReservations()
    } else {
      setError(res.error || 'Failed to cancel reservation')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'PENDING': return <span className="badge-warning">Pending</span>
      case 'CONFIRMED': return <span className="badge-info">Confirmed</span>
      case 'CHECKED_IN': return <span className="badge-success">Checked In</span>
      case 'COMPLETED': return <span className="badge-neutral">Completed</span>
      case 'CANCELLED': return <span className="badge-danger">Cancelled</span>
      default: return <span className="badge-neutral">{status}</span>
    }
  }

  function getGuestName(guestId: number) {
    // In a real app, we'd join this data. For now, show the ID
    return `Guest #${guestId}`
  }

  function getTypeName(typeId: number) {
    return roomTypes.find(t => t.type_id === typeId)?.type_name || `Type ${typeId}`
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Reservations</h1>
          <p className="text-surface-500 mt-1">Create and manage hotel reservations.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>New Reservation</button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="card mt-6">
        <div className="flex gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Status</label>
            <select
              className="input-field w-40"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-4">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : reservations.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No reservations found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">#</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Guest</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room Type</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-in</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Check-out</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(res => (
                  <tr key={res.RESERVATION_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4">{res.RESERVATION_ID}</td>
                    <td className="py-3 px-4 font-medium">{getGuestName(res.GUEST_ID)}</td>
                    <td className="py-3 px-4">{getTypeName(res.ROOM_TYPE_ID)}</td>
                    <td className="py-3 px-4">{res.CHECK_IN_DATE}</td>
                    <td className="py-3 px-4">{res.CHECK_OUT_DATE}</td>
                    <td className="py-3 px-4">{getStatusBadge(res.STATUS)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {res.STATUS === 'PENDING' && (
                          <>
                            <button
                              className="text-xs text-green-600 hover:underline"
                              onClick={() => handleConfirm(res.RESERVATION_ID)}
                            >
                              Confirm
                            </button>
                            <button
                              className="text-xs text-primary-600 hover:underline"
                              onClick={() => openEdit(res)}
                            >
                              Edit
                            </button>
                          </>
                        )}
                        {(res.STATUS === 'PENDING' || res.STATUS === 'CONFIRMED') && (
                          <button
                            className="text-xs text-red-600 hover:underline"
                            onClick={() => handleCancel(res.RESERVATION_ID)}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-surface-200">
            <p className="text-sm text-surface-500">
              Showing {((page - 1) * 10) + 1} to {Math.min(page * 10, total)} of {total}
            </p>
            <div className="flex gap-2">
              <button
                className="btn-secondary text-sm"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              <button
                className="btn-secondary text-sm"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingRes ? 'Edit Reservation' : 'New Reservation'}
            </h2>
            <div className="space-y-4">
              {!editingRes && (
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Search Guest *</label>
                  <input
                    className="input-field"
                    placeholder="Type name or email to search..."
                    value={guestSearch}
                    onChange={e => setGuestSearch(e.target.value)}
                  />
                  {guests.length > 0 && (
                    <div className="mt-1 border border-surface-200 rounded-lg max-h-40 overflow-y-auto">
                      {guests.map(g => (
                        <button
                          key={g.GUEST_ID}
                          className="w-full text-left px-3 py-2 hover:bg-surface-50 text-sm"
                          onClick={() => {
                            setSelectedGuest(g)
                            setForm({ ...form, guest_id: g.GUEST_ID })
                            setGuestSearch(`${g.FIRST_NAME} ${g.LAST_NAME}`)
                            setGuests([])
                          }}
                        >
                          {g.FIRST_NAME} {g.LAST_NAME} — {g.EMAIL}
                        </button>
                      ))}
                    </div>
                  )}
                  {selectedGuest && (
                    <p className="text-sm text-green-600 mt-1">
                      Selected: {selectedGuest.FIRST_NAME} {selectedGuest.LAST_NAME}
                    </p>
                  )}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Room Type *</label>
                <select
                  className="input-field"
                  value={form.room_type_id}
                  onChange={e => setForm({ ...form, room_type_id: Number(e.target.value) })}
                >
                  {roomTypes.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name} — {formatCurrency(t.base_price)}/night</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Check-in Date *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.check_in_date}
                    onChange={e => setForm({ ...form, check_in_date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-600 mb-1">Check-out Date *</label>
                  <input
                    className="input-field"
                    type="date"
                    value={form.check_out_date}
                    onChange={e => setForm({ ...form, check_out_date: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Special Requests</label>
                <textarea
                  className="input-field"
                  rows={2}
                  value={form.special_requests}
                  onChange={e => setForm({ ...form, special_requests: e.target.value })}
                  placeholder="Optional special requests..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editingRes ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
