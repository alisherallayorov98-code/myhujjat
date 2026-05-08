'use client'

import Link from 'next/link'
import { AlertTriangle, TrendingUp, ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useQuery }  from '@tanstack/react-query'
import { useAuth }   from '@/hooks/useAuth'
import { Card }      from '@/components/ui/Card'
import { cn }        from '@/lib/cn'
import api           from '@/lib/api'
import { formatCurrency } from '@/lib/formatters'

const LEVEL_CFG = {
  WARNING:          { label: '80%+',  color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', bar: 'bg-[#F59E0B]' },
  CRITICAL:         { label: '95%+',  color: 'text-[#EA580C]', bg: 'bg-[#FFF7ED]', bar: 'bg-[#EA580C]' },
  EXCEEDED:         { label: '100%+', color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', bar: 'bg-[#DC2626]' },
  CRITICAL_OVERAGE: { label: '120%+', color: 'text-[#991B1B]', bg: 'bg-[#FEE2E2]', bar: 'bg-[#991B1B]' },
} as const

export function ContractAlerts() {
  const { currentOrg } = useAuth()
  const t = useTranslations('dashboard')

  const { data } = useQuery<{ data: any[] }>({
    queryKey: ['alert-contracts', currentOrg?.id],
    queryFn:  () => api.get(`/contracts?orgId=${currentOrg!.id}&alertLevel=any&limit=5`).then(r => r.data),
    enabled:  !!currentOrg?.id,
    refetchInterval: 5 * 60 * 1000,
  })

  const alerts = (data?.data || []).filter(c => c.alertLevel)
  if (alerts.length === 0) return null

  return (
    <Card padding="none" className="overflow-hidden border-[#FEE2E2]">
      <div className="px-5 py-3 border-b border-[#FEE2E2] bg-[#FFF5F5] flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-[#DC2626]" />
          <p className="text-xs font-semibold text-[#991B1B] uppercase tracking-wider">
            {t('alerts.title')}
          </p>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#DC2626]">
            {alerts.length}
          </span>
        </div>
        <Link href="/dashboard/buxgalter/nazorat"
          className="text-xs text-[#DC2626] hover:underline flex items-center gap-1 font-medium">
          {t('alerts.viewAll')} <ArrowRight size={11} />
        </Link>
      </div>

      <div className="divide-y divide-[#FEF2F2]">
        {alerts.map((c: any) => {
          const cfg  = LEVEL_CFG[c.alertLevel as keyof typeof LEVEL_CFG] ?? LEVEL_CFG.WARNING
          const pct  = c.amount > 0 ? Math.round((c.totalInvoiced / c.amount) * 100) : 0
          const barW = Math.min(pct, 100)
          return (
            <Link key={c.id} href={`/dashboard/shartnomalar/${c.id}`}
              className="flex items-center gap-3 px-5 py-3 hover:bg-[#FFF5F5] transition group">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                <TrendingUp size={14} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {c.contractNumber}
                  </p>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0', cfg.bg, cfg.color)}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] truncate mb-1.5">
                  {c.counterparty?.name || '—'}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', cfg.bar)}
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                  <span className={cn('text-[10px] font-bold tabular-nums shrink-0', cfg.color)}>
                    {pct}%
                  </span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs font-semibold text-[#0F172A]">
                  {formatCurrency(c.totalInvoiced || 0)}
                </p>
                <p className="text-[10px] text-[#94A3B8]">
                  / {formatCurrency(c.amount || 0)}
                </p>
              </div>
              <ArrowRight size={13} className="text-[#CBD5E1] group-hover:text-[#DC2626] shrink-0" />
            </Link>
          )
        })}
      </div>
    </Card>
  )
}
