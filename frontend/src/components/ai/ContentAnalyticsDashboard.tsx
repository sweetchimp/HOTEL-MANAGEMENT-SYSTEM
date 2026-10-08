import { useEffect, useState } from 'react'
import { BarChart3, CalendarClock, CheckCircle2, FileText, Share2, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '../../services/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AI_CHANNEL_VARIANT,
  AI_CONTENT_TYPE_META,
  AI_STATUS_LABEL,
  AI_STATUS_VARIANT,
  AI_TYPE_VARIANT,
  aiChannelLabel,
  formatAiDate,
} from '../../lib/aiContent'
import type { AiAnalytics, AiChannelStats } from '../../types'

interface ContentAnalyticsDashboardProps {
  refreshKey: number
}

export default function ContentAnalyticsDashboard({ refreshKey }: ContentAnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AiAnalytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get<AiAnalytics>('/ai/analytics').then(res => {
      if (cancelled) return
      if (res.success && res.data) {
        setAnalytics(res.data)
      } else {
        toast.error('Could not load analytics', { description: res.error })
      }
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [refreshKey])

  if (loading && !analytics) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center py-12 text-center">
          <BarChart3 className="h-8 w-8 text-steel-400" />
          <p className="mt-3 font-medium text-steel-700">No analytics available</p>
          <p className="text-sm text-steel-500">Try refreshing the page.</p>
        </CardContent>
      </Card>
    )
  }

  const maxRecipients = Math.max(1, ...analytics.by_channel.map(c => c.total_recipients))
  const maxEngagements = Math.max(1, ...analytics.by_channel.map(c => c.engagement_count))

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
          <FileText className="mx-auto h-5 w-5 text-primary-600" />
          <p className="mt-1 text-2xl font-bold text-primary-700">{analytics.total_content}</p>
          <p className="text-xs text-steel-500">Generated</p>
        </div>
        <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
          <CheckCircle2 className="mx-auto h-5 w-5 text-blue-600" />
          <p className="mt-1 text-2xl font-bold text-primary-700">{analytics.total_approved}</p>
          <p className="text-xs text-steel-500">Approved ({analytics.approval_rate}%)</p>
        </div>
        <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
          <Share2 className="mx-auto h-5 w-5 text-accent-600" />
          <p className="mt-1 text-2xl font-bold text-accent-700">{analytics.total_sent}</p>
          <p className="text-xs text-steel-500">Distributions</p>
        </div>
        <div className="rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center">
          <Users className="mx-auto h-5 w-5 text-green-600" />
          <p className="mt-1 text-2xl font-bold text-steel-700">{analytics.total_recipients}</p>
          <p className="text-xs text-steel-500">Recipients</p>
        </div>
        <div className="col-span-2 rounded-xl border border-dust-200 bg-dust-50/60 p-3 text-center sm:col-span-1">
          <Zap className="mx-auto h-5 w-5 text-yellow-500" />
          <p className="mt-1 text-2xl font-bold text-steel-700">{analytics.total_engagements}</p>
          <p className="text-xs text-steel-500">Engagements</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#1a1a1a]">Channel performance</p>
            {analytics.by_channel.length === 0 ? (
              <p className="mt-3 text-sm text-steel-500">No distributions recorded yet.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {analytics.by_channel.map((c: AiChannelStats) => (
                  <div key={c.channel} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex items-center gap-2 font-medium text-[#1a1a1a]">
                        <Badge variant={AI_CHANNEL_VARIANT[c.channel]}>{aiChannelLabel(c.channel)}</Badge>
                        <span className="text-xs text-steel-500">
                          {c.sent_count} sent{c.scheduled_count > 0 ? ` · ${c.scheduled_count} scheduled` : ''}
                        </span>
                      </span>
                      <span className="text-xs text-steel-600">{c.total_recipients} recipients</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dust-200">
                        <div
                          className="h-full rounded-full bg-primary-500"
                          style={{ width: `${Math.min(100, (c.total_recipients / maxRecipients) * 100)}%` }}
                        />
                      </div>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-dust-200">
                        <div
                          className="h-full rounded-full bg-accent-500"
                          style={{ width: `${Math.min(100, (c.engagement_count / maxEngagements) * 100)}%` }}
                          title={`${c.engagement_count} engagements`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm font-semibold text-[#1a1a1a]">Content mix</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analytics.by_type.length === 0 ? (
                <p className="text-sm text-steel-500">No content generated yet.</p>
              ) : (
                analytics.by_type.map(t => (
                  <div
                    key={t.type}
                    className="rounded-lg border border-dust-200 bg-dust-50/60 px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium text-[#1a1a1a]">
                      {AI_CONTENT_TYPE_META[t.type]?.label || t.type}
                    </span>
                    <span className="ml-1.5 rounded-full bg-primary-100 px-2 py-0.5 text-xs font-bold text-primary-700">
                      {t.count}
                    </span>
                  </div>
                ))
              )}
            </div>
            <p className="mt-5 text-sm font-semibold text-[#1a1a1a]">By status</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {analytics.by_status.length === 0 ? (
                <p className="text-sm text-steel-500">Nothing to show.</p>
              ) : (
                analytics.by_status.map(s => (
                  <Badge key={s.status} variant={AI_STATUS_VARIANT[s.status]}>
                    {AI_STATUS_LABEL[s.status]} · {s.count}
                  </Badge>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <p className="text-sm font-semibold text-[#1a1a1a]">Recently generated</p>
          {analytics.recent_generated.length === 0 ? (
            <p className="mt-3 text-sm text-steel-500">No content generated yet — start with the Create tab.</p>
          ) : (
            <ul className="mt-3 divide-y divide-dust-200">
              {analytics.recent_generated.map(item => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <CalendarClock className="h-4 w-4 shrink-0 text-steel-400" />
                    <span className="truncate font-medium text-[#1a1a1a]" title={item.title}>
                      {item.title}
                    </span>
                    <Badge variant={AI_TYPE_VARIANT[item.type]}>
                      {AI_CONTENT_TYPE_META[item.type]?.label || item.type}
                    </Badge>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <Badge variant={AI_STATUS_VARIANT[item.status]}>{AI_STATUS_LABEL[item.status]}</Badge>
                    <span className="hidden text-xs text-steel-500 sm:block">{formatAiDate(item.created_at)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}