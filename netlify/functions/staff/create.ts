import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, requireRole } from '../_shared/middleware'
import type { CreateStaffRequest } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const body: CreateStaffRequest = await req.json()

    if (!body.full_name || !body.email || !body.department || !body.position) {
      throw new BadRequestError('full_name, email, department, and position are required')
    }

    const record = await withConnection(async (conn) => {
      const result = await conn.execute(
        `INSERT INTO STAFF (FULL_NAME, EMAIL, PHONE, DEPARTMENT, POSITION, SALARY, HIRE_DATE)
         VALUES (:full_name, :email, :phone, :department, :position, :salary, :hire_date)
         RETURNING ID INTO :new_id`,
        {
          full_name: body.full_name,
          email: body.email,
          phone: body.phone || '',
          department: body.department,
          position: body.position,
          salary: body.salary || 0,
          hire_date: body.hire_date || new Date().toISOString().split('T')[0],
          new_id: { dir: 3001, type: 2010 },
        }
      )

      const newId = result.rows[0]?.[0] || (result as any).lastRowid

      return { id: newId, full_name: body.full_name, email: body.email, phone: body.phone || '', department: body.department, position: body.position, salary: body.salary || 0, hire_date: body.hire_date || new Date().toISOString().split('T')[0], is_active: 1 }
    })

    return successResponse(record, 'Staff member created', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
