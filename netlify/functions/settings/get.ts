import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)

    const result = await withConnection(async (conn) => {
      const result = await conn.execute(
        'SELECT SETTING_KEY, SETTING_VALUE, DESCRIPTION, UPDATED_AT, UPDATED_BY FROM SYSTEM_SETTINGS ORDER BY SETTING_KEY'
      )

      return result.rows.map((row: unknown[]) => ({
        setting_key: row[0],
        setting_value: row[1],
        description: row[2],
        updated_at: row[3],
        updated_by: row[4],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
