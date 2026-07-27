// ============================================================
// GET /api/guests/search?q=
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbGuest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const query = url.searchParams.get('q') || ''

    if (query.length < 2) {
      return successResponse([])
    }

    const guests = await withConnection(async (conn) => {
      const searchPattern = `%${query.toUpperCase()}%`
      const result = await conn.execute(
        `SELECT * FROM GUESTS
         WHERE UPPER(FIRST_NAME) LIKE :q OR UPPER(LAST_NAME) LIKE :q
            OR UPPER(EMAIL) LIKE :q OR PHONE LIKE :q OR ID_NUMBER LIKE :q
         ORDER BY LAST_NAME, FIRST_NAME
         FETCH FIRST 10 ROWS ONLY`,
        { q: searchPattern }
      )
      return mapRows<DbGuest>(result.rows, 'GUESTS')
    })

    return successResponse(guests)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
