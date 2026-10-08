import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  Clock,
  Inbox,
  LogIn,
  Sparkles,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type {
  AvailableRoom,
  CheckinRecord,
  GuestListItem,
  PaginatedResponse,
  ProcessCheckInResult,
  ReservationListItem,
  RoomType,
  WalkInPayload,
  WalkInResult,
} from '../types'

const ID_TYPES = [
  { value: 'PASSPORT', label: 'Passport' },
  { value: 'NATIONAL_ID', label: 'National ID' },
  { value: 'DRIVERS_LICENSE', label: "Driver's License" },
  { value: 'OTHER', label: 'Other' },
]

function localDate(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function CheckInPage() {
  const today = localDate(0)

  const [tab, setTab] = useState('arrivals')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [checkins, setCheckins] = useState<CheckinRecord[]>([])
  const [reservations, setReservations] = useState<ReservationListItem[]>([])
  const [guestNames, setGuestNames] = useState<Map<number, string>>(new Map())
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])

  // Arrival check-in dialog
  const [checkinRes, setCheckinRes] = useState<ReservationListItem | null>(null)
  const [availRooms, setAvailRooms] = useState<AvailableRoom[]>([])
  const [availLoading, setAvailLoading] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState(0)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  // Walk-in form
  const [walk, setWalk] = useState<WalkInPayload & { guest_email: string }>({
    guest_name: '',
    guest_email: '',
    guest_phone: '',
    id_type: 'PASSPORT',
    id_number: '',
    room_type_id: 1,
    room_id: 0,
    check_in_date: localDate(0),
    check_out_date: localDate(1),
    num_guests: 2,
    notes: '',
  })
  const [walkRooms, setWalkRooms] = useState<AvailableRoom[]>([])
  const [walkLoading, setWalkLoading] = useState(false)
  const [walkBusy, setWalkBusy] = useState(false)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setLoading(true)
    const [ciRes, resRes, guestRes, typeRes] = await Promise.all([
      api.get<CheckinRecord[]>('/checkin/list'),
      api.get<PaginatedResponse<ReservationListItem>>('/reservations?status=CONFIRMED&pageSize=100'),
      api.get<PaginatedResponse<GuestListItem>>('/guests?page=1&pageSize=200'),
      api.get<RoomType[]>('/rooms/types'),
    ])
    if (ciRes.success && ciRes.data) {
      setCheckins(
        [...ciRes.data].sort((a, b) =>
          String(b.ACTUAL_CHECK_IN).localeCompare(String(a.ACTUAL_CHECK_IN))
        )
      )
    } else setError(ciRes.error || 'Failed to load check-ins')
    if (resRes.success && resRes.data) setReservations(resRes.data.items)
    if (guestRes.success && guestRes.data) {
      setGuestNames(new Map(guestRes.data.items.map(g => [g.GUEST_ID, `${g.FIRST_NAME} ${g.LAST_NAME}`])))
    }
    if (typeRes.success && typeRes.data) setRoomTypes(typeRes.data)
    setLoading(false)
  }

  function guestName(id: number) {
    return guestNames.get(id) || `Guest #${id}`
  }

  function typeName(id: number) {
    return roomTypes.find(t => t.type_id === id)?.type_name || `Type ${id}`
  }

  const dueArrivals = reservations
    .filter(r => r.CHECK_IN_DATE <= today)
    .sort((a, b) => a.CHECK_IN_DATE.localeCompare(b.CHECK_IN_DATE))
  const upcomingArrivals = reservations
    .filter(r => r.CHECK_IN_DATE > today)
    .sort((a, b) => a.CHECK_IN_DATE.localeCompare(b.CHECK_IN_DATE))

  async function openCheckIn(res: ReservationListItem) {
    setCheckinRes(res)
    setSelectedRoom(0)
    setNotes('')
    setAvailRooms([])
    setAvailLoading(true)
    const resp = await api.get<{ available: number; rooms: AvailableRoom[] }>(
      `/reservations/availability?check_in=${res.CHECK_IN_DATE}&check_out=${res.CHECK_OUT_DATE}&room_type=${res.ROOM_TYPE_ID}`
    )
    if (resp.success && resp.data) setAvailRooms(resp.data.rooms)
    setAvailLoading(false)
  }

  async function confirmCheckIn() {
    if (!checkinRes || !selectedRoom || busy) return
    setBusy(true)
    const res = await api.post<ProcessCheckInResult>('/checkin/process', {
      reservation_id: checkinRes.RESERVATION_ID,
      room_id: selectedRoom,
      notes: notes.trim(),
    })
    setBusy(false)
    if (res.success && res.data) {
      toast.success('Guest checked in', {
        description: `Room ${res.data.room_number} — reservation #${checkinRes.RESERVATION_ID}.`,
      })
      setCheckinRes(null)
      loadAll()
    } else {
      toast.error('Check-in failed', { description: res.error })
    }
  }

  async function loadWalkRooms() {
    if (!walk.check_in_date || !walk.check_out_date) {
      toast.error('Select both dates first')
      return
    }
    if (walk.check_out_date <= walk.check_in_date) {
      toast.error('Check-out must be after check-in')
      return
    }
    setWalkLoading(true)
    setWalkRooms([])
    setWalk(w => ({ ...w, room_id: 0 }))
    const res = await api.get<{ available: number; rooms: AvailableRoom[] }>(
      `/reservations/availability?check_in=${walk.check_in_date}&check_out=${walk.check_out_date}&room_type=${walk.room_type_id}`
    )
    setWalkLoading(false)
    if (res.success && res.data) {
      setWalkRooms(res.data.rooms)
      if (res.data.rooms.length === 0) {
        toast.error('No rooms available', { description: 'Try different dates or another room type.' })
      }
    } else {
      toast.error('Availability check failed', { description: res.error })
    }
  }

  function updateWalk<K extends keyof typeof walk>(key: K, value: (typeof walk)[K]) {
    setWalk(w => ({ ...w, [key]: value }))
    if (key === 'room_type_id' || key === 'check_in_date' || key === 'check_out_date') {
      setWalkRooms([])
      setWalk(w => ({ ...w, [key]: value, room_id: 0 }))
    }
  }

  async function submitWalkIn() {
    if (walkBusy) return
    if (walk.guest_name.trim().length < 3) return toast.error('Enter the customer full name')
    if (walk.guest_phone.replace(/\D/g, '').length < 7) return toast.error('Enter a valid phone number')
    if (walk.id_number.trim().length < 4) return toast.error('Enter the ID document number')
    if (walk.check_in_date < today) return toast.error('Check-in cannot be in the past')
    if (walk.check_out_date <= walk.check_in_date) return toast.error('Check-out must be after check-in')
    if (walk.num_guests < 1) return toast.error('At least one guest is required')
    if (!walk.room_id) return toast.error('Select a room')

    setWalkBusy(true)
    const res = await api.post<WalkInResult>('/checkin/walk-in', {
      ...walk,
      guest_email: walk.guest_email.trim() || undefined,
      notes: walk.notes?.trim() || undefined,
    })
    setWalkBusy(false)
    if (res.success && res.data) {
      toast.success(`Checked into room ${res.data.room_number}`, {
        description: `Booking #${res.data.booking_id} · ${res.data.nights} ${
          res.data.nights === 1 ? 'night' : 'nights'
        } · ${formatCurrency(res.data.total)}`,
      })
      setWalk(w => ({
        ...w,
        guest_name: '',
        guest_email: '',
        guest_phone: '',
        id_number: '',
        room_id: 0,
        notes: '',
      }))
      setWalkRooms([])
      setTab('arrivals')
      loadAll()
    } else {
      toast.error('Walk-in failed', { description: res.error })
    }
  }

  const activeRoomType = roomTypes.find(t => t.type_id === walk.room_type_id)

  return (
    <div>
      <div className="animate-slide-up">
        <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Check-in</h1>
        <p className="mt-1 text-steel-600">
          Check in arriving guests and walk-in customers — the current user performs the check-in.
        </p>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab} className="mt-6">
        <TabsList>
          <TabsTrigger value="arrivals">
            <Clock className="h-4 w-4" /> Arrivals
          </TabsTrigger>
          <TabsTrigger value="walkin">
            <Sparkles className="h-4 w-4" /> Walk-in
          </TabsTrigger>
        </TabsList>

        {/* ---------------- Arrivals ---------------- */}
        <TabsContent value="arrivals">
          {loading ? (
            <Card>
              <CardContent className="space-y-3 p-5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : reservations.length === 0 ? (
            <Card className="animate-fade-in">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
                  <Inbox className="h-7 w-7 text-steel-500" />
                </div>
                <p className="mt-4 font-medium text-steel-700">No confirmed reservations</p>
                <p className="mt-1 text-sm text-steel-500">
                  New reservations and approved booking requests will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="animate-fade-in">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reservation</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...dueArrivals, ...upcomingArrivals].map(res => (
                      <TableRow key={res.RESERVATION_ID}>
                        <TableCell className="font-medium">#{res.RESERVATION_ID}</TableCell>
                        <TableCell>
                          <p className="font-medium">{guestName(res.GUEST_ID)}</p>
                          {res.SPECIAL_REQUESTS && (
                            <p className="max-w-[200px] truncate text-xs text-steel-500">
                              {res.SPECIAL_REQUESTS}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{typeName(res.ROOM_TYPE_ID)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {res.CHECK_IN_DATE} → {res.CHECK_OUT_DATE}
                        </TableCell>
                        <TableCell>
                          {res.CHECK_IN_DATE <= today ? (
                            <Badge variant="warning">Due now</Badge>
                          ) : (
                            <Badge variant="neutral">{res.CHECK_IN_DATE}</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={res.CHECK_IN_DATE <= today ? 'accent' : 'secondary'}
                            onClick={() => openCheckIn(res)}
                          >
                            <LogIn className="h-3.5 w-3.5" /> Check in
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ---------------- Walk-in ---------------- */}
        <TabsContent value="walkin">
          <Card className="animate-fade-in">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-500">
                  <UserRound className="h-5 w-5 text-primary-900" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">
                    New walk-in customer
                  </h2>
                  <p className="text-sm text-steel-500">
                    Enter the customer's details, pick a room, and check them in immediately.
                  </p>
                </div>
              </div>

              {/* Customer details */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="w_name">Full name *</Label>
                  <Input
                    id="w_name"
                    placeholder="e.g. Jane Doe"
                    value={walk.guest_name}
                    onChange={e => updateWalk('guest_name', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w_phone">Phone *</Label>
                  <Input
                    id="w_phone"
                    placeholder="+1-555-0100"
                    value={walk.guest_phone}
                    onChange={e => updateWalk('guest_phone', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w_email">Email</Label>
                  <Input
                    id="w_email"
                    type="email"
                    placeholder="Optional"
                    value={walk.guest_email}
                    onChange={e => updateWalk('guest_email', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="w_id_type">ID type *</Label>
                    <Select value={walk.id_type} onValueChange={v => updateWalk('id_type', v)}>
                      <SelectTrigger id="w_id_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="w_id_number">ID number *</Label>
                    <Input
                      id="w_id_number"
                      placeholder="Document #"
                      value={walk.id_number}
                      onChange={e => updateWalk('id_number', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Stay details */}
              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div className="space-y-1.5">
                  <Label htmlFor="w_checkin">Check-in *</Label>
                  <Input
                    id="w_checkin"
                    type="date"
                    min={today}
                    value={walk.check_in_date}
                    onChange={e => updateWalk('check_in_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w_checkout">Check-out *</Label>
                  <Input
                    id="w_checkout"
                    type="date"
                    min={walk.check_in_date || today}
                    value={walk.check_out_date}
                    onChange={e => updateWalk('check_out_date', e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="w_guests">Guests *</Label>
                  <Input
                    id="w_guests"
                    type="number"
                    min={1}
                    max={10}
                    value={walk.num_guests}
                    onChange={e => updateWalk('num_guests', Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Room type *</Label>
                  <Select
                    value={String(walk.room_type_id)}
                    onValueChange={v => updateWalk('room_type_id', Number(v))}
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
              </div>

              <div className="mt-4 flex items-end gap-3">
                <Button variant="secondary" onClick={loadWalkRooms} disabled={walkLoading}>
                  {walkLoading ? 'Checking…' : 'Check room availability'}
                </Button>
                <p className="pb-1 text-xs text-steel-500">
                  {activeRoomType
                    ? `${activeRoomType.type_name} sleeps up to ${activeRoomType.max_occupancy} · ${formatCurrency(activeRoomType.base_price)}/night`
                    : 'Select dates and a room type, then check availability.'}
                </p>
              </div>

              {/* Room picker */}
              {walkLoading ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-xl" />
                  ))}
                </div>
              ) : walkRooms.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {walkRooms.map(room => (
                    <button
                      key={room.room_id}
                      type="button"
                      onClick={() => updateWalk('room_id', room.room_id)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        walk.room_id === room.room_id
                          ? 'border-accent-500 bg-accent-50 shadow-md'
                          : 'border-dust-300 bg-white hover:-translate-y-0.5 hover:border-primary-400 hover:shadow-md'
                      }`}
                    >
                      <p className="font-display text-xl font-bold text-primary-700">
                        {room.room_number}
                      </p>
                      <p className="mt-1 text-xs text-steel-500">{room.type_name}</p>
                      <p className="mt-2 text-sm font-semibold text-[#1a1a1a]">
                        {formatCurrency(room.total)}
                      </p>
                      <p className="text-[11px] text-steel-400">total stay</p>
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 space-y-1.5">
                <Label htmlFor="w_notes">Notes</Label>
                <Textarea
                  id="w_notes"
                  rows={2}
                  placeholder="Arrival time, preferences, ID verified, etc."
                  value={walk.notes ?? ''}
                  onChange={e => updateWalk('notes', e.target.value)}
                />
              </div>

              <div className="mt-5 flex justify-end border-t border-dust-200 pt-5">
                <Button
                  variant="accent"
                  size="lg"
                  onClick={submitWalkIn}
                  disabled={walkBusy || !walk.room_id}
                >
                  {walkBusy ? 'Checking in…' : 'Check in customer'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Recent check-ins */}
      <Card className="mt-6 animate-slide-up">
        <div className="h-1 w-full bg-primary-500" />
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary-500" />
            <h2 className="font-display text-lg font-semibold text-[#1a1a1a]">Recent check-ins</h2>
            <Badge variant="neutral">{checkins.length}</Badge>
          </div>

          {loading ? (
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : checkins.length === 0 ? (
            <p className="py-10 text-center text-sm text-steel-500">
              No check-ins yet — processed check-ins appear here.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Guest</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Stay</TableHead>
                    <TableHead>Checked in</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checkins.slice(0, 25).map(c => (
                    <TableRow key={c.CHECKIN_ID}>
                      <TableCell className="font-medium">{c.CHECKIN_ID}</TableCell>
                      <TableCell className="font-medium">
                        {c.FIRST_NAME} {c.LAST_NAME}
                      </TableCell>
                      <TableCell>
                        <Badge variant="info">{c.ROOM_NUMBER}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">
                        {String(c.CHECK_IN_DATE).slice(0, 10)} → {String(c.CHECK_OUT_DATE).slice(0, 10)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-steel-600">
                        {new Date(c.ACTUAL_CHECK_IN).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-sm text-steel-500">
                        {c.NOTES || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Arrival check-in dialog */}
      <Dialog open={!!checkinRes} onOpenChange={open => !open && setCheckinRes(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Check in reservation #{checkinRes?.RESERVATION_ID}
            </DialogTitle>
          </DialogHeader>
          {checkinRes && (
            <div className="space-y-4">
              <div className="rounded-lg bg-dust-50 p-4 text-sm">
                <p className="font-display font-bold text-[#1a1a1a]">
                  {guestName(checkinRes.GUEST_ID)}
                </p>
                <p className="text-steel-600">{typeName(checkinRes.ROOM_TYPE_ID)}</p>
                <p className="mt-1 text-steel-600">
                  {checkinRes.CHECK_IN_DATE} → {checkinRes.CHECK_OUT_DATE}
                </p>
                {checkinRes.SPECIAL_REQUESTS && (
                  <p className="mt-1 text-steel-500">{checkinRes.SPECIAL_REQUESTS}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Assign room *</Label>
                {availLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select
                    value={selectedRoom ? String(selectedRoom) : 'none'}
                    onValueChange={v => setSelectedRoom(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a room…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" disabled>
                        Select a room…
                      </SelectItem>
                      {availRooms.map(r => (
                        <SelectItem key={r.room_id} value={String(r.room_id)}>
                          Room {r.room_number} — {formatCurrency(r.total)} total
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {!availLoading && availRooms.length === 0 && (
                  <p className="text-sm text-red-600">
                    No available rooms for this type and dates.
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ci_notes">Notes</Label>
                <Textarea
                  id="ci_notes"
                  rows={2}
                  placeholder="Optional notes…"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setCheckinRes(null)}>Cancel</Button>
            <Button
              variant="accent"
              disabled={!selectedRoom || busy || availLoading}
              onClick={confirmCheckIn}
            >
              {busy ? (
                'Processing…'
              ) : (
                <>
                  <Check className="h-4 w-4" /> Confirm check-in
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
