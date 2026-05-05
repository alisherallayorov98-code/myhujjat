import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SpecService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.specification.findMany({
      where:   { organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      include: {
        contract:     { select: { id: true, contractNumber: true, contractType: true, counterpartyId: true } },
        counterparty: { select: { id: true, name: true, inn: true } },
      },
    })
  }

  async findOne(orgId: string, id: string) {
    const spec = await this.prisma.specification.findFirst({
      where:   { id, organizationId: orgId },
      include: {
        contract:     true,
        counterparty: true,
      },
    })
    if (!spec) throw new NotFoundException('Spesifikatsiya topilmadi')
    return spec
  }

  async create(dto: {
    organizationId: string
    contractId?:    string
    counterpartyId?: string
    specNumber?:    string
    items:          any[]
    notes?:         string
  }) {
    // Foydalanuvchi bergan raqam yoki avtomatik
    let specNumber = dto.specNumber?.trim()
    if (!specNumber) {
      const count = await this.prisma.specification.count({
        where: { organizationId: dto.organizationId },
      })
      const year = new Date().getFullYear()
      specNumber = `SPEC-${year}-${String(count + 1).padStart(3, '0')}`
    }

    // Agar shartnomadan kelgan kontragent bo'lsa va alohida counterpartyId
    // berilmagan bo'lsa, shartnomadan olamiz
    let counterpartyId = dto.counterpartyId
    if (!counterpartyId && dto.contractId) {
      const c = await this.prisma.contract.findFirst({
        where: { id: dto.contractId, organizationId: dto.organizationId },
        select: { counterpartyId: true },
      })
      if (c?.counterpartyId) counterpartyId = c.counterpartyId
    }

    return this.prisma.specification.create({
      data: {
        organizationId: dto.organizationId,
        contractId:     dto.contractId,
        counterpartyId,
        specNumber,
        items:          dto.items,
        notes:          dto.notes || '',
      },
      include: {
        contract:     true,
        counterparty: true,
      },
    })
  }

  async update(orgId: string, id: string, dto: {
    items?:          any[]
    notes?:          string
    contractId?:     string
    counterpartyId?: string
  }) {
    const existing = await this.prisma.specification.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Spesifikatsiya topilmadi')
    return this.prisma.specification.update({
      where: { id },
      data:  { ...dto, updatedAt: new Date() },
    })
  }

  async remove(orgId: string, id: string) {
    const existing = await this.prisma.specification.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!existing) throw new NotFoundException('Spesifikatsiya topilmadi')
    return this.prisma.specification.delete({ where: { id } })
  }
}
