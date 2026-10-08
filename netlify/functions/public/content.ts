// ============================================================
// GET /api/public/content
// Public — published news / announcements / events (latest 6).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    const items = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM CONTENT WHERE STATUS = :status', { status: 'published' })
      return mapRows<DbContent>(res.rows, 'CONTENT')
        .filter(c => c.STATUS === 'published')
        .sort((a, b) => String(b.PUBLISHED_AT || b.CREATED_AT).localeCompare(String(a.PUBLISHED_AT || a.CREATED_AT)))
        .slice(0, 6)
    })

    return successResponse(items)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
