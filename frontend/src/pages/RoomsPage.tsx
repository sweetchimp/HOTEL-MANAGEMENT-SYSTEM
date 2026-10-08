import { useEffect, useState } from 'react'
import {
  BedDouble,
  Plus,
  Pencil,
  Trash2,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
import type { RoomListItem, RoomType, PaginatedResponse } from '../types'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'neutral'> = {
  AVAILABLE: 'success',
  OCCUPIED: 'destructive',
  MAINTENANCE: 'warning',
  RESERVED: 'info',
}

const statusLabel: Record<string, string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  MAINTENANCE: 'Maintenance',
  RESERVED: 'Reserved',
}

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
  const [saving, setSaving] = useState(false)
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
    let url = `/rooms?page=${page}&pageSize=12`
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
    setSaving(true)

    if (editingRoom) {
      const res = await api.put(`/rooms/${editingRoom.ROOM_ID}`, form)
      if (res.success) {
        toast.success('Room updated', { description: `Room ${form.room_number} has been saved.` })
        setShowForm(false)
        loadRooms()
      } else {
        setError(res.error || 'Failed to update room')
        toast.error('Update failed', { description: res.error })
      }
    } else {
      const res = await api.post('/rooms', form)
      if (res.success) {
        toast.success('Room created', { description: `Room ${form.room_number} is now listed.` })
        setShowForm(false)
        loadRooms()
      } else {
        setError(res.error || 'Failed to create room')
        toast.error('Create failed', { description: res.error })
      }
    }
    setSaving(false)
  }

  async function handleDelete(id: number) {
    if (!confirm('Delete this room?')) return
    const res = await api.delete(`/rooms/${id}`)
    if (res.success) {
      toast.success('Room deleted')
      loadRooms()
    } else {
      setError(res.error || 'Failed to delete room')
      toast.error('Delete failed', { description: res.error })
    }
  }

  async function handleStatusChange(id: number, status: string) {
    const res = await api.patch(`/rooms/${id}/status`, { status })
    if (res.success) {
      toast.success(`Room marked ${statusLabel[status]?.toLowerCase() ?? status.toLowerCase()}`)
      loadRooms()
    } else {
      setError(res.error || 'Failed to update status')
      toast.error('Status update failed', { description: res.error })
    }
  }

  function getTypeName(typeId: number) {
    return roomTypes.find(t => t.type_id === typeId)?.type_name || `Type ${typeId}`
  }

  const totalPages = Math.ceil(total / 12)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Rooms</h1>
          <p className="mt-1 text-steel-600">Manage hotel rooms and their status.</p>
        </div>
        {isAdmin && (
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" /> Add Room
          </Button>
        )}
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
                <SelectTrigger className="h-10 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="AVAILABLE">Available</SelectItem>
                  <SelectItem value="OCCUPIED">Occupied</SelectItem>
                  <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                  <SelectItem value="RESERVED">Reserved</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={filterType || 'all'}
                onValueChange={v => { setFilterType(v === 'all' ? '' : v); setPage(1) }}
              >
                <SelectTrigger className="h-10 w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {roomTypes.map(t => (
                    <SelectItem key={t.type_id} value={String(t.type_id)}>
                      {t.type_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Floor</Label>
              <Select
                value={filterFloor || 'all'}
                onValueChange={v => { setFilterFloor(v === 'all' ? '' : v); setPage(1) }}
              >
                <SelectTrigger className="h-10 w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All floors</SelectItem>
                  {[1, 2, 3, 4, 5, 6].map(f => (
                    <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {(filterStatus || filterType || filterFloor) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setFilterStatus(''); setFilterType(''); setFilterFloor(''); setPage(1) }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Room cards */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-28 w-full rounded-none" />
              <CardContent className="space-y-3 p-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Inbox className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No rooms found</p>
            <p className="mt-1 text-sm text-steel-500">
              Try adjusting your filters or add a new room.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {rooms.map((room, i) => (
            <Card
              key={room.ROOM_ID}
              className="group animate-slide-up overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              {/* Image placeholder */}
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                <BedDouble className="h-12 w-12 text-accent-400/80 transition-transform duration-300 group-hover:scale-110" />
                <Badge
                  variant={statusVariant[room.STATUS] ?? 'neutral'}
                  className="absolute right-3 top-3 shadow-sm"
                >
                  {statusLabel[room.STATUS] ?? room.STATUS}
                </Badge>
              </div>

              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold text-[#1a1a1a]">
                      Room {room.ROOM_NUMBER}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-steel-600">
                      {getTypeName(room.TYPE_ID)} &middot; Floor {room.FLOOR}
                    </p>
                  </div>
                </div>
                {room.DESCRIPTION && (
                  <p className="mt-2 line-clamp-2 text-xs text-steel-500">
                    {room.DESCRIPTION}
                  </p>
                )}

                {isAdmin && (
                  <div className="mt-4 flex items-center gap-2">
                    <Select
                      value={room.STATUS}
                      onValueChange={v => handleStatusChange(room.ROOM_ID, v)}
                    >
                      <SelectTrigger className="h-9 flex-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AVAILABLE">Available</SelectItem>
                        <SelectItem value="OCCUPIED">Occupied</SelectItem>
                        <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                        <SelectItem value="RESERVED">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-9 w-9 shrink-0"
                      onClick={() => openEdit(room)}
                      aria-label="Edit room"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleDelete(room.ROOM_ID)}
                      aria-label="Delete room"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between rounded-xl border border-dust-300/60 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-steel-600">
            Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, total)} of {total} rooms
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="room_number">Room Number</Label>
              <Input
                id="room_number"
                value={form.room_number}
                onChange={e => setForm({ ...form, room_number: e.target.value })}
                placeholder="e.g. 101"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select
                  value={String(form.type_id)}
                  onValueChange={v => setForm({ ...form, type_id: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roomTypes.map(t => (
                      <SelectItem key={t.type_id} value={String(t.type_id)}>
                        {t.type_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Floor</Label>
                <Select
                  value={String(form.floor)}
                  onValueChange={v => setForm({ ...form, floor: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map(f => (
                      <SelectItem key={f} value={String(f)}>Floor {f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving || !form.room_number}>
              {saving ? 'Saving…' : editingRoom ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
