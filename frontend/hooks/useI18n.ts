'use client'

import { useTranslations, useLocale } from 'next-intl'
import { locales, type Locale }       from '@/i18n'

export function useI18n() {
  const locale = useLocale() as Locale

  return {
    locale,
    locales,
    nav:          useTranslations('nav'),
    common:       useTranslations('common'),
    auth:         useTranslations('auth'),
    dashboard:    useTranslations('dashboard'),
    contracts:    useTranslations('contracts'),
    subscription: useTranslations('subscription'),
    errors:       useTranslations('errors'),
  }
}
