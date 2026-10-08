// ============================================================
// GET /api/ai/analytics
// ADMIN/MANAGER — aggregate analytics for the AI content hub:
// generation volume, approval rate, channel performance.
// ============================================================

import { withConnection } from '../_shared/db'
import { successResponse, errorResponse, optionsResponse } from '../_shared/response'
import { AppError, requireRole } from '../_shared/middleware'
import { mapRows } from '../_shared/row-mapper'
import type {
  AiAnalytics,
  AiChannel,
  AiChannelStats,
  DbAiDistribution,
  DbAiGeneratedContent,
  DbTrackingEvent,
} from '../_shared/types'

export default async (req: Request) => {
  if (req.method === 'OPTIONS') return optionsResponse()
  if (req.method !== 'GET') return errorResponse('Method not allowed', 405)

  try {
    requireRole(req, ['ADMIN', 'MANAGER'])

    const analytics = await withConnection(async (conn): Promise<AiAnalytics> => {
      const content = mapRows<DbAiGeneratedContent>(
        (await conn.execute('SELECT * FROM AI_GENERATED_CONTENT')).rows,
        'AI_GENERATED_CONTENT'
      )
      const distributions = mapRows<DbAiDistribution>(
        (await conn.execute('SELECT * FROM AI_CONTENT_DISTRIBUTIONS')).rows,
        'AI_CONTENT_DISTRIBUTIONS'
      )
      const tracking = mapRows<DbTrackingEvent>(
        (await conn.execute('SELECT * FROM EMAIL_TRACKING')).rows,
        'EMAIL_TRACKING'
      )

      const engagementFor = (d: DbAiDistribution): number => {
        if (d.CAMPAIGN_ID) {
          const events = tracking.filter(t => t.CAMPAIGN_ID === d.CAMPAIGN_ID)
          if (events.length > 0) return events.filter(e => e.EVENT_TYPE === 'open' || e.EVENT_TYPE === 'click').length
        }
        return Number(d.ENGAGEMENT_COUNT) || 0
      }

      const sent = distributions.filter(d => d.STATUS === 'sent')
      const scheduled = distributions.filter(d => d.STATUS === 'scheduled')

      const byType = new Map<string, number>()
      for (const c of content) byType.set(c.TYPE, (byType.get(c.TYPE) || 0) + 1)

      const byStatus = new Map<string, number>()
      for (const c of content) byStatus.set(c.STATUS, (byStatus.get(c.STATUS) || 0) + 1)

      const byChannel = new Map<AiChannel, AiChannelStats>()
      const seed: AiChannel[] = ['email', 'newsletter', 'instagram', 'whatsapp']
      for (const ch of seed) byChannel.set(ch, { channel: ch, sent_count: 0, scheduled_count: 0, total_recipients: 0, engagement_count: 0 })
      for (const d of distributions) {
        const stats = byChannel.get(d.CHANNEL)!
        if (d.STATUS === 'sent') {
          stats.sent_count++
          stats.total_recipients += Number(d.RECIPIENT_COUNT) || 0
          stats.engagement_count += engagementFor(d)
        } else if (d.STATUS === 'scheduled') {
          stats.scheduled_count++
        }
      }

      const totalContent = content.length
      const approved = content.filter(c => c.STATUS === 'approved' || c.STATUS === 'published').length
      const totalRecipients = sent.reduce((sum, d) => sum + (Number(d.RECIPIENT_COUNT) || 0), 0)
      const totalEngagements = sent.reduce((sum, d) => sum + engagementFor(d), 0)

      return {
        total_content: totalContent,
        total_approved: approved,
        total_sent: sent.length,
        total_recipients: totalRecipients,
        total_engagements: totalEngagements,
        approval_rate: totalContent > 0 ? Math.round((approved / totalContent) * 100) : 0,
        by_type: [...byType.entries()].map(([type, count]) => ({ type: type as AiAnalytics['by_type'][number]['type'], count })),
        by_status: [...byStatus.entries()].map(([status, count]) => ({ status: status as AiAnalytics['by_status'][number]['status'], count })),
        by_channel: [...byChannel.values()],
        recent_generated: [...content]
          .sort((a, b) => String(b.CREATED_AT).localeCompare(String(a.CREATED_AT)))
          .slice(0, 5)
          .map(c => ({ id: c.ID, title: c.TITLE, type: c.TYPE, status: c.STATUS, created_at: c.CREATED_AT })),
      }
    })

    return successResponse(analytics)
  } catch (error) {
    if (error instanceof AppError) return errorResponse(error)
    return errorResponse('Internal server error')
  }
}