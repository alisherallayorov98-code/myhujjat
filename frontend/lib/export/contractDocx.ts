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
  // "1. SHARTNOMA PREDMETI" — raqam + nuqta + UPPERCASE so'zlar
  return /^\d+\.\s+[A-ZА-ЯЁʻO'ʻ‘’“”\s'"-]+$/.test(line.trim()) &&
         line === line.toUpperCase()
}

function isSubItem(line: string): boolean {
  // "1.1." ko'rinishidagi band
  return /^\s*\d+\.\d+\./.test(line)
}

function isDashItem(line: string): boolean {
  return /^\s*[—–-]\s+/.test(line)
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

  // ─── Eski (oddiy) format: title + content ─────────────────
  if (!isContractOpts(opts)) {
    const paragraphs: InstanceType<typeof Paragraph>[] = []
    paragraphs.push(new Paragraph({
      heading:   HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children:  [new TextRun({ text: opts.title, bold: true, size: 28, font: FONT })],
    }))
    if (opts.orgName) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: opts.orgName, size: 20, font: FONT })],
      }))
      paragraphs.push(new Paragraph({ children: [new TextRun('')] }))
    }
    // Boshlang'ich takror sarlavhalarni olib tashlash (allaqachon yuqorida bor)
    const cleanContent = stripDocumentHeader(opts.content)
    cleanContent.split('\n').forEach(line => {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ text: line, size: 22, font: FONT })],
        spacing:  { after: 80 },
      }))
    })
    const docSimple = new Document({ sections: [{ children: paragraphs }] })
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
