import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireAuth } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbInvoice, DbInvoiceItem, DbPayment } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireAuth(req)
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const invoiceId = Number(parts[parts.length - 1])

    if (!invoiceId) throw new AppError(400, 'Invoice ID is required')

    const result = await withConnection(async (conn) => {
      const invResult = await conn.execute(
        'SELECT * FROM INVOICES WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      if (invResult.rows.length === 0) throw new AppError(404, 'Invoice not found')
      const invoices = mapRows<DbInvoice>(invResult.rows, 'INVOICES')
      const invoice = invoices[0]

      const itemsResult = await conn.execute(
        'SELECT * FROM INVOICE_ITEMS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const items = mapRows<DbInvoiceItem>(itemsResult.rows, 'INVOICE_ITEMS')

      const paymentsResult = await conn.execute(
        'SELECT * FROM PAYMENTS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const payments = mapRows<DbPayment>(paymentsResult.rows, 'PAYMENTS')

      return { invoice, items, payments }
    })

    return successResponse(result)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
