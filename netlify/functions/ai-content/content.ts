// ============================================================
// GET /api/ai/content/:id
// ADMIN/MANAGER — full detail: content, parsed payload,
// version history, and distribution records.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { parseStoredContent } from './_shared/claude'
import type { DbAiContentVersion, DbAiDistribution, DbAiGeneratedContent, DbEmailCampaign, DbTrackingEvent } from '../_shared/types'

export function parseBundlePayload(content: DbAiGeneratedContent): Record<string, unknown> | null {
  return parseStoredContent<Record<string, unknown>>(content.GENERATED_CONTENT)
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const id = Number(new URL(req.url).pathname.split('/').pop())
    if (!Number.isFinite(id) || id <= 0) throw new BadRequestError('Invalid content id')

    const result = await withConnection(async (conn) => {
      const contentRes = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const content = mapRows<DbAiGeneratedContent>(contentRes.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new NotFoundError('AI content not found')

      const versions = mapRows<DbAiContentVersion>(
        (await conn.execute('SELECT * FROM AI_CONTENT_VERSIONS WHERE CONTENT_ID = :content_id', { content_id: content.ID })).rows,
        'AI_CONTENT_VERSIONS'
      )
      const distributions = mapRows<DbAiDistribution>(
        (await conn.execute('SELECT * FROM AI_CONTENT_DISTRIBUTIONS WHERE CONTENT_ID = :content_id', { content_id: content.ID })).rows,
        'AI_CONTENT_DISTRIBUTIONS'
      )

      const tracking = mapRows<DbTrackingEvent>(
        (await conn.execute('SELECT * FROM EMAIL_TRACKING')).rows,
        'EMAIL_TRACKING'
      )
      const campaigns = mapRows<DbEmailCampaign>(
        (await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS')).rows,
        'EMAIL_CAMPAIGNS'
      )

      const distroStats = distributions.map(d => {
        let engagement = Number(d.ENGAGEMENT_COUNT) || 0
        let campaign_status: string | null = null
        if (d.CAMPAIGN_ID) {
          const campaign = campaigns.find(c => c.ID === Number(d.CAMPAIGN_ID))
          campaign_status = campaign ? campaign.STATUS : null
          const events = tracking.filter(t => t.CAMPAIGN_ID === d.CAMPAIGN_ID)
          if (events.length > 0) engagement = events.filter(e => e.EVENT_TYPE === 'open' || e.EVENT_TYPE === 'click').length
        }
        return {
          ...d,
          campaign_status,
          engagement,
        }
      })

      return {
        content,
        content_payload: parseBundlePayload(content),
        versions: versions.sort((a, b) => b.VERSION_NUMBER - a.VERSION_NUMBER),
        distributions: distroStats.sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT))),
      }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}