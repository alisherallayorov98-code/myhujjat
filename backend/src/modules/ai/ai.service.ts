import { Injectable, ForbiddenException, Logger } from '@nestjs/common'
import Anthropic         from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'

const SYSTEM_PROMPT = `Siz O'zbekiston Respublikasi qonunchiligiga asoslangan professional yuridik hujjat mutaxassisisiz.

Vazifangiz: Foydalanuvchi ko'rsatmalariga asosan to'g'ri, qonuniy va professional hujjatlar yaratish.

Muhim qoidalar:
1. Barcha hujjatlar O'zbekiston qonunchiligiga mos bo'lsin
2. Rekvizitlar to'liq va to'g'ri ko'rsatilsin
3. Rasmiy uslubda, aniq va ravshan yozilsin
4. Faqat hujjat matni qaytarilsin — tushuntirish yoki izoh yo'q
5. O'zbek tilida (lotin yozuvida) yozilsin
6. Standart hujjat formatida: sarlavha, bandlar, rekvizitlar, imzo joyi`

export interface GenerateDto {
  userId:   string
  orgId:    string
  docType:  string
  prompt:   string
  orgData?: Record<string, string>
  cpData?:  Record<string, string>
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private anthropic: Anthropic

  constructor(private prisma: PrismaService) {
    this.anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }

  private async checkPro(userId: string) {
    const sub = await this.prisma.subscription.findUnique({ where: { userId } })
    if (!sub || !['PRO', 'DEMO'].includes(sub.plan)) {
      throw new ForbiddenException('AI faqat Pro va Demo rejalarda mavjud')
    }
  }

  private buildUserMessage(dto: GenerateDto): string {
    const orgPart = dto.orgData
      ? '\nTASHKILOT:\n' + Object.entries(dto.orgData)
          .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
      : ''
    const cpPart = dto.cpData
      ? '\nKONTRAGENT:\n' + Object.entries(dto.cpData)
          .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
      : ''

    return `HUJJAT TURI: ${dto.docType}${orgPart}${cpPart}\n\nTALABLAR:\n${dto.prompt}`
  }

  async generateDocument(dto: GenerateDto) {
    await this.checkPro(dto.userId)

    this.logger.log(`AI generate: ${dto.userId} → ${dto.docType}`)

    const response = await this.anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: this.buildUserMessage(dto) }],
    })

    const content    = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    const saved = await this.saveDoc(dto, content, tokensUsed)
    return { id: saved.id, content, tokensUsed, title: saved.title }
  }

  async generateStream(dto: GenerateDto) {
    await this.checkPro(dto.userId)
    return this.anthropic.messages.stream({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      system:     SYSTEM_PROMPT,
      messages:   [{ role: 'user', content: this.buildUserMessage(dto) }],
    })
  }

  async saveDoc(dto: Pick<GenerateDto, 'orgId' | 'userId' | 'docType' | 'prompt'>, content: string, tokensUsed: number) {
    return this.prisma.aiDocument.create({
      data: {
        organizationId: dto.orgId,
        userId:         dto.userId,
        title:          `${dto.docType} — ${new Date().toLocaleDateString('uz-UZ')}`,
        prompt:         dto.prompt,
        content,
        docType:        dto.docType,
        tokensUsed,
        model:          'claude-sonnet-4',
      },
    })
  }

  async getHistory(orgId: string, limit = 20) {
    return this.prisma.aiDocument.findMany({
      where:   { organizationId: orgId, isActive: true },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      select:  { id: true, title: true, docType: true, tokensUsed: true, createdAt: true },
    })
  }

  async getDoc(orgId: string, id: string) {
    return this.prisma.aiDocument.findFirst({ where: { id, organizationId: orgId } })
  }
}
