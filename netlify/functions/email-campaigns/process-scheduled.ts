// ============================================================
// Scheduler hook (dev-server timer) — delivers campaigns whose
// SCHEDULED_AT time has passed. On Netlify this would be a
// scheduled function; locally dev-server.js calls this every 60s.
// ============================================================

import { withConnection } from '../_shared/db'
import { mapRows } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { resolveRecipients, sendCampaignEmails } from '../_shared/marketing'
import type { DbEmailCampaign } from '../_shared/types'

function toLocalMinute(value: string): string | null {
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) return s.slice(0, 16)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function isDue(c: DbEmailCampaign): boolean {
  if (c.STATUS !== 'scheduled' || !c.SCHEDULED_AT) return false
  const scheduled = toLocalMinute(c.SCHEDULED_AT)
  if (!scheduled) return false
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
  return scheduled <= nowLocal
}

export async function runScheduledCampaigns(): Promise<number> {
  try {
    return await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE STATUS = :status', { status: 'scheduled' })
      const due = mapRows<DbEmailCampaign>(res.rows, 'EMAIL_CAMPAIGNS')
        .filter(c => c.STATUS === 'scheduled')
        .filter(isDue)

      for (const campaign of due) {
        const recipients = await resolveRecipients(conn, campaign.RECIPIENT_TYPE)
        if (recipients.length === 0) {
          await conn.execute(
            `UPDATE EMAIL_CAMPAIGNS SET STATUS = 'failed', RECIPIENT_COUNT = 0 WHERE ID = :id`,
            { id: campaign.ID }
          )
          console.log(`[SCHEDULER] Campaign #${campaign.ID} "${campaign.TITLE}" failed — no recipients`)
          continue
        }
        const sent = await sendCampaignEmails(conn, campaign, recipients, (opts) => sendEmail(opts))
        await conn.execute(
          `UPDATE EMAIL_CAMPAIGNS
           SET STATUS = 'sent', SENT_AT = CURRENT_TIMESTAMP, RECIPIENT_COUNT = :recipient_count
           WHERE ID = :id`,
          { id: campaign.ID, recipient_count: sent }
        )
        console.log(`[SCHEDULER] Campaign #${campaign.ID} "${campaign.TITLE}" sent to ${sent} recipient(s)`)
      }
      return due.length
    })
  } catch (err) {
    console.error('[SCHEDULER] error:', err instanceof Error ? err.message : err)
    return 0
  }
}
