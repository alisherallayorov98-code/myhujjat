import { CONTRACT_TYPE_CONFIG } from '../contractTemplates'
import { stripDocumentHeader }  from './stripHeader'

function fmtDate(s?: string): string {
  if (!s) return '___'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}-yil`
}

function esc(s: string | undefined | null): string {
  if (!s) return ''
  return String(s).replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!))
}

function isHeading(line: string): boolean {
  return /^\d+\.\s+[A-ZА-ЯЁʻO'ʻ‘’"\s'"-]+$/.test(line.trim()) &&
         line === line.toUpperCase()
}

function isSubItem(line: string): boolean {
  return /^\s*\d+\.\d+\./.test(line)
}

function isDashItem(line: string): boolean {
  return /^\s*[—–-]\s+/.test(line)
}

/**
 * Shartnomani HTML formatda render qiladi.
 * Saytdagi preview va PDF eksport uchun bitta manba.
 */
export function renderContractHtml(contract: any): string {
  const org = contract.organization || {}
  const cp  = contract.counterparty || {}
  const cfg = (CONTRACT_TYPE_CONFIG as any)[contract.contractType] || {
    name: 'Shartnoma',
    parties: { seller: 'SOTUVCHI', buyer: 'XARIDOR' },
  }
  const typeName    = (cfg.name || 'Shartnoma').toUpperCase() + ' SHARTNOMASI'
  const number      = contract.contractNumber || ''
  const city        = contract.city || 'Toshkent'
  const date        = fmtDate(contract.contractDate)
  const sellerLabel = (cfg.parties?.seller || 'SOTUVCHI').toUpperCase()
  const buyerLabel  = (cfg.parties?.buyer  || 'XARIDOR').toUpperCase()

  // REKVIZITLAR oldidan body matnini ajratamiz.
  // Quyidagi naqshlardan birini topadi:
  //   "16. TOMONLARNING REKVIZITLARI VA IMZOLARI"
  //   "10. TOMONLARNING REKVIZITLARI"
  //   "TOMONLAR:"
  //   "PARTIES:"
  //   "REKVIZITLAR:"
  // Shu yerdan keyingi qism (imzo joylari, MFO, INN) avtomatik render qilinadigan
  // chiroyli rekvizit card bilan almashtiriladi.
  const fullContent = contract.content || ''
  const splitRegex  = /\n\s*(?:\d+\.\s*)?(?:TOMONLARNING\s+REKVIZITLARI[^\n]*|TOMONLAR\s*:|PARTIES\s*:|REKVIZITLAR\s*:)\s*\n/i
  const parts       = fullContent.split(splitRegex)
  let bodyText      = parts[0] || fullContent

  // Boshlang'ich takror sarlavhalarni olib tashlash (allaqachon yuqorida bor)
  // typeName (masalan, "OLDI-SOTDI SHARTNOMASI") ham qo'shimcha naqsh sifatida uzatamiz
  const escapedTypeName = typeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  bodyText = stripDocumentHeader(bodyText, [new RegExp(`^\\s*${escapedTypeName}\\s*$`, 'i')])

  // Body satrlarini HTML elementlariga aylantirish
  const bodyHtml = bodyText.split('\n').map((raw: string) => {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) return '<div class="contract-spacer"></div>'

    if (isHeading(line)) {
      return `<h2 class="contract-h2">${esc(line.trim())}</h2>`
    }
    if (isSubItem(line)) {
      return `<p class="contract-band">${esc(line.trim())}</p>`
    }
    if (isDashItem(line)) {
      return `<p class="contract-dash">${esc(line.trim())}</p>`
    }
    return `<p class="contract-p">${esc(line.trim())}</p>`
  }).join('')

  // REKVIZITLAR jadvali
  const partyCol = (party: any, label: string) => `
    <td class="contract-party">
      <div class="contract-party-label">${esc(label)}</div>
      <div class="contract-party-name">${esc(party.name) || '___________'}</div>
      ${party.address ? `<div><b>Manzil:</b> ${esc(party.address)}</div>` : ''}
      ${party.bankAccount ? `<div><b>H/R:</b> ${esc(party.bankAccount)}</div>` : ''}
      ${party.bankName ? `<div><b>Bank:</b> ${esc(party.bankName)}</div>` : ''}
      <div><b>MFO:</b> ${esc(party.mfo) || '_____'}&nbsp;&nbsp;<b>INN:</b> ${esc(party.inn) || '_________'}</div>
      <div><b>Rahbar:</b> ${esc((party.directorName || '___________').toUpperCase())}</div>
      <div class="contract-sign-line">_____________________________</div>
      <div class="contract-mo">M.O.</div>
    </td>
  `

  return `
    <style>
      .contract-doc {
        font-family: 'Times New Roman', Times, serif;
        color: #000;
        background: #fff;
        padding: 40px 50px;
        font-size: 14px;
        line-height: 1.55;
      }
      .contract-doc * { box-sizing: border-box; }
      .contract-h1 {
        text-align: center;
        font-size: 20px;
        font-weight: 700;
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
      }
      .contract-num {
        text-align: center;
        font-size: 17px;
        font-weight: 700;
        margin: 0 0 24px 0;
      }
      .contract-meta {
        display: flex;
        justify-content: space-between;
        font-style: italic;
        margin-bottom: 22px;
      }
      .contract-h2 {
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        margin: 18px 0 10px 0;
        letter-spacing: 0.3px;
      }
      .contract-band {
        text-align: justify;
        text-indent: 28px;
        margin: 0 0 6px 0;
      }
      .contract-dash {
        text-align: justify;
        margin: 0 0 4px 28px;
      }
      .contract-p {
        text-align: justify;
        margin: 0 0 6px 0;
      }
      .contract-spacer { height: 8px; }
      .contract-rekvi-title {
        text-align: center;
        font-size: 15px;
        font-weight: 700;
        margin: 30px 0 12px 0;
      }
      .contract-rekvi {
        width: 100%;
        border-collapse: collapse;
        margin-top: 8px;
      }
      .contract-rekvi td {
        border: 1px solid #000;
        padding: 14px 16px;
        vertical-align: top;
        width: 50%;
        font-size: 13px;
        line-height: 1.5;
      }
      .contract-party-label {
        font-weight: 700;
        font-size: 14px;
        margin-bottom: 6px;
      }
      .contract-party-name {
        font-weight: 700;
        margin-bottom: 8px;
      }
      .contract-sign-line {
        margin-top: 28px;
      }
      .contract-mo {
        font-weight: 700;
        margin-top: 4px;
      }
      .contract-docid {
        font-size: 9px;
        color: #6B7280;
        font-family: monospace;
        margin-bottom: 8px;
        letter-spacing: 0.5px;
      }
    </style>
    <div class="contract-doc">
      ${contract.id
        ? `<div class="contract-docid">elektron hujjat identifikatori: ${esc(String(contract.id).toUpperCase().replace(/-/g, ''))}</div>`
        : ''}
      <h1 class="contract-h1">${esc(typeName)}</h1>
      ${number ? `<div class="contract-num">№ ${esc(number)}</div>` : ''}
      <div class="contract-meta">
        <span>${esc(city)} shahri</span>
        <span>${esc(date)}</span>
      </div>
      ${bodyHtml}
      <div class="contract-rekvi-title">TOMONLARNING REKVIZITLARI</div>
      <table class="contract-rekvi">
        <tr>
          ${partyCol(org, sellerLabel)}
          ${partyCol(cp,  buyerLabel)}
        </tr>
      </table>
    </div>
  `
}
