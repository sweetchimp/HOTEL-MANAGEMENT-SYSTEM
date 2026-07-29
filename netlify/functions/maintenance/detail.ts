import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const id = Number(url.pathname.split('/').pop())
    if (!id) throw new NotFoundError('Maintenance ID required')

    const record = await withConnection(async (conn) => {
      const result = await conn.execute(
        `SELECT m.ID, m.ROOM_ID, m.ISSUE_TYPE, m.DESCRIPTION, m.STATUS, m.CREATED_DATE, m.ASSIGNED_TO, m.RESOLVED_DATE, m.NOTES,
                r.ROOM_NUMBER, r.FLOOR, r.STATUS as ROOM_STATUS
         FROM MAINTENANCE m
         JOIN ROOMS r ON m.ROOM_ID = r.ROOM_ID
         WHERE m.ID = :id`,
        { id }
      )

      if (result.rows.length === 0) return null

      const row = result.rows[0]
      return {
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
        floor: row[10],
        room_status: row[11],
      }
    })

    if (!record) throw new NotFoundError('Maintenance record not found')
    return successResponse(record)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
