import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  BarChart3,
  CalendarClock,
  Clapperboard,
  Copy,
  Download,
  History,
  Image,
  Loader2,
  Mail,
  MessageCircle,
  Newspaper,
  RefreshCw,
  Send,
  Trash2,
  Wand2,
  type LucideIcon,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import ContentAnalyticsDashboard from '../components/ai/ContentAnalyticsDashboard'
import {
  AI_CHANNEL_META,
  AI_CHANNEL_VARIANT,
  AI_CONTENT_TYPES,
  AI_CONTENT_TYPE_META,
  AI_DIST_STATUS_LABEL,
  AI_DIST_STATUS_VARIANT,
  AI_RECIPIENT_META,
  AI_STATUS_LABEL,
  AI_STATUS_VARIANT,
  AI_TYPE_VARIANT,
  aiChannelLabel,
  aiRecipientLabel,
  copyText,
  downloadDataUrl,
  downloadSvgUrl,
  formatAiDate,
  parseAiEmail,
  parseAiFlyer,
  parseAiInstagram,
  parseAiWhatsapp,
  svgToPng,
} from '../lib/aiContent'
import type {
  AiApproveResult,
  AiChannel,
  AiContentDetail,
  AiContentListItem,
  AiContentStatus,
  AiContentType,
  AiContentVersion,
  AiDistributeResult,
  AiGenerateResult,
  AiRecipientType,
  AiRegenerateResult,
} from '../types'

const DEFAULT_BRAND_TEXT =
  'Elegant luxury hospitality, deep navy (#0d1b2a) and gold (#c9a227) accents, serif headlines, warm and inviting tone.'

const TYPE_ICONS: Record<AiContentType, LucideIcon> = {
  flyer: Image,
  email: Mail,
  instagram_post: Clapperboard,
  whatsapp_message: MessageCircle,
  newsletter: Newspaper,
}

const CHANNEL_ICONS: Record<AiChannel, LucideIcon> = {
  email: Mail,
  newsletter: Newspaper,
  instagram: Clapperboard,
  whatsapp: MessageCircle,
}

const EMAIL_RECIPIENT_TYPES: AiRecipientType[] = ['all_guests', 'past_guests', 'newsletter_subscribers']

function nowLocalInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ------------------------------------------------------------
// Payload preview — renders the generated bundle for a type.
// ------------------------------------------------------------

function ContentPreview({
  type,
  payload,
  flyerImageUrl,
}: {
  type: AiContentType
  payload: Record<string, unknown> | null
  flyerImageUrl?: string | null
}) {
  const [working, setWorking] = useState(false)

  async function downloadFlyerPng() {
    if (!flyerImageUrl || working) return
    setWorking(true)
    const dataUrl = await svgToPng(flyerImageUrl)
    setWorking(false)
    if (dataUrl) {
      downloadDataUrl(dataUrl, `altonshotel-flyer-${Date.now()}.png`)
      toast.success('PNG downloaded')
    } else {
      toast.error('Could not render the flyer as PNG')
    }
  }

  async function downloadFlyerSvg() {
    if (!flyerImageUrl || working) return
    setWorking(true)
    await downloadSvgUrl(flyerImageUrl, `altonshotel-flyer-${Date.now()}.svg`)
    setWorking(false)
    toast.success('SVG downloaded')
  }

  if (type === 'flyer') {
    const flyer = parseAiFlyer(payload)
    return (
      <div className="grid gap-4 sm:grid-cols-[240px_minmax(0,1fr)]">
        <div className="space-y-3">
          {flyerImageUrl ? (
            <img
              src={flyerImageUrl}
              alt="Flyer preview"
              className="aspect-[4/5] w-full rounded-lg border border-steel-300 object-cover shadow-sm"
            />
          ) : (
            <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg border border-dashed border-steel-300 bg-dust-50 text-sm text-steel-500">
              No flyer image
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="default"
              disabled={working || !flyerImageUrl}
              onClick={downloadFlyerPng}
            >
              {working ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
              PNG
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={working || !flyerImageUrl}
              onClick={downloadFlyerSvg}
            >
              <Download className="h-3.5 w-3.5" /> SVG
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Headline</p>
            <p className="font-semibold text-[#1a1a1a]">{flyer?.headline}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Subtitle</p>
            <p className="text-steel-700">{flyer?.subtitle}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Details</p>
            <p className="text-sm text-steel-700">{flyer?.details}</p>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Call to action</p>
              <p className="font-semibold text-[#1a1a1a]">{flyer?.cta_text}</p>
            </div>
            {flyer?.accent_color && (
              <div className="flex items-center gap-1.5 text-xs text-steel-500">
                <span
                  className="h-4 w-4 rounded-full border border-steel-300"
                  style={{ backgroundColor: flyer.accent_color }}
                />
                {flyer.accent_color}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'email' || type === 'newsletter') {
    const email = parseAiEmail(payload)
    return (
      <div className="space-y-3">
        {email && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Subject</p>
                <p className="font-semibold text-[#1a1a1a]">{email.subject}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Preheader</p>
                <p className="text-sm text-steel-700">{email.preheader}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Body</p>
              <div
                className="landing-content mt-1 max-h-64 overflow-y-auto rounded-lg border border-dust-200 bg-white p-3 text-sm"
                dangerouslySetInnerHTML={{ __html: email.body_html }}
              />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <a className="text-primary-600 underline" href={email.cta_url} target="_blank" rel="noreferrer">
                {email.cta_label}
              </a>
              <span className="text-steel-400">·</span>
              <span className="truncate text-xs text-steel-500">{email.cta_url}</span>
            </div>
          </>
        )}
      </div>
    )
  }

  if (type === 'instagram_post') {
    const ig = parseAiInstagram(payload)
    const caption = ig ? `${ig.caption} ${ig.hashtags}`.trim() : ''
    return (
      <div className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Caption</p>
          <p className="text-sm text-steel-700">{ig?.caption}</p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Hashtags</p>
          <p className="text-sm text-primary-600">{ig?.hashtags}</p>
        </div>
        <Button
          size="sm"
          variant="secondary"
          onClick={async () => {
            const ok = await copyText(caption)
            toast.success(ok ? 'Post copied to clipboard' : caption ? 'Copy failed' : 'Nothing to copy yet')
          }}
        >
          <Copy className="h-3.5 w-3.5" /> Copy post
        </Button>
      </div>
    )
  }

  const wa = parseAiWhatsapp(payload)
  return (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-steel-500">Message</p>
        <p className="mt-1 whitespace-pre-wrap rounded-lg border border-dust-200 bg-dust-50/60 p-3 text-sm text-steel-700">
          {wa?.message}
        </p>
      </div>
      <Button
        size="sm"
        variant="secondary"
        onClick={async () => {
          const ok = await copyText(wa?.message || '')
          toast.success(ok ? 'Message copied to clipboard' : 'Copy failed')
        }}
      >
        <Copy className="h-3.5 w-3.5" /> Copy message
      </Button>
    </div>
  )
}

// ------------------------------------------------------------
// Create tab
// ------------------------------------------------------------

function CreateTab({
  onRefresh,
  onDistribute,
}: {
  onRefresh: () => void
  onDistribute: (id: number) => void
}) {
  const [type, setType] = useState<AiContentType>('flyer')
  const [title, setTitle] = useState('')
  const [prompt, setPrompt] = useState('')
  const [brand, setBrand] = useState(DEFAULT_BRAND_TEXT)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<AiGenerateResult | null>(null)
  const [acting, setActing] = useState(false)

  async function generate() {
    if (generating) return
    if (prompt.trim().length < 3) {
      toast.error('Describe what you want first', { description: 'Give the generator a short brief.' })
      return
    }
    setGenerating(true)
    const res = await api.post<AiGenerateResult>('/ai/generate-content', {
      type,
      title: title.trim() || undefined,
      prompt: prompt.trim(),
      brand_guidelines: brand.trim() || undefined,
    })
    setGenerating(false)
    if (res.success && res.data) {
      setResult(res.data)
      onRefresh()
      toast.success('Content generated', {
        description: `${AI_CONTENT_TYPE_META[type].label} is ready to review.`,
      })
    } else {
      toast.error('Generation failed', { description: res.error })
    }
  }

  async function approve() {
    if (!result || acting) return
    setActing(true)
    const res = await api.post<AiApproveResult>(`/ai/content/${result.id}/approve`)
    setActing(false)
    if (res.success) {
      setResult(r => (r ? { ...r, status: 'approved' } : r))
      onRefresh()
      toast.success('Content approved', { description: 'It can now be distributed.' })
    } else {
      toast.error('Approval failed', { description: res.error })
    }
  }

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <Label>Content type</Label>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AI_CONTENT_TYPES.map(t => {
                const Icon = TYPE_ICONS[t]
                const active = t === type
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex flex-col items-start gap-1.5 rounded-xl border-2 p-3 text-left transition-colors ${
                      active ? 'border-primary-500 bg-primary-50' : 'border-dust-300 bg-white hover:border-primary-300'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${active ? 'text-primary-600' : 'text-steel-500'}`} />
                    <span className="text-sm font-semibold text-[#1a1a1a]">{AI_CONTENT_TYPE_META[t].label}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-xs text-steel-500">{AI_CONTENT_TYPE_META[type].description}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_title">Title (optional)</Label>
            <Input
              id="ai_title"
              placeholder="Internal name, e.g. Autumn Escape Flyer"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_prompt">Brief</Label>
            <textarea
              id="ai_prompt"
              rows={4}
              maxLength={2000}
              placeholder="e.g. Promote a spring weekend package with a rooftop dinner and late checkout."
              className="w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
            />
            <p className="text-right text-xs text-steel-400">{prompt.length}/2000</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ai_brand">Brand guidelines (optional)</Label>
            <textarea
              id="ai_brand"
              rows={3}
              maxLength={1000}
              className="w-full rounded-lg border border-steel-300 bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-steel-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              value={brand}
              onChange={e => setBrand(e.target.value)}
            />
          </div>

          <Button variant="accent" disabled={generating} onClick={generate}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            {generating ? 'Generating…' : 'Generate content'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#1a1a1a]">Result</p>
          {result ? (
            <div className="mt-3 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 flex-1 truncate font-medium text-[#1a1a1a]" title={result.title}>
                  {result.title}
                </p>
                <Badge variant={AI_TYPE_VARIANT[result.type]}>{AI_CONTENT_TYPE_META[result.type].label}</Badge>
                <Badge variant={AI_STATUS_VARIANT[result.status]}>{AI_STATUS_LABEL[result.status]}</Badge>
                <Badge variant="neutral">{result.provider === 'anthropic' ? 'Claude' : 'Demo mode'}</Badge>
              </div>
              <ContentPreview
                type={result.type}
                payload={result.content_payload}
                flyerImageUrl={result.flyer_image_url}
              />
              <div className="flex flex-wrap gap-2 border-t border-dust-200 pt-4">
                {result.status === 'draft' && (
                  <Button variant="default" disabled={acting} onClick={approve}>
                    Approve
                  </Button>
                )}
                <Button variant="secondary" disabled={acting} onClick={() => onDistribute(result.id)}>
                  <Send className="h-4 w-4" /> Distribute
                </Button>
                <Button
                  variant="ghost"
                  disabled={generating}
                  onClick={() => setResult(null)}
                >
                  Clear
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col items-center py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                <Wand2 className="h-7 w-7 text-primary-600" />
              </div>
              <p className="mt-4 font-medium text-steel-700">Generate your first asset</p>
              <p className="mt-1 max-w-sm text-sm text-steel-500">
                Pick a format, describe the promotion, and Claude will draft it on-brand. Review,
                approve, then distribute.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ------------------------------------------------------------
// Distribute tab
// ------------------------------------------------------------

function DistributeTab({
  refreshKey,
  targetId,
  onTargetConsumed,
  onRefresh,
}: {
  refreshKey: number
  targetId: number | null
  onTargetConsumed: () => void
  onRefresh: () => void
}) {
  const [items, setItems] = useState<AiContentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<AiContentListItem | null>(null)
  const [detail, setDetail] = useState<AiContentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [channel, setChannel] = useState<AiChannel>('email')
  const [recipientType, setRecipientType] = useState<AiRecipientType>('all_guests')
  const [mode, setMode] = useState<'now' | 'schedule'>('now')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<AiDistributeResult | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<AiContentListItem[]>('/ai/content/history').then(res => {
      if (cancelled) return
      const approvable = (res.data || []).filter(i => i.STATUS === 'approved' || i.STATUS === 'published')
      setItems(approvable)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const openDetail = useCallback(async (item: AiContentListItem) => {
    setSelected(item)
    setResult(null)
    setDetailLoading(true)
    const res = await api.get<AiContentDetail>(`/ai/content/${item.ID}`)
    setDetailLoading(false)
    if (res.success && res.data) {
      setDetail(res.data)
    } else {
      toast.error('Could not load content', { description: res.error })
    }
  }, [])

  useEffect(() => {
    if (!targetId) return
    const match = items.find(i => i.ID === targetId)
    if (match) {
      setSelected(match)
      setResult(null)
      openDetail(match)
      onTargetConsumed()
    }
  }, [targetId, items, onTargetConsumed, openDetail])

  async function send() {
    if (!selected || submitting) return
    const scheduled = mode === 'schedule'
    if (scheduled) {
      if (!scheduledAt || scheduledAt <= nowLocalInput()) {
        toast.error('Pick a future time')
        return
      }
    }
    setSubmitting(true)
    const res = await api.post<AiDistributeResult>(`/ai/distribute/${selected.ID}`, {
      channel,
      recipient_type: channel === 'email' ? recipientType : undefined,
      scheduled_at: scheduled ? scheduledAt : null,
    })
    setSubmitting(false)
    if (res.success && res.data) {
      setResult(res.data)
      onRefresh()
      toast.success(
        res.data.status === 'scheduled'
          ? 'Distribution scheduled'
          : res.data.status === 'manual'
            ? 'Ready to copy and send'
            : 'Content distributed',
        { description: `${aiChannelLabel(channel)} · ${res.data.recipient_count} recipient(s)` }
      )
    } else {
      toast.error('Distribution failed', { description: res.error })
    }
  }

  const isEmailChannel = channel === 'email' || channel === 'newsletter'

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#1a1a1a]">Approved content</p>
          {loading ? (
            <div className="mt-3 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : items.length === 0 ? (
            <div className="mt-3 flex flex-col items-center py-12 text-center">
              <Send className="h-7 w-7 text-steel-400" />
              <p className="mt-3 font-medium text-steel-700">Nothing to distribute yet</p>
              <p className="mt-1 text-sm text-steel-500">
                Generate content and approve it before distributing.
              </p>
            </div>
          ) : (
            <div className="mt-3 max-h-[55vh] space-y-2 overflow-y-auto pr-1">
              {items.map(item => (
                <button
                  key={item.ID}
                  type="button"
                  onClick={() => openDetail(item)}
                  className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                    selected?.ID === item.ID
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dust-300 bg-white hover:border-primary-300'
                  }`}
                >
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold text-[#1a1a1a]" title={item.TITLE}>
                        {item.TITLE}
                      </span>
                      <Badge variant={AI_TYPE_VARIANT[item.TYPE]}>{AI_CONTENT_TYPE_META[item.TYPE].label}</Badge>
                    </span>
                    <span className="block text-xs text-steel-500">
                      {formatAiDate(item.CREATED_AT)} · {item.DISTRIBUTION_COUNT} distribution(s)
                    </span>
                  </span>
                  <Badge variant={AI_STATUS_VARIANT[item.STATUS]}>{AI_STATUS_LABEL[item.STATUS]}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#1a1a1a]">Distribution</p>
          {!selected ? (
            <p className="mt-3 text-sm text-steel-500">Select an approved item to distribute it.</p>
          ) : (
            <div className="mt-3 space-y-4">
              {detailLoading ? (
                <Skeleton className="h-20 w-full" />
              ) : detail ? (
                <div className="space-y-3 rounded-xl border border-dust-200 bg-dust-50/60 p-3">
                  <p className="text-sm font-semibold text-[#1a1a1a]">{detail.content.TITLE}</p>
                  <ContentPreview
                    type={detail.content.TYPE}
                    payload={detail.content_payload}
                    flyerImageUrl={detail.content.FLYER_IMAGE_URL}
                  />
                </div>
              ) : null}

              <div className="space-y-2">
                <Label>Channel</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(Object.keys(AI_CHANNEL_META) as AiChannel[]).map(ch => {
                    const Icon = CHANNEL_ICONS[ch]
                    const active = ch === channel
                    return (
                      <button
                        key={ch}
                        type="button"
                        onClick={() => setChannel(ch)}
                        className={`flex items-center gap-1.5 rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                          active
                            ? 'border-accent-500 bg-accent-50 text-[#1a1a1a]'
                            : 'border-dust-300 bg-white text-steel-600 hover:border-primary-300'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-accent-700' : 'text-steel-500'}`} />
                        {AI_CHANNEL_META[ch].label}
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-steel-500">{AI_CHANNEL_META[channel].description}</p>
              </div>

              {isEmailChannel && (
                <div className="space-y-2">
                  <Label>Audience</Label>
                  <Select
                    value={recipientType}
                    onValueChange={v => setRecipientType(v as AiRecipientType)}
                  >
                    <SelectTrigger className="w-full sm:w-72">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMAIL_RECIPIENT_TYPES.map(r => (
                        <SelectItem key={r} value={r}>
                          {AI_RECIPIENT_META[r].label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {channel === 'newsletter' && (
                    <p className="text-xs text-steel-500">
                      Newsletters are always sent to newsletter subscribers.
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Timing</Label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setMode('now')}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'now'
                        ? 'border-primary-500 bg-primary-50 text-[#1a1a1a]'
                        : 'border-dust-300 bg-white text-steel-600 hover:border-primary-300'
                    }`}
                  >
                    Send now
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('schedule')}
                    className={`rounded-lg border-2 px-3 py-2 text-sm font-medium transition-colors ${
                      mode === 'schedule'
                        ? 'border-accent-500 bg-accent-50 text-[#1a1a1a]'
                        : 'border-dust-300 bg-white text-steel-600 hover:border-primary-300'
                    }`}
                  >
                    Schedule
                  </button>
                </div>
                {mode === 'schedule' && (
                  <div className="space-y-1">
                    <Input
                      type="datetime-local"
                      min={nowLocalInput()}
                      className="w-60"
                      value={scheduledAt}
                      onChange={e => setScheduledAt(e.target.value)}
                    />
                    <p className="text-xs text-steel-500">
                      Local time — the scheduler picks it up within a minute.
                    </p>
                  </div>
                )}
              </div>

              <Button variant="accent" disabled={submitting} onClick={send}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting
                  ? 'Working…'
                  : mode === 'schedule'
                    ? 'Schedule distribution'
                    : 'Distribute now'}
              </Button>

              {result && (
                <div className="space-y-2 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={AI_DIST_STATUS_VARIANT[result.status]}>
                      {AI_DIST_STATUS_LABEL[result.status]}
                    </Badge>
                    <span className="text-steel-600">
                      {aiChannelLabel(result.channel)} · {result.recipient_count} recipient(s)
                    </span>
                    {result.campaign_id && (
                      <span className="text-xs text-steel-500">Campaign #{result.campaign_id}</span>
                    )}
                  </div>
                  {result.scheduled_at && (
                    <p className="text-xs text-steel-600">
                      Scheduled for {result.scheduled_at.replace('T', ' ')}
                    </p>
                  )}
                  {result.sent_at && <p className="text-xs text-steel-600">Sent {formatAiDate(result.sent_at)}</p>}
                  {result.status === 'manual' && result.preview && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-steel-500">
                        Copy-ready preview
                      </p>
                      <p className="whitespace-pre-wrap rounded-lg border border-green-200 bg-white p-2 text-steel-700">
                        {result.preview}
                      </p>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const ok = await copyText(result.preview || '')
                          toast.success(ok ? 'Preview copied' : 'Copy failed')
                        }}
                      >
                        <Copy className="h-3.5 w-3.5" /> Copy
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ------------------------------------------------------------
// History tab
// ------------------------------------------------------------

function HistoryTab({
  refreshKey,
  onRefresh,
  onDistribute,
}: {
  refreshKey: number
  onRefresh: () => void
  onDistribute: (id: number) => void
}) {
  const [items, setItems] = useState<AiContentListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [viewOpen, setViewOpen] = useState(false)
  const [detail, setDetail] = useState<AiContentDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [acting, setActing] = useState(false)
  const [openVersionId, setOpenVersionId] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<AiContentListItem[]>('/ai/content/history').then(res => {
      if (cancelled) return
      if (res.success && res.data) setItems(res.data)
      else toast.error('Could not load history', { description: res.error })
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  const filtered = useMemo(() => {
    const term = search.trim().toUpperCase()
    return items.filter(i => {
      if (typeFilter !== 'all' && i.TYPE !== typeFilter) return false
      if (statusFilter !== 'all' && i.STATUS !== statusFilter) return false
      if (term && !i.TITLE.toUpperCase().includes(term)) return false
      return true
    })
  }, [items, typeFilter, statusFilter, search])

  async function openDetail(item: AiContentListItem) {
    setViewOpen(true)
    setDetail(null)
    setDetailLoading(true)
    setOpenVersionId(null)
    const res = await api.get<AiContentDetail>(`/ai/content/${item.ID}`)
    setDetailLoading(false)
    if (res.success && res.data) setDetail(res.data)
    else toast.error('Could not load detail', { description: res.error })
  }

  async function approve() {
    if (!detail || acting) return
    setActing(true)
    const res = await api.post<AiApproveResult>(`/ai/content/${detail.content.ID}/approve`)
    setActing(false)
    if (res.success) {
      await reloadDetail()
      onRefresh()
      toast.success('Content approved')
    } else {
      toast.error('Approval failed', { description: res.error })
    }
  }

  async function regenerate() {
    if (!detail || acting) return
    setActing(true)
    const res = await api.post<AiRegenerateResult>(`/ai/regenerate-content/${detail.content.ID}`, {})
    setActing(false)
    if (res.success) {
      await reloadDetail()
      onRefresh()
      toast.success('Content regenerated', { description: `Now version ${res.data?.version}` })
    } else {
      toast.error('Regeneration failed', { description: res.error })
    }
  }

  async function remove() {
    if (!detail) return
    if (!confirm(`Delete "${detail.content.TITLE}"? This also deletes its versions and distribution records.`)) return
    setActing(true)
    const res = await api.delete(`/ai/content/${detail.content.ID}`)
    setActing(false)
    if (res.success) {
      setViewOpen(false)
      setDetail(null)
      onRefresh()
      toast.success('Content deleted')
    } else {
      toast.error('Delete failed', { description: res.error })
    }
  }

  async function reloadDetail() {
    if (!detail) return
    const res = await api.get<AiContentDetail>(`/ai/content/${detail.content.ID}`)
    if (res.success && res.data) {
      setDetail(res.data)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {AI_CONTENT_TYPES.map(t => (
              <SelectItem key={t} value={t}>
                {AI_CONTENT_TYPE_META[t].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(AI_STATUS_LABEL) as AiContentStatus[]).map(s => (
              <SelectItem key={s} value={s}>
                {AI_STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          className="w-56"
          placeholder="Search by title"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {(typeFilter !== 'all' || statusFilter !== 'all' || search) && (
          <Button
            variant="ghost"
            onClick={() => {
              setTypeFilter('all')
              setStatusFilter('all')
              setSearch('')
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <History className="h-7 w-7 text-steel-400" />
            <p className="mt-3 font-medium text-steel-700">No content found</p>
            <p className="mt-1 text-sm text-steel-500">Adjust your filters or generate something new.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.ID}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {item.FLYER_IMAGE_URL ? (
                          <img
                            src={item.FLYER_IMAGE_URL}
                            alt=""
                            className="h-10 w-8 rounded object-cover"
                          />
                        ) : null}
                        <div>
                          <p className="max-w-[260px] truncate font-medium" title={item.TITLE}>
                            {item.TITLE}
                          </p>
                          <p className="text-xs text-steel-500">
                            {item.DISTRIBUTION_COUNT} distribution(s)
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={AI_TYPE_VARIANT[item.TYPE]}>
                        {AI_CONTENT_TYPE_META[item.TYPE].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={AI_STATUS_VARIANT[item.STATUS]}>{AI_STATUS_LABEL[item.STATUS]}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-steel-600">
                      {item.CREATED_AT?.slice(0, 10)}
                    </TableCell>
                    <TableCell className="text-sm text-steel-600">
                      {item.APPROVED_AT ? item.APPROVED_AT.slice(0, 10) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        <Button size="sm" variant="secondary" onClick={() => openDetail(item)}>
                          View
                        </Button>
                        {item.STATUS === 'draft' && (
                          <Button size="sm" variant="ghost" onClick={() => openDetail(item)}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        {(item.STATUS === 'approved' || item.STATUS === 'published') && (
                          <Button size="sm" variant="ghost" onClick={() => onDistribute(item.ID)}>
                            <Send className="h-3.5 w-3.5" />
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

      {/* ============ Detail dialog ============ */}
      <Dialog
        open={viewOpen}
        onOpenChange={open => {
          if (!open) setViewOpen(false)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex flex-wrap items-center gap-2 pr-8">
              <span className="min-w-0 flex-1 truncate">{detail?.content.TITLE}</span>
              {detail && <Badge variant={AI_TYPE_VARIANT[detail.content.TYPE]}>{AI_CONTENT_TYPE_META[detail.content.TYPE].label}</Badge>}
              {detail && <Badge variant={AI_STATUS_VARIANT[detail.content.STATUS]}>{AI_STATUS_LABEL[detail.content.STATUS]}</Badge>}
            </DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detail ? (
            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel-500">Brief</p>
                <p className="rounded-lg border border-dust-200 bg-dust-50/60 p-3 text-sm text-steel-700">
                  {detail.content.ADMIN_PROMPT}
                </p>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel-500">Content</p>
                <ContentPreview
                  type={detail.content.TYPE}
                  payload={detail.content_payload}
                  flyerImageUrl={detail.content.FLYER_IMAGE_URL}
                />
              </div>

              {detail.content.BRAND_GUIDELINES && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel-500">
                    Brand guidelines
                  </p>
                  <p className="rounded-lg border border-dust-200 bg-dust-50/60 p-3 text-xs text-steel-600">
                    {detail.content.BRAND_GUIDELINES}
                  </p>
                </div>
              )}

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel-500">
                  Versions ({detail.versions.length})
                </p>
                {detail.versions.length === 0 ? (
                  <p className="text-sm text-steel-500">No versions recorded.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.versions.map(v => (
                      <li key={v.ID} className="rounded-lg border border-dust-200 bg-white">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm"
                          onClick={() => setOpenVersionId(openVersionId === v.ID ? null : v.ID)}
                        >
                          <span className="flex items-center gap-2">
                            <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                              v{v.VERSION_NUMBER}
                            </span>
                            <span className="truncate text-steel-700" title={v.REASON}>
                              {v.REASON}
                            </span>
                          </span>
                          <span className="shrink-0 text-xs text-steel-500">{formatAiDate(v.GENERATED_AT)}</span>
                        </button>
                        {openVersionId === v.ID && <VersionPayload version={v} />}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-steel-500">
                  Distributions ({detail.distributions.length})
                </p>
                {detail.distributions.length === 0 ? (
                  <p className="text-sm text-steel-500">Not distributed yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {detail.distributions.map(d => (
                      <li
                        key={d.ID}
                        className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-dust-200 bg-white px-3 py-2 text-sm"
                      >
                        <Badge variant={AI_CHANNEL_VARIANT[d.CHANNEL]}>{aiChannelLabel(d.CHANNEL)}</Badge>
                        <Badge variant={AI_DIST_STATUS_VARIANT[d.STATUS]}>
                          {AI_DIST_STATUS_LABEL[d.STATUS]}
                        </Badge>
                        <span className="text-xs text-steel-600">{d.RECIPIENT_COUNT} recipient(s)</span>
                        {d.RECIPIENT_TYPE && (
                          <span className="text-xs text-steel-500">{aiRecipientLabel(d.RECIPIENT_TYPE)}</span>
                        )}
                        {d.SCHEDULED_AT && billedSchedule(d.SCHEDULED_AT)}
                        {d.SENT_AT && (
                          <span className="text-xs text-steel-500">Sent {formatAiDate(d.SENT_AT)}</span>
                        )}
                        {d.campaign_status && (
                          <span className="text-xs text-steel-500">Campaign: {d.campaign_status}</span>
                        )}
                        {d.engagement ? (
                          <span className="text-xs font-semibold text-steel-700">
                            {d.engagement} engagement(s)
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="items-center gap-2 sm:justify-between">
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
                disabled={acting || !detail}
                onClick={remove}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={acting} onClick={() => setViewOpen(false)}>
                Close
              </Button>
              {detail && (detail.content.STATUS === 'draft' || detail.content.STATUS === 'scheduled') && (
                <Button variant="secondary" disabled={acting} onClick={approve}>
                  Approve
                </Button>
              )}
              {detail && (
                <Button variant="default" disabled={acting} onClick={regenerate}>
                  <RefreshCw className="h-4 w-4" /> Regenerate
                </Button>
              )}
              {detail && (detail.content.STATUS === 'approved' || detail.content.STATUS === 'published') && (
                <Button variant="accent" disabled={acting} onClick={() => onDistribute(detail.content.ID)}>
                  <Send className="h-4 w-4" /> Distribute
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function billedSchedule(scheduledAt: string): ReactNode {
  return <span className="text-xs text-steel-500">Scheduled {scheduledAt.replace('T', ' ')}</span>
}

function VersionPayload({ version }: { version: AiContentVersion }) {
  let json = ''
  try {
    json = JSON.stringify(JSON.parse(version.GENERATED_CONTENT), null, 2)
  } catch {
    json = version.GENERATED_CONTENT
  }
  return (
    <pre className="max-h-40 overflow-auto rounded-b-lg border-t border-dust-200 bg-dust-50/60 px-3 py-2 text-[11px] leading-relaxed text-steel-600">
      {json}
    </pre>
  )
}

// ------------------------------------------------------------
// AI Content hub page
// ------------------------------------------------------------

export default function AiContentPage() {
  const [tab, setTab] = useState('create')
  const [refreshKey, setRefreshKey] = useState(0)
  const [distributeTarget, setDistributeTarget] = useState<number | null>(null)

  const bumpRefresh = useCallback(() => setRefreshKey(k => k + 1), [])
  const consumeTarget = useCallback(() => setDistributeTarget(null), [])
  const goDistribute = useCallback((id: number) => {
    setDistributeTarget(id)
    setTab('distribute')
  }, [])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">AI Content Generator</h1>
          <p className="mt-1 text-steel-600">
            Draft, approve and distribute on-brand marketing content.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="accent">
            <Wand2 className="h-3 w-3" /> Claude-powered
          </Badge>
          <Badge variant="neutral">
            <CalendarClock className="h-3 w-3" /> Auto-scheduler
          </Badge>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-4">
        <TabsList className="h-auto w-full flex-wrap justify-start sm:w-auto">
          <TabsTrigger value="create">
            <Wand2 className="h-4 w-4" /> Create
          </TabsTrigger>
          <TabsTrigger value="distribute">
            <Send className="h-4 w-4" /> Distribute
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4" /> History
          </TabsTrigger>
          <TabsTrigger value="insights">
            <BarChart3 className="h-4 w-4" /> Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-4">
          <CreateTab onRefresh={bumpRefresh} onDistribute={goDistribute} />
        </TabsContent>
        <TabsContent value="distribute" className="mt-4">
          <DistributeTab
            refreshKey={refreshKey}
            targetId={distributeTarget}
            onTargetConsumed={consumeTarget}
            onRefresh={bumpRefresh}
          />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <HistoryTab refreshKey={refreshKey} onRefresh={bumpRefresh} onDistribute={goDistribute} />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <ContentAnalyticsDashboard refreshKey={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}