/**
 * Mira AI uchun "Tezkor algoritm" (fastPath).
 *
 * Maqsad: oddiy patternlarni LLM'siz aniqlab, to'g'ridan-to'g'ri kod orqali
 * bajarish. API token tejaladi, javob 1-2 soniya tezroq keladi.
 *
 * Pattern aniqlangan bo'lsa — natija qaytariladi (LLM chaqirilmaydi).
 * Pattern yo'q bo'lsa — null qaytariladi → asosiy LLM oqimi davom etadi.
 */

import { Logger } from '@nestjs/common'
import { PrismaService }         from '../prisma/prisma.service'
import { CounterpartiesService } from '../counterparties/cp.service'
import { ContractsService }      from '../contracts/contracts.service'
import { StirService }           from '../stir/stir.service'
import { MiraService }           from '../mira/mira.service'

export type ConversationState = {
  type:    'awaitingStandardConfirm' | 'awaitingAmount' | 'awaitingProductName' | 'awaitingFinalConfirm'
  stir:    string
  cpId?:   string
  cpName?: string
  // Yig'ilgan ma'lumotlar
  collected: {
    amount?:      number
    productName?: string
  }
  startedAt: number
}

export interface FastPathResult {
  /** Foydalanuvchiga matn javob */
  response: string
  /** Tools qaysilari ishlatildi (UI uchun) */
  toolsCalled: Array<{ name: string; success: boolean; data?: any; error?: string }>
  /** Suhbat davom etmoqdami? Yangi state yoki null */
  state: ConversationState | null
  /** Frontend "imzo so'rashi" kerakmi? Shartnoma ID + signing payload */
  pendingSign?: {
    contractId: string
    contractNumber: string
  }
}

const STIR_RE = /\b(\d{9})\b/

const YES_RE = /^\s*(ha|ҳа|да|yes|y|✓|✅)\s*$/i
const NO_RE  = /^\s*(yo'q|йўқ|нет|no|n|❌)\s*$/i
const SIMPLE_STIR_RE = /^\s*\d{9}\s*$/

const STATS_RE = /^\s*(statistika|стат(ис)?|stat|st)\s*$/i

export class VoiceFastPath {
  private readonly logger = new Logger('VoiceFastPath')

  constructor(
    private prisma:    PrismaService,
    private cps:       CounterpartiesService,
    private contracts: ContractsService,
    private stir:      StirService,
    private mira:      MiraService,
  ) {}

  /**
   * Asosiy entrypoint. Pattern topilsa → natija. Topilmasa → null.
   */
  async tryHandle(opts: {
    text:    string
    userId:  string
    orgId:   string
    state?:  ConversationState | null
    targetLang?: 'uz' | 'oz' | 'ru'
  }): Promise<FastPathResult | null> {
    const text = opts.text.trim()

    // ─── 1. Davom etayotgan suhbat (state machine) ─────────────
    if (opts.state) {
      return this.continueConversation(text, opts.userId, opts.orgId, opts.state)
    }

    // ─── 2. Yangi STIR raqami (faqat 9 raqam) ───────────────────
    if (SIMPLE_STIR_RE.test(text)) {
      return this.handleStirOnly(text.replace(/\D/g, ''), opts.userId, opts.orgId)
    }

    // ─── 3. STIR ichida boshqa matn ham bor (LLM ga ket) ────────
    // Masalan: "302979429 ga 1 mlrd shartnoma yarat"
    // Buni LLM yaxshiroq tushunadi.
    if (STIR_RE.test(text) && text.length > 12) {
      return null  // LLM aralashsin
    }

    // ─── 4. Tezkor "statistika" ─────────────────────────────────
    if (STATS_RE.test(text)) {
      return this.handleStats(opts.orgId)
    }

    // ─── Boshqa — LLM ga ────────────────────────────────────────
    return null
  }

  /**
   * Foydalanuvchi faqat 9-raqamli STIR yozdi.
   */
  private async handleStirOnly(stir: string, userId: string, orgId: string): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(userId, orgId)

    // STIR ma'lumot
    let cp = await this.prisma.counterparty.findFirst({
      where: { organizationId: orgId, inn: stir, isActive: true },
    })

    let cpName: string
    if (cp) {
      cpName = cp.name
    } else {
      // STIR API'dan qidirish va yaratish
      try {
        const data = await this.stir.getCompanyByInn(stir, userId)
        cp = await this.cps.create({
          organizationId: orgId,
          name:           data.name || `Kontragent ${stir}`,
          inn:            stir,
          directorName:   data.directorName,
          address:        data.address,
          phone:          data.phone,
        })
        cpName = cp.name
      } catch (err: any) {
        return {
          response: `STIR ${stir} bo'yicha kompaniya topilmadi. Qo'lda kontragent qo'shing.`,
          toolsCalled: [{ name: 'searchStir', success: false, error: err?.message }],
          state: null,
        }
      }
    }

    // Default summa "Standartmi?" deb so'raymiz
    const amount   = Number(settings.defaultAmount)
    const fmtAmt   = formatAmount(amount)
    const ctype    = settings.defaultContractType
    const typeName = friendlyContractType(ctype)

    return {
      response: `${cpName} topildi.\n` +
        `Standart ${typeName} — ${fmtAmt} so'm uchun shartnoma yarataymi? (ha/yo'q)`,
      toolsCalled: [
        { name: 'searchStir', success: true, data: { name: cpName } },
      ],
      state: {
        type: 'awaitingStandardConfirm',
        stir,
        cpId:   cp!.id,
        cpName,
        collected: {},
        startedAt: Date.now(),
      },
    }
  }

  /**
   * Suhbatni davom ettirish (state asosida).
   */
  private async continueConversation(
    text:   string,
    userId: string,
    orgId:  string,
    state:  ConversationState,
  ): Promise<FastPathResult> {
    // Suhbat 5 daqiqadan ko'p turgan bo'lsa — bekor qilamiz
    if (Date.now() - state.startedAt > 5 * 60_000) {
      return {
        response: "Suhbat to'xtatildi (vaqt o'tdi). STIR raqamini qaytadan yuboring.",
        toolsCalled: [],
        state: null,
      }
    }

    switch (state.type) {
      case 'awaitingStandardConfirm':
        if (YES_RE.test(text)) return this.createWithDefaults(userId, orgId, state)
        if (NO_RE.test(text)) {
          return {
            response: "Yaxshi. Shartnoma summasi qancha bo'lsin? (so'mda raqam yozing)",
            toolsCalled: [],
            state: { ...state, type: 'awaitingAmount' },
          }
        }
        return {
          response: "Iltimos, ha yoki yo'q deb javob bering.",
          toolsCalled: [],
          state,
        }

      case 'awaitingAmount': {
        const amount = parseAmount(text)
        if (!amount || amount <= 0) {
          return {
            response: "Summani to'g'ri kiriting (masalan: 500000000 yoki 1 mlrd).",
            toolsCalled: [],
            state,
          }
        }
        return {
          response: `${formatAmount(amount)} so'm. Mahsulot/xizmat nomi nima?`,
          toolsCalled: [],
          state: {
            ...state,
            type: 'awaitingProductName',
            collected: { ...state.collected, amount },
          },
        }
      }

      case 'awaitingProductName': {
        const productName = text.trim()
        if (productName.length < 2) {
          return {
            response: "Mahsulot/xizmat nomini kiriting (masalan: Tovar yetkazib berish).",
            toolsCalled: [],
            state,
          }
        }
        const amount = state.collected.amount!
        return {
          response: `Tushundim. ${productName} bo'yicha ${formatAmount(amount)} so'mlik shartnoma yarataymi? (ha/yo'q)`,
          toolsCalled: [],
          state: {
            ...state,
            type: 'awaitingFinalConfirm',
            collected: { ...state.collected, productName },
          },
        }
      }

      case 'awaitingFinalConfirm':
        if (YES_RE.test(text)) return this.createWithCustom(userId, orgId, state)
        if (NO_RE.test(text)) {
          return {
            response: "Bekor qilindi. Yangi STIR yuboring.",
            toolsCalled: [],
            state: null,
          }
        }
        return {
          response: "Ha yoki yo'q deb javob bering.",
          toolsCalled: [],
          state,
        }

      default:
        return {
          response: "Tushunmadim. Yangi STIR yuboring.",
          toolsCalled: [],
          state: null,
        }
    }
  }

  /**
   * Default sozlamalar bilan shartnoma yaratish.
   */
  private async createWithDefaults(
    userId: string, orgId: string, state: ConversationState,
  ): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(userId, orgId)
    return this.createContract({
      userId,
      orgId,
      cpId:         state.cpId!,
      cpName:       state.cpName!,
      contractType: settings.defaultContractType,
      amount:       Number(settings.defaultAmount),
      city:         settings.defaultCity,
      productName:  settings.defaultProductName || undefined,
    })
  }

  /**
   * Custom summa va mahsulot bilan shartnoma yaratish.
   */
  private async createWithCustom(
    userId: string, orgId: string, state: ConversationState,
  ): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(userId, orgId)
    return this.createContract({
      userId,
      orgId,
      cpId:         state.cpId!,
      cpName:       state.cpName!,
      contractType: settings.defaultContractType,
      amount:       state.collected.amount!,
      city:         settings.defaultCity,
      productName:  state.collected.productName || settings.defaultProductName || undefined,
    })
  }

  /**
   * Shartnomani DB'ga yaratadi va keyingi qadamlarni belgilaydi.
   */
  private async createContract(opts: {
    userId:       string
    orgId:        string
    cpId:         string
    cpName:       string
    contractType: string
    amount:       number
    city:         string
    productName?: string
  }): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(opts.userId, opts.orgId)

    // Raqam
    let contractNumber: string | undefined
    try {
      contractNumber = await this.mira.generateContractNumber(opts.userId)
    } catch (e: any) {
      // ASK_EACH bo'lsa — qo'lda so'rashimiz kerak (hozircha avtomatik default)
      contractNumber = undefined
    }

    // Yaratish
    const contract = await this.contracts.create(opts.userId, {
      organizationId: opts.orgId,
      counterpartyId: opts.cpId,
      contractType:   opts.contractType,
      contractNumber: contractNumber,
      contractDate:   new Date().toISOString().split('T')[0],
      city:           opts.city,
      amount:         opts.amount,
      productName:    opts.productName,
    })

    // Mira success counter
    await this.mira.incrementSuccessCount(opts.userId)

    const fmtAmt = formatAmount(opts.amount)
    const needsConfirm = this.mira.needsConfirmation(settings, opts.amount)

    if (needsConfirm) {
      // autoSend yo'q yoki summa chegaradan oshgan — DRAFT qoldiramiz
      return {
        response: `Tayyor! ${opts.cpName} uchun № ${contract.contractNumber} raqamli ${fmtAmt} so'mlik shartnoma yaratildi.\n\nKo'rib chiqing va yuboring.`,
        toolsCalled: [{
          name: 'createContract',
          success: true,
          data: { id: contract.id, number: contract.contractNumber, amount: opts.amount },
        }],
        state: null,
      }
    }

    // autoSend yoqilgan + chegaradan past → frontend imzo so'rashga signal
    return {
      response: `${opts.cpName} uchun № ${contract.contractNumber} raqamli ${fmtAmt} so'mlik shartnoma yaratildi. Imzolab Didox'ga yuboryapman...`,
      toolsCalled: [{
        name: 'createContract',
        success: true,
        data: { id: contract.id, number: contract.contractNumber, amount: opts.amount },
      }],
      state: null,
      pendingSign: {
        contractId:     contract.id,
        contractNumber: contract.contractNumber || '?',
      },
    }
  }

  /**
   * Tezkor statistika.
   */
  private async handleStats(orgId: string): Promise<FastPathResult> {
    const stats = await this.contracts.getStats(orgId)
    const cpCount = await this.prisma.counterparty.count({
      where: { organizationId: orgId, isActive: true },
    })
    return {
      response:
        `Hozirgi holat:\n` +
        `• Jami shartnomalar: ${stats.total}\n` +
        `• Faol: ${stats.active}\n` +
        `• Qoralama: ${stats.draft}\n` +
        `• Kontragentlar: ${cpCount}`,
      toolsCalled: [{ name: 'getStats', success: true, data: { stats, cpCount } }],
      state: null,
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('uz-UZ').format(Math.round(amount))
}

/** "1 mlrd", "500 mln", "750 ming", "1500000" — barchasini raqamga o'giradi. */
function parseAmount(text: string): number | null {
  const cleaned = text.toLowerCase().replace(/[,\s']/g, ' ').trim()

  // mlrd / milliard
  let m = cleaned.match(/(\d+(?:\.\d+)?)\s*(mlrd|milliard|млрд|миллиард)/)
  if (m) return parseFloat(m[1]) * 1_000_000_000

  // mln / million
  m = cleaned.match(/(\d+(?:\.\d+)?)\s*(mln|million|млн|миллион)/)
  if (m) return parseFloat(m[1]) * 1_000_000

  // ming / tysiacha
  m = cleaned.match(/(\d+(?:\.\d+)?)\s*(ming|тыс|тысяч)/)
  if (m) return parseFloat(m[1]) * 1_000

  // Oddiy raqam
  const plain = cleaned.replace(/\s+/g, '')
  const num = parseFloat(plain)
  if (!isNaN(num) && num > 0) return num

  return null
}

function friendlyContractType(type: string): string {
  const map: Record<string, string> = {
    OLDI_SOTDI: 'oldi-sotdi',
    XIZMAT:     "xizmat ko'rsatish",
    IJARA:      'ijara',
    PUDRAT:     'pudrat',
    QOSHIMCHA:  "qo'shimcha",
    MOLIYAVIY:  'moliyaviy',
    DAVAL:      'daval',
    XALQARO:    'xalqaro',
    AGENTLIK:   'agentlik',
    TRANSPORT:  'transport',
    LIZING:     'lizing',
    BOSHQA:     'shartnoma',
  }
  return map[type] || 'shartnoma'
}
