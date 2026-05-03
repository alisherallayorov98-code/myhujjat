// Ommaviy yuborish — Excel shabloni va parsing
// Ustunlar (kiril/lotin/rus — universal):
//   STIR / ИНН (majburiy, 9 raqam)
//   Shartnoma_raqami / Договор_номер (ixtiyoriy)
//   Summa / Сумма (ixtiyoriy — bo'sh bo'lsa default summa)
//   Mahsulot / Товар (ixtiyoriy — bo'sh bo'lsa default mahsulot)

export interface BulkExcelRow {
  stir:           string
  contractNumber?: string
  amount?:        number
  productName?:   string
}

const STIR_KEYS    = ['stir', 'инн', 'inn']
const NUMBER_KEYS  = ['shartnoma_raqami', 'shartnoma raqami', 'shartnoma№', 'shartnoma', 'договор_номер', 'договор номер', 'договор', 'contract_number']
const AMOUNT_KEYS  = ['summa', 'сумма', 'amount', 'сум']
const PRODUCT_KEYS = ['mahsulot', 'товар', 'mahsulot_nomi', 'product', 'product_name']

function normalizeKey(k: string): string {
  return String(k).toLowerCase().trim().replace(/\s+/g, '_')
}

export async function downloadBulkTemplate() {
  const exceljsMod = await import('exceljs')
  const Workbook: any = (exceljsMod as any).Workbook || (exceljsMod as any).default?.Workbook
  const wb = new Workbook()
  const ws = wb.addWorksheet('Kontragentlar')

  ws.columns = [
    { header: 'STIR',             key: 'stir',           width: 14 },
    { header: 'Shartnoma_raqami', key: 'contractNumber', width: 18 },
    { header: 'Summa',            key: 'amount',         width: 18 },
    { header: 'Mahsulot',         key: 'productName',    width: 30 },
  ]

  // Sarlavha
  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  // 2 ta misol qator
  ws.addRow({ stir: '301234567', contractNumber: '001', amount: 500000000, productName: '' })
  ws.addRow({ stir: '301234568', contractNumber: '002', amount: '',         productName: '' })

  // Hint qator (3-qator)
  const hintRow = ws.addRow({
    stir:          'majburiy — 9 raqam',
    contractNumber:'ixtiyoriy',
    amount:        'ixtiyoriy',
    productName:   'ixtiyoriy',
  })
  hintRow.font = { italic: true, color: { argb: 'FF94A3B8' } }

  const buf = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url
  a.download = 'kontragentlar_shablon.xlsx'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function parseBulkExcel(file: File): Promise<BulkExcelRow[]> {
  const exceljsMod = await import('exceljs')
  const Workbook: any = (exceljsMod as any).Workbook || (exceljsMod as any).default?.Workbook

  const buf = await file.arrayBuffer()
  const wb  = new Workbook()
  await wb.xlsx.load(buf)

  const ws = wb.worksheets[0]
  if (!ws) return []

  // Sarlavha qatori topiladi (1-qator)
  const headerRow = ws.getRow(1)
  const colMap: Record<number, string> = {}  // colIndex → 'stir' | 'contractNumber' | ...

  headerRow.eachCell((cell: any, col: number) => {
    const k = normalizeKey(String(cell.value ?? ''))
    if (STIR_KEYS.includes(k))    colMap[col] = 'stir'
    else if (NUMBER_KEYS.some(n => k.includes(n))) colMap[col] = 'contractNumber'
    else if (AMOUNT_KEYS.includes(k))  colMap[col] = 'amount'
    else if (PRODUCT_KEYS.some(n => k.includes(n))) colMap[col] = 'productName'
  })

  const rows: BulkExcelRow[] = []
  ws.eachRow((row: any, rowNum: number) => {
    if (rowNum === 1) return  // header

    const r: BulkExcelRow = { stir: '' }
    row.eachCell({ includeEmpty: false }, (cell: any, col: number) => {
      const key = colMap[col]
      if (!key) return
      const val = cell.value
      if (val === null || val === undefined) return

      if (key === 'stir') {
        r.stir = String(val).replace(/\D/g, '').slice(0, 9)
      } else if (key === 'amount') {
        const n = typeof val === 'number' ? val : Number(String(val).replace(/[^\d.,]/g, '').replace(',', '.'))
        if (!Number.isNaN(n) && n > 0) r.amount = n
      } else if (key === 'contractNumber') {
        const s = String(val).trim()
        if (s) r.contractNumber = s
      } else if (key === 'productName') {
        const s = String(val).trim()
        if (s) r.productName = s
      }
    })

    // Faqat to'g'ri STIR'larni qabul qilamiz (9 raqam)
    if (r.stir.length === 9) rows.push(r)
  })

  return rows
}
