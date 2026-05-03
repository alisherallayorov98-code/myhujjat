'use client'

import { useTranslations } from 'next-intl'
import { Hash, Eye }       from 'lucide-react'
import { Card }            from '@/components/ui/Card'
import { Input }           from '@/components/ui/Input'
import { cn }              from '@/lib/cn'
import { formatCurrency }  from '@/lib/formatters'
import type { BulkDraft }  from './types'

interface Props {
  draft: BulkDraft
  onChange: (patch: Partial<BulkDraft>) => void
}

export function Step3Numbering({ draft, onChange }: Props) {
  const t = useTranslations('bulkSend')

  const items = draft.items || []
  const total = items.reduce((sum, it) => sum + Number(it.amount ?? draft.defaultAmount ?? 0), 0)

  // Preview — birinchi kontragent uchun namuna
  const sample = items[0]
  let samplePreview = ''
  if (sample && draft.customContent) {
    samplePreview = draft.customContent
      .replace(/\{\{\s*KONTRAGENT_NOMI\s*\}\}/gi,  sample.name || '___')
      .replace(/\{\{\s*STIR\s*\}\}/gi,             sample.stir)
      .replace(/\{\{\s*RAHBAR\s*\}\}/gi,           sample.directorName || '___')
      .replace(/\{\{\s*MANZIL\s*\}\}/gi,           sample.address || '___')
      .replace(/\{\{\s*SUMMA\s*\}\}/gi,            String(sample.amount ?? draft.defaultAmount ?? 0))
      .replace(/\{\{\s*SHARTNOMA_RAQAMI\s*\}\}/gi, sample.contractNumber || draft.startNumber || '001')
      .replace(/\{\{\s*SANA\s*\}\}/gi,             new Date().toISOString().split('T')[0])
      .replace(/\{\{\s*MAHSULOT\s*\}\}/gi,         sample.productName || draft.defaultProductName || '___')
  }

  return (
    <div className="space-y-5">
      {/* Raqamlash */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Hash size={16} className="text-[#2563EB]" />
          <h3 className="font-bold text-[#0F172A] text-sm">{t('step3NumberingTitle')}</h3>
        </div>

        <div className="space-y-2 mb-4">
          {[
            { value: 'sequential', label: t('step3NumberingSequential'), desc: t('step3NumberingSequentialDesc') },
            { value: 'manual',     label: t('step3NumberingManual'),     desc: t('step3NumberingManualDesc') },
          ].map(opt => (
            <label
              key={opt.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                draft.numberingMode === opt.value
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
              )}
            >
              <input
                type="radio"
                name="numberingMode"
                checked={draft.numberingMode === opt.value}
                onChange={() => onChange({ numberingMode: opt.value as any })}
                className="mt-1 accent-[#2563EB]"
              />
              <div>
                <p className="text-sm font-medium text-[#0F172A]">{opt.label}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {draft.numberingMode === 'sequential' && (
          <Input
            label={t('step3StartNumber')}
            placeholder={t('step3StartNumberPlace')}
            value={draft.startNumber || ''}
            onChange={e => onChange({ startNumber: e.target.value })}
            hint={t('step3StartNumberHint')}
          />
        )}
      </Card>

      {/* Hisobot */}
      <Card>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          {t('step3PreviewTitle')}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-[#F0F9FF] rounded-lg">
            <p className="text-xs text-[#1E40AF]">{t('step3PreviewCount', { count: items.length })}</p>
          </div>
          <div className="p-3 bg-[#F0FDF4] rounded-lg">
            <p className="text-xs text-[#15803D]">
              {t('step3PreviewTotal', { total: formatCurrency(total) })}
            </p>
          </div>
        </div>
      </Card>

      {/* Sample preview */}
      {samplePreview && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Eye size={14} className="text-[#94A3B8]" />
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
              {t('step3PreviewSample')}
            </p>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-sans text-[#475569] p-3 bg-[#F8FAFC] rounded max-h-64 overflow-y-auto">
            {samplePreview}
          </pre>
        </Card>
      )}
    </div>
  )
}
