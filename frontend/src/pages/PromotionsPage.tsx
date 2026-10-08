import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Archive,
  Pencil,
  Percent,
  Plus,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../services/api'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { PaginatedResponse, Promotion, PromotionForm, RoomType } from '../types'

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'destructive'> = {
  active: 'success',
  upcoming: 'info',
  expired: 'warning',
  draft: 'neutral',
  archived: 'destructive',
}

const statusLabel: Record<string, string> = {
  active: 'Active',
  upcoming: 'Upcoming',
  expired: 'Expired',
  draft: 'Draft',
  archived: 'Archived',
}

const EMPTY_FORM: PromotionForm = {
  title: '',
  description: '',
  discount_pct: 10,
  start_date: '',
  end_date: '',
  applicable_room_types: [],
  status: 'draft',
}

export default function PromotionsPage() {
  const [items, setItems] = useState<Promotion[]>([])
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState<Promotion | 'new' | null>(null)
  const [archiving, setArchiving] = useState<Promotion | null>(null)
  const [form, setForm] = useState<PromotionForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadPromotions()
    loadRoomTypes()
  }, [])

  async function loadPromotions() {
    setLoading(true)
    const res = await api.get<PaginatedResponse<Promotion>>('/promotions?status=all&page=1&pageSize=50')
    if (res.success && res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setError('')
    } else {
      setError(res.error || 'Failed to load promotions')
    }
    setLoading(false)
  }

  async function loadRoomTypes() {
    const res = await api.get<RoomType[]>('/rooms/types')
    if (res.success && res.data) setRoomTypes(res.data)
  }

  function openCreate() {
    const today = new Date().toISOString().slice(0, 10)
    setForm({ ...EMPTY_FORM, start_date: today })
    setEditing('new')
  }

  function openEdit(p: Promotion) {
    setForm({
      title: p.TITLE,
      description: p.DESCRIPTION || '',
      discount_pct: p.DISCOUNT_PCT,
      start_date: p.START_DATE,
      end_date: p.END_DATE,
      applicable_room_types: (p.APPLICABLE_ROOM_TYPES || '')
        .split(',')
        .map(s => Number(s.trim()))
        .filter(n => Number.isFinite(n) && n > 0),
      status: p.STATUS === 'active' ? 'active' : 'draft',
    })
    setEditing(p)
  }

  async function handleSave() {
    if (saving) return
    if (!form.title.trim() || form.title.trim().length < 3) {
      toast.error('Title is required (at least 3 characters)')
      return
    }
    if (form.discount_pct < 1 || form.discount_pct > 90) {
      toast.error('Discount must be between 1% and 90%')
      return
    }
    if (!form.start_date || !form.end_date) {
      toast.error('Start and end dates are required')
      return
    }
    if (form.end_date <= form.start_date) {
      toast.error('End date must be after the start date')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      discount_pct: Number(form.discount_pct),
      start_date: form.start_date,
      end_date: form.end_date,
      applicable_room_types: form.applicable_room_types,
      status: form.status,
    }
    const res =
      editing && editing !== 'new'
        ? await api.put(`/promotions/${editing.ID}`, payload)
        : await api.post('/promotions', payload)
    setSaving(false)
    if (res.success) {
      toast.success(editing === 'new' ? 'Promotion created' : 'Promotion updated')
      setEditing(null)
      loadPromotions()
    } else {
      toast.error('Save failed', { description: res.error })
    }
  }

  async function handleArchive() {
    if (!archiving || saving) return
    setSaving(true)
    const res = await api.delete(`/promotions/${archiving.ID}`)
    setSaving(false)
    if (res.success) {
      toast.success(`"${archiving.TITLE}" archived`)
      setArchiving(null)
      setEditing(null)
      loadPromotions()
    } else {
      toast.error('Archive failed', { description: res.error })
    }
  }

  function toggleRoomType(typeId: number) {
    setForm(f => ({
      ...f,
      applicable_room_types: f.applicable_room_types.includes(typeId)
        ? f.applicable_room_types.filter(id => id !== typeId)
        : [...f.applicable_room_types, typeId],
    }))
  }

  function roomTypeNames(value: string | null) {
    if (!value) return 'All room types'
    const ids = value.split(',').map(s => Number(s.trim())).filter(Boolean)
    if (ids.length === 0) return 'All room types'
    const names = ids.map(id => roomTypes.find(t => t.type_id === id)?.type_name || `Type ${id}`)
    return names.join(', ')
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Promotions</h1>
          <p className="mt-1 text-steel-600">
            Seasonal offers shown on the public landing page.
          </p>
        </div>
        <Badge variant="neutral">{total} promotions</Badge>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button variant="accent" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New promotion
        </Button>
      </div>

      {loading ? (
        <Card className="mt-4">
          <CardContent className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="mt-4 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Percent className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No promotions yet</p>
            <p className="mt-1 text-sm text-steel-500">
              Create a discount offer to display on the landing page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4 animate-fade-in">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Promotion</TableHead>
                  <TableHead className="text-center">Discount</TableHead>
                  <TableHead>Window</TableHead>
                  <TableHead>Room types</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(p => (
                  <TableRow key={p.ID}>
                    <TableCell>
                      <p className="font-medium">{p.TITLE}</p>
                      <p className="max-w-[280px] truncate text-xs text-steel-500">
                        {p.DESCRIPTION || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-0.5 text-sm font-bold text-accent-800">
                        {p.DISCOUNT_PCT}% off
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-steel-600">
                      {p.START_DATE} → {p.END_DATE}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-steel-600">
                      {roomTypeNames(p.APPLICABLE_ROOM_TYPES)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[p.display_status] ?? 'neutral'}>
                        {statusLabel[p.display_status] ?? p.display_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        {p.STATUS !== 'archived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setArchiving(p)}
                          >
                            <Archive className="h-3.5 w-3.5" /> Archive
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Create / edit dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'New promotion' : editing ? `Edit #${editing.ID}` : 'Edit'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="promo_title">Title *</Label>
              <Input
                id="promo_title"
                placeholder="e.g. Autumn Escape 25% Off"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo_desc">Description</Label>
              <Textarea
                id="promo_desc"
                rows={3}
                placeholder="Stay two nights or more and save…"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="promo_discount">Discount % *</Label>
                <Input
                  id="promo_discount"
                  type="number"
                  min={1}
                  max={90}
                  value={form.discount_pct}
                  onChange={e =>
                    setForm(f => ({ ...f, discount_pct: Number(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo_start">Starts *</Label>
                <Input
                  id="promo_start"
                  type="date"
                  value={form.start_date}
                  onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="promo_end">Ends *</Label>
                <Input
                  id="promo_end"
                  type="date"
                  value={form.end_date}
                  onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Applicable room types</Label>
              <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-dust-300 bg-dust-50/50 p-3 sm:grid-cols-2">
                {roomTypes.map(rt => (
                  <label
                    key={rt.type_id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-1.5 py-1 text-sm text-steel-700 hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      checked={form.applicable_room_types.includes(rt.type_id)}
                      onChange={() => toggleRoomType(rt.type_id)}
                      className="h-4 w-4 rounded border-steel-300 accent-[#0f3b59]"
                    />
                    {rt.type_name}
                  </label>
                ))}
                {roomTypes.length === 0 && (
                  <p className="text-sm text-steel-500">No room types loaded.</p>
                )}
              </div>
              <p className="text-xs text-steel-500">
                Leave all unchecked to apply the offer to every room type.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Status *</Label>
              <Select
                value={form.status}
                onValueChange={v => setForm(f => ({ ...f, status: v as 'draft' | 'active' }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft (not visible to guests)</SelectItem>
                  <SelectItem value="active">Active (visible to guests)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-steel-500">
                Visibility is also derived from the dates — offers outside their window never show
                as active.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            {editing !== 'new' && editing && editing.STATUS !== 'archived' && (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => setArchiving(editing)}
              >
                <Archive className="h-4 w-4" /> Archive
              </Button>
            )}
            <Button variant="accent" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editing === 'new' ? 'Create promotion' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Archive confirm */}
      <Dialog open={!!archiving} onOpenChange={open => !open && setArchiving(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Archive "{archiving?.TITLE}"?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-steel-600">
            Archived promotions are removed from the public landing page immediately.
          </p>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setArchiving(null)}>Cancel</Button>
            <Button variant="destructive" disabled={saving} onClick={handleArchive}>
              {saving ? 'Archiving…' : 'Archive'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
