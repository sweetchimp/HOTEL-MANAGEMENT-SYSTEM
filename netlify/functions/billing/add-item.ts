import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'RECEPTIONIST'])
    const url = new URL(req.url)
    const parts = url.pathname.split('/')
    const invoiceId = Number(parts[parts.length - 2])

    if (!invoiceId) throw new AppError(400, 'Invoice ID is required')

    const body = await req.json() as { description?: string; quantity?: number; unit_price?: number }

    if (!body.description) throw new AppError(400, 'description is required')
    if (!body.quantity || body.quantity < 1) throw new AppError(400, 'quantity must be at least 1')
    if (body.unit_price === undefined || body.unit_price < 0) throw new AppError(400, 'unit_price must be a positive number')

    const result = await withConnection(async (conn) => {
      const invResult = await conn.execute(
        'SELECT STATUS FROM INVOICES WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      if (invResult.rows.length === 0) throw new AppError(404, 'Invoice not found')

      const status = String(invResult.rows[0][0] || '')
      if (status === 'PAID') throw new AppError(400, 'Cannot add items to a paid invoice')
      if (status === 'CANCELLED') throw new AppError(400, 'Cannot add items to a cancelled invoice')

      const insertResult = await conn.execute(
        `INSERT INTO INVOICE_ITEMS (INVOICE_ID, DESCRIPTION, QUANTITY, UNIT_PRICE)
         VALUES (:invoice_id, :description, :quantity, :unit_price)
         RETURNING ITEM_ID INTO :new_id`,
        {
          invoice_id: invoiceId,
          description: body.description,
          quantity: body.quantity,
          unit_price: body.unit_price,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const itemId = insertResult.rows?.[0]?.[0] || (insertResult as any).lastRowid

      const totalResult = await conn.execute(
        'SELECT NVL(SUM(TOTAL), 0) FROM INVOICE_ITEMS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const newTotal = Number(totalResult.rows[0]?.[0] || 0)

      await conn.execute(
        'UPDATE INVOICES SET TOTAL_AMOUNT = :total_amount WHERE INVOICE_ID = :invoice_id',
        { total_amount: newTotal, invoice_id: invoiceId }
      )

      const paidResult = await conn.execute(
        'SELECT NVL(SUM(AMOUNT), 0) FROM PAYMENTS WHERE INVOICE_ID = :invoice_id',
        { invoice_id: invoiceId }
      )
      const totalPaid = Number(paidResult.rows[0]?.[0] || 0)

      if (totalPaid >= newTotal - 0.01) {
        await conn.execute(
          "UPDATE INVOICES SET STATUS = 'PAID' WHERE INVOICE_ID = :invoice_id",
          { invoice_id: invoiceId }
        )
      } else if (totalPaid > 0) {
        await conn.execute(
          "UPDATE INVOICES SET STATUS = 'PARTIALLY_PAID' WHERE INVOICE_ID = :invoice_id",
          { invoice_id: invoiceId }
        )
      }

      return { item_id: itemId }
    })

    return successResponse(result, 'Item added successfully', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
