// ============================================================
// GET /api/bookings/pending  |  GET /api/bookings/requests
// Admin — paginated booking-request inbox with filters.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbBookingRequest, BookingRequestListParams } from '../_shared/types'

const SORTS: Record<string, string> = {
  newest: 'CREATED_AT DESC',
  oldest: 'CREATED_AT ASC',
  stay: 'CHECK_IN_DATE ASC',
  price: 'TOTAL_PRICE DESC',
}

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAdmin(req)
    const url = new URL(req.url)
    const isPendingRoute = url.pathname.endsWith('/pending')

    const params: BookingRequestListParams = {
      status: url.searchParams.get('status') || (isPendingRoute ? 'pending' : undefined),
      search: url.searchParams.get('search') || undefined,
      from: url.searchParams.get('from') || undefined,
      to: url.searchParams.get('to') || undefined,
      sort: url.searchParams.get('sort') || 'newest',
      page: Number(url.searchParams.get('page')) || 1,
      pageSize: Number(url.searchParams.get('pageSize')) || 20,
    }

    const orderBy = SORTS[params.sort!] || SORTS.newest

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (params.status && params.status !== 'all') {
        where += ' AND STATUS = :status'
        binds.status = params.status
      }
      if (params.search) {
        where += ' AND (UPPER(GUEST_NAME) LIKE :search OR UPPER(GUEST_EMAIL) LIKE :search)'
        binds.search = `%${params.search.toUpperCase()}%`
      }
      if (params.from) {
        where += ' AND CHECK_IN_DATE >= :from_date'
        binds.from_date = params.from
      }
      if (params.to) {
        where += ' AND CHECK_OUT_DATE <= :to_date'
        binds.to_date = params.to
      }

      const countResult = await conn.execute(`SELECT COUNT(*) FROM BOOKING_REQUESTS ${where}`, binds)
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (params.page! - 1) * params.pageSize!
      const rowsResult = await conn.execute(
        `SELECT * FROM BOOKING_REQUESTS ${where}
         ORDER BY ${orderBy}
         OFFSET ${offset} ROWS FETCH NEXT ${params.pageSize} ROWS ONLY`,
        binds
      )

      const items = mapRows<DbBookingRequest>(rowsResult.rows, 'BOOKING_REQUESTS')
      return { items, total }
    })

    return paginatedResponse(result.items, result.total, params.page!, params.pageSize!)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
