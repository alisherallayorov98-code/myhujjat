import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CryptoService } from '../../common/services/crypto.service'

const DIDOX_API_BASE = process.env.DIDOX_API_URL || 'https://api.didox.uz'

export interface DidoxInvoice {
  id:             string  // Didox unique ID
  number?:        string
  date?:          string  // YYYY-MM-DD
  contractNumber?: string
  contractDate?:   string
  sellerInn:      string
  sellerName?:    string
  buyerInn:       string
  buyerName?:     string
  amount:         number
  vatAmount:      number
  totalAmount:    number
  status:         string
  raw?:           any
}

/**
 * Didox API bilan ulanish servisi.
 * Hozir stub — kalit kelganda real chaqiruvlarga o'tkaziladi.
 */
@Injectable()
export class DidoxService {
  private readonly logger = new Logger(DidoxService.name)

  constructor(
    private prisma: PrismaService,
    private crypto: CryptoService,
  ) {}

  // ─── Foydalanuvchi tokenlarini saqlash ─────────────────────
  async connectUser(userId: string, dto: { apiKey: string; userKey: string }) {
    if (!dto.apiKey || !dto.userKey) {
      throw new BadRequestException('Ikkala kalit ham kerak: api-key va user-key')
    }
    // Token to'g'riligini Didox API orqali tekshirish (majburiy)
    const result = await this.verifyTokens(dto.apiKey, dto.userKey)
    if (!result.ok) {
      throw new BadRequestException(result.reason || "Kalitlar tekshirib bo'lmadi")
    }
    return this.prisma.user.update({
      where: { id: userId },
      data:  {
        didoxApiKey:    this.crypto.encrypt(dto.apiKey),    // shifrlab saqlash
        didoxUserKey:   this.crypto.encrypt(dto.userKey),
        didoxConnected: true,
        didoxSyncError: null,
      },
    })
  }

  async disconnectUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data:  {
        didoxApiKey:    null,
        didoxUserKey:   null,
        didoxConnected: false,
        didoxLastSync:  null,
      },
    })
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: {
        didoxConnected: true,
        didoxLastSync:  true,
        didoxSyncError: true,
      },
    })
    return {
      connected: !!user?.didoxConnected,
      lastSync:  user?.didoxLastSync,
      error:     user?.didoxSyncError,
    }
  }

  // ─── Token tekshirish ─────────────────────────────────────
  // Didox API'ga real chaqiruv qiladi — yaroqsiz kalit qabul qilinmaydi
  private async verifyTokens(apiKey: string, userKey: string): Promise<{ ok: boolean; reason?: string }> {
    // Asosiy formatlar tekshiruvi (oddiy xatolardan oldindan ogohlantirish)
    if (apiKey.length < 10 || userKey.length < 10) {
      return { ok: false, reason: "Kalit juda qisqa — Didox kalitlari kamida 10 ta belgidan iborat" }
    }

    // Real Didox API'ga so'rov
    const controller = new AbortController()
    const timeout    = setTimeout(() => controller.abort(), 10_000)

    try {
      const res = await fetch(`${DIDOX_API_BASE}/v1/me`, {
        headers: this.headers(apiKey, userKey),
        signal:  controller.signal,
      })
      clearTimeout(timeout)

      if (res.ok) return { ok: true }
      if (res.status === 401 || res.status === 403) {
        return { ok: false, reason: "Kalitlar noto'g'ri (Didox tomonidan rad etildi)" }
      }
      if (res.status === 404) {
        return { ok: false, reason: "Didox API endpointi topilmadi — administratorga murojaat qiling" }
      }
      return { ok: false, reason: `Didox javobi: ${res.status}` }
    } catch (err: any) {
      clearTimeout(timeout)
      if (err?.name === 'AbortError') {
        return { ok: false, reason: "Didox javob bermadi (10 soniya kutdik) — keyinroq urinib ko'ring" }
      }
      this.logger.warn(`Token tekshirishda xato: ${err?.message}`)
      return { ok: false, reason: `Tarmoq xatosi: ${err?.message || 'noma\'lum'}` }
    }
  }

  // ─── Fakturalarni olish ───────────────────────────────────
  /**
   * Foydalanuvchi tashkiloti uchun fakturalarni Didox'dan oladi.
   * Real Didox API'ga ulanishi yoki stub'da bo'sh array qaytarishi mumkin.
   */
  async fetchInvoices(userId: string, opts: {
    fromDate?: string  // YYYY-MM-DD
    toDate?:   string
    direction?: 'incoming' | 'outgoing'
  } = {}): Promise<DidoxInvoice[]> {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { didoxApiKey: true, didoxUserKey: true, didoxConnected: true },
    })
    if (!user?.didoxConnected || !user.didoxApiKey || !user.didoxUserKey) {
      throw new BadRequestException("Didox hisobingiz ulanmagan")
    }

    if (!process.env.DIDOX_API_URL) {
      this.logger.warn('Didox API real chaqiruvi sozlanmagan')
      return []
    }

    // Shifrdan chiqarish
    const apiKey  = this.crypto.decrypt(user.didoxApiKey)
    const userKey = this.crypto.decrypt(user.didoxUserKey)

    try {
      const params = new URLSearchParams({
        ...(opts.fromDate  && { from: opts.fromDate }),
        ...(opts.toDate    && { to:   opts.toDate }),
        ...(opts.direction && { direction: opts.direction }),
      })
      const res = await fetch(`${DIDOX_API_BASE}/v1/documents?${params}`, {
        headers: this.headers(apiKey, userKey),
      })
      if (!res.ok) throw new Error(`Didox: ${res.status}`)
      const data = await res.json() as any[]
      return data.map(d => this.normalizeInvoice(d))
    } catch (err: any) {
      this.logger.error(`Didox fetch xato: ${err?.message}`)
      await this.prisma.user.update({
        where: { id: userId },
        data:  { didoxSyncError: err?.message?.slice(0, 200) },
      })
      throw err
    }
  }

  // ─── Didox response'ni bizning formatga normalize ──────────
  private normalizeInvoice(d: any): DidoxInvoice {
    return {
      id:             String(d.id || d.documentId),
      number:         d.number || d.docNumber,
      date:           d.date   || d.docDate,
      contractNumber: d.contractNumber || d.contract?.number,
      contractDate:   d.contractDate   || d.contract?.date,
      sellerInn:      String(d.seller?.tin || d.sellerInn || ''),
      sellerName:     d.seller?.name || d.sellerName,
      buyerInn:       String(d.buyer?.tin || d.buyerInn || ''),
      buyerName:      d.buyer?.name || d.buyerName,
      amount:         Number(d.amount || d.totalWithoutVat || 0),
      vatAmount:      Number(d.vatAmount || d.vat || 0),
      totalAmount:    Number(d.total || d.totalWithVat || (Number(d.amount || 0) + Number(d.vatAmount || 0))),
      status:         d.status || 'ACCEPTED',
      raw:            d,
    }
  }

  // ─── HTTP headers ────────────────────────────────────────
  private headers(apiKey: string, userKey: string): Record<string, string> {
    return {
      'api-key':  apiKey,
      'user-key': userKey,
      'Accept':   'application/json',
    }
  }
}
