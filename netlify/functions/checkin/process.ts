// ============================================================
// POST /api/checkin/process
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbBooking, DbCheckin, ProcessCheckInRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const body: ProcessCheckInRequest = await req.json()

    if (!body.booking_id || !body.room_id) {
      throw new AppError(400, 'booking_id and room_id are required')
    }

    const result = await withConnection(async (conn) => {
      // Get the booking
      const bookingResult = await conn.execute(
        'SELECT * FROM BOOKINGS WHERE BOOKING_ID = :booking_id',
        { booking_id: body.booking_id }
      )
      const bookings = mapRows<DbBooking>(bookingResult.rows, 'BOOKINGS')
      if (bookings.length === 0) throw new AppError(404, 'Booking not found')

      const booking = bookings[0]
      if (booking.STATUS !== 'ACTIVE') {
        throw new AppError(400, 'Booking is not active')
      }

      // Check room is available
      const roomResult = await conn.execute(
        'SELECT STATUS FROM ROOMS WHERE ROOM_ID = :room_id',
        { room_id: body.room_id }
      )
      if (roomResult.rows.length === 0) throw new AppError(404, 'Room not found')
      const roomStatus = String(roomResult.rows[0][0])
      if (roomStatus !== 'AVAILABLE') {
        throw new AppError(400, `Room is not available (current status: ${roomStatus})`)
      }

      // Create checkin record
      const checkinResult = await conn.execute(
        `INSERT INTO CHECKINS (BOOKING_ID, ACTUAL_CHECK_IN, CHECKED_IN_BY, NOTES)
         VALUES (:booking_id, CURRENT_TIMESTAMP, :checked_in_by, :notes)
         RETURNING CHECKIN_ID INTO :new_id`,
        {
          booking_id: body.booking_id,
          checked_in_by: user.user_id,
          notes: body.notes || '',
          new_id: { dir: 3001, type: 2010 }, // OUT bind
        }
      )

      // Update room status to OCCUPIED
      await conn.execute(
        "UPDATE ROOMS SET STATUS = 'OCCUPIED', UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id",
        { room_id: body.room_id }
      )

      // Update reservation status to CHECKED_IN
      await conn.execute(
        "UPDATE RESERVATIONS SET STATUS = 'CHECKED_IN', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = (SELECT RESERVATION_ID FROM BOOKINGS WHERE BOOKING_ID = :booking_id)",
        { booking_id: body.booking_id }
      )

      const checkinId = checkinResult.rows?.[0]?.[0] || (checkinResult as any).lastRowid
      return { checkin_id: checkinId }
    })

    return successResponse(result, 'Check-in processed successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
