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
    if (member?.role === 'OWNER') throw new BadRequestException("Owerni o'chirish mumkin emas")
    return this.prisma.orgMember.delete({ where: { id: memberId } })
  }
}
