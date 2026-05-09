import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService }                  from '../prisma/prisma.service'

export interface CreateCaseDto {
  organizationId:  string
  title:           string
  type:            string
  counterpartyId?: string
  amount?:         number
  deadline?:       string
  notes?:          string
}

export interface UpdateCaseDto {
  title?:          string
  status?:         string
  amount?:         number
  deadline?:       string
  notes?:          string
  counterpartyId?: string
}

export interface SaveDocumentDto {
  type:    string
  title:   string
  content: string
}

@Injectable()
export class LegalService {
  constructor(private prisma: PrismaService) {}

  // ── Stats ──────────────────────────────────────────────────────────────────

  async getStats(orgId: string) {
    const [open, inProgress, resolved, closed, overdue] = await Promise.all([
      this.prisma.legalCase.count({ where: { organizationId: orgId, status: 'OPEN',        isActive: true } }),
      this.prisma.legalCase.count({ where: { organizationId: orgId, status: 'IN_PROGRESS', isActive: true } }),
      this.prisma.legalCase.count({ where: { organizationId: orgId, status: 'RESOLVED',    isActive: true } }),
      this.prisma.legalCase.count({ where: { organizationId: orgId, status: 'CLOSED',      isActive: true } }),
      this.prisma.legalCase.count({
        where: {
          organizationId: orgId,
          isActive: true,
          status:   { in: ['OPEN', 'IN_PROGRESS'] },
          deadline: { lt: new Date() },
        },
      }),
    ])

    const amountAgg = await this.prisma.legalCase.aggregate({
      where: { organizationId: orgId, isActive: true },
      _sum:  { amount: true },
    })

    return {
      open, inProgress, resolved, closed,
      overdueCount: overdue,
      totalAmount:  amountAgg._sum.amount || 0,
    }
  }

  // ── Deadlines ──────────────────────────────────────────────────────────────

  async getDeadlines(orgId: string) {
    const now     = new Date()
    const in2days = new Date(now.getTime() + 2  * 24 * 60 * 60 * 1000)
    const in7days = new Date(now.getTime() + 7  * 24 * 60 * 60 * 1000)

    const cases = await this.prisma.legalCase.findMany({
      where: {
        organizationId: orgId,
        isActive:       true,
        status:         { in: ['OPEN', 'IN_PROGRESS'] },
        deadline:       { not: null, lte: in7days },
      },
      orderBy: { deadline: 'asc' },
      include: { counterparty: { select: { id: true, name: true } } },
    })

    const overdue    = cases.filter(c => new Date(c.deadline!) < now)
    const urgent     = cases.filter(c => {
      const d = new Date(c.deadline!)
      return d >= now && d <= in2days
    })
    const approaching = cases.filter(c => {
      const d = new Date(c.deadline!)
      return d > in2days && d <= in7days
    })

    return { overdue, urgent, approaching }
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async findAll(orgId: string, query: {
    status?: string; type?: string; page?: number; limit?: number
  } = {}) {
    const { status, type, page = 1 } = query
    const limit = Math.min(query.limit || 20, 100)

    const where: any = { organizationId: orgId, isActive: true }
    if (status) where.status = status
    if (type)   where.type   = type

    const [total, data] = await Promise.all([
      this.prisma.legalCase.count({ where }),
      this.prisma.legalCase.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: {
          counterparty: { select: { id: true, name: true } },
          _count:       { select: { documents: true } },
        },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(orgId: string, id: string) {
    const c = await this.prisma.legalCase.findFirst({
      where:   { id, organizationId: orgId, isActive: true },
      include: {
        counterparty: { select: { id: true, name: true, inn: true, directorName: true, address: true } },
        documents:    { orderBy: { createdAt: 'desc' } },
      },
    })
    if (!c) throw new NotFoundException('Ish topilmadi')
    return c
  }

  async create(dto: CreateCaseDto) {
    const lc = await this.prisma.legalCase.create({
      data: {
        organizationId: dto.organizationId,
        title:          dto.title,
        type:           dto.type,
        counterpartyId: dto.counterpartyId || null,
        amount:         dto.amount         || null,
        deadline:       dto.deadline       ? new Date(dto.deadline) : null,
        notes:          dto.notes          || null,
      },
    })
    await this.prisma.legalCaseActivity.create({
      data: { caseId: lc.id, action: 'CREATED', newValue: lc.title },
    })
    return lc
  }

  async update(orgId: string, id: string, dto: UpdateCaseDto) {
    const existing = await this.findOne(orgId, id)
    const updated  = await this.prisma.legalCase.update({
      where: { id },
      data:  {
        ...dto,
        deadline:  dto.deadline !== undefined ? (dto.deadline ? new Date(dto.deadline) : null) : undefined,
        updatedAt: new Date(),
      },
    })
    if (dto.status && dto.status !== existing.status) {
      await this.prisma.legalCaseActivity.create({
        data: {
          caseId:   id,
          action:   'STATUS_CHANGED',
          oldValue: existing.status,
          newValue: dto.status,
        },
      })
    }
    return updated
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id)
    return this.prisma.legalCase.update({
      where: { id },
      data:  { isActive: false },
    })
  }

  async saveDocument(orgId: string, caseId: string, dto: SaveDocumentDto) {
    await this.findOne(orgId, caseId)
    const [doc] = await Promise.all([
      this.prisma.legalDocument.create({
        data: { caseId, type: dto.type, title: dto.title, content: dto.content },
      }),
      this.prisma.legalCaseActivity.create({
        data: { caseId, action: 'DOCUMENT_ADDED', newValue: dto.title },
      }),
    ])
    return doc
  }

  // ── Activity ───────────────────────────────────────────────────────────────

  async getActivity(orgId: string, caseId: string) {
    await this.findOne(orgId, caseId)
    const activities = await this.prisma.legalCaseActivity.findMany({
      where:   { caseId },
      orderBy: { createdAt: 'desc' },
    })
    return { activities }
  }

  async addNote(orgId: string, caseId: string, note: string) {
    await this.findOne(orgId, caseId)
    const activity = await this.prisma.legalCaseActivity.create({
      data: { caseId, action: 'NOTE_ADDED', note },
    })
    await this.prisma.legalCase.update({
      where: { id: caseId },
      data:  { updatedAt: new Date() },
    })
    return activity
  }
}
