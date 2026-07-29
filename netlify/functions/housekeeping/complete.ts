import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'RECEPTIONIST', 'MANAGER'])
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const idIdx = segments.indexOf('tasks') + 1
    const bookingId = Number(segments[idIdx])
    if (!bookingId) throw new NotFoundError('Booking ID required')

    const body = await req.json()

    if (!body.assigned_staff) throw new BadRequestError('assigned_staff is required')

    await withConnection(async (conn) => {
      const existing = await conn.execute(
        'SELECT * FROM BOOKINGS WHERE BOOKING_ID = :booking_id',
        { booking_id: bookingId }
      )
      if (existing.rows.length === 0) throw new NotFoundError('Booking not found')

      const booking = existing.rows[0] as unknown[]
      const roomId = booking[2]

      await conn.execute(
        "UPDATE BOOKINGS SET STATUS = 'COMPLETED' WHERE BOOKING_ID = :booking_id",
        { booking_id: bookingId }
      )

      await conn.execute(
        "UPDATE ROOMS SET STATUS = 'AVAILABLE', UPDATED_AT = CURRENT_TIMESTAMP WHERE ROOM_ID = :room_id",
        { room_id: roomId }
      )
    })

    return successResponse(null, 'Housekeeping task completed, room marked as available')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
