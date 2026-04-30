import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService }        from '../prisma/prisma.service'
import { ContractMonitorService } from './contract-monitor.service'
import { InvoicesService }      from './invoices.service'

@Injectable()
export class InvoicesCron {
  private readonly logger = new Logger(InvoicesCron.name)

  constructor(
    private prisma:  PrismaService,
    private monitor: ContractMonitorService,
    private invoices: InvoicesService,
  ) {}

  // ─── Har kun 08:00 — barcha shartnomalar monitoringi ─────
  @Cron('0 0 8 * * *', { name: 'contract-monitoring', timeZone: 'Asia/Tashkent' })
  async dailyMonitoring() {
    this.logger.log('Kundalik shartnoma monitoringi boshlandi')
    const result = await this.monitor.recalcAll()
    this.logger.log(`Monitoring tugadi: ${result.processed}/${result.total}`)
  }

  // ─── Har 30 daqiqada — Didox sinxronlash (ulangan foydalanuvchilar uchun) ──
  @Cron('0 */30 * * * *', { name: 'didox-sync', timeZone: 'Asia/Tashkent' })
  async syncDidoxInvoices() {
    if (!process.env.DIDOX_API_URL) return // stub'da o'tkazib yuborish

    const users = await this.prisma.user.findMany({
      where:  { didoxConnected: true, isActive: true },
      select: { id: true },
    })

    if (users.length === 0) return
    this.logger.log(`Didox sinxronlash: ${users.length} ta foydalanuvchi`)

    // Oxirgi 7 kunning ma'lumotlari
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate   = new Date().toISOString().split('T')[0]

    let totalCreated = 0
    let totalUpdated = 0
    for (const user of users) {
      try {
        const orgs = await this.prisma.organization.findMany({
          where: { userId: user.id, isActive: true }, select: { id: true },
        })
        for (const org of orgs) {
          const r = await this.invoices.syncFromDidox(user.id, org.id, { fromDate, toDate })
          totalCreated += r.created
          totalUpdated += r.updated
        }
      } catch (err: any) {
        this.logger.warn(`User ${user.id} sync xato: ${err?.message}`)
      }
    }

    this.logger.log(`Didox sinxronlash tugadi: +${totalCreated} yangi, ${totalUpdated} yangilandi`)
  }
}
