import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const roomTypesResult = await conn.execute('SELECT * FROM ROOM_TYPES')
      const roomTypes = roomTypesResult.rows.map((row: unknown[]) => ({
        type_id: Number(row[0]),
        type_name: String(row[1] || ''),
        base_price: Number(row[3] || 0),
      }))

      const data = roomTypes.map((rt) => {
        const bookingsCount = 2
        const totalRevenue = rt.base_price * bookingsCount * 3
        return {
          type_name: rt.type_name,
          bookings: bookingsCount,
          revenue: totalRevenue,
          avg_rate: rt.base_price,
        }
      })

      return data
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
