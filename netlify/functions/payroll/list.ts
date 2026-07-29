import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const segments = url.pathname.split('/')
    const idIdx = segments.indexOf('payroll') + 1
    const staffId = Number(segments[idIdx])
    if (!staffId) throw new NotFoundError('Staff ID required')

    const result = await withConnection(async (conn) => {
      const result = await conn.execute(
        'SELECT ID, STAFF_ID, MONTH, SALARY_PAID, PAYMENT_DATE FROM PAYROLL WHERE STAFF_ID = :staff_id ORDER BY MONTH DESC',
        { staff_id: staffId }
      )

      return result.rows.map((row: unknown[]) => ({
        id: row[0],
        staff_id: row[1],
        month: row[2],
        salary_paid: row[3],
        payment_date: row[4],
      }))
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
