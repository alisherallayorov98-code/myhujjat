import { Injectable, Logger } from '@nestjs/common'
import { getBreaker, CircuitOpenError } from '../health/circuit-breaker'

const SOLIQ_API_KEY     = process.env.SOLIQ_API_KEY     || ''
const SOLIQ_API_URL     = process.env.SOLIQ_API_URL     || ''  // e.g. https://api.soliq.uz/api/integration/v3/tin/%s
const SOLIQ_JSHSHIR_URL = process.env.SOLIQ_JSHSHIR_URL || ''  // e.g. https://api.soliq.uz/api/integration/v3/pinfl/%s

const rateLimits = new Map<string, { n: number; reset: number }>()

function checkRate(userId: string): boolean {
  const now = Date.now()
  const e   = rateLimits.get(userId)
  if (!e || now > e.reset) { rateLimits.set(userId, { n: 1, reset: now + 60_000 }); return true }
  if (e.n >= 20) return false
  e.n++
  return true
}

// Memory leak'ni oldini olish — har 5 daqiqada eski rate limit yozuvlarini tozalash
setInterval(() => {
  const now = Date.now()
  for (const [key, val] of rateLimits.entries()) {
    if (val.reset < now) rateLimits.delete(key)
  }
}, 5 * 60 * 1000).unref?.()

function str(v: unknown): string {
  return v != null && v !== '' ? String(v).trim() : ''
}

/* ============================================================
   STIR — tashkilot normalizatsiyasi
   ============================================================ */
function normalizeCompany(raw: Record<string, any>) {
  const co   = (raw.company               || {}) as Record<string, any>
  const dir  = (raw.director              || {}) as Record<string, any>
  const acct = (raw.accountant            || {}) as Record<string, any>
  const addr = (raw.companyBillingAddress || {}) as Record<string, any>

  const region   = addr.region   as Record<string, any> | null
  const district = addr.district as Record<string, any> | null
  const address  = [
    str(region?.name_uz_latn   || region?.name),
    str(district?.name_uz_latn || district?.name),
    str(addr.streetName        || co.streetName),
  ].filter(Boolean).join(', ')

  const directorName   = [str(dir.lastName),  str(dir.firstName),  str(dir.middleName)].filter(Boolean).join(' ')
  const accountantName = [str(acct.lastName), str(acct.firstName), str(acct.middleName)].filter(Boolean).join(' ')

  const statusDetail = co.statusDetail as Record<string, any> | null
  const statusGroup  = str(statusDetail?.group).toUpperCase()
  const status =
    statusGroup === 'ACTIVE'                                   ? 'active'   :
    statusGroup === 'INACTIVE' || statusGroup === 'LIQUIDATED' ? 'inactive' :
    statusGroup ? 'unknown' : ''

  const okedDetail = co.okedDetail as Record<string, any> | null
  const opfDetail  = co.opfDetail  as Record<string, any> | null
  const bsDetail   = co.businessStructureDetail as Record<string, any> | null

  return {
    name:               str(co.shortName) || str(co.name),
    fullName:           str(co.name),
    inn:                str(co.tin),
    directorName,
    directorPinfl:      str(dir.tin),
    accountantName,
    address,
    postcode:           str(addr.postcode),
    phone:              str(co.phone),
    qqsreg:             str(co.vatNumber),
    status,
    statusText:         str(statusDetail?.name_uz_latn) || str(statusDetail?.name_ru),
    oked:               str(co.oked),
    okedName:           str(okedDetail?.name_short_uz_latn) || str(okedDetail?.name),
    regDate:            str(co.registrationDate),
    regNumber:          str(co.registrationNumber),
    opfName:            str(opfDetail?.name_uz_latn)  || str(opfDetail?.name_ru),
    businessStructure:  str(bsDetail?.name_uz_latn)   || str(bsDetail?.name_ru),
    taxMode:
      co.taxMode === 0 ? 'umumiy' :
      co.taxMode === 1 ? 'soddlashtirilgan' :
      co.taxMode === 2 ? 'yagona' : '',
    ustavCapital:       co.businessFund   ?? null,
    taxpayerType:       co.taxpayerType   ?? null,
    soato:              co.soato          ?? null,
    soogu:              str(co.soogu),
    employeeLimitSmall: okedDetail?.employee_limit_mf ?? null,
    employeeLimitLarge: okedDetail?.employee_limit_lf ?? null,
  }
}

/* ============================================================
   TA'SISCHILAR — aqlli fallback scanning
   ============================================================ */
function extractFounders(raw: Record<string, any>): Array<{ fullName: string; ulush: number }> | null {
  const co = (raw.company ?? {}) as Record<string, any>

  const candidates: unknown[] = [
    raw.founders, raw.participants, raw.shareholders, raw.owners,
    raw.members,  raw.companyMembers, raw.capital_members, raw.tasischilar,
    co.founders,  co.participants, co.members, co.companyMembers,
    co.shareholders, co.owners, co.tasischilar, co.capital_members,
  ]

  function mapList(list: unknown[]): Array<{ fullName: string; ulush: number }> {
    return list.map((item: any) => ({
      fullName:
        [str(item.lastName), str(item.firstName), str(item.middleName)].filter(Boolean).join(' ') ||
        str(item.fullName) || str(item.full_name) || str(item.name) ||
        str(item.fio)      || str(item.FIO)       || str(item.title),
      ulush: parseFloat(String(
        item.percent ?? item.share ?? item.sharePercent ??
        item.shareSize ?? item.ulush ?? item.dol ?? item.participation ?? 0
      )) || 0,
    })).filter(f => f.fullName)
  }

  for (const list of candidates) {
    if (!Array.isArray(list) || list.length === 0) continue
    const mapped = mapList(list)
    if (mapped.length > 0) return mapped
  }

  // Barcha array fieldlarni skan qilish
  function scanObj(obj: Record<string, any>) {
    for (const val of Object.values(obj)) {
      if (!Array.isArray(val) || val.length === 0) continue
      if (typeof val[0] !== 'object' || val[0] === null) continue
      const mapped = mapList(val)
      if (mapped.length > 0) return mapped
    }
    return null
  }

  return scanObj(raw) || scanObj(co) || null
}

/* ============================================================
   JSHSHIR — jismoniy shaxs
   ============================================================ */
function normalizePerson(raw: Record<string, any>) {
  const co  = (raw.company  || {}) as Record<string, any>
  const dir = (raw.director || {}) as Record<string, any>

  const fullName = [str(dir.lastName), str(dir.firstName), str(dir.middleName)]
    .filter(Boolean).join(' ') || str(co.shortName) || str(co.name)

  const addr     = (raw.companyBillingAddress || {}) as Record<string, any>
  const region   = addr.region   as Record<string, any> | null
  const district = addr.district as Record<string, any> | null
  const address  = [
    str(region?.name_uz_latn   || region?.name),
    str(district?.name_uz_latn || district?.name),
    str(addr.streetName        || co.streetName),
  ].filter(Boolean).join(', ')

  const statusGroup  = str((co.statusDetail as any)?.group).toUpperCase()
  const status = statusGroup === 'ACTIVE' ? 'active' : statusGroup ? 'inactive' : ''

  return {
    fullName,
    pinfl:   str(co.tin) || str(dir.tin),
    address,
    status,
    oked:    str(co.oked),
    regDate: str(co.registrationDate),
  }
}

/* ============================================================
   SERVICE
   ============================================================ */
@Injectable()
export class StirService {
  private readonly logger = new Logger(StirService.name)

  private async fetchSoliq(url: string): Promise<Record<string, any>> {
    const res = await fetch(url + '?type=full', {
      headers: {
        'X-API-KEY':    SOLIQ_API_KEY,
        'Accept':       'application/json',
        'Content-Type': 'application/json',
      },
      signal: AbortSignal.timeout(20_000),
    })

    if (!res.ok) {
      if (res.status === 404) throw Object.assign(new Error('Topilmadi'), { status: 404 })
      if (res.status === 401 || res.status === 403)
        throw Object.assign(new Error("API kaliti noto'g'ri"), { status: 401 })
      const text = await res.text().catch(() => '')
      throw Object.assign(new Error(`Soliq API xatoligi: ${res.status} ${text}`), { status: 502 })
    }
    return res.json()
  }

  async getCompanyByInn(inn: string, userId?: string): Promise<any> {
    if (userId && !checkRate(userId)) {
      throw Object.assign(new Error("Juda ko'p so'rov. Biroz kuting."), { status: 429 })
    }
    const cleanInn = inn.replace(/\D/g, '')
    if (!/^\d{9}$/.test(cleanInn))
      throw Object.assign(new Error("STIR 9 ta raqamdan iborat bo'lishi kerak"), { status: 400 })
    if (!SOLIQ_API_KEY || !SOLIQ_API_URL)
      throw Object.assign(new Error('Soliq API sozlanmagan'), { status: 503 })

    const breaker = getBreaker('soliq-api', { failureThreshold: 5, resetTimeoutMs: 5 * 60 * 1000 })

    try {
      const raw = await breaker.exec(() => this.fetchSoliq(SOLIQ_API_URL.replace('%s', cleanInn)))
      return normalizeCompany(raw)
    } catch (err: any) {
      if (err instanceof CircuitOpenError) {
        throw Object.assign(
          new Error("Soliq API vaqtincha mavjud emas — keyinroq urining"),
          { status: 503 }
        )
      }
      this.logger.error(`STIR ${cleanInn}: ${err.message}`)
      if (err.status === 404) throw Object.assign(new Error("Bu STIR bo'yicha tashkilot topilmadi"), { status: 404 })
      if (err.message?.includes('timeout') || err.message?.includes('abort'))
        throw Object.assign(new Error('Soliq API javob bermadi (timeout)'), { status: 504 })
      throw Object.assign(new Error("Soliq API bilan bog'lanishda xatolik"), { status: 502 })
    }
  }

  async getFounders(inn: string): Promise<any> {
    const cleanInn = inn.replace(/\D/g, '')
    if (!/^\d{9}$/.test(cleanInn))
      throw Object.assign(new Error("STIR 9 ta raqamdan iborat bo'lishi kerak"), { status: 400 })
    if (!SOLIQ_API_KEY || !SOLIQ_API_URL)
      return { founders: null, notReady: true }

    try {
      const raw          = await this.fetchSoliq(SOLIQ_API_URL.replace('%s', cleanInn))
      const founders     = extractFounders(raw)
      const ustavKapital = (raw.company as any)?.businessFund ??
                           (raw.company as any)?.authorizedCapital ??
                           raw.authorizedCapital ?? null
      return { founders, ustavKapital: ustavKapital ? String(ustavKapital) : '' }
    } catch (err: any) {
      this.logger.error(`STIR founders ${cleanInn}: ${err.message}`)
      return { founders: null }
    }
  }

  async checkPinfl(pinfl: string): Promise<any> {
    const cleanPinfl = pinfl.replace(/\D/g, '')
    if (!/^\d{14}$/.test(cleanPinfl))
      throw Object.assign(new Error('JSHSHIR 14 ta raqamdan iborat bo\'lishi kerak'), { status: 400 })
    if (!SOLIQ_API_KEY || !SOLIQ_JSHSHIR_URL)
      throw Object.assign(new Error('Soliq JSHSHIR API sozlanmagan'), { status: 503 })

    try {
      const raw = await this.fetchSoliq(SOLIQ_JSHSHIR_URL.replace('%s', cleanPinfl))
      return normalizePerson(raw)
    } catch (err: any) {
      this.logger.error(`JSHSHIR ${cleanPinfl}: ${err.message}`)
      if (err.status === 404) throw Object.assign(new Error("Bu JSHSHIR bo'yicha ma'lumot topilmadi"), { status: 404 })
      throw Object.assign(new Error('JSHSHIR tekshirishda xatolik'), { status: 502 })
    }
  }
}
