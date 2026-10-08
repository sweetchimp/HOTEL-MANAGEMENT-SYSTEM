import { useEffect, useState } from 'react'
import {
  Plus,
  Pencil,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ArrowRight,
  Check,
  X,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { formatCurrency } from '../utils/currency'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ReservationListItem, GuestListItem, RoomType, PaginatedResponse } from '../types'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'neutral'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  CHECKED_IN: 'success',
  COMPLETED: 'neutral',
  CANCELLED: 'destructive',
}

const statusLabel: Record<string, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  CHECKED_IN: 'Checked In',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

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
  const [saving, setSaving] = useState(false)
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
    let url = `/reservations?page=${page}&pageSize=12`
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
    setSaving(true)

    if (editingRes) {
      const res = await api.put(`/reservations/${editingRes.RESERVATION_ID}`, {
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        room_type_id: form.room_type_id,
        special_requests: form.special_requests,
      })
      if (res.success) {
        toast.success('Reservation updated', { description: `Reservation #${editingRes.RESERVATION_ID} has been saved.` })
        setShowForm(false)
        loadReservations()
      } else {
        setError(res.error || 'Failed to update reservation')
        toast.error('Update failed', { description: res.error })
      }
    } else {
      const res = await api.post('/reservations', form)
      if (res.success) {
        toast.success('Reservation created', { description: 'Your new reservation has been listed.' })
        setShowForm(false)
        loadReservations()
      } else {
        setError(res.error || 'Failed to create reservation')
        toast.error('Create failed', { description: res.error })
      }
    }
    setSaving(false)
  }

  async function handleConfirm(id: number) {
    if (!confirm('Confirm this reservation?')) return
    const res = await api.post(`/reservations/${id}/confirm`)
    if (res.success) {
      toast.success(`Reservation #${id} confirmed`)
      loadReservations()
    } else {
      setError(res.error || 'Failed to confirm reservation')
      toast.error('Confirm failed', { description: res.error })
    }
  }

  async function handleCancel(id: number) {
    if (!confirm('Cancel this reservation?')) return
    const res = await api.post(`/reservations/${id}/cancel`)
    if (res.success) {
      toast.success(`Reservation #${id} cancelled`)
      loadReservations()
    } else {
      setError(res.error || 'Failed to cancel reservation')
      toast.error('Cancel failed', { description: res.error })
    }
  }

  function getGuestName(guestId: number) {
    return `Guest #${guestId}`
  }

  function getTypeName(typeId: number) {
    return roomTypes.find(t => t.type_id === typeId)?.type_name || `Type ${typeId}`
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Reservations</h1>
          <p className="mt-1 text-steel-600">Create and manage hotel reservations.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> New Reservation
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Filters */}
      <Card className="mt-6 animate-slide-up">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={filterStatus || 'all'}
                onValueChange={v => { setFilterStatus(v === 'all' ? '' : v); setPage(1) }}
              >
                <SelectTrigger className="h-10 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                  <SelectItem value="CHECKED_IN">Checked In</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {filterStatus && (
              <Button variant="ghost" size="sm" onClick={() => { setFilterStatus(''); setPage(1) }}>
                Clear filter
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Reservation cards */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : reservations.length === 0 ? (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Inbox className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No reservations found</p>
            <p className="mt-1 text-sm text-steel-500">
              {filterStatus ? 'Try a different status filter.' : 'Create your first reservation to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {reservations.map((res, i) => (
            <Card
              key={res.RESERVATION_ID}
              className="group animate-slide-up transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <div className="h-1 w-full bg-primary-500 transition-colors duration-200 group-hover:bg-accent-500" />
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">#{res.RESERVATION_ID}</Badge>
                    <span className="text-sm font-semibold text-[#1a1a1a]">
                      {getTypeName(res.ROOM_TYPE_ID)}
                    </span>
                  </div>
                  <Badge variant={statusVariant[res.STATUS] ?? 'neutral'}>
                    {statusLabel[res.STATUS] ?? res.STATUS}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                    <UserRound className="h-4 w-4 text-primary-600" />
                  </div>
                  <p className="font-display text-base font-bold text-[#1a1a1a]">
                    {getGuestName(res.GUEST_ID)}
                  </p>
                </div>

                {/* Timeline-style dates */}
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-dust-50 px-3 py-2 text-sm text-steel-700">
                  <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
                  <span className="font-medium">{res.CHECK_IN_DATE}</span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-accent-600" />
                  <span className="font-medium">{res.CHECK_OUT_DATE}</span>
                </div>

                {/* Quick actions */}
                <div className="mt-4 flex flex-wrap gap-2 border-t border-dust-200 pt-4">
                  {res.STATUS === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={() => handleConfirm(res.RESERVATION_ID)}
                    >
                      <Check className="h-3.5 w-3.5" /> Confirm
                    </Button>
                  )}
                  {res.STATUS === 'PENDING' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => openEdit(res)}
                    >
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Button>
                  )}
                  {(res.STATUS === 'PENDING' || res.STATUS === 'CONFIRMED') && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleCancel(res.RESERVATION_ID)}
                    >
                      <X className="h-3.5 w-3.5" /> Cancel
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dust-300/60 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-steel-600">
            Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, total)} of {total} reservations
          </p>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Form */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingRes ? 'Edit Reservation' : 'New Reservation'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!editingRes && (
              <div className="space-y-1.5">
                <Label htmlFor="guest_search">Search Guest *</Label>
                <Input
                  id="guest_search"
                  placeholder="Type name or email to search..."
                  value={guestSearch}
                  onChange={e => setGuestSearch(e.target.value)}
                />
                {guests.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-lg border border-dust-300 bg-white shadow-card">
                    {guests.map(g => (
                      <button
                        key={g.GUEST_ID}
                        className="w-full px-3 py-2 text-left text-sm transition-colors hover:bg-primary-50"
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
                  <p className="flex items-center gap-1 text-sm text-green-700">
                    <Check className="h-3.5 w-3.5" />
                    Selected: {selectedGuest.FIRST_NAME} {selectedGuest.LAST_NAME}
                  </p>
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label>Room Type *</Label>
              <Select
                value={String(form.room_type_id)}
                onValueChange={v => setForm({ ...form, room_type_id: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomTypes.map(t => (
                    <SelectItem key={t.type_id} value={String(t.type_id)}>
                      {t.type_name} — {formatCurrency(t.base_price)}/night
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="check_in">Check-in Date *</Label>
                <Input
                  id="check_in"
                  type="date"
                  value={form.check_in_date}
                  onChange={e => setForm({ ...form, check_in_date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="check_out">Check-out Date *</Label>
                <Input
                  id="check_out"
                  type="date"
                  value={form.check_out_date}
                  onChange={e => setForm({ ...form, check_out_date: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="special_requests">Special Requests</Label>
              <Textarea
                id="special_requests"
                rows={2}
                value={form.special_requests}
                onChange={e => setForm({ ...form, special_requests: e.target.value })}
                placeholder="Optional special requests..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={
                saving ||
                (!editingRes && !form.guest_id) ||
                !form.check_in_date ||
                !form.check_out_date
              }
            >
              {saving ? 'Saving…' : editingRes ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
