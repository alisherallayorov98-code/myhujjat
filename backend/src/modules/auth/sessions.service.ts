import { Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface SessionInfo {
  id:           string
  ipAddress:    string | null
  userAgent:    string | null
  device:       string
  browser:      string
  isCurrent:    boolean
  createdAt:    Date
  expiresAt:    Date
}

function parseUserAgent(ua: string | null): { device: string; browser: string } {
  if (!ua) return { device: 'Noma\'lum', browser: 'Noma\'lum' }
  const u = ua.toLowerCase()

  let device = 'Desktop'
  if (/iphone/.test(u))      device = 'iPhone'
  else if (/ipad/.test(u))    device = 'iPad'
  else if (/android/.test(u)) device = 'Android'
  else if (/mobi/.test(u))    device = 'Mobile'

  let browser = 'Boshqa'
  if (/edg\//.test(u))           browser = 'Edge'
  else if (/chrome\//.test(u))   browser = 'Chrome'
  else if (/firefox\//.test(u))  browser = 'Firefox'
  else if (/safari\//.test(u) && !/chrome/.test(u)) browser = 'Safari'

  return { device, browser }
}

@Injectable()
export class SessionsService {
  constructor(private prisma: PrismaService) {}

  async list(userId: string, currentToken?: string): Promise<SessionInfo[]> {
    const tokens = await this.prisma.refreshToken.findMany({
      where:   { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    })

    return tokens.map(t => {
      const { device, browser } = parseUserAgent(t.userAgent)
      return {
        id:        t.id,
        ipAddress: t.ipAddress,
        userAgent: t.userAgent,
        device,
        browser,
        isCurrent: currentToken === t.token,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
      }
    })
  }

  async revoke(userId: string, sessionId: string) {
    const session = await this.prisma.refreshToken.findFirst({
      where: { id: sessionId, userId },
    })
    if (!session) throw new NotFoundException('Sessiya topilmadi')
    await this.prisma.refreshToken.delete({ where: { id: sessionId } })
    return { success: true }
  }

  async revokeAllExceptCurrent(userId: string, currentToken?: string) {
    const where: any = { userId }
    if (currentToken) where.token = { not: currentToken }
    const result = await this.prisma.refreshToken.deleteMany({ where })
    return { success: true, revoked: result.count }
  }
}
