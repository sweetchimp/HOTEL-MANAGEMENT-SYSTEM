// ============================================================
// GET /api/rooms
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbRoom, RoomListParams } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const params: RoomListParams = {
      status: url.searchParams.get('status') || undefined,
      type_id: url.searchParams.get('type_id') ? Number(url.searchParams.get('type_id')) : undefined,
      floor: url.searchParams.get('floor') ? Number(url.searchParams.get('floor')) : undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 20,
    }

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.status) { where += ' AND r.STATUS = :status'; binds.status = params.status }
      if (params.type_id) { where += ' AND r.TYPE_ID = :type_id'; binds.type_id = params.type_id }
      if (params.floor) { where += ' AND r.FLOOR = :floor'; binds.floor = params.floor }

      const countResult = await conn.execute(
        `SELECT COUNT(*) FROM ROOMS r ${where}`, binds
      )
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page! - 1) * params.pageSize!
      const rowsResult = await conn.execute(
        `SELECT r.ROOM_ID, r.ROOM_NUMBER, r.TYPE_ID, r.FLOOR, r.STATUS, r.DESCRIPTION
         FROM ROOMS r ${where}
         ORDER BY r.ROOM_NUMBER
         OFFSET ${offset} ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`,
        binds
      )

      const rooms = mapRows<DbRoom>(rowsResult.rows, 'ROOMS')
      return { rooms, total }
    })

    return paginatedResponse(result.rooms, result.total, params.page!, params.pageSize!)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
