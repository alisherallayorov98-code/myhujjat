import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../modules/prisma/prisma.service'

/**
 * Multi-tenancy himoyasi.
 *
 * Har bir service bu yerdan foydalanib, foydalanuvchi tashkilotga ruxsati borligini
 * tekshirib turishi shart. Bu — eng kritik xavfsizlik chizig'i.
 *
 * Foydalanish:
 *   await tenant.requireOrgAccess(userId, orgId)
 *   await tenant.requireResourceOwnership(userId, 'contract', contractId)
 */
@Injectable()
export class TenantAccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Foydalanuvchi shu tashkilotga ruxsati borligini tekshiradi.
   * Egasi yoki a'zo bo'lishi kerak.
   */
  async requireOrgAccess(userId: string, organizationId: string): Promise<void> {
    if (!userId || !organizationId) {
      throw new ForbiddenException("Ruxsat yo'q")
    }

    // 1) Egasi tekshiruvi
    const isOwner = await this.prisma.organization.count({
      where: { id: organizationId, userId },
    })
    if (isOwner > 0) return

    // 2) A'zolik tekshiruvi
    const isMember = await this.prisma.orgMember.count({
      where: { organizationId, userId, status: 'ACTIVE' },
    })
    if (isMember > 0) return

    throw new ForbiddenException("Bu tashkilotga ruxsatingiz yo'q")
  }

  /**
   * Foydalanuvchi mavjud bo'lgan barcha tashkilotlar ID'lari.
   * Query'lar uchun: where: { organizationId: { in: orgIds } }
   */
  async getAccessibleOrgIds(userId: string): Promise<string[]> {
    const [owned, memberOf] = await Promise.all([
      this.prisma.organization.findMany({
        where:  { userId, isActive: true },
        select: { id: true },
      }),
      this.prisma.orgMember.findMany({
        where:  { userId, status: 'ACTIVE' },
        select: { organizationId: true },
      }),
    ])
    const ids = new Set([
      ...owned.map(o => o.id),
      ...memberOf.map(m => m.organizationId),
    ])
    return Array.from(ids)
  }

  /**
   * Resurs (shartnoma, kontragent, faktura) ushbu foydalanuvchining tashkilotiga
   * tegishli ekanligini tekshiradi.
   */
  async requireResourceOwnership(
    userId: string,
    resource: 'contract' | 'counterparty' | 'employee' | 'invoice' | 'specification' | 'document' | 'template',
    resourceId: string,
  ): Promise<void> {
    const orgIds = await this.getAccessibleOrgIds(userId)
    if (orgIds.length === 0) {
      throw new ForbiddenException("Sizda hech bir tashkilotga ruxsat yo'q")
    }

    let count = 0
    switch (resource) {
      case 'contract':
        count = await this.prisma.contract.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'counterparty':
        count = await this.prisma.counterparty.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'employee':
        count = await this.prisma.employee.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'invoice':
        count = await this.prisma.invoice.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'specification':
        count = await this.prisma.specification.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'document':
        count = await this.prisma.document.count({ where: { id: resourceId, organizationId: { in: orgIds } } })
        break
      case 'template':
        count = await this.prisma.template.count({
          where: { id: resourceId, OR: [{ organizationId: { in: orgIds } }, { isSystem: true }] },
        })
        break
    }

    if (count === 0) {
      throw new NotFoundException(`${resource} topilmadi yoki ruxsatingiz yo'q`)
    }
  }

  /**
   * OWNER ekanligini tekshiradi (faqat tashkilot egasi qila oladigan amallar uchun)
   */
  async requireOwner(userId: string, organizationId: string): Promise<void> {
    const isOwner = await this.prisma.organization.count({
      where: { id: organizationId, userId },
    })
    if (isOwner > 0) return

    const ownerMember = await this.prisma.orgMember.count({
      where: { organizationId, userId, role: 'OWNER', status: 'ACTIVE' },
    })
    if (ownerMember === 0) {
      throw new ForbiddenException("Bu amal uchun tashkilot egasi bo'lishingiz kerak")
    }
  }
}
