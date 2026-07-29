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
        "SELECT ID, FULL_NAME, EMAIL, PHONE, DEPARTMENT, POSITION, SALARY, HIRE_DATE, IS_ACTIVE FROM STAFF WHERE IS_ACTIVE = 1 ORDER BY FULL_NAME"
      )

      return result.rows.map((row: unknown[]) => ({
        id: row[0],
        full_name: row[1],
        email: row[2],
        phone: row[3],
        department: row[4],
        position: row[5],
        salary: row[6],
        hire_date: row[7],
        is_active: row[8],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
