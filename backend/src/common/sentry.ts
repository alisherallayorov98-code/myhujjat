/**
 * Sentry error tracking — production'da xato kuzatuvi.
 *
 * SENTRY_DSN env yo'q bo'lsa — no-op (development).
 * O'rnatish: cd backend && npm install @sentry/node@^8
 *
 * Sentry'da yangi project yaratib DSN'ni .env'ga qo'shing:
 *   SENTRY_DSN=https://xxx@yyy.ingest.sentry.io/zzz
 */

import { Logger } from '@nestjs/common'

let sentryInitialized = false
let SentryModule: any = null

// Foydalanuvchining password/token kabi maxfiy maydonlari
const SENSITIVE_FIELDS = [
  'password', 'passwordHash', 'token', 'jwtToken', 'apiKey',
  'didoxApiKey', 'didoxUserKey', 'twoFactorSecret', 'verifyToken',
  'resetToken', 'sign_string', 'signature', 'authorization',
]

export async function initSentry(): Promise<void> {
  const dsn = process.env.SENTRY_DSN
  if (!dsn) {
    new Logger('Sentry').log('SENTRY_DSN yo\'q — error tracking o\'chirilgan')
    return
  }

  try {
    // Dinamik import — agar @sentry/node o'rnatilmagan bo'lsa, app crashlamaydi.
    // @ts-ignore — paket optional, npm install vaqtida o'rnatiladi
    SentryModule = await import('@sentry/node')

    SentryModule.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',

      // 10% foiz tracelarni yuborish (token tejaymiz)
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

      // Maxfiy ma'lumotlarni filtrlash
      beforeSend(event: any, hint: any) {
        return scrubSensitive(event)
      },

      beforeSendTransaction(event: any) {
        return scrubSensitive(event)
      },
    })

    sentryInitialized = true
    new Logger('Sentry').log('✓ Sentry init muvaffaqiyatli')
  } catch (err: any) {
    new Logger('Sentry').warn(`Sentry init xato: ${err?.message}`)
  }
}

/**
 * Sentry SDK to'g'ridan-to'g'ri kerak bo'lganda (Express middleware uchun)
 */
export function getSentry(): any {
  return sentryInitialized ? SentryModule : null
}

/**
 * Manual exception capture (custom error tracking)
 */
export function captureException(err: any, context?: Record<string, any>) {
  if (!sentryInitialized) return
  try {
    SentryModule.captureException(err, { extra: context })
  } catch {}
}

/**
 * User context — login bo'lganda chaqirish (kim xato olganini bilish uchun)
 */
export function setUserContext(user: { id: string; email?: string }) {
  if (!sentryInitialized) return
  try {
    SentryModule.setUser({ id: user.id, email: user.email })
  } catch {}
}

// ─── Helper: maxfiy maydonlarni '[REDACTED]'ga aylantirish ──────────
function scrubSensitive(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj

  if (Array.isArray(obj)) {
    return obj.map(scrubSensitive)
  }

  const scrubbed: any = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()
    if (SENSITIVE_FIELDS.some(f => lowerKey.includes(f.toLowerCase()))) {
      scrubbed[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      scrubbed[key] = scrubSensitive(value)
    } else {
      scrubbed[key] = value
    }
  }
  return scrubbed
}
