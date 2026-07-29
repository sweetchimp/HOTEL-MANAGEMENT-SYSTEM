import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import type { RoomListItem, RoomType, PaginatedResponse } from '../types'

export default function RoomsPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterFloor, setFilterFloor] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomListItem | null>(null)
  const [form, setForm] = useState({ room_number: '', type_id: 1, floor: 1, description: '' })

  useEffect(() => {
    loadRoomTypes()
  }, [])

  useEffect(() => {
    loadRooms()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filterStatus, filterType, filterFloor])

  async function loadRoomTypes() {
    const res = await api.get<RoomType[]>('/rooms/types')
    if (res.success && res.data) setRoomTypes(res.data)
  }

  async function loadRooms() {
    setLoading(true)
    let url = `/rooms?page=${page}&pageSize=10`
    if (filterStatus) url += `&status=${filterStatus}`
    if (filterType) url += `&type_id=${filterType}`
    if (filterFloor) url += `&floor=${filterFloor}`

    const res = await api.get<PaginatedResponse<RoomListItem>>(url)
    if (res.success && res.data) {
      setRooms(res.data.items)
      setTotal(res.data.total)
    } else {
      setError(res.error || 'Failed to load rooms')
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingRoom(null)
    setForm({ room_number: '', type_id: 1, floor: 1, description: '' })
    setShowForm(true)
  }

  function openEdit(room: RoomListItem) {
    setEditingRoom(room)
    setForm({
      room_number: room.ROOM_NUMBER,
      type_id: room.TYPE_ID,
      floor: room.FLOOR,
      description: room.DESCRIPTION,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.room_number) return

    if (editingRoom) {
      const res = await api.put(`/rooms/${editingRoom.ROOM_ID}`, form)
      if (res.success) {
        setShowForm(false)
        loadRooms()
      } else {
        setError(res.error || 'Failed to update room')
      }
    } else {
      const res = await api.post('/rooms', form)
      if (res.success) {
        setShowForm(false)
        loadRooms()
      } else {
        setError(res.error || 'Failed to create room')
      }
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this room?')) return
    const res = await api.delete(`/rooms/${id}`)
    if (res.success) {
      loadRooms()
    } else {
      setError(res.error || 'Failed to delete room')
    }
  }

  async function handleStatusChange(id: number, status: string) {
    const res = await api.patch(`/rooms/${id}/status`, { status })
    if (res.success) {
      loadRooms()
    } else {
      setError(res.error || 'Failed to update status')
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'AVAILABLE': return <span className="badge-success">Available</span>
      case 'OCCUPIED': return <span className="badge-danger">Occupied</span>
      case 'MAINTENANCE': return <span className="badge-warning">Maintenance</span>
      case 'RESERVED': return <span className="badge-info">Reserved</span>
      default: return <span className="badge-neutral">{status}</span>
    }
  }

  function getTypeName(typeId: number) {
    return roomTypes.find(t => t.type_id === typeId)?.type_name || `Type ${typeId}`
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Rooms</h1>
          <p className="text-surface-500 mt-1">Manage hotel rooms and their status.</p>
        </div>
        {isAdmin && (
          <button className="btn-primary" onClick={openCreate}>Add Room</button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <div className="card mt-6">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Status</label>
            <select
              className="input-field w-40"
              value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setPage(1) }}
            >
              <option value="">All</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="RESERVED">Reserved</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Type</label>
            <select
              className="input-field w-40"
              value={filterType}
              onChange={e => { setFilterType(e.target.value); setPage(1) }}
            >
              <option value="">All</option>
              {roomTypes.map(t => (
                <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-600 mb-1">Floor</label>
            <select
              className="input-field w-40"
              value={filterFloor}
              onChange={e => { setFilterFloor(e.target.value); setPage(1) }}
            >
              <option value="">All</option>
              {[1, 2, 3, 4, 5, 6].map(f => (
                <option key={f} value={f}>Floor {f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card mt-4">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : rooms.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No rooms found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Room</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Floor</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Description</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.ROOM_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">{room.ROOM_NUMBER}</td>
                    <td className="py-3 px-4">{getTypeName(room.TYPE_ID)}</td>
                    <td className="py-3 px-4">{room.FLOOR}</td>
                    <td className="py-3 px-4">{getStatusBadge(room.STATUS)}</td>
                    <td className="py-3 px-4 text-surface-500 max-w-xs truncate">{room.DESCRIPTION}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isAdmin && (
                          <>
                            <button
                              className="text-xs text-primary-600 hover:underline"
                              onClick={() => openEdit(room)}
                            >
                              Edit
                            </button>
                            <select
                              className="text-xs border border-surface-300 rounded px-1 py-0.5"
                              value={room.STATUS}
                              onChange={e => handleStatusChange(room.ROOM_ID, e.target.value)}
                            >
                              <option value="AVAILABLE">Available</option>
                              <option value="OCCUPIED">Occupied</option>
                              <option value="MAINTENANCE">Maintenance</option>
                              <option value="RESERVED">Reserved</option>
                            </select>
                            <button
                              className="text-xs text-red-600 hover:underline"
                              onClick={() => handleDelete(room.ROOM_ID)}
                            >
                              Delete
                            </button>
                          </>
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
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <h2 className="text-lg font-semibold mb-4">
              {editingRoom ? 'Edit Room' : 'Add Room'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Room Number</label>
                <input
                  className="input-field"
                  value={form.room_number}
                  onChange={e => setForm({ ...form, room_number: e.target.value })}
                  placeholder="e.g. 101"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Type</label>
                <select
                  className="input-field"
                  value={form.type_id}
                  onChange={e => setForm({ ...form, type_id: Number(e.target.value) })}
                >
                  {roomTypes.map(t => (
                    <option key={t.type_id} value={t.type_id}>{t.type_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Floor</label>
                <select
                  className="input-field"
                  value={form.floor}
                  onChange={e => setForm({ ...form, floor: Number(e.target.value) })}
                >
                  {[1, 2, 3, 4, 5, 6].map(f => (
                    <option key={f} value={f}>Floor {f}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Description</label>
                <input
                  className="input-field"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editingRoom ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
