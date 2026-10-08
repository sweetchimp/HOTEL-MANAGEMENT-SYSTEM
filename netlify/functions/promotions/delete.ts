// ============================================================
// DELETE /api/promotions/:id
// ADMIN/MANAGER — soft delete (archives the promotion).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbPromotion } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'DELETE') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Promotion not found')

    await withConnection(async (conn) => {
      const existing = await conn.execute('SELECT * FROM PROMOTIONS WHERE ID = :id', { id })
      if (mapRows<DbPromotion>(existing.rows, 'PROMOTIONS').length === 0) {
        throw new NotFoundError('Promotion not found')
      }
      await conn.execute(
        `UPDATE PROMOTIONS SET STATUS = 'archived', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
        { id }
      )
    })

    return successResponse({ id, status: 'archived' }, 'Promotion archived')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
