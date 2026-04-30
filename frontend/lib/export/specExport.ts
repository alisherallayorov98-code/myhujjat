import ExcelJS    from 'exceljs'
import { saveAs } from 'file-saver'
import type { SpecItem } from '@/lib/qqs'
import { calcSpecTotals } from '@/lib/qqs'

interface ExcelOpts {
  specNumber:   string
  orgName:      string
  cpName?:      string
  contractNum?: string
  items:        SpecItem[]
  notes?:       string
}

export async function exportSpecExcel(opts: ExcelOpts): Promise<void> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'MyHujjat.uz'

  const ws = wb.addWorksheet('Spesifikatsiya', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  })

  ws.columns = [
    { width: 5  },
    { width: 35 },
    { width: 10 },
    { width: 10 },
    { width: 16 },
    { width: 8  },
    { width: 16 },
    { width: 18 },
  ]

  // Sarlavha
  ws.mergeCells('A1:H1')
  const title = ws.getCell('A1')
  title.value = `SPESIFIKATSIYA № ${opts.specNumber}`
  title.font  = { bold: true, size: 14 }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  ws.getRow(1).height = 28

  ws.mergeCells('A2:D2')
  ws.getCell('A2').value = `Tashkilot: ${opts.orgName}`
  ws.getCell('A2').font  = { size: 10 }

  if (opts.cpName) {
    ws.mergeCells('E2:H2')
    ws.getCell('E2').value = `Kontragent: ${opts.cpName}`
    ws.getCell('E2').font  = { size: 10 }
  }

  if (opts.contractNum) {
    ws.mergeCells('A3:H3')
    ws.getCell('A3').value = `Shartnoma: № ${opts.contractNum}`
    ws.getCell('A3').font  = { size: 10, italic: true }
  }

  const headerRow = opts.contractNum ? 5 : (opts.cpName ? 4 : 4)

  // Jadval boshi
  const hRow = ws.getRow(headerRow)
  hRow.values = ['№', 'Nomi', 'Birlik', 'Miqdor', "Narx (so'm)", 'QQS %', "QQS (so'm)", "Jami (so'm)"]

  hRow.eachCell((cell) => {
    cell.fill = {
      type:    'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2563EB' },
    }
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border    = {
      top:    { style: 'thin', color: { argb: 'FFD0D0D0' } },
      bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
      left:   { style: 'thin', color: { argb: 'FFD0D0D0' } },
      right:  { style: 'thin', color: { argb: 'FFD0D0D0' } },
    }
  })
  hRow.height = 30

  // Qatorlar
  opts.items.forEach((item, i) => {
    const row = ws.addRow([
      i + 1,
      item.nomi,
      item.birlik,
      item.miqdori,
      item.narxi,
      item.qqsFoiz === 'siz' ? 'QQS siz' : `${item.qqsFoiz}%`,
      item.qqsSumma,
      item.summa,
    ])

    row.getCell(5).numFmt = '#,##0.00'
    row.getCell(7).numFmt = '#,##0.00'
    row.getCell(8).numFmt = '#,##0.00'
    row.getCell(4).alignment = { horizontal: 'right' }
    row.getCell(5).alignment = { horizontal: 'right' }
    row.getCell(7).alignment = { horizontal: 'right' }
    row.getCell(8).alignment = { horizontal: 'right' }

    if (i % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
      })
    }

    row.eachCell(cell => {
      cell.border = {
        top:    { style: 'hair', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'hair', color: { argb: 'FFE2E8F0' } },
        left:   { style: 'hair', color: { argb: 'FFE2E8F0' } },
        right:  { style: 'hair', color: { argb: 'FFE2E8F0' } },
      }
      cell.alignment = { ...(cell.alignment || {}), vertical: 'middle' }
    })

    row.height = 20
  })

  const totals = calcSpecTotals(opts.items)

  const addTotal = (label: string, value: number, bold = false) => {
    const row = ws.addRow(['', '', '', '', '', '', label, value])
    row.getCell(7).alignment = { horizontal: 'right' }
    row.getCell(8).numFmt    = '#,##0.00'
    row.getCell(8).alignment = { horizontal: 'right' }
    if (bold) {
      row.getCell(7).font = { bold: true, size: 11 }
      row.getCell(8).font = { bold: true, size: 11 }
      row.getCell(8).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
    }
    row.height = 22
  }

  ws.addRow([])
  addTotal("Jami (QQS siz):", totals.jami)
  addTotal("Jami QQS:",        totals.jamiQqs)
  addTotal("UMUMIY JAMI:",     totals.umumiy, true)

  if (opts.notes) {
    ws.addRow([])
    const noteRow = ws.addRow(['', `Izoh: ${opts.notes}`])
    ws.mergeCells(`B${noteRow.number}:H${noteRow.number}`)
    noteRow.getCell(2).font = { italic: true, size: 10 }
  }

  const buf = await wb.xlsx.writeBuffer()
  saveAs(
    new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
    `Spec_${opts.specNumber}.xlsx`
  )
}
