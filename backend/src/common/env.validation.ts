import { Logger } from '@nestjs/common'

const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'ENCRYPTION_KEY',
] as const

const RECOMMENDED_ENV_VARS = [
  'GEMINI_API_KEY',       // Mira voice AI
  'ANTHROPIC_API_KEY',    // AI hujjat generatsiyasi (Pro)
  'RESEND_API_KEY',       // Email yuborish
  'VAPID_PUBLIC_KEY',     // Web push
  'VAPID_PRIVATE_KEY',
  'SOLIQ_API_KEY',        // STIR ma'lumotlari
  'SOLIQ_API_URL',
  'DIDOX_API_URL',        // Faktura sinxronlash
  'DIDOX_WEBHOOK_SECRET',
  'CLICK_SERVICE_ID',     // To'lov
  'CLICK_MERCHANT_ID',
  'CLICK_SECRET_KEY',
  'PAYME_MERCHANT_ID',
  'PAYME_SECRET_KEY',
  'FRONTEND_URL',
] as const

/**
 * Application bootstrap'da chaqiriladi. Majburiy env'lar yo'q bo'lsa
 * darhol throw qiladi (server boshlanmaydi). Tavsiya qilingan env'lar
 * yo'q bo'lsa warn — server ishlaydi, lekin ba'zi funksiyalar nogiron.
 */
export function validateEnv() {
  const logger = new Logger('EnvValidation')

  const missing: string[] = []
  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) missing.push(key)
  }
  if (missing.length > 0) {
    throw new Error(
      `Majburiy environment variable'lar yo'q: ${missing.join(', ')}\n` +
      `Iltimos .env faylda ushbu o'zgaruvchilarni o'rnating.`
    )
  }

  // Maxsus tekshiruv: ENCRYPTION_KEY 64 hex char (32 byte) bo'lishi kerak
  if (!/^[0-9a-f]{64}$/i.test(process.env.ENCRYPTION_KEY!)) {
    throw new Error(
      `ENCRYPTION_KEY 64 hex belgidan iborat bo'lishi kerak (32 byte). ` +
      `Generatsiya: openssl rand -hex 32`
    )
  }
  if (process.env.JWT_SECRET!.length < 32) {
    throw new Error('JWT_SECRET kamida 32 belgi bo\'lishi kerak')
  }

  // Tavsiya etilgan env'lar
  const missingRecommended: string[] = []
  for (const key of RECOMMENDED_ENV_VARS) {
    if (!process.env[key]) missingRecommended.push(key)
  }
  if (missingRecommended.length > 0) {
    logger.warn(
      `Tavsiya qilingan env'lar yo'q (ba'zi funksiyalar ishlamaydi): ` +
      missingRecommended.join(', ')
    )
  }
}
