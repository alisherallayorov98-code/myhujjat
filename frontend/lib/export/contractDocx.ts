import { CONTRACT_TYPE_CONFIG } from '../contractTemplates'
import { stripDocumentHeader }  from './stripHeader'

export type DocxOpts =
  | { contract: any }
  | { title: string; content: string; orgName?: string; number?: string }

const FONT = 'Times New Roman'

function isContractOpts(o: DocxOpts): o is { contract: any } {
  return 'contract' in o
}

function fmtDate(s?: string): string {
  if (!s) return '___'
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}-yil`
}

function isHeading(line: string): boolean {
  return /^\d+\.\s+[A-ZА-ЯЁʻO’ʻ’’””\s’”-]+$/.test(line.trim()) &&
         line === line.toUpperCase()
}

function isSubItem(line: string): boolean {
  return /^\s*\d+\.\d+\./.test(line)
}

function isDashItem(line: string): boolean {
  return /^\s*[—–-]\s+/.test(line)
}

// Buyruq/Bayonnoma matnini tahlil qilib DOCX paragraph spetsifikatsiyasiga aylantiradi
type LineSpec = { text: string; align: ‘CENTER’|’LEFT’; bold: boolean; size: number; after: number }

function parseKotibLines(text: string): LineSpec[] {
  const lines = text.split(‘\n’)
  const result: LineSpec[] = []
  const firstNonEmpty = lines.findIndex(l => l.trim())
  let i = 0

  while (i < lines.length) {
    const raw  = lines[i]
    const line = raw.trim()

    if (!line) {
      result.push({ text: ‘’, align: ‘LEFT’, bold: false, size: 22, after: 60 })
      i++; continue
    }

    // 1-qator: tashkilot nomi → markazlashgan, qalin
    if (i === firstNonEmpty) {
      result.push({ text: line, align: ‘CENTER’, bold: true, size: 24, after: 160 })
      i++; continue
    }

    // “BUYRUQ № X” → markazlashgan, qalin
    if (/^BUYRUQ\s*№/i.test(line)) {
      result.push({ text: line, align: ‘CENTER’, bold: true, size: 24, after: 40 })
      i++; continue
    }

    // Sana qatori (DD.MM.YYYY) — yolg’iz qisqa qator
    if (/^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/.test(line) && line.length < 20) {
      result.push({ text: line, align: ‘CENTER’, bold: false, size: 22, after: 160 })
      i++; continue
    }

    // “...TO’G’RISIDA” / “HAQIDA” sarlavha → markazlashgan, qalin
    if (/TO[‘’]?G[‘’]?RISIDA\s*$/i.test(line) || /HAQIDA\s*$/i.test(line)) {
      result.push({ text: line, align: ‘CENTER’, bold: true, size: 22, after: 200 })
      i++; continue
    }

    // Bayonnoma / yurist hujjat sarlavhalari — markazlashgan
    if (
      /BAYONNOMASI?\s*$/i.test(line) || /^BAYONNOMA/i.test(line) ||
      /^DA[‘’]VO ARIZASI\s*$/i.test(line) ||
      /^PRETENZIYA\s*$/i.test(line) ||
      /^ISHONCH QOG[‘’]OZI\s*$/i.test(line) ||
      /^DALOLATNOMA\s*$/i.test(line) ||
      /^KELISHUV BITIMI\s*$/i.test(line) ||
      /^OGOHLANTIRUV XATI\s*$/i.test(line) ||
      /^SHARTNOMANI.*BEKOR QILISH/i.test(line) ||
      /^QABUL-TOPSHIRISH BAYONNOMASI\s*$/i.test(line)
    ) {
      result.push({ text: line, align: ‘CENTER’, bold: true, size: 24, after: 80 })
      i++; continue
    }

    // “№ X” — alohida qatordagi bayonnoma raqami
    if (/^№\s*\S+/.test(line) && line.length < 20) {
      result.push({ text: line, align: ‘CENTER’, bold: false, size: 22, after: 80 })
      i++; continue
    }

    // Muhim bo’lim sarlavhalari (chap, qalin)
    if (/^(KUN TARTIBI|BUYURADI|ESHITILDI|MUHOKAMA QILINDI|OVOZ BERISH NATIJALARI|OVOZ BERISH|QAROR QILINDI|TOPSHIRILDI|HOLATI VA MIQDORI|HOLATI|IZOHLAR VA QARORLAR|IZOHLAR|ILOVALAR|TALABNING ASOSI|TALAB MIQDORI|TALABIMIZ|OGOHLANTIRISH|TO[‘’]LOV REKVIZITLARI|HOLATNING BAYONI|HUQUQIY ASOS|TALABLAR|ILOVA|VAKILGA|VAKOLAT BERAMAN|KOMISSIYA A[‘’]ZOLARI|DALOLATNOMA PREDMETI|ANIQLANGAN HOLAT|MOLIYAVIY BAHOLASH|XULOSA|BUZILISH HOLATI|OGOHLANTIRUV MOHIYATI|BEKOR QILISH ASOSI|KUCHGA KIRISH SANASI|HISOB-KITOB TARTIBI|KELISHUV PREDMETI)\s*:?/i.test(line)) {
      result.push({ text: line, align: ‘LEFT’, bold: true, size: 22, after: 100 })
      i++; continue
    }

    // Raqamli bo’lim sarlavhasi “1. PREDMET” yoki “2. 1-TOMON MAJBURIYATLARI”
    if (/^\d+\.\s+[A-Z0-9ҚҒҲЎА-Я’ʻ\-]{3,}/.test(line)) {
      result.push({ text: line, align: ‘LEFT’, bold: true, size: 22, after: 80 })
      i++; continue
    }

    // Imzo sarlavha “Rahbar: ___ / Ism /” — yorliq + quyi chiziq
    if (/^(Rahbar|Kotib|Yig[‘’]ilish raisi|Kengash raisi|Komissiya raisi|Ta[‘’]sis yig[‘’]ilishi raisi|Topshirdi|Qabul qildi|1-TOMON VAKILI|2-TOMON VAKILI|1-TOMON|2-TOMON)\s*:?/i.test(line)) {
      const slashParts = line.split(‘/’)
      const label = (slashParts[0]?.trim() ?? line).replace(/[\s_]+$/, ‘’)
      const name  = slashParts[1]?.trim() ?? ‘’
      const display = name ? `${label}  _______________  ${name}` : label
      result.push({ text: display, align: ‘LEFT’, bold: false, size: 22, after: 80 })
      i++; continue
    }

    // Imzo chizig’i “___ / Ism /”
    if (/^_{3,}/.test(line) && line.includes(‘/’)) {
      const name = line.split(‘/’)[1]?.trim() ?? ‘’
      const display = `_____________________________  ${name}`
      result.push({ text: display.trim(), align: ‘LEFT’, bold: false, size: 22, after: 80 })
      i++; continue
    }

    // “Hurmat bilan,” — kursiv uslub
    if (/^Hurmat bilan\s*,?\s*$/i.test(line)) {
      result.push({ text: line, align: ‘LEFT’, bold: false, size: 22, after: 80 })
      i++; continue
    }

    // “M.O.” → markazlashgan
    if (/^\s*M\.O\.?\s*$/i.test(line)) {
      result.push({ text: line, align: ‘CENTER’, bold: false, size: 22, after: 80 })
      i++; continue
    }

    // Oddiy qator
    result.push({ text: line, align: ‘LEFT’, bold: false, size: 22, after: 80 })
    i++
  }
  return result
}

// Matn kotib yoki yurist hujjati ekanligini aniqlash (structured rendering uchun)
function isKotibDoc(content: string): boolean {
  return (
    /BUYRUQ\s*№/i.test(content) ||
    /BAYONNOMA/i.test(content)   ||
    /^PRETENZIYA\s*$/im.test(content) ||
    /^DA'VO ARIZASI\s*$/im.test(content) ||
    /^ISHONCH QOG'OZI\s*$/im.test(content) ||
    /^DALOLATNOMA\s*$/im.test(content) ||
    /^KELISHUV BITIMI\s*$/im.test(content) ||
    /^OGOHLANTIRUV XATI\s*$/im.test(content) ||
    /^SHARTNOMANI.*BEKOR QILISH/im.test(content)
  )
}

export async function exportContractDocx(opts: DocxOpts): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, Table, TableRow, TableCell,
    WidthType, BorderStyle, TabStopType, TabStopPosition,
    HeightRule, VerticalAlign, HeadingLevel,
  } = await import('docx')
  const fileSaverMod = await import('file-saver')
  // file-saver CJS — default export = saveAs funksiyasi
  const saveAs: (blob: Blob, filename: string) => void =
    (fileSaverMod as any).saveAs || (fileSaverMod as any).default || (fileSaverMod as any)

  // ─── Oddiy format: title + content ─────────────────────────
  if (!isContractOpts(opts)) {
    const paragraphs: InstanceType<typeof Paragraph>[] = []

    // Buyruq/Bayonnoma — to'liq strukturali rendering
    if (isKotibDoc(opts.content)) {
      const specs = parseKotibLines(opts.content)
      specs.forEach(s => {
        paragraphs.push(new Paragraph({
          alignment: s.align === 'CENTER' ? AlignmentType.CENTER : AlignmentType.LEFT,
          spacing:   { after: s.after },
          children:  [new TextRun({ text: s.text, bold: s.bold, size: s.size, font: FONT })],
        }))
      })
    } else {
      // Oddiy hujjat (faktura, akt-sverki va b.)
      paragraphs.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        children:  [new TextRun({ text: opts.title, bold: true, size: 28, font: FONT })],
        spacing:   { after: 160 },
      }))
      if (opts.orgName) {
        paragraphs.push(new Paragraph({
          alignment: AlignmentType.CENTER,
          children:  [new TextRun({ text: opts.orgName, size: 20, font: FONT })],
          spacing:   { after: 120 },
        }))
      }
      const cleanContent = stripDocumentHeader(opts.content)
      cleanContent.split('\n').forEach(line => {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: line, size: 22, font: FONT })],
          spacing:  { after: 80 },
        }))
      })
    }

    const margins = { top: 1134, right: 1134, bottom: 1134, left: 1701 }
    const docSimple = new Document({
      sections: [{ properties: { page: { margin: margins } } as any, children: paragraphs }]
    })
    const blobSimple = await Packer.toBlob(docSimple)
    saveAs(blobSimple, `${opts.title.replace(/\s+/g, '_')}.docx`)
    return
  }

  // ─── Chiroyli (Contract obyektidan) format ────────────────
  const { contract } = opts
  const org = contract.organization || {}
  const cp  = contract.counterparty || {}
  const cfg = (CONTRACT_TYPE_CONFIG as any)[contract.contractType] || {
    name: 'Shartnoma',
    parties: { seller: 'SOTUVCHI', buyer: 'XARIDOR' },
  }
  const typeName = (cfg.name || 'Shartnoma').toUpperCase() + ' SHARTNOMASI'
  const number   = contract.contractNumber || ''
  const city     = contract.city || 'Toshkent'
  const date     = fmtDate(contract.contractDate)

  const sellerLabel = (cfg.parties?.seller || 'SOTUVCHI').toUpperCase()
  const buyerLabel  = (cfg.parties?.buyer  || 'XARIDOR').toUpperCase()

  type AnyChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  const children: AnyChild[] = []

  // ─── 0. Hujjat identifikatori (qonuniy talab) ───────────
  if (contract.id) {
    const docId = String(contract.id).toUpperCase().replace(/-/g, '')
    children.push(new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({
        text: `elektron hujjat identifikatori: ${docId}`,
        size: 16, font: 'Courier New', color: '6B7280',
      })],
    }))
  }

  // ─── 1. Sarlavha ─────────────────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: typeName, bold: true, size: 32, font: FONT })],
  }))

  if (number) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: `№ ${number}`, bold: true, size: 28, font: FONT })],
    }))
  }

  // ─── 2. Shahar va sana — chap/o'ng ──────────────────────
  children.push(new Paragraph({
    spacing: { after: 300 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
    children: [
      new TextRun({ text: `${city} shahri`, size: 24, font: FONT, italics: true }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: date, size: 24, font: FONT, italics: true }),
    ],
  }))

  // ─── 3. Asosiy matn (REKVIZITLAR oldidan kesib olamiz) ──
  const fullContent = contract.content || ''
  const splitRegex  = /\n\s*\d+\.\s*TOMONLARNING\s+REKVIZITLARI[^\n]*\n/i
  const parts       = fullContent.split(splitRegex)
  let bodyText      = parts[0] || fullContent

  // Boshlang'ich takror sarlavhalarni olib tashlash (yuqorida allaqachon bor)
  bodyText = stripDocumentHeader(bodyText)

  for (const raw of bodyText.split('\n')) {
    const line = raw.replace(/\s+$/, '')
    if (!line.trim()) {
      children.push(new Paragraph({ spacing: { after: 80 }, children: [] }))
      continue
    }

    if (isHeading(line)) {
      children.push(new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240, after: 160 },
        children: [new TextRun({ text: line.trim(), bold: true, size: 26, font: FONT })],
      }))
      continue
    }

    if (isSubItem(line)) {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 100, line: 320 },
        indent: { firstLine: 360 },
        children: [new TextRun({ text: line.trim(), size: 24, font: FONT })],
      }))
      continue
    }

    if (isDashItem(line)) {
      children.push(new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { after: 80, line: 300 },
        indent: { left: 360 },
        children: [new TextRun({ text: line.trim(), size: 24, font: FONT })],
      }))
      continue
    }

    children.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { after: 100, line: 320 },
      children: [new TextRun({ text: line.trim(), size: 24, font: FONT })],
    }))
  }

  // ─── 4. REKVIZITLAR — sarlavha ──────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text: 'TOMONLARNING REKVIZITLARI', bold: true, size: 26, font: FONT })],
  }))

  // ─── 5. REKVIZITLAR jadvali (2 ustun) ──────────────────
  const tableBorder = {
    top:    { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    bottom: { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    left:   { style: BorderStyle.SINGLE, size: 6, color: '000000' },
    right:  { style: BorderStyle.SINGLE, size: 6, color: '000000' },
  }

  const partyCell = (party: any, label: string) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: label, bold: true, size: 24, font: FONT })],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [new TextRun({ text: party.name || '___________', bold: true, size: 22, font: FONT })],
      }),
      ...(party.address ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Manzil: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: party.address, size: 20, font: FONT }),
        ],
      })] : []),
      ...(party.bankAccount ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'H/R: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: party.bankAccount, size: 20, font: FONT }),
        ],
      })] : []),
      ...(party.bankName ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Bank: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: party.bankName, size: 20, font: FONT }),
        ],
      })] : []),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'MFO: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: party.mfo || '_____', size: 20, font: FONT }),
          new TextRun({ text: '   INN: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: party.inn || '_________', size: 20, font: FONT }),
        ],
      }),
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({ text: 'Rahbar: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: (party.directorName || '___________').toUpperCase(), size: 20, font: FONT }),
        ],
      }),
      // Imzo joyi
      new Paragraph({
        spacing: { before: 300 },
        children: [new TextRun({ text: '_____________________________', size: 20, font: FONT })],
      }),
      new Paragraph({
        spacing: { before: 60 },
        children: [new TextRun({ text: 'M.O.', bold: true, size: 20, font: FONT })],
      }),
    ],
  })

  const partyTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 400, rule: HeightRule.ATLEAST },
        children: [
          partyCell(org, sellerLabel),
          partyCell(cp,  buyerLabel),
        ],
      }),
    ],
    borders: tableBorder,
  })

  children.push(partyTable)

  // ─── 6. Hujjatni tuzish ────────────────────────────────
  const doc = new Document({
    creator:  'myhujjat.uz',
    title:    typeName,
    sections: [{
      properties: {
        page: {
          margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 2 sm
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const safeNumber = (number || 'shartnoma').replace(/[\\/:*?"<>|]/g, '_')
  saveAs(blob, `${typeName.replace(/\s+/g, '_')}_${safeNumber}.docx`)
}
