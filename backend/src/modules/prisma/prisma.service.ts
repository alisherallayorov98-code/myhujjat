import {
  Injectable, OnModuleInit, OnModuleDestroy, Logger,
} from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const SLOW_QUERY_MS = Number(process.env.SLOW_QUERY_MS) || 500

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  private readonly logger = new Logger('Prisma')

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development'
        ? [{ emit: 'event', level: 'query' }, 'error', 'warn']
        : [{ emit: 'event', level: 'query' }, 'error'],
    })
  }

  async onModuleInit() {
    await this.$connect()

    // Slow query detection — >500ms (yoki SLOW_QUERY_MS env) bo'lsa
    // log + Sentry'ga yuborish (agar mavjud bo'lsa)
    ;(this as any).$on('query', (e: any) => {
      if (e.duration >= SLOW_QUERY_MS) {
        this.logger.warn(
          `🐌 SLOW QUERY (${e.duration}ms): ${e.query.slice(0, 200)}`
        )
        // Sentry'ga conditional yuborish
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { captureException } = require('../../common/sentry')
          captureException(new Error(`Slow query: ${e.duration}ms`), {
            duration: e.duration,
            query:    e.query.slice(0, 500),
            params:   e.params,
          })
        } catch {}
      }
    })
  }

  async onModuleDestroy() { await this.$disconnect() }
}
