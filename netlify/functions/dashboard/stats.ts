// ============================================================
// GET /api/dashboard/stats
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const today = new Date().toISOString().split('T')[0]

      const totalRooms = await conn.execute('SELECT COUNT(*) FROM ROOMS')
      const occupiedRooms = await conn.execute(
        'SELECT COUNT(*) FROM ROOMS WHERE STATUS = :status',
        { status: 'OCCUPIED' }
      )
      const arrivalsToday = await conn.execute(
        "SELECT COUNT(*) FROM RESERVATIONS WHERE STATUS = :status AND CHECK_IN_DATE = :today",
        { status: 'CONFIRMED', today }
      )
      const departuresToday = await conn.execute(
        "SELECT COUNT(*) FROM RESERVATIONS WHERE STATUS = :status AND CHECK_OUT_DATE = :today",
        { status: 'CHECKED_IN', today }
      )
      const todayRevenue = await conn.execute(
        'SELECT NVL(SUM(TOTAL_AMOUNT), 0) FROM INVOICES'
      )

      const total = Number(totalRooms.rows[0]?.[0] || 0)
      const occupied = Number(occupiedRooms.rows[0]?.[0] || 0)
      const occupancy = total > 0 ? Math.round((occupied / total) * 100) : 0

      return {
        todayArrivals: Number(arrivalsToday.rows[0]?.[0] || 0),
        todayDepartures: Number(departuresToday.rows[0]?.[0] || 0),
        occupancyRate: occupancy,
        todayRevenue: Number(todayRevenue.rows[0]?.[0] || 0),
      }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
