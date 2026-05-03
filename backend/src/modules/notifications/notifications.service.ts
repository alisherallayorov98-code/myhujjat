import { Injectable, Inject, forwardRef, Optional } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { PushService }   from '../push/push.service'

export type NotificationType =
  | 'CONTRACT_CREATED'
  | 'CONTRACT_EXPIRING'
  | 'CONTRACT_SIGNED'
  | 'CONTRACT_OVERAGE'
  | 'SUBSCRIPTION_EXPIRING'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'CONTRACT_LIMIT'
  | 'INVOICE_RECEIVED'
  | 'INVOICE_SIGNED'
  | 'SYSTEM'
  | 'WELCOME'

export interface CreateNotification {
  userId:          string
  organizationId?: string
  type:            NotificationType
  title:           string                  // UZ default — backward compat
  message:         string                  // UZ default
  link?:           string
  data?:           Record<string, any>     // Frontend tarjima parametrlari (yangi yondashuv)
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => PushService))
    private push?: PushService,
  ) {}

  async create(payload: CreateNotification) {
    const notification = await this.prisma.notification.create({
      data: {
        userId:         payload.userId,
        organizationId: payload.organizationId,
        type:           payload.type,
        title:          payload.title,
        message:        payload.message,
        link:           payload.link,
        data:           payload.data as any,  // Frontend t(`notifications.${type}.title`, data)
      },
    })

    // Push bildirishnoma — fonda, async, xato bildirishnomani to'xtatmasin
    this.push?.sendToUser(payload.userId, {
      title: payload.title,
      body:  payload.message,
      url:   payload.link || '/dashboard',
    }).catch(() => {})

    return notification
  }

  async findAll(userId: string, query: { read?: 'true' | 'false'; limit?: number } = {}) {
    const limit = query.limit ? Math.min(Number(query.limit), 50) : 20
    const where: any = { userId }
    if (query.read === 'true')  where.read = true
    if (query.read === 'false') where.read = false

    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take:    limit,
      }),
      this.prisma.notification.count({ where: { userId, read: false } }),
    ])
    return { items, unreadCount }
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data:  { read: true, readAt: new Date() },
    })
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data:  { read: true, readAt: new Date() },
    })
  }

  async remove(userId: string, id: string) {
    return this.prisma.notification.deleteMany({ where: { id, userId } })
  }
}
