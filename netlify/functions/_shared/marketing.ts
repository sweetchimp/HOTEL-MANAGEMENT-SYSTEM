// ============================================================
// Phase 4 — Marketing helpers: template rendering, recipient
// resolution, open/click tracking HTML, and campaign stats.
// ============================================================

import type { DBConnection } from './db'
import { mapRows } from './row-mapper'
import type {
  DbGuest,
  DbReservation,
  DbSubscriber,
  DbEmailCampaign,
  DbTrackingEvent,
  CampaignStats,
  RecipientCounts,
} from './types'

export const CONTENT_TYPES = ['news', 'announcement', 'event']
export const PROMOTION_STATUSES = ['draft', 'active', 'archived']
export const RECIPIENT_TYPES = ['all_guests', 'past_guests', 'newsletter_subscribers']
export const TEMPLATE_TYPES = ['welcome', 'promotion', 'newsletter', 'event', 'reminder', 'custom']

export const PLACEHOLDER_KEYS = [
  'guest_name',
  'room_number',
  'check_in_date',
  'check_out_date',
  'total_spent',
  'hotel_name',
] as const

export const SAMPLE_RENDER_DATA: Record<string, string> = {
  guest_name: 'John Doe',
  room_number: '501',
  check_in_date: '2026-10-15',
  check_out_date: '2026-10-18',
  total_spent: '$450',
  hotel_name: 'ALTONSHOTEL',
}

export function trackingBaseUrl(): string {
  return process.env.APP_URL || 'http://localhost:5173'
}

export function derivePromotionStatus(p: {
  STATUS: string
  START_DATE: string
  END_DATE: string
}, today = new Date()): string {
  if (p.STATUS !== 'active') return p.STATUS
  const iso = today.toISOString().slice(0, 10)
  if (p.END_DATE && p.END_DATE < iso) return 'expired'
  if (p.START_DATE && p.START_DATE > iso) return 'upcoming'
  return 'active'
}

export function renderTemplate(body: string, data: Record<string, string>): string {
  if (!body) return ''
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => data[key] ?? '')
}

export async function resolveRecipients(
  conn: DBConnection,
  type: string
): Promise<string[]> {
  if (type === 'newsletter_subscribers') {
    const res = await conn.execute(`SELECT * FROM SUBSCRIBERS WHERE STATUS = :status`, { status: 'active' })
    const rows = mapRows<DbSubscriber>(res.rows, 'SUBSCRIBERS')
    return dedupeEmails(rows.map(s => s.EMAIL))
  }

  const guestsRes = await conn.execute('SELECT * FROM GUESTS')
  const guests = mapRows<DbGuest>(guestsRes.rows, 'GUESTS')

  if (type === 'all_guests') {
    return dedupeEmails(guests.map(g => g.EMAIL))
  }

  // past_guests — anyone with a COMPLETED or CHECKED_IN reservation
  const resRes = await conn.execute('SELECT * FROM RESERVATIONS')
  const reservations = mapRows<DbReservation>(resRes.rows, 'RESERVATIONS')
  const pastGuestIds = new Set(
    reservations
      .filter(r => r.STATUS === 'COMPLETED' || r.STATUS === 'CHECKED_IN')
      .map(r => r.GUEST_ID)
  )
  return dedupeEmails(guests.filter(g => pastGuestIds.has(g.GUEST_ID)).map(g => g.EMAIL))
}

export async function resolveRecipientCounts(conn: DBConnection): Promise<RecipientCounts> {
  const guests = mapRows<DbGuest>((await conn.execute('SELECT * FROM GUESTS')).rows, 'GUESTS')
  const reservations = mapRows<DbReservation>((await conn.execute('SELECT * FROM RESERVATIONS')).rows, 'RESERVATIONS')
  const subscribers = mapRows<DbSubscriber>((await conn.execute('SELECT * FROM SUBSCRIBERS')).rows, 'SUBSCRIBERS')

  const pastGuestIds = new Set(
    reservations
      .filter(r => r.STATUS === 'COMPLETED' || r.STATUS === 'CHECKED_IN')
      .map(r => r.GUEST_ID)
  )
  const withEmail = guests.filter(g => g.EMAIL && g.EMAIL.includes('@'))

  return {
    all_guests: dedupeEmails(withEmail.map(g => g.EMAIL)).length,
    past_guests: dedupeEmails(withEmail.filter(g => pastGuestIds.has(g.GUEST_ID)).map(g => g.EMAIL)).length,
    newsletter_subscribers: dedupeEmails(
      subscribers.filter(s => s.STATUS === 'active').map(s => s.EMAIL)
    ).length,
  }
}

function dedupeEmails(emails: (string | null | undefined)[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of emails) {
    if (!raw || !raw.includes('@')) continue
    const key = raw.trim().toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(key)
  }
  return out
}

export function buildTrackingHtml(
  bodyHtml: string,
  campaignId: number,
  recipientEmail: string
): string {
  const base = trackingBaseUrl()
  let html = bodyHtml || ''

  html = html.replace(/<a\s+([^>]*?)href="(https?:\/\/[^"]+)"([^>]*?)>/gi,
    (_match, pre: string, href: string, post: string) => {
      const tracked = `${base}/api/tracking/click/${campaignId}/1?url=${encodeURIComponent(href)}&e=${encodeURIComponent(recipientEmail)}`
      return `<a ${pre}href="${tracked}"${post}>`
    })

  const pixel = `${base}/api/tracking/open/${campaignId}/${encodeURIComponent(recipientEmail)}`
  html += `<img src="${pixel}" width="1" height="1" alt="" style="display:none" />`
  return html
}

export function buildStats(
  campaign: DbEmailCampaign,
  events: DbTrackingEvent[]
): CampaignStats {
  const forCampaign = events.filter(e => e.CAMPAIGN_ID === campaign.ID)
  const opens = forCampaign.filter(e => e.EVENT_TYPE === 'open')
  const clicks = forCampaign.filter(e => e.EVENT_TYPE === 'click')

  const uniqueOpeners = new Set(opens.map(e => e.RECIPIENT_EMAIL.toLowerCase()))
  const uniqueClickers = new Set(clicks.map(e => e.RECIPIENT_EMAIL.toLowerCase()))
  const totalSent = Number(campaign.RECIPIENT_COUNT) || 0

  const byDay = new Map<string, number>()
  for (const e of opens) {
    const day = String(e.CREATED_AT).slice(0, 10)
    byDay.set(day, (byDay.get(day) || 0) + 1)
  }

  const byLink = new Map<string, number>()
  for (const c of clicks) {
    if (!c.LINK_URL) continue
    byLink.set(c.LINK_URL, (byLink.get(c.LINK_URL) || 0) + 1)
  }

  return {
    campaign_id: campaign.ID,
    total_sent: totalSent,
    total_opens: uniqueOpeners.size,
    open_rate: totalSent > 0 ? Math.round((uniqueOpeners.size / totalSent) * 100) : 0,
    total_clicks: clicks.length,
    click_rate: totalSent > 0 ? Math.round((uniqueClickers.size / totalSent) * 100) : 0,
    opens_by_day: [...byDay.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count })),
    top_links: [...byLink.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([url, count]) => ({ url, count })),
  }
}

export async function sendCampaignEmails(
  conn: DBConnection,
  campaign: { ID: number; TEMPLATE_ID: number | null; TITLE: string; SUBJECT_OVERRIDE: string | null; BODY_OVERRIDE: string | null },
  recipients: string[],
  send: (opts: { to: string; subject: string; html: string }) => Promise<unknown>
): Promise<number> {
  let subject = campaign.SUBJECT_OVERRIDE || campaign.TITLE
  let bodyHtml = campaign.BODY_OVERRIDE || ''

  if (campaign.TEMPLATE_ID) {
    const tplRes = await conn.execute('SELECT * FROM EMAIL_TEMPLATES WHERE ID = :id', { id: campaign.TEMPLATE_ID })
    const tpl = mapRows<{ SUBJECT: string; BODY: string }>(tplRes.rows, 'EMAIL_TEMPLATES')[0]
    if (tpl) {
      if (!campaign.SUBJECT_OVERRIDE) subject = tpl.SUBJECT || campaign.TITLE
      if (!campaign.BODY_OVERRIDE) bodyHtml = tpl.BODY || ''
    }
  }

  let sent = 0
  for (const email of recipients) {
    const personalized = renderTemplate(bodyHtml, {
      ...SAMPLE_RENDER_DATA,
      guest_name: email.split('@')[0].replace(/[._]/g, ' '),
    })
    const html = buildTrackingHtml(personalized, campaign.ID, email)
    await send({ to: email, subject, html })
    sent++
  }
  return sent
}
