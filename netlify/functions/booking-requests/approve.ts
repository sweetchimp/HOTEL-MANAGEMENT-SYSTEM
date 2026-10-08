// ============================================================
// PUT /api/bookings/:id/approve
// Admin — approves a booking request, creates a CONFIRMED
// reservation, and emails the guest.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin, NotFoundError, BadRequestError } from '../_shared/middleware'
import { mapRows, mapRow } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { bookingApprovedEmail } from '../_shared/email-templates'
import type { DbBookingRequest, DbGuest, DbRoomType } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'PUT') return errorResponse('Method not allowed', 405)

  try {
    const authUser = requireAdmin(req)
    const url = new URL(req.url)
    const requestId = Number(url.pathname.split('/').filter(Boolean).slice(-2, -1)[0])
    if (!Number.isFinite(requestId) || requestId < 1) {
      throw new BadRequestError('Invalid booking request id')
    }

    const result = await withConnection(async (conn) => {
      const reqResult = await conn.execute('SELECT * FROM BOOKING_REQUESTS WHERE ID = :id', { id: requestId })
      const bookingRequest = reqResult.rows.length > 0
        ? mapRow<DbBookingRequest>(reqResult.rows[0], 'BOOKING_REQUESTS')
        : null
      if (!bookingRequest) throw new NotFoundError('Booking request not found')
      if (bookingRequest.STATUS !== 'pending') {
        throw new BadRequestError(`Request is already ${bookingRequest.STATUS}`)
      }

      const typesRes = await conn.execute('SELECT * FROM ROOM_TYPES')
      const types = mapRows<DbRoomType>(typesRes.rows, 'ROOM_TYPES')
      const roomType = types.find(t => t.TYPE_ID === bookingRequest.ROOM_TYPE_ID)

      // Find existing guest by ID number, otherwise create one
      const guestResult = await conn.execute('SELECT * FROM GUESTS WHERE ID_NUMBER = :id_number', {
        id_number: bookingRequest.ID_NUMBER,
      })
      let guestId: number
      if (guestResult.rows.length > 0) {
        guestId = mapRow<DbGuest>(guestResult.rows[0], 'GUESTS').GUEST_ID
      } else {
        const nameParts = bookingRequest.GUEST_NAME.trim().split(/\s+/)
        const firstName = nameParts[0]
        const lastName = nameParts.slice(1).join(' ') || firstName
        const guestInsert = await conn.execute(
          `INSERT INTO GUESTS (FIRST_NAME, LAST_NAME, EMAIL, PHONE, ID_TYPE, ID_NUMBER)
           VALUES (:first_name, :last_name, :email, :phone, :id_type, :id_number)
           RETURNING GUEST_ID INTO :new_id`,
          {
            first_name: firstName,
            last_name: lastName,
            email: bookingRequest.GUEST_EMAIL,
            phone: bookingRequest.GUEST_PHONE,
            id_type: bookingRequest.ID_TYPE,
            id_number: bookingRequest.ID_NUMBER,
            new_id: { dir: 3001, type: 2010 },
          }
        )
        guestId = Number(guestInsert.rows[0]?.[0])
      }

      const specialRequests = [
        bookingRequest.SPECIAL_REQUESTS?.trim(),
        `Party of ${bookingRequest.NUM_GUESTS}`,
      ].filter(Boolean).join(' — ')

      const resInsert = await conn.execute(
        `INSERT INTO RESERVATIONS
           (GUEST_ID, ROOM_TYPE_ID, CHECK_IN_DATE, CHECK_OUT_DATE, SPECIAL_REQUESTS, STATUS, CREATED_BY)
         VALUES
           (:guest_id, :room_type_id, :check_in_date, :check_out_date, :special_requests, 'CONFIRMED', :created_by)
         RETURNING RESERVATION_ID INTO :new_id`,
        {
          guest_id: guestId,
          room_type_id: bookingRequest.ROOM_TYPE_ID,
          check_in_date: bookingRequest.CHECK_IN_DATE,
          check_out_date: bookingRequest.CHECK_OUT_DATE,
          special_requests: specialRequests,
          created_by: authUser.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const reservationId = Number(resInsert.rows[0]?.[0])

      await conn.execute(
        `UPDATE BOOKING_REQUESTS
         SET STATUS = 'approved', APPROVED_BY = :approved_by, APPROVED_AT = :approved_at
         WHERE ID = :id`,
        {
          id: requestId,
          approved_by: authUser.user_id,
          approved_at: new Date(),
        }
      )

      const email = bookingApprovedEmail({
        guest_name: bookingRequest.GUEST_NAME,
        booking_id: bookingRequest.ID,
        room_type_name: roomType?.TYPE_NAME || 'Room',
        check_in_date: String(bookingRequest.CHECK_IN_DATE),
        check_out_date: String(bookingRequest.CHECK_OUT_DATE),
        num_guests: bookingRequest.NUM_GUESTS,
        total: bookingRequest.TOTAL_PRICE,
      })
      await sendEmail({ to: bookingRequest.GUEST_EMAIL, subject: email.subject, html: email.html })

      return { id: bookingRequest.ID, status: 'approved', reservation_id: reservationId }
    })

    return successResponse(result, 'Booking request approved')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
