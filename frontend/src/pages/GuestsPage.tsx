import { useEffect, useState } from 'react'
import {
  UserRound,
  Plus,
  Pencil,
  AlertCircle,
  Inbox,
  ChevronLeft,
  ChevronRight,
  Search,
  Mail,
  Phone,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  const [saving, setSaving] = useState(false)
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
    let url = `/guests?page=${page}&pageSize=12`
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
    setSaving(true)

    if (editingGuest) {
      const res = await api.put(`/guests/${editingGuest.GUEST_ID}`, form)
      if (res.success) {
        toast.success('Guest updated', {
          description: `${form.first_name} ${form.last_name} has been saved.`,
        })
        setShowForm(false)
        loadGuests()
      } else {
        setError(res.error || 'Failed to update guest')
        toast.error('Update failed', { description: res.error })
      }
    } else {
      const res = await api.post('/guests', form)
      if (res.success) {
        toast.success('Guest added', {
          description: `${form.first_name} ${form.last_name} is now in your guest list.`,
        })
        setShowForm(false)
        loadGuests()
      } else {
        setError(res.error || 'Failed to create guest')
        toast.error('Create failed', { description: res.error })
      }
    }
    setSaving(false)
  }

  const totalPages = Math.ceil(total / 12)
  const idTypeLabel: Record<string, string> = {
    PASSPORT: 'Passport',
    NATIONAL_ID: 'National ID',
    DRIVERS_LICENSE: "Driver's License",
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Guests</h1>
          <p className="mt-1 text-steel-600">Manage guest profiles and history.</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" /> Add Guest
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {/* Search */}
      <Card className="mt-6 animate-slide-up">
        <CardContent className="p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
            <Input
              className="pl-9"
              placeholder="Search by name, email, or phone..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Guest cards */}
      {loading ? (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-3 w-44" />
                <Skeleton className="h-3 w-36" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : guests.length === 0 ? (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Inbox className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No guests found</p>
            <p className="mt-1 text-sm text-steel-500">
              {search ? 'Try a different search term.' : 'Add your first guest to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {guests.map((guest, i) => (
            <Card
              key={guest.GUEST_ID}
              className="group animate-slide-up transition-all duration-200 hover:-translate-y-1 hover:shadow-lift"
              style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary-500 font-semibold text-white ring-2 ring-accent-500/40 transition-transform duration-200 group-hover:scale-105">
                    {guest.FIRST_NAME?.charAt(0)}
                    {guest.LAST_NAME?.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-bold text-[#1a1a1a]">
                      {guest.FIRST_NAME} {guest.LAST_NAME}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-wide text-accent-700">
                      {guest.NATIONALITY || idTypeLabel[guest.ID_TYPE] || guest.ID_TYPE}
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => openEdit(guest)}
                    aria-label="Edit guest"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-4 space-y-2 border-t border-dust-200 pt-4 text-sm text-steel-600">
                  <div className="flex items-center gap-2 truncate">
                    <Mail className="h-4 w-4 shrink-0 text-steel-400" />
                    <span className="truncate">{guest.EMAIL || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 shrink-0 text-steel-400" />
                    <span>{guest.PHONE}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 shrink-0 text-steel-400" />
                    <span>
                      {idTypeLabel[guest.ID_TYPE] || guest.ID_TYPE}: {guest.ID_NUMBER}
                    </span>
                  </div>
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
            Showing {((page - 1) * 12) + 1} to {Math.min(page * 12, total)} of {total} guests
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
            <DialogTitle>{editingGuest ? 'Edit Guest' : 'Add Guest'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="first_name">First Name *</Label>
              <Input id="first_name" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input id="last_name" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone *</Label>
              <Input id="phone" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>ID Type *</Label>
              <Select value={form.id_type} onValueChange={v => setForm({ ...form, id_type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PASSPORT">Passport</SelectItem>
                  <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                  <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="id_number">ID Number *</Label>
              <Input id="id_number" value={form.id_number} onChange={e => setForm({ ...form, id_number: e.target.value })} />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.first_name || !form.last_name || !form.phone || !form.id_number}
            >
              {saving ? 'Saving…' : editingGuest ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
