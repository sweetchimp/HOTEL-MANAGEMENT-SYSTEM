import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const totalRoomsResult = await conn.execute('SELECT COUNT(*) FROM ROOMS')
      const totalRooms = Number(totalRoomsResult.rows[0]?.[0] || 0)

      const occupiedResult = await conn.execute("SELECT COUNT(*) FROM ROOMS WHERE STATUS = 'OCCUPIED'")
      const occupied = Number(occupiedResult.rows[0]?.[0] || 0)
      const occupancyRate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0

      const totalGuestsResult = await conn.execute('SELECT COUNT(*) FROM GUESTS')
      const totalGuests = Number(totalGuestsResult.rows[0]?.[0] || 0)

      const totalReservationsResult = await conn.execute('SELECT COUNT(*) FROM RESERVATIONS')
      const totalReservations = Number(totalReservationsResult.rows[0]?.[0] || 0)

      const totalRevenueResult = await conn.execute('SELECT NVL(SUM(TOTAL_AMOUNT), 0) FROM INVOICES')
      const totalRevenue = Number(totalRevenueResult.rows[0]?.[0] || 0)

      const completedBookingsResult = await conn.execute("SELECT COUNT(*) FROM BOOKINGS WHERE STATUS = 'COMPLETED'")
      const completedBookings = Number(completedBookingsResult.rows[0]?.[0] || 0)

      const rateResult = await conn.execute("SELECT NVL(AVG(RATE_PER_NIGHT), 0) FROM BOOKINGS WHERE STATUS = 'COMPLETED'")
      const avgRate = Number(rateResult.rows[0]?.[0] || 0)

      return {
        totalRooms,
        occupiedRooms: occupied,
        occupancyRate,
        totalGuests,
        totalReservations,
        completedBookings,
        totalRevenue,
        avgRatePerNight: avgRate,
        avgStayLength: 3,
      }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
