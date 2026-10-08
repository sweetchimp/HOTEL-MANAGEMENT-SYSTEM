// ============================================================
// DELETE /api/content/:id
// ADMIN/MANAGER — soft delete (archives the item).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'DELETE') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Content not found')

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM CONTENT WHERE ID = :id', { id })
      if (mapRows<DbContent>(existing.rows, 'CONTENT').length === 0) {
        throw new NotFoundError('Content not found')
      }
      await conn.execute(
        `UPDATE CONTENT SET STATUS = 'archived', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
        { id }
      )
    })

    return successResponse({ id, status: 'archived' }, 'Content archived')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
