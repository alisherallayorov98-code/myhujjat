import { Injectable, Logger } from '@nestjs/common'
import * as crypto from 'crypto'

/**
 * AES-256-GCM shifrlash xizmati.
 *
 * Foydalanish:
 *   const enc = crypto.encrypt(plainText)        // saqlash uchun
 *   const dec = crypto.decrypt(encryptedString)  // ishlatish uchun
 *
 * Plain text formati: "iv:authTag:cipherText" (har biri base64)
 *
 * .env'da ENCRYPTION_KEY (32 bytes hex = 64 belgi) bo'lishi shart.
 * Yo'q bo'lsa derived key ishlatadi (production'da xavfli).
 */
@Injectable()
export class CryptoService {
  private readonly logger = new Logger(CryptoService.name)
  private readonly key:    Buffer
  private readonly ALGO    = 'aes-256-gcm'

  constructor() {
    const envKey = process.env.ENCRYPTION_KEY
    if (envKey && /^[0-9a-fA-F]{64}$/.test(envKey)) {
      this.key = Buffer.from(envKey, 'hex')
    } else if (envKey) {
      // 32 byte'ga to'liq emas — SHA-256 bilan derive qilamiz
      this.key = crypto.createHash('sha256').update(envKey).digest()
      this.logger.warn('ENCRYPTION_KEY hex emas — derived. Production uchun 64-belgi hex tavsiya etiladi')
    } else {
      // Production'da bu xato bo'lishi kerak
      const fallback = process.env.JWT_SECRET || 'myhujjat-default-key-CHANGE-IN-PRODUCTION'
      this.key = crypto.createHash('sha256').update(fallback).digest()
      if (process.env.NODE_ENV === 'production') {
        this.logger.error('XAVF: ENCRYPTION_KEY sozlanmagan — ma\'lumotlar zaif shifrlangan!')
      }
    }
  }

  /**
   * Shifrlash. Natija: "iv:authTag:cipher" (base64)
   */
  encrypt(plainText: string): string {
    if (!plainText) return ''
    try {
      const iv     = crypto.randomBytes(12) // GCM uchun 12 bytes
      const cipher = crypto.createCipheriv(this.ALGO, this.key, iv)
      const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final(),
      ])
      const authTag = cipher.getAuthTag()
      return [
        iv.toString('base64'),
        authTag.toString('base64'),
        encrypted.toString('base64'),
      ].join(':')
    } catch (err: any) {
      this.logger.error(`Encrypt xato: ${err?.message}`)
      throw err
    }
  }

  /**
   * Shifrdan chiqarish. Eski plain text qaytadi.
   */
  decrypt(encryptedString: string): string {
    if (!encryptedString) return ''
    try {
      const [ivB64, tagB64, dataB64] = encryptedString.split(':')
      if (!ivB64 || !tagB64 || !dataB64) {
        // Eski plain text bo'lishi mumkin (migration paytida)
        return encryptedString
      }
      const iv      = Buffer.from(ivB64,   'base64')
      const authTag = Buffer.from(tagB64,  'base64')
      const data    = Buffer.from(dataB64, 'base64')

      const decipher = crypto.createDecipheriv(this.ALGO, this.key, iv)
      decipher.setAuthTag(authTag)

      const decrypted = Buffer.concat([
        decipher.update(data),
        decipher.final(),
      ])
      return decrypted.toString('utf8')
    } catch (err: any) {
      this.logger.warn(`Decrypt xato: ${err?.message}`)
      // Plain text deb hisoblaymiz (eski data)
      return encryptedString
    }
  }

  /**
   * Maxfiy hash (parol emas — token'lar uchun).
   * Bir tarafga, qaytib bo'lmaydi.
   */
  hash(input: string): string {
    return crypto.createHash('sha256').update(input).digest('hex')
  }

  /**
   * Tasodifiy token (URL-safe).
   */
  randomToken(bytes: number = 32): string {
    return crypto.randomBytes(bytes).toString('base64url')
  }
}
