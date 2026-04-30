import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface SearchResult {
  id:       string
  type:     'contract' | 'counterparty' | 'employee'
  title:    string
  subtitle: string
  url:      string
  icon:     string
}

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(orgId: string, query: string): Promise<{
    contracts:      SearchResult[]
    counterparties: SearchResult[]
    employees:      SearchResult[]
    total:          number
  }> {
    if (!query || query.length < 2) {
      return { contracts: [], counterparties: [], employees: [], total: 0 }
    }

    const q = query.trim()

    const [contracts, counterparties, employees] = await Promise.all([
      this.prisma.contract.findMany({
        where: {
          organizationId: orgId,
          isActive:       true,
          OR: [
            { contractNumber: { contains: q, mode: 'insensitive' } },
            { counterparty:   { name: { contains: q, mode: 'insensitive' } } },
          ],
        },
        take:    5,
        orderBy: { createdAt: 'desc' },
        include: { counterparty: { select: { name: true } } },
      }),

      this.prisma.counterparty.findMany({
        where: {
          organizationId: orgId,
          isActive:       true,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { inn:  { contains: q } },
          ],
        },
        take:    5,
        orderBy: { createdAt: 'desc' },
      }),

      this.prisma.employee.findMany({
        where: {
          organizationId: orgId,
          isActive:       true,
          OR: [
            { ism:     { contains: q, mode: 'insensitive' } },
            { lavozim: { contains: q, mode: 'insensitive' } },
          ],
        },
        take:    5,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return {
      contracts: contracts.map((c: any) => ({
        id:       c.id,
        type:     'contract' as const,
        title:    `Shartnoma — ${c.contractNumber}`,
        subtitle: c.counterparty?.name || c.contractType || '',
        url:      `/dashboard/shartnomalar/${c.id}`,
        icon:     '📄',
      })),

      counterparties: counterparties.map((cp: any) => ({
        id:       cp.id,
        type:     'counterparty' as const,
        title:    cp.name,
        subtitle: cp.inn ? `STIR: ${cp.inn}` : cp.type || '',
        url:      `/dashboard/kontragentlar?id=${cp.id}`,
        icon:     '🏢',
      })),

      employees: employees.map((emp: any) => ({
        id:       emp.id,
        type:     'employee' as const,
        title:    emp.ism,
        subtitle: emp.lavozim || emp.bolim || '',
        url:      `/dashboard/kadrlar?id=${emp.id}`,
        icon:     '👤',
      })),

      total: contracts.length + counterparties.length + employees.length,
    }
  }
}
