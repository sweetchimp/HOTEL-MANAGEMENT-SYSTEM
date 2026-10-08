import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  BarChart3,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Send,
  Trash2,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import RichTextEditor, { type RichTextEditorHandle } from '@/components/editor/RichTextEditor'
import PlaceholderChips from '@/components/editor/PlaceholderChips'
import { uploadImageFile } from '@/components/editor/uploadImage'
import type {
  CampaignStats,
  EmailCampaign,
  EmailTemplate,
  RecipientCounts,
  RecipientType,
} from '../types'

const AUDIENCE: { value: RecipientType; label: string; description: string }[] = [
  { value: 'all_guests', label: 'All guests', description: 'Every guest with a booking on record.' },
  { value: 'past_guests', label: 'Past guests', description: 'Guests with at least one completed stay.' },
  { value: 'newsletter_subscribers', label: 'Newsletter subscribers', description: 'Visitors subscribed from the landing page.' },
]

const PLACEHOLDER_KEYS = ['guest_name', 'room_number', 'check_in_date', 'check_out_date', 'total_spent', 'hotel_name']

const STEPS = ['Template', 'Audience', 'Content', 'Schedule', 'Confirm']

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'neutral' | 'destructive'> = {
  sent: 'success',
  scheduled: 'info',
  draft: 'neutral',
  failed: 'destructive',
}

function parsePlaceholders(raw: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

function nowLocalInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

interface WizardState {
  templateId: number | null
  scratch: boolean
  recipientType: RecipientType | ''
  title: string
  subject: string
  customizeBody: boolean
  body: string
  mode: 'now' | 'schedule'
  scheduledAt: string
}

const EMPTY_WIZARD: WizardState = {
  templateId: null,
  scratch: false,
  recipientType: '',
  title: '',
  subject: '',
  customizeBody: false,
  body: '',
  mode: 'now',
  scheduledAt: '',
}

export default function EmailCampaignsPage() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [counts, setCounts] = useState<RecipientCounts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Wizard
  const [wizardOpen, setWizardOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [wiz, setWiz] = useState<WizardState>(EMPTY_WIZARD)
  const [submitting, setSubmitting] = useState(false)
  const editorRef = useRef<RichTextEditorHandle>(null)

  // Stats
  const [statsFor, setStatsFor] = useState<EmailCampaign | null>(null)
  const [stats, setStats] = useState<CampaignStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const [busy, setBusy] = useState(false)

  useEffect(() => {
    loadCampaigns()
    loadTemplates()
    loadCounts()
  }, [])

  async function loadCampaigns() {
    setLoading(true)
    const res = await api.get<EmailCampaign[]>('/email-campaigns')
    if (res.success && res.data) {
      setCampaigns(res.data)
      setError('')
    } else {
      setError(res.error || 'Failed to load campaigns')
    }
    setLoading(false)
  }

  async function loadTemplates() {
    const res = await api.get<EmailTemplate[]>('/email-templates')
    if (res.success && res.data) setTemplates(res.data)
  }

  async function loadCounts() {
    const res = await api.get<RecipientCounts>('/email-campaigns/recipient-counts')
    if (res.success && res.data) setCounts(res.data)
  }

  function audienceCount(type: RecipientType | ''): number | null {
    if (!type || !counts) return null
    return counts[type] ?? null
  }

  function audienceLabel(type: string): string {
    return AUDIENCE.find(a => a.value === type)?.label || type
  }

  // ---------- wizard ----------
  function openWizard() {
    setWiz(EMPTY_WIZARD)
    setStep(0)
    setWizardOpen(true)
  }

  const selectedTemplate = templates.find(t => t.ID === wiz.templateId) || null
  const templatePlaceholders = selectedTemplate ? parsePlaceholders(selectedTemplate.PLACEHOLDERS) : []
  const chipKeys = templatePlaceholders.length > 0 ? templatePlaceholders : PLACEHOLDER_KEYS

  function stepValid(s: number): boolean {
    if (s === 0) return wiz.scratch || wiz.templateId !== null
    if (s === 1) return wiz.recipientType !== ''
    if (s === 2) {
      if (wiz.title.trim().length < 3) return false
      if (wiz.scratch) {
        if (!wiz.subject.trim()) return false
        if (!wiz.body || wiz.body === '<p></p>' || !wiz.body.trim()) return false
      }
      if (!wiz.scratch && wiz.customizeBody) {
        if (!wiz.body || wiz.body === '<p></p>' || !wiz.body.trim()) return false
      }
      return true
    }
    if (s === 3) {
      if (wiz.mode === 'schedule') {
        return Boolean(wiz.scheduledAt) && wiz.scheduledAt > nowLocalInput()
      }
      return true
    }
    return true
  }

  function buildPayload() {
    return {
      title: wiz.title.trim(),
      template_id: wiz.scratch ? null : wiz.templateId,
      recipient_type: wiz.recipientType as RecipientType,
      subject: wiz.subject.trim() || undefined,
      body:
        wiz.scratch || wiz.customizeBody
          ? wiz.body
          : undefined,
      scheduled_at: wiz.mode === 'schedule' ? wiz.scheduledAt : undefined,
    }
  }

  async function handleSubmit(target: 'draft' | 'send' | 'schedule') {
    if (submitting) return
    setSubmitting(true)
    const payload = buildPayload()
    const res = await api.post<{ campaign_id: number }>(`/email-campaigns/${target}`, payload)
    setSubmitting(false)
    if (res.success) {
      toast.success(
        target === 'send'
          ? `Campaign sent to ${audienceCount(payload.recipient_type) ?? 'audience'} recipient(s)`
          : target === 'schedule'
            ? 'Campaign scheduled'
            : 'Draft saved',
        { description: res.data ? `Campaign #${res.data.campaign_id}` : undefined }
      )
      setWizardOpen(false)
      loadCampaigns()
      loadCounts()
    } else {
      toast.error('Campaign failed', { description: res.error })
    }
  }

  async function handleTest(campaign: EmailCampaign) {
    if (busy) return
    setBusy(true)
    const res = await api.post<{ to: string }>(`/email-campaigns/${campaign.ID}/test`)
    setBusy(false)
    if (res.success) {
      toast.success('Test email sent', { description: `To: ${res.data?.to}` })
    } else {
      toast.error('Test failed', { description: res.error })
    }
  }

  async function handleDelete(campaign: EmailCampaign) {
    if (busy) return
    if (!confirm(`Delete campaign "${campaign.TITLE}"?`)) return
    setBusy(true)
    const res = await api.delete(`/email-campaigns/${campaign.ID}`)
    setBusy(false)
    if (res.success) {
      toast.success('Campaign deleted')
      loadCampaigns()
    } else {
      toast.error('Delete failed', { description: res.error })
    }
  }

  async function openStats(campaign: EmailCampaign) {
    setStatsFor(campaign)
    setStats(null)
    setStatsLoading(true)
    const res = await api.get<CampaignStats>(`/email-campaigns/${campaign.ID}/stats`)
    if (res.success && res.data) {
      setStats(res.data)
    } else {
      toast.error('Could not load stats', { description: res.error })
      setStatsFor(null)
    }
    setStatsLoading(false)
  }

  // ---------- render ----------
  const maxDay = stats ? Math.max(1, ...stats.opens_by_day.map(d => d.count)) : 1

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 animate-slide-up">
        <div>
          <h1 className="font-display text-2xl font-semibold text-[#1a1a1a]">Email Campaigns</h1>
          <p className="mt-1 text-steel-600">
            Send newsletters and offers to guests and subscribers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {counts && (
            <Badge variant="neutral">
              {counts.newsletter_subscribers} subscribers
            </Badge>
          )}
          <Button variant="accent" onClick={openWizard}>
            <Send className="h-4 w-4" /> New campaign
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button className="underline" onClick={() => setError('')}>Dismiss</button>
        </div>
      )}

      {loading ? (
        <Card className="mt-6">
          <CardContent className="space-y-3 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </CardContent>
        </Card>
      ) : campaigns.length === 0 ? (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-dust-100">
              <Mail className="h-7 w-7 text-steel-500" />
            </div>
            <p className="mt-4 font-medium text-steel-700">No campaigns yet</p>
            <p className="mt-1 text-sm text-steel-500">
              Create your first newsletter or promotional email.
            </p>
            <Button variant="accent" className="mt-4" onClick={openWizard}>
              <Send className="h-4 w-4" /> New campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-6 animate-fade-in">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timing</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map(c => (
                  <TableRow key={c.ID}>
                    <TableCell>
                      <p className="font-medium">{c.TITLE}</p>
                      <p className="text-xs text-steel-500">
                        {c.TEMPLATE_NAME ? `Template: ${c.TEMPLATE_NAME}` : 'Custom content'}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-steel-600">
                      {audienceLabel(c.RECIPIENT_TYPE)}
                      <span className="text-steel-400"> · {c.RECIPIENT_COUNT}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[c.STATUS] ?? 'neutral'}>{c.STATUS}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-steel-600">
                      {c.STATUS === 'sent' && c.SENT_AT
                        ? `Sent ${c.SENT_AT.slice(0, 10)}`
                        : c.STATUS === 'scheduled' && c.SCHEDULED_AT
                          ? `Scheduled ${c.SCHEDULED_AT.slice(0, 16).replace('T', ' ')}`
                          : '—'}
                    </TableCell>
                    <TableCell>
                      {c.STATUS === 'sent' ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-11 text-steel-500">Opens</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-dust-200">
                              <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${Math.min(100, c.open_rate ?? 0)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-[#1a1a1a]">{c.open_rate ?? 0}%</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="w-11 text-steel-500">Clicks</span>
                            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-dust-200">
                              <div
                                className="h-full rounded-full bg-accent-500"
                                style={{ width: `${Math.min(100, c.click_rate ?? 0)}%` }}
                              />
                            </div>
                            <span className="font-semibold text-[#1a1a1a]">{c.click_rate ?? 0}%</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-steel-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1.5">
                        {c.STATUS === 'sent' && (
                          <Button size="sm" variant="secondary" onClick={() => openStats(c)}>
                            <BarChart3 className="h-3.5 w-3.5" /> Stats
                          </Button>
                        )}
                        <Button size="sm" variant="secondary" disabled={busy} onClick={() => handleTest(c)}>
                          Test
                        </Button>
                        {c.STATUS !== 'sent' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={busy}
                            onClick={() => handleDelete(c)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      {/* ============ Wizard ============ */}
      <Dialog
        open={wizardOpen}
        onOpenChange={open => {
          if (!open) setWizardOpen(false)
        }}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>New email campaign</DialogTitle>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-1">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i < step
                        ? 'bg-primary-500 text-white'
                        : i === step
                          ? 'bg-accent-500 text-[#1a1a1a]'
                          : 'bg-dust-200 text-steel-500'
                    }`}
                  >
                    {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`hidden text-xs font-medium sm:block ${
                      i === step ? 'text-[#1a1a1a]' : 'text-steel-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <span className={`h-px flex-1 ${i < step ? 'bg-primary-500' : 'bg-dust-300'}`} />
                )}
              </div>
            ))}
          </div>

          <div className="min-h-[280px] max-h-[55vh] overflow-y-auto pr-1">
            {/* Step 1 — Template */}
            {step === 0 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-steel-600">
                  Start from a designed template or write the email from scratch.
                </p>
                <button
                  type="button"
                  onClick={() => setWiz(w => ({ ...w, scratch: true, templateId: null }))}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                    wiz.scratch
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-dust-300 bg-white hover:border-primary-300'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                    <Send className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block font-semibold text-[#1a1a1a]">Start from scratch</span>
                    <span className="block text-sm text-steel-500">
                      Write your own subject and content with the rich text editor.
                    </span>
                  </span>
                </button>
                {templates.map(t => (
                  <button
                    key={t.ID}
                    type="button"
                    onClick={() =>
                      setWiz(w => ({ ...w, scratch: false, templateId: t.ID, customizeBody: false }))
                    }
                    className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      !wiz.scratch && wiz.templateId === t.ID
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dust-300 bg-white hover:border-primary-300'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
                      <Mail className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="block font-semibold text-[#1a1a1a]">{t.NAME}</span>
                        <Badge variant="neutral">{t.TYPE}</Badge>
                      </span>
                      <span className="block truncate text-sm text-steel-500">{t.SUBJECT}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 2 — Audience */}
            {step === 1 && (
              <div className="space-y-3 pt-2">
                <p className="text-sm text-steel-600">Who should receive this campaign?</p>
                {AUDIENCE.map(a => (
                  <button
                    key={a.value}
                    type="button"
                    onClick={() => setWiz(w => ({ ...w, recipientType: a.value }))}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      wiz.recipientType === a.value
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dust-300 bg-white hover:border-primary-300'
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-[#1a1a1a]">{a.label}</span>
                      <span className="block text-sm text-steel-500">{a.description}</span>
                    </span>
                    <span className="rounded-full bg-dust-100 px-3 py-1 text-sm font-bold text-primary-700">
                      {counts ? counts[a.value] : '…'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Step 3 — Content */}
            {step === 2 && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="wiz_title">Campaign title *</Label>
                  <Input
                    id="wiz_title"
                    placeholder="Internal name, e.g. October Newsletter"
                    value={wiz.title}
                    onChange={e => setWiz(w => ({ ...w, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wiz_subject">Subject line *</Label>
                  <Input
                    id="wiz_subject"
                    placeholder={
                      selectedTemplate && !wiz.scratch
                        ? `Leave blank to use: ${selectedTemplate.SUBJECT}`
                        : 'What guests will see in their inbox'
                    }
                    value={wiz.subject}
                    onChange={e => setWiz(w => ({ ...w, subject: e.target.value }))}
                  />
                </div>

                {wiz.scratch ? (
                  <div className="space-y-2">
                    <Label>Body *</Label>
                    <PlaceholderChips
                      keys={chipKeys}
                      onInsert={tok => editorRef.current?.insertHtml(`<span>${tok}</span>`)}
                    />
                    <RichTextEditor
                      ref={editorRef}
                      value={wiz.body}
                      onChange={html => setWiz(w => ({ ...w, body: html }))}
                      onUploadImage={uploadImageFile}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="wiz_customize"
                        checked={wiz.customizeBody}
                        onChange={e =>
                          setWiz(w => ({
                            ...w,
                            customizeBody: e.target.checked,
                            body: e.target.checked && selectedTemplate ? selectedTemplate.BODY : '',
                          }))
                        }
                        className="h-4 w-4 rounded border-steel-300 accent-primary-500"
                      />
                      <Label htmlFor="wiz_customize" className="cursor-pointer">
                        Customize the template body for this campaign
                      </Label>
                    </div>
                    {wiz.customizeBody ? (
                      <div className="space-y-2">
                        <PlaceholderChips
                          keys={chipKeys}
                          onInsert={tok => editorRef.current?.insertHtml(`<span>${tok}</span>`)}
                        />
                        <RichTextEditor
                          ref={editorRef}
                          value={wiz.body}
                          onChange={html => setWiz(w => ({ ...w, body: html }))}
                          onUploadImage={uploadImageFile}
                        />
                      </div>
                    ) : (
                      <div className="rounded-lg border border-dust-200 bg-dust-50/60 p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-steel-500">
                          Template preview
                        </p>
                        <div
                          className="landing-content mt-1.5 max-h-40 overflow-y-auto"
                          dangerouslySetInnerHTML={{ __html: selectedTemplate?.BODY || '' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 4 — Schedule */}
            {step === 3 && (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setWiz(w => ({ ...w, mode: 'now' }))}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      wiz.mode === 'now'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dust-300 bg-white hover:border-primary-300'
                    }`}
                  >
                    <Send className="mt-0.5 h-5 w-5 shrink-0 text-primary-600" />
                    <span>
                      <span className="block font-semibold text-[#1a1a1a]">Send now</span>
                      <span className="block text-sm text-steel-500">
                        Delivers immediately after confirmation.
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWiz(w => ({ ...w, mode: 'schedule' }))}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${
                      wiz.mode === 'schedule'
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-dust-300 bg-white hover:border-primary-300'
                    }`}
                  >
                    <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-accent-600" />
                    <span>
                      <span className="block font-semibold text-[#1a1a1a]">Schedule</span>
                      <span className="block text-sm text-steel-500">
                        Delivered automatically at the chosen time.
                      </span>
                    </span>
                  </button>
                </div>
                {wiz.mode === 'schedule' && (
                  <div className="space-y-2">
                    <Label htmlFor="wiz_when">Send at *</Label>
                    <Input
                      id="wiz_when"
                      type="datetime-local"
                      min={nowLocalInput()}
                      className="w-60"
                      value={wiz.scheduledAt}
                      onChange={e => setWiz(w => ({ ...w, scheduledAt: e.target.value }))}
                    />
                    <p className="text-xs text-steel-500">
                      Local time. The scheduler checks for due campaigns every minute.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 5 — Confirm */}
            {step === 4 && (
              <div className="space-y-3 pt-2">
                <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-4 text-sm">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                    <div>
                      <p className="text-steel-500">Title</p>
                      <p className="font-medium text-[#1a1a1a]">{wiz.title}</p>
                    </div>
                    <div>
                      <p className="text-steel-500">Audience</p>
                      <p className="font-medium text-[#1a1a1a]">
                        {audienceLabel(wiz.recipientType)} ({audienceCount(wiz.recipientType) ?? '—'})
                      </p>
                    </div>
                    <div>
                      <p className="text-steel-500">Source</p>
                      <p className="font-medium text-[#1a1a1a]">
                        {wiz.scratch
                          ? 'Custom content'
                          : selectedTemplate
                            ? wiz.customizeBody
                              ? `${selectedTemplate.NAME} (edited)`
                              : selectedTemplate.NAME
                            : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-steel-500">Timing</p>
                      <p className="font-medium text-[#1a1a1a]">
                        {wiz.mode === 'now'
                          ? 'Immediately'
                          : `Scheduled ${wiz.scheduledAt.replace('T', ' ')}`}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 border-t border-dust-200 pt-3">
                    <p className="text-steel-500">Subject</p>
                    <p className="font-medium text-[#1a1a1a]">
                      {wiz.subject.trim() || (selectedTemplate ? selectedTemplate.SUBJECT : '—')}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-steel-500">
                  Opens and clicks are tracked automatically. A test email can be sent from the
                  campaigns list before or after sending.
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="items-center gap-2 sm:justify-between">
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="secondary" disabled={submitting} onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
              )}
              {step === 4 && (
                <Button variant="secondary" disabled={submitting} onClick={() => handleSubmit('draft')}>
                  Save as draft
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" disabled={submitting} onClick={() => setWizardOpen(false)}>
                Cancel
              </Button>
              {step < 4 ? (
                <Button
                  variant="default"
                  disabled={!stepValid(step)}
                  onClick={() => setStep(s => s + 1)}
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant="accent"
                  disabled={submitting}
                  onClick={() => handleSubmit(wiz.mode === 'schedule' ? 'schedule' : 'send')}
                >
                  {submitting
                    ? 'Working…'
                    : wiz.mode === 'schedule'
                      ? 'Schedule campaign'
                      : 'Send now'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============ Stats dialog ============ */}
      <Dialog
        open={!!statsFor}
        onOpenChange={open => {
          if (!open) setStatsFor(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {statsFor?.TITLE} — performance{' '}
              {statsFor && (
                <Badge variant={statusVariant[statsFor.STATUS] ?? 'neutral'}>{statsFor.STATUS}</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {statsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : stats ? (
            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
                  <p className="text-2xl font-bold text-primary-700">{stats.total_sent}</p>
                  <p className="text-xs text-steel-500">Sent</p>
                </div>
                <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
                  <p className="text-2xl font-bold text-primary-700">{stats.total_opens}</p>
                  <p className="text-xs text-steel-500">Opens ({stats.open_rate}%)</p>
                </div>
                <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
                  <p className="text-2xl font-bold text-accent-700">{stats.total_clicks}</p>
                  <p className="text-xs text-steel-500">Clicks ({stats.click_rate}%)</p>
                </div>
                <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
                  <p className="text-2xl font-bold text-steel-700">{stats.opens_by_day.length}</p>
                  <p className="text-xs text-steel-500">Active days</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#1a1a1a]">Opens over time</p>
                {stats.opens_by_day.length === 0 ? (
                  <p className="text-sm text-steel-500">No opens recorded yet.</p>
                ) : (
                  <div className="flex h-36 items-end gap-2 rounded-xl border border-dust-200 bg-dust-50/40 p-3">
                    {stats.opens_by_day.map(d => (
                      <div key={d.date} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-[10px] font-semibold text-primary-700">{d.count}</span>
                        <div
                          className="w-full rounded-t bg-primary-500 transition-all"
                          style={{ height: `${Math.max(6, (d.count / maxDay) * 100)}%` }}
                          title={`${d.date}: ${d.count} opens`}
                        />
                        <span className="text-[9px] text-steel-500">{d.date.slice(5)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-[#1a1a1a]">Top links</p>
                {stats.top_links.length === 0 ? (
                  <p className="text-sm text-steel-500">No link clicks recorded yet.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {stats.top_links.map(link => (
                      <li
                        key={link.url}
                        className="flex items-center justify-between gap-3 rounded-lg border border-dust-200 bg-white px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate text-primary-600" title={link.url}>
                          {link.url}
                        </span>
                        <span className="shrink-0 rounded-full bg-dust-100 px-2 py-0.5 text-xs font-semibold text-steel-700">
                          {link.count} {link.count === 1 ? 'click' : 'clicks'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="secondary" onClick={() => setStatsFor(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
