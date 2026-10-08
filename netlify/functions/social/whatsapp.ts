// ============================================================
// POST /api/social/whatsapp/send
// ADMIN/MANAGER — send AI content as a WhatsApp message (real
// API when configured; otherwise returns the copy-ready message
// and records a 'manual' distribution).
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { publishWhatsapp } from '../ai-content/_shared/distribute'
import { parseStoredContent } from '../ai-content/_shared/claude'
import type { DbAiGeneratedContent } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const body = (await req.json()) as { content_id?: number }
    const contentId = Number(body.content_id)
    if (!Number.isFinite(contentId) || contentId <= 0) throw new BadRequestError('content_id is required')

    const result = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id: contentId })
      const content = mapRows<DbAiGeneratedContent>(res.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new NotFoundError('AI content not found')

      const outcome = await publishWhatsapp(content)
      const status = outcome.status

      const distroInsert = await conn.execute(
        `INSERT INTO AI_CONTENT_DISTRIBUTIONS (CONTENT_ID, CHANNEL, RECIPIENT_COUNT, STATUS, CREATED_BY)
         VALUES (:content_id, 'whatsapp', 1, :status, :created_by)
         RETURNING ID INTO :new_id`,
        {
          content_id: content.ID,
          status,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const distributionId = Number(distroInsert.rows[0]?.[0])

      if (status === 'sent') {
        await conn.execute(`UPDATE AI_GENERATED_CONTENT SET STATUS = 'published', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`, { id: content.ID })
      }

      const whatsapp = parseStoredContent<{ message: string }>(content.GENERATED_CONTENT)
      const message = whatsapp ? whatsapp.message : content.ADMIN_PROMPT

      return {
        distribution_id: distributionId,
        status,
        message,
        note: outcome.note,
      }
    })

    return successResponse(result, result.status === 'sent' ? 'Sent via WhatsApp' : 'Ready to copy and send', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}