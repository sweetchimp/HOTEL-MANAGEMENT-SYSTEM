import { withConnection } from '../_shared/db'
import { successResponse, paginatedResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const guest_id = url.searchParams.get('guest_id') ? Number(url.searchParams.get('guest_id')) : undefined
    const date_from = url.searchParams.get('date_from')
    const date_to = url.searchParams.get('date_to')
    const page = Number(url.searchParams.get('page')) || 1
    const pageSize = Number(url.searchParams.get('pageSize')) || 20

    const result = await withConnection(async (conn) => {
      let where = 'WHERE 1=1'
      const binds: Record<string, unknown> = {}

      if (status) { where += ' AND i.STATUS = :status'; binds.status = status }
      if (guest_id) { where += ' AND i.GUEST_ID = :guest_id'; binds.guest_id = guest_id }
      if (date_from) { where += ' AND i.CREATED_AT >= :date_from'; binds.date_from = date_from }
      if (date_to) { where += ' AND i.CREATED_AT <= :date_to'; binds.date_to = date_to }

      const countResult = await conn.execute(
        `SELECT COUNT(*) FROM INVOICES i ${where}`, binds
      )
      const total = Number(countResult.rows[0]?.[0] || 0)

      const offset = (page - 1) * pageSize
      const rowsResult = await conn.execute(
        `SELECT i.INVOICE_ID, i.BOOKING_ID, i.GUEST_ID, i.TOTAL_AMOUNT, i.STATUS, i.CREATED_AT
         FROM INVOICES i ${where}
         ORDER BY i.CREATED_AT DESC
         OFFSET ${offset} ROWS FETCH NEXT ${pageSize} ROWS ONLY`,
        binds
      )

      const invoices = rowsResult.rows.map((row: unknown[]) => ({
        invoice_id: Number(row[0]),
        booking_id: Number(row[1]),
        guest_id: Number(row[2]),
        total_amount: Number(row[3]),
        status: String(row[4] || ''),
        created_at: String(row[5] || ''),
      }))

      return { invoices, total }
    })

    return paginatedResponse(result.invoices, result.total, page, pageSize)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
