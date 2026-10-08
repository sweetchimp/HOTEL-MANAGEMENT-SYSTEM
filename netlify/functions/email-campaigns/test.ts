// ============================================================
// POST /api/email-campaigns/:id/test
// ADMIN/MANAGER — send a test copy to the hotel email.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, NotFoundError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import { sendEmail } from '../_shared/email'
import { renderTemplate, SAMPLE_RENDER_DATA } from '../_shared/marketing'
import type { DbEmailCampaign, DbEmailTemplate, DbSystemSetting } from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'POST') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])
    const parts = new URL(req.url).pathname.split('/')
    const id = Number(parts[parts.length - 2])
    if (!Number.isFinite(id)) throw new NotFoundError('Campaign not found')

    const result = await withConnection(async (conn) => {
      const res = await conn.execute('SELECT * FROM EMAIL_CAMPAIGNS WHERE ID = :id', { id })
      const campaign = mapRows<DbEmailCampaign>(res.rows, 'EMAIL_CAMPAIGNS')[0]
      if (!campaign) throw new NotFoundError('Campaign not found')

      let subject = campaign.SUBJECT_OVERRIDE || campaign.TITLE
      let bodyHtml = campaign.BODY_OVERRIDE || ''
      if (campaign.TEMPLATE_ID && !campaign.BODY_OVERRIDE) {
        const tplRes = await conn.execute('SELECT * FROM EMAIL_TEMPLATES WHERE ID = :id', { id: Number(campaign.TEMPLATE_ID) })
        const tpl = mapRows<DbEmailTemplate>(tplRes.rows, 'EMAIL_TEMPLATES')[0]
        if (tpl) {
          if (!campaign.SUBJECT_OVERRIDE) subject = tpl.SUBJECT || campaign.TITLE
          bodyHtml = tpl.BODY || ''
        }
      }

      const settings = mapRows<DbSystemSetting>(
        (await conn.execute('SELECT * FROM SYSTEM_SETTINGS WHERE SETTING_KEY = :setting_key', { setting_key: 'hotel_email' })).rows,
        'SYSTEM_SETTINGS'
      )
      const to = settings.find(s => s.SETTING_KEY === 'hotel_email')?.SETTING_VALUE || 'admin@altonshotel.com'

      const html = renderTemplate(bodyHtml, SAMPLE_RENDER_DATA)
      const sendResult = await sendEmail({ to, subject: `[TEST] ${subject}`, html })
      return { to, subject: `[TEST] ${subject}`, ...sendResult }
    })

    return successResponse(result, 'Test email sent')
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}
