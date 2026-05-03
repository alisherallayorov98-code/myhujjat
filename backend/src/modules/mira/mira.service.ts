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
   * Atomic: race-condition'siz (transaction).
   */
  async generateContractNumber(userId: string): Promise<string> {
    return this.prisma.$transaction(async (tx) => {
      const settings = await tx.miraSettings.findUnique({ where: { userId } })
      if (!settings) {
        // Sozlama yo'q bo'lsa — oddiy sana
        const d = new Date()
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`
      }

      const today = new Date()
      const dd    = pad(today.getDate())
      const mm    = pad(today.getMonth() + 1)
      const dateStr = `${dd}/${mm}`

      let result = ''

      switch (settings.numberingScheme) {
        case 'date': {
          // Faqat sana — har kun yangi
          result = dateStr
          break
        }

        case 'date-seq': {
          // 03/05, 03/05-1, 03/05-2 ...
          const last = settings.lastDateNumber || ''
          const lastDate = last.split('-')[0]
          if (lastDate === dateStr) {
            const seq = parseInt(last.split('-')[1] || '0', 10) || 0
            result = `${dateStr}-${seq + 1}`
          } else {
            result = dateStr
          }
          break
        }

        case 'counter': {
          // Hisoblagich (DV-001, DV-002 ...)
          const next = settings.lastCounter + 1
          const padded = String(next).padStart(3, '0')
          result = settings.customPrefix
            ? `${settings.customPrefix}-${padded}`
            : padded
          break
        }

        case 'ask-each':
        default:
          throw new Error('NUMBERING_ASK_REQUIRED')
      }

      // Hisoblagichlarni yangilash
      await tx.miraSettings.update({
        where: { userId },
        data: {
          lastDateNumber: settings.numberingScheme === 'date-seq' ? result : settings.lastDateNumber,
          lastCounter:    settings.numberingScheme === 'counter'  ? settings.lastCounter + 1 : settings.lastCounter,
        },
      })

      return result
    })
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
