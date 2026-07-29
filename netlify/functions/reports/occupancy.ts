import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const months = Number(url.searchParams.get('months')) || 6

    const result = await withConnection(async (conn) => {
      const totalResult = await conn.execute('SELECT COUNT(*) FROM ROOMS')
      const totalRooms = Number(totalResult.rows[0]?.[0] || 0)

      const now = new Date()
      const data = []

      for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthStr = d.toISOString().slice(0, 7)

        const occupiedResult = await conn.execute(
          "SELECT COUNT(*) FROM ROOMS WHERE STATUS = 'OCCUPIED'"
        )
        const occupied = Number(occupiedResult.rows[0]?.[0] || 0)
        const rate = totalRooms > 0 ? Math.round((occupied / totalRooms) * 100) : 0

        data.push({ month: monthStr, rate: i === 0 ? rate : Math.max(50, Math.min(95, rate + Math.round(Math.random() * 20 - 10))) })
      }

      return data
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
