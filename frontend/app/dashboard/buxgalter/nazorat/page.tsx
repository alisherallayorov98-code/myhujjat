'use client'

import { useState, useMemo } from 'react'
import { useRouter }         from 'next/navigation'
import { useTranslations }   from 'next-intl'
import { useQuery }          from '@tanstack/react-query'
import {
  AlertTriangle, AlertOctagon, TrendingUp, ExternalLink,
  ShieldAlert, CheckCircle, Loader2,
} from 'lucide-react'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { EmptyState }   from '@/components/ui/Skeleton'
import { useAuth }      from '@/hooks/useAuth'
import { formatCurrency } from '@/lib/formatters'
import api              from '@/lib/api'
import { cn }           from '@/lib/cn'

type AlertLevel = 'WARNING' | 'CRITICAL' | 'EXCEEDED' | 'CRITICAL_OVERAGE'

interface ContractRow {
  id:            string
  contractNumber: string
  contractDate:  string
  contractType:  string
  amount:        string | null
  totalInvoiced: string
  invoiceCount:  number
  alertLevel:    AlertLevel | null
  counterparty:  { id: string; name: string; inn?: string } | null
}

const ALERT_META: Record<AlertLevel, { label: string; color: string; bg: string; border: string; icon: any }> = {
  WARNING:          { label: '80%+',  color: 'text-[#B45309]', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]', icon: AlertTriangle },
  CRITICAL:         { label: '95%+',  color: 'text-[#C2410C]', bg: 'bg-[#FFEDD5]', border: 'border-[#FED7AA]', icon: AlertOctagon  },
  EXCEEDED:         { label: '100%+', color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', border: 'border-[#FECACA]', icon: ShieldAlert   },
  CRITICAL_OVERAGE: { label: '120%+', color: 'text-[#991B1B]', bg: 'bg-[#FEE2E2]', border: 'border-[#FCA5A5]', icon: ShieldAlert   },
}

function pct(amount: string | null, invoiced: string): number {
  const a = parseFloat(amount || '0')
  const i = parseFloat(invoiced || '0')
  if (!a || !i) return 0
  return Math.round((i / a) * 100)
}

function ProgressBar({ percent, level }: { percent: number; level: AlertLevel | null }) {
  const capped = Math.min(percent, 100)
  const color =
    level === 'CRITICAL_OVERAGE' || level === 'EXCEEDED' ? 'bg-[#DC2626]' :
    level === 'CRITICAL' ? 'bg-[#EA580C]' :
    level === 'WARNING'  ? 'bg-[#D97706]' : 'bg-[#22C55E]'
  return (
    <div className="flex items-center gap-2 min-w-[120px]">
      <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${capped}%` }} />
      </div>
      <span className={cn('text-xs font-semibold tabular-nums w-10 text-right shrink-0',
        level === 'EXCEEDED' || level === 'CRITICAL_OVERAGE' ? 'text-[#DC2626]' :
        level === 'CRITICAL' ? 'text-[#EA580C]' :
        level === 'WARNING'  ? 'text-[#D97706]' : 'text-[#64748B]',
      )}>
        {percent}%
      </span>
    </div>
  )
}

export default function NazoratPage() {
  const t      = useTranslations('accountant.nazorat')
  const router = useRouter()
  const { currentOrg } = useAuth()

  const now = new Date()
  const [year,  setYear]  = useState<string>('')
  const [month, setMonth] = useState<string>('')
  const [alert, setAlert] = useState<string>('any')
  const [limit, setLimit] = useState<number>(25)
  const [page,  setPage]  = useState(1)

  const { data, isLoading } = useQuery<{ data: ContractRow[]; meta: any }>({
    queryKey: ['contracts-nazorat', currentOrg?.id, year, month, alert, limit, page],
    queryFn: () => {
      const params = new URLSearchParams({
        orgId:      currentOrg!.id,
        alertLevel: alert,
        limit:      String(limit),
        page:       String(page),
        ...(year  && { year }),
        ...(month && { month }),
      })
      return api.get(`/contracts?${params}`).then(r => r.data)
    },
    enabled: !!currentOrg?.id,
  })

  const contracts = data?.data ?? []
  const meta      = data?.meta

  // stat kartalar — faqat tushgan ma'lumotlardan
  const stats = useMemo(() => {
    const all = contracts
    return {
      warning:  all.filter(c => c.alertLevel === 'WARNING').length,
      critical: all.filter(c => c.alertLevel === 'CRITICAL').length,
      exceeded: all.filter(c => c.alertLevel === 'EXCEEDED' || c.alertLevel === 'CRITICAL_OVERAGE').length,
      overage:  all
        .filter(c => c.alertLevel === 'EXCEEDED' || c.alertLevel === 'CRITICAL_OVERAGE')
        .reduce((sum, c) => {
          const diff = parseFloat(c.totalInvoiced) - parseFloat(c.amount || '0')
          return sum + (diff > 0 ? diff : 0)
        }, 0),
    }
  }, [contracts])

  const years = useMemo(() => {
    const cur = now.getFullYear()
    return [cur, cur - 1, cur - 2].map(String)
  }, [])

  const months = Array.from({ length: 12 }, (_, i) => String(i + 1))

  return (
    <div className="space-y-5">
      <PageHeader
        title={t('title')}
        description={t('desc')}
      />

      {/* Stat kartalar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'warning',  label: t('statWarning'),  value: stats.warning,  icon: AlertTriangle, color: 'text-[#B45309]', bg: 'bg-[#FEF3C7]' },
          { key: 'critical', label: t('statCritical'), value: stats.critical, icon: AlertOctagon,  color: 'text-[#C2410C]', bg: 'bg-[#FFEDD5]' },
          { key: 'exceeded', label: t('statExceeded'), value: stats.exceeded, icon: ShieldAlert,   color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]' },
        ].map(s => (
          <Card key={s.key} padding="sm">
            <div className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', s.bg)}>
                <s.icon size={16} className={s.color} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-[#0F172A]">{s.value}</p>
                <p className="text-xs text-[#94A3B8] truncate">{s.label}</p>
              </div>
            </div>
          </Card>
        ))}
        <Card padding="sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 bg-[#FEE2E2]">
              <TrendingUp size={16} className="text-[#DC2626]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-[#DC2626] tabular-nums">
                {stats.overage > 0 ? formatCurrency(stats.overage) : '—'}
              </p>
              <p className="text-xs text-[#94A3B8] truncate">{t('statOverageSum')}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Yil */}
        <select
          value={year}
          onChange={e => { setYear(e.target.value); setPage(1) }}
          className="h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] text-[#475569]"
        >
          <option value="">{t('filterAllYears')}</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Oy */}
        <select
          value={month}
          onChange={e => { setMonth(e.target.value); setPage(1) }}
          className="h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] text-[#475569]"
        >
          <option value="">{t('filterAllMonths')}</option>
          {months.map(m => (
            <option key={m} value={m}>{t(`months.${m}` as any)}</option>
          ))}
        </select>

        {/* Holat */}
        <select
          value={alert}
          onChange={e => { setAlert(e.target.value); setPage(1) }}
          className="h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] text-[#475569]"
        >
          <option value="any">{t('allAlerts')}</option>
          <option value="WARNING">{t('warning')}</option>
          <option value="CRITICAL">{t('critical')}</option>
          <option value="EXCEEDED">{t('exceeded')}</option>
          <option value="CRITICAL_OVERAGE">{t('criticalOverage')}</option>
          <option value="">{t('filterAll')}</option>
        </select>

        <div className="ml-auto flex items-center gap-2 text-sm text-[#94A3B8]">
          <span>{t('filterLimit')}:</span>
          {[10, 25, 50].map(n => (
            <button
              key={n}
              onClick={() => { setLimit(n); setPage(1) }}
              className={cn(
                'px-2.5 py-1 rounded-lg text-sm transition',
                limit === n
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0]',
              )}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Jadval */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {[
                  t('colContract'), t('colCounterparty'),
                  t('colAmount'), t('colInvoiced'),
                  t('colPercent'), t('colAlert'), '',
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#E2E8F0]">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-[#F1F5F9] rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle size={36} className="text-[#22C55E]" />
                      <p className="font-medium text-[#1E293B]">{t('noAlerts')}</p>
                      <p className="text-sm text-[#94A3B8]">{t('noAlertsDesc')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contracts.map(c => {
                  const percent = pct(c.amount, c.totalInvoiced)
                  const meta    = c.alertLevel ? ALERT_META[c.alertLevel] : null
                  const Icon    = meta?.icon
                  return (
                    <tr
                      key={c.id}
                      onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}
                      className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] cursor-pointer group"
                    >
                      {/* Shartnoma */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-mono font-medium text-[#2563EB]">{c.contractNumber}</p>
                        <p className="text-xs text-[#94A3B8]">{c.contractDate}</p>
                      </td>

                      {/* Kontragent */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-sm text-[#0F172A] truncate">{c.counterparty?.name ?? '—'}</p>
                        {c.counterparty?.inn && (
                          <p className="text-xs text-[#94A3B8] font-mono">{c.counterparty.inn}</p>
                        )}
                      </td>

                      {/* Shartnoma summa */}
                      <td className="px-4 py-3 text-sm tabular-nums text-[#475569]">
                        {c.amount ? formatCurrency(parseFloat(c.amount)) : '—'}
                      </td>

                      {/* Faktura summa */}
                      <td className="px-4 py-3">
                        <p className={cn(
                          'text-sm font-semibold tabular-nums',
                          (c.alertLevel === 'EXCEEDED' || c.alertLevel === 'CRITICAL_OVERAGE')
                            ? 'text-[#DC2626]'
                            : 'text-[#0F172A]',
                        )}>
                          {formatCurrency(parseFloat(c.totalInvoiced || '0'))}
                        </p>
                        {c.invoiceCount > 0 && (
                          <p className="text-xs text-[#94A3B8]">{c.invoiceCount} ta faktura</p>
                        )}
                      </td>

                      {/* Progress */}
                      <td className="px-4 py-3">
                        <ProgressBar percent={percent} level={c.alertLevel} />
                      </td>

                      {/* Alert badge */}
                      <td className="px-4 py-3">
                        {meta && Icon ? (
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border',
                            meta.bg, meta.color, meta.border,
                          )}>
                            <Icon size={11} />
                            {meta.label}
                          </span>
                        ) : (
                          <span className="text-xs text-[#94A3B8]">—</span>
                        )}
                      </td>

                      {/* Ko'rish */}
                      <td className="px-4 py-3">
                        <button
                          onClick={e => { e.stopPropagation(); router.push(`/dashboard/shartnomalar/${c.id}`) }}
                          className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#EFF6FF] transition-all"
                          title={t('viewContract')}
                        >
                          <ExternalLink size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
            <p className="text-sm text-[#94A3B8]">
              Jami: {meta.total} ta
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F1F5F9] transition"
              >
                ←
              </button>
              <span className="px-3 py-1.5 text-sm text-[#475569]">{page} / {meta.totalPages}</span>
              <button
                onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                disabled={page >= meta.totalPages}
                className="px-3 py-1.5 rounded-lg text-sm border border-[#E2E8F0] disabled:opacity-40 hover:bg-[#F1F5F9] transition"
              >
                →
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
