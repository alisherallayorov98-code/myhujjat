import { Injectable, NotFoundException, Logger } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type NumberingScheme = 'date' | 'date-seq' | 'counter' | 'ask-each'

export interface MiraSettingsDto {
  defaultContractType?:    string
  defaultAmount?:          number
  defaultCity?:            string
  defaultProductName?:     string
  defaultPaymentDays?:     number
  numberingScheme?:        NumberingScheme
  customPrefix?:           string
  autoSendEnabled?:        boolean
  autoSignEnabled?:        boolean
  confirmationThreshold?:  number
}

@Injectable()
export class MiraService {
  private readonly logger = new Logger(MiraService.name)

  constructor(private prisma: PrismaService) {}

  /**
   * Foydalanuvchining Mira sozlamalarini olish (yo'q bo'lsa default yaratadi).
   */
  async getOrCreate(userId: string, orgId: string) {
    let settings = await this.prisma.miraSettings.findUnique({
      where: { userId },
    })
    if (!settings) {
      settings = await this.prisma.miraSettings.create({
        data: { userId, organizationId: orgId },
      })
    }
    return settings
  }

  async update(userId: string, orgId: string, dto: MiraSettingsDto) {
    // Avval yaratilgan bo'lishi kerak
    await this.getOrCreate(userId, orgId)
    return this.prisma.miraSettings.update({
      where: { userId },
      data:  {
        ...(dto.defaultContractType   !== undefined && { defaultContractType:  dto.defaultContractType }),
        ...(dto.defaultAmount         !== undefined && { defaultAmount:        dto.defaultAmount }),
        ...(dto.defaultCity           !== undefined && { defaultCity:          dto.defaultCity }),
        ...(dto.defaultProductName    !== undefined && { defaultProductName:   dto.defaultProductName || null }),
        ...(dto.defaultPaymentDays    !== undefined && { defaultPaymentDays:   dto.defaultPaymentDays }),
        ...(dto.numberingScheme       !== undefined && { numberingScheme:      dto.numberingScheme }),
        ...(dto.customPrefix          !== undefined && { customPrefix:         dto.customPrefix || null }),
        ...(dto.autoSendEnabled       !== undefined && { autoSendEnabled:      dto.autoSendEnabled }),
        ...(dto.autoSignEnabled       !== undefined && { autoSignEnabled:      dto.autoSignEnabled }),
        ...(dto.confirmationThreshold !== undefined && { confirmationThreshold: dto.confirmationThreshold || null }),
      },
    })
  }

  /**
   * Mira muvaffaqiyatli shartnoma yaratganda hisoblagichni oshiradi.
   * 10 dan oshganda — UI'da "Avtomatik rejim" tugmasi paydo bo'ladi.
   */
  async incrementSuccessCount(userId: string) {
    return this.prisma.miraSettings.update({
      where: { userId },
      data:  {
        successCount: { increment: 1 },
        lastUsedAt:   new Date(),
      },
    })
  }

  /**
   * Sozlamalar bo'yicha keyingi shartnoma raqamini yaratadi.
   * Race-condition'siz: 'counter' uchun atomic increment, 'date-seq' uchun
   * Serializable isolation + retry. Parallel chaqiruvlar dublikat raqam
   * bermaydi.
   */
  async generateContractNumber(userId: string): Promise<string> {
    const settings = await this.prisma.miraSettings.findUnique({ where: { userId } })
    if (!settings) {
      const d = new Date()
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
    }

    const today = new Date()
    const dd    = pad(today.getDate())
    const mm    = pad(today.getMonth() + 1)
    const dateStr = `${dd}/${mm}`

    switch (settings.numberingScheme) {
      case 'date': {
        // Faqat sana — har kun yangi (race muhim emas)
        return dateStr
      }

      case 'counter': {
        // Atomic increment — Prisma'ning $inc operatori SQL UPDATE bilan
        // bir transaction'da ishlaydi, race-condition yo'q.
        const updated = await this.prisma.miraSettings.update({
          where: { userId },
          data:  { lastCounter: { increment: 1 } },
          select: { lastCounter: true, customPrefix: true },
        })
        const padded = String(updated.lastCounter).padStart(3, '0')
        return updated.customPrefix ? `${updated.customPrefix}-${padded}` : padded
      }

      case 'date-seq': {
        // Serializable transaction + retry — read+compute+write atomik
        // bo'lishi kerak (oldingi qiymatga bog'liq).
        return this.dateSeqWithRetry(userId, dateStr)
      }

      case 'ask-each':
      default:
        throw new Error('NUMBERING_ASK_REQUIRED')
    }
  }

  // 'date-seq' rejimida: 03/05 → 03/05-1 → 03/05-2 (oldingi qiymatga bog'liq)
  // Serializable + retry agar konflikt bo'lsa
  private async dateSeqWithRetry(userId: string, dateStr: string, attempts = 3): Promise<string> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          const s = await tx.miraSettings.findUnique({
            where:  { userId },
            select: { lastDateNumber: true },
          })
          const last     = s?.lastDateNumber || ''
          const lastDate = last.split('-')[0]
          let result: string
          if (lastDate === dateStr) {
            const seq = parseInt(last.split('-')[1] || '0', 10) || 0
            result = `${dateStr}-${seq + 1}`
          } else {
            result = dateStr
          }
          await tx.miraSettings.update({
            where: { userId },
            data:  { lastDateNumber: result },
          })
          return result
        }, { isolationLevel: 'Serializable' })
      } catch (err: any) {
        // P2034 = serialization failure (parallel transaction)
        if (err?.code === 'P2034' && i < attempts - 1) {
          await new Promise(r => setTimeout(r, 50 * (i + 1)))  // exponential backoff
          continue
        }
        throw err
      }
    }
    throw new Error('Raqam generatsiya qilib bo\'lmadi (parallel konflikt)')
  }

  /**
   * Tasdiqlash kerakmi? (xavfsizlik chegarasi)
   */
  needsConfirmation(settings: { autoSendEnabled: boolean; confirmationThreshold: any }, amount: number): boolean {
    if (!settings.autoSendEnabled) return true
    const threshold = settings.confirmationThreshold ? Number(settings.confirmationThreshold) : null
    if (threshold && amount > threshold) return true
    return false
  }
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
