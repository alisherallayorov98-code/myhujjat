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
  type:    'awaitingStandardConfirm' | 'awaitingAmount' | 'awaitingProductName' | 'awaitingFinalConfirm' | 'awaitingCounterpartyName' | 'awaitingContractNumber'
  stir:    string
  cpId?:   string
  cpName?: string
  collected: {
    amount?:          number
    productName?:     string
    endDate?:         string  // ISO 8601
    contractNumber?:  string  // ask-each sxemasi uchun
  }
  startedAt: number
  // awaitingContractNumber holati uchun: barcha ma'lumotlar tayyor, faqat raqam kerak
  pendingContractData?: {
    contractType: string
    amount:       number
    city:         string
    productName?: string
    endDate?:     string
  }
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

const STATS_RE       = /^\s*(statistika|стат(ис)?|stat|st)\s*$/i
const LIST_RE        = /^\s*(ro['ʻ']?yxat|рўйхат|список|list|shartnomalar|шартномалар|договоры)\s*$/i
const CP_LIST_RE     = /^\s*(kontragentlar|контрагентлар|контрагенты|partners?|hamkorlar|ҳамкорлар)\s*$/i
const CONTRACT_NUM_RE = /^\s*(SH|sh)-\d{4}[\\/]\d{2}-\d{3,}\s*$/i

// ─── Sana parserlari ──────────────────────────────────────────
const MONTHS: Record<string, number> = {
  yanvar: 1, yanvarda: 1, yanvargacha: 1,
  fevral: 2, fevralgacha: 2, fevralda: 2,
  mart: 3, martda: 3, martgacha: 3,
  aprel: 4, aprelda: 4, aprelgacha: 4,
  may: 5, mayda: 5, maygacha: 5,
  iyun: 6, iyunda: 6, iyungacha: 6,
  iyul: 7, iyulda: 7, iyulgacha: 7,
  avgust: 8, avgustda: 8, avgustgacha: 8,
  sentabr: 9, sentabrda: 9, sentabrgacha: 9,
  oktabr: 10, oktabrda: 10, oktabrgacha: 10,
  noyabr: 11, noyabrda: 11, noyabrgacha: 11,
  dekabr: 12, dekabrda: 12, dekabrgacha: 12,
  // Rus tilidagi oylar
  январь: 1, февраль: 2, март: 3, апрель: 4,
  май: 5, июнь: 6, июль: 7, август: 8,
  сентябрь: 9, октябрь: 10, ноябрь: 11, декабрь: 12,
}

/**
 * "31 dekabrga", "1 yilga", "6 oygacha", "3 oy" kabi patternlardan
 * endDate (ISO 8601) ni chiqaradi. Topilmasa null qaytaradi.
 */
function parseEndDate(text: string): string | null {
  const t = text.toLowerCase().trim()
  const now = new Date()

  // "N yilga" / "N yilgacha" / "N yil"
  let m = t.match(/(\d+)\s*yil(ga(cha)?)?/)
  if (m) {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + parseInt(m[1]))
    return d.toISOString().split('T')[0]
  }

  // "N oygacha" / "N oyga" / "N oy"
  m = t.match(/(\d+)\s*oy(ga(cha)?)?/)
  if (m) {
    const d = new Date(now)
    d.setMonth(d.getMonth() + parseInt(m[1]))
    return d.toISOString().split('T')[0]
  }

  // "N kungacha" / "N kun"
  m = t.match(/(\d+)\s*kun(ga(cha)?)?/)
  if (m) {
    const d = new Date(now)
    d.setDate(d.getDate() + parseInt(m[1]))
    return d.toISOString().split('T')[0]
  }

  // "31 dekabrga" / "31 dekabr" / "31 dekabr 2026"
  m = t.match(/(\d{1,2})\s+([a-zа-яё]+)\s*(\d{4})?/)
  if (m) {
    const day   = parseInt(m[1])
    const month = MONTHS[m[2]]
    const year  = m[3] ? parseInt(m[3]) : (month < now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear())
    if (month && day >= 1 && day <= 31) {
      const mm = String(month).padStart(2, '0')
      const dd = String(day).padStart(2, '0')
      return `${year}-${mm}-${dd}`
    }
  }

  return null
}

// ─── Ko'p tilli FastPath javoblari ───────────────────────────
type Lang = 'uz' | 'oz' | 'ru'

const MESSAGES: Record<string, Record<Lang, string>> = {
  stirNotFoundAsk: {
    uz: `STIR {stir} davlat ro'yxatida topilmadi. Kompaniya nomini ayting — men qo'shib shartnoma tuzaman.`,
    oz: `STIR {stir} давлат рўйхатида топилмади. Компания номини айтинг — мен қўшиб шартнома тузаман.`,
    ru: `ИНН {stir} не найден в госреестре. Назовите название компании — я добавлю и создам договор.`,
  },
  counterpartyCreated: {
    uz: `{name} qo'shildi! Standart {type} — {amount} so'm uchun shartnoma yarataymi? (ha/yo'q)`,
    oz: `{name} қўшилди! Стандарт {type} — {amount} сўм учун шартнома ярataymi? (ҳа/йўқ)`,
    ru: `{name} добавлен! Создать стандартный договор {type} на {amount} сум? (да/нет)`,
  },
  counterpartyCreateError: {
    uz: `Kontragent yaratishda xato: {error}. Qaytadan urinib ko'ring.`,
    oz: `Контрагент яратишда хато: {error}. Қайтадан уриниб кўринг.`,
    ru: `Ошибка при создании контрагента: {error}. Попробуйте ещё раз.`,
  },
  askCounterpartyName: {
    uz: `Kompaniya nomini kiriting (kamida 2 ta belgi).`,
    oz: `Компания номини киритинг (камида 2 та белги).`,
    ru: `Введите название компании (минимум 2 символа).`,
  },
  standardConfirm: {
    uz: `{cpName} topildi.\nStandart {type} — {amount} so'm uchun shartnoma yarataymi? (ha/yo'q)`,
    oz: `{cpName} топилди.\nСтандарт {type} — {amount} сўм учун шартнома ярataymi? (ҳа/йўқ)`,
    ru: `{cpName} найден.\nСоздать стандартный договор {type} на {amount} сум? (да/нет)`,
  },
  askAmount: {
    uz: `Yaxshi. Shartnoma summasi qancha bo'lsin? (so'mda raqam yozing)`,
    oz: `Яхши. Шартнома суммаси қанча бўлсин? (сўмда рақам ёзинг)`,
    ru: `Хорошо. Какая сумма договора? (введите цифру в сумах)`,
  },
  invalidAmount: {
    uz: `Summani to'g'ri kiriting (masalan: 500000000 yoki 1 mlrd).`,
    oz: `Суммани тўғри киритинг (масалан: 500000000 ёки 1 млрд).`,
    ru: `Введите корректную сумму (например: 500000000 или 1 млрд).`,
  },
  askProductName: {
    uz: `{amount} so'm. Mahsulot/xizmat nomi nima?`,
    oz: `{amount} сўм. Маҳсулот/хизмат номи нима?`,
    ru: `{amount} сум. Что за товар/услуга?`,
  },
  invalidProductName: {
    uz: `Mahsulot/xizmat nomini kiriting (masalan: Tovar yetkazib berish).`,
    oz: `Маҳсулот/хизмат номини киритинг (масалан: Товар етказиб бериш).`,
    ru: `Введите название товара/услуги (например: Поставка товара).`,
  },
  finalConfirm: {
    uz: `Tushundim. {productName} bo'yicha {amount} so'mlik shartnoma yarataymi? (ha/yo'q)`,
    oz: `Тушундим. {productName} бўйича {amount} сўмлик шартнома ярataymi? (ҳа/йўқ)`,
    ru: `Понял. Создать договор на {productName} на сумму {amount} сум? (да/нет)`,
  },
  askContractNumber: {
    uz: `Shartnoma raqamini ayting (masalan: 45 yoki DV-12).`,
    oz: `Шартнома рақамини айтинг (масалан: 45 ёки DV-12).`,
    ru: `Назовите номер договора (например: 45 или ДВ-12).`,
  },
  invalidContractNumber: {
    uz: `Raqamni kiriting (masalan: 45 yoki DV-12).`,
    oz: `Рақамни киритинг (масалан: 45 ёки DV-12).`,
    ru: `Введите номер (например: 45 или ДВ-12).`,
  },
  cancelled: {
    uz: `Bekor qilindi. Yangi STIR yuboring.`,
    oz: `Бекор қилинди. Янги СТИР юборинг.`,
    ru: `Отменено. Отправьте новый ИНН.`,
  },
  cancelledSimple: {
    uz: `Bekor qilindi.`,
    oz: `Бекор қилинди.`,
    ru: `Отменено.`,
  },
  timeout: {
    uz: `Suhbat to'xtatildi (vaqt o'tdi). STIR raqamini qaytadan yuboring.`,
    oz: `Суҳбат тўхтатилди (вақт ўтди). СТИР рақамини қайтадан юборинг.`,
    ru: `Сессия завершена (время вышло). Отправьте ИНН повторно.`,
  },
  notUnderstood: {
    uz: `Tushunmadim. Yangi STIR yuboring.`,
    oz: `Тушунмадим. Янги СТИР юборинг.`,
    ru: `Не понял. Отправьте новый ИНН.`,
  },
  yesOrNo: {
    uz: `Iltimos, ha yoki yo'q deb javob bering.`,
    oz: `Илтимос, ҳа ёки йўқ деб жавоб беринг.`,
    ru: `Ответьте, пожалуйста, да или нет.`,
  },
  contractCreated: {
    uz: `Tayyor! {cpName} uchun № {number} raqamli {amount} so'mlik shartnoma yaratildi.\n\nKo'rib chiqing va yuboring.`,
    oz: `Тайёр! {cpName} учун № {number} рақамли {amount} сўмлик шартнома яратилди.\n\nКўриб чиқинг ва юборинг.`,
    ru: `Готово! Создан договор № {number} для {cpName} на {amount} сум.\n\nПроверьте и отправьте.`,
  },
  contractAutoSend: {
    uz: `{cpName} uchun № {number} raqamli {amount} so'mlik shartnoma yaratildi. Imzolab Didox'ga yuboryapman...`,
    oz: `{cpName} учун № {number} рақамли {amount} сўмлик шартнома яратилди. Имзолаб Didox'га юборяпман...`,
    ru: `Создан договор № {number} для {cpName} на {amount} сум. Подписываю и отправляю в Didox...`,
  },
  noContracts: {
    uz: `Hali shartnoma yaratilmagan.`,
    oz: `Ҳали шартнома яратилмаган.`,
    ru: `Договоры ещё не созданы.`,
  },
  contractList: {
    uz: `So'nggi {count} ta shartnoma:\n{lines}`,
    oz: `Сўнгги {count} та шартнома:\n{lines}`,
    ru: `Последние {count} договоров:\n{lines}`,
  },
  noCp: {
    uz: `Hali kontragent qo'shilmagan.`,
    oz: `Ҳали контрагент қўшилмаган.`,
    ru: `Контрагенты ещё не добавлены.`,
  },
  cpList: {
    uz: `Sizda jami {total} ta kontragent bor: {names}{suffix}.`,
    oz: `Сизда жами {total} та контрагент бор: {names}{suffix}.`,
    ru: `Всего контрагентов: {total}. {names}{suffix}.`,
  },
  cpListSuffix: {
    uz: ` va yana {n} ta boshqa`,
    oz: ` ва яна {n} та бошқа`,
    ru: ` и ещё {n}`,
  },
  contractNotFound: {
    uz: `{number} raqamli shartnoma topilmadi.`,
    oz: `{number} рақамли шартнома топилмади.`,
    ru: `Договор № {number} не найден.`,
  },
  contractDetail: {
    uz: `№{number}: {cp}, {amount} so'm, status: {status}. {signed}.`,
    oz: `№{number}: {cp}, {amount} сўм, статус: {status}. {signed}.`,
    ru: `№{number}: {cp}, {amount} сум, статус: {status}. {signed}.`,
  },
  signedBoth: {
    uz: `Ikki tomon imzolagan`,
    oz: `Икки томон имзолаган`,
    ru: `Подписан обеими сторонами`,
  },
  signedUs: {
    uz: `Biz imzolagan, kontragent kutmoqda`,
    oz: `Биз имзолаган, контрагент кутмоқда`,
    ru: `Мы подписали, ждём контрагента`,
  },
  signedNone: {
    uz: `Imzolanmagan`,
    oz: `Имзоланмаган`,
    ru: `Не подписан`,
  },
  statsResult: {
    uz: `Hozirgi holat:\n• Jami shartnomalar: {total}\n• Faol: {active}\n• Qoralama: {draft}\n• Kontragentlar: {cpCount}`,
    oz: `Ҳозирги ҳолат:\n• Жами шартномалар: {total}\n• Фаол: {active}\n• Қоралама: {draft}\n• Контрагентлар: {cpCount}`,
    ru: `Текущее состояние:\n• Договоров всего: {total}\n• Активных: {active}\n• Черновиков: {draft}\n• Контрагентов: {cpCount}`,
  },
}

/** Xabar shablonini to'ldiradi: `{key}` → qiymat */
function msg(key: string, lang: Lang, vars: Record<string, string | number> = {}): string {
  const template = MESSAGES[key]?.[lang] ?? MESSAGES[key]?.['uz'] ?? key
  return template.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`))
}

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
    const lang: Lang = opts.targetLang || 'uz'

    // ─── 1. Davom etayotgan suhbat (state machine) ─────────────
    if (opts.state) {
      return this.continueConversation(text, opts.userId, opts.orgId, opts.state, lang)
    }

    // ─── 2. Yangi STIR raqami (faqat 9 raqam) ───────────────────
    if (SIMPLE_STIR_RE.test(text)) {
      return this.handleStirOnly(text.replace(/\D/g, ''), opts.userId, opts.orgId, text, lang)
    }

    // ─── 3. STIR ichida boshqa matn ham bor (LLM ga ket) ────────
    if (STIR_RE.test(text) && text.length > 12) {
      return null  // LLM aralashsin
    }

    // ─── 4. Tezkor "statistika" ─────────────────────────────────
    if (STATS_RE.test(text)) {
      return this.handleStats(opts.orgId, lang)
    }

    // ─── 5. "ro'yxat" / "список" → so'nggi 5 ta shartnoma ──────
    if (LIST_RE.test(text)) {
      return this.handleListContracts(opts.orgId, lang)
    }

    // ─── 6. "kontragentlar" → top-5 kontragent ──────────────────
    if (CP_LIST_RE.test(text)) {
      return this.handleListCounterparties(opts.orgId, lang)
    }

    // ─── 7. "SH-2026/05-001" → shartnoma tafsilotlari ──────────
    if (CONTRACT_NUM_RE.test(text)) {
      return this.handleContractByNumber(text.trim().toUpperCase(), opts.orgId, lang)
    }

    // ─── Boshqa — LLM ga ────────────────────────────────────────
    return null
  }

  /**
   * Foydalanuvchi faqat 9-raqamli STIR yozdi.
   * originalText orqali endDate ham parse qilinadi (agar berilgan bo'lsa).
   */
  private async handleStirOnly(stir: string, userId: string, orgId: string, originalText = '', lang: Lang = 'uz'): Promise<FastPathResult> {
    const endDate = parseEndDate(originalText) || undefined
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
          response: msg('stirNotFoundAsk', lang, { stir }),
          toolsCalled: [{ name: 'searchStir', success: false, error: err?.message }],
          state: {
            type:      'awaitingCounterpartyName',
            stir,
            collected: { endDate },
            startedAt: Date.now(),
          },
        }
      }
    }

    const amount   = Number(settings.defaultAmount)
    const typeName = friendlyContractType(settings.defaultContractType)

    return {
      response: msg('standardConfirm', lang, { cpName, type: typeName, amount: formatAmount(amount) }),
      toolsCalled: [
        { name: 'searchStir', success: true, data: { name: cpName } },
      ],
      state: {
        type: 'awaitingStandardConfirm',
        stir,
        cpId:   cp!.id,
        cpName,
        collected: { endDate },
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
    lang:   Lang = 'uz',
  ): Promise<FastPathResult> {
    if (Date.now() - state.startedAt > 5 * 60_000) {
      return { response: msg('timeout', lang), toolsCalled: [], state: null }
    }

    switch (state.type) {
      case 'awaitingStandardConfirm':
        if (YES_RE.test(text)) return this.createWithDefaults(userId, orgId, state, lang)
        if (NO_RE.test(text)) {
          return {
            response: msg('askAmount', lang),
            toolsCalled: [],
            state: { ...state, type: 'awaitingAmount' },
          }
        }
        return { response: msg('yesOrNo', lang), toolsCalled: [], state }

      case 'awaitingAmount': {
        const amount = parseAmount(text)
        if (!amount || amount <= 0) {
          return { response: msg('invalidAmount', lang), toolsCalled: [], state }
        }
        return {
          response: msg('askProductName', lang, { amount: formatAmount(amount) }),
          toolsCalled: [],
          state: { ...state, type: 'awaitingProductName', collected: { ...state.collected, amount } },
        }
      }

      case 'awaitingProductName': {
        const productName = text.trim()
        if (productName.length < 2) {
          return { response: msg('invalidProductName', lang), toolsCalled: [], state }
        }
        const amount = state.collected.amount!
        return {
          response: msg('finalConfirm', lang, { productName, amount: formatAmount(amount) }),
          toolsCalled: [],
          state: { ...state, type: 'awaitingFinalConfirm', collected: { ...state.collected, productName } },
        }
      }

      case 'awaitingFinalConfirm':
        if (YES_RE.test(text)) return this.createWithCustom(userId, orgId, state, lang)
        if (NO_RE.test(text)) {
          return { response: msg('cancelled', lang), toolsCalled: [], state: null }
        }
        return { response: msg('yesOrNo', lang), toolsCalled: [], state }

      case 'awaitingCounterpartyName': {
        const name = text.trim()
        if (NO_RE.test(text)) {
          return { response: msg('cancelled', lang), toolsCalled: [], state: null }
        }
        if (name.length < 2) {
          return { response: msg('askCounterpartyName', lang), toolsCalled: [], state }
        }
        let cp: any
        try {
          cp = await this.cps.create({ organizationId: orgId, name, inn: state.stir })
        } catch (err: any) {
          return {
            response: msg('counterpartyCreateError', lang, { error: err?.message }),
            toolsCalled: [{ name: 'createCounterparty', success: false, error: err?.message }],
            state: null,
          }
        }
        const settings = await this.mira.getOrCreate(userId, orgId)
        const amount    = Number(settings.defaultAmount)
        const typeName  = friendlyContractType(settings.defaultContractType)
        return {
          response: msg('counterpartyCreated', lang, { name: cp.name, type: typeName, amount: formatAmount(amount) }),
          toolsCalled: [{ name: 'createCounterparty', success: true, data: { id: cp.id, name: cp.name } }],
          state: {
            type:      'awaitingStandardConfirm',
            stir:      state.stir,
            cpId:      cp.id,
            cpName:    cp.name,
            collected: state.collected,
            startedAt: Date.now(),
          },
        }
      }

      case 'awaitingContractNumber': {
        const num = text.trim()
        if (NO_RE.test(text)) {
          return { response: msg('cancelledSimple', lang), toolsCalled: [], state: null }
        }
        if (num.length < 1) {
          return { response: msg('invalidContractNumber', lang), toolsCalled: [], state }
        }
        const d = state.pendingContractData!
        return this.createContract({
          userId, orgId,
          cpId:                   state.cpId!,
          cpName:                 state.cpName!,
          contractType:           d.contractType,
          amount:                 d.amount,
          city:                   d.city,
          productName:            d.productName,
          endDate:                d.endDate,
          contractNumberOverride: num,
          lang,
        })
      }

      default:
        return { response: msg('notUnderstood', lang), toolsCalled: [], state: null }
    }
  }

  /**
   * Default sozlamalar bilan shartnoma yaratish.
   */
  private async createWithDefaults(
    userId: string, orgId: string, state: ConversationState, lang: Lang = 'uz',
  ): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(userId, orgId)

    if (settings.numberingScheme === 'ask-each') {
      return {
        response: msg('askContractNumber', lang),
        toolsCalled: [],
        state: {
          ...state,
          type: 'awaitingContractNumber',
          pendingContractData: {
            contractType: settings.defaultContractType,
            amount:       Number(settings.defaultAmount),
            city:         settings.defaultCity,
            productName:  settings.defaultProductName || undefined,
            endDate:      state.collected.endDate,
          },
        },
      }
    }

    return this.createContract({
      userId, orgId,
      cpId:         state.cpId!,
      cpName:       state.cpName!,
      contractType: settings.defaultContractType,
      amount:       Number(settings.defaultAmount),
      city:         settings.defaultCity,
      productName:  settings.defaultProductName || undefined,
      endDate:      state.collected.endDate,
      lang,
    })
  }

  /**
   * Custom summa va mahsulot bilan shartnoma yaratish.
   */
  private async createWithCustom(
    userId: string, orgId: string, state: ConversationState, lang: Lang = 'uz',
  ): Promise<FastPathResult> {
    const settings = await this.mira.getOrCreate(userId, orgId)

    if (settings.numberingScheme === 'ask-each') {
      return {
        response: msg('askContractNumber', lang),
        toolsCalled: [],
        state: {
          ...state,
          type: 'awaitingContractNumber',
          pendingContractData: {
            contractType: settings.defaultContractType,
            amount:       state.collected.amount!,
            city:         settings.defaultCity,
            productName:  state.collected.productName || settings.defaultProductName || undefined,
            endDate:      state.collected.endDate,
          },
        },
      }
    }

    return this.createContract({
      userId, orgId,
      cpId:         state.cpId!,
      cpName:       state.cpName!,
      contractType: settings.defaultContractType,
      amount:       state.collected.amount!,
      city:         settings.defaultCity,
      productName:  state.collected.productName || settings.defaultProductName || undefined,
      endDate:      state.collected.endDate,
      lang,
    })
  }

  /**
   * Shartnomani DB'ga yaratadi va keyingi qadamlarni belgilaydi.
   */
  private async createContract(opts: {
    userId:                  string
    orgId:                   string
    cpId:                    string
    cpName:                  string
    contractType:            string
    amount:                  number
    city:                    string
    productName?:            string
    endDate?:                string
    contractNumberOverride?: string  // ask-each sxemasi uchun foydalanuvchi qo'lda bergan raqam
    lang?:                   Lang
  }): Promise<FastPathResult> {
    const lang = opts.lang || 'uz'
    const settings = await this.mira.getOrCreate(opts.userId, opts.orgId)

    // Raqam — override berilgan bo'lsa shuni ishlatamiz
    let contractNumber: string | undefined = opts.contractNumberOverride
    if (!contractNumber) {
      try {
        contractNumber = await this.mira.generateContractNumber(opts.userId)
      } catch (e: any) {
        contractNumber = undefined
      }
    }

    // Yaratish
    const contract = await this.contracts.create(opts.userId, {
      organizationId: opts.orgId,
      counterpartyId: opts.cpId,
      contractType:   opts.contractType,
      contractNumber: contractNumber,
      contractDate:   new Date().toISOString().split('T')[0],
      endDate:        opts.endDate,
      city:           opts.city,
      amount:         opts.amount,
      productName:    opts.productName,
      createdByMira:  true,
    })

    // Mira success counter
    await this.mira.incrementSuccessCount(opts.userId)

    const fmtAmt = formatAmount(opts.amount)
    const needsConfirm = this.mira.needsConfirmation(settings, opts.amount)

    if (needsConfirm) {
      return {
        response: msg('contractCreated', lang, {
          cpName: opts.cpName,
          number: contract.contractNumber || '?',
          amount: fmtAmt,
        }),
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
      response: msg('contractAutoSend', lang, {
        cpName: opts.cpName,
        number: contract.contractNumber || '?',
        amount: fmtAmt,
      }),
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

  /** So'nggi 5 ta shartnoma ro'yxati. */
  private async handleListContracts(orgId: string, lang: Lang = 'uz'): Promise<FastPathResult> {
    const contracts = await this.prisma.contract.findMany({
      where:   { organizationId: orgId, isActive: true },
      take:    5,
      orderBy: { createdAt: 'desc' },
      select:  { contractNumber: true, amount: true, status: true, counterparty: { select: { name: true } } },
    })
    if (contracts.length === 0) {
      return { response: msg('noContracts', lang), toolsCalled: [{ name: 'listContracts', success: true, data: [] }], state: null }
    }
    const lines = contracts.map((c, i) =>
      `${i + 1}. №${c.contractNumber} — ${c.counterparty?.name || '—'} — ${formatAmount(Number(c.amount))} [${c.status}]`
    ).join('\n')
    return {
      response: msg('contractList', lang, { count: contracts.length, lines }),
      toolsCalled: [{ name: 'listContracts', success: true, data: contracts }],
      state: null,
    }
  }

  /** Top-5 kontragent ro'yxati. */
  private async handleListCounterparties(orgId: string, lang: Lang = 'uz'): Promise<FastPathResult> {
    const cps = await this.prisma.counterparty.findMany({
      where:   { organizationId: orgId, isActive: true },
      take:    5,
      orderBy: { createdAt: 'desc' },
      select:  { id: true, name: true, inn: true },
    })
    const total = await this.prisma.counterparty.count({ where: { organizationId: orgId, isActive: true } })
    if (total === 0) {
      return { response: msg('noCp', lang), toolsCalled: [{ name: 'findCounterparty', success: true, data: [] }], state: null }
    }
    const names  = cps.map(c => c.name).join(', ')
    const suffix = total > 5 ? msg('cpListSuffix', lang, { n: total - 5 }) : ''
    return {
      response: msg('cpList', lang, { total, names, suffix }),
      toolsCalled: [{ name: 'findCounterparty', success: true, data: cps }],
      state: null,
    }
  }

  /** Shartnoma raqami bo'yicha tafsilot (masalan: SH-2026/05-001). */
  private async handleContractByNumber(contractNumber: string, orgId: string, lang: Lang = 'uz'): Promise<FastPathResult> {
    const contract = await this.prisma.contract.findFirst({
      where: { organizationId: orgId, contractNumber, isActive: true },
      select: {
        id: true, contractNumber: true, amount: true, status: true,
        signedUs: true, signedCp: true,
        counterparty: { select: { name: true } },
      },
    })
    if (!contract) {
      return {
        response: msg('contractNotFound', lang, { number: contractNumber }),
        toolsCalled: [{ name: 'getContractDetails', success: false, error: 'Topilmadi' }],
        state: null,
      }
    }
    const cp     = contract.counterparty?.name || '—'
    const amount = formatAmount(Number(contract.amount))
    const signed = contract.signedUs && contract.signedCp
      ? msg('signedBoth', lang)
      : contract.signedUs
      ? msg('signedUs',   lang)
      : msg('signedNone', lang)
    return {
      response: msg('contractDetail', lang, { number: contract.contractNumber || '?', cp, amount, status: contract.status, signed }),
      toolsCalled: [{ name: 'getContractDetails', success: true, data: { id: contract.id, contractNumber: contract.contractNumber } }],
      state: null,
    }
  }

  /** Tezkor statistika. */
  private async handleStats(orgId: string, lang: Lang = 'uz'): Promise<FastPathResult> {
    const stats   = await this.contracts.getStats(orgId)
    const cpCount = await this.prisma.counterparty.count({ where: { organizationId: orgId, isActive: true } })
    return {
      response: msg('statsResult', lang, { total: stats.total, active: stats.active, draft: stats.draft, cpCount }),
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
