// ============================================================
// AI Content distribution helpers — email/newsletter via the
// Phase-4 campaign machinery, plus Instagram / WhatsApp posting
// (real Graph API when configured, manual preview otherwise).
// ============================================================

import type { DBConnection } from '../../_shared/db'
import { mapRows } from '../../_shared/row-mapper'
import { parseStoredContent } from './claude'
import type {
  AiChannel,
  AiGeneratedEmail,
  DbAiDistribution,
  DbAiGeneratedContent,
  DbEmailCampaign,
  DbTrackingEvent,
} from '../../_shared/types'

export const AI_CHANNELS: AiChannel[] = ['email', 'newsletter', 'instagram', 'whatsapp']
export const EMAIL_RECIPIENT_TYPES = ['all_guests', 'past_guests', 'newsletter_subscribers']

function escHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function buildEmailHtml(email: AiGeneratedEmail): string {
  const preheader = email.preheader
    ? `<p style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;">${escHtml(email.preheader)}</p>`
    : ''
  const showPreheader = preheader ? '' : 'display:none;'

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escHtml(email.subject)}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef1f4;">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#eef1f4;padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#0d1b2a;padding:24px 32px;">
        <span style="font-family:Georgia,serif;font-size:20px;letter-spacing:4px;color:#c9a227;">ALTONSHOTEL</span>
      </td></tr>
      <tr><td style="padding:32px;color:#44505c;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;">
        <h1 style="margin:0 0 16px;color:#1a2b3c;font-family:Georgia,serif;font-size:26px;${showPreheader}">${escHtml(email.headline)}</h1>
        ${email.body_html}
      </td></tr>
      <tr><td style="background:#f6f4ee;padding:20px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#8894a0;">
        ALTONSHOTEL · 123 Main Street · City &nbsp;|&nbsp; +1-555-0100
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

async function getContent(conn: DBConnection, contentId: number): Promise<DbAiGeneratedContent> {
  const res = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id: contentId })
  const row = mapRows<DbAiGeneratedContent>(res.rows, 'AI_GENERATED_CONTENT')[0]
  if (!row) throw new Error(`AI content #${contentId} not found`)
  return row
}

function emailPayload(content: DbAiGeneratedContent): AiGeneratedEmail | null {
  return parseStoredContent<AiGeneratedEmail>(content.GENERATED_CONTENT)
}

// ----------------------------------------------------------------
// Channel publish helpers
// ----------------------------------------------------------------

export async function publishInstagram(content: DbAiGeneratedContent): Promise<{ status: 'sent' | 'manual'; note: string }> {
  const instagram = parseStoredContent<{ caption: string; hashtags: string }>(content.GENERATED_CONTENT)
  const caption = instagram ? `${instagram.caption} ${instagram.hashtags}` : content.ADMIN_PROMPT

  const token = process.env.INSTAGRAM_ACCESS_TOKEN
  const userId = process.env.INSTAGRAM_USER_ID
  const imageUrl = content.FLYER_IMAGE_URL

  if (token && userId && imageUrl) {
    const absoluteUrl = imageUrl.startsWith('http')
      ? imageUrl
      : `${process.env.APP_URL || 'http://localhost:5173'}${imageUrl}`
    try {
      const creation = await fetch(
        `https://graph.facebook.com/v21.0/${userId}/media`,
        {
          method: 'POST',
          body: new URLSearchParams({
            image_url: absoluteUrl,
            caption,
            access_token: token,
          }),
        }
      )
      const created = await creation.json() as { id?: string; error?: { message: string } }
      if (!creation.ok || !created.id) {
        throw new Error(created.error?.message || 'Instagram media creation failed')
      }
      const publish = await fetch(
        `https://graph.facebook.com/v21.0/${userId}/media_publish`,
        {
          method: 'POST',
          body: new URLSearchParams({ creation_id: created.id, access_token: token }),
        }
      )
      if (!publish.ok) {
        throw new Error('Instagram publish failed')
      }
      return { status: 'sent', note: 'Published to Instagram' }
    } catch (err) {
      return { status: 'manual', note: `Instagram post could not be automated (${err instanceof Error ? err.message : 'error'}) — copy preview instead` }
    }
  }

  return { status: 'manual', note: 'Copy the caption and post manually (set INSTAGRAM_ACCESS_TOKEN/INSTAGRAM_USER_ID to automate)' }
}

export async function publishWhatsapp(content: DbAiGeneratedContent): Promise<{ status: 'sent' | 'manual'; note: string }> {
  const whatsapp = parseStoredContent<{ message: string }>(content.GENERATED_CONTENT)
  const message = whatsapp ? whatsapp.message : content.ADMIN_PROMPT

  const token = process.env.WHATSAPP_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const to = process.env.WHATSAPP_TO

  if (token && phoneId && to) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${phoneId}/messages`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ messaging_product: 'whatsapp', to, text: { body: message } }),
        }
      )
      if (!res.ok) throw new Error(`WhatsApp API ${res.status}`)
      return { status: 'sent', note: 'Sent via WhatsApp' }
    } catch (err) {
      return { status: 'manual', note: `WhatsApp could not be automated (${err instanceof Error ? err.message : 'error'}) — copy message instead` }
    }
  }

  return { status: 'manual', note: 'Copy the message and send manually (set WHATSAPP_TOKEN/WHATSAPP_PHONE_ID/WHATSAPP_TO to automate)' }
}

// ----------------------------------------------------------------
// Scheduled delivery reconciliation
// ----------------------------------------------------------------

function toLocalMinute(value: string): string | null {
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isDueAt(value: string | null): boolean {
  if (!value) return false
  const scheduled = toLocalMinute(value)
  if (!scheduled) return false
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return scheduled <= nowLocal
}

export async function runScheduledDistributions(): Promise<number> {
  try {
    return await withDistributionConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM AI_CONTENT_DISTRIBUTIONS WHERE STATUS = :status', { status: 'scheduled' })
      const due = mapRows<DbAiDistribution>(res.rows, 'AI_CONTENT_DISTRIBUTIONS')
        .filter(d => {
          if (d.STATUS !== 'scheduled') return false
          if (d.CHANNEL === 'instagram' || d.CHANNEL === 'whatsapp') return isDueAt(d.SCHEDULED_AT)
          return d.CAMPAIGN_ID !== null
        })

      let processed = 0
      for (const distro of due) {
        if ((distro.CHANNEL === 'email' || distro.CHANNEL === 'newsletter') && distro.CAMPAIGN_ID) {
          const campRes = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id: distro.CAMPAIGN_ID })
          const campaign = mapRows<DbEmailCampaign>(campRes.rows, 'EMAIL_CAMPAIGNS')[0]
          if (campaign) {
            if (campaign.STATUS === 'sent') {
              const trackingRes = await conn.execute('SELECT * FROM EMAIL_TRACKING WHERE CAMPAIGN_ID = :campaign_id', { campaign_id: campaign.ID })
              const events = mapRows<DbTrackingEvent>(trackingRes.rows, 'EMAIL_TRACKING')
              const engagement = events.filter(e => e.EVENT_TYPE === 'open' || e.EVENT_TYPE === 'click').length
              await conn.execute(
                `UPDATE AI_CONTENT_DISTRIBUTIONS
                 SET STATUS = 'sent', RECIPIENT_COUNT = :recipient_count, ENGAGEMENT_COUNT = :engagement, SENT_AT = CURRENT_TIMESTAMP
                 WHERE ID = :id`,
                { id: distro.ID, recipient_count: campaign.RECIPIENT_COUNT, engagement }
              )
              console.log(`[AI:SCHEDULER] Distribution #${distro.ID} (${distro.CHANNEL}) marked sent`)
              processed++
            } else if (campaign.STATUS === 'failed') {
              await conn.execute(
                `UPDATE AI_CONTENT_DISTRIBUTIONS SET STATUS = 'failed' WHERE ID = :id`,
                { id: distro.ID }
              )
              processed++
            }
          }
          continue
        }

        const content = await getContent(conn, distro.CONTENT_ID)
        const outcome = distro.CHANNEL === 'instagram'
          ? await publishInstagram(content)
          : await publishWhatsapp(content)
        await conn.execute(
          `UPDATE AI_CONTENT_DISTRIBUTIONS SET STATUS = :status, SENT_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
          { id: distro.ID, status: outcome.status }
        )
        if (outcome.status === 'sent') {
          await conn.execute(
            `UPDATE AI_GENERATED_CONTENT SET STATUS = 'published' WHERE ID = :id`,
            { id: content.ID }
          )
        }
        console.log(`[AI:SCHEDULER] Distribution #${distro.ID} (${distro.CHANNEL}) -> ${outcome.status}`)
        processed++
      }
      return processed
    })
  } catch (err) {
    console.error('[AI:SCHEDULER] error:', err instanceof Error ? err.message : err)
    return 0
  }
}

async function withDistributionConnection<T>(fn: (conn: DBConnection) => Promise<T>): Promise<T> {
  const { withConnection } = await import('../../_shared/db')
  return withConnection(fn)
}