import type { SpecItem } from '@/lib/qqs'
import { calcSpecTotals }    from '@/lib/qqs'
import { formatAmountWords } from '@/lib/formatters'

// ============================================
// FAKTURA
// ============================================
export interface FakturaData {
  raqam:      string
  sana:       string
  orgNomi:    string
  orgInn:     string
  orgRahbar:  string
  orgBank:    string
  orgHisob:   string
  orgMfo:     string
  orgManzil:  string
  cpNomi:     string
  cpInn:      string
  cpRahbar:   string
  cpBank:     string
  cpHisob:    string
  cpMfo:      string
  cpManzil:   string
  items:      SpecItem[]
  notes?:     string
  shartnoma?: string
}

export function generateFakturaText(d: FakturaData): string {
  const totals = calcSpecTotals(d.items)

  const itemLines = d.items.map((item, i) =>
    `${i + 1}. ${item.nomi} — ${item.miqdori} ${item.birlik} × ${item.narxi.toLocaleString('uz-UZ')} so'm` +
    (item.qqsFoiz !== 'siz' ? ` + QQS ${item.qqsFoiz}%` : '') +
    ` = ${item.summa.toLocaleString('uz-UZ')} so'm`
  ).join('\n')

  return `HISOB-FAKTURA № ${d.raqam}
${d.sana}
${d.shartnoma ? `Shartnoma asosida: ${d.shartnoma}` : ''}

SOTUVCHI:                              XARIDOR:
${d.orgNomi.padEnd(38)} ${d.cpNomi}
INN: ${(d.orgInn || '—').padEnd(33)} INN: ${d.cpInn || '—'}
Bank: ${(d.orgBank || '—').padEnd(32)} Bank: ${d.cpBank || '—'}
H/r: ${(d.orgHisob || '—').padEnd(33)} H/r: ${d.cpHisob || '—'}
MFO: ${(d.orgMfo || '—').padEnd(33)} MFO: ${d.cpMfo || '—'}

TOVARLAR VA XIZMATLAR:
${'─'.repeat(60)}
${itemLines}
${'─'.repeat(60)}
Jami (QQS siz):  ${totals.jami.toLocaleString('uz-UZ')} so'm
Jami QQS:        ${totals.jamiQqs.toLocaleString('uz-UZ')} so'm
UMUMIY JAMI:     ${totals.umumiy.toLocaleString('uz-UZ')} so'm

Yozuvda: ${formatAmountWords(totals.umumiy)}

${d.notes ? `Izoh: ${d.notes}` : ''}

Rahbar:    _________________ / ${d.orgRahbar} /
Hisobchi:  _________________`
}

// ============================================
// AKT-SVERKA
// ============================================
export interface AktSverkaMovement {
  sana:    string
  hujjat:  string
  debet:   number
  kredit:  number
  izoh?:   string
}

export interface AktSverkaData {
  raqam:              string
  sana:               string
  davr:               string
  orgNomi:            string
  orgInn:             string
  orgRahbar:          string
  cpNomi:             string
  cpInn:              string
  cpRahbar:           string
  movements:          AktSverkaMovement[]
  boshlangichQoldiq:  number
}

export function generateAktSverkaText(d: AktSverkaData): string {
  let qoldiq     = d.boshlangichQoldiq
  let jamiDebet  = 0
  let jamiKredit = 0

  const movLines = d.movements.map(m => {
    jamiDebet  += m.debet
    jamiKredit += m.kredit
    qoldiq     += m.debet - m.kredit
    return `${m.sana.padEnd(12)} ${m.hujjat.padEnd(20)} ${
      m.debet  > 0 ? m.debet.toLocaleString('uz-UZ').padStart(14)  : ''.padStart(14)} ${
      m.kredit > 0 ? m.kredit.toLocaleString('uz-UZ').padStart(14) : ''.padStart(14)} ${
      qoldiq.toLocaleString('uz-UZ').padStart(14)}`
  }).join('\n')

  const oxirigiQoldiq = d.boshlangichQoldiq + jamiDebet - jamiKredit

  return `AKT-SVERKA № ${d.raqam}
${d.sana}
Davr: ${d.davr}

${d.orgNomi} va ${d.cpNomi} o'rtasidagi
o'zaro hisob-kitoblar yuzasidan akt-sverka

${'─'.repeat(70)}
Sana         Hujjat              Debet (so'm)  Kredit (so'm)  Qoldiq (so'm)
${'─'.repeat(70)}
Boshlanish qoldig'i:${' '.repeat(30)}${d.boshlangichQoldiq.toLocaleString('uz-UZ').padStart(14)}
${movLines}
${'─'.repeat(70)}
JAMI:${' '.repeat(29)}${jamiDebet.toLocaleString('uz-UZ').padStart(14)} ${jamiKredit.toLocaleString('uz-UZ').padStart(14)} ${oxirigiQoldiq.toLocaleString('uz-UZ').padStart(14)}
${'─'.repeat(70)}

Yakuniy qoldiq: ${oxirigiQoldiq.toLocaleString('uz-UZ')} so'm
(${formatAmountWords(Math.abs(oxirigiQoldiq))} — ${oxirigiQoldiq >= 0 ? `${d.orgNomi} foydasiga` : `${d.cpNomi} foydasiga`})

${d.orgNomi}:                    ${d.cpNomi}:
_________________ /${d.orgRahbar}/  _________________ /${d.cpRahbar}/
           M.O.                              M.O.`
}

// ============================================
// TO'LOV GRAFIGI
// ============================================
export interface TolovGrafigiData {
  raqam:        string
  sana:         string
  orgNomi:      string
  cpNomi:       string
  asosiyQarz:   number
  foizStavka:   number
  tolovSoni:    number
  boshlashSana: string
  shartnoma?:   string
}

export interface TolovQatori {
  oy:       number
  sana:     string
  asosiy:   number
  foiz:     number
  jami:     number
  qoldiq:   number
  tolangan: boolean
}

export function calcTolovGrafigi(d: TolovGrafigiData): TolovQatori[] {
  const rows: TolovQatori[] = []
  const oylikAsosiy = Math.round(d.asosiyQarz / d.tolovSoni)
  let   qoldiq      = d.asosiyQarz
  const start       = new Date(d.boshlashSana)

  for (let i = 0; i < d.tolovSoni; i++) {
    const sana = new Date(start)
    sana.setMonth(sana.getMonth() + i)

    const foiz   = d.foizStavka > 0 ? Math.round(qoldiq * (d.foizStavka / 100)) : 0
    const asosiy = i === d.tolovSoni - 1 ? qoldiq : oylikAsosiy
    qoldiq      -= asosiy

    rows.push({
      oy:      i + 1,
      sana:    sana.toLocaleDateString('uz-UZ'),
      asosiy,
      foiz,
      jami:    asosiy + foiz,
      qoldiq:  Math.max(0, qoldiq),
      tolangan: false,
    })
  }

  return rows
}
