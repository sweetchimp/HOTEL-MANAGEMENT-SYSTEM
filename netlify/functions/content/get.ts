// ============================================================
// GET /api/content/:id
// ADMIN/MANAGER — single content item.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 1])
    if (!Number.isFinite(id)) throw new NotFoundError('Content not found')

    const item = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM CONTENT WHERE ID = :id', { id })
      return mapRows<DbContent>(res.rows, 'CONTENT')[0] || null
    })

    if (!item) throw new NotFoundError('Content not found')
    return successResponse(item)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
