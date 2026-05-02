'use client'

import { useMemo } from 'react'
import { PieChart } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'

interface ContractRow {
  contractType: string
}

interface Props {
  contracts: ContractRow[]
}

export function TypeDistribution({ contracts }: Props) {
  const t  = useTranslations('dashboard')
  const tc = useTranslations('contracts')
  const data = useMemo(() => {
    const counts: Record<string, number> = {}
    contracts.forEach(c => {
      counts[c.contractType] = (counts[c.contractType] || 0) + 1
    })

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => {
        const cfg = (CONTRACT_TYPE_CONFIG as any)[type]
        let name = cfg?.name ?? type
        try { name = tc(`types.${type}` as any) || name } catch {}
        return {
          type,
          name,
          icon:  cfg?.icon  ?? '📄',
          bg:    cfg?.bg    ?? 'bg-[#F1F5F9]',
          color: cfg?.color ?? 'text-[#475569]',
          count,
        }
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contracts])

  const total = contracts.length
  const maxCount = Math.max(...data.map(d => d.count), 1)

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-2">
        <PieChart size={14} className="text-[#94A3B8]" />
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t('typeDistribution.title')}</p>
      </div>

      {data.length === 0 ? (
        <div className="p-8 text-center">
          <PieChart size={28} className="mx-auto text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8]">{t('typeDistribution.noContracts')}</p>
        </div>
      ) : (
        <div className="p-5 space-y-3">
          {data.map(d => {
            const pct = total > 0 ? (d.count / total) * 100 : 0
            const barPct = (d.count / maxCount) * 100
            return (
              <div key={d.type}>
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 ${d.bg}`}>
                    {d.icon}
                  </div>
                  <p className="text-xs font-medium text-[#0F172A] flex-1 truncate">{d.name}</p>
                  <p className="text-xs font-bold text-[#0F172A]">{d.count}</p>
                  <p className="text-[10px] text-[#94A3B8] w-10 text-right">{pct.toFixed(0)}%</p>
                </div>
                <div className="ml-9 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] rounded-full transition-all"
                    style={{ width: `${barPct}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
