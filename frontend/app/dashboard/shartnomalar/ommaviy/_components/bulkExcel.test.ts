import { describe, it, expect, vi, beforeAll } from 'vitest'
import { parseBulkExcel } from './bulkExcel'

// Excel uchun real ExcelJS ishlatamiz — bu integration test, mock'siz
// (kichik fayllar tez parse bo'ladi)

async function makeExcel(rows: any[][]): Promise<File> {
  const ExcelJS  = await import('exceljs')
  const Workbook: any = (ExcelJS as any).Workbook || (ExcelJS as any).default?.Workbook
  const wb = new Workbook()
  const ws = wb.addWorksheet('Test')
  rows.forEach(r => ws.addRow(r))
  const buf  = await wb.xlsx.writeBuffer()
  const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  return new File([blob], 'test.xlsx', { type: blob.type })
}

describe('parseBulkExcel', () => {
  it("standart shablonni parse qiladi", async () => {
    const file = await makeExcel([
      ['STIR',       'Shartnoma_raqami', 'Summa',     'Mahsulot'],
      ['301234567',  '001',              500_000_000, 'Yog\'och'],
      ['301234568',  '002',              '',          'Sement'],
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(2)
    expect(rows[0].stir).toBe('301234567')
    expect(rows[0].contractNumber).toBe('001')
    expect(rows[0].amount).toBe(500_000_000)
    expect(rows[0].productName).toBe('Yog\'och')
    expect(rows[1].amount).toBeUndefined()  // bo'sh — undefined
  })

  it("kiril/lotin/ruscha header'lar bilan ishlaydi", async () => {
    const file = await makeExcel([
      ['ИНН',       'Договор_номер', 'Сумма', 'Товар'],
      ['301234567', 'A-001',         100_000, 'Mahsulot 1'],
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0].stir).toBe('301234567')
    expect(rows[0].contractNumber).toBe('A-001')
    expect(rows[0].amount).toBe(100_000)
  })

  it("noto'g'ri STIR (9 raqamdan kam) — ignore qiladi", async () => {
    const file = await makeExcel([
      ['STIR',     'Shartnoma_raqami'],
      ['12345',    '001'],   // 5 raqam — ignore
      ['301234567', '002'],  // OK
      ['abc',      '003'],   // raqam yo'q — ignore
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0].stir).toBe('301234567')
  })

  it("STIR aralash belgilar bilan: faqat raqamlar oladi", async () => {
    const file = await makeExcel([
      ['STIR'],
      ['301-234-567'],
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0].stir).toBe('301234567')
  })

  it("Summa string sifatida — to'g'ri raqamga aylantiradi", async () => {
    const file = await makeExcel([
      ['STIR',      'Summa'],
      ['301234567', '500 000 000'],     // bo'sh joy bilan
      ['301234568', '1.500.000'],       // nuqta bilan
      ['301234569', '2,000,000'],       // vergul bilan
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(3)
    // Bo'sh joy — olib tashlanadi va parse bo'ladi
    expect(rows[0].amount).toBe(500_000_000)
  })

  it("STIR ustuni yo'q bo'lsa — bo'sh array", async () => {
    const file = await makeExcel([
      ['Boshqa', 'Header'],
      ['xxx',    'yyy'],
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(0)
  })

  it("bo'sh fayl — bo'sh array", async () => {
    const file = await makeExcel([])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(0)
  })

  it("STIR 10+ raqam — birinchi 9 olinadi", async () => {
    const file = await makeExcel([
      ['STIR'],
      ['30123456789012'],  // 14 raqam
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0].stir).toBe('301234567')
  })

  it("manfiy summa — ignore qilinadi (>0 talab)", async () => {
    const file = await makeExcel([
      ['STIR',      'Summa'],
      ['301234567', -100],
    ])
    const rows = await parseBulkExcel(file)
    expect(rows).toHaveLength(1)
    expect(rows[0].amount).toBeUndefined()
  })
})
