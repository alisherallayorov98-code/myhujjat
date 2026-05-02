// MyHujjat.uz — Til konfiguratsiyasi

export const LOCALES = ['uz', 'oz', 'ru'] as const
export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'uz'

export const LOCALE_META: Record<Locale, {
  name:     string   // tilning o'z nomi
  english:  string   // english label (admin uchun)
  short:    string   // toggle uchun qisqa belgi
  html:     string   // <html lang="...">
  flag:     string   // emoji
}> = {
  uz: { name: "O'zbekcha", english: 'Uzbek (Latin)',   short: "O'z", html: 'uz',      flag: '🇺🇿' },
  oz: { name: 'Ўзбекча',   english: 'Uzbek (Cyrillic)', short: 'Ўз',  html: 'uz-Cyrl', flag: '🇺🇿' },
  ru: { name: 'Русский',   english: 'Russian',          short: 'Ru',  html: 'ru',      flag: '🇷🇺' },
}

export const LOCALE_COOKIE = 'NEXT_LOCALE'
