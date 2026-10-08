// ============================================================
// GET /api/tracking/open/:campaign_id/:email
// Public — 1x1 open-tracking pixel. Always returns a GIF so
// email clients never see an error. Counts each recipient
// once (no double-counting from client refreshes).
// ============================================================

import { withConnection } from '../_shared/db'
import { mapRows } from '../_shared/row-mapper'
import type { DbEmailCampaign, DbTrackingEvent } from '../_shared/types'

const PIXEL = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64')

function pixelResponse(): Response {
  return new Response(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
    },
  })
}

export default async (req: Request) => {
  try {
    const parts = new URL(req.url).pathname.split('/')
    const campaignId = Number(parts[parts.length - 2])
    const email = decodeURIComponent(parts[parts.length - 1] || '').toLowerCase()

    if (Number.isFinite(campaignId) && email.includes('@')) {
      await withConnection(async (conn) => {
        const campRes = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id: campaignId })
        const campaign = mapRows<DbEmailCampaign>(campRes.rows, 'EMAIL_CAMPAIGNS')[0]
        if (!campaign) return

        const existing = mapRows<DbTrackingEvent>(
          (await conn.execute(
            'SELECT * FROM EMAIL_TRACKING WHERE CAMPAIGN_ID = :campaign_id AND RECIPIENT_EMAIL = :recipient_email AND EVENT_TYPE = :event_type',
            { campaign_id: campaignId, recipient_email: email, event_type: 'open' }
          )).rows,
          'EMAIL_TRACKING'
        )
        if (existing.length > 0) return

        await conn.execute(
          `INSERT INTO EMAIL_TRACKING (CAMPAIGN_ID, RECIPIENT_EMAIL, EVENT_TYPE, USER_AGENT, IP_ADDRESS)
           VALUES (:campaign_id, :recipient_email, 'open', :user_agent, :ip_address)`,
          {
            campaign_id: campaignId,
            recipient_email: email,
            user_agent: (req.headers.get('user-agent') || '').slice(0, 500),
            ip_address: (req.headers.get('x-forwarded-for') || 'unknown').slice(0, 50),
          }
        )
        await conn.execute('UPDATE EMAIL_CAMPAIGNS SET OPEN_COUNT = :open_count WHERE ID = :id', {
          id: campaignId,
          open_count: Number(campaign.OPEN_COUNT || 0) + 1,
        })
      })
    }
  } catch {
    // Tracking must never break the email client
  }

  return pixelResponse()
}
