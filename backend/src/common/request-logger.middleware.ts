/**
 * Structured request logging — har so'rov uchun JSON satrida vaqt+holat'ni
 * yozadi. Docker stdout → log aggregator (Loki, Papertrail, ELK) ga
 * to'g'ridan-to'g'ri ingest qilinadi.
 *
 * Format:
 *   {timestamp, requestId, method, path, status, durationMs, userId?}
 */

import { Injectable, NestMiddleware, Logger } from '@nestjs/common'
import type { Request, Response, NextFunction } from 'express'

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP')

  use(req: Request & { id?: string; user?: any }, res: Response, next: NextFunction) {
    const startedAt = Date.now()
    const { method, originalUrl } = req

    // Maxfiy path'larni jim qilish (parol resetda token URL'da bo'ladi)
    const isSensitive = /\/(reset|verify|webhook)\//.test(originalUrl)

    res.on('finish', () => {
      const durationMs = Date.now() - startedAt
      const userId     = (req as any).user?.sub
      const status     = res.statusCode

      // Health/metrics so'rovlarini log qilmaslik (noise)
      if (originalUrl.endsWith('/health') || originalUrl.endsWith('/metrics')) return

      const logData = {
        requestId:  req.id,
        method,
        path:       isSensitive ? originalUrl.split('?')[0] : originalUrl,
        status,
        durationMs,
        ...(userId && { userId }),
      }

      // 5xx — error level, 4xx — warn, boshqa — log
      if (status >= 500) {
        this.logger.error(JSON.stringify(logData))
      } else if (status >= 400) {
        this.logger.warn(JSON.stringify(logData))
      } else if (durationMs > 1000) {
        // Sekin so'rov (>1s) — alohida ko'zga tashlanadi
        this.logger.warn(`🐌 SLOW: ${JSON.stringify(logData)}`)
      } else {
        this.logger.log(JSON.stringify(logData))
      }
    })

    next()
  }
}
