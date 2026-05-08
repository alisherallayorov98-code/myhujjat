'use client'

import Link from 'next/link'
import {
  Calendar, Clock, AlertCircle, ArrowRight, FileText, CreditCard,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQuery }   from '@tanstack/react-query'
import { useAuth }    from '@/hooks/useAuth'
import { Card }       from '@/components/ui/Card'
import { cn }         from '@/lib/cn'
import { formatDate } from '@/lib/formatters'
import api            from '@/lib/api'

interface DeadlineItem {
  id:        string
  type:      'subscription' | 'contract'
  title:     string
  date:      Date
  daysLeft:  number
  link?:     string
  icon:      'sub' | 'doc'
}

export function UpcomingDeadlines() {
  const { user, currentOrg } = useAuth()
  const t = useTranslations('dashboard')

  const { data: expiring } = useQuery<{ data: any[] }>({
    queryKey: ['contracts-expiring', currentOrg?.id],
    queryFn:  () => api.get(`/contracts?orgId=${currentOrg!.id}&expiringSoon=true&limit=5`).then(r => r.data),
    enabled:  !!currentOrg?.id,
    refetchInterval: 10 * 60 * 1000,
  })

  // Obuna muddati
  const subItem: DeadlineItem | null = (() => {
    const sub = user?.subscription
    if (!sub?.expiresAt || sub.plan === 'FREE') return null
    const expiry = new Date(sub.expiresAt)
    const now    = new Date()
    const days   = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 30 || days < 0) return null
    return {
      id:       'subscription',
      type:     'subscription',
      title:    t('deadlines.subscription', { plan: sub.plan }),
      date:     expiry,
      daysLeft: days,
      link:     '/dashboard/sozlamalar/obuna',
      icon:     'sub',
    }
  })()

  // Tugash sanasi yaqinlashgan shartnomalar
  const contractItems: DeadlineItem[] = (expiring?.data || []).map((c: any) => {
    const expiry = new Date(c.endDate)
    const now    = new Date()
    const days   = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return {
      id:       c.id,
      type:     'contract',
      title:    c.contractNumber,
      date:     expiry,
      daysLeft: Math.max(0, days),
      link:     `/dashboard/shartnomalar/${c.id}`,
      icon:     'doc',
    }
  })

  const items: DeadlineItem[] = [
    ...(subItem ? [subItem] : []),
    ...contractItems,
  ].sort((a, b) => a.daysLeft - b.daysLeft)

  if (items.length === 0) {
    return (
      <Card padding="none" className="overflow-hidden">
        <Header title={t('deadlines.title')} />
        <div className="p-8 text-center">
          <Calendar size={28} className="mx-auto text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">{t('deadlines.empty')}</p>
          <p className="text-xs text-[#CBD5E1] mt-1">{t('deadlines.allOnTrack')}</p>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="overflow-hidden">
      <Header title={t('deadlines.title')} />
      <div className="divide-y divide-[#F1F5F9]">
        {items.map(item => <DeadlineRow key={item.id} item={item} />)}
      </div>
    </Card>
  )
}

function Header({ title }: { title: string }) {
  return (
    <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
      <Calendar size={14} className="text-[#94A3B8]" />
      <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{title}</p>
    </div>
  )
}

function DeadlineRow({ item }: { item: DeadlineItem }) {
  const t      = useTranslations('dashboard')
  const Icon   = item.icon === 'sub' ? CreditCard : FileText
  const urgent = item.daysLeft <= 3
  const warn   = item.daysLeft <= 7 && !urgent

  const inner = (
    <div className={cn(
      'flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition group',
      urgent && 'bg-[#FEF2F2]/50',
      warn   && 'bg-[#FFFBEB]/50',
    )}>
      <div className={cn(
        'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
        urgent ? 'bg-[#FEE2E2] text-[#DC2626]' :
        warn   ? 'bg-[#FEF3C7] text-[#D97706]' :
                 'bg-[#DBEAFE] text-[#2563EB]'
      )}>
        <Icon size={15} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] truncate">{item.title}</p>
        <p className="text-xs text-[#94A3B8] mt-0.5 flex items-center gap-1">
          <Clock size={11} />
          {item.daysLeft === 0 ? t('deadlines.today') :
           item.daysLeft === 1 ? t('deadlines.tomorrow') :
           t('deadlines.daysLeft', { count: item.daysLeft })}
          <span className="text-[#CBD5E1]">·</span>
          <span>{formatDate(item.date, 'short')}</span>
        </p>
      </div>
      <span className={cn(
        'text-xs font-bold tabular-nums shrink-0',
        urgent ? 'text-[#DC2626]' :
        warn   ? 'text-[#D97706]' : 'text-[#2563EB]'
      )}>
        {urgent && <AlertCircle size={11} className="inline mr-0.5" />}
        {item.daysLeft}d
      </span>
      {item.link && (
        <ArrowRight size={13} className="text-[#CBD5E1] group-hover:text-[#2563EB] shrink-0" />
      )}
    </div>
  )

  return item.link ? <Link href={item.link}>{inner}</Link> : inner
}
