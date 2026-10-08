// ============================================================
// GET /api/tracking/click/:campaign_id/:link_id?url=...
// Public — records the click, then 302-redirects to the
// original URL.
// ============================================================

import { withConnection } from '../_shared/db'
import { errorResponse, optionsResponse } from '../_shared/response'
import { BadRequestError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbEmailCampaign } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const campaignId = Number(parts[parts.length - 2])
    const target = url.searchParams.get('url') || ''

    if (!target || !/^https?:\/\//i.test(target)) {
      throw new BadRequestError('Invalid redirect URL')
    }

    if (Number.isFinite(campaignId)) {
      const recipient = (url.searchParams.get('e') || 'unknown').toLowerCase()
      await withConnection(async (conn) => {
        const campRes = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id: campaignId })
        const campaign = mapRows<DbEmailCampaign>(campRes.rows, 'EMAIL_CAMPAIGNS')[0]
        if (!campaign) return

        await conn.execute(
          `INSERT INTO EMAIL_TRACKING (CAMPAIGN_ID, RECIPIENT_EMAIL, EVENT_TYPE, LINK_URL, USER_AGENT, IP_ADDRESS)
           VALUES (:campaign_id, :recipient_email, 'click', :link_url, :user_agent, :ip_address)`,
          {
            campaign_id: campaignId,
            recipient_email: recipient.slice(0, 100),
            link_url: target.slice(0, 500),
            user_agent: (req.headers.get('user-agent') || '').slice(0, 500),
            ip_address: (req.headers.get('x-forwarded-for') || 'unknown').slice(0, 50),
          }
        )
        await conn.execute('UPDATE EMAIL_CAMPAIGNS SET CLICK_COUNT = :click_count WHERE ID = :id', {
          id: campaignId,
          click_count: Number(campaign.CLICK_COUNT || 0) + 1,
        })
      })
    }

    return Response.redirect(target, 302)
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : 'Bad request', 400)
  }
}
