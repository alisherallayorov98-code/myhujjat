import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { GoogleGenAI } from '@google/genai'
import { PrismaService }         from '../prisma/prisma.service'
import { CounterpartiesService } from '../counterparties/cp.service'
import { ContractsService }      from '../contracts/contracts.service'
import { StirService }           from '../stir/stir.service'
import { MiraService }           from '../mira/mira.service'
import { SYSTEM_INSTRUCTION }    from './voice.prompts'
import { TOOLS }                 from './voice.tools'
import { VoiceFastPath, type ConversationState } from './voice.fastpath'


interface VoiceContext {
  userId:        string
  organizationId: string
}

interface ToolResult {
  name:    string
  result:  any
  success: boolean
  error?:  string
}

export interface VoiceResult {
  transcript:   string  // foydalanuvchi nima dedi
  response:     string  // agent javobi (matn)
  audio?:       { data: string; mimeType: string }  // agent javobi (ovoz, base64 PCM)
  toolsCalled:  ToolResult[]
  /** Suhbat davom etmoqdami (fastPath state) — frontend keyingi xabarda yuboradi */
  state?:       ConversationState | null
  /** Frontend imzolab Didox'ga yuborishi kerakmi? */
  pendingSign?: { contractId: string; contractNumber: string }
}

@Injectable()
export class VoiceService {
  private readonly logger = new Logger(VoiceService.name)
  private readonly client: GoogleGenAI
  private readonly model    = 'gemini-2.5-pro'           // matn + tool calling uchun
  private readonly ttsModel = 'gemini-2.5-flash-preview-tts'  // ovoz uchun

  private readonly fastPath: VoiceFastPath

  constructor(
    private prisma:    PrismaService,
    private cpService: CounterpartiesService,
    private contractsService: ContractsService,
    private stirService: StirService,
    private miraService: MiraService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      this.logger.warn('GEMINI_API_KEY mavjud emas — VoiceService ishlamaydi')
    }
    this.client = new GoogleGenAI({ apiKey: apiKey || '' })

    this.fastPath = new VoiceFastPath(prisma, cpService, contractsService, stirService, miraService)
  }

  // ─── Buyruqni qabul qilish (matn yoki audio) ───────────────────────────
  async processCommand(opts: {
    text?:       string
    audio?:      { data: string; mimeType: string } // base64 + mime
    targetLang?: 'uz' | 'oz' | 'ru'
    state?:      ConversationState | null
    context:     VoiceContext
  }): Promise<VoiceResult> {
    if (!process.env.GEMINI_API_KEY) {
      throw new BadRequestException('Gemini API key sozlanmagan')
    }

    // 1. Audio bo'lsa — avval transkript qilamiz
    let userText = opts.text || ''
    if (opts.audio && !userText) {
      userText = await this.transcribe(opts.audio)
    }
    if (!userText.trim()) {
      throw new BadRequestException("Bo'sh buyruq")
    }

    // 1.5. Tezkor algoritm (LLM'siz, token tejaydi)
    const fastResult = await this.fastPath.tryHandle({
      text:       userText,
      userId:     opts.context.userId,
      orgId:      opts.context.organizationId,
      state:      opts.state,
      targetLang: opts.targetLang,
    })
    if (fastResult) {
      const audio = fastResult.response
        ? await this.generateSpeech(fastResult.response).catch(() => undefined)
        : undefined
      return {
        transcript:  userText,
        response:    fastResult.response,
        audio,
        toolsCalled: fastResult.toolsCalled.map(t => ({
          name:    t.name,
          result:  t.data,
          success: t.success,
          error:   t.error,
        })),
        state:       fastResult.state,
        pendingSign: fastResult.pendingSign,
      }
    }

    // Til ko'rsatmasi qo'shilgan system prompt
    const lang = opts.targetLang || 'uz'
    const langInstruction = lang === 'ru'
      ? '\n\nЯЗЫК ОТВЕТА: Отвечай только на русском языке. Все твои ответы — на грамотном русском.'
      : lang === 'oz'
      ? `\n\nЖАВОБ ТИЛИ: Фойдаланувчига фақат ўзбек тилида (КИРИЛЛ ёзувида) жавоб бер. Барча матн кирилл алифбосида бўлсин.`
      : `\n\nJAVOB TILI: Foydalanuvchiga faqat o'zbek tilida (lotin yozuvida) javob ber.`
    const systemPrompt = SYSTEM_INSTRUCTION + langInstruction

    // 2. Gemini bilan tool calling
    const toolsCalled: ToolResult[] = []
    let response = ''

    try {
      const initialResponse = await this.client.models.generateContent({
        model: this.model,
        contents: [{ role: 'user', parts: [{ text: userText }] }],
        config: {
          systemInstruction: systemPrompt,
          tools: TOOLS,
          temperature: 0.3,
        },
      })

      const calls = initialResponse.functionCalls || []

      // Tool'larni bajarish
      const toolResponses: any[] = []
      for (const call of calls) {
        const result = await this.executeTool(call.name!, call.args || {}, opts.context)
        toolsCalled.push({ name: call.name!, result: result.data, success: result.success, error: result.error })
        toolResponses.push({
          functionResponse: {
            name: call.name!,
            response: { result: result.success ? result.data : { error: result.error } },
          },
        })
      }

      // Agar tool chaqirildi — natija bilan ikkinchi bor so'rab javob olamiz
      if (calls.length > 0) {
        const followUp = await this.client.models.generateContent({
          model: this.model,
          contents: [
            { role: 'user',  parts: [{ text: userText }] },
            { role: 'model', parts: calls.map(c => ({ functionCall: c })) },
            { role: 'user',  parts: toolResponses },
          ],
          config: {
            systemInstruction: systemPrompt,
            tools: TOOLS,
            temperature: 0.3,
          },
        })
        response = followUp.text || 'Bajarildi'
      } else {
        response = initialResponse.text || ''
      }
    } catch (err: any) {
      this.logger.error(`Gemini xato: ${err?.message}`)
      throw new BadRequestException(err?.message || 'AI xatosi')
    }

    // Agent javobini ovozda generatsiya qilish (TTS)
    const audio = response ? await this.generateSpeech(response).catch(() => undefined) : undefined

    return { transcript: userText, response, audio, toolsCalled }
  }

  // ─── Text → speech (Gemini TTS) ─────────────────────────────────────────
  private async generateSpeech(text: string): Promise<{ data: string; mimeType: string } | undefined> {
    if (!text.trim()) return undefined
    try {
      const result = await this.client.models.generateContent({
        model: this.ttsModel,
        contents: [{ role: 'user', parts: [{ text }] }],
        config: {
          responseModalities: ['AUDIO'] as any,
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' }, // iliq, do'stona ayol ovozi
            },
          },
        } as any,
      })
      const part = result.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)
      const inline = (part as any)?.inlineData
      if (!inline?.data) return undefined
      return { data: inline.data, mimeType: inline.mimeType || 'audio/L16;rate=24000' }
    } catch (err: any) {
      this.logger.warn(`TTS xato: ${err?.message}`)
      return undefined
    }
  }

  // ─── Audio → text (Gemini orqali) ──────────────────────────────────────
  private async transcribe(audio: { data: string; mimeType: string }): Promise<string> {
    const result = await this.client.models.generateContent({
      model: this.model,
      contents: [{
        role: 'user',
        parts: [
          { text: 'Bu audio yozuvni o\'zbek tilida transkript qil. Faqat matnni qaytar, qo\'shimcha izoh qo\'shma.' },
          { inlineData: { mimeType: audio.mimeType, data: audio.data } },
        ],
      }],
    })
    return (result.text || '').trim()
  }

  // ─── Tool routerlar ────────────────────────────────────────────────────
  private async executeTool(
    name:    string,
    args:    Record<string, any>,
    ctx:     VoiceContext,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      switch (name) {
        case 'createCounterparty': {
          const cp = await this.cpService.create({
            organizationId: ctx.organizationId,
            name:           String(args.name || '').trim(),
            inn:            args.inn         ? String(args.inn).replace(/\D/g, '').slice(0, 9) : undefined,
            directorName:   args.directorName,
            address:        args.address,
            phone:          args.phone,
            bankName:       args.bankName,
            bankAccount:    args.bankAccount,
            mfo:            args.mfo,
          })
          return { success: true, data: { id: cp.id, name: cp.name, inn: cp.inn } }
        }

        case 'createContract': {
          // Avval kontragentni topamiz
          let counterpartyId: string | undefined
          if (args.counterpartyInn || args.counterpartyName) {
            const cps = await this.prisma.counterparty.findMany({
              where: {
                organizationId: ctx.organizationId,
                isActive:       true,
                OR: [
                  ...(args.counterpartyInn  ? [{ inn:  String(args.counterpartyInn) }] : []),
                  ...(args.counterpartyName ? [{ name: { contains: String(args.counterpartyName), mode: 'insensitive' as const } }] : []),
                ],
              },
              take: 1,
            })
            counterpartyId = cps[0]?.id
            if (!counterpartyId) {
              return { success: false, error: `Kontragent topilmadi: ${args.counterpartyName || args.counterpartyInn}` }
            }
          }

          const contract = await this.contractsService.create(ctx.userId, {
            organizationId: ctx.organizationId,
            counterpartyId,
            contractType:   String(args.contractType || 'BOSHQA'),
            contractDate:   new Date().toISOString().split('T')[0],
            endDate:        args.endDate ? String(args.endDate) : undefined,
            city:           args.city || 'Toshkent',
            amount:         args.amount ? Number(args.amount) : 0,
            productName:    args.productName,
            createdByMira:  true,
          })
          return { success: true, data: { id: contract.id, contractNumber: contract.contractNumber, amount: contract.amount } }
        }

        case 'listContracts': {
          // N+1 fix: contractsService.findAll'dan voz kechib, faqat
          // kerakli field'larni tortamiz (voice javobi uchun)
          const limit = Math.min(Number(args.limit) || 5, 20)
          const where: any = { organizationId: ctx.organizationId, isActive: true }
          if (args.status) where.status = args.status
          const data = await this.prisma.contract.findMany({
            where,
            take:    limit,
            orderBy: { createdAt: 'desc' },
            select: {
              contractNumber: true,
              contractType:   true,
              amount:         true,
              status:         true,
              contractDate:   true,
              counterparty: { select: { name: true } },
            },
          })
          return {
            success: true,
            data: data.map(c => ({
              number: c.contractNumber,
              type:   c.contractType,
              amount: c.amount,
              status: c.status,
              cp:     c.counterparty?.name || null,
              date:   c.contractDate,
            })),
          }
        }

        case 'searchStir': {
          const inn = String(args.inn || '').replace(/\D/g, '').slice(0, 9)
          if (inn.length !== 9) {
            return { success: false, error: "STIR 9 ta raqam bo'lishi kerak" }
          }
          const data = await this.stirService.getCompanyByInn(inn, ctx.userId)
          return {
            success: true,
            data: {
              name:         data.name,
              directorName: data.directorName,
              address:      data.address,
              status:       data.status,
              statusText:   data.statusText,
              taxMode:      data.taxMode,
            },
          }
        }

        case 'findCounterparty': {
          if (!args.name && !args.inn) {
            return { success: false, error: "Nom yoki STIR kerak" }
          }
          const found = await this.prisma.counterparty.findMany({
            where: {
              organizationId: ctx.organizationId,
              isActive:       true,
              OR: [
                ...(args.inn  ? [{ inn: String(args.inn).replace(/\D/g, '') }] : []),
                ...(args.name ? [{ name: { contains: String(args.name), mode: 'insensitive' as const } }] : []),
              ],
            },
            take: 5,
            select: { id: true, name: true, inn: true, directorName: true, phone: true },
          })
          if (found.length === 0) {
            return { success: false, error: `Kontragent topilmadi: ${args.name || args.inn}` }
          }
          return { success: true, data: found }
        }

        case 'updateContract': {
          if (!args.contractId && !args.contractNumber) {
            return { success: false, error: "contractId yoki contractNumber kerak" }
          }
          const existing = await this.prisma.contract.findFirst({
            where: {
              organizationId: ctx.organizationId,
              isActive:       true,
              OR: [
                ...(args.contractId     ? [{ id:             String(args.contractId) }] : []),
                ...(args.contractNumber ? [{ contractNumber: String(args.contractNumber) }] : []),
              ],
            },
            select: { id: true, contractNumber: true },
          })
          if (!existing) {
            return { success: false, error: `Shartnoma topilmadi: ${args.contractNumber || args.contractId}` }
          }
          const updateData: Record<string, any> = {}
          if (args.status)      updateData.status      = String(args.status)
          if (args.amount)      updateData.amount      = Number(args.amount)
          if (args.endDate)     updateData.endDate     = new Date(String(args.endDate))
          if (args.productName) updateData.productName = String(args.productName)
          if (Object.keys(updateData).length === 0) {
            return { success: false, error: "Yangilanadigan maydon yo'q" }
          }
          await this.contractsService.update(ctx.organizationId, existing.id, updateData)
          return { success: true, data: { id: existing.id, contractNumber: existing.contractNumber, updated: updateData } }
        }

        case 'getContractDetails': {
          if (!args.contractId && !args.contractNumber) {
            return { success: false, error: "contractId yoki contractNumber kerak" }
          }
          const contract = await this.prisma.contract.findFirst({
            where: {
              organizationId: ctx.organizationId,
              isActive:       true,
              OR: [
                ...(args.contractId     ? [{ id:             String(args.contractId) }] : []),
                ...(args.contractNumber ? [{ contractNumber: String(args.contractNumber) }] : []),
              ],
            },
            select: {
              id:             true,
              contractNumber: true,
              contractType:   true,
              contractDate:   true,
              endDate:        true,
              amount:         true,
              status:         true,
              productName:    true,
              signedUs:       true,
              signedCp:       true,
              didoxSent:      true,
              totalInvoiced:  true,
              alertLevel:     true,
              counterparty: { select: { name: true, inn: true } },
            },
          })
          if (!contract) {
            return { success: false, error: `Shartnoma topilmadi: ${args.contractNumber || args.contractId}` }
          }
          return {
            success: true,
            data: {
              id:             contract.id,
              number:         contract.contractNumber,
              type:           contract.contractType,
              date:           contract.contractDate,
              endDate:        contract.endDate,
              amount:         contract.amount,
              status:         contract.status,
              product:        contract.productName,
              signedUs:       contract.signedUs,
              signedCp:       contract.signedCp,
              didoxSent:      contract.didoxSent,
              totalInvoiced:  contract.totalInvoiced,
              alertLevel:     contract.alertLevel,
              counterparty:   contract.counterparty?.name,
              cpInn:          contract.counterparty?.inn,
            },
          }
        }

        case 'getStats': {
          const stats = await this.contractsService.getStats(ctx.organizationId)
          const cpCount = await this.prisma.counterparty.count({
            where: { organizationId: ctx.organizationId, isActive: true },
          })
          const empCount = await this.prisma.employee.count({
            where: { organizationId: ctx.organizationId, isActive: true },
          })
          return {
            success: true,
            data: {
              contracts:      stats,
              counterparties: cpCount,
              employees:      empCount,
            },
          }
        }

        default:
          return { success: false, error: `Noma'lum tool: ${name}` }
      }
    } catch (err: any) {
      this.logger.error(`Tool ${name} xato: ${err?.message}`)
      return { success: false, error: err?.message || 'Xatolik' }
    }
  }
}
