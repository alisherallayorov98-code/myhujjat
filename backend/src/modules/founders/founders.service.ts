import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class FoundersService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string) {
    return this.prisma.tasischi.findMany({
      where:   { organizationId: orgId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async create(orgId: string, dto: {
    ism:       string
    jshshir?:  string
    ulush?:    number
    summa?:    number
    manzil?:   string
    passport?: string
  }) {
    return this.prisma.tasischi.create({
      data: { organizationId: orgId, ...dto },
    })
  }

  async update(id: string, dto: Partial<{
    ism:       string
    jshshir:   string
    ulush:     number
    summa:     number
    manzil:    string
    passport:  string
  }>) {
    return this.prisma.tasischi.update({ where: { id }, data: dto })
  }

  async remove(id: string) {
    return this.prisma.tasischi.delete({ where: { id } })
  }
}
