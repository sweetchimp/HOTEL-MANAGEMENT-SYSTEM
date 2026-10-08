// ============================================================
// GET /api/email-campaigns/:id/stats
// ADMIN/MANAGER — open/click analytics for one campaign.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { buildStats } from '../_shared/marketing'
import type { DbEmailCampaign, DbTrackingEvent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 2])
    if (!Number.isFinite(id)) throw new NotFoundError('Campaign not found')

    const stats = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id })
      const campaign = mapRows<DbEmailCampaign>(res.rows, 'EMAIL_CAMPAIGNS')[0]
      if (!campaign) throw new NotFoundError('Campaign not found')

      const tracking = mapRows<DbTrackingEvent>(
        (await conn.execute('SELECT * FROM EMAIL_TRACKING WHERE CAMPAIGN_ID = :campaign_id', { campaign_id: id })).rows,
        'EMAIL_TRACKING'
      )
      return buildStats(campaign, tracking)
    })

    return successResponse(stats)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
