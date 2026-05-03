import { Controller, Get, UnauthorizedException, Headers } from '@nestjs/common'
import { HealthService }   from './health.service'
import { PrismaService }   from '../prisma/prisma.service'
import { Public }          from '../../common/decorators/public.decorator'

@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * To'liq holat tekshiruvi — barcha komponentlar.
   * Public — uptime monitoring xizmatlari uchun.
   */
  @Public()
  @Get()
  async fullHealth() {
    return this.health.getFullHealth()
  }

  /**
   * Tezkor — server tirikmi yoki yo'qmi.
   * Load balancer uchun — kam ma'lumot, kam yuk.
   */
  @Public()
  @Get('quick')
  quickHealth() {
    return { status: 'ok', timestamp: new Date().toISOString() }
  }

  /**
   * Faqat database — DB monitor uchun.
   */
  @Public()
  @Get('db')
  async dbHealth() {
    return this.health.checkDatabase()
  }

  /**
   * Prometheus-style metrics endpoint — Grafana, monitoring uchun.
   * METRICS_TOKEN env bilan himoyalangan (faqat ops/monitoring server'lar
   * unga kirishi mumkin).
   *
   * Misol: curl -H "Authorization: Bearer $METRICS_TOKEN" /api/v1/health/metrics
   */
  @Public()
  @Get('metrics')
  async metrics(@Headers('authorization') auth?: string) {
    const token = process.env.METRICS_TOKEN
    if (token) {
      const provided = auth?.replace(/^Bearer\s+/i, '') || ''
      if (provided !== token) throw new UnauthorizedException()
    }

    const [users, activeSubs, contractsToday, signedToday, payments24h] = await Promise.all([
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
      this.prisma.contract.count({
        where: { createdAt: { gte: startOfDay() } },
      }),
      this.prisma.contract.count({
        where: { signedUs: true, signedUsAt: { gte: startOfDay() } },
      }),
      this.prisma.payment.count({
        where: { status: 'PAID', createdAt: { gte: hoursAgo(24) } },
      }),
    ])

    const memUsage = process.memoryUsage()

    return {
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor(process.uptime()),
      memory: {
        rss_mb:       Math.round(memUsage.rss / 1024 / 1024),
        heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      counters: {
        active_users:        users,
        active_subscriptions: activeSubs,
        contracts_today:     contractsToday,
        signed_today:        signedToday,
        payments_24h:        payments24h,
      },
    }
  }
}

function startOfDay(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function hoursAgo(h: number): Date {
  return new Date(Date.now() - h * 60 * 60 * 1000)
}
