// ============================================================
// POST /api/public/subscribe
// Public — newsletter subscription from the landing page.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type { DbSubscriber } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const body = await req.json()
    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      throw new BadRequestError('A valid email address is required')
    }
    if (email.length > 120) {
      throw new BadRequestError('Email must be 120 characters or fewer')
    }

    const result = await withConnection(async (conn) => {
      const existing = mapRows<DbSubscriber>(
        (await conn.execute('SELECT * FROM SUBSCRIBERS WHERE EMAIL = :email', { email })).rows,
        'SUBSCRIBERS'
      )[0]

      if (existing && existing.STATUS === 'active') {
        throw new BadRequestError('This email is already subscribed')
      }
      if (existing) {
        await conn.execute(`UPDATE SUBSCRIBERS SET STATUS = 'active' WHERE EMAIL = :email`, { email })
        return { status: 'resubscribed' }
      }

      await conn.execute(
        `INSERT INTO SUBSCRIBERS (EMAIL, STATUS) VALUES (:email, 'active') RETURNING ID INTO :new_id`,
        { email, new_id: { dir: 3001, type: 2010 } }
      )
      return { status: 'subscribed' }
    })

    return successResponse(result, 'Thanks for subscribing!', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
