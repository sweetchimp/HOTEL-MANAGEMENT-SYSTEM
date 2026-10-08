import { useEffect, useState } from 'react'
import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  History,
  Inbox,
  Search,
  UserRound,
  X,
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
import type { BookingRequest, PaginatedResponse, RoomType } from '../types'

const statusVariant: Record<string, 'success' | 'destructive' | 'warning' | 'info' | 'neutral'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'destructive',
}

const statusLabel: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
}

const ID_TYPE_LABELS: Record<string, string> = {
  PASSPORT: 'Passport',
  NATIONAL_ID: 'National ID',
  DRIVERS_LICENSE: "Driver's License",
  OTHER: 'Other',
}

const PAGE_SIZE = 12

export default function AdminBookingRequestsPage() {
  const [tab, setTab] = useState('pending')
  const [items, setItems] = useState<BookingRequest[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [search, setSearch] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [sort, setSort] = useState('newest')

  // Dialogs
  const [viewing, setViewing] = useState<BookingRequest | null>(null)
  const [rejecting, setRejecting] = useState<BookingRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadRoomTypes()
  }, [])

  useEffect(() => {
    const t = setTimeout(() => loadRequests(), search ? 300 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, page, search, from, to, sort])

  async function loadRoomTypes() {
    const res = await api.get<RoomType[]>('/rooms/types')
    if (res.success && res.data) setRoomTypes(res.data)
  }

  async function loadRequests() {
    setLoading(true)
    let url = `/bookings/requests?status=${tab}&page=${page}&pageSize=${PAGE_SIZE}&sort=${sort}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    if (from) url += `&from=${from}`
    if (to) url += `&to=${to}`

    const res = await api.get<PaginatedResponse<BookingRequest>>(url)
    if (res.success && res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setError('')
    } else {
      setError(res.error || 'Failed to load booking requests')
    }
    setLoading(false)
  }

  function typeName(typeId: number) {
    return roomTypes.find(t => t.type_id === typeId)?.type_name || `Type ${typeId}`
  }

  function nightsOf(r: BookingRequest) {
    const n = Math.round(
      (new Date(r.CHECK_OUT_DATE).getTime() - new Date(r.CHECK_IN_DATE).getTime()) / 86400000,
    )
    return n > 0 ? n : 1
  }

  async function handleApprove(r: BookingRequest) {
    if (busy) return
    if (!confirm(`Approve booking request #${r.ID} for ${r.GUEST_NAME}? A reservation will be created.`))
      return
    setBusy(true)
    const res = await api.put<{ reservation_id: number }>(`/bookings/${r.ID}/approve`)
    setBusy(false)
    if (res.success) {
      toast.success(`Request #${r.ID} approved`, {
        description: `Reservation #${res.data?.reservation_id} created.`,
      })
      setViewing(null)
      loadRequests()
    } else {
      toast.error('Approval failed', { description: res.error })
    }
  }

  function openReject(r: BookingRequest) {
    setRejecting(r)
    setRejectReason('')
  }

  async function handleReject() {
    if (!rejecting || busy) return
    if (!rejectReason.trim()) {
      toast.error('A reason is required to reject a request')
      return
    }
    setBusy(true)
    const res = await api.put(`/bookings/${rejecting.ID}/reject`, { reason: rejectReason.trim() })
    setBusy(false)
    if (res.success) {
      toast.success(`Request #${rejecting.ID} rejected`)
      setRejecting(null)
      setViewing(null)
      loadRequests()
    } else {
      toast.error('Rejection failed', { description: res.error })
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  const filterBar = (
    <Card className="animate-slide-up">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[220px] flex-1 space-y-1">
            <Label htmlFor="req_search">Search</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
              <Input
                id="req_search"
                placeholder="Name or email…"
                className="pl-9"
                value={search}
                onChange={e => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="req_from">Stay from</Label>
            <Input
              id="req_from"
              type="date"
              className="w-40"
              value={from}
              onChange={e => {
                setFrom(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="req_to">Stay to</Label>
            <Input
              id="req_to"
              type="date"
              className="w-40"
              value={to}
              onChange={e => {
                setTo(e.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="space-y-1">
            <Label>Sort</Label>
            <Select value={sort} onValueChange={v => { setSort(v); setPage(1) }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest first</SelectItem>
                <SelectItem value="oldest">Oldest first</SelectItem>
                <SelectItem value="stay">Stay date</SelectItem>
                <SelectItem value="price">Price (high–low)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {(search || from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setFrom('')
                setTo('')
                setPage(1)
              }}
            >
              Clear filters
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )

  const emptyState = (
    <Card className="mt-6 animate-fade-in">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
          {tab === 'pending' ? (
            <Inbox className="h-7 w-7 text-steel-500" />
          ) : (
            <History className="h-7 w-7 text-steel-500" />
          )}
        </div>
        <p className="mt-4 font-medium text-steel-700">
          {tab === 'pending' ? 'No pending booking requests' : `No ${tab} requests`}
        </p>
        <p className="mt-1 text-sm text-steel-500">
          {search || from || to ? 'Try different filters.' : 'New online requests will appear here.'}
        </p>
      </CardContent>
    </Card>
  )

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Booking Requests</h1>
          <p className="mt-1 text-steel-600">Review and approve online booking requests.</p>
        </div>
        <Badge variant="warning">
          {items.filter(i => i.STATUS === 'pending').length} shown · {total} total
        </Badge>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="mt-6">{filterBar}</div>

      <Tabs
        value={tab}
        onValueChange={v => {
          setTab(v)
          setPage(1)
        }}
        className="mt-4"
      >
        <TabsList>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          {loading ? (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="space-y-3 p-5">
                    <div className="flex justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-9 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : items.length === 0 ? (
            emptyState
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
              {items.map((r, i) => (
                <Card
                  key={r.ID}
                  className="group animate-slide-up transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
                  style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
                >
                  <div className="h-1 w-full bg-primary-500 transition-colors duration-200 group-hover:bg-accent-500" />
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral">#{r.ID}</Badge>
                        <span className="text-sm font-semibold text-[#1a1a1a]">
                          {typeName(r.ROOM_TYPE_ID)}
                          {r.ROOM_ID ? ` · Room ${r.ROOM_ID}` : ''}
                        </span>
                      </div>
                      <Badge variant={statusVariant[r.STATUS] ?? 'neutral'}>
                        {statusLabel[r.STATUS] ?? r.STATUS}
                      </Badge>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100">
                        <UserRound className="h-4 w-4 text-primary-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-display text-base font-bold text-[#1a1a1a]">
                          {r.GUEST_NAME}
                        </p>
                        <p className="truncate text-xs text-steel-500">{r.GUEST_EMAIL}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-dust-50 px-3 py-2 text-sm text-steel-700">
                      <CalendarDays className="h-4 w-4 shrink-0 text-primary-500" />
                      <span className="font-medium">{r.CHECK_IN_DATE}</span>
                      <span className="text-accent-600">→</span>
                      <span className="font-medium">{r.CHECK_OUT_DATE}</span>
                      <span className="ml-auto font-semibold text-primary-700">
                        {formatCurrency(r.TOTAL_PRICE)}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 border-t border-dust-200 pt-4">
                      <Button size="sm" variant="accent" disabled={busy} onClick={() => handleApprove(r)}>
                        <Check className="h-3.5 w-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => openReject(r)}
                      >
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="approved">
          {loading ? (
            <Card className="mt-6">
              <CardContent className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            emptyState
          ) : (
            <Card className="mt-6 animate-fade-in">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Requested</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(r => (
                      <TableRow key={r.ID}>
                        <TableCell className="font-medium">#{r.ID}</TableCell>
                        <TableCell>
                          <p className="font-medium">{r.GUEST_NAME}</p>
                          <p className="text-xs text-steel-500">{r.GUEST_EMAIL}</p>
                        </TableCell>
                        <TableCell>
                          {typeName(r.ROOM_TYPE_ID)}
                          {r.ROOM_ID ? '' : ' · best room'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {r.CHECK_IN_DATE} → {r.CHECK_OUT_DATE}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(r.TOTAL_PRICE)}
                        </TableCell>
                        <TableCell className="text-sm text-steel-500">
                          {r.CREATED_AT.slice(0, 10)}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          {loading ? (
            <Card className="mt-6">
              <CardContent className="space-y-3 p-5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            emptyState
          ) : (
            <Card className="mt-6 animate-fade-in">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ref</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Room</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead>Rejection reason</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map(r => (
                      <TableRow key={r.ID}>
                        <TableCell className="font-medium">#{r.ID}</TableCell>
                        <TableCell>
                          <p className="font-medium">{r.GUEST_NAME}</p>
                          <p className="text-xs text-steel-500">{r.GUEST_EMAIL}</p>
                        </TableCell>
                        <TableCell>{typeName(r.ROOM_TYPE_ID)}</TableCell>
                        <TableCell className="whitespace-nowrap text-sm">
                          {r.CHECK_IN_DATE} → {r.CHECK_OUT_DATE}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(r.TOTAL_PRICE)}
                        </TableCell>
                        <TableCell className="max-w-[220px] text-sm text-steel-600">
                          <span className="line-clamp-2">{r.REJECTION_REASON || '—'}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => setViewing(r)}>
                              View
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dust-300/60 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-steel-600">
            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} requests
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

      {/* Detail dialog */}
      <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Booking Request #{viewing?.ID}{' '}
              {viewing && (
                <Badge variant={statusVariant[viewing.STATUS] ?? 'neutral'}>
                  {statusLabel[viewing.STATUS] ?? viewing.STATUS}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-x-6 gap-y-2 rounded-lg bg-dust-50 p-4 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-steel-500">Guest</p>
                  <p className="font-medium text-[#1a1a1a]">{viewing.GUEST_NAME}</p>
                </div>
                <div>
                  <p className="text-steel-500">Email</p>
                  <p className="break-all font-medium text-[#1a1a1a]">{viewing.GUEST_EMAIL}</p>
                </div>
                <div>
                  <p className="text-steel-500">Phone</p>
                  <p className="font-medium text-[#1a1a1a]">{viewing.GUEST_PHONE}</p>
                </div>
                <div>
                  <p className="text-steel-500">ID</p>
                  <p className="font-medium text-[#1a1a1a]">
                    {ID_TYPE_LABELS[viewing.ID_TYPE] ?? viewing.ID_TYPE} · {viewing.ID_NUMBER}
                  </p>
                </div>
                <div>
                  <p className="text-steel-500">Stay</p>
                  <p className="font-medium text-[#1a1a1a]">
                    {viewing.CHECK_IN_DATE} → {viewing.CHECK_OUT_DATE} ({nightsOf(viewing)}{' '}
                    {nightsOf(viewing) === 1 ? 'night' : 'nights'})
                  </p>
                </div>
                <div>
                  <p className="text-steel-500">Guests</p>
                  <p className="font-medium text-[#1a1a1a]">{viewing.NUM_GUESTS}</p>
                </div>
                <div>
                  <p className="text-steel-500">Room</p>
                  <p className="font-medium text-[#1a1a1a]">
                    {typeName(viewing.ROOM_TYPE_ID)}
                    {viewing.ROOM_ID ? ` (room ${viewing.ROOM_ID})` : ' (no preference)'}
                  </p>
                </div>
                <div>
                  <p className="text-steel-500">Total</p>
                  <p className="font-semibold text-primary-700">
                    {formatCurrency(viewing.TOTAL_PRICE)}
                  </p>
                </div>
                {viewing.PAYMENT_METHOD && (
                  <div>
                    <p className="text-steel-500">Payment preference</p>
                    <p className="font-medium text-[#1a1a1a]">{viewing.PAYMENT_METHOD}</p>
                  </div>
                )}
                {viewing.PROMO_CODE && (
                  <div>
                    <p className="text-steel-500">Promo</p>
                    <p className="font-medium text-[#1a1a1a]">{viewing.PROMO_CODE}</p>
                  </div>
                )}
              </div>

              {viewing.SPECIAL_REQUESTS && (
                <div className="rounded-lg border border-dust-300 p-3 text-sm">
                  <p className="text-steel-500">Special requests</p>
                  <p className="mt-1 text-[#1a1a1a]">{viewing.SPECIAL_REQUESTS}</p>
                </div>
              )}

              {viewing.REJECTION_REASON && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm">
                  <p className="text-red-700">Rejection reason</p>
                  <p className="mt-1 text-red-800">{viewing.REJECTION_REASON}</p>
                </div>
              )}

              <div className="text-xs text-steel-500">
                Submitted {viewing.CREATED_AT.slice(0, 10)}
                {viewing.APPROVED_AT && ` · Approved ${viewing.APPROVED_AT.slice(0, 10)}`}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            {viewing?.STATUS === 'pending' && (
              <>
                <Button
                  variant="ghost"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => viewing && openReject(viewing)}
                >
                  Reject
                </Button>
                <Button variant="accent" disabled={busy} onClick={() => viewing && handleApprove(viewing)}>
                  <Check className="h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={open => !open && setRejecting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject request #{rejecting?.ID}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <p className="text-sm text-steel-600">
              {rejecting?.GUEST_NAME} will be emailed the reason below.
            </p>
            <Label htmlFor="reject_reason">Rejection reason *</Label>
            <Textarea
              id="reject_reason"
              rows={3}
              placeholder="e.g. No rooms available for the selected dates."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={busy || !rejectReason.trim()}
              onClick={handleReject}
            >
              {busy ? 'Rejecting…' : 'Reject request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
