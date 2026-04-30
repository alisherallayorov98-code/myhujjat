import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService }        from '../prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { randomBytes }          from 'crypto'

@Injectable()
export class ShareLinksService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Yangi havola yaratish (faqat egasi) ──────────────────
  async create(userId: string, contractId: string, dto: {
    recipientEmail?: string
    recipientName?:  string
    recipientPhone?: string
    expiresInDays?:  number
  }) {
    // Mulkdorligini tekshirish
    const contract = await this.prisma.contract.findFirst({
      where: { id: contractId, organization: { userId } },
    })
    if (!contract) throw new NotFoundException("Shartnoma topilmadi")

    const token   = randomBytes(24).toString('base64url')
    const days    = Math.min(Math.max(dto.expiresInDays || 30, 1), 90)
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000)

    return this.prisma.contractShareLink.create({
      data: {
        token,
        contractId,
        recipientEmail: dto.recipientEmail,
        recipientName:  dto.recipientName,
        recipientPhone: dto.recipientPhone,
        expiresAt:      expires,
      },
    })
  }

  // ─── Havola ro'yxati (egasi uchun) ────────────────────────
  async listForContract(userId: string, contractId: string) {
    const owns = await this.prisma.contract.findFirst({
      where:  { id: contractId, organization: { userId } },
      select: { id: true },
    })
    if (!owns) throw new NotFoundException("Shartnoma topilmadi")

    return this.prisma.contractShareLink.findMany({
      where:   { contractId, isActive: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  // ─── Havolani bekor qilish ────────────────────────────────
  async revoke(userId: string, linkId: string) {
    const link = await this.prisma.contractShareLink.findFirst({
      where: { id: linkId, contract: { organization: { userId } } },
    })
    if (!link) throw new NotFoundException("Havola topilmadi")

    return this.prisma.contractShareLink.update({
      where: { id: linkId },
      data:  { isActive: false },
    })
  }

  // ─── PUBLIC: token bo'yicha shartnomani ko'rish ───────────
  async getByToken(token: string, viewerIp?: string) {
    const link = await this.prisma.contractShareLink.findUnique({
      where:   { token },
      include: {
        contract: {
          include: {
            organization: true,
            counterparty: true,
          },
        },
      },
    })
    if (!link || !link.isActive) {
      throw new NotFoundException("Havola topilmadi yoki bekor qilingan")
    }
    if (link.expiresAt < new Date()) {
      throw new BadRequestException("Havola muddati tugagan")
    }

    // Birinchi marta ko'rilganda — egasiga notifikatsiya yuboramiz
    const isFirstView = !link.viewedAt
    await this.prisma.contractShareLink.update({
      where: { id: link.id },
      data:  {
        viewedAt:  link.viewedAt || new Date(),
        viewCount: { increment: 1 },
      },
    })

    if (isFirstView) {
      const ownerOrg = await this.prisma.organization.findUnique({
        where:  { id: link.contract.organizationId },
        select: { userId: true, id: true },
      })
      if (ownerOrg) {
        this.notifications.create({
          userId:         ownerOrg.userId,
          organizationId: ownerOrg.id,
          type:           'SYSTEM',
          title:          'Shartnoma ko\'rildi',
          message:        `${link.recipientName || 'Kontragent'} sizning shartnomangizni ko\'rdi`,
          link:           `/dashboard/shartnomalar/${link.contractId}`,
        }).catch(() => {})
      }
    }

    return {
      contract:        link.contract,
      recipient:       {
        name:  link.recipientName,
        email: link.recipientEmail,
        phone: link.recipientPhone,
      },
      signedAt:        link.signedAt,
      signerName:      link.signerName,
      isExpired:       link.expiresAt < new Date(),
      expiresAt:       link.expiresAt,
    }
  }

  // ─── PUBLIC: token bo'yicha imzolash ──────────────────────
  async signByToken(token: string, dto: {
    signerName:  string
    signerEmail?: string
    ip?:         string
  }) {
    const link = await this.prisma.contractShareLink.findUnique({
      where:   { token },
      include: { contract: { include: { organization: true } } },
    })
    if (!link || !link.isActive) throw new NotFoundException("Havola topilmadi")
    if (link.expiresAt < new Date()) throw new BadRequestException("Havola muddati tugagan")
    if (link.signedAt) throw new BadRequestException("Allaqachon imzolangan")
    if (!dto.signerName?.trim()) throw new BadRequestException("Ismingizni kiriting")

    await this.prisma.contractShareLink.update({
      where: { id: link.id },
      data: {
        signedAt:    new Date(),
        signerName:  dto.signerName.trim(),
        signerEmail: dto.signerEmail,
        signerIp:    dto.ip,
      },
    })

    // Shartnomada ham qayd etamiz
    await this.prisma.contract.update({
      where: { id: link.contractId },
      data:  { signedCp: true, signedCpAt: new Date() },
    })

    // Egasiga notifikatsiya
    this.notifications.create({
      userId:         link.contract.organization.userId,
      organizationId: link.contract.organizationId,
      type:           'CONTRACT_SIGNED',
      title:          'Shartnoma imzolandi! 🎉',
      message:        `${dto.signerName} sizning shartnomangizni imzoladi`,
      link:           `/dashboard/shartnomalar/${link.contractId}`,
    }).catch(() => {})

    return { success: true }
  }
}
