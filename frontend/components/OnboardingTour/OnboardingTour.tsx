'use client'

import { useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

const TOUR_DONE_KEY = 'onboarding_tour_done'

/**
 * Yangi foydalanuvchi uchun interaktiv tour.
 * Faqat birinchi marta dashboard'ga kirilganda ishga tushadi.
 */
export function OnboardingTour() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user || typeof window === 'undefined') return
    if (localStorage.getItem(TOUR_DONE_KEY)) return

    // 1.5 sek kutib boshlaymiz (sahifa to'liq yuklansin)
    const timer = setTimeout(async () => {
      try {
        const driverMod = await import('driver.js')
        const driver: any = (driverMod as any).driver || (driverMod as any).default?.driver || (driverMod as any).default
        if (typeof driver !== 'function') return  // Modul yuklanmadi
        // CSS'ni CDN orqali yuklash (build-time muammolarga moslash)
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
          nextBtnText:     'Keyingi →',
          prevBtnText:     '← Orqaga',
          doneBtnText:     'Tayyor',
          showButtons:     ['next', 'previous', 'close'],
          allowClose:      true,
          overlayColor:    'rgba(0, 0, 0, 0.6)',
          steps: [
            {
              popover: {
                title:       "Salom! 👋",
                description: "MyHujjat.uz ga xush kelibsiz! 1 daqiqada saytni qanday ishlatishni ko'rsatib o'taman.",
                side:        'top',
                align:       'center',
              },
            },
            {
              element: '[href="/dashboard/tashkilotlar"]',
              popover: {
                title:       "1. Tashkilot qo'shing",
                description: "Avval o'z tashkilotingizni qo'shing. STIR (9 raqam) yozsangiz Soliq APIdan ma'lumotlar avtomatik to'ldiriladi.",
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[href="/dashboard/kontragentlar"]',
              popover: {
                title:       '2. Kontragentlar',
                description: "Hamkorlar (mijozlar/yetkazib beruvchilar) ro'yxati. Shu yerda STIR orqali avtomatik to'ldirish ham bor.",
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[href="/dashboard/shartnomalar"]',
              popover: {
                title:       '3. Shartnomalar',
                description: "Bu yerdan yangi shartnoma yaratish, ro'yxatni ko'rish, Excel'ga eksport qilish mumkin.",
                side:        'right',
                align:       'start',
              },
            },
            {
              element: '[aria-label="Mira — ovozli yordamchi"]',
              popover: {
                title:       "✨ Mira AI yordamchi",
                description: "Pastdan sehrli tugma — ovozli AI yordamchi. \"Bu oy nechta shartnoma yaratilgan?\" deb so'rasangiz, javob beradi yoki amal bajaradi!",
                side:        'top',
                align:       'start',
              },
            },
            {
              element: '[aria-label="Bildirishnomalar"]',
              popover: {
                title:       'Bildirishnomalar',
                description: "Yangi shartnoma yaratilganda, faktura kelganda yoki shartnoma summasidan oshib ketganda — shu yerda xabarlar.",
                side:        'bottom',
                align:       'end',
              },
            },
            {
              popover: {
                title:       "Hammasi tayyor! 🎉",
                description: "Endi siz boshlaysiz. Savol bo'lsa o'ng pastdagi chat orqali yozing. Yaxshi ish!",
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
  }, [user])

  return null
}

// Manual qayta tour ochish uchun
export function startOnboardingTour() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOUR_DONE_KEY)
  window.location.reload()
}
