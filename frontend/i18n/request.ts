// next-intl: server-side request konfiguratsiyasi
// Cookie'dan tilni o'qiydi va messages/{locale}/ ichidagi BARCHA namespace fayllarni yuklaydi.
// Yangi namespace qo'shish: messages/uz/X.json + oz/X.json + ru/X.json — avtomatik tarzda yig'iladi.

import { getRequestConfig } from 'next-intl/server'
import { cookies }          from 'next/headers'
import fs                   from 'node:fs'
import path                 from 'node:path'
import { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './config'

const MESSAGES_DIR = path.join(process.cwd(), 'messages')

/** Berilgan locale uchun barcha namespace JSON'larni yuklab birlashtiradi. */
async function loadAllMessages(locale: Locale): Promise<Record<string, any>> {
  const dir = path.join(MESSAGES_DIR, locale)
  const merged: Record<string, any> = {}

  let files: string[] = []
  try {
    files = fs.readdirSync(dir).filter(f => f.endsWith('.json'))
  } catch {
    return merged
  }

  for (const file of files) {
    const namespace = file.replace(/\.json$/, '')
    const data = (await import(`../messages/${locale}/${file}`)).default
    merged[namespace] = data
  }

  return merged
}

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined

  const locale: Locale = (cookieValue && LOCALES.includes(cookieValue))
    ? cookieValue
    : DEFAULT_LOCALE

  const messages = await loadAllMessages(locale)
  return { locale, messages }
})
