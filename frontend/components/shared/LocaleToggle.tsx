'use client'

import { useState, useEffect } from 'react'
import { useLocale }            from 'next-intl'
import { Globe, ChevronDown }   from 'lucide-react'
import { cn }                   from '@/lib/cn'
import { LOCALES, LOCALE_META, LOCALE_COOKIE, type Locale } from '@/i18n/config'

export function LocaleToggle() {
  const currentLocale = useLocale() as Locale
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const setLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`
    setOpen(false)
    // Sahifani qayta yuklash — server component'lar yangi til bilan render bo'lishi uchun
    window.location.reload()
  }

  if (!mounted) {
    return <div className="w-[60px] h-9" />  // SSR/hydration uchun bo'sh joy
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 h-9 px-2.5 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors text-sm font-medium text-[#475569]"
        title={LOCALE_META[currentLocale].name}
        aria-label="Til tanlash"
      >
        <Globe size={14} className="text-[#2563EB]" />
        <span>{LOCALE_META[currentLocale].short}</span>
        <ChevronDown size={12} className="text-[#94A3B8]" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-48 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 overflow-hidden animate-scale-in">
            <div className="p-1.5 space-y-0.5">
              {LOCALES.map(loc => (
                <button
                  key={loc}
                  onClick={() => setLocale(loc)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors text-left',
                    currentLocale === loc
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                      : 'text-[#475569] hover:bg-[#F1F5F9]'
                  )}
                >
                  <span className="w-7 text-center font-bold">{LOCALE_META[loc].short}</span>
                  <span className="flex-1">{LOCALE_META[loc].name}</span>
                  {currentLocale === loc && (
                    <span className="text-[#2563EB]">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
