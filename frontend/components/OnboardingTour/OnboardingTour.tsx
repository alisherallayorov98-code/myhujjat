'use client'

import { useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'

const TOUR_DONE_KEY = 'onboarding_tour_done'

export function OnboardingTour() {
  const t = useTranslations('onboardingTour')
  const { user } = useAuth()

  useEffect(() => {
    if (!user || typeof window === 'undefined') return
    if (localStorage.getItem(TOUR_DONE_KEY)) return

    const timer = setTimeout(async () => {
      try {
        const driverMod = await import('driver.js')
        const driver: any = (driverMod as any).driver || (driverMod as any).default?.driver || (driverMod as any).default
        if (typeof driver !== 'function') return
        if (!document.querySelector('link[data-driver-css]')) {
          const link = document.createElement('link')
          link.rel  = 'stylesheet'
          link.href = 'https://cdn.jsdelivr.net/npm/driver.js@1.3.6/dist/driver.css'
          link.setAttribute('data-driver-css', '1')
          document.head.appendChild(link)
        }

        const d = driver({
          showProgress:    true,
          progressText:    '{{current}} / {{total}}',
          nextBtnText:     t('nextBtn'),
          prevBtnText:     t('prevBtn'),
          doneBtnText:     t('doneBtn'),
          showButtons:     ['next', 'previous', 'close'],
          allowClose:      true,
          overlayColor:    'rgba(0, 0, 0, 0.6)',
          steps: [
            {
              popover: {
                title:       t('step1Title'),
                description: t('step1Desc'),
                side:        'top',
                align:       'center',
              },
            },
            {
              element: '[href="/dashboard/tashkilotlar"]',
              popover: {
                title:       t('step2Title'),
                description: t('step2Desc'),
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[href="/dashboard/kontragentlar"]',
              popover: {
                title:       t('step3Title'),
                description: t('step3Desc'),
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[href="/dashboard/shartnomalar"]',
              popover: {
                title:       t('step4Title'),
                description: t('step4Desc'),
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[aria-label="Mira — ovozli yordamchi"]',
              popover: {
                title:       t('step5Title'),
                description: t('step5Desc'),
                side:        'top',
                align:       'start',
              },
            },
            {
              element: '[aria-label="Bildirishnomalar"]',
              popover: {
                title:       t('step6Title'),
                description: t('step6Desc'),
                side:        'bottom',
                align:       'end',
              },
            },
            {
              popover: {
                title:       t('step7Title'),
                description: t('step7Desc'),
                side:        'top',
                align:       'center',
              },
            },
          ],
          onDestroyed: () => {
            localStorage.setItem(TOUR_DONE_KEY, '1')
          },
        })

        d.drive()
      } catch (err) {
        console.warn('Tour error:', err)
      }
    }, 1500)

    return () => clearTimeout(timer)
  }, [user, t])

  return null
}

export function startOnboardingTour() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOUR_DONE_KEY)
  window.location.reload()
}
