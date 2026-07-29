import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbBooking } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const body = await req.json() as { booking_id: number }

    if (!body.booking_id) {
      throw new AppError(400, 'booking_id is required')
    }

    const result = await withConnection(async (conn) => {
      const bookingResult = await conn.execute(
        'SELECT * FROM BOOKINGS WHERE BOOKING_ID = :booking_id',
        { booking_id: body.booking_id }
      )
      if (bookingResult.rows.length === 0) throw new AppError(404, 'Booking not found')

      const bookings = mapRows<DbBooking>(bookingResult.rows, 'BOOKINGS')
      const booking = bookings[0]

      const existingResult = await conn.execute(
        "SELECT INVOICE_ID FROM INVOICES WHERE BOOKING_ID = :booking_id AND STATUS != 'CANCELLED'",
        { booking_id: body.booking_id }
      )
      if (existingResult.rows.length > 0) {
        throw new AppError(400, 'Invoice already exists for this booking')
      }

      const insertResult = await conn.execute(
        `INSERT INTO INVOICES (BOOKING_ID, GUEST_ID)
         VALUES (:booking_id, :guest_id)
         RETURNING INVOICE_ID INTO :new_id`,
        {
          booking_id: body.booking_id,
          guest_id: booking.GUEST_ID,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const invoiceId = insertResult.rows?.[0]?.[0] || (insertResult as any).lastRowid

      const roomResult = await conn.execute(
        `SELECT r.ROOM_NUMBER, rt.TYPE_NAME, b.CHECK_IN_DATE, b.CHECK_OUT_DATE, b.RATE_PER_NIGHT
         FROM BOOKINGS b
         JOIN ROOMS r ON b.ROOM_ID = r.ROOM_ID
         JOIN ROOM_TYPES rt ON r.TYPE_ID = rt.TYPE_ID
         WHERE b.BOOKING_ID = :booking_id`,
        { booking_id: body.booking_id }
      )

      if (roomResult.rows.length > 0) {
        const roomRow = roomResult.rows[0]
        const roomNumber = roomRow[0]
        const typeName = roomRow[1]
        const checkIn = String(roomRow[2] || '').slice(0, 10)
        const checkOut = String(roomRow[3] || '').slice(0, 10)
        const ratePerNight = Number(roomRow[4] || 0)
        const checkInDate = new Date(checkIn)
        const checkOutDate = new Date(checkOut)
        const nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / 86400000))
        const roomTotal = ratePerNight * nights

        await conn.execute(
          `INSERT INTO INVOICE_ITEMS (INVOICE_ID, DESCRIPTION, QUANTITY, UNIT_PRICE)
           VALUES (:invoice_id, :description, 1, :unit_price)`,
          {
            invoice_id: invoiceId,
            description: `Room ${roomNumber} - ${typeName} (${nights} nights)`,
            unit_price: roomTotal,
          }
        )
      }

      return { invoice_id: invoiceId }
    })

    return successResponse(result, 'Invoice created successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
