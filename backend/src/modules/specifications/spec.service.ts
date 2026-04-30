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
        contract: {
          select: { id: true, contractNumber: true, contractType: true },
        },
      },
    })
  }

  async findOne(orgId: string, id: string) {
    const spec = await this.prisma.specification.findFirst({
      where:   { id, organizationId: orgId },
      include: { contract: true },
    })
    if (!spec) throw new NotFoundException('Spesifikatsiya topilmadi')
    return spec
  }

  async create(dto: {
    organizationId: string
    contractId?:    string
    items:          any[]
    notes?:         string
  }) {
    const count      = await this.prisma.specification.count({
      where: { organizationId: dto.organizationId },
    })
    const year       = new Date().getFullYear()
    const specNumber = `SPEC-${year}-${String(count + 1).padStart(3, '0')}`

    return this.prisma.specification.create({
      data: {
        organizationId: dto.organizationId,
        contractId:     dto.contractId,
        specNumber,
        items:          dto.items,
        notes:          dto.notes || '',
      },
      include: { contract: true },
    })
  }

  async update(orgId: string, id: string, dto: {
    items?:      any[]
    notes?:      string
    contractId?: string
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
