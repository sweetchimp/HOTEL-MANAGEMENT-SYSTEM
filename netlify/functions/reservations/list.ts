// ============================================================
// GET /api/reservations
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbReservation, ReservationListParams } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const params: ReservationListParams = {
      status: url.searchParams.get('status') || undefined,
      guest_id: url.searchParams.get('guest_id') ? Number(url.searchParams.get('guest_id')) : undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 20,
    }

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.status) { where += ' AND r.STATUS = :status'; binds.status = params.status }
      if (params.guest_id) { where += ' AND r.GUEST_ID = :guest_id'; binds.guest_id = params.guest_id }
      if (params.from) { where += ' AND r.CHECK_IN_DATE >= :from_date'; binds.from_date = params.from }
      if (params.to) { where += ' AND r.CHECK_OUT_DATE <= :to_date'; binds.to_date = params.to }

      const countResult = await conn.execute(`SELECT COUNT(*) FROM RESERVATIONS r ${where}`, binds)
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page! - 1) * params.pageSize!
      const rowsResult = await conn.execute(
        `SELECT r.RESERVATION_ID, r.GUEST_ID, r.ROOM_TYPE_ID, r.CHECK_IN_DATE, r.CHECK_OUT_DATE, r.STATUS, r.SPECIAL_REQUESTS, r.CREATED_BY, r.CREATED_AT, r.UPDATED_AT
         FROM RESERVATIONS r ${where}
         ORDER BY r.CREATED_AT DESC
         OFFSET ${offset} ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`,
        binds
      )

      const reservations = mapRows<DbReservation>(rowsResult.rows, 'RESERVATIONS')
      return { reservations, total }
    })

    return paginatedResponse(result.reservations, result.total, params.page!, params.pageSize!)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
