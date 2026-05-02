'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Cookie, X } from 'lucide-react'

const STORAGE_KEY = 'cookie_consent'

export function CookieConsent() {
  const t = useTranslations('cookieConsent')
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const consent = localStorage.getItem(STORAGE_KEY)
    if (!consent) {
      const t = setTimeout(() => setShow(true), 1000)
      return () => clearTimeout(t)
    }
  }, [])

  function accept() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accepted: true,
      date:     new Date().toISOString(),
      version:  '1.0',
    }))
    setShow(false)
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      accepted: false,
      date:     new Date().toISOString(),
      version:  '1.0',
    }))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6 bg-gradient-to-t from-black/20 to-transparent pointer-events-none">
      <div className="max-w-3xl mx-auto bg-white border border-[#E2E8F0] rounded-2xl shadow-xl p-4 sm:p-5 pointer-events-auto animate-scale-in">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <Cookie size={18} className="text-[#D97706]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[#0F172A] mb-1">
              {t('title')}
            </p>
            <p className="text-xs text-[#475569] leading-relaxed">
              {t('description')}{' '}
              <Link href="/privacy" className="text-[#2563EB] hover:underline whitespace-nowrap">
                {t('learnMore')}
              </Link>
            </p>

            <div className="flex flex-wrap gap-2 mt-3">
              <button
                onClick={accept}
                className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                {t('accept')}
              </button>
              <button
                onClick={decline}
                className="bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] px-4 py-1.5 rounded-lg text-xs font-semibold transition"
              >
                {t('decline')}
              </button>
            </div>
          </div>
          <button
            onClick={decline}
            className="p-1 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] shrink-0"
            aria-label={t('close')}
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
