import {
  Injectable, Logger, BadRequestException, NotFoundException, ForbiddenException,
} from '@nestjs/common'
import { PrismaService }       from '../prisma/prisma.service'
import { ContractsService }    from '../contracts/contracts.service'
import { CounterpartiesService } from '../counterparties/cp.service'
import { SubscriptionService } from '../subscriptions/subscription.service'
import { AuditService }        from '../audit/audit.service'

const MAX_BULK = 50

export interface BulkItem {
  stir:           string
  name?:          string
  directorName?:  string
  address?:       string
  bankName?:      string
  bankAccount?:   string
  mfo?:           string
  contractNumber?: string
  amount?:        number
  productName?:   string
  status?:        'pending' | 'fetching' | 'ready' | 'error' | 'created' | 'signed' | 'sent'
  errorMessage?:  string
  contractId?:    string  // execute'dan keyin to'ladi
}

export interface UpdateDraftDto {
  currentStep?:        number
  templateId?:         string | null
  customContent?:      string | null
  contractType?:       string
  defaultAmount?:      number
  defaultProductName?: string | null
  city?:               string
  numberingMode?:      'manual' | 'sequential'
  startNumber?:        string | null
  items?:              BulkItem[]
}

@Injectable()
export class BulkSendService {
  private readonly logger = new Logger(BulkSendService.name)

  constructor(
    private prisma:    PrismaService,
    private contracts: ContractsService,
    private cps:       CounterpartiesService,
    private subs:      SubscriptionService,
    private audit:     AuditService,
  ) {}

  // ─── Pro tarifda ekanini tekshirish ─────────────────────────
  private async assertPro(userId: string) {
    const sub = await this.subs.getCurrent(userId)
    if (!sub || sub.plan !== 'PRO') {
      throw new ForbiddenException('Ommaviy yuborish faqat PRO tarifda')
    }
  }

  // ─── Mavjud yoki yangi draft ───────────────────────────────
  async getOrCreateDraft(userId: string, orgId: string) {
    await this.assertPro(userId)

    let draft = await this.prisma.bulkSendDraft.findFirst({
      where: { userId, organizationId: orgId, status: 'draft' },
      orderBy: { updatedAt: 'desc' },
    })
    if (!draft) {
      draft = await this.prisma.bulkSendDraft.create({
        data: { userId, organizationId: orgId },
      })
    }
    return draft
  }

  async getDraft(userId: string, draftId: string) {
    const draft = await this.prisma.bulkSendDraft.findUnique({ where: { id: draftId } })
    if (!draft) throw new NotFoundException('Draft topilmadi')
    if (draft.userId !== userId) throw new ForbiddenException("Ruxsat yo'q")
    return draft
  }

  async updateDraft(userId: string, draftId: string, dto: UpdateDraftDto) {
    const draft = await this.getDraft(userId, draftId)
    if (draft.status !== 'draft') {
      throw new BadRequestException('Draft yopiq — yangi yarating')
    }

    if (dto.items && dto.items.length > MAX_BULK) {
      throw new BadRequestException(`Maksimum ${MAX_BULK} ta shartnoma`)
    }

    return this.prisma.bulkSendDraft.update({
      where: { id: draftId },
      data:  {
        ...(dto.currentStep        !== undefined && { currentStep:        dto.currentStep }),
        ...(dto.templateId         !== undefined && { templateId:         dto.templateId }),
        ...(dto.customContent      !== undefined && { customContent:      dto.customContent }),
        ...(dto.contractType       !== undefined && { contractType:       dto.contractType }),
        ...(dto.defaultAmount      !== undefined && { defaultAmount:      dto.defaultAmount }),
        ...(dto.defaultProductName !== undefined && { defaultProductName: dto.defaultProductName }),
        ...(dto.city               !== undefined && { city:               dto.city }),
        ...(dto.numberingMode      !== undefined && { numberingMode:      dto.numberingMode }),
        ...(dto.startNumber        !== undefined && { startNumber:        dto.startNumber }),
        ...(dto.items              !== undefined && { items:              dto.items as any }),
      },
    })
  }

  async deleteDraft(userId: string, draftId: string) {
    await this.getDraft(userId, draftId)
    await this.prisma.bulkSendDraft.delete({ where: { id: draftId } })
    return { ok: true }
  }

  // ─── O'tgan kalendar yil hamkorlari ─────────────────────────
  // Yil boshida hammaga shartnoma yuborish uchun asosiy use-case
  async getLastYearCounterparties(userId: string, orgId: string) {
    await this.assertPro(userId)

    const now      = new Date()
    const lastYear = now.getFullYear() - 1

    // SQL distinct: o'tgan yili shartnoma bo'lgan unique kontragentlar.
    // Avvalgi N+1 yondashuv (barcha shartnomalarni tortib app'da unique
    // qilish) o'rniga to'g'ridan-to'g'ri kontragentlarni filtr orqali olamiz.
    const cps = await this.prisma.counterparty.findMany({
      where: {
        organizationId: orgId,
        isActive:       true,
        inn:            { not: null },
        contracts: {
          some: {
            organizationId: orgId,
            isActive:       true,
            contractDate:   { startsWith: String(lastYear) },
          },
        },
      },
      select: {
        id: true, name: true, inn: true, directorName: true,
        address: true, bankName: true, bankAccount: true, mfo: true,
      },
      orderBy: { name: 'asc' },
    })

    return cps
  }

  // ─── Bulk shartnoma yaratish (atomic, ketma-ket) ─────────────
  // Frontend draft.items'ni to'ldiradi → execute() har bir item uchun
  // contracts.create chaqiradi va contractId ni qaytaradi
  async execute(userId: string, draftId: string) {
    await this.assertPro(userId)
    const draft = await this.getDraft(userId, draftId)

    const items = (draft.items as any as BulkItem[]) || []
    if (!items.length) throw new BadRequestException('Kontragentlar yo\'q')
    if (items.length > MAX_BULK) {
      throw new BadRequestException(`Maksimum ${MAX_BULK} ta shartnoma`)
    }

    // Atomic guard: faqat status='draft' bo'lsa 'executing'ga o'tkaz.
    // Parallel ikki chaqiruv kelsa, ikkinchisi 0 row update qiladi va xato.
    const claimed = await this.prisma.bulkSendDraft.updateMany({
      where: { id: draftId, status: 'draft' },
      data:  {
        status:     'executing',
        startedAt:  new Date(),
        totalCount: items.length,
      },
    })
    if (claimed.count === 0) {
      throw new BadRequestException('Bu draft allaqachon ishga tushirilgan yoki tugatilgan')
    }

    const today = new Date().toISOString().split('T')[0]
    const updatedItems: BulkItem[] = [...items]
    let success = 0
    let errors  = 0

    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      try {
        // 1) Kontragent topilishi yoki yaratilishi
        let cpId: string | undefined
        const existing = await this.prisma.counterparty.findFirst({
          where: { organizationId: draft.organizationId, inn: item.stir, isActive: true },
        })
        if (existing) {
          cpId = existing.id
        } else if (item.name) {
          const newCp = await this.cps.create({
            organizationId: draft.organizationId,
            name:           item.name,
            inn:            item.stir,
            directorName:   item.directorName,
            address:        item.address,
            bankName:       item.bankName,
            bankAccount:    item.bankAccount,
            mfo:            item.mfo,
          })
          cpId = newCp.id
        } else {
          throw new Error('Kontragent ma\'lumotlari to\'liq emas')
        }

        // 2) Shartnoma raqami
        const contractNumber = item.contractNumber ||
          this.computeNextNumber(draft.startNumber || '', i)

        // 3) Kontent: agar customContent bo'lsa — placeholder bilan to'ldiramiz
        let content: string | undefined
        if (draft.customContent) {
          content = this.fillPlaceholders(draft.customContent, {
            kontragent_nomi:   item.name || '',
            stir:              item.stir,
            rahbar:            item.directorName || '',
            manzil:            item.address || '',
            summa:             String(item.amount ?? Number(draft.defaultAmount) ?? 0),
            shartnoma_raqami:  contractNumber,
            sana:              today,
            mahsulot:          item.productName || draft.defaultProductName || '',
          })
        }

        // 4) Shartnoma yaratish
        const contract = await this.contracts.create(userId, {
          organizationId: draft.organizationId,
          counterpartyId: cpId,
          contractNumber,
          contractType:   draft.contractType as any,
          contractDate:   today,
          city:           draft.city,
          amount:         Number(item.amount ?? draft.defaultAmount ?? 0),
          productName:    item.productName || draft.defaultProductName || undefined,
          content,
        })

        updatedItems[i] = {
          ...item,
          contractNumber,
          contractId: contract.id,
          status:     'created',
        }
        success++
      } catch (err: any) {
        this.logger.error(`Bulk item ${i} xato: ${err?.message}`)
        updatedItems[i] = {
          ...item,
          status:       'error',
          errorMessage: err?.message?.slice(0, 200) || 'Xato',
        }
        errors++
      }

      // Har bir item'dan keyin progress yangilanadi (frontend polling qiladi)
      await this.prisma.bulkSendDraft.update({
        where: { id: draftId },
        data:  {
          items:        updatedItems as any,
          successCount: success,
          errorCount:   errors,
        },
      })
    }

    // Yakunlash
    const finalDraft = await this.prisma.bulkSendDraft.update({
      where: { id: draftId },
      data:  {
        status:       errors === items.length ? 'cancelled' : 'completed',
        completedAt:  new Date(),
      },
    })

    this.audit.log({
      userId,
      organizationId: draft.organizationId,
      action:         'BULK_CONTRACTS_CREATED',
      entityType:     'bulkSendDraft',
      entityId:       draftId,
      details:        { total: items.length, success, errors },
    })

    return finalDraft
  }

  // ─── Imzolangandan keyin status yangilash ───────────────────
  async markItemSigned(userId: string, draftId: string, contractId: string) {
    const draft = await this.getDraft(userId, draftId)
    const items = (draft.items as any as BulkItem[]) || []
    const updated = items.map(it =>
      it.contractId === contractId ? { ...it, status: 'signed' as const } : it
    )
    await this.prisma.bulkSendDraft.update({
      where: { id: draftId },
      data:  { items: updated as any },
    })
    return { ok: true }
  }

  async markItemSent(userId: string, draftId: string, contractId: string) {
    const draft = await this.getDraft(userId, draftId)
    const items = (draft.items as any as BulkItem[]) || []
    const updated = items.map(it =>
      it.contractId === contractId ? { ...it, status: 'sent' as const } : it
    )
    await this.prisma.bulkSendDraft.update({
      where: { id: draftId },
      data:  { items: updated as any },
    })
    return { ok: true }
  }

  // ─── Helper: keyingi raqam (sequential mode) ─────────────────
  // "001" + 0 = "001", "001" + 1 = "002"
  // "2026/01" + 0 = "2026/01", "2026/01" + 1 = "2026/02"
  private computeNextNumber(start: string, offset: number): string {
    if (!start) return String(offset + 1).padStart(3, '0')

    // Trailing son qismini topish
    const m = start.match(/^(.*?)(\d+)$/)
    if (!m) return `${start}-${offset + 1}`
    const prefix  = m[1]
    const num     = parseInt(m[2], 10) + offset
    const padded  = String(num).padStart(m[2].length, '0')
    return `${prefix}${padded}`
  }

  // ─── Helper: placeholder almashtirish ────────────────────────
  // {{KONTRAGENT_NOMI}}, {{STIR}}, etc.
  private fillPlaceholders(template: string, data: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(data)) {
      const re = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'gi')
      result = result.replace(re, value)
    }
    return result
  }
}
