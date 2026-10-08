import type {
  AiChannel,
  AiContentStatus,
  AiContentType,
  AiDistributionStatus,
  AiGeneratedEmail,
  AiGeneratedFlyer,
  AiGeneratedInstagram,
  AiGeneratedWhatsapp,
} from '../types'

export type BadgeVariant = 'default' | 'success' | 'warning' | 'destructive' | 'info' | 'neutral' | 'accent'

export const AI_CONTENT_TYPES: AiContentType[] = [
  'flyer',
  'email',
  'instagram_post',
  'whatsapp_message',
  'newsletter',
]

export const AI_CONTENT_TYPE_META: Record<AiContentType, { label: string; description: string }> = {
  flyer: { label: 'Flyer', description: 'Ready-to-share flyer artwork with brand styling.' },
  email: { label: 'Email', description: 'Promotional email to your guest list.' },
  instagram_post: { label: 'Instagram post', description: 'Caption and hashtags for Instagram.' },
  whatsapp_message: { label: 'WhatsApp message', description: 'Short, personal message for guests.' },
  newsletter: { label: 'Newsletter', description: 'Multi-section newsletter email update.' },
}

export const AI_CHANNEL_META: Record<AiChannel, { label: string; description: string }> = {
  email: { label: 'Email', description: 'Promotional campaign to selected guests.' },
  newsletter: { label: 'Newsletter', description: 'Sent to newsletter subscribers.' },
  instagram: { label: 'Instagram', description: 'Caption ready to publish to your feed.' },
  whatsapp: { label: 'WhatsApp', description: 'Direct message to your guest list.' },
}

export const AI_RECIPIENT_META: Record<string, { label: string; description: string }> = {
  all_guests: { label: 'All guests', description: 'Every guest with a booking on record.' },
  past_guests: { label: 'Past guests', description: 'Guests with at least one completed stay.' },
  newsletter_subscribers: { label: 'Newsletter subscribers', description: 'Visitors subscribed from the landing page.' },
}

export const AI_STATUS_LABEL: Record<AiContentStatus, string> = {
  draft: 'Draft',
  approved: 'Approved',
  scheduled: 'Scheduled',
  published: 'Published',
}

export const AI_DIST_STATUS_LABEL: Record<AiDistributionStatus, string> = {
  pending: 'Pending',
  scheduled: 'Scheduled',
  sent: 'Sent',
  failed: 'Failed',
  manual: 'Manual',
}

export const AI_STATUS_VARIANT: Record<AiContentStatus, BadgeVariant> = {
  draft: 'neutral',
  approved: 'info',
  scheduled: 'warning',
  published: 'success',
}

export const AI_DIST_STATUS_VARIANT: Record<AiDistributionStatus, BadgeVariant> = {
  pending: 'neutral',
  scheduled: 'warning',
  sent: 'success',
  failed: 'destructive',
  manual: 'accent',
}

export const AI_CHANNEL_VARIANT: Record<AiChannel, BadgeVariant> = {
  email: 'info',
  newsletter: 'accent',
  instagram: 'warning',
  whatsapp: 'success',
}

export const AI_TYPE_VARIANT: Record<AiContentType, BadgeVariant> = {
  flyer: 'accent',
  email: 'info',
  instagram_post: 'warning',
  whatsapp_message: 'success',
  newsletter: 'info',
}

export function aiChannelLabel(channel: AiChannel): string {
  return AI_CHANNEL_META[channel]?.label || channel
}

export function aiRecipientLabel(recipient: string | null | undefined): string {
  if (!recipient) return '—'
  return AI_RECIPIENT_META[recipient]?.label || recipient
}

export function parseAiPayload(payload: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  return payload || null
}

export function parseAiFlyer(payload: Record<string, unknown> | null | undefined): AiGeneratedFlyer | null {
  const p = parseAiPayload(payload)
  return p && typeof p.headline === 'string' ? (p as unknown as AiGeneratedFlyer) : null
}

export function parseAiEmail(payload: Record<string, unknown> | null | undefined): AiGeneratedEmail | null {
  const p = parseAiPayload(payload)
  return p && typeof p.subject === 'string' ? (p as unknown as AiGeneratedEmail) : null
}

export function parseAiInstagram(payload: Record<string, unknown> | null | undefined): AiGeneratedInstagram | null {
  const p = parseAiPayload(payload)
  return p && typeof p.caption === 'string' ? (p as unknown as AiGeneratedInstagram) : null
}

export function parseAiWhatsapp(payload: Record<string, unknown> | null | undefined): AiGeneratedWhatsapp | null {
  const p = parseAiPayload(payload)
  return p && typeof p.message === 'string' ? (p as unknown as AiGeneratedWhatsapp) : null
}

export function formatAiDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const normalized = typeof iso === 'string' && iso.includes('T') ? iso : iso.replace(' ', 'T')
  const d = new Date(normalized)
  if (Number.isNaN(d.getTime())) return String(iso).slice(0, 16)
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function svgToPng(url: string, scale = 2): Promise<string | null> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth * scale
        canvas.height = img.naturalHeight * scale
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(null)
          return
        }
        ctx.scale(scale, scale)
        ctx.drawImage(img, 0, 0)
        resolve(canvas.toDataURL('image/png'))
      } catch {
        resolve(null)
      }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export async function downloadSvgUrl(url: string, filename: string) {
  const res = await fetch(url)
  const text = await res.text()
  const blob = new Blob([text], { type: 'image/svg+xml' })
  const href = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(href)
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}