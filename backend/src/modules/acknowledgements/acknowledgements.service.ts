import { Injectable, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CURRENT_DISCLAIMER_VERSION } from './disclaimer.constants'

export interface CreateAcknowledgementDto {
  userId:      string
  templateRef: string  // "system_OLDI_SOTDI", "industry_qurilish-pudrat", "user_<uuid>"
  ipAddress?:  string
  userAgent?:  string
}

@Injectable()
export class AcknowledgementsService {
  constructor(private prisma: PrismaService) {}

  // Foydalanuvchi shablonni qabul qiladi (disclaimer'ga rozilik)
  async accept(dto: CreateAcknowledgementDto) {
    if (!dto.templateRef || dto.templateRef.length > 200) {
      throw new BadRequestException("templateRef noto'g'ri")
    }

    return this.prisma.templateAcknowledgement.create({
      data: {
        userId:            dto.userId,
        templateRef:       dto.templateRef,
        disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
        ipAddress:         dto.ipAddress,
        userAgent:         dto.userAgent?.slice(0, 1000) ?? null,
      },
    })
  }

  // Tekshirish: foydalanuvchi shu shablon uchun joriy versiyani qabul qilganmi?
  async check(userId: string, templateRef: string) {
    const ack = await this.prisma.templateAcknowledgement.findFirst({
      where: {
        userId,
        templateRef,
        disclaimerVersion: CURRENT_DISCLAIMER_VERSION,
      },
      orderBy: { acceptedAt: 'desc' },
      select: { id: true, acceptedAt: true, disclaimerVersion: true },
    })

    return {
      accepted:       !!ack,
      acceptedAt:     ack?.acceptedAt ?? null,
      currentVersion: CURRENT_DISCLAIMER_VERSION,
      acceptedVersion: ack?.disclaimerVersion ?? null,
    }
  }

  // Foydalanuvchining barcha tasdiqlari (audit/profil sahifasida ko'rsatish)
  async listForUser(userId: string, limit = 50) {
    return this.prisma.templateAcknowledgement.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      take: Math.min(limit, 200),
    })
  }

  // Audit: barcha tasdiqlarni filtrlab olish (admin uchun)
  async listAll(query: { userId?: string; templateRef?: string; limit?: number } = {}) {
    const { userId, templateRef, limit = 100 } = query
    return this.prisma.templateAcknowledgement.findMany({
      where: {
        ...(userId      ? { userId } : {}),
        ...(templateRef ? { templateRef } : {}),
      },
      orderBy: { acceptedAt: 'desc' },
      take: Math.min(limit, 500),
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      },
    })
  }
}
