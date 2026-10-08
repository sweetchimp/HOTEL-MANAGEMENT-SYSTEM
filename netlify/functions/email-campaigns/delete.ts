// ============================================================
// DELETE /api/email-campaigns/:id
// ADMIN/MANAGER — remove a campaign and its tracking rows.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbEmailCampaign } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'DELETE') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Campaign not found')

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id })
      if (mapRows<DbEmailCampaign>(existing.rows, 'EMAIL_CAMPAIGNS').length === 0) {
        throw new NotFoundError('Campaign not found')
      }
      await conn.execute('DELETE FROM EMAIL_TRACKING WHERE CAMPAIGN_ID = :campaign_id', { campaign_id: id })
      await conn.execute('DELETE FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id })
    })

    return successResponse({ id }, 'Campaign deleted')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
