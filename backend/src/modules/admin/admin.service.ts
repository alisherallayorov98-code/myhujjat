import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const now       = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

    const [
      totalUsers,
      newUsersThisMonth,
      newUsersLastMonth,
      activeSubscriptions,
      proSubs,
      standardSubs,
      totalContracts,
      contractsThisMonth,
      totalRevenue,
      revenueThisMonth,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.user.count({ where: { createdAt: { gte: lastMonth, lt: thisMonth } } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE', plan: { not: 'FREE' } } }),
      this.prisma.subscription.count({ where: { plan: 'PRO',      status: 'ACTIVE' } }),
      this.prisma.subscription.count({ where: { plan: 'STANDARD', status: 'ACTIVE' } }),
      this.prisma.contract.count(),
      this.prisma.contract.count({ where: { createdAt: { gte: thisMonth } } }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID' },
        _sum:  { amount: true },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'PAID', createdAt: { gte: thisMonth } },
        _sum:  { amount: true },
      }),
    ])

    return {
      users: {
        total:     totalUsers,
        thisMonth: newUsersThisMonth,
        lastMonth: newUsersLastMonth,
        growth:    newUsersLastMonth > 0
          ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
          : 100,
      },
      subscriptions: {
        active:   activeSubscriptions,
        pro:      proSubs,
        standard: standardSubs,
      },
      contracts: {
        total:     totalContracts,
        thisMonth: contractsThisMonth,
      },
      revenue: {
        total:     Number(totalRevenue._sum.amount     ?? 0),
        thisMonth: Number(revenueThisMonth._sum.amount ?? 0),
      },
    }
  }

  async getUsers(query: {
    search?: string
    plan?:   string
    page?:   number
    limit?:  number
  } = {}) {
    const { search, plan, page = 1, limit = 20 } = query

    const where: any = {
      ...(search && {
        OR: [
          { email:     { contains: search, mode: 'insensitive' } },
          { firstName: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(plan && { subscription: { plan } }),
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          email:     true,
          firstName: true,
          lastName:  true,
          isActive:  true,
          role:      true,
          createdAt: true,
          subscription: {
            select: { plan: true, status: true, expiresAt: true, contractCount: true },
          },
          _count: { select: { organizations: true } },
        },
      }),
    ])

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    }
  }

  async toggleUserBlock(userId: string, block: boolean) {
    return this.prisma.user.update({
      where: { id: userId },
      data:  { isActive: !block },
    })
  }

  async grantSubscription(userId: string, plan: string, months: number) {
    const expiresAt = new Date()
    expiresAt.setMonth(expiresAt.getMonth() + months)

    return this.prisma.subscription.upsert({
      where:  { userId },
      update: { plan: plan as any, status: 'ACTIVE', startedAt: new Date(), expiresAt },
      create: { userId, plan: plan as any, status: 'ACTIVE', startedAt: new Date(), expiresAt },
    })
  }

  async getPayments(page = 1, limit = 30) {
    const [total, payments] = await Promise.all([
      this.prisma.payment.count(),
      this.prisma.payment.findMany({
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { id: true, email: true, firstName: true } } },
      }),
    ])
    return { data: payments, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async createAnnouncement(data: { title: string; content: string }) {
    return this.prisma.announcement.create({ data })
  }

  async getAnnouncements() {
    return this.prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } })
  }

  async deleteAnnouncement(id: string) {
    return this.prisma.announcement.delete({ where: { id } })
  }

  async getSupportSessions() {
    return this.prisma.supportSession.findMany({
      where:   { status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count:   { select: { messages: true } },
      },
    })
  }

  async replyToSupport(sessionId: string, content: string) {
    return this.prisma.supportMessage.create({
      data: { sessionId, role: 'admin', content },
    })
  }

  async closeSupportSession(id: string) {
    return this.prisma.supportSession.update({
      where: { id },
      data:  { status: 'CLOSED' },
    })
  }

  // ─── Audit log (admin-wide) ────────────────────────────────
  async getAuditLogs(query: {
    action?: string
    userId?: string
    entity?: string
    page?:   number
    limit?:  number
  } = {}) {
    const { action, userId, entity, page = 1, limit = 50 } = query
    const where: any = {
      ...(action && { action: { contains: action, mode: 'insensitive' } }),
      ...(userId && { userId }),
      ...(entity && { entity }),
    }
    const [total, items] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { email: true, firstName: true } } },
      }),
    ])
    return { data: items, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  // ─── Organizations (admin overview) ────────────────────────
  async getOrganizations(query: { search?: string; page?: number; limit?: number } = {}) {
    const { search, page = 1, limit = 20 } = query
    const where: any = search
      ? { OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { inn:  { contains: search } },
        ] }
      : {}

    const [total, orgs] = await Promise.all([
      this.prisma.organization.count({ where }),
      this.prisma.organization.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id:        true,
          name:      true,
          inn:       true,
          createdAt: true,
          isDefault: true,
          user:      { select: { email: true, firstName: true } },
          _count:    { select: { contracts: true, counterparties: true } },
        },
      }),
    ])
    return { data: orgs, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }
}
