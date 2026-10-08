import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  Archive,
  ChevronLeft,
  ChevronRight,
  Eye,
  Megaphone,
  Newspaper,
  Pencil,
  Plus,
  Search,
} from 'lucide-react'
import { toast } from 'sonner'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import RichTextEditor, { type RichTextEditorHandle } from '@/components/editor/RichTextEditor'
import ImageUploader from '@/components/editor/ImageUploader'
import { uploadImageFile } from '@/components/editor/uploadImage'
import type { ContentForm, ContentItem, ContentType, PaginatedResponse } from '../types'

const TYPE_OPTIONS: { value: ContentType; label: string }[] = [
  { value: 'news', label: 'News' },
  { value: 'announcement', label: 'Announcement' },
  { value: 'event', label: 'Event' },
]

const TYPE_LABEL: Record<string, string> = {
  news: 'News',
  announcement: 'Announcement',
  event: 'Event',
}

const statusVariant: Record<string, 'success' | 'warning' | 'neutral'> = {
  published: 'success',
  draft: 'warning',
  archived: 'neutral',
}

const EMPTY_FORM: ContentForm = {
  title: '',
  type: 'announcement',
  body: '',
  featured_image_url: null,
  status: 'draft',
}

const PAGE_SIZE = 10

export default function ContentPage() {
  const [items, setItems] = useState<ContentItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [editing, setEditing] = useState<ContentItem | 'new' | null>(null)
  const [viewing, setViewing] = useState<ContentItem | null>(null)
  const [archiving, setArchiving] = useState<ContentItem | null>(null)
  const [form, setForm] = useState<ContentForm>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const editorRef = useRef<RichTextEditorHandle>(null)

  useEffect(() => {
    const t = setTimeout(() => loadContent(), search ? 300 : 0)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, typeFilter, statusFilter])

  async function loadContent() {
    setLoading(true)
    let url = `/content?page=${page}&pageSize=${PAGE_SIZE}&status=${statusFilter}&type=${typeFilter}`
    if (search) url += `&search=${encodeURIComponent(search)}`
    const res = await api.get<PaginatedResponse<ContentItem>>(url)
    if (res.success && res.data) {
      setItems(res.data.items)
      setTotal(res.data.total)
      setError('')
    } else {
      setError(res.error || 'Failed to load content')
    }
    setLoading(false)
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setEditing('new')
  }

  function openEdit(item: ContentItem) {
    setForm({
      title: item.TITLE,
      type: item.TYPE,
      body: item.BODY,
      featured_image_url: item.FEATURED_IMAGE_URL,
      status: item.STATUS === 'published' ? 'published' : 'draft',
    })
    setEditing(item)
  }

  async function handleSave() {
    if (saving) return
    if (!form.title.trim() || form.title.trim().length < 3) {
      toast.error('Title is required (at least 3 characters)')
      return
    }
    if (!form.body || form.body.trim().length === 0 || form.body === '<p></p>') {
      toast.error('Body content is required')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      type: form.type,
      body: form.body,
      featured_image_url: form.featured_image_url,
      status: form.status,
    }
    const res =
      editing && editing !== 'new'
        ? await api.put(`/content/${editing.ID}`, payload)
        : await api.post('/content', payload)
    setSaving(false)
    if (res.success) {
      toast.success(editing === 'new' ? 'Content created' : 'Content updated')
      setEditing(null)
      loadContent()
    } else {
      toast.error('Save failed', { description: res.error })
    }
  }

  async function handleArchive() {
    if (!archiving || saving) return
    setSaving(true)
    const res = await api.delete(`/content/${archiving.ID}`)
    setSaving(false)
    if (res.success) {
      toast.success(`"${archiving.TITLE}" archived`)
      setArchiving(null)
      setEditing(null)
      loadContent()
    } else {
      toast.error('Archive failed', { description: res.error })
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Content</h1>
          <p className="mt-1 text-steel-600">
            Publish news, announcements and events for the hotel website.
          </p>
        </div>
        <Button variant="accent" onClick={openCreate}>
          <Plus className="h-4 w-4" /> New content
        </Button>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      <Card className="mt-6 animate-slide-up">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label htmlFor="content_search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
                <Input
                  id="content_search"
                  placeholder="Title or keyword…"
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
              <Label>Type</Label>
              <Select
                value={typeFilter}
                onValueChange={v => {
                  setTypeFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {TYPE_OPTIONS.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Status</Label>
              <Select
                value={statusFilter}
                onValueChange={v => {
                  setStatusFilter(v)
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(search || typeFilter !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setTypeFilter('all')
                  setStatusFilter('all')
                  setPage(1)
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Newspaper className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No content found</p>
            <p className="mt-1 text-sm text-steel-500">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Try different filters.'
                : 'Create your first news item or announcement.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map(item => (
                  <TableRow key={item.ID}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        {item.FEATURED_IMAGE_URL ? (
                          <img
                            src={item.FEATURED_IMAGE_URL}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-md border border-dust-200 object-cover"
                          />
                        ) : (
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-600">
                            {item.TYPE === 'event' ? (
                              <Megaphone className="h-4 w-4" />
                            ) : (
                              <Newspaper className="h-4 w-4" />
                            )}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="truncate font-medium">{item.TITLE}</p>
                          <p className="truncate text-xs text-steel-500">
                            {item.PUBLISHED_AT
                              ? `Published ${item.PUBLISHED_AT.slice(0, 10)}`
                              : `Created ${item.CREATED_AT.slice(0, 10)}`}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-steel-600">{TYPE_LABEL[item.TYPE]}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[item.STATUS] ?? 'neutral'}>{item.STATUS}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-steel-500">
                      {item.UPDATED_AT.slice(0, 10)}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => setViewing(item)}>
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => openEdit(item)}>
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </Button>
                        {item.STATUS !== 'archived' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => setArchiving(item)}
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

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dust-300/60 bg-white px-4 py-3 shadow-card">
          <p className="text-sm text-steel-600">
            Showing {((page - 1) * PAGE_SIZE) + 1} to {Math.min(page * PAGE_SIZE, total)} of {total} items
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" /> Prev
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* View dialog */}
      <Dialog open={!!viewing} onOpenChange={open => !open && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {viewing?.TITLE}{' '}
              {viewing && (
                <Badge variant={statusVariant[viewing.STATUS] ?? 'neutral'}>{viewing.STATUS}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-3 text-xs text-steel-500">
                <Badge variant="neutral">{TYPE_LABEL[viewing.TYPE]}</Badge>
                <span>
                  {viewing.PUBLISHED_AT
                    ? `Published ${viewing.PUBLISHED_AT.slice(0, 10)}`
                    : `Created ${viewing.CREATED_AT.slice(0, 10)}`}
                </span>
              </div>
              {viewing.FEATURED_IMAGE_URL && (
                <img
                  src={viewing.FEATURED_IMAGE_URL}
                  alt=""
                  className="max-h-64 w-full rounded-lg border border-dust-200 object-cover"
                />
              )}
              <div
                className="landing-content rounded-lg border border-dust-200 bg-dust-50/50 p-4"
                dangerouslySetInnerHTML={{ __html: viewing.BODY }}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setViewing(null)}>Close</Button>
            {viewing && (
              <Button
                variant="default"
                onClick={() => {
                  const item = viewing
                  setViewing(null)
                  openEdit(item)
                }}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create / edit dialog */}
      <Dialog
        open={editing !== null}
        onOpenChange={open => {
          if (!open) setEditing(null)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {editing === 'new' ? 'New content' : editing ? `Edit #${editing.ID}` : 'Edit'}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label htmlFor="content_title">Title *</Label>
              <Input
                id="content_title"
                placeholder="e.g. Grand Opening of the Rooftop Terrace"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type *</Label>
                <Select
                  value={form.type}
                  onValueChange={v => setForm(f => ({ ...f, type: v as ContentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map(t => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status *</Label>
                <Select
                  value={form.status}
                  onValueChange={v => setForm(f => ({ ...f, status: v as 'draft' | 'published' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <ImageUploader
              id="content_image"
              label="Featured image"
              value={form.featured_image_url}
              onChange={url => setForm(f => ({ ...f, featured_image_url: url }))}
              hint="Shown at the top of the article on the landing page."
            />
            <div className="space-y-1.5">
              <Label>Body *</Label>
              <RichTextEditor
                key={editing === 'new' ? 'new' : editing?.ID}
                ref={editorRef}
                value={form.body}
                onChange={html => setForm(f => ({ ...f, body: html }))}
                onUploadImage={uploadImageFile}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            {editing !== 'new' && editing && (
              <Button
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                onClick={() => {
                  setArchiving(editing)
                }}
              >
                <Archive className="h-4 w-4" /> Archive
              </Button>
            )}
            <Button variant="accent" disabled={saving} onClick={handleSave}>
              {saving ? 'Saving…' : editing === 'new' ? 'Create content' : 'Save changes'}
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
            Archived content is hidden from the public landing page. You can restore it later by
            editing its status.
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
