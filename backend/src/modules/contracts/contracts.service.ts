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
  city?:           string
  amount?:         number
  content?:        string
  extraData?:      Record<string, string>
  productName?:    string
  specItems?:      any[]
  qqsEnabled?:     boolean
  qqsRate?:        number
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
    type?:   string
    status?: string
    search?: string
    page?:   number
    limit?:  number
  } = {}) {
    const { type, status, search, page = 1, limit = 20 } = query

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
    }

    const [total, contracts] = await Promise.all([
      this.prisma.contract.count({ where }),
      this.prisma.contract.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
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
        contractType:   dto.contractType as any,
        city:           dto.city || 'Toshkent',
        amount:         dto.amount || 0,
        content,
        extraData:      dto.extraData,
        productName:    dto.productName,
        specItems:      dto.specItems,
        qqsEnabled:     dto.qqsEnabled || false,
        qqsRate:        dto.qqsRate || 12,
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

    return this.prisma.contract.update({
      where: { id },
      data:  { ...(dto as any), updatedAt: new Date() },
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
    const [total, active, draft, completed] = await Promise.all([
      this.prisma.contract.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'DRAFT' } }),
      this.prisma.contract.count({ where: { organizationId: orgId, status: 'COMPLETED' } }),
    ])
    return { total, active, draft, completed }
  }
}
