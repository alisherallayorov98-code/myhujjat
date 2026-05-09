/**
 * Buyruq, bayonnoma va yurist hujjatlari matnini rasmiy ko'rinishda HTML ga aylantiradi.
 */
export function renderKotibHtml(text: string): string {
  const lines = text.split('\n')
  const out: string[] = []

  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const firstNonEmpty = lines.findIndex(l => l.trim())

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

    // ── 1-qator: tashkilot / davlat nomi
    if (i === firstNonEmpty) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:14px;margin-bottom:4px;letter-spacing:0.5px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── "BUYRUQ № X" — № chap, keyingi qatordagi sana o'ng tarafda
    if (/^BUYRUQ\s*№/i.test(line)) {
      let sana = ''
      let skip = 0
      for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
        if (lines[j].trim()) {
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

    // ── "Raqam: № X    Sana: X" — ikki ustun
    if (/^Raqam\s*:.*Sana\s*:/i.test(line)) {
      const parts = line.split(/\s{3,}/)
      const left  = parts[0]?.trim() ?? line
      const right = parts.slice(1).join(' ').trim()
      out.push(
        `<div style="display:flex;justify-content:space-between;font-size:13px;margin:8px 0 4px">` +
        `<span>${esc(left)}</span>` +
        `<span>${right ? esc(right) : ''}</span>` +
        `</div>`
      )
      i++
      continue
    }

    // ── Hujjat sarlavhalari — markazlashgan, qalin
    if (
      /^(YIGILIS|TA['']SIS|AKSIYADOR|DIREKTOR|KOMISSIYA|INVENTAR|TENDER|HISOB|INTIZOM|MEHNAT|ATTEST|BOSHQA).*BAYONNOMA/i.test(line) ||
      /BAYONNOMASI?\s*$/i.test(line) ||
      /^BAYONNOMA/i.test(line) ||
      /^DA['']VO ARIZASI\s*$/i.test(line) ||
      /^PRETENZIYA\s*$/i.test(line) ||
      /^ISHONCH QOG['']OZI\s*$/i.test(line) ||
      /^DALOLATNOMA\s*$/i.test(line) ||
      /^KELISHUV BITIMI\s*$/i.test(line) ||
      /^OGOHLANTIRUV XATI\s*$/i.test(line) ||
      /^SHARTNOMANI.*BEKOR QILISH/i.test(line) ||
      /^QABUL-TOPSHIRISH BAYONNOMASI\s*$/i.test(line)
    ) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:14px;margin:8px 0 4px;letter-spacing:0.5px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Bayonnoma/Buyruq raqami "№ X" — alohida qatorda, markazlashgan
    if (/^№\s*\S+/.test(line) && line.length < 20) {
      out.push(
        `<div style="text-align:center;font-size:13px;margin-bottom:12px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── "...TO'G'RISIDA" yoki "...HAQIDA" → markazlashgan, qalin sarlavha
    if (/TO['']?G['']?RISIDA\s*$/i.test(line) || /HAQIDA\s*$/i.test(line)) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:13px;margin:16px 0 14px;line-height:1.5">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Sud adresi "...GA" (da'vo arizasida 2-qator)
    if (/^[A-ZА-ЯҲҚҒЎЙЦa-zа-яҳқғўйцё'ʻ\s]+(GA|DA)\s*$/i.test(line) && i === firstNonEmpty + 1) {
      out.push(
        `<div style="text-align:center;font-weight:bold;font-size:13px;margin-bottom:12px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Meta qatorlar
    if (/^(Sana|Vaqti|Joyi|Kvorum|Ishtirokchilar|Taklif etilganlar|Topshiruvchi|Qabul qiluvchi|Kimga|Kimdan|Da'vogar|Javobgar|STIR|Manzil|Tel|Bank|H\/r|MFO|Mansabdor shaxs|Talab miqdori|Qarz miqdori|Penya|Jami talab|Notarial tasdiqlash)\s*:/i.test(line)) {
      out.push(
        `<div style="font-size:13px;margin:3px 0;color:#374151">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Bo'lim sarlavhalari (qalin, katta harf)
    if (/^(KUN TARTIBI|BUYURADI|ESHITILDI|MUHOKAMA QILINDI|OVOZ BERISH NATIJALARI|QAROR QILINDI|TOPSHIRILDI \/ QABUL QILINDI|HOLATI VA MIQDORI|IZOHLAR VA QARORLAR|ILOVALAR|TALABNING ASOSI|TALAB MIQDORI|TALABIMIZ|OGOHLANTIRISH|TO['']LOV REKVIZITLARI|HOLATNING BAYONI|HUQUQIY ASOS|TALABLAR|ILOVA|VAKILGA|VAKOLAT BERAMAN|KOMISSIYA A['']ZOLARI|DALOLATNOMA PREDMETI|ANIQLANGAN HOLAT|MOLIYAVIY BAHOLASH|XULOSA|BUZILISH HOLATI|OGOHLANTIRUV MOHIYATI|BEKOR QILISH ASOSI|KUCHGA KIRISH SANASI|HISOB-KITOB TARTIBI|KELISHUV PREDMETI)\s*:?/i.test(line)) {
      out.push(
        `<div style="font-weight:bold;font-size:13px;margin:14px 0 5px;letter-spacing:0.3px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Raqamli bo'lim sarlavhasi "1. KELISHUV PREDMETI" yoki "2. 1-TOMON MAJBURIYATLARI"
    if (/^\d+\.\s+[A-Z0-9ҚҒҲЎА-Я'ʻ\-]{3,}/.test(line)) {
      out.push(
        `<div style="font-weight:bold;font-size:13px;margin:12px 0 5px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Oddiy raqamli band "1. matn..."
    if (/^\d+\.\s/.test(line)) {
      out.push(
        `<div style="margin:6px 0;font-size:13px;line-height:1.7">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Imzo chizig'i "_____ / Ism /"
    if (/^_{3,}/.test(line) && line.includes('/')) {
      const slashParts = line.split('/')
      const name = slashParts[1]?.trim() ?? ''
      out.push(
        `<div style="display:flex;align-items:flex-end;gap:6px;margin:6px 0 2px;font-size:13px">` +
        `<span style="display:inline-block;width:180px;border-bottom:1px solid #374151">&nbsp;</span>` +
        `${name ? `<span style="font-weight:500">${esc(name)}</span>` : ''}` +
        `</div>`
      )
      i++
      continue
    }

    // ── Imzo sarlavha qatorlari "Rahbar: _____ / Ism /"
    if (/^(Rahbar|Kotib|Yig['']ilish raisi|Kengash raisi|Komissiya raisi|Ta['']sis yig['']ilishi raisi|Topshirdi|Qabul qildi|1-TOMON VAKILI|2-TOMON VAKILI|1-TOMON|2-TOMON)\s*:?/i.test(line)) {
      const slashParts = line.split('/')
      const label = (slashParts[0]?.trim() ?? line).replace(/[\s_]+$/, '')
      const name  = slashParts[1]?.trim() ?? ''
      if (name) {
        out.push(
          `<div style="display:flex;align-items:baseline;gap:4px;margin:5px 0;font-size:13px">` +
          `<span style="white-space:nowrap;min-width:160px">${esc(label)}</span>` +
          `<span style="flex:1;border-bottom:1px solid #374151;min-width:60px;margin:0 4px"></span>` +
          `<span style="white-space:nowrap;font-weight:500">${esc(name)}</span>` +
          `</div>`
        )
      } else {
        out.push(
          `<div style="font-size:13px;font-weight:600;margin:14px 0 4px">${esc(label)}</div>`
        )
      }
      i++
      continue
    }

    // ── "M.O." — muhr joyi, markazlashgan
    if (/^M\.O\.?\s*$/i.test(line)) {
      out.push(
        `<div style="font-size:12px;margin:4px 0 10px;color:#555;font-style:italic">[M.O.]</div>`
      )
      i++
      continue
    }

    // ── "Asos:" qatori
    if (/^Asos\s*:/i.test(line)) {
      out.push(
        `<div style="font-size:13px;margin:12px 0 4px;border-top:1px solid #e5e7eb;padding-top:10px">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── "Hurmat bilan," — xulosa
    if (/^Hurmat bilan\s*,?\s*$/i.test(line)) {
      out.push(
        `<div style="font-size:13px;margin:16px 0 4px;font-style:italic">${esc(line)}</div>`
      )
      i++
      continue
    }

    // ── Oddiy qator
    out.push(
      `<div style="font-size:13px;line-height:1.8;margin:2px 0">${esc(line)}</div>`
    )
    i++
  }

  return `<div style="font-family:'Times New Roman',serif;padding:48px 60px;line-height:1.8;min-height:100%">\n${out.join('\n')}\n</div>`
}
