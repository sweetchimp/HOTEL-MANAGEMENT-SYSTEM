import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { CreatePayrollRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const body: CreatePayrollRequest = await req.json()

    if (!body.staff_id || !body.month || !body.salary_paid) {
      throw new BadRequestError('staff_id, month, and salary_paid are required')
    }

    const record = await withConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO PAYROLL (STAFF_ID, MONTH, SALARY_PAID, PAYMENT_DATE)
         VALUES (:staff_id, :month, :salary_paid, :payment_date)
         RETURNING ID INTO :new_id`,
        {
          staff_id: body.staff_id,
          month: body.month,
          salary_paid: body.salary_paid,
          payment_date: body.payment_date || new Date().toISOString().split('T')[0],
          new_id: { dir: 3001, type: 2010 },
        }
      )

      const newId = result.rows[0]?.[0] || (result as any).lastRowid
      return { id: newId, staff_id: body.staff_id, month: body.month, salary_paid: body.salary_paid, payment_date: body.payment_date || new Date().toISOString().split('T')[0] }
    })

    return successResponse(record, 'Payroll record created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
