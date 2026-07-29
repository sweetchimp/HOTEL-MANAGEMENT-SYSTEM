import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const statusFilter = url.searchParams.get('status')

    const result = await withConnection(async (conn) => {
      let where = "WHERE m.STATUS != 'RESOLVED'"
      const binds: Record<string, unknown> = {}

      if (statusFilter) {
        where = 'WHERE m.STATUS = :status'
        binds.status = statusFilter
      }

      const rowsResult = await conn.execute(
        `SELECT m.ID, m.ROOM_ID, m.ISSUE_TYPE, m.DESCRIPTION, m.STATUS, m.CREATED_DATE, m.ASSIGNED_TO, m.RESOLVED_DATE, m.NOTES,
                r.ROOM_NUMBER
         FROM MAINTENANCE m
         JOIN ROOMS r ON m.ROOM_ID = r.ROOM_ID
         ${where}
         ORDER BY m.CREATED_DATE DESC`,
        binds
      )

      return rowsResult.rows.map((row: unknown[]) => ({
        id: row[0],
        room_id: row[1],
        issue_type: row[2],
        description: row[3],
        status: row[4],
        created_date: row[5],
        assigned_to: row[6],
        resolved_date: row[7],
        notes: row[8],
        room_number: row[9],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
