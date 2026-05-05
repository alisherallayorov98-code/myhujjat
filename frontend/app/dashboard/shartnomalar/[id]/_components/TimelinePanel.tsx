'use client'

import { useTranslations } from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import {
  Activity, FileText, Edit2, Trash2, CheckCircle, Send,
  Share2, Download, GitBranch, User, Clock,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import api from '@/lib/api'
import { formatDate } from '@/lib/formatters'

interface TimelineEvent {
  kind:      'audit' | 'version'
  id:        string
  action:    string
  details:   any
  createdAt: string
  user:      { id: string; name: string } | null
  ipAddress: string | null
}

interface Props {
  contractId: string
  orgId:      string
}

const ACTION_CONFIG: Record<string, {
  label: string
  icon:  React.ComponentType<{ size?: number; className?: string }>
  color: string
  bg:    string
}> = {
  CONTRACT_CREATED:        { label: 'created',      icon: FileText,    color: 'text-[#15803D]', bg: 'bg-[#DCFCE7]' },
  CONTRACT_UPDATED:        { label: 'updated',      icon: Edit2,       color: 'text-[#1D4ED8]', bg: 'bg-[#DBEAFE]' },
  CONTRACT_DELETED:        { label: 'deleted',      icon: Trash2,      color: 'text-[#B91C1C]', bg: 'bg-[#FEE2E2]' },
  CONTRACT_STATUS_CHANGED: { label: 'statusChanged',icon: CheckCircle, color: 'text-[#B45309]', bg: 'bg-[#FEF3C7]' },
  CONTRACT_SIGNED:         { label: 'signed',       icon: CheckCircle, color: 'text-[#15803D]', bg: 'bg-[#DCFCE7]' },
  CONTRACT_EXPORTED:       { label: 'exported',     icon: Download,    color: 'text-[#475569]', bg: 'bg-[#F1F5F9]' },
  CONTRACT_SHARED:         { label: 'shared',       icon: Share2,      color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]' },
  CONTRACT_PUBLIC_SIGNED:  { label: 'publicSigned', icon: CheckCircle, color: 'text-[#15803D]', bg: 'bg-[#DCFCE7]' },
  CONTRACT_VERSION:        { label: 'version',      icon: GitBranch,   color: 'text-[#0891B2]', bg: 'bg-[#CFFAFE]' },
}

export function TimelinePanel({ contractId, orgId }: Props) {
  const t = useTranslations('contracts')

  const { data, isLoading } = useQuery<{ events: TimelineEvent[] }>({
    queryKey: ['contract-timeline', contractId],
    queryFn:  () => api.get(`/contracts/${contractId}/timeline?orgId=${orgId}`).then(r => r.data),
    enabled:  !!contractId && !!orgId,
  })

  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <Activity size={15} className="text-[#94A3B8]" />
        <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
          {t('timeline.title')}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !data?.events?.length ? (
        <p className="text-sm text-[#94A3B8] text-center py-4">{t('timeline.empty')}</p>
      ) : (
        <div className="space-y-1">
          {data.events.map((event, idx) => {
            const cfg  = ACTION_CONFIG[event.action] ?? {
              label: event.action,
              icon:  Activity,
              color: 'text-[#475569]',
              bg:    'bg-[#F1F5F9]',
            }
            const Icon = cfg.icon
            const isLast = idx === data.events.length - 1
            return (
              <div key={event.id} className="flex gap-3 group">
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${cfg.bg}`}>
                    <Icon size={14} className={cfg.color} />
                  </div>
                  {!isLast && <div className="w-px flex-1 bg-[#E2E8F0] my-1 min-h-[20px]" />}
                </div>
                <div className="flex-1 pb-4 min-w-0">
                  <p className="text-sm font-medium text-[#0F172A]">
                    {t(`timeline.actions.${cfg.label}` as any)}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-[#94A3B8] flex-wrap">
                    {event.user?.name && (
                      <span className="flex items-center gap-1">
                        <User size={10} />
                        {event.user.name}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {formatDate(event.createdAt, 'long')}
                    </span>
                    {event.kind === 'version' && event.details?.version && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] font-mono">
                        v{event.details.version}
                      </span>
                    )}
                    {event.ipAddress && (
                      <span className="text-[10px] text-[#CBD5E1] font-mono">
                        {event.ipAddress}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
