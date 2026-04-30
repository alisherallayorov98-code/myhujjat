'use client'

import { useState, useEffect } from 'react'
import { Globe, ChevronDown }  from 'lucide-react'
import { cn }                  from '@/lib/cn'

type Locale = 'uz' | 'oz' | 'ru'

const LABELS: Record<Locale, string> = {
  uz: "O'z",
  oz: 'Ўз',
  ru: 'Ru',
}

const FULL_LABELS: Record<Locale, string> = {
  uz: "O'zbekcha (lotin)",
  oz: 'Ўзбекча (кирилл)',
  ru: 'Русский',
}

const LOCALES: Locale[] = ['uz', 'oz', 'ru']

function getLocale(): Locale {
  if (typeof document === 'undefined') return 'uz'
  const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/)
  const val = match?.[1] as Locale
  return LOCALES.includes(val) ? val : 'uz'
}

export function LocaleToggle() {
  const [locale, setLocaleState] = useState<Locale>('uz')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setLocaleState(getLocale())
  }, [])

  const setLocale = (next: Locale) => {
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; SameSite=Lax`
    setLocaleState(next)
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors text-sm font-medium text-[#475569]"
        title="Til tanlash"
      >
        <Globe size={14} className="text-[#2563EB]" />
        <span>{LABELS[locale]}</span>
        <ChevronDown size={12} className="text-[#94A3B8]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 overflow-hidden animate-scale-in">
            <div className="p-1.5 space-y-0.5">
              {LOCALES.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    locale === loc
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                      : 'text-[#475569] hover:bg-[#F1F5F9]'
                  )}
                >
                  <span className="w-6 text-center font-bold">{LABELS[loc]}</span>
                  <span>{FULL_LABELS[loc]}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
