'use client'

import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'

export function StepBar({ step }: { step: number }) {
  const t = useTranslations('contracts.stepBar')
  const STEPS = [t('step1'), t('step2'), t('step3')]
  return (
    <div className="flex items-center gap-0 mb-6">
      {STEPS.map((label, i) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex items-center gap-2">
            <div className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-all',
              step === i + 1 ? 'bg-[#2563EB] text-white' :
              step > i + 1  ? 'bg-[#2563EB]/20 text-[#2563EB]' :
                              'bg-[#F1F5F9] text-[#94A3B8]'
            )}>
              {step > i + 1
                ? <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                : i + 1}
            </div>
            <span className={cn(
              'text-xs font-medium',
              step === i + 1 ? 'text-[#0F172A]' :
              step > i + 1  ? 'text-[#2563EB]' : 'text-[#94A3B8]'
            )}>{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={cn('flex-1 h-px mx-3', step > i + 1 ? 'bg-[#2563EB]/30' : 'bg-[#E2E8F0]')} />
          )}
        </div>
      ))}
    </div>
  )
}
