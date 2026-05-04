'use client'

import Link                      from 'next/link'
import { useTranslations }       from 'next-intl'
import { Clock, FileText, ChevronRight } from 'lucide-react'
import { Card }                  from '@/components/ui/Card'

interface Props {
  history: any[]
  orgId?:  string
}

export function HistoryList({ history }: Props) {
  const t = useTranslations('seifAi')
  if (history.length === 0) return null

  return (
    <Card>
      <p className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
        <Clock size={14} className="text-[#94A3B8]" />
        {t('historyTitle')}
      </p>
      <div className="space-y-1">
        {history.slice(0, 10).map((h: any) => (
          <Link
            key={h.id}
            href={`/dashboard/seif/ai/${h.id}`}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] transition-colors group"
          >
            <FileText size={13} className="text-[#94A3B8] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#475569] truncate group-hover:text-[#2563EB]">
                {h.title}
              </p>
              <p className="text-[10px] text-[#94A3B8]">
                {t('tokenUsed', { count: h.tokensUsed })}
              </p>
            </div>
            <ChevronRight size={13} className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors" />
          </Link>
        ))}
      </div>
    </Card>
  )
}
