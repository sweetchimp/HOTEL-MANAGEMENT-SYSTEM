// ============================================================
// GET /api/email-campaigns
// ADMIN/MANAGER — list campaigns (with template name + stats).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { buildStats } from '../_shared/marketing'
import type { DbEmailCampaign, DbEmailTemplate, DbTrackingEvent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const status = new URL(req.url).searchParams.get('status') || undefined

    const items = await withConnection(async (conn) => {
      const binds: Record<string, unknown> = {}
      let where = ''
      if (status && status !== 'all') {
        where = 'WHERE STATUS = :status'
        binds.status = status
      }
      const campaigns = mapRows<DbEmailCampaign>(
        (await conn.execute(`SELECT * FROM EMAIL_CAMPAIGNS ${where}`, binds)).rows,
        'EMAIL_CAMPAIGNS'
      )
      const templates = mapRows<DbEmailTemplate>(
        (await conn.execute('SELECT * FROM EMAIL_TEMPLATES')).rows,
        'EMAIL_TEMPLATES'
      )
      const tracking = mapRows<DbTrackingEvent>(
        (await conn.execute('SELECT * FROM EMAIL_TRACKING')).rows,
        'EMAIL_TRACKING'
      )

      return campaigns
        .sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT)))
        .map(c => {
          const tpl = templates.find(t => t.ID === Number(c.TEMPLATE_ID))
          const stats = buildStats(c, tracking)
          return {
            ...c,
            TEMPLATE_NAME: tpl ? tpl.NAME : null,
            open_rate: stats.open_rate,
            click_rate: stats.click_rate,
            total_opens: stats.total_opens,
            total_clicks: stats.total_clicks,
          }
        })
    })

    return successResponse(items)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
