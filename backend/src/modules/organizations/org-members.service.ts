import {
  Injectable, BadRequestException, NotFoundException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { randomBytes }   from 'crypto'

@Injectable()
export class OrgMembersService {
  constructor(private prisma: PrismaService) {}

  async getMembers(orgId: string) {
    return this.prisma.orgMember.findMany({
      where:   { organizationId: orgId },
      include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    })
  }

  async createInvite(orgId: string, role: string) {
    const token     = randomBytes(20).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    await this.prisma.organization.update({
      where: { id: orgId },
      data:  { inviteToken: `${token}:${role}:${expiresAt.getTime()}` },
    })

    return {
      url:       `${process.env.FRONTEND_URL}/join/${token}`,
      token,
      expiresAt,
      role,
    }
  }

  async joinByInvite(userId: string, token: string) {
    const org = await this.prisma.organization.findFirst({
      where: { inviteToken: { startsWith: token } },
    })

    if (!org?.inviteToken) throw new NotFoundException('Invite topilmadi')

    const parts  = org.inviteToken.split(':')
    const role   = parts[1]
    const expTs  = parts[2]

    if (Date.now() > Number(expTs)) {
      throw new BadRequestException("Invite muddati o'tgan")
    }

    const existing = await this.prisma.orgMember.findFirst({
      where: { organizationId: org.id, userId },
    })
    if (existing) throw new BadRequestException("Siz allaqachon a'zo siz")

    return this.prisma.orgMember.create({
      data: { organizationId: org.id, userId, role: role as any, status: 'ACTIVE' },
    })
  }

  async changeRole(memberId: string, newRole: string) {
    return this.prisma.orgMember.update({
      where: { id: memberId },
      data:  { role: newRole as any },
    })
  }

  async removeMember(memberId: string) {
    const member = await this.prisma.orgMember.findUnique({ where: { id: memberId } })
    if (member?.role === 'OWNER') {
      throw new BadRequestException(
        "Egani o'chirib bo'lmaydi. Avval egalikni boshqa a'zoga o'tkazing, keyin uni o'chiring.",
      )
    }
    return this.prisma.orgMember.delete({ where: { id: memberId } })
  }

  /**
   * Egalikni boshqa a'zoga o'tkazadi.
   * Xodim (ayniqsa tashkilotni yaratgan egasi) ishdan ketsa, tashkilot va uning
   * barcha ma'lumotlari joyida qoladi — faqat egasi yangi xodimga o'tadi.
   */
  async transferOwnership(orgId: string, newOwnerUserId: string) {
    // Yangi egasi avval shu tashkilotning faol a'zosi bo'lishi kerak
    const target = await this.prisma.orgMember.findFirst({
      where: { organizationId: orgId, userId: newOwnerUserId, status: 'ACTIVE' },
    })
    if (!target) {
      throw new BadRequestException(
        "Yangi egasi avval tashkilot a'zosi bo'lishi kerak. Avval uni taklif qiling.",
      )
    }

    await this.prisma.$transaction([
      // Eski egalarni oddiy a'zoga tushiramiz
      this.prisma.orgMember.updateMany({
        where: { organizationId: orgId, role: 'OWNER' },
        data:  { role: 'MEMBER' },
      }),
      // Yangi egasini OWNER qilamiz
      this.prisma.orgMember.update({
        where: { id: target.id },
        data:  { role: 'OWNER' },
      }),
      // Organization.userId ni ham yangi egaga moslab qo'yamiz (qulaylik uchun)
      this.prisma.organization.update({
        where: { id: orgId },
        data:  { userId: newOwnerUserId },
      }),
    ])

    return { success: true }
  }
}
