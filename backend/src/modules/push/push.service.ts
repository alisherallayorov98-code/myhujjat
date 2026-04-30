import { Injectable, Logger } from '@nestjs/common'
import { PrismaService }      from '../prisma/prisma.service'
import * as webpush           from 'web-push'

export interface PushSubscriptionDto {
  endpoint: string
  keys: {
    p256dh: string
    auth:   string
  }
}

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name)
  private configured = false

  constructor(private prisma: PrismaService) {
    const pubKey  = process.env.VAPID_PUBLIC_KEY
    const privKey = process.env.VAPID_PRIVATE_KEY
    const subject = process.env.VAPID_SUBJECT || 'mailto:support@myhujjat.uz'

    if (pubKey && privKey) {
      webpush.setVapidDetails(subject, pubKey, privKey)
      this.configured = true
    } else {
      this.logger.warn('VAPID kalitlari sozlanmagan — push bildirishnomalar ishlamaydi')
    }
  }

  getPublicKey(): string | null {
    return process.env.VAPID_PUBLIC_KEY || null
  }

  async subscribe(userId: string, sub: PushSubscriptionDto, userAgent?: string) {
    return this.prisma.pushSubscription.upsert({
      where:  { endpoint: sub.endpoint },
      update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId, userAgent },
      create: {
        userId,
        endpoint:  sub.endpoint,
        p256dh:    sub.keys.p256dh,
        auth:      sub.keys.auth,
        userAgent: userAgent || null,
      },
    })
  }

  async unsubscribe(endpoint: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint } })
    return { success: true }
  }

  async sendToUser(userId: string, payload: {
    title:  string
    body:   string
    url?:   string
    icon?:  string
  }) {
    if (!this.configured) return { sent: 0 }

    const subs = await this.prisma.pushSubscription.findMany({ where: { userId } })
    if (subs.length === 0) return { sent: 0 }

    const data = JSON.stringify({
      title: payload.title,
      body:  payload.body,
      url:   payload.url  || '/dashboard',
      icon:  payload.icon || '/icons/icon-192.png',
    })

    let sent = 0
    const stale: string[] = []

    await Promise.all(subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          data,
        )
        sent++
      } catch (err: any) {
        // 410 Gone — endpoint o'chirilgan; 404 Not Found — endpoint mavjud emas
        if (err?.statusCode === 410 || err?.statusCode === 404) {
          stale.push(s.endpoint)
        } else {
          this.logger.warn(`Push xato (${s.endpoint.slice(0, 40)}): ${err?.message}`)
        }
      }
    }))

    if (stale.length > 0) {
      await this.prisma.pushSubscription.deleteMany({
        where: { endpoint: { in: stale } },
      })
    }

    return { sent, removed: stale.length }
  }
}
