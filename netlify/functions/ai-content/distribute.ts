// ============================================================
// POST /api/ai/distribute/:id
// ADMIN/MANAGER — distribute approved AI content through a
// channel (email, newsletter, instagram, whatsapp), immediately
// or on a schedule.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, BadRequestError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { resolveRecipients, sendCampaignEmails } from '../_shared/marketing'
import { parseStoredContent } from './_shared/claude'
import {
  AI_CHANNELS,
  EMAIL_RECIPIENT_TYPES,
  buildEmailHtml,
  publishInstagram,
  publishWhatsapp,
} from './_shared/distribute'
import type {
  AiGeneratedEmail,
  DbAiDistribution,
  DbAiGeneratedContent,
  DbEmailCampaign,
  DistributeContentRequest,
} from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    const user = requireRole(req, ['ADMIN', 'MANAGER'])
    const id = Number(new URL(req.url).pathname.split('/').pop())
    if (!Number.isFinite(id) || id <= 0) throw new BadRequestError('Invalid content id')

    const body = (await req.json()) as DistributeContentRequest
    if (!body.channel || !AI_CHANNELS.includes(body.channel)) {
      throw new BadRequestError(`channel must be one of: ${AI_CHANNELS.join(', ')}`)
    }

    const isEmailChannel = body.channel === 'email' || body.channel === 'newsletter'
    const recipientType = body.channel === 'newsletter'
      ? 'newsletter_subscribers'
      : body.recipient_type || 'all_guests'
    if (isEmailChannel && !EMAIL_RECIPIENT_TYPES.includes(recipientType)) {
      throw new BadRequestError(`recipient_type must be one of: ${EMAIL_RECIPIENT_TYPES.join(', ')}`)
    }

    const isScheduled = typeof body.scheduled_at === 'string' && body.scheduled_at.length > 0
    if (isScheduled && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(body.scheduled_at || '')) {
      throw new BadRequestError('scheduled_at must be in YYYY-MM-DDTHH:mm format')
    }
    if (isScheduled) {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const nowLocal = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
      if ((body.scheduled_at || '') <= nowLocal) {
        throw new BadRequestError('scheduled_at must be in the future')
      }
    }

    const result = await withConnection(async (conn) => {
      const contentRes = await conn.execute('SELECT * FROM AI_GENERATED_CONTENT WHERE ID = :id', { id })
      const content = mapRows<DbAiGeneratedContent>(contentRes.rows, 'AI_GENERATED_CONTENT')[0]
      if (!content) throw new NotFoundError('AI content not found')
      if (content.STATUS !== 'approved' && content.STATUS !== 'published') {
        throw new BadRequestError('Approve the content before distributing it')
      }

      // ---- Email / Newsletter ------------------------------------
      if (isEmailChannel) {
        const email = parseStoredContent<AiGeneratedEmail>(content.GENERATED_CONTENT)
        if (!email || !email.subject || !email.body_html) {
          throw new BadRequestError('Generated content has no email payload — regenerate it')
        }

        const recipients = await resolveRecipients(conn, recipientType)
        if (!isScheduled && recipients.length === 0) {
          throw new BadRequestError('No recipients match the selected audience')
        }
        const bodyHtml = buildEmailHtml(email)
        const campaignStatus = isScheduled ? 'scheduled' : 'draft'

        const campaignInsert = await conn.execute(
          `INSERT INTO EMAIL_CAMPAIGNS (TITLE, TEMPLATE_ID, RECIPIENT_TYPE, RECIPIENT_COUNT,
                                        STATUS, SCHEDULED_AT, SUBJECT_OVERRIDE, BODY_OVERRIDE, CREATED_BY)
           VALUES (:title, NULL, :recipient_type, :recipient_count, :status,
                   ${isScheduled ? `TO_TIMESTAMP(:scheduled_at, 'YYYY-MM-DD"T"HH24:MI')` : 'NULL'},
                   :subject_override, :body_override, :created_by)
           RETURNING ID INTO :new_id`,
          {
            title: content.TITLE,
            recipient_type: recipientType,
            recipient_count: recipients.length,
            status: campaignStatus,
            scheduled_at: isScheduled ? body.scheduled_at : null,
            subject_override: email.subject,
            body_override: bodyHtml,
            created_by: user.user_id,
            new_id: { dir: 3001, type: 2010 },
          }
        )
        const campaignId = Number(campaignInsert.rows[0]?.[0])

        const distroInsert = await conn.execute(
          `INSERT INTO AI_CONTENT_DISTRIBUTIONS (CONTENT_ID, CHANNEL, RECIPIENT_TYPE, RECIPIENT_COUNT,
                                                 STATUS, SCHEDULED_AT, CAMPAIGN_ID, CREATED_BY)
           VALUES (:content_id, :channel, :recipient_type, :recipient_count, :status,
                   ${isScheduled ? `TO_TIMESTAMP(:scheduled_at, 'YYYY-MM-DD"T"HH24:MI')` : 'NULL'},
                   :campaign_id, :created_by)
           RETURNING ID INTO :new_id`,
          {
            content_id: content.ID,
            channel: body.channel,
            recipient_type: recipientType,
            recipient_count: recipients.length,
            status: isScheduled ? 'scheduled' : 'pending',
            scheduled_at: isScheduled ? body.scheduled_at : null,
            campaign_id: campaignId,
            created_by: user.user_id,
            new_id: { dir: 3001, type: 2010 },
          }
        )
        const distributionId = Number(distroInsert.rows[0]?.[0])

        if (isScheduled) {
          await conn.execute(`UPDATE AI_GENERATED_CONTENT SET STATUS = 'scheduled', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`, { id: content.ID })
          const distro = mapRows<DbAiDistribution>(
            (await conn.execute('SELECT * FROM AI_CONTENT_DISTRIBUTIONS WHERE ID = :id', { id: distributionId })).rows,
            'AI_CONTENT_DISTRIBUTIONS'
          )[0]
          return {
            distribution_id: distributionId,
            channel: body.channel,
            status: distro.STATUS,
            recipient_count: recipients.length,
            campaign_id: campaignId,
            scheduled_at: body.scheduled_at,
            sent_at: null,
            preview: email.subject,
          }
        }

        // Immediate send
        const campaign: DbEmailCampaign = {
          ID: campaignId,
          TITLE: content.TITLE,
          TEMPLATE_ID: null,
          RECIPIENT_TYPE: recipientType,
          RECIPIENT_COUNT: recipients.length,
          STATUS: 'draft',
          SCHEDULED_AT: null,
          SENT_AT: null,
          SUBJECT_OVERRIDE: email.subject,
          BODY_OVERRIDE: bodyHtml,
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
        await conn.execute(
          `UPDATE AI_CONTENT_DISTRIBUTIONS SET STATUS = :status, RECIPIENT_COUNT = :recipient_count, SENT_AT = CURRENT_TIMESTAMP WHERE ID = :id`,
          { id: distributionId, status: 'sent', recipient_count: sent }
        )
        await conn.execute(`UPDATE AI_GENERATED_CONTENT SET STATUS = 'published', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`, { id: content.ID })

        return {
          distribution_id: distributionId,
          channel: body.channel,
          status: 'sent',
          recipient_count: sent,
          campaign_id: campaignId,
          scheduled_at: null,
          sent_at: new Date().toISOString(),
          preview: email.subject,
        }
      }

      // ---- Instagram / WhatsApp --------------------------------
      const outcome = body.channel === 'instagram' ? await publishInstagram(content) : await publishWhatsapp(content)
      const distroStatus = isScheduled ? 'scheduled' : outcome.status

      const distroInsert = await conn.execute(
        `INSERT INTO AI_CONTENT_DISTRIBUTIONS (CONTENT_ID, CHANNEL, RECIPIENT_COUNT, STATUS, SCHEDULED_AT, CREATED_BY)
         VALUES (:content_id, :channel, :recipient_count, :status,
                 ${isScheduled ? `TO_TIMESTAMP(:scheduled_at, 'YYYY-MM-DD"T"HH24:MI')` : 'NULL'},
                 :created_by)
         RETURNING ID INTO :new_id`,
        {
          content_id: content.ID,
          channel: body.channel,
          recipient_count: 1,
          status: distroStatus,
          scheduled_at: isScheduled ? body.scheduled_at : null,
          created_by: user.user_id,
          new_id: { dir: 3001, type: 2010 },
        }
      )
      const distributionId = Number(distroInsert.rows[0]?.[0])

      if (isScheduled) {
        await conn.execute(`UPDATE AI_GENERATED_CONTENT SET STATUS = 'scheduled', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`, { id: content.ID })
      } else if (outcome.status === 'sent') {
        await conn.execute(`UPDATE AI_GENERATED_CONTENT SET STATUS = 'published', UPDATED_AT = CURRENT_TIMESTAMP WHERE ID = :id`, { id: content.ID })
      }

      const preview = body.channel === 'instagram'
        ? (parseStoredContent<{ caption: string; hashtags: string }>(content.GENERATED_CONTENT)?.caption || '')
        : (parseStoredContent<{ message: string }>(content.GENERATED_CONTENT)?.message || '')

      return {
        distribution_id: distributionId,
        channel: body.channel,
        status: distroStatus,
        recipient_count: 1,
        campaign_id: null,
        scheduled_at: isScheduled ? body.scheduled_at : null,
        sent_at: !isScheduled && outcome.status === 'sent' ? new Date().toISOString() : null,
        preview,
      }
    })

    return successResponse(result, 'Content distributed', 201)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}