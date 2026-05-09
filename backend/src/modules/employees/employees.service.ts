import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

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

export interface CreateLeaveDto {
  type:      string   // YILLIK | KASAL | TUGILISH | BEPUL | IJTIMOIY | HARBIY
  startDate: string   // ISO date string
  endDate:   string   // ISO date string
  reason?:   string
  orderNum?: string
  status?:   string   // default: APPROVED
}

const YEARLY_LEAVE_DAYS = 28

@Injectable()
export class EmployeesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: {
    search?: string
    page?:   number
    limit?:  number
    bolim?:  string
    status?: string   // 'active' | 'inactive'
  } = {}) {
    const { search, page = 1, bolim, status } = query
    const limit = Math.min(query.limit || 20, 100)

    const where: any = { organizationId: orgId }

    if (status === 'inactive') {
      where.isActive = false
    } else if (status === 'active' || !status) {
      where.isActive = true
    }
    // status === 'all' → isActive filter yo'q

    if (bolim) {
      where.bolim = { equals: bolim, mode: 'insensitive' as const }
    }

    if (search) {
      where.OR = [
        { ism:     { contains: search, mode: 'insensitive' as const } },
        { lavozim: { contains: search, mode: 'insensitive' as const } },
        { bolim:   { contains: search, mode: 'insensitive' as const } },
      ]
    }

    const [total, data] = await Promise.all([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(id: string, orgId: string) {
    const emp = await this.prisma.employee.findFirst({
      where: { id, organizationId: orgId },
    })
    if (!emp) throw new NotFoundException('Xodim topilmadi')

    const [docsCount, leavesThisYear] = await Promise.all([
      this.prisma.document.count({
        where: { employeeId: id, isActive: true },
      }),
      this.prisma.employeeLeave.findMany({
        where: {
          employeeId:    id,
          organizationId: orgId,
          type:           'YILLIK',
          status:         'APPROVED',
          startDate: {
            gte: new Date(new Date().getFullYear(), 0, 1),
            lt:  new Date(new Date().getFullYear() + 1, 0, 1),
          },
        },
        select: { days: true },
      }),
    ])

    const usedLeaveDays = leavesThisYear.reduce((sum, l) => sum + l.days, 0)

    return {
      ...emp,
      docsCount,
      leaveBalance: {
        yearly:     YEARLY_LEAVE_DAYS,
        used:       usedLeaveDays,
        remaining:  Math.max(0, YEARLY_LEAVE_DAYS - usedLeaveDays),
      },
    }
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

  // ─── Ta'tillar ────────────────────────────────────────────────

  async createLeave(employeeId: string, orgId: string, dto: CreateLeaveDto) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId },
    })
    if (!emp) throw new NotFoundException('Xodim topilmadi')

    const start = new Date(dto.startDate)
    const end   = new Date(dto.endDate)
    const days  = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)

    return this.prisma.employeeLeave.create({
      data: {
        organizationId: orgId,
        employeeId,
        type:      dto.type,
        startDate: start,
        endDate:   end,
        days,
        reason:    dto.reason,
        orderNum:  dto.orderNum,
        status:    dto.status || 'APPROVED',
      },
    })
  }

  async getLeaves(employeeId: string, orgId: string, year?: number) {
    const emp = await this.prisma.employee.findFirst({
      where: { id: employeeId, organizationId: orgId },
    })
    if (!emp) throw new NotFoundException('Xodim topilmadi')

    const where: any = { employeeId, organizationId: orgId }
    if (year) {
      where.startDate = {
        gte: new Date(year, 0, 1),
        lt:  new Date(year + 1, 0, 1),
      }
    }

    const leaves = await this.prisma.employeeLeave.findMany({
      where,
      orderBy: { startDate: 'desc' },
    })

    const currentYear = year || new Date().getFullYear()
    const yearlyUsed  = leaves
      .filter(l => l.type === 'YILLIK' && l.status === 'APPROVED' &&
        new Date(l.startDate).getFullYear() === currentYear)
      .reduce((s, l) => s + l.days, 0)

    return {
      leaves,
      balance: {
        yearly:    YEARLY_LEAVE_DAYS,
        used:      yearlyUsed,
        remaining: Math.max(0, YEARLY_LEAVE_DAYS - yearlyUsed),
        year:      currentYear,
      },
    }
  }

  async deleteLeave(employeeId: string, orgId: string, leaveId: string) {
    const leave = await this.prisma.employeeLeave.findFirst({
      where: { id: leaveId, employeeId, organizationId: orgId },
    })
    if (!leave) throw new NotFoundException("Ta'til topilmadi")
    return this.prisma.employeeLeave.delete({ where: { id: leaveId } })
  }
}
