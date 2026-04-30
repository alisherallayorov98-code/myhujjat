import { Injectable, Logger } from '@nestjs/common'
import { PrismaService }       from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'

const ALERT_THRESHOLDS = {
  WARNING:          80,   // ogohlantirish
  CRITICAL:         95,   // kritik
  EXCEEDED:         100,  // oshib ketdi
  CRITICAL_OVERAGE: 120,  // sezilarli oshib ketdi
}

type AlertLevel = 'WARNING' | 'CRITICAL' | 'EXCEEDED' | 'CRITICAL_OVERAGE'

@Injectable()
export class ContractMonitorService {
  private readonly logger = new Logger(ContractMonitorService.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Shartnoma summasini va barcha bog'liq fakturalarni qayta hisoblash.
   * Faktura qo'shilganda yoki o'chirilganda chaqiriladi.
   */
  async recalcContract(contractId: string) {
    const agg = await this.prisma.invoice.aggregate({
      where: { contractId, status: { in: ['ACCEPTED', 'SENT'] } },
      _sum:  { totalAmount: true },
      _count: { _all: true },
    })

    const totalInvoiced = Number(agg._sum.totalAmount || 0)
    const invoiceCount  = agg._count._all

    const contract = await this.prisma.contract.findUnique({
      where:  { id: contractId },
      select: { id: true, amount: true, alertLevel: true, organizationId: true, organization: { select: { userId: true, name: true } }, contractNumber: true, counterparty: { select: { name: true } } },
    })
    if (!contract) return

    const amount  = Number(contract.amount)
    const percent = amount > 0 ? (totalInvoiced / amount) * 100 : 0

    const newLevel = this.getLevel(percent)

    await this.prisma.contract.update({
      where: { id: contractId },
      data:  {
        totalInvoiced,
        invoiceCount,
        lastInvoiceAt: new Date(),
        alertLevel:    newLevel,
      },
    })

    // Yangi level — eski levelga teng emasligini va kerakli darajada ekanligini tekshirish
    if (newLevel && newLevel !== contract.alertLevel) {
      await this.sendAlert(contract.id, contract.organization.userId, contract.organizationId, {
        contractNumber: contract.contractNumber,
        counterpartyName: contract.counterparty?.name || null,
        contractAmount: amount,
        totalInvoiced,
        percent,
        level: newLevel,
      })
    }

    return { totalInvoiced, invoiceCount, percent, level: newLevel }
  }

  // ─── Daraja aniqlash ──────────────────────────────────────
  private getLevel(percent: number): AlertLevel | null {
    if (percent >= ALERT_THRESHOLDS.CRITICAL_OVERAGE) return 'CRITICAL_OVERAGE'
    if (percent >= ALERT_THRESHOLDS.EXCEEDED)         return 'EXCEEDED'
    if (percent >= ALERT_THRESHOLDS.CRITICAL)         return 'CRITICAL'
    if (percent >= ALERT_THRESHOLDS.WARNING)          return 'WARNING'
    return null
  }

  // ─── Notifikatsiya yuborish ───────────────────────────────
  private async sendAlert(contractId: string, userId: string, orgId: string, data: {
    contractNumber: string
    counterpartyName: string | null
    contractAmount: number
    totalInvoiced: number
    percent: number
    level: AlertLevel
  }) {
    const fmt = (n: number) => n.toLocaleString('uz-UZ')
    const cpName = data.counterpartyName ? ` (${data.counterpartyName})` : ''
    const pctStr = data.percent.toFixed(1)

    let title:   string
    let message: string
    switch (data.level) {
      case 'WARNING':
        title   = 'Shartnoma fakturalar 80% yetdi'
        message = `${data.contractNumber}${cpName}: ${pctStr}% (${fmt(data.totalInvoiced)} / ${fmt(data.contractAmount)} so'm)`
        break
      case 'CRITICAL':
        title   = '⚠️ Shartnoma fakturalar kritik darajada'
        message = `${data.contractNumber}${cpName}: ${pctStr}% — ${fmt(data.contractAmount - data.totalInvoiced)} so'm qoldi`
        break
      case 'EXCEEDED':
        title   = '🚨 Shartnoma summasi oshib ketdi'
        message = `${data.contractNumber}${cpName}: ${pctStr}% — ${fmt(data.totalInvoiced - data.contractAmount)} so'm oshib ketdi. Qo'shimcha shartnoma yuboring!`
        break
      case 'CRITICAL_OVERAGE':
        title   = '🔥 Shartnoma summasi sezilarli oshib ketdi'
        message = `${data.contractNumber}${cpName}: ${pctStr}% — ${fmt(data.totalInvoiced - data.contractAmount)} so'm oshib ketdi! DARHOL qo'shimcha shartnoma yuboring.`
        break
    }

    await this.prisma.contract.update({
      where: { id: contractId },
      data:  { alertedAt: new Date() },
    })

    await this.notifications.create({
      userId,
      organizationId: orgId,
      type:    'CONTRACT_OVERAGE',
      title,
      message,
      link:    `/dashboard/shartnomalar/${contractId}`,
    }).catch(err => this.logger.warn(`Notif xato: ${err?.message}`))
  }

  // ─── Ommaviy qayta hisoblash (Cron) ──────────────────────
  /**
   * Barcha shartnomalarni qayta hisoblash. Cron yoki manual chaqiriladi.
   */
  async recalcAll() {
    this.logger.log('Barcha shartnomalar uchun monitoring boshlandi...')
    const contracts = await this.prisma.contract.findMany({
      where:  { isActive: true, amount: { gt: 0 } },
      select: { id: true },
    })
    let processed = 0
    for (const c of contracts) {
      try {
        await this.recalcContract(c.id)
        processed++
      } catch (err: any) {
        this.logger.warn(`Shartnoma ${c.id} monitoring xatosi: ${err?.message}`)
      }
    }
    this.logger.log(`Monitoring tugadi: ${processed}/${contracts.length}`)
    return { processed, total: contracts.length }
  }

  // ─── Faktura uchun shartnomani topish ─────────────────────
  /**
   * Fakturadagi `contractNumber` + `contractDate` orqali bizning bazadagi shartnomani topadi.
   */
  async findContractForInvoice(orgId: string, contractNumber: string | null, contractDate: string | null) {
    if (!contractNumber) return null
    const matches = await this.prisma.contract.findMany({
      where: {
        organizationId: orgId,
        contractNumber: { contains: contractNumber, mode: 'insensitive' },
        ...(contractDate && { contractDate }),
        isActive: true,
      },
      take: 1,
    })
    return matches[0] || null
  }
}
