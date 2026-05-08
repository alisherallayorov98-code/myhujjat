import {
  Injectable, NotFoundException,
  ForbiddenException, BadRequestException, Logger,
} from '@nestjs/common'
import { PrismaService }        from '../prisma/prisma.service'
import { SubscriptionService }  from '../subscriptions/subscription.service'
import { AuditService }         from '../audit/audit.service'
import { NotificationsService } from '../notifications/notifications.service'
import { fillTemplate, CONTRACT_TEMPLATES } from '../../lib/contractTemplates'

export interface CreateContractDto {
  organizationId:  string
  counterpartyId?: string
  contractType:    string
  contractNumber?: string
  contractDate:    string
  endDate?:        string
  city?:           string
  amount?:         number
  content?:        string
  extraData?:      Record<string, string>
  productName?:    string
  specItems?:      any[]
  qqsEnabled?:     boolean
  qqsRate?:        number
  createdByMira?:  boolean
}

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name)

  constructor(
    private prisma:               PrismaService,
    private subService:           SubscriptionService,
    private auditService:         AuditService,
    private notificationsService: NotificationsService,
  ) {}

  private async generateNumber(orgId: string): Promise<string> {
    const now   = new Date()
    const year  = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const count = await this.prisma.contract.count({ where: { organizationId: orgId } })
    return `SH-${year}/${month}-${String(count + 1).padStart(3, '0')}`
  }

  async findAll(orgId: string, query: {
    type?:         string
    status?:       string
    search?:       string
    page?:         number
    limit?:        number
    alertLevel?:   string   // WARNING | CRITICAL | EXCEEDED | CRITICAL_OVERAGE | any
    year?:         number
    month?:        number
    expiringSoon?: boolean  // endDate mavjud va 30 kun ichida tugaydigan shartnomalar
  } = {}) {
    const { type, status, search, page = 1, limit = 20, alertLevel, year, month, expiringSoon } = query

    const now30 = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    const where: any = {
      organizationId: orgId,
      isActive:       true,
      ...(type   && { contractType: type }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { contractNumber: { contains: search, mode: 'insensitive' } },
          { counterparty:   { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
      ...(alertLevel === 'any'
        ? { alertLevel: { not: null } }
        : alertLevel
          ? { alertLevel }
          : {}),
      ...(year && month
        ? { contractDate: { startsWith: `${year}-${String(month).padStart(2, '0')}` } }
        : year
          ? { contractDate: { startsWith: `${year}` } }
          : {}),
      ...(expiringSoon
        ? { endDate: { not: null, lte: now30, gte: new Date() } }
        : {}),
    }

    const [total, contracts] = await Promise.all([
      this.prisma.contract.count({ where }),
      this.prisma.contract.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: alertLevel
          ? [{ totalInvoiced: 'desc' }, { createdAt: 'desc' }]
          : expiringSoon
            ? [{ endDate: 'asc' }]
            : [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        include: {
          counterparty: { select: { id: true, name: true, inn: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
    ])

    return {
      data: contracts,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async findOne(orgId: string, id: string) {
    const contract = await this.prisma.contract.findFirst({
      where:   { id, organizationId: orgId, isActive: true },
      include: {
        counterparty:   true,
        organization:   true,
        versions:       { orderBy: { version: 'desc' }, take: 5 },
        specifications: { take: 5 },
      },
    })
    if (!contract) throw new NotFoundException('Shartnoma topilmadi')
    return contract
  }

  async create(userId: string, dto: CreateContractDto) {
    const canCreate = await this.subService.incrementContractCount(userId)
    if (!canCreate) {
      throw new BadRequestException(
        'Bu oy uchun shartnoma limiti tugadi. Obunangizni yangilang.'
      )
    }

    const org = await this.prisma.organization.findFirst({
      where: { id: dto.organizationId, userId },
    })
    if (!org) throw new ForbiddenException("Ruxsat yo'q")

    const contractNumber = dto.contractNumber || await this.generateNumber(dto.organizationId)

    let content = dto.content

    if (!content && dto.contractType) {
      const cp = dto.counterpartyId
        ? await this.prisma.counterparty.findUnique({ where: { id: dto.counterpartyId } })
        : null

      const templateData = {
        orgNomi:   org.name          || '',
        orgInn:    org.inn           || '',
        orgRahbar: org.directorName  || '',
        orgBank:   org.bankName      || '',
        orgHisob:  org.bankAccount   || '',
        orgMfo:    org.mfo           || '',
        orgManzil: org.address       || '',
        cpNomi:    cp?.name          || '',
        cpInn:     cp?.inn           || '',
        cpRahbar:  cp?.directorName  || '',
        cpBank:    cp?.bankName      || '',
        cpHisob:   cp?.bankAccount   || '',
        cpMfo:     cp?.mfo           || '',
        cpManzil:  cp?.address       || '',
        raqam:     contractNumber,
        sana:      dto.contractDate,
        shahar:    dto.city || 'Toshkent',
        summa:     dto.amount?.toLocaleString('uz-UZ') || '0',
        summaMatn: '',
        extra:     dto.extraData || {},
      }

      const template = CONTRACT_TEMPLATES[dto.contractType]
      if (template) content = fillTemplate(template, templateData)
    }

    const contract = await this.prisma.contract.create({
      data: {
        organizationId: dto.organizationId,
        counterpartyId: dto.counterpartyId,
        contractNumber,
        contractDate:   dto.contractDate,
        endDate:        dto.endDate ? new Date(dto.endDate) : undefined,
        contractType:   dto.contractType as any,
        city:           dto.city || 'Toshkent',
        amount:         dto.amount || 0,
        content,
        extraData:      dto.extraData,
        productName:    dto.productName,
        specItems:      dto.specItems,
        qqsEnabled:     dto.qqsEnabled || false,
        qqsRate:        dto.qqsRate || 12,
        createdByMira:  dto.createdByMira || false,
        status:         'DRAFT',
      },
      include: {
        counterparty: true,
        organization: true,
      },
    })

    this.auditService.log({
      userId:          userId,
      organizationId:  dto.organizationId,
      action:          'CONTRACT_CREATED',
      entityType:      'contract',
      entityId:        contract.id,
      details:         { contractNumber },
    }).catch((err: any) => this.logger.error(`Audit log xato: ${err?.message}`))

    this.notificationsService.create({
      userId,
      organizationId: dto.organizationId,
      type:           'CONTRACT_CREATED',
      title:          'Yangi shartnoma yaratildi',
      message:        `${contractNumber} raqamli shartnoma muvaffaqiyatli yaratildi`,
      link:           `/dashboard/shartnomalar/${contract.id}`,
      data:           { contractNumber },  // Frontend tarjima params
    }).catch((err: any) => this.logger.error(`Notification yaratishda xato: ${err?.message}`))

    return contract
  }

  async update(orgId: string, id: string, dto: Partial<CreateContractDto>) {
    const existing = await this.prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Shartnoma topilmadi')

    if (existing.content && dto.content && existing.content !== dto.content) {
      const versionCount = await this.prisma.contractVersion.count({
        where: { contractId: id },
      })
      await this.prisma.contractVersion.create({
        data: { contractId: id, version: versionCount + 1, content: existing.content },
      })
    }

    const { endDate, ...rest } = dto as any
    return this.prisma.contract.update({
      where: { id },
      data:  {
        ...rest,
        ...(endDate !== undefined ? { endDate: endDate ? new Date(endDate) : null } : {}),
        updatedAt: new Date(),
      },
    })
  }

  async updateStatus(orgId: string, id: string, status: string) {
    const existing = await this.prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Shartnoma topilmadi')
    return this.prisma.contract.update({ where: { id }, data: { status: status as any } })
  }

  async remove(orgId: string, id: string, userId?: string) {
    const existing = await this.prisma.contract.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Shartnoma topilmadi')

    const result = await this.prisma.contract.update({ where: { id }, data: { isActive: false } })

    if (userId) {
      this.auditService.log({
        userId,
        organizationId: orgId,
        action:         'CONTRACT_DELETED',
        entityType:     'contract',
        entityId:       id,
        details:        { contractNumber: existing.contractNumber },
      })
    }

    return result
  }

  async getStats(orgId: string) {
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)

    const [total, active, draft, completed, cancelled, thisMonth, totalAmountAgg] = await Promise.all([
      this.prisma.contract.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'ACTIVE',     isActive: true } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'DRAFT',      isActive: true } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'COMPLETED',  isActive: true } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'CANCELLED',  isActive: true } }),
      this.prisma.contract.count({
        where: { organizationId: orgId, isActive: true, createdAt: { gte: monthStart } },
      }),
      // Faol shartnomalarning umumiy summasi
      this.prisma.contract.aggregate({
        where: { organizationId: orgId, isActive: true, status: { in: ['ACTIVE', 'COMPLETED'] } },
        _sum:  { amount: true },
      }),
    ])

    return {
      total,
      active,
      draft,
      completed,
      cancelled,
      thisMonth,
      totalAmount: Number(totalAmountAgg._sum.amount || 0),
    }
  }

  /**
   * Shartnoma timeline'i: audit log + versiyalar birlashtirilgan ro'yxat.
   * Frontend timeline kartochkasi uchun ishlatadi.
   */
  async getTimeline(orgId: string, id: string) {
    // Tashkilot foydalanuvchilarining ID'lari (boshqa tashkilot audit log'lari kirmasin)
    const orgMembers = await this.prisma.orgMember.findMany({
      where:  { organizationId: orgId },
      select: { userId: true },
    })
    const orgUserIds = orgMembers.map(m => m.userId)

    const [auditLogs, versions] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          entity: 'contract',
          entityId: id,
          userId: { in: orgUserIds },
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
        },
      }),
      this.prisma.contractVersion.findMany({
        where: { contractId: id },
        orderBy: { version: 'desc' },
        take: 20,
        select: { id: true, version: true, changedBy: true, createdAt: true },
      }),
    ])

    // Ikkalasini birlashtirib, ko'rinish uchun normalizatsiya qilamiz
    const events = [
      ...auditLogs.map(l => ({
        kind:      'audit' as const,
        id:        l.id,
        action:    l.action,
        details:   l.newData,
        createdAt: l.createdAt,
        user:      l.user
          ? { id: l.user.id, name: [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') || l.user.email }
          : null,
        ipAddress: l.ipAddress,
      })),
      ...versions.map(v => ({
        kind:      'version' as const,
        id:        v.id,
        action:    'CONTRACT_VERSION',
        details:   { version: v.version },
        createdAt: v.createdAt,
        user:      v.changedBy ? { id: v.changedBy, name: '' } : null,
        ipAddress: null,
      })),
    ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

    return { events }
  }

  async togglePin(orgId: string, id: string) {
    const c = await this.prisma.contract.findFirst({
      where: { id, organizationId: orgId, isActive: true },
      select: { id: true, isPinned: true },
    })
    if (!c) throw new NotFoundException('Shartnoma topilmadi')
    return this.prisma.contract.update({
      where: { id: c.id },
      data:  { isPinned: !c.isPinned },
      select: { id: true, isPinned: true },
    })
  }

  async bulkDelete(orgId: string, ids: string[]) {
    if (!Array.isArray(ids) || ids.length === 0) return { deleted: 0 }
    // Soft delete + multi-tenant guard (faqat ushbu tashkilot shartnomalari)
    const res = await this.prisma.contract.updateMany({
      where: { id: { in: ids }, organizationId: orgId, isActive: true },
      data:  { isActive: false },
    })
    return { deleted: res.count }
  }
}
