/**
 * Hujjat matnidan boshlang'ich takror sarlavhalarni olib tashlaydi.
 *
 * Sabab: shablon/AI yaratgan matn ko'pincha sarlavha + raqam + shahar/sana bilan
 * boshlanadi. Renderer (PDF/Word/HTML) yana o'zining styled sarlavhasini qo'shadi.
 * Natija — duplikatsiya. Bu helper boshlang'ich satrlarni regex bilan aniqlab kesib oladi.
 *
 * Faqat **birinchi 8 ta** satrda header naqshlarini izlaymiz (haqiqiy mazmunga
 * tegmaslik uchun). Birinchi haqiqiy matn satri uchragach to'xtatamiz.
 */

const HEADER_PATTERNS: RegExp[] = [
  // Hujjat turi (yolg'iz yoki "BUYRUQ № X", "AKT №", va h.k.)
  /^\s*(BUYRUQ|BAYONNOMA|HISOB[-\s]FAKTURA|FAKTURA|AKT(\s+SVERKI)?|QAROR|XAT|ARIZA)(\s*№?\s*[\dА-Яа-яA-Za-z\-/]+)?\s*$/i,
  // Shartnoma turi: "OLDI-SOTDI SHARTNOMASI", "XIZMAT KO'RSATISH SHARTNOMASI", va h.k.
  /^\s*[«"']?(OLDI[-\s]SOTDI|XIZMAT(\s+KO[''ʻ`]RSATISH)?|IJARA|PUDRAT|MOLIYAVIY(\s+YORDAM)?|TRANSPORT(\s+XIZMATLARI)?|LIZING|AGENTLIK|XALQARO|DAVAL|QO[''ʻ`]SHIMCHA(\s+KELISHUV)?|MEHNAT)\s+(SHARTNOMA(SI)?|KELISHUV)?[»"']?\s*$/i,
  // INTERNATIONAL CONTRACT (xalqaro)
  /^\s*INTERNATIONAL\s+CONTRACT\s*$/i,
  // Yolg'iz raqam: "№ 27/04" yoki "No. 25"
  /^\s*(№|No\.?|N°)\s*[\dА-Яа-яA-Za-z\-/]+\s*$/,
  // Yolg'iz sana — DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, "DD.MM.YYYY", DD.MM.YYYY-yil
  /^\s*"?\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}"?(\s*[-y]?il)?\s*$/i,
  // ISO sana: "2026-04-27"
  /^\s*"?\d{4}[-/]\d{1,2}[-/]\d{1,2}"?\s*$/,
  // Shahar + sana bir satrda: "Toshkent shahri ... 27.04.2026" yoki tab bilan
  /^\s*[«"']?[\wʻ'`oʼÀ-ſ]+\s+shahri\s*[,.\s\t]*"?\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}"?(\s*[-y]?il)?\s*$/i,
  // Sana + shahar (teskari tartibda): '"27.04.2026"   Demo MChJ'
  /^\s*"?\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}"?\s+[\wʻ'`oʼÀ-ſ\s.,&"-]+\s*$/i,
  // Yolg'iz "Toshkent shahri"
  /^\s*[«"']?[\wʻ'`oʼÀ-ſ]+\s+shahri\s*$/i,
  // UPPERCASE org nomi — biznes turi suffiksi bilan tugaydi (MCHJ, OAJ, YaTT, OOO, LLC, INC, MChJ, ZAO, AJ)
  // Bu narx — generic UPPERCASE matnga tegmaslik, faqat tashkilot nomini stripping qilish
  /^\s*(?=[A-ZА-ЯЁ])(?!.*[a-zа-яё])[A-ZА-ЯЁʻ'`"«»\d.,&"\-\s]{2,80}\s+(MCHJ|MChJ|OAJ|YATT|YaTT|OOO|LLC|INC|LTD|CO|ZAO|AJ|HK)\s*$/u,
]

/**
 * Matnning boshlang'ich header bloki — sarlavha + raqam + sana — ni olib tashlaydi.
 *
 * Logikasi: dastlabki satrlardan header naqshlariga (sarlavha, raqam, sana,
 * shahar, org nomi) mos keladigan VA ular orasidagi bo'sh satrlarni kesib
 * o'tadi. Birinchi haqiqiy mazmunli satr (header naqshiga mos kelmaydigan)
 * topilsa to'xtaydi. Maksimal scan diapazoni — 8 ta satr.
 *
 * Buni qiladi: shablon yoki AI yaratgan matn ko'pincha sarlavha + raqam +
 * shahar/sana bilan boshlanadi. Renderer (PDF/Word/HTML) ham yuqorida
 * o'zining styled sarlavhasini qo'shadi — natija duplikatsiya. Bu helper
 * `content` ichidagi takrorlanmani olib tashlaydi.
 */
export function stripDocumentHeader(content: string, extraPatterns: RegExp[] = []): string {
  if (!content) return content
  const patterns = [...HEADER_PATTERNS, ...extraPatterns]

  const lines = content.split('\n')
  const limit = Math.min(lines.length, 8)
  let strippedAny    = false
  let firstBodyIndex = -1

  for (let i = 0; i < limit; i++) {
    const t = lines[i].trim()
    if (!t) continue                                   // bo'sh — o'tib ketamiz
    if (patterns.some(p => p.test(t))) {
      strippedAny = true
      continue                                          // header naqshi — skip
    }
    // Birinchi haqiqiy mazmunli satr — shu yerda to'xtaymiz
    firstBodyIndex = i
    break
  }

  if (!strippedAny || firstBodyIndex < 0) return content
  return lines.slice(firstBodyIndex).join('\n').replace(/^\n+/, '')
}
