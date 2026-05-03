import { Injectable, ForbiddenException, Logger } from '@nestjs/common'
import Anthropic         from '@anthropic-ai/sdk'
import { PrismaService } from '../prisma/prisma.service'

type TargetLang = 'uz' | 'oz' | 'ru'

const LANG_INSTRUCTIONS: Record<TargetLang, string> = {
  uz: `5. O'zbek tilida (lotin yozuvida) yozilsin — masalan: "Shartnoma", "tomonlar", "majburiyat"`,
  oz: `5. Ўзбек тилида (КИРИЛЛ ёзувида) ёзилсин — масалан: "Шартнома", "томонлар", "мажбурият". Барча матн фақат кирилл алифбосида бўлсин!`,
  ru: `5. На русском языке — пиши все на грамотном деловом русском языке. Если в шаблоне есть узбекские слова, переведи их на русский. Например: "Договор", "стороны", "обязательство"`,
}

const TITLE_DATE_LOCALE: Record<TargetLang, string> = {
  uz: 'uz-UZ',
  oz: 'uz-Cyrl-UZ',
  ru: 'ru-RU',
}

function buildSystemPrompt(lang: TargetLang): string {
  const langInstruction = LANG_INSTRUCTIONS[lang]
  if (lang === 'ru') {
    return `Вы — профессиональный специалист по юридическим документам, основанный на законодательстве Республики Узбекистан.

Ваша задача: создавать правильные, законные и профессиональные документы на основе указаний пользователя.

Важные правила:
1. Все документы должны соответствовать законодательству Узбекистана
2. Реквизиты должны быть указаны полно и правильно
3. Стиль — официальный, точный и ясный
4. Возвращайте только текст документа — без пояснений и комментариев
${langInstruction}
6. Стандартный формат документа: заголовок, пункты, реквизиты, место для подписи`
  }

  if (lang === 'oz') {
    return `Сиз Ўзбекистон Республикаси қонунчилигига асосланган профессионал юридик ҳужжат мутахассисисиз.

Вазифангиз: Фойдаланувчи кўрсатмаларига асосан тўғри, қонуний ва профессионал ҳужжатлар яратиш.

Муҳим қоидалар:
1. Барча ҳужжатлар Ўзбекистон қонунчилигига мос бўлсин
2. Реквизитлар тўлиқ ва тўғри кўрсатилсин
3. Расмий услубда, аниқ ва равшан ёзилсин
4. Фақат ҳужжат матни қайтарилсин — тушунтириш ёки изоҳ йўқ
${langInstruction}
6. Стандарт ҳужжат форматида: сарлавҳа, бандлар, реквизитлар, имзо жойи`
  }

  return `Siz O'zbekiston Respublikasi qonunchiligiga asoslangan professional yuridik hujjat mutaxassisisiz.

Vazifangiz: Foydalanuvchi ko'rsatmalariga asosan to'g'ri, qonuniy va professional hujjatlar yaratish.

Muhim qoidalar:
1. Barcha hujjatlar O'zbekiston qonunchiligiga mos bo'lsin
2. Rekvizitlar to'liq va to'g'ri ko'rsatilsin
3. Rasmiy uslubda, aniq va ravshan yozilsin
4. Faqat hujjat matni qaytarilsin — tushuntirish yoki izoh yo'q
${langInstruction}
6. Standart hujjat formatida: sarlavha, bandlar, rekvizitlar, imzo joyi`
}

export interface GenerateDto {
  userId:      string
  orgId:       string
  docType:     string
  prompt:      string
  orgData?:    Record<string, string>
  cpData?:     Record<string, string>
  targetLang?: TargetLang  // foydalanuvchining UI tili (default: uz)
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

  private resolveLang(lang?: string): TargetLang {
    if (lang === 'oz' || lang === 'ru') return lang
    return 'uz'
  }

  private buildUserMessage(dto: GenerateDto): string {
    const lang = this.resolveLang(dto.targetLang)
    const labels = {
      uz: { docType: 'HUJJAT TURI', org: 'TASHKILOT', cp: 'KONTRAGENT', req: 'TALABLAR' },
      oz: { docType: 'ҲУЖЖАТ ТУРИ', org: 'ТАШКИЛОТ', cp: 'КОНТРАГЕНТ', req: 'ТАЛАБЛАР' },
      ru: { docType: 'ТИП ДОКУМЕНТА', org: 'ОРГАНИЗАЦИЯ', cp: 'КОНТРАГЕНТ', req: 'ТРЕБОВАНИЯ' },
    }[lang]

    const orgPart = dto.orgData
      ? `\n${labels.org}:\n` + Object.entries(dto.orgData)
          .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
      : ''
    const cpPart = dto.cpData
      ? `\n${labels.cp}:\n` + Object.entries(dto.cpData)
          .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('\n')
      : ''

    return `${labels.docType}: ${dto.docType}${orgPart}${cpPart}\n\n${labels.req}:\n${dto.prompt}`
  }

  async generateDocument(dto: GenerateDto) {
    await this.checkPro(dto.userId)

    const lang = this.resolveLang(dto.targetLang)
    this.logger.log(`AI generate: ${dto.userId} → ${dto.docType} (${lang})`)

    const response = await this.anthropic.messages.create({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      system:     buildSystemPrompt(lang),
      messages:   [{ role: 'user', content: this.buildUserMessage(dto) }],
    })

    const content    = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as any).text)
      .join('')
    const tokensUsed = response.usage.input_tokens + response.usage.output_tokens

    const saved = await this.saveDoc(dto, content, tokensUsed, lang)
    return { id: saved.id, content, tokensUsed, title: saved.title }
  }

  async generateStream(dto: GenerateDto) {
    await this.checkPro(dto.userId)
    const lang = this.resolveLang(dto.targetLang)
    return this.anthropic.messages.stream({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      system:     buildSystemPrompt(lang),
      messages:   [{ role: 'user', content: this.buildUserMessage(dto) }],
    })
  }

  async saveDoc(
    dto:  Pick<GenerateDto, 'orgId' | 'userId' | 'docType' | 'prompt'>,
    content:    string,
    tokensUsed: number,
    lang:       TargetLang = 'uz',
  ) {
    return this.prisma.aiDocument.create({
      data: {
        organizationId: dto.orgId,
        userId:         dto.userId,
        title:          `${dto.docType} — ${new Date().toLocaleDateString(TITLE_DATE_LOCALE[lang])}`,
        prompt:         dto.prompt,
        content,
        docType:        dto.docType,
        tokensUsed,
        model:          'claude-sonnet-4',
      },
    })
  }

  async getHistory(orgId: string, query: { page?: number; limit?: number } = {}) {
    const page  = query.page  || 1
    const limit = Math.min(query.limit || 20, 100)
    const where = { organizationId: orgId, isActive: true }

    const [total, data] = await Promise.all([
      this.prisma.aiDocument.count({ where }),
      this.prisma.aiDocument.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: 'desc' },
        select:  { id: true, title: true, docType: true, tokensUsed: true, createdAt: true },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async getDoc(orgId: string, id: string) {
    return this.prisma.aiDocument.findFirst({ where: { id, organizationId: orgId } })
  }
}
