import { CONTRACT_TYPE_CONFIG } from '../contractTemplates'

const STATUS_LABEL: Record<string, string> = {
  DRAFT:     'Qoralama',
  ACTIVE:    'Faol',
  COMPLETED: 'Tugagan',
  CANCELLED: 'Bekor',
}

async function buildExcel(
  rows: any[],
  headers: { key: string; label: string; width?: number }[],
  sheetName: string,
  filename: string,
) {
  const exceljsMod = await import('exceljs')
  // exceljs CJS — Workbook konstruktor turli joyda bo'lishi mumkin
  const Workbook: any = (exceljsMod as any).Workbook || (exceljsMod as any).default?.Workbook
  const wb      = new Workbook()
  const ws      = wb.addWorksheet(sheetName)

  // Header row
  ws.columns = headers.map(h => ({
    header: h.label,
    key:    h.key,
    width:  h.width ?? 18,
  }))

  ws.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2563EB' } }
  ws.getRow(1).alignment = { vertical: 'middle', horizontal: 'left' }
  ws.getRow(1).height = 22

  // Data rows
  rows.forEach(row => ws.addRow(row))

  // Borders
  ws.eachRow((row) => {
    row.eachCell(cell => {
      cell.border = {
        top:    { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left:   { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right:  { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })
  })

  ws.views = [{ state: 'frozen', ySplit: 1 }]

  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export async function exportContractsExcel(contracts: any[], orgName: string) {
  const rows = contracts.map((c, i) => ({
    n:         i + 1,
    number:    c.contractNumber,
    type:      (CONTRACT_TYPE_CONFIG as any)[c.contractType]?.name ?? c.contractType,
    cp:        c.counterparty?.name ?? '',
    cpInn:     c.counterparty?.inn  ?? '',
    date:      c.contractDate ?? '',
    amount:    Number(c.amount) || 0,
    status:    STATUS_LABEL[c.status] ?? c.status,
    createdAt: new Date(c.createdAt).toLocaleDateString('uz-UZ'),
  }))

  const headers = [
    { key: 'n',         label: '#',           width: 6  },
    { key: 'number',    label: 'Raqam',       width: 18 },
    { key: 'type',      label: 'Tur',         width: 22 },
    { key: 'cp',        label: 'Kontragent',  width: 28 },
    { key: 'cpInn',     label: 'STIR',        width: 12 },
    { key: 'date',      label: 'Sana',        width: 12 },
    { key: 'amount',    label: "Summa (so'm)", width: 18 },
    { key: 'status',    label: 'Holat',       width: 12 },
    { key: 'createdAt', label: 'Yaratilgan',  width: 14 },
  ]

  const safeName = orgName.replace(/[\\/:*?"<>|]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  await buildExcel(rows, headers, 'Shartnomalar', `Shartnomalar_${safeName}_${date}.xlsx`)
}

export async function exportCounterpartiesExcel(cps: any[], orgName: string) {
  const rows = cps.map((c, i) => ({
    n:        i + 1,
    name:     c.name,
    inn:      c.inn || '',
    director: c.directorName || '',
    bank:     c.bankName || '',
    account:  c.bankAccount || '',
    mfo:      c.mfo || '',
    address:  c.address || '',
    phone:    c.phone || '',
  }))

  const headers = [
    { key: 'n',        label: '#',             width: 6  },
    { key: 'name',     label: 'Nomi',          width: 30 },
    { key: 'inn',      label: 'STIR',          width: 12 },
    { key: 'director', label: 'Rahbar',        width: 25 },
    { key: 'bank',     label: 'Bank',          width: 22 },
    { key: 'account',  label: 'Hisob raqami',  width: 24 },
    { key: 'mfo',      label: 'MFO',           width: 8  },
    { key: 'address',  label: 'Manzil',        width: 35 },
    { key: 'phone',    label: 'Telefon',       width: 16 },
  ]

  const safeName = orgName.replace(/[\\/:*?"<>|]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  await buildExcel(rows, headers, 'Kontragentlar', `Kontragentlar_${safeName}_${date}.xlsx`)
}

export async function exportEmployeesExcel(emps: any[], orgName: string) {
  const rows = emps.map((e, i) => ({
    n:        i + 1,
    ism:      e.ism,
    jshshir:  e.jshshir   || '',
    lavozim:  e.lavozim   || '',
    bolim:    e.bolim     || '',
    maosh:    Number(e.maosh) || 0,
    ishBoshi: e.ishBoshi  ? new Date(e.ishBoshi).toLocaleDateString('uz-UZ') : '',
    tel:      e.tel       || '',
    status:   e.status    || '',
  }))

  const headers = [
    { key: 'n',        label: '#',                width: 6  },
    { key: 'ism',      label: 'Ism Familiya',     width: 30 },
    { key: 'jshshir',  label: 'JSHSHIR',          width: 16 },
    { key: 'lavozim',  label: 'Lavozim',          width: 22 },
    { key: 'bolim',    label: "Bo'lim",           width: 18 },
    { key: 'maosh',    label: "Maosh (so'm)",     width: 16 },
    { key: 'ishBoshi', label: 'Ish boshi',        width: 14 },
    { key: 'tel',      label: 'Telefon',          width: 16 },
    { key: 'status',   label: 'Holat',            width: 12 },
  ]

  const safeName = orgName.replace(/[\\/:*?"<>|]/g, '_')
  const date = new Date().toISOString().split('T')[0]
  await buildExcel(rows, headers, 'Xodimlar', `Xodimlar_${safeName}_${date}.xlsx`)
}
