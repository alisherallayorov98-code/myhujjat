import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService }                  from '../prisma/prisma.service'

export interface CreateEmployeeDto {
  organizationId: string
  ism:            string
  jshshir?:       string
  passport?:      string
  lavozim?:       string
  bolim?:         string
  maosh?:         string
  ishBoshi?:      string
  tel?:           string
  tugilganSana?:  string
  manzil?:        string
}

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, search?: string) {
    return this.prisma.employee.findMany({
      where: {
        organizationId: orgId,
        isActive:       true,
        ...(search && {
          OR: [
            { ism:     { contains: search, mode: 'insensitive' } },
            { lavozim: { contains: search, mode: 'insensitive' } },
            { bolim:   { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async create(dto: CreateEmployeeDto) {
    return this.prisma.employee.create({ data: dto })
  }

  async update(id: string, dto: Partial<CreateEmployeeDto>) {
    const emp = await this.prisma.employee.findUnique({ where: { id } })
    if (!emp) throw new NotFoundException('Xodim topilmadi')
    return this.prisma.employee.update({
      where: { id },
      data:  { ...dto, updatedAt: new Date() },
    })
  }

  async remove(id: string) {
    return this.prisma.employee.update({
      where: { id },
      data:  { isActive: false },
    })
  }

  async getStats(orgId: string) {
    const [total, active, bolimlar] = await Promise.all([
      this.prisma.employee.count({ where: { organizationId: orgId } }),
      this.prisma.employee.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.employee.groupBy({
        by:    ['bolim'],
        where: { organizationId: orgId, isActive: true },
        _count: { id: true },
      }),
    ])
    return { total, active, bolimlar }
  }
}
