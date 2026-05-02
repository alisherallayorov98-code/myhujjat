'use client'

import { useTranslations } from 'next-intl'
import { Card } from '@/components/ui/Card'
import { cn }   from '@/lib/cn'
import { DOC_TYPES, CATEGORIES } from './constants'

interface Props {
  category:    string
  setCategory: (id: string) => void
  docType:     string
  setDocType:  (v: string) => void
}

export function DocTypePicker({ category, setCategory, docType, setDocType }: Props) {
  const t = useTranslations('seifAi')
  const filtered = category === 'all'
    ? DOC_TYPES
    : DOC_TYPES.filter(d => d.category === category)

  return (
    <Card>
      <p className="text-sm font-semibold text-[#0F172A] mb-3">{t('docType')}</p>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-medium border transition-all',
              category === cat.id
                ? 'border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]'
                : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            )}
          >
            {t(cat.labelKey as any)}
          </button>
        ))}
      </div>

      <div className="space-y-0.5 max-h-56 overflow-y-auto">
        {filtered.map(type => (
          <button
            key={type.value}
            onClick={() => setDocType(type.value)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all',
              docType === type.value
                ? 'bg-[#DBEAFE] text-[#1D4ED8] font-medium'
                : 'text-[#475569] hover:bg-[#F1F5F9]'
            )}
          >
            <span>{type.icon}</span>
            <span>{type.value}</span>
          </button>
        ))}
      </div>
    </Card>
  )
}
