/**
 * Buyruq va bayonnoma matnini rasmiy hujjat ko'rinishida HTML ga aylantiradi.
 *
 * Matn strukturasi (kotibTemplates.ts formatiga muvofiq):
 *   - 1-qator: tashkilot nomi  → markazlashgan, qalin
 *   - "BUYRUQ №" qatori         → chap: №, o'ng: sana (bir qatorda)
 *   - "BAYONNOMA", "PROTOKOL"   → markazlashgan, qalin
 *   - "№ XXX" — bayonnoma raqami → markazlashgan
 *   - "Sana:", "Vaqti:", "Joyi:" → chap, kursiv
 *   - "TO'G'RISIDA"/"HAQIDA" bilan tugaydigan qator → markazlashgan, qalin
 *   - "KUN TARTIBI"              → qalin, chiziq
 *   - "ESHITILDI/MUHOKAMA/OVOZ/QAROR" → qalin
 *   - Raqamli bandlar "1. 2. ..."→ normal, indent
 *   - "Rahbar:", "Kotib:", "Topshirdi:" → imzo bloki
 *   - "M.O."                    → markazlashgan
 *   - Bo'sh qatorlar            → bo'shliq
 */
export function renderKotibHtml(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []

  // Qatorni HTML escape qilish
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Birinchi bo'sh bo'lmagan qatorni topish
  const firstNonEmpty = lines.findIndex(l => l.trim())

  // "BUYRUQ № X" va keyingi sana qatorini birgalikda qayta ishlash uchun
  let i = 0
  while (i < lines.length) {
    const raw  = lines[i]
    const line = raw.trim()

    // ── Bo'sh qator
    if (!line) {
      out.push('<div style="height:10px"></div>')
      i++
      continue
    }

    // ── 1-qator: tashkilot nomi
    if (i === firstNonEmpty) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:16px;letter-spacing:0.5px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── "BUYRUQ № X" — № chap, keyingi qatordagi sana o'ng tarafda
    if (/^BUYRUQ\s*№/i.test(line)) {
      // Keyingi bo'sh bo'lmagan qatorni sana deb olamiz
      let sana = ''
      let skip = 0
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].trim()) {
          // Agar u sana formatida bo'lsa yoki qisqa qator bo'lsa
          if (/^\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}/.test(lines[j].trim()) || lines[j].trim().length < 20) {
            sana = lines[j].trim()
            skip = j - i
          }
          break
        }
      }
      out.push(
        `<div style="display:flex;justify-content:space-between;align-items:baseline;margin:16px 0 4px">` +
        `<span style="font-weight:bold;font-size:14px">${esc(line)}</span>` +
        `<span style="font-size:13px">${esc(sana)}</span>` +
        `</div>`
      )
      i += (skip > 0 ? skip + 1 : 1)
      continue
    }

    // ── Bayonnoma sarlavhasi (BAYONNOMA, PROTOKOL, QAROR)
    if (/^(YIGILIS|TA'SIS|AKSIYADOR|DIREKTOR|KOMISSIYA|INVENTAR|TENDER|HISOB|INTIZOM|MEHNAT|ATTEST|QABUL|BOSHQA).*BAYONNOMA/i.test(line) ||
        /BAYONNOMASI?\s*$/i.test(line) ||
        /^BAYONNOMA/i.test(line)) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:14px;margin:12px 0 4px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Bayonnoma/Buyruq raqami "№ X" — alohida qatorda
    if (/^№\s*\S+/.test(line) && line.length < 20) {
      out.push(
        `<div style="text-align:center;font-size:13px;margin-bottom:12px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Sarlavha — "...TO'G'RISIDA" yoki "...HAQIDA" bilan tugaydi
    if (/TO['']?G['']?RISIDA\s*$/i.test(line) || /HAQIDA\s*$/i.test(line)) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:13px;margin:16px 0 14px;line-height:1.5">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Meta qatorlar: Sana:, Vaqti:, Joyi:, Kvorum:
    if (/^(Sana|Vaqti|Joyi|Kvorum|Ishtirokchilar|Taklif etilganlar|Topshiruvchi|Qabul qiluvchi)\s*:/i.test(line)) {
      out.push(
        `<div style="font-size:13px;margin:3px 0;color:#374151">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Muhim bo'limlar sarlavhasi
    if (/^(KUN TARTIBI|ESHITILDI|MUHOKAMA QILINDI|OVOZ BERISH|QAROR QILINDI|TOPSHIRILDI|HOLATI|IZOHLAR|ILOVALAR)\s*:?/i.test(line)) {
      out.push(
        `<div style="font-weight:bold;font-size:13px;margin:14px 0 4px;text-transform:uppercase;letter-spacing:0.3px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Raqamli bandlar "1. ..." "2. ..."
    if (/^\d+\.\s/.test(line)) {
      out.push(
        `<div style="margin:6px 0;padding-left:0;font-size:13px;line-height:1.7">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Imzo qatorlari
    if (/^(Rahbar|Kotib|Yig['']ilish raisi|Kengash raisi|Komissiya raisi|Ta'sis yig'ilishi raisi|Topshirdi|Qabul qildi)\s*:/i.test(line)) {
      out.push(
        `<div style="display:flex;gap:8px;margin:4px 0;font-size:13px">` +
        `<span style="white-space:nowrap">${esc(line.split('/')[0])}</span>` +
        `</div>`
      )
      i++
      continue
    }

    // ── "M.O." — muhr joyi
    if (/^\s*M\.O\.?\s*$/i.test(line)) {
      out.push(
        `<div style="text-align:center;font-size:13px;margin:8px 0;color:#555">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── "Asos:" qatori
    if (/^Asos\s*:/i.test(line)) {
      out.push(
        `<div style="font-size:13px;margin:10px 0 4px;border-top:1px solid #e5e7eb;padding-top:10px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Oddiy qator
    out.push(
      `<div style="font-size:13px;line-height:1.7;margin:2px 0">${esc(line)}</div>`
    )
    i++
  }

  return `<div style="font-family:'Times New Roman',serif;padding:48px 60px;line-height:1.7;min-height:100%">
${out.join('\n')}
</div>`
}
