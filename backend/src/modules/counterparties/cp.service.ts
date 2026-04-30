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

  async findAll(orgId: string) {
    return this.prisma.counterparty.findMany({
      where:   { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
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
