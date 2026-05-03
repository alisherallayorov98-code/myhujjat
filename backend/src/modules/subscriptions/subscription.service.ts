import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { MailService }   from '../mail/mail.service'
import { Cron }          from '@nestjs/schedule'

export const PLANS = {
  standard_1m:  { plan: 'STANDARD', months: 1,  price: 149_000  },
  standard_3m:  { plan: 'STANDARD', months: 3,  price: 399_000  },
  standard_12m: { plan: 'STANDARD', months: 12, price: 1_490_000 },
  pro_1m:       { plan: 'PRO',      months: 1,  price: 299_000  },
  pro_3m:       { plan: 'PRO',      months: 3,  price: 799_000  },
  pro_12m:      { plan: 'PRO',      months: 12, price: 2_990_000 },
}

export type PlanKey = keyof typeof PLANS

@Injectable()
export class SubscriptionService {
  constructor(
    private prisma:       PrismaService,
    private mailService:  MailService,
  ) {}

  async getCurrent(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })

    if (!sub) {
      return this.prisma.subscription.create({
        data: { userId, plan: 'FREE', status: 'ACTIVE', startedAt: new Date() },
      })
    }

    if (sub.expiresAt && sub.expiresAt < new Date() && sub.status === 'ACTIVE') {
      return this.prisma.subscription.update({
        where: { userId },
        data:  { status: 'EXPIRED', plan: 'FREE' },
      })
    }

    return sub
  }

  async activate(userId: string, planKey: PlanKey, _paymentId?: string) {
    const config = PLANS[planKey]
    if (!config) throw new BadRequestException("Noto'g'ri reja")

    const now       = new Date()
    const expiresAt = new Date(now)
    expiresAt.setMonth(expiresAt.getMonth() + config.months)

    const sub = await this.prisma.subscription.upsert({
      where:  { userId },
      update: { plan: config.plan as any, status: 'ACTIVE', startedAt: now, expiresAt },
      create: { userId, plan: config.plan as any, status: 'ACTIVE', startedAt: now, expiresAt },
    })

    // Email bildirishnoma (async, xatolik to'xtatmasin) — user tilida
    this.prisma.user.findUnique({ where: { id: userId } }).then(user => {
      if (user) {
        const lang = user.language?.toLowerCase() as 'uz' | 'oz' | 'ru' || 'uz'
        this.mailService.sendSubscriptionActivated(
          user.email, user.firstName || '', config.plan, expiresAt, lang
        ).catch(() => {})
      }
    })

    return sub
  }

  async incrementContractCount(userId: string): Promise<boolean> {
    // Avval expirationni tekshirish (cron'siz ham)
    await this.getCurrent(userId)

    // Atomic conditional update — bir vaqtda check + increment.
    // updateMany ishlatamiz, chunki update where'ida limit shartlari kerak.
    // Agar 0 row updated bo'lsa → limit oshirilgan yoki rejada cheklov bor.
    const res = await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
        OR: [
          { plan: 'PRO' },
          { plan: 'DEMO' },
          { plan: 'STANDARD', contractCount: { lt: 50 } },
          { plan: 'FREE',     contractCount: { lt: 3 } },
        ],
      },
      data: { contractCount: { increment: 1 } },
    })
    return res.count > 0
  }

  async activateDemo(userId: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { userId } })

    if (existing?.plan !== 'FREE') {
      throw new BadRequestException("Demo faqat bepul foydalanuvchilar uchun")
    }

    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    return this.prisma.subscription.update({
      where: { userId },
      data:  { plan: 'DEMO', status: 'ACTIVE', startedAt: new Date(), expiresAt },
    })
  }

  @Cron('0 0 1 * *')
  async resetMonthlyCounters() {
    await this.prisma.subscription.updateMany({
      where: { status: 'ACTIVE' },
      data:  { contractCount: 0 },
    })
  }

  @Cron('0 9 * * *')
  async checkExpiringSubscriptions() {
    const threeDaysLater = new Date()
    threeDaysLater.setDate(threeDaysLater.getDate() + 3)

    const expiring = await this.prisma.subscription.findMany({
      where: {
        status:    'ACTIVE',
        plan:      { not: 'FREE' as any },
        expiresAt: { lte: threeDaysLater, gte: new Date() },
      },
      include: { user: true },
    })

    for (const sub of expiring) {
      const daysLeft = Math.ceil(
        (sub.expiresAt!.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
      const lang = (sub as any).user.language?.toLowerCase() as 'uz' | 'oz' | 'ru' || 'uz'
      this.mailService.sendSubscriptionExpiring(
        (sub as any).user.email,
        (sub as any).user.firstName || '',
        daysLeft,
        lang,
      ).catch(() => {})
    }
  }

  async getStats(userId: string) {
    const sub = await this.getCurrent(userId)

    const limits: Record<string, number> = {
      FREE: 3, STANDARD: 50, PRO: -1, DEMO: -1,
    }

    const limit     = limits[sub.plan] ?? 3
    const used      = sub.contractCount
    const remaining = limit === -1 ? -1 : Math.max(0, limit - used)

    return {
      plan:          sub.plan,
      status:        sub.status,
      expiresAt:     sub.expiresAt,
      contractCount: used,
      limit,
      remaining,
      isExpired:     sub.status === 'EXPIRED',
      canCreate:     limit === -1 || used < limit,
    }
  }
}
