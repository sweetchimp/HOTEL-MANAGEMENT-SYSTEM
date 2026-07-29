// ============================================================
// POST /api/checkout/process
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbCheckin, ProcessCheckOutRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const body: ProcessCheckOutRequest = await req.json()

    if (!body.checkin_id) {
      throw new AppError(400, 'checkin_id is required')
    }

    const result = await withConnection(async (conn) => {
      // Get the checkin record
      const checkinResult = await conn.execute(
        'SELECT * FROM CHECKINS WHERE CHECKIN_ID = :checkin_id',
        { checkin_id: body.checkin_id }
      )
      const checkins = mapRows<DbCheckin>(checkinResult.rows, 'CHECKINS')
      if (checkins.length === 0) throw new AppError(404, 'Check-in record not found')

      const checkin = checkins[0]

      // Check if already checked out
      const existingCheckout = await conn.execute(
        'SELECT CHECKOUT_ID FROM CHECKOUTS WHERE CHECKIN_ID = :checkin_id',
        { checkin_id: body.checkin_id }
      )
      if (existingCheckout.rows.length > 0) {
        throw new AppError(400, 'Guest has already checked out')
      }

      // Create checkout record
      const checkoutResult = await conn.execute(
        `INSERT INTO CHECKOUTS (CHECKIN_ID, ACTUAL_CHECK_OUT, CHECKED_OUT_BY, NOTES)
         VALUES (:checkin_id, CURRENT_TIMESTAMP, :checked_out_by, :notes)
         RETURNING CHECKOUT_ID INTO :new_id`,
        {
          checkin_id: body.checkin_id,
          checked_out_by: user.user_id,
          notes: body.notes || '',
          new_id: { dir: 3001, type: 2010 },
        }
      )

      // Get the booking to update room and reservation
      const bookingResult = await conn.execute(
        'SELECT BOOKING_ID, ROOM_ID, RESERVATION_ID FROM BOOKINGS WHERE BOOKING_ID = :booking_id',
        { booking_id: checkin.BOOKING_ID }
      )
      if (bookingResult.rows.length > 0) {
        const bookingId = bookingResult.rows[0][0]
        const roomId = bookingResult.rows[0][1]
        const reservationId = bookingResult.rows[0][2]

        // Update room status to CLEANING
        await conn.execute(
          "UPDATE ROOMS SET STATUS = 'AVAILABLE', UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id",
          { room_id: roomId }
        )

        // Update booking status to COMPLETED
        await conn.execute(
          "UPDATE BOOKINGS SET STATUS = 'COMPLETED' WHERE BOOKING_ID = :booking_id",
          { booking_id: bookingId }
        )

        // Update reservation status to COMPLETED
        await conn.execute(
          "UPDATE RESERVATIONS SET STATUS = 'COMPLETED', UPDATED_AT = CURRENT_TIMESTAMP WHERE RESERVATION_ID = :reservation_id",
          { reservation_id: reservationId }
        )
      }

      const checkoutId = checkoutResult.rows?.[0]?.[0] || (checkoutResult as any).lastRowid
      return { checkout_id: checkoutId }
    })

    return successResponse(result, 'Check-out processed successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
