// ============================================================
// DELETE /api/ai/content/:id
// ADMIN/MANAGER — delete generated content (cascades to its
// versions and distributions).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { removeFlyerSvg } from './_shared/flyer'
import type { DbAiGeneratedContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'DELETE') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const id = Number(new URL(req.url).pathname.split('/').pop())
    if (!Number.isFinite(id) || id <= 0) throw new BadRequestError('Invalid content id')

    const result = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const content = mapRows<DbAiGeneratedContent>(res.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new BadRequestError('AI content not found')

      if (content.FLYER_IMAGE_URL) {
        await removeFlyerSvg(id)
      }
      const del = await conn.execute('DELETE FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const affected = del.rowsAffected
      return { id, deleted: typeof affected === 'number' ? affected : 1 }
    })

    return successResponse(result, 'Content deleted')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}