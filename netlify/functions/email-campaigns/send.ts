// ============================================================
// POST /api/email-campaigns/draft | /send | /schedule
// ADMIN/MANAGER — create a draft, send immediately, or
// schedule a campaign for later delivery.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { RECIPIENT_TYPES, resolveRecipients, sendCampaignEmails } from '../_shared/marketing'
import type { DbEmailCampaign, DbEmailTemplate, SendCampaignRequest } from '../_shared/types'

type Mode = 'draft' | 'schedule' | 'send'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const pathname = new URL(req.url).pathname
    const mode: Mode = pathname.endsWith('/schedule') ? 'schedule'
      : pathname.endsWith('/send') ? 'send'
      : 'draft'

    const body: SendCampaignRequest = await req.json()

    if (!body.title || body.title.trim().length < 3) {
      throw new BadRequestError('Campaign title is required (at least 3 characters)')
    }
    if (body.title.trim().length > 200) {
      throw new BadRequestError('Title must be 200 characters or fewer')
    }
    if (!body.recipient_type || !RECIPIENT_TYPES.includes(body.recipient_type)) {
      throw new BadRequestError(`recipient_type must be one of: ${RECIPIENT_TYPES.join(', ')}`)
    }
    if (body.subject && body.subject.length > 200) {
      throw new BadRequestError('Subject must be 200 characters or fewer')
    }
    if (mode === 'schedule') {
      if (!body.scheduled_at || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(body.scheduled_at)) {
        throw new BadRequestError('scheduled_at is required (YYYY-MM-DDTHH:mm)')
      }
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
      if (body.scheduled_at <= nowLocal) {
        throw new BadRequestError('scheduled_at must be in the future')
      }
    }
    if (mode === 'send' && !body.template_id && !body.body) {
      throw new BadRequestError('A template or custom body is required to send')
    }

    const result = await withConnection(async (conn) => {
      if (body.template_id) {
        const tplRes = await conn.execute('SELECT * FROM EMAIL_TEMPLATES WHERE ID = :id', { id: Number(body.template_id) })
        if (mapRows<DbEmailTemplate>(tplRes.rows, 'EMAIL_TEMPLATES').length === 0) {
          throw new NotFoundError('Template not found')
        }
      }

      const recipients = await resolveRecipients(conn, body.recipient_type)
      if (mode === 'send' && recipients.length === 0) {
        throw new BadRequestError('No recipients match the selected audience')
      }

      const status = mode === 'schedule' ? 'scheduled' : 'draft'
      const insert = await conn.execute(
        `INSERT INTO EMAIL_CAMPAIGNS (TITLE, TEMPLATE_ID, RECIPIENT_TYPE, RECIPIENT_COUNT,
                                      STATUS, SCHEDULED_AT, SUBJECT_OVERRIDE, BODY_OVERRIDE, CREATED_BY)
         VALUES (:title, :template_id, :recipient_type, :recipient_count, :status,
                 ${mode === 'schedule' ? `TO_TIMESTAMP(:scheduled_at, 'YYYY-MM-DD"T"HH24:MI')` : 'NULL'},
                 :subject_override, :body_override, :created_by)
         RETURNING ID INTO :new_id`,
        {
          title: body.title.trim(),
          template_id: body.template_id ? Number(body.template_id) : null,
          recipient_type: body.recipient_type,
          recipient_count: recipients.length,
          status,
          scheduled_at: body.scheduled_at || null,
          subject_override: body.subject || null,
          body_override: body.body || null,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const campaignId = Number(insert.rows[0]?.[0])

      if (mode === 'send') {
        const campaign: DbEmailCampaign = {
          ID: campaignId,
          TITLE: body.title.trim(),
          TEMPLATE_ID: body.template_id ? Number(body.template_id) : null,
          RECIPIENT_TYPE: body.recipient_type,
          RECIPIENT_COUNT: recipients.length,
          STATUS: 'draft',
          SCHEDULED_AT: null,
          SENT_AT: null,
          SUBJECT_OVERRIDE: body.subject || null,
          BODY_OVERRIDE: body.body || null,
          OPEN_COUNT: 0,
          CLICK_COUNT: 0,
          CREATED_BY: user.user_id,
          CREATED_AT: new Date().toISOString(),
        }
        const sent = await sendCampaignEmails(conn, campaign, recipients, (opts) => sendEmail(opts))
        await conn.execute(
          `UPDATE EMAIL_CAMPAIGNS
           SET STATUS = 'sent', SENT_AT = CURRENT_TIMESTAMP, RECIPIENT_COUNT = :recipient_count
           WHERE ID = :id`,
          { id: campaignId, recipient_count: sent }
        )
        return { campaign_id: campaignId, status: 'sent', recipient_count: sent }
      }

      if (mode === 'schedule') {
        return { campaign_id: campaignId, status: 'scheduled', recipient_count: recipients.length, scheduled_at: body.scheduled_at }
      }
      return { campaign_id: campaignId, status: 'draft', recipient_count: recipients.length }
    })

    const message = mode === 'send' ? 'Campaign sent'
      : mode === 'schedule' ? 'Campaign scheduled'
      : 'Draft saved'
    return successResponse(result, message, 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
