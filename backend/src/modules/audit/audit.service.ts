import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export type AuditAction =
  // Foydalanuvchi
  | 'USER_LOGIN'              | 'USER_LOGIN_FAILED'    | 'USER_LOGOUT'
  | 'USER_EIMZO_LOGIN'
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

export type AuditCategory =
  | 'user'
  | 'org'
  | 'contract'
  | 'counterparty'
  | 'employee'
  | 'document'
  | 'invoice'
  | 'subscription'
  | 'integration'
  | 'security'

export const AUDIT_CATEGORY_MAP: Record<AuditAction, AuditCategory> = {
  USER_LOGIN:               'user',
  USER_LOGIN_FAILED:        'user',
  USER_EIMZO_LOGIN:         'user',
  USER_LOGOUT:              'user',
  USER_REGISTERED:          'user',
  PASSWORD_CHANGED:         'user',
  PASSWORD_RESET_REQUESTED: 'user',
  EMAIL_VERIFIED:           'user',
  PROFILE_UPDATED:          'user',

  ORG_CREATED:              'org',
  ORG_UPDATED:              'org',
  ORG_DELETED:              'org',
  MEMBER_INVITED:           'org',
  MEMBER_REMOVED:           'org',

  CONTRACT_CREATED:         'contract',
  CONTRACT_UPDATED:         'contract',
  CONTRACT_DELETED:         'contract',
  CONTRACT_STATUS_CHANGED:  'contract',
  CONTRACT_SIGNED:          'contract',
  CONTRACT_EXPORTED:        'contract',
  CONTRACT_SHARED:          'contract',
  CONTRACT_PUBLIC_SIGNED:   'contract',
  BULK_CONTRACTS_CREATED:   'contract',

  COUNTERPARTY_CREATED:     'counterparty',
  COUNTERPARTY_UPDATED:     'counterparty',
  COUNTERPARTY_DELETED:     'counterparty',

  EMPLOYEE_CREATED:         'employee',
  EMPLOYEE_UPDATED:         'employee',
  EMPLOYEE_DELETED:         'employee',

  DOCUMENT_EXPORTED:        'document',
  DOCUMENT_DELETED:         'document',

  INVOICE_CREATED:          'invoice',
  INVOICE_DELETED:          'invoice',
  INVOICE_IMPORTED:         'invoice',

  SUBSCRIPTION_ACTIVATED:   'subscription',
  SUBSCRIPTION_CANCELLED:   'subscription',
  PAYMENT_RECEIVED:         'subscription',

  DIDOX_CONNECTED:          'integration',
  DIDOX_DISCONNECTED:       'integration',
  TELEGRAM_LINKED:          'integration',

  SUSPICIOUS_ACTIVITY:      'security',
  IP_BLOCKED:               'security',
}

// Kategoriya bo'yicha barcha action'larni qaytaradi
function actionsForCategory(category: AuditCategory): AuditAction[] {
  return (Object.entries(AUDIT_CATEGORY_MAP) as [AuditAction, AuditCategory][])
    .filter(([, cat]) => cat === category)
    .map(([action]) => action)
}

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
    userId?:   string
    action?:   string
    category?: AuditCategory
    page?:     number
    limit?:    number
  } = {}) {
    const { userId, action, category, page = 1, limit = 50 } = query

    // orgId orqali foydalanuvchilarni topamiz
    const orgMembers = await this.prisma.orgMember.findMany({
      where:  { organizationId: orgId },
      select: { userId: true },
    })
    const orgUserIds = orgMembers.map(m => m.userId)

    // Kategoriya bo'yicha action'lar ro'yxatini olamiz
    const categoryActions = category ? actionsForCategory(category) : undefined

    const where: any = {
      userId: { in: orgUserIds },
      ...(userId && { userId }),
      ...(action && { action }),
      ...(categoryActions && { action: { in: categoryActions } }),
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
