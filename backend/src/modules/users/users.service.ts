import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService }                   from '../prisma/prisma.service'
import * as bcrypt                         from 'bcrypt'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: {
    firstName?: string
    lastName?:  string
    phone?:     string
    language?:  string
    avatarUrl?: string
  }) {
    // Avatar bazaga juda katta bo'lmasligi uchun cheklov (data URL ~500KB max)
    if (dto.avatarUrl && dto.avatarUrl.length > 500_000) {
      throw new BadRequestException("Avatar hajmi 500KB dan oshmasin")
    }
    return this.prisma.user.update({
      where: { id: userId },
      data:  { ...dto, language: dto.language as any, updatedAt: new Date() },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, language: true, role: true, avatarUrl: true,
        subscription: {
          select: { plan: true, status: true, expiresAt: true, contractCount: true }
        },
      },
    })
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi')

    const valid = await bcrypt.compare(oldPassword, user.passwordHash)
    if (!valid) throw new BadRequestException('Eski parol noto\'g\'ri')

    if (newPassword.length < 6) {
      throw new BadRequestException('Yangi parol kamida 6 ta belgi bo\'lishi kerak')
    }

    const hash = await bcrypt.hash(newPassword, 10)
    await this.prisma.user.update({
      where: { id: userId },
      data:  { passwordHash: hash },
    })

    return { success: true }
  }

  async updateOrganization(orgId: string, userId: string, dto: {
    name?:         string
    directorName?: string
    address?:      string
    phone?:        string
    bankName?:     string
    bankAccount?:  string
    mfo?:          string
    oked?:         string
    logo?:         string
  }) {
    const member = await this.prisma.orgMember.findFirst({
      where: { organizationId: orgId, userId, role: 'OWNER' },
    })
    if (!member) throw new BadRequestException('Ruxsat yo\'q')

    return this.prisma.organization.update({
      where: { id: orgId },
      data:  { ...dto, updatedAt: new Date() },
    })
  }

  // ─── GDPR: foydalanuvchi barcha ma'lumotlarini eksport qilish ───
  async exportData(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true, phone: true,
        language: true, role: true, isActive: true, isVerified: true,
        twoFactorEnabled: true, telegramId: true, createdAt: true, updatedAt: true,
      },
    })
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi')

    const [
      organizations,
      contracts,
      counterparties,
      invoices,
      payments,
      subscription,
      auditLogs,
      notifications,
      shareLinks,
    ] = await Promise.all([
      this.prisma.organization.findMany({ where: { userId } }),
      this.prisma.contract.findMany({
        where: { organization: { userId } },
        include: { counterparty: true },
      }),
      this.prisma.counterparty.findMany({ where: { organization: { userId } } }),
      this.prisma.invoice.findMany({ where: { organization: { userId } } }),
      this.prisma.payment.findMany({ where: { userId } }),
      this.prisma.subscription.findUnique({ where: { userId } }),
      this.prisma.auditLog.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        take:    500,
      }),
      this.prisma.notification.findMany({
        where:   { userId },
        orderBy: { createdAt: 'desc' },
        take:    500,
      }),
      this.prisma.contractShareLink.findMany({
        where: { contract: { organization: { userId } } },
        select: {
          id: true, recipientEmail: true, recipientName: true,
          signerName: true, signerEmail: true, signedAt: true,
          createdAt: true, expiresAt: true,
        },
      }),
    ])

    return {
      generatedAt: new Date().toISOString(),
      version:     '1.0',
      schema:      'myhujjat-user-export',
      profile:     user,
      subscription,
      organizations,
      contracts,
      counterparties,
      invoices,
      payments,
      shareLinks,
      auditLogs,
      notifications,
    }
  }

  // ─── GDPR: hisobni o'chirish ────────────────────────────────────
  async deleteAccount(userId: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user) throw new BadRequestException('Foydalanuvchi topilmadi')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new BadRequestException("Parol noto'g'ri")

    // Cascade delete sxemada sozlangan
    await this.prisma.user.delete({ where: { id: userId } })
    return { success: true }
  }
}
