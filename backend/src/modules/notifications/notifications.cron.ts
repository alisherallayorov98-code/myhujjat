import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService }        from '../prisma/prisma.service'
import { NotificationsService } from './notifications.service'
import { MailService }          from '../mail/mail.service'

/**
 * Notifikatsiya cron joblari:
 * - Har kun 09:00 da: obunasi 7 va 1 kun ichida tugaydiganlarga
 * - Har kun 09:30 da: shartnoma limitiga yaqinlashganlarga
 *
 * (Shartnoma muddati tugashi cron emas — chunki contractDate
 * "amal qilish" emas, tuzilgan sana. Kelajakda expirationDate
 * qo'shganda shu yerga ulanadi.)
 */
@Injectable()
export class NotificationsCron {
  private readonly logger = new Logger(NotificationsCron.name)

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private mail: MailService,
  ) {}

  // ─── Har kun 09:00 — obuna eslatmalari ───────────────────────
  @Cron('0 0 9 * * *', { name: 'subscription-reminders', timeZone: 'Asia/Tashkent' })
  async checkSubscriptionExpiration() {
    this.logger.log('Obuna muddati tekshirilmoqda...')
    const now = new Date()

    // 7 kun va 1 kun qoldi
    for (const days of [7, 1]) {
      const target = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
      const dayStart = new Date(target.getFullYear(), target.getMonth(), target.getDate())
      const dayEnd   = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

      const subs = await this.prisma.subscription.findMany({
        where: {
          status:    'ACTIVE',
          plan:      { in: ['STANDARD', 'PRO'] },
          expiresAt: { gte: dayStart, lt: dayEnd },
        },
        include: { user: true },
      })

      for (const sub of subs) {
        // Notifikatsiya
        await this.notifications.create({
          userId:  sub.userId,
          type:    'SUBSCRIPTION_EXPIRING',
          title:   `Obuna ${days} kundan keyin tugaydi`,
          message: `${sub.plan} rejasi ${days} kun ichida tugaydi. Yangilash uchun bosing.`,
          link:    '/dashboard/sozlamalar/obuna',
        }).catch(() => {})

        // Email — user tilida
        if (sub.user.email) {
          const lang = (sub.user as any).language?.toLowerCase() as 'uz' | 'oz' | 'ru' || 'uz'
          this.mail.sendSubscriptionExpiring(sub.user.email, sub.user.firstName || '', days, lang)
            .catch(err => this.logger.warn(`Email xato: ${err?.message}`))
        }
      }

      if (subs.length > 0) {
        this.logger.log(`${days} kun: ${subs.length} ta foydalanuvchiga eslatma yuborildi`)
      }
    }
  }

  // ─── Har kun 09:30 — shartnoma limit ogohlantirish ───────────
  @Cron('0 30 9 * * *', { name: 'contract-limit-warning', timeZone: 'Asia/Tashkent' })
  async checkContractLimit() {
    this.logger.log('Shartnoma limitlari tekshirilmoqda...')

    // FREE rejada oyiga 3 ta — 80% (2.4) yetganlar uchun ogohlantiramiz
    const subs = await this.prisma.subscription.findMany({
      where: {
        plan:          'FREE',
        status:        'ACTIVE',
        contractCount: { gte: 2 }, // 2 yoki 3
      },
      include: { user: true },
    })

    for (const sub of subs) {
      const used = sub.contractCount
      // Har bir foydalanuvchiga oyda 1 marta yuborilsin
      const lastMonth = new Date()
      lastMonth.setDate(1)
      lastMonth.setHours(0, 0, 0, 0)

      const existing = await this.prisma.notification.findFirst({
        where: {
          userId:    sub.userId,
          type:      'CONTRACT_LIMIT',
          createdAt: { gte: lastMonth },
        },
      })
      if (existing) continue

      await this.notifications.create({
        userId:  sub.userId,
        type:    'CONTRACT_LIMIT',
        title:   `Shartnoma limiti yaqinlashmoqda`,
        message: `Bu oy ${used}/3 ta shartnoma yaratdingiz. Cheksiz uchun rejani yangilang.`,
        link:    '/dashboard/sozlamalar/obuna',
      }).catch(() => {})

      if (used >= 2 && sub.user.email) {
        const lang = (sub.user as any).language?.toLowerCase() as 'uz' | 'oz' | 'ru' || 'uz'
        this.mail.sendContractLimitWarning(sub.user.email, sub.user.firstName || '', used, 3, lang)
          .catch(err => this.logger.warn(`Email xato: ${err?.message}`))
      }
    }

    if (subs.length > 0) {
      this.logger.log(`${subs.length} ta foydalanuvchiga limit ogohlantirish`)
    }
  }

  // ─── Har oy 1-kuni 00:00 — FREE rejaning oylik counter reset ─
  @Cron('0 0 0 1 * *', { name: 'monthly-counter-reset', timeZone: 'Asia/Tashkent' })
  async resetMonthlyCounters() {
    this.logger.log('Oylik shartnoma counterlari reset qilinmoqda...')
    const result = await this.prisma.subscription.updateMany({
      where: { plan: 'FREE' },
      data:  { contractCount: 0 },
    })
    this.logger.log(`${result.count} ta FREE foydalanuvchining counteri 0 ga tushirildi`)
  }
}
