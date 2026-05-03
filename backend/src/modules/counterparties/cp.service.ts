import { Injectable } from '@nestjs/common'
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

  async findOne(id: string) {
    return this.prisma.counterparty.findUnique({ where: { id } })
  }

  async create(dto: CreateCpDto) {
    return this.prisma.counterparty.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateCpDto>) {
    return this.prisma.counterparty.update({
      where: { id },
      data:  { ...dto, updatedAt: new Date() }
    })
  }

  async updateStirStatus(id: string, status: string) {
    return this.prisma.counterparty.update({
      where: { id },
      data:  { stirStatus: status, stirCheckedAt: new Date() }
    })
  }

  async remove(id: string) {
    return this.prisma.counterparty.update({
      where: { id },
      data:  { isActive: false }
    })
  }
}
