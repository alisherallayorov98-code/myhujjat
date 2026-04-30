import { Injectable, Logger } from '@nestjs/common'
import { Cron, CronExpression } from '@nestjs/schedule'
import { PrismaService }        from '../prisma/prisma.service'
import { IncidentReporterService } from './incident-reporter.service'
import { getAllBreakers }       from './circuit-breaker'

export interface ComponentHealth {
  status: 'up' | 'degraded' | 'down'
  message?: string
  latencyMs?: number
  details?:   Record<string, any>
}

export interface SystemHealth {
  status:     'healthy' | 'degraded' | 'unhealthy'
  uptime:     number  // seconds
  version:    string
  timestamp:  string
  components: {
    database:  ComponentHealth
    memory:    ComponentHealth
    breakers:  ComponentHealth
  }
}

const MEMORY_WARN_PCT = 80
const MEMORY_CRIT_PCT = 92

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name)
  private startedAt = Date.now()

  constructor(
    private prisma: PrismaService,
    private reporter: IncidentReporterService,
  ) {}

  async getFullHealth(): Promise<SystemHealth> {
    const [db, memory, breakers] = await Promise.all([
      this.checkDatabase(),
      Promise.resolve(this.checkMemory()),
      Promise.resolve(this.checkCircuitBreakers()),
    ])

    const downCount      = [db, memory, breakers].filter(c => c.status === 'down').length
    const degradedCount  = [db, memory, breakers].filter(c => c.status === 'degraded').length

    const overall: SystemHealth['status'] =
      downCount > 0     ? 'unhealthy' :
      degradedCount > 0 ? 'degraded' :
                          'healthy'

    return {
      status:    overall,
      uptime:    Math.floor((Date.now() - this.startedAt) / 1000),
      version:   process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      components: { database: db, memory, breakers },
    }
  }

  // ─── Komponent tekshiruvlari ────────────────────────────
  async checkDatabase(): Promise<ComponentHealth> {
    const t0 = Date.now()
    try {
      await this.prisma.$queryRaw`SELECT 1`
      const latency = Date.now() - t0
      if (latency > 1000) {
        return { status: 'degraded', message: 'Sekin javob beryapti', latencyMs: latency }
      }
      return { status: 'up', latencyMs: latency }
    } catch (err: any) {
      return { status: 'down', message: err?.message || 'DB ulanish xatosi', latencyMs: Date.now() - t0 }
    }
  }

  checkMemory(): ComponentHealth {
    const usage = process.memoryUsage()
    const heapUsed = usage.heapUsed
    const heapTotal = usage.heapTotal
    const rss = usage.rss
    const pct = (heapUsed / heapTotal) * 100

    const details = {
      heapUsedMb:  Math.round(heapUsed / 1024 / 1024),
      heapTotalMb: Math.round(heapTotal / 1024 / 1024),
      rssMb:       Math.round(rss / 1024 / 1024),
      heapPct:     Math.round(pct),
    }

    if (pct >= MEMORY_CRIT_PCT) {
      return { status: 'down', message: `Heap ${pct.toFixed(0)}% — kritik`, details }
    }
    if (pct >= MEMORY_WARN_PCT) {
      return { status: 'degraded', message: `Heap ${pct.toFixed(0)}% — yuqori`, details }
    }
    return { status: 'up', details }
  }

  checkCircuitBreakers(): ComponentHealth {
    const breakers = getAllBreakers()
    const open = breakers.filter(b => b.state === 'OPEN')
    const halfOpen = breakers.filter(b => b.state === 'HALF_OPEN')
    if (open.length > 0) {
      return {
        status:  'degraded',
        message: `${open.length} ta tashqi xizmat siniq: ${open.map(b => b.name).join(', ')}`,
        details: { breakers },
      }
    }
    if (halfOpen.length > 0) {
      return {
        status:  'degraded',
        message: `${halfOpen.length} ta tashqi xizmat tekshirilmoqda`,
        details: { breakers },
      }
    }
    return { status: 'up', details: { count: breakers.length } }
  }

  // ─── Cron: har 1 daqiqada self-monitoring ──────────────
  @Cron(CronExpression.EVERY_MINUTE, { name: 'health-monitor' })
  async monitor() {
    const h = await this.getFullHealth()

    // Database muammosi
    if (h.components.database.status === 'down') {
      await this.reporter.report({
        severity: 'CRITICAL',
        category: 'database',
        title:    'Database ulanish uzildi',
        message:  h.components.database.message || 'Noma\'lum xato',
        details:  h.components.database.details,
      })
    }

    // Xotira to'lib qoldi — auto-cleanup
    if (h.components.memory.status === 'degraded') {
      this.attemptMemoryCleanup()
    }
    if (h.components.memory.status === 'down') {
      this.attemptMemoryCleanup()
      await this.reporter.report({
        severity: 'ERROR',
        category: 'memory',
        title:    'Xotira kritik darajaga yetdi',
        message:  h.components.memory.message || '',
        details:  h.components.memory.details,
      })
    }

    // Circuit breaker'lar siniq
    if (h.components.breakers.status === 'degraded') {
      const details = h.components.breakers.details as any
      const openOnes = (details?.breakers || []).filter((b: any) => b.state === 'OPEN')
      if (openOnes.length > 0) {
        await this.reporter.report({
          severity: 'WARNING',
          category: 'external_api',
          title:    'Tashqi API ishlamayapti',
          message:  `Siniq xizmatlar: ${openOnes.map((b: any) => b.name).join(', ')}`,
          details:  { openOnes },
        })
      }
    }
  }

  // ─── Auto-cleanup: xotira tozalash ────────────────────────
  private attemptMemoryCleanup() {
    this.logger.warn('Avto-tozalash boshlandi (xotira to\'lib qolmoqda)')
    // V8 garbage collection majburlash (faqat --expose-gc bilan ishga tushirilganda)
    if (global.gc) {
      global.gc()
      this.logger.log('Garbage collection majburlandi')
    }
    // Resend client cache (agar mavjud bo'lsa) — bizda yo'q
    // Boshqa tozalanadigan narsalar:
    //   - Eski recentIncidents
    //   - Eski loginAttempts
    //   - Eski rate limits
    this.reporter.cleanup()
  }
}
