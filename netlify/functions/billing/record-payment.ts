import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const invoiceId = Number(parts[parts.length - 2])

    if (!invoiceId) throw new AppError(400, 'Invoice ID is required')

    const body = await req.json() as {
      amount?: number
      payment_method?: string
      reference_number?: string
    }

    if (!body.amount || body.amount <= 0) throw new AppError(400, 'amount must be a positive number')
    if (!body.payment_method || !['CASH', 'CARD', 'BANK_TRANSFER'].includes(body.payment_method)) {
      throw new AppError(400, 'payment_method must be CASH, CARD, or BANK_TRANSFER')
    }

    const result = await withConnection(async (conn) => {
      const invResult = await conn.execute(
        'SELECT STATUS FROM INVOICES WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      if (invResult.rows.length === 0) throw new AppError(404, 'Invoice not found')

      const status = String(invResult.rows[0][0] || '')
      if (status === 'PAID') throw new AppError(400, 'Invoice is already paid')
      if (status === 'CANCELLED') throw new AppError(400, 'Invoice is cancelled')

      const itemsResult = await conn.execute(
        'SELECT NVL(SUM(TOTAL), 0) FROM INVOICE_ITEMS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const totalAmount = Number(itemsResult.rows[0]?.[0] || 0)

      const paymentsResult = await conn.execute(
        'SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENTS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const totalPaid = Number(paymentsResult.rows[0]?.[0] || 0)
      const balance = totalAmount - totalPaid

      if (body.amount > balance + 0.01) {
        throw new AppError(400, `Payment amount (${body.amount}) exceeds balance (${balance})`)
      }

      const insertResult = await conn.execute(
        `INSERT INTO PAYMENTS (INVOICE_ID, AMOUNT, PAYMENT_METHOD, REFERENCE_NUMBER, RECEIVED_BY)
         VALUES (:invoice_id, :amount, :payment_method, :reference_number, :received_by)
         RETURNING PAYMENT_ID INTO :new_id`,
        {
          invoice_id: invoiceId,
          amount: body.amount,
          payment_method: body.payment_method,
          reference_number: body.reference_number || '',
          received_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const paymentId = insertResult.rows?.[0]?.[0] || (insertResult as any).lastRowid

      const newPaid = totalPaid + body.amount
      if (Math.abs(newPaid - totalAmount) < 0.01) {
        await conn.execute(
          "UPDATE INVOICES SET STATUS = 'PAID' WHERE INVOICE_ID = :invoice_id",
          { invoice_id: invoiceId }
        )
      } else {
        await conn.execute(
          "UPDATE INVOICES SET STATUS = 'PARTIALLY_PAID' WHERE INVOICE_ID = :invoice_id",
          { invoice_id: invoiceId }
        )
      }

      return { payment_id: paymentId }
    })

    return successResponse(result, 'Payment recorded successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
