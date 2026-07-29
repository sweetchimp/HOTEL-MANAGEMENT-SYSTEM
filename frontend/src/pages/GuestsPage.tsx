import { useEffect, useState } from 'react'
import { api } from '../services/api'
import type { GuestListItem, PaginatedResponse } from '../types'

export default function GuestsPage() {
  const [guests, setGuests] = useState<GuestListItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingGuest, setEditingGuest] = useState<GuestListItem | null>(null)
  const [form, setForm] = useState({
    first_name: '', last_name: '', email: '', phone: '',
    id_type: 'PASSPORT', id_number: '', address: '', nationality: ''
  })

  useEffect(() => {
    loadGuests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search])

  async function loadGuests() {
    setLoading(true)
    let url = `/guests?page=${page}&pageSize=10`
    if (search) url += `&search=${encodeURIComponent(search)}`

    const res = await api.get<PaginatedResponse<GuestListItem>>(url)
    if (res.success && res.data) {
      setGuests(res.data.items)
      setTotal(res.data.total)
    } else {
      setError(res.error || 'Failed to load guests')
    }
    setLoading(false)
  }

  function openCreate() {
    setEditingGuest(null)
    setForm({ first_name: '', last_name: '', email: '', phone: '', id_type: 'PASSPORT', id_number: '', address: '', nationality: '' })
    setShowForm(true)
  }

  function openEdit(guest: GuestListItem) {
    setEditingGuest(guest)
    setForm({
      first_name: guest.FIRST_NAME,
      last_name: guest.LAST_NAME,
      email: guest.EMAIL,
      phone: guest.PHONE,
      id_type: guest.ID_TYPE,
      id_number: guest.ID_NUMBER,
      address: guest.ADDRESS,
      nationality: guest.NATIONALITY,
    })
    setShowForm(true)
  }

  async function handleSave() {
    if (!form.first_name || !form.last_name || !form.phone || !form.id_number) return

    if (editingGuest) {
      const res = await api.put(`/guests/${editingGuest.GUEST_ID}`, form)
      if (res.success) {
        setShowForm(false)
        loadGuests()
      } else {
        setError(res.error || 'Failed to update guest')
      }
    } else {
      const res = await api.post('/guests', form)
      if (res.success) {
        setShowForm(false)
        loadGuests()
      } else {
        setError(res.error || 'Failed to create guest')
      }
    }
  }

  const totalPages = Math.ceil(total / 10)

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-surface-900">Guests</h1>
          <p className="text-surface-500 mt-1">Manage guest profiles and history.</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>Add Guest</button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
          <button className="ml-2 underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Search */}
      <div className="card mt-6">
        <input
          className="input-field"
          placeholder="Search by name, email, or phone..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      {/* Table */}
      <div className="card mt-4">
        {loading ? (
          <p className="text-center py-8 text-surface-400">Loading...</p>
        ) : guests.length === 0 ? (
          <p className="text-center py-8 text-surface-400">No guests found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200">
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">ID Type</th>
                  <th className="text-left py-3 px-4 font-medium text-surface-600">Nationality</th>
                  <th className="text-right py-3 px-4 font-medium text-surface-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {guests.map(guest => (
                  <tr key={guest.GUEST_ID} className="border-b border-surface-100 hover:bg-surface-50">
                    <td className="py-3 px-4 font-medium">{guest.FIRST_NAME} {guest.LAST_NAME}</td>
                    <td className="py-3 px-4 text-surface-500">{guest.EMAIL}</td>
                    <td className="py-3 px-4">{guest.PHONE}</td>
                    <td className="py-3 px-4">{guest.ID_TYPE}</td>
                    <td className="py-3 px-4">{guest.NATIONALITY}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        className="text-xs text-primary-600 hover:underline"
                        onClick={() => openEdit(guest)}
                      >
                        Edit
                      </button>
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
              {editingGuest ? 'Edit Guest' : 'Add Guest'}
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">First Name *</label>
                <input className="input-field" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Last Name *</label>
                <input className="input-field" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Email</label>
                <input className="input-field" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Phone *</label>
                <input className="input-field" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">ID Type *</label>
                <select className="input-field" value={form.id_type} onChange={e => setForm({ ...form, id_type: e.target.value })}>
                  <option value="PASSPORT">Passport</option>
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="DRIVERS_LICENSE">Driver's License</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">ID Number *</label>
                <input className="input-field" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-surface-600 mb-1">Address</label>
                <input className="input-field" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-surface-600 mb-1">Nationality</label>
                <input className="input-field" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleSave}>
                {editingGuest ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
