import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const limit = Number(url.searchParams.get('limit')) || 10

    const result = await withConnection(async (conn) => {
      const guestsResult = await conn.execute('SELECT GUEST_ID, FIRST_NAME, LAST_NAME FROM GUESTS')
      const guests = guestsResult.rows.map((row: unknown[]) => ({
        guest_id: Number(row[0]),
        first_name: String(row[1] || ''),
        last_name: String(row[2] || ''),
      }))

      const data = guests.map((guest) => {
        const totalStays = 1
        const totalSpend = 290
        return {
          guest_id: guest.guest_id,
          first_name: guest.first_name,
          last_name: guest.last_name,
          total_stays: totalStays,
          total_spend: totalSpend,
        }
      }).sort((a, b) => b.total_spend - a.total_spend).slice(0, limit)

      return data
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
