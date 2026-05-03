import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type AuditAction =
  // Foydalanuvchi
  | 'USER_LOGIN'              | 'USER_LOGIN_FAILED'    | 'USER_LOGOUT'
  | 'USER_REGISTERED'         | 'PASSWORD_CHANGED'      | 'PASSWORD_RESET_REQUESTED'
  | 'EMAIL_VERIFIED'          | 'PROFILE_UPDATED'
  // Tashkilot
  | 'ORG_CREATED'             | 'ORG_UPDATED'           | 'ORG_DELETED'
  | 'MEMBER_INVITED'          | 'MEMBER_REMOVED'
  // Shartnoma
  | 'CONTRACT_CREATED'        | 'CONTRACT_UPDATED'      | 'CONTRACT_DELETED'
  | 'CONTRACT_STATUS_CHANGED' | 'CONTRACT_SIGNED'
  | 'CONTRACT_EXPORTED'       | 'CONTRACT_SHARED'       | 'CONTRACT_PUBLIC_SIGNED'
  | 'BULK_CONTRACTS_CREATED'
  // Kontragent
  | 'COUNTERPARTY_CREATED'    | 'COUNTERPARTY_UPDATED'  | 'COUNTERPARTY_DELETED'
  // Xodim
  | 'EMPLOYEE_CREATED'        | 'EMPLOYEE_UPDATED'      | 'EMPLOYEE_DELETED'
  // Hujjat
  | 'DOCUMENT_EXPORTED'       | 'DOCUMENT_DELETED'
  // Faktura / Invoice
  | 'INVOICE_CREATED'         | 'INVOICE_DELETED'       | 'INVOICE_IMPORTED'
  // Obuna va to'lov
  | 'SUBSCRIPTION_ACTIVATED'  | 'SUBSCRIPTION_CANCELLED' | 'PAYMENT_RECEIVED'
  // Integratsiya
  | 'DIDOX_CONNECTED'         | 'DIDOX_DISCONNECTED'    | 'TELEGRAM_LINKED'
  // Xavfsizlik
  | 'SUSPICIOUS_ACTIVITY'     | 'IP_BLOCKED'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId:          string
    organizationId?: string
    action:          AuditAction
    entityType?:     string
    entityId?:       string
    details?:        Record<string, any>
    ipAddress?:      string
    userAgent?:      string
  }) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          userId:    params.userId,
          action:    params.action,
          entity:    params.entityType,
          entityId:  params.entityId,
          newData:   params.details ?? undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      })
    } catch {
      // Audit log xatosi asosiy oqimni to'xtatmasin
    }
  }

  async findAll(orgId: string, query: {
    userId?: string
    action?: string
    page?:   number
    limit?:  number
  } = {}) {
    const { userId, action, page = 1, limit = 50 } = query

    // orgId orqali foydalanuvchilarni topamiz
    const orgMembers = await this.prisma.orgMember.findMany({
      where:  { organizationId: orgId },
      select: { userId: true },
    })
    const orgUserIds = orgMembers.map(m => m.userId)

    const where: any = {
      userId: { in: orgUserIds },
      ...(userId && { userId }),
      ...(action && { action }),
    }

    const [total, logs] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, firstName: true } },
        },
      }),
    ])

    return {
      data: logs,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }
}
