import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const todayResult = await conn.execute("SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') FROM DUAL", {})
      const today = todayResult.rows[0]?.[0] as string || new Date().toISOString().split('T')[0]

      const rowsResult = await conn.execute(
        `SELECT b.BOOKING_ID, b.ROOM_ID, r.ROOM_NUMBER, b.CHECK_OUT_DATE,
                g.FIRST_NAME || ' ' || g.LAST_NAME as GUEST_NAME, '' as ASSIGNED_STAFF
         FROM BOOKINGS b
         JOIN ROOMS r ON b.ROOM_ID = r.ROOM_ID
         JOIN RESERVATIONS res ON b.RESERVATION_ID = res.RESERVATION_ID
         JOIN GUESTS g ON res.GUEST_ID = g.GUEST_ID
         WHERE b.CHECK_OUT_DATE = :today AND b.STATUS = 'ACTIVE'
         ORDER BY r.ROOM_ID`,
        { today }
      )

      return rowsResult.rows.map((row: unknown[]) => ({
        booking_id: row[0],
        room_id: row[1],
        room_number: row[2],
        check_out_date: row[3],
        guest_name: row[4],
        assigned_staff: row[5],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
