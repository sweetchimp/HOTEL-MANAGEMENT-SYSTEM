import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { CreateMaintenanceRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'RECEPTIONIST', 'MANAGER'])
    const body: CreateMaintenanceRequest = await req.json()

    if (!body.room_id || !body.issue_type || !body.description) {
      throw new BadRequestError('room_id, issue_type, and description are required')
    }

    const record = await withConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO MAINTENANCE (ROOM_ID, ISSUE_TYPE, DESCRIPTION, STATUS, CREATED_DATE, ASSIGNED_TO, NOTES)
         VALUES (:room_id, :issue_type, :description, 'OPEN', CURRENT_TIMESTAMP, '', '')
         RETURNING ID INTO :new_id`,
        {
          room_id: body.room_id,
          issue_type: body.issue_type,
          description: body.description,
          new_id: { dir: 3001, type: 2010 },
        }
      )

      const newId = result.rows[0]?.[0] || (result as any).lastRowid

      const fetchResult = await conn.execute(
        `SELECT m.ID, m.ROOM_ID, m.ISSUE_TYPE, m.DESCRIPTION, m.STATUS, m.CREATED_DATE, m.ASSIGNED_TO, m.RESOLVED_DATE, m.NOTES,
                r.ROOM_NUMBER
         FROM MAINTENANCE m
         JOIN ROOMS r ON m.ROOM_ID = r.ROOM_ID
         WHERE m.ID = :id`,
        { id: newId }
      )

      const row = fetchResult.rows[0]
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
      }
    })

    return successResponse(record, 'Maintenance issue reported', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
