import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateCpDto {
  organizationId: string
  name:           string
  inn?:           string
  directorName?:  string
  bankName?:      string
  bankAccount?:   string
  mfo?:           string
  address?:       string
  phone?:         string
  qqsReg?:        string
}

/**
 * MULTI-TENANT XAVFSIZLIK:
 * Controller'da `requireResourceOwnership` chaqirilgan, lekin defense-in-depth
 * uchun service ichida ham `organizationId` filter qo'shamiz. Bu — agar controller
 * guard'i unutib qoldirilsa ham, ma'lumotlar yopiq qoladi.
 */
@Injectable()
export class CounterpartiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: {
    page?:   number
    limit?:  number
    search?: string
  } = {}) {
    const { page = 1, search } = query
    const limit = Math.min(query.limit || 20, 100)

    const where: any = {
      organizationId: orgId,
      isActive:       true,
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { inn:  { contains: search } },
        ],
      }),
    }

    const [total, data] = await Promise.all([
      this.prisma.counterparty.count({ where }),
      this.prisma.counterparty.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  /** orgId — defense-in-depth: agar uzatilsa, kontragent shu org'ga tegishli ekan */
  async findOne(id: string, orgId?: string) {
    const where: any = orgId ? { id, organizationId: orgId } : { id }
    const cp = await this.prisma.counterparty.findFirst({ where })
    if (!cp) throw new NotFoundException("Kontragent topilmadi")
    return cp
  }

  async create(dto: CreateCpDto) {
    return this.prisma.counterparty.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateCpDto>, orgId?: string) {
    if (orgId) {
      const cp = await this.prisma.counterparty.findFirst({
        where: { id, organizationId: orgId },
        select: { id: true },
      })
      if (!cp) throw new NotFoundException("Kontragent topilmadi")
    }
    return this.prisma.counterparty.update({
      where: { id },
      data:  { ...dto, updatedAt: new Date() }
    })
  }

  async updateStirStatus(id: string, status: string, orgId?: string) {
    if (orgId) {
      const cp = await this.prisma.counterparty.findFirst({
        where: { id, organizationId: orgId },
        select: { id: true },
      })
      if (!cp) throw new NotFoundException("Kontragent topilmadi")
    }
    return this.prisma.counterparty.update({
      where: { id },
      data:  { stirStatus: status, stirCheckedAt: new Date() }
    })
  }

  async remove(id: string, orgId?: string) {
    if (orgId) {
      const cp = await this.prisma.counterparty.findFirst({
        where: { id, organizationId: orgId },
        select: { id: true },
      })
      if (!cp) throw new NotFoundException("Kontragent topilmadi")
    }
    return this.prisma.counterparty.update({
      where: { id },
      data:  { isActive: false }
    })
  }
}
