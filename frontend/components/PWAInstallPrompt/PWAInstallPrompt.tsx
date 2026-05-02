'use client'

import { useState, useEffect } from 'react'
import { useTranslations }      from 'next-intl'
import { Download, X, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY     = 'pwa_install_dismissed'
const SHOW_AFTER_DAYS = 7

export function PWAInstallPrompt() {
  const t = useTranslations('pwaPrompt')
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) {
      return
    }

    const dismissedAt = localStorage.getItem(DISMISS_KEY)
    if (dismissedAt) {
      const days = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24)
      if (days < SHOW_AFTER_DAYS) return
    }

    function handler(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShow(true), 5000)
    }

    window.addEventListener('beforeinstallprompt', handler as any)
    return () => window.removeEventListener('beforeinstallprompt', handler as any)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        setShow(false)
      }
    } catch (err) {
      console.error('Install error:', err)
    }
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setShow(false)
  }

  if (!show || !deferredPrompt) return null

  return (
    <div className="fixed inset-x-4 bottom-4 md:inset-auto md:bottom-6 md:left-6 md:max-w-sm z-50 bg-white border border-[#E2E8F0] rounded-2xl shadow-2xl p-4 animate-scale-in">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
          <Smartphone size={20} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-[#0F172A] text-sm">{t('title')}</p>
          <p className="text-xs text-[#475569] mt-1 leading-relaxed">
            {t('description')}
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={handleInstall}
            >
              {t('install')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              {t('later')}
            </Button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded text-[#94A3B8] hover:text-[#475569] shrink-0"
          aria-label={t('close')}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
