import { getRequestConfig } from 'next-intl/server'
import { cookies }          from 'next/headers'

export const locales = ['uz', 'oz', 'ru'] as const
export type Locale   = (typeof locales)[number]

export const defaultLocale: Locale = 'uz'

export function isValidLocale(locale: string): locale is Locale {
  return (locales as readonly string[]).includes(locale)
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested    = await requestLocale
  const cookieStore  = await cookies()
  const fromCookie   = cookieStore.get('NEXT_LOCALE')?.value ?? ''
  const raw          = requested ?? fromCookie ?? defaultLocale
  const locale       = isValidLocale(raw) ? (raw as Locale) : defaultLocale

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  }
})
