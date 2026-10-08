// ============================================================
// POST /api/ai/content/:id/approve
// ADMIN/MANAGER — mark generated content as approved so it can
// be distributed.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbAiGeneratedContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/').filter(Boolean)
    const id = Number(parts[parts.length - 2])
    if (!Number.isFinite(id) || id <= 0) throw new BadRequestError('Invalid content id')

    const result = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const content = mapRows<DbAiGeneratedContent>(res.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new BadRequestError('AI content not found')

      await conn.execute(
        `UPDATE AI_GENERATED_CONTENT
         SET STATUS = :status, APPROVED_BY = :approved_by, APPROVED_AT = CURRENT_TIMESTAMP, UPDATED_AT = CURRENT_TIMESTAMP
         WHERE ID = :id`,
        { id: content.ID, status: 'approved', approved_by: user.user_id }
      )

      return content.ID
    })

    return successResponse({ id: result, status: 'approved' }, 'Content approved')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}