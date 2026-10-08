// ============================================================
// GET /api/content
// ADMIN/MANAGER — paginated content list with filters.
// ============================================================

import { withConnection } from '../_shared/db'
import { paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { CONTENT_TYPES } from '../_shared/marketing'
import type { DbContent, ContentListParams } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const url = new URL(req.url)

    const params: ContentListParams = {
      type: url.searchParams.get('type') || undefined,
      status: url.searchParams.get('status') || undefined,
      search: url.searchParams.get('search') || undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 10,
    }

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.type && params.type !== 'all') {
        if (!CONTENT_TYPES.includes(params.type)) throw new AppError(400, `type must be one of: ${CONTENT_TYPES.join(', ')}`)
        where += ' AND TYPE = :type'
        binds.type = params.type
      }
      if (params.status && params.status !== 'all') {
        where += ' AND STATUS = :status'
        binds.status = params.status
      }
      if (params.search) {
        where += ' AND UPPER(TITLE) LIKE :search'
        binds.search = `%${params.search.toUpperCase()}%`
      }

      const countResult = await conn.execute(`SELECT COUNT(*) FROM CONTENT ${where}`, binds)
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page! - 1) * params.pageSize!
      const rowsResult = await conn.execute(
        `SELECT * FROM CONTENT ${where}
         ORDER BY CREATED_AT DESC
         OFFSET ${offset} ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`,
        binds
      )

      const items = mapRows<DbContent>(rowsResult.rows, 'CONTENT')
        .sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT)))
      return { items, total }
    })

    return paginatedResponse(result.items, result.total, params.page!, params.pageSize!)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
