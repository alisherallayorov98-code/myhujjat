import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService }                  from '../prisma/prisma.service'
import { DocumentType, DocStatus }        from '@prisma/client'

export interface CreateDocDto {
  organizationId: string
  type:           DocumentType
  title:          string
  docDate?:       string
  content:        Record<string, unknown>
  status?:        DocStatus
}

export interface UpdateDocDto {
  title?:   string
  docDate?: string
  content?: Record<string, unknown>
  status?:  DocStatus
}

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CRUD (kotib, buxgalter, kadrlar sahifalari)
  // ============================================

  async findAll(orgId: string, query: {
    type?:  DocumentType
    page?:  number
    limit?: number
  } = {}) {
    const { type, page = 1 } = query
    const limit = Math.min(query.limit || 30, 100)
    const where = { organizationId: orgId, isActive: true, ...(type ? { type } : {}) }

    const [total, data] = await Promise.all([
      this.prisma.document.count({ where }),
      this.prisma.document.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, type: true, title: true, number: true,
          docDate: true, status: true, createdAt: true,
        },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(orgId: string, id: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id, organizationId: orgId, isActive: true },
    })
    if (!doc) throw new NotFoundException('Hujjat topilmadi')
    return doc
  }

  async create(dto: CreateDocDto) {
    const number = await this.generateNumber(dto.organizationId, dto.type)
    return this.prisma.document.create({
      data: {
        organizationId: dto.organizationId,
        type:           dto.type,
        title:          dto.title,
        number,
        docDate:        dto.docDate,
        content:        dto.content as any,
        status:         dto.status ?? 'DRAFT',
      },
    })
  }

  async update(orgId: string, id: string, dto: UpdateDocDto) {
    await this.findOne(orgId, id)
    return this.prisma.document.update({
      where: { id },
      data:  { ...dto, content: dto.content as any, updatedAt: new Date() },
    })
  }

  async remove(orgId: string, id: string) {
    await this.findOne(orgId, id)
    return this.prisma.document.update({
      where: { id },
      data:  { isActive: false },
    })
  }

  private async generateNumber(orgId: string, type: DocumentType): Promise<string> {
    const year   = new Date().getFullYear()
    const prefix = type === 'BUYRUQ' ? 'BUY' : type === 'BAYONNOMA' ? 'BAY' : 'DOC'
    const count  = await this.prisma.document.count({
      where: { organizationId: orgId, type },
    })
    return `${prefix}-${year}-${String(count + 1).padStart(3, '0')}`
  }

  // ============================================
  // SEIF — barcha hujjatlar agregatoru
  // ============================================

  async findSeif(orgId: string, query: {
    search?: string
    type?:   string
    page?:   number
    limit?:  number
  } = {}) {
    const { search, type, page = 1, limit = 30 } = query

    const contractWhere: any = {
      organizationId: orgId,
      isActive:       true,
      ...(search && {
        OR: [
          { contractNumber: { contains: search, mode: 'insensitive' } },
          { counterparty:   { name: { contains: search, mode: 'insensitive' } } },
        ],
      }),
    }

    const aiWhere: any = {
      organizationId: orgId,
      isActive:       true,
      ...(search && {
        OR: [
          { title:   { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ],
      }),
    }

    const skipContracts = type && type !== 'contract'
    const skipAi        = type && type !== 'ai'

    const [contracts, aiDocs, totalContracts, totalAi] = await Promise.all([
      skipContracts
        ? []
        : this.prisma.contract.findMany({
            where:   contractWhere,
            take:    limit,
            skip:    (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
            include: { counterparty: { select: { id: true, name: true } } },
          }),
      skipAi
        ? []
        : this.prisma.aiDocument.findMany({
            where:   aiWhere,
            take:    limit,
            skip:    (page - 1) * limit,
            orderBy: { createdAt: 'desc' },
          }),
      skipContracts ? 0 : this.prisma.contract.count({ where: contractWhere }),
      skipAi        ? 0 : this.prisma.aiDocument.count({ where: aiWhere }),
    ])

    const normalizedContracts = contracts.map((c: any) => ({
      id:        c.id,
      type:      'contract',
      subType:   c.contractType,
      title:     `Shartnoma — ${c.contractNumber}`,
      subtitle:  c.counterparty?.name || '—',
      status:    c.status,
      amount:    c.amount,
      createdAt: c.createdAt,
    }))

    const normalizedAi = aiDocs.map((d: any) => ({
      id:        d.id,
      type:      'ai',
      subType:   d.docType || 'ai',
      title:     d.title,
      subtitle:  `${d.tokensUsed} token`,
      status:    'COMPLETED',
      amount:    null,
      createdAt: d.createdAt,
    }))

    const all = [...normalizedContracts, ...normalizedAi].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    return {
      data: all,
      meta: {
        total:     totalContracts + totalAi,
        contracts: totalContracts,
        aiDocs:    totalAi,
        page,
        limit,
      },
    }
  }

  async getSeifStats(orgId: string) {
    const [contracts, aiDocs, specs] = await Promise.all([
      this.prisma.contract.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.aiDocument.count({ where: { organizationId: orgId, isActive: true } }),
      this.prisma.specification.count({ where: { organizationId: orgId } }),
    ])
    return { contracts, aiDocs, specs, total: contracts + aiDocs + specs }
  }
}
