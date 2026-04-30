import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService }           from '../prisma/prisma.service'
import { DidoxService, type DidoxInvoice } from './didox.service'
import { ContractMonitorService }  from './contract-monitor.service'

export interface CreateInvoiceDto {
  organizationId:  string
  source?:         'MANUAL' | 'EXCEL' | 'DIDOX'
  documentNumber?: string
  documentDate?:   string
  contractNumber?: string
  contractDate?:   string
  contractId?:     string
  sellerInn?:      string
  sellerName?:     string
  buyerInn?:       string
  buyerName?:      string
  direction:       'INCOMING' | 'OUTGOING'
  amount:          number
  vatAmount?:      number
  totalAmount?:    number
}

@Injectable()
export class InvoicesService {
  private readonly logger = new Logger(InvoicesService.name)

  constructor(
    private prisma:  PrismaService,
    private didox:   DidoxService,
    private monitor: ContractMonitorService,
  ) {}

  // ─── Ro'yxat ──────────────────────────────────────────────
  async findAll(userId: string, orgId: string, query: {
    contractId?: string
    direction?:  'INCOMING' | 'OUTGOING'
    page?:       number
    limit?:      number
  } = {}) {
    const page  = Number(query.page)  || 1
    const limit = Math.min(Number(query.limit) || 50, 200)
    const where: any = { userId, organizationId: orgId }
    if (query.contractId) where.contractId = query.contractId
    if (query.direction)  where.direction  = query.direction

    const [total, items] = await Promise.all([
      this.prisma.invoice.count({ where }),
      this.prisma.invoice.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { documentDate: 'desc' },
      }),
    ])
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findByContract(userId: string, contractId: string) {
    return this.prisma.invoice.findMany({
      where:   { contractId, userId },
      orderBy: { documentDate: 'desc' },
    })
  }

  // ─── Yangi faktura yaratish ───────────────────────────────
  async create(userId: string, dto: CreateInvoiceDto) {
    // Avtomatik shartnomani topish (agar contractId ko'rsatilmagan bo'lsa)
    let contractId = dto.contractId
    if (!contractId && dto.contractNumber) {
      const c = await this.monitor.findContractForInvoice(dto.organizationId, dto.contractNumber, dto.contractDate || null)
      contractId = c?.id
    }

    const total = dto.totalAmount ?? (dto.amount + (dto.vatAmount || 0))

    const invoice = await this.prisma.invoice.create({
      data: {
        userId,
        organizationId:  dto.organizationId,
        source:          (dto.source || 'MANUAL') as any,
        documentNumber:  dto.documentNumber,
        documentDate:    dto.documentDate,
        contractNumber:  dto.contractNumber,
        contractDate:    dto.contractDate,
        contractId,
        sellerInn:       dto.sellerInn,
        sellerName:      dto.sellerName,
        buyerInn:        dto.buyerInn,
        buyerName:       dto.buyerName,
        direction:       dto.direction as any,
        amount:          dto.amount,
        vatAmount:       dto.vatAmount || 0,
        totalAmount:     total,
        status:          'ACCEPTED',
      },
    })

    if (contractId) {
      await this.monitor.recalcContract(contractId)
    }

    return invoice
  }

  // ─── O'chirish ────────────────────────────────────────────
  async remove(userId: string, id: string) {
    const inv = await this.prisma.invoice.findFirst({ where: { id, userId } })
    if (!inv) throw new NotFoundException('Faktura topilmadi')
    await this.prisma.invoice.delete({ where: { id } })
    if (inv.contractId) await this.monitor.recalcContract(inv.contractId)
    return { success: true }
  }

  // ─── Excel import (vaqtinchalik, Didox kelguncha) ────────
  /**
   * Foydalanuvchi Didox/Faktura.uz dan Excel yuklab oladi va biznikiga yuklaydi.
   * Excel'da quyidagi ustunlar bo'lishi kerak:
   *   - Faktura raqami | Sana | Shartnoma raqami | Shartnoma sanasi | Sotuvchi STIR | Xaridor STIR | Summa | QQS | Jami
   */
  async importFromExcel(userId: string, orgId: string, rows: any[]) {
    const created: any[] = []
    const errors: { row: number; error: string }[] = []
    const affectedContracts = new Set<string>()

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]
      try {
        const sellerInn = String(r.sellerInn || r['Sotuvchi STIR'] || '').replace(/\D/g, '')
        const buyerInn  = String(r.buyerInn  || r['Xaridor STIR']  || '').replace(/\D/g, '')

        // Org'ning STIR'idan yo'nalishni aniqlash
        const org = await this.prisma.organization.findUnique({
          where: { id: orgId }, select: { inn: true },
        })
        const orgInn = (org?.inn || '').replace(/\D/g, '')
        const direction: 'INCOMING' | 'OUTGOING' =
          orgInn && orgInn === sellerInn ? 'OUTGOING' :
          orgInn && orgInn === buyerInn  ? 'INCOMING' : 'INCOMING'

        const amount    = Number(r.amount      ?? r['Summa']      ?? 0)
        const vatAmount = Number(r.vatAmount   ?? r['QQS']        ?? 0)
        const total     = Number(r.totalAmount ?? r['Jami']       ?? amount + vatAmount)

        const inv = await this.create(userId, {
          organizationId:  orgId,
          source:          'EXCEL',
          documentNumber:  String(r.documentNumber || r['Faktura raqami'] || ''),
          documentDate:    String(r.documentDate   || r['Sana']           || ''),
          contractNumber:  String(r.contractNumber || r['Shartnoma raqami'] || '') || undefined,
          contractDate:    String(r.contractDate   || r['Shartnoma sanasi'] || '') || undefined,
          sellerInn,
          sellerName:      r.sellerName || r['Sotuvchi nomi'],
          buyerInn,
          buyerName:       r.buyerName || r['Xaridor nomi'],
          direction,
          amount,
          vatAmount,
          totalAmount:     total,
        })
        created.push(inv)
        if (inv.contractId) affectedContracts.add(inv.contractId)
      } catch (err: any) {
        errors.push({ row: i + 1, error: err?.message || 'Xatolik' })
      }
    }

    // Affected shartnomalarni qayta hisoblash (parallel)
    await Promise.all(
      Array.from(affectedContracts).map(id => this.monitor.recalcContract(id))
    )

    return {
      imported:        created.length,
      errors,
      affectedContracts: affectedContracts.size,
    }
  }

  // ─── Didox sinxronlash ───────────────────────────────────
  async syncFromDidox(userId: string, orgId: string, opts: { fromDate?: string; toDate?: string } = {}) {
    const remoteIncoming = await this.didox.fetchInvoices(userId, { ...opts, direction: 'incoming' })
    const remoteOutgoing = await this.didox.fetchInvoices(userId, { ...opts, direction: 'outgoing' })

    let created = 0
    let updated = 0
    const affectedContracts = new Set<string>()

    for (const di of [...remoteIncoming, ...remoteOutgoing]) {
      const direction: 'INCOMING' | 'OUTGOING' = remoteIncoming.includes(di) ? 'INCOMING' : 'OUTGOING'

      const existing = await this.prisma.invoice.findFirst({ where: { didoxId: di.id } })

      let contractId: string | undefined
      if (di.contractNumber) {
        const c = await this.monitor.findContractForInvoice(orgId, di.contractNumber, di.contractDate || null)
        contractId = c?.id
      }

      const data = {
        userId,
        organizationId:  orgId,
        source:          'DIDOX' as any,
        didoxId:         di.id,
        documentNumber:  di.number,
        documentDate:    di.date,
        contractNumber:  di.contractNumber,
        contractDate:    di.contractDate,
        contractId,
        sellerInn:       di.sellerInn,
        sellerName:      di.sellerName,
        buyerInn:        di.buyerInn,
        buyerName:       di.buyerName,
        direction:       direction as any,
        amount:          di.amount,
        vatAmount:       di.vatAmount,
        totalAmount:     di.totalAmount,
        status:          (di.status || 'ACCEPTED') as any,
        rawData:         di.raw as any,
      }

      if (existing) {
        await this.prisma.invoice.update({ where: { id: existing.id }, data })
        updated++
      } else {
        await this.prisma.invoice.create({ data })
        created++
      }
      if (contractId) affectedContracts.add(contractId)
    }

    await this.prisma.user.update({
      where: { id: userId },
      data:  { didoxLastSync: new Date(), didoxSyncError: null },
    })

    await Promise.all(Array.from(affectedContracts).map(id => this.monitor.recalcContract(id)))

    return { created, updated, affectedContracts: affectedContracts.size }
  }

  // ─── Manual qayta hisoblash ──────────────────────────────
  async recalcAll() {
    return this.monitor.recalcAll()
  }
}
