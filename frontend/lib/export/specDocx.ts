// Spesifikatsiya Word eksport — kabinetim.uz uslubida (NARXNI KELISHISH PROTOKOLI)
// 1. Sarlavha + raqam
// 2. Sana + shahar
// 3. Ikki tomonning rekvizitlari (jadval — tashkilot va kontragent)
// 4. Tovar/xizmatlar jadvali (№, nomi, birlik, miqdor, narx, QQS%, QQS summa, jami)
// 5. Yakuniy summalar (QQSsiz, QQS, umumiy + so'z bilan)
// 6. Imzo joylari

import type { SpecItem } from '@/lib/qqs'
import { calcSpecTotals } from '@/lib/qqs'
import { formatAmountWords, formatNumber } from '@/lib/formatters'

const FONT = 'Times New Roman'

interface Party {
  name?:         string
  inn?:          string
  directorName?: string
  bankName?:     string
  bankAccount?:  string
  mfo?:          string
  address?:      string
  phone?:        string
}

interface SpecDocxOpts {
  specNumber:   string
  specDate?:    string
  city?:        string
  contractNum?: string
  contractDate?:string
  org?:         Party | null
  cp?:          Party | null
  items:        SpecItem[]
  notes?:       string
}

function fmtDate(s?: string): string {
  if (!s) return ''
  const d = new Date(s)
  if (isNaN(d.getTime())) return s
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}.${mm}.${d.getFullYear()}`
}

export async function exportSpecDocx(opts: SpecDocxOpts): Promise<void> {
  const {
    Document, Packer, Paragraph, TextRun,
    AlignmentType, Table, TableRow, TableCell,
    WidthType, BorderStyle, TabStopType,
    HeightRule, VerticalAlign, ShadingType,
  } = await import('docx')
  const fileSaverMod = await import('file-saver')
  const saveAs: (blob: Blob, filename: string) => void =
    (fileSaverMod as any).saveAs || (fileSaverMod as any).default || (fileSaverMod as any)

  const org  = opts.org || {}
  const cp   = opts.cp  || {}
  const date = fmtDate(opts.specDate || new Date().toISOString())
  const city = opts.city || 'Toshkent'

  type AnyChild = InstanceType<typeof Paragraph> | InstanceType<typeof Table>
  const children: AnyChild[] = []

  // ─── 1. Sarlavha ──────────────────────────────────────
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: [new TextRun({ text: 'SPESIFIKATSIYA', bold: true, size: 32, font: FONT })],
  }))

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: `№ ${opts.specNumber}`, bold: true, size: 28, font: FONT })],
  }))

  if (opts.contractNum) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
      children: [new TextRun({
        text: `${fmtDate(opts.contractDate)} dagi № ${opts.contractNum} shartnomaga ilova`,
        italics: true, size: 22, font: FONT,
      })],
    }))
  }

  // ─── 2. Shahar va sana ────────────────────────────────
  children.push(new Paragraph({
    spacing: { after: 300 },
    tabStops: [{ type: TabStopType.RIGHT, position: 9000 }],
    children: [
      new TextRun({ text: `${city} shahri`, size: 24, font: FONT, italics: true }),
      new TextRun({ text: '\t' }),
      new TextRun({ text: date, size: 24, font: FONT, italics: true }),
    ],
  }))

  // ─── 3. Tomonlar rekvizitlari ─────────────────────────
  const tableBorder = {
    top:    { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    left:   { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    right:  { style: BorderStyle.SINGLE, size: 4, color: '94A3B8' },
    insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
    insideVertical:   { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
  }

  const partyCell = (p: Party, label: string) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 150, bottom: 150, left: 200, right: 200 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        spacing: { after: 100 },
        children: [new TextRun({ text: label, bold: true, size: 22, font: FONT, color: '475569' })],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [new TextRun({ text: p.name || '___________', bold: true, size: 22, font: FONT })],
      }),
      ...(p.inn ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'STIR: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.inn, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.directorName ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Rahbar: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.directorName, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.address ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Manzil: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.address, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.bankName ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Bank: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.bankName, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.bankAccount ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'H/R: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.bankAccount, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.mfo ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'MFO: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.mfo, size: 20, font: FONT }),
        ],
      })] : []),
      ...(p.phone ? [new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Tel: ', bold: true, size: 20, font: FONT }),
          new TextRun({ text: p.phone, size: 20, font: FONT }),
        ],
      })] : []),
    ],
  })

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        height: { value: 400, rule: HeightRule.ATLEAST },
        children: [
          partyCell(org, 'YETKAZIB BERUVCHI'),
          partyCell(cp,  'BUYURTMACHI'),
        ],
      }),
    ],
    borders: tableBorder,
  }))

  children.push(new Paragraph({ spacing: { after: 300 }, children: [] }))

  // ─── 4. Tovar/xizmatlar jadvali ───────────────────────
  const headerCell = (text: string, width: number) => new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.SOLID, color: '2563EB', fill: '2563EB' },
    margins: { top: 100, bottom: 100, left: 80, right: 80 },
    verticalAlign: VerticalAlign.CENTER,
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 18, font: FONT, color: 'FFFFFF' })],
    })],
  })

  const dataCell = (text: string, opts2: { align?: 'left' | 'right' | 'center'; bold?: boolean } = {}) =>
    new TableCell({
      margins: { top: 80, bottom: 80, left: 80, right: 80 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment:
          opts2.align === 'right'  ? AlignmentType.RIGHT  :
          opts2.align === 'center' ? AlignmentType.CENTER : AlignmentType.LEFT,
        children: [new TextRun({ text, size: 18, font: FONT, bold: opts2.bold })],
      })],
    })

  const itemsHeader = new TableRow({
    tableHeader: true,
    children: [
      headerCell('№',        5),
      headerCell('Nomi',     30),
      headerCell('Birlik',   10),
      headerCell('Miqdor',   10),
      headerCell("Narx (so'm)", 14),
      headerCell('QQS %',    8),
      headerCell("QQS (so'm)", 11),
      headerCell("Jami (so'm)", 12),
    ],
  })

  const itemRows = opts.items.map((it, i) => new TableRow({
    children: [
      dataCell(String(i + 1), { align: 'center' }),
      dataCell(it.nomi || '—'),
      dataCell(it.birlik, { align: 'center' }),
      dataCell(formatNumber(it.miqdori), { align: 'right' }),
      dataCell(formatNumber(it.narxi),   { align: 'right' }),
      dataCell(it.qqsFoiz === 'siz' ? '—' : `${it.qqsFoiz}%`, { align: 'center' }),
      dataCell(it.qqsSumma > 0 ? formatNumber(it.qqsSumma) : '—', { align: 'right' }),
      dataCell(formatNumber(it.summa), { align: 'right', bold: true }),
    ],
  }))

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [itemsHeader, ...itemRows],
    borders: tableBorder,
  }))

  // ─── 5. Jami hisob ─────────────────────────────────────
  const totals = calcSpecTotals(opts.items)

  children.push(new Paragraph({ spacing: { after: 200 }, children: [] }))

  const totalRow = (label: string, value: string, bold = false) => new TableRow({
    children: [
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 200, right: 80 },
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: label, size: 22, font: FONT, bold })],
        })],
        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      }),
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 80, right: 200 },
        shading: bold ? { type: ShadingType.SOLID, color: 'DBEAFE', fill: 'DBEAFE' } : undefined,
        children: [new Paragraph({
          alignment: AlignmentType.RIGHT,
          children: [new TextRun({ text: value, size: 22, font: FONT, bold })],
        })],
        borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
      }),
    ],
  })

  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      totalRow("Jami (QQS siz):", `${formatNumber(totals.jami)} so'm`),
      totalRow("Jami QQS:",        `${formatNumber(totals.jamiQqs)} so'm`),
      totalRow("UMUMIY JAMI:",     `${formatNumber(totals.umumiy)} so'm`, true),
    ],
    borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
  }))

  // So'z bilan yozilgan summa
  children.push(new Paragraph({
    spacing: { before: 200, after: 300 },
    children: [
      new TextRun({ text: 'Jami summa: ', bold: true, size: 22, font: FONT }),
      new TextRun({ text: formatAmountWords(totals.umumiy), italics: true, size: 22, font: FONT }),
    ],
  }))

  if (opts.notes) {
    children.push(new Paragraph({
      spacing: { after: 300 },
      children: [
        new TextRun({ text: 'Izoh: ', bold: true, size: 22, font: FONT }),
        new TextRun({ text: opts.notes, size: 22, font: FONT }),
      ],
    }))
  }

  // ─── 6. Imzo joylari ──────────────────────────────────
  const sigCell = (label: string, p: Party) => new TableCell({
    width: { size: 50, type: WidthType.PERCENTAGE },
    margins: { top: 200, bottom: 200, left: 200, right: 200 },
    verticalAlign: VerticalAlign.TOP,
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 },
        children: [new TextRun({ text: label, bold: true, size: 22, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
        children: [new TextRun({ text: p.name || '___________', size: 20, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 80 },
        children: [new TextRun({ text: '_____________________', size: 20, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: (p.directorName || '___________'), size: 20, font: FONT })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 80 },
        children: [new TextRun({ text: 'M.O.', bold: true, size: 18, font: FONT })],
      }),
    ],
  })

  children.push(new Paragraph({ spacing: { before: 400 }, children: [] }))
  children.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        sigCell('YETKAZIB BERUVCHI', org),
        sigCell('BUYURTMACHI',       cp),
      ],
    })],
    borders: { top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }, insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' } },
  }))

  // ─── Hujjat tuzish ────────────────────────────────────
  const doc = new Document({
    creator:  'myhujjat.uz',
    title:    `Spesifikatsiya № ${opts.specNumber}`,
    sections: [{
      properties: {
        page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } }, // 2 sm
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  const safeNumber = (opts.specNumber || 'spesifikatsiya').replace(/[\\/:*?"<>|]/g, '_')
  saveAs(blob, `Spesifikatsiya_${safeNumber}.docx`)
}
