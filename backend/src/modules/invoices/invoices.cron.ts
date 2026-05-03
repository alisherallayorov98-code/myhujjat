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
  // Pagination 100 batch'larda + 10 daqiqalik global timeout
  @Cron('0 */30 * * * *', { name: 'didox-sync', timeZone: 'Asia/Tashkent' })
  async syncDidoxInvoices() {
    if (!process.env.DIDOX_API_URL) return

    const startedAt = Date.now()
    const TIMEOUT_MS = 10 * 60 * 1000  // 10 daqiqa max
    const BATCH_SIZE = 100

    // Oxirgi 7 kunning ma'lumotlari
    const fromDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const toDate   = new Date().toISOString().split('T')[0]

    let totalCreated = 0
    let totalUpdated = 0
    let totalUsers   = 0
    let cursor: string | undefined

    while (true) {
      // Timeout tekshiruvi — 10 daqiqadan oshsa to'xtaymiz
      if (Date.now() - startedAt > TIMEOUT_MS) {
        this.logger.warn(`Didox sync timeout: ${totalUsers} user qayta ishlandi, qolgani keyingi runda`)
        break
      }

      const users = await this.prisma.user.findMany({
        where:  { didoxConnected: true, isActive: true },
        select: { id: true },
        take:   BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      })

      if (users.length === 0) break

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
          // Muvaffaqiyatli — eski xato bo'lsa tozalash
          await this.prisma.user.update({
            where: { id: user.id },
            data:  { didoxSyncError: null, didoxLastSync: new Date() },
          }).catch(() => {})
        } catch (err: any) {
          this.logger.warn(`User ${user.id} sync xato: ${err?.message}`)
          // Foydalanuvchi UI'da ko'rishi uchun xatoni saqlaymiz
          await this.prisma.user.update({
            where: { id: user.id },
            data:  { didoxSyncError: err?.message?.slice(0, 500) || 'noma\'lum xato' },
          }).catch(() => {})
        }
      }

      totalUsers += users.length
      cursor = users[users.length - 1].id
      if (users.length < BATCH_SIZE) break  // oxirgi batch
    }

    this.logger.log(`Didox sync tugadi: ${totalUsers} user, +${totalCreated} yangi, ${totalUpdated} yangilandi`)
  }
}
