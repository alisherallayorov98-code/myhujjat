'use client'

import { useMemo } from 'react'
import { TrendingUp, BarChart3 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { formatCurrency } from '@/lib/formatters'

interface ContractRow {
  amount:    number
  createdAt: string
}

interface Props {
  contracts: ContractRow[]
}

export function MonthlyChart({ contracts }: Props) {
  const t = useTranslations('dashboard')

  const MONTH_NAMES = [
    t('monthlyChart.months.jan'), t('monthlyChart.months.feb'), t('monthlyChart.months.mar'),
    t('monthlyChart.months.apr'), t('monthlyChart.months.may'), t('monthlyChart.months.jun'),
    t('monthlyChart.months.jul'), t('monthlyChart.months.aug'), t('monthlyChart.months.sep'),
    t('monthlyChart.months.oct'), t('monthlyChart.months.nov'), t('monthlyChart.months.dec'),
  ]

  const data = useMemo(() => {
    const now = new Date()
    // Oxirgi 6 oy
    const months: { label: string; total: number; count: number; date: Date }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      months.push({
        label: MONTH_NAMES[d.getMonth()],
        total: 0,
        count: 0,
        date:  d,
      })
    }

    contracts.forEach(c => {
      const d = new Date(c.createdAt)
      const idx = months.findIndex(m =>
        m.date.getFullYear() === d.getFullYear() && m.date.getMonth() === d.getMonth()
      )
      if (idx >= 0) {
        months[idx].total += Number(c.amount) || 0
        months[idx].count++
      }
    })

    return months
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts])

  const maxTotal = Math.max(...data.map(d => d.total), 1)
  const maxCount = Math.max(...data.map(d => d.count), 1)
  const totalSum   = data.reduce((s, d) => s + d.total, 0)
  const totalCount = data.reduce((s, d) => s + d.count, 0)

  const lastMonth = data[data.length - 1]?.total || 0
  const prevMonth = data[data.length - 2]?.total || 0
  const trend = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 size={14} className="text-[#94A3B8]" />
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t('monthlyChart.title')}</p>
        </div>
        {trend !== 0 && (
          <span className={`text-xs font-medium flex items-center gap-1 ${trend >= 0 ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            <TrendingUp size={11} className={trend < 0 ? 'rotate-180' : ''} />
            {trend > 0 ? '+' : ''}{trend.toFixed(0)}%
          </span>
        )}
      </div>

      <div className="p-5">
        <div className="flex items-baseline gap-2 mb-5">
          <p className="text-2xl font-bold text-[#0F172A]">
            {totalSum > 0 ? formatCurrency(totalSum) : "0 so'm"}
          </p>
          <p className="text-xs text-[#94A3B8]">{t('monthlyChart.contractsCount', { count: totalCount })}</p>
        </div>

        {/* Bar chart */}
        <div className="flex items-end justify-between gap-1.5 h-32">
          {data.map((m, i) => {
            const heightPct = (m.total / maxTotal) * 100
            const isCurrent = i === data.length - 1
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 group">
                <div className="relative w-full flex-1 flex items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${
                      isCurrent
                        ? 'bg-gradient-to-t from-[#2563EB] to-[#7C3AED]'
                        : 'bg-[#DBEAFE] group-hover:bg-[#BFDBFE]'
                    }`}
                    style={{ height: m.total > 0 ? `${Math.max(heightPct, 4)}%` : '4px' }}
                    title={`${m.label}: ${formatCurrency(m.total)} (${m.count} ta)`}
                  />
                  {m.total > 0 && (
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] text-[#94A3B8] opacity-0 group-hover:opacity-100 transition whitespace-nowrap font-medium">
                      {m.count}
                    </div>
                  )}
                </div>
                <span className={`text-[10px] ${isCurrent ? 'font-bold text-[#2563EB]' : 'text-[#94A3B8]'}`}>
                  {m.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
