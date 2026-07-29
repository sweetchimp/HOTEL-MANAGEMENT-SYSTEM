import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const invoiceId = Number(parts[parts.length - 2])

    if (!invoiceId) throw new AppError(400, 'Invoice ID is required')

    const result = await withConnection(async (conn) => {
      const invResult = await conn.execute(
        'SELECT TOTAL_AMOUNT FROM INVOICES WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      if (invResult.rows.length === 0) throw new AppError(404, 'Invoice not found')

      const totalAmount = Number(invResult.rows[0][0] || 0)

      const paymentsResult = await conn.execute(
        'SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENTS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const totalPaid = Number(paymentsResult.rows[0]?.[0] || 0)

      return {
        invoice_id: invoiceId,
        total_amount: totalAmount,
        total_paid: totalPaid,
        balance: Math.max(0, totalAmount - totalPaid),
      }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
