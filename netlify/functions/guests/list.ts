// ============================================================
// GET /api/guests
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbGuest, GuestListParams } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const params: GuestListParams = {
      search: url.searchParams.get('search') || undefined,
      nationality: url.searchParams.get('nationality') || undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 20,
    }

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.search) {
        where += ' AND (UPPER(FIRST_NAME) LIKE :search OR UPPER(LAST_NAME) LIKE :search OR UPPER(EMAIL) LIKE :search OR PHONE LIKE :search)'
        binds.search = `%${params.search.toUpperCase()}%`
      }
      if (params.nationality) {
        where += ' AND UPPER(NATIONALITY) = :nat'
        binds.nat = params.nationality.toUpperCase()
      }

      const countResult = await conn.execute(`SELECT COUNT(*) FROM GUESTS ${where}`, binds)
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page! - 1) * params.pageSize!
      const rowsResult = await conn.execute(
        `SELECT * FROM GUESTS ${where} ORDER BY LAST_NAME, FIRST_NAME OFFSET ${offset} ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`,
        binds
      )

      const guests = mapRows<DbGuest>(rowsResult.rows, 'GUESTS')
      return { guests, total }
    })

    return paginatedResponse(result.guests, result.total, params.page!, params.pageSize!)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
