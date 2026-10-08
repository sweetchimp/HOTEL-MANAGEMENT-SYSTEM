// ============================================================
// GET /api/ai/content/history
// ADMIN/MANAGER — full generation history (newest first).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbAiDistribution, DbAiGeneratedContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const searchParams = new URL(req.url).searchParams
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const result = await withConnection(async (conn) => {
      const items = mapRows<DbAiGeneratedContent>(
        (await conn.execute('SELECT * FROM AI_GENERATED_CONTENT')).rows,
        'AI_GENERATED_CONTENT'
      )
        .filter(c => !type || c.TYPE === type)
        .filter(c => !status || c.STATUS === status)
        .filter(c => !search || c.TITLE.toUpperCase().includes(String(search).toUpperCase()))
        .sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT)))

      const distributions = mapRows<DbAiDistribution>(
        (await conn.execute('SELECT * FROM AI_CONTENT_DISTRIBUTIONS')).rows,
        'AI_CONTENT_DISTRIBUTIONS'
      )

      return items.map(c => ({
        ID: c.ID,
        TITLE: c.TITLE,
        TYPE: c.TYPE,
        STATUS: c.STATUS,
        BRAND_GUIDELINES: c.BRAND_GUIDELINES,
        CREATED_BY: c.CREATED_BY,
        CREATED_AT: c.CREATED_AT,
        UPDATED_AT: c.UPDATED_AT,
        APPROVED_BY: c.APPROVED_BY,
        APPROVED_AT: c.APPROVED_AT,
        FLYER_IMAGE_URL: c.FLYER_IMAGE_URL,
        DISTRIBUTION_COUNT: distributions.filter(d => d.CONTENT_ID === c.ID).length,
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}