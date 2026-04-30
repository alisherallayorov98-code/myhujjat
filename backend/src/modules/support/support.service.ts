import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async getOrCreateSession(userId: string) {
    let session = await this.prisma.supportSession.findFirst({
      where:   { userId, status: 'OPEN' },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    })

    if (!session) {
      session = await this.prisma.supportSession.create({
        data:    { userId, status: 'OPEN' },
        include: { messages: { orderBy: { createdAt: 'asc' } } },
      })
    }

    return session
  }

  async sendMessage(userId: string, content: string) {
    const session = await this.getOrCreateSession(userId)
    return this.prisma.supportMessage.create({
      data: { sessionId: session.id, role: 'user', content },
    })
  }

  async getMessages(userId: string) {
    const session = await this.getOrCreateSession(userId)
    return {
      sessionId: session.id,
      status:    session.status,
      messages:  session.messages,
    }
  }

  async getAllOpen() {
    return this.prisma.supportSession.findMany({
      where:   { status: 'OPEN' },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count:   { select: { messages: true } },
      },
    })
  }

  async getSessionMessages(sessionId: string) {
    return this.prisma.supportMessage.findMany({
      where:   { sessionId },
      orderBy: { createdAt: 'asc' },
    })
  }

  async adminReply(sessionId: string, content: string) {
    await this.prisma.supportSession.update({
      where: { id: sessionId },
      data:  { updatedAt: new Date() },
    })
    return this.prisma.supportMessage.create({
      data: { sessionId, role: 'admin', content },
    })
  }

  async closeSession(sessionId: string) {
    return this.prisma.supportSession.update({
      where: { id: sessionId },
      data:  { status: 'CLOSED' },
    })
  }
}
