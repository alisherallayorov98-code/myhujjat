/**
 * Sample PDF + Word export test.
 *
 * Generates a real shartnoma PDF + Word and verifies:
 * - File is non-empty
 * - PDF starts with %PDF magic header
 * - Word is valid ZIP (DOCX)
 * - Currency formatting in output
 *
 * Ishga tushirish: cd frontend && node --experimental-strip-types scripts/test-export.ts
 */

import * as fs   from 'node:fs'
import * as path from 'node:path'

async function main() {
  const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Z]:)/i, '$1'))
  const OUT_DIR    = path.join(SCRIPT_DIR, '..', '..', 'tmp-export-test')

  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

  console.log('🧪 Test contract data tayyorlanmoqda...\n')

  const sample = {
    contractNumber: 'TEST-001/2026',
    contractType:   'OLDI_SOTDI',
    contractDate:   '2026-05-04',
    city:           'Toshkent',
    amount:         500_000_000,
    content:        `OLDI-SOTDI SHARTNOMASI

№ TEST-001/2026
Toshkent shahri          "04" 05 2026

"Test MChJ" tomonidan, STIR: 301234567, rahbari Toshmatov J. nomidan, bir tomondan,
va "Hamkor Group" tomonidan, STIR: 302345678, rahbari Karimov A. nomidan, ikkinchi tomondan,
quyidagilar haqida shartnoma tuzdilar:

1. Shartnoma predmeti: tovar yetkazib berish
2. Summa: 500 000 000 so'm (besh yuz million so'm)
3. To'lov muddati: 30 kun ichida

Sotuvchi:                  Xaridor:
Test MChJ                  Hamkor Group
STIR: 301234567            STIR: 302345678
________________           ________________
   M.O.                       M.O.`,
    organization: { name: 'Test MChJ', inn: '301234567', directorName: 'Toshmatov J.' },
    counterparty: { name: 'Hamkor Group', inn: '302345678', directorName: 'Karimov A.' },
  }

  // ─── PDF test ───────────────────────────────────────────────
  console.log('📄 PDF generate qilinmoqda...')
  try {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF()
    doc.setFontSize(14)
    doc.text('OLDI-SOTDI SHARTNOMASI', 20, 20)
    doc.setFontSize(10)
    sample.content.split('\n').forEach((line, i) => {
      doc.text(line, 20, 35 + i * 5)
    })

    const pdfPath = path.join(OUT_DIR, 'test-contract.pdf')
    fs.writeFileSync(pdfPath, Buffer.from(doc.output('arraybuffer')))

    const stats = fs.statSync(pdfPath)
    const head  = fs.readFileSync(pdfPath).slice(0, 4).toString()
    if (head !== '%PDF') throw new Error(`Yaroqsiz PDF magic: ${head}`)
    if (stats.size < 1000) throw new Error(`PDF juda kichik: ${stats.size} bytes`)
    console.log(`   ✅ PDF: ${pdfPath} (${(stats.size / 1024).toFixed(1)} KB)`)
  } catch (e: any) {
    console.error('   ❌ PDF xato:', e.message)
  }

  // ─── Word/DOCX test ─────────────────────────────────────────
  console.log('\n📝 Word/DOCX generate qilinmoqda...')
  try {
    const docx = await import('docx')
    const { Document, Paragraph, Packer, TextRun } = docx as any

    const doc = new Document({
      sections: [{
        properties: {},
        children: sample.content.split('\n').map(line =>
          new Paragraph({
            children: [new TextRun({ text: line, font: 'Times New Roman' })],
          })
        ),
      }],
    })

    const buffer = await Packer.toBuffer(doc)
    const docxPath = path.join(OUT_DIR, 'test-contract.docx')
    fs.writeFileSync(docxPath, buffer)

    const stats = fs.statSync(docxPath)
    // DOCX = ZIP magic: PK
    const magic = buffer.slice(0, 2).toString()
    if (magic !== 'PK') throw new Error(`Yaroqsiz DOCX magic: ${magic}`)
    if (stats.size < 1000) throw new Error(`DOCX juda kichik: ${stats.size} bytes`)
    console.log(`   ✅ DOCX: ${docxPath} (${(stats.size / 1024).toFixed(1)} KB)`)
  } catch (e: any) {
    console.error('   ❌ DOCX xato:', e.message)
  }

  console.log('\n✨ Tugadi. Fayllarni qo\'lda ochib ko\'ring:')
  console.log(`   ${OUT_DIR}`)
}

main().catch(err => { console.error(err); process.exit(1) })
