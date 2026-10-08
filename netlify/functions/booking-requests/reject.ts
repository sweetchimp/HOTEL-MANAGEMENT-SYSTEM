// ============================================================
// PUT /api/bookings/:id/reject
// Admin — rejects a booking request with a reason and emails
// the guest.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAdmin, NotFoundError, BadRequestError } from '../_shared/middleware'
import { mapRows, mapRow } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { bookingRejectedEmail } from '../_shared/email-templates'
import type { DbBookingRequest, DbRoomType, RejectBookingRequest } from '../_shared/types'

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

    const body: RejectBookingRequest = await req.json()
    if (!body.reason || !body.reason.trim()) {
      throw new BadRequestError('A rejection reason is required')
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

      await conn.execute(
        `UPDATE BOOKING_REQUESTS
         SET STATUS = 'rejected', REJECTION_REASON = :reason,
             APPROVED_BY = :decided_by, APPROVED_AT = :decided_at
         WHERE ID = :id`,
        {
          id: requestId,
          reason: body.reason.trim(),
          decided_by: authUser.user_id,
          decided_at: new Date(),
        }
      )

      const email = bookingRejectedEmail({
        guest_name: bookingRequest.GUEST_NAME,
        booking_id: bookingRequest.ID,
        room_type_name: roomType?.TYPE_NAME || 'Room',
        check_in_date: String(bookingRequest.CHECK_IN_DATE),
        check_out_date: String(bookingRequest.CHECK_OUT_DATE),
        reason: body.reason.trim(),
      })
      await sendEmail({ to: bookingRequest.GUEST_EMAIL, subject: email.subject, html: email.html })

      return { id: bookingRequest.ID, status: 'rejected' }
    })

    return successResponse(result, 'Booking request rejected')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
