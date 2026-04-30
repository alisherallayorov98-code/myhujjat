import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common'
import { Reflector } from '@nestjs/core'

/**
 * Per-tenant rate limiting.
 *
 * Bitta tashkilot (yoki foydalanuvchi) sayt resurslarini suiiste'mol qilolmasligi uchun.
 * Throttler IP bo'yicha cheklaydi, bu esa tashkilot bo'yicha.
 *
 * Foydalanish:
 *   @TenantLimit({ limit: 50, windowMs: 60000 })  // 1 daqiqada 50 ta
 *   @Post('contracts')
 *   create() { ... }
 *
 * Yoki global:
 *   @UseGuards(TenantRateLimitGuard)
 */

interface BucketEntry {
  count:    number
  resetAt:  number
}

const buckets = new Map<string, BucketEntry>()

// Memory leak'ni oldini olish uchun har 5 daqiqada eski yozuvlarni tozalash
setInterval(() => {
  const now = Date.now()
  for (const [key, e] of buckets.entries()) {
    if (e.resetAt < now) buckets.delete(key)
  }
}, 5 * 60 * 1000).unref?.()

export const TENANT_LIMIT_KEY = 'tenant-limit'

export interface TenantLimitOptions {
  limit:    number
  windowMs: number
}

import { SetMetadata } from '@nestjs/common'
export const TenantLimit = (opts: TenantLimitOptions) =>
  SetMetadata(TENANT_LIMIT_KEY, opts)

@Injectable()
export class TenantRateLimitGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const opts = this.reflector.getAllAndOverride<TenantLimitOptions>(
      TENANT_LIMIT_KEY,
      [ctx.getHandler(), ctx.getClass()],
    )
    if (!opts) return true

    const req     = ctx.switchToHttp().getRequest()
    const userId  = req.user?.sub  || 'anon'
    const orgId   = req.body?.orgId || req.query?.orgId || 'no-org'
    const route   = req.method + ':' + (req.route?.path || req.url.split('?')[0])
    const key     = `${userId}:${orgId}:${route}`

    const now = Date.now()
    let bucket = buckets.get(key)
    if (!bucket || bucket.resetAt < now) {
      bucket = { count: 0, resetAt: now + opts.windowMs }
      buckets.set(key, bucket)
    }

    bucket.count++
    if (bucket.count > opts.limit) {
      const retryAfterSec = Math.ceil((bucket.resetAt - now) / 1000)
      throw new HttpException(
        {
          statusCode: 429,
          message:    `Juda ko'p so'rov. ${retryAfterSec} soniyadan so'ng urining`,
          retryAfter: retryAfterSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      )
    }

    return true
  }
}
