// Kotib (sekretar) hujjatlari uchun shablonlar — buyruq va bayonnomalar.
// Bayonnomalar kabinetim.uz standartiga muvofiq professional tuzilishda:
// - Yig'ilish kompozitsiyasi (rais, kotib, ishtirokchilar, kvorum)
// - Kun tartibi (bir nechta masala — har biri ESHITILDI/MUHOKAMA/OVOZ/QAROR)
// - Imzo joylari va M.O.

export interface BuyruqData {
  raqam:         string
  sana:          string
  orgNomi:       string
  orgRahbar:     string
  xodimIsm:      string
  xodimLavozim:  string
  xodimBolim?:   string
  xodimJshshir?: string
  maosh?:        string
  sabab?:        string
  ishBoshi?:     string
  ishOxiri?:     string
  asosiy?:       string
  qoshimcha?:    string
  mavzu?:        string
}

// Kun tartibi bandi — har bir masala uchun alohida blok
export interface AgendaItem {
  masala:    string  // "Tashkilot Nizomini tasdiqlash"
  eshitildi: string  // ma'ruzachi va uning ma'ruzasining mazmuni
  muhokama:  string  // muhokamada so'zga chiqqanlar
  ovoz:      string  // "Yoqlab — 12, qarshi — 0, betaraf — 0"
  qaror:     string  // qabul qilingan qaror
  ijroMuddati?: string
  masulShaxs?:  string
}

export interface BayonnomData {
  raqam:           string
  sana:            string
  vaqtBoshlanish?: string  // "10:00"
  vaqtTugash?:     string  // "12:30"
  joy?:            string  // "Toshkent shahri, tashkilot binosi" yoki "Online (Zoom)"
  orgNomi:         string
  rahbar:          string  // umumiy direktor / yig'ilish raisi
  kotib:           string
  ishtirokchilar:  string  // ko'p qatorli ro'yxat (har qatorda — F.I.O., lavozim)
  taklifEtilganlar?: string
  kvorumJami?:     string  // "12"
  kvorumKelgan?:   string  // "10"
  kunTartibi:      AgendaItem[]
  ilovalar?:       string
  // Legacy/compat — soddalashtirilgan turlar uchun
  mavzu:           string
  muhokama:        string
  qaror:           string
}

// ──────────────────────────────────────────────
// BUYRUQ shablonlari
// ──────────────────────────────────────────────
export const BUYRUQ_TEMPLATES: Record<string, (d: BuyruqData) => string> = {

  ISHGA_QABUL: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()}NI ISHGA QABUL QILISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar}

BUYURADI:

1. ${d.xodimIsm} — ${d.xodimLavozim} lavozimiga${d.xodimBolim ? ` ${d.xodimBolim} bo'limiga` : ''} ${d.ishBoshi || d.sana} dan boshlab ishga qabul qilinsin.
${d.maosh ? `\n2. Maosh: ${d.maosh} so'm oylik belgilansin.` : ''}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Asos: ${d.asosiy || "Mehnat shartnomasi va xodimning arizasi."}

Rahbar: _________________ / ${d.orgRahbar} /
M.O.`,

  ISHDAN_BOSHATISH: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()}NI ISHDAN BO'SHATISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar}

BUYURADI:

1. ${d.xodimLavozim} lavozimida ishlaydigan ${d.xodimIsm} — ${d.ishOxiri || d.sana} dan boshlab ishdan bo'shatilsin.

2. Sabab: ${d.sabab || "Xodimning o'z xohishiga ko'ra (Mehnat kodeksi 97-modda 1-bandi)."}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Asos: ${d.asosiy || "Xodimning arizasi."}

Rahbar: _________________ / ${d.orgRahbar} /
M.O.`,

  LAVOZIM_OZGARTIRISH: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()}NI BOSHQA LAVOZIMGA O'TKAZISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar}

BUYURADI:

1. ${d.xodimIsm} — ${d.ishBoshi || d.sana} dan boshlab ${d.xodimLavozim} lavozimiga o'tkazilsin.
${d.maosh ? `\n2. Maosh: ${d.maosh} so'm oylik belgilansin.` : ''}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Asos: ${d.asosiy || "Xodimning arizasi va rahbar taklifi."}

Rahbar: _________________ / ${d.orgRahbar} /
M.O.`,

  MUKOFOT: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

MUKOFOT BERISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar}

BUYURADI:

1. ${d.xodimLavozim} lavozimidagi ${d.xodimIsm} — ${d.sabab || "vijdonli mehnati uchun"} — ${d.maosh || '___________'} so'm miqdorida bir martalik mukofot berilsin.
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Rahbar: _________________ / ${d.orgRahbar} /
M.O.`,

  BOSHQA: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.mavzu ? d.mavzu.toUpperCase() : 'BUYRUQ'} TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar}

BUYURADI:

${d.sabab || '1. ___________________________________________'}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}
${d.asosiy ? `\nAsos: ${d.asosiy}` : ''}

Rahbar: _________________ / ${d.orgRahbar} /
M.O.`,
}

// ──────────────────────────────────────────────
// BAYONNOMA shablonlari uchun yordamchilar
// ──────────────────────────────────────────────
function header(orgNomi: string, title: string, raqam: string, sana: string, vaqtBosh?: string, vaqtTugash?: string, joy?: string): string {
  const vaqtQator = (vaqtBosh || vaqtTugash)
    ? `Vaqti: ${vaqtBosh || '___'}${vaqtTugash ? ` — ${vaqtTugash}` : ''}\n`
    : ''
  return `${orgNomi.toUpperCase()}

${title.toUpperCase()}
№ ${raqam}

Sana: ${sana}
${vaqtQator}${joy ? `Joyi: ${joy}\n` : ''}`
}

function kompozitsiya(d: BayonnomData, raisLabel = "Yig'ilish raisi"): string {
  const lines: string[] = []
  lines.push(`${raisLabel}: ${d.rahbar}`)
  lines.push(`Kotib: ${d.kotib}`)
  if (d.kvorumJami || d.kvorumKelgan) {
    lines.push(`Kvorum: jami a'zolar — ${d.kvorumJami || '___'}, qatnashgan — ${d.kvorumKelgan || '___'}`)
  }
  if (d.ishtirokchilar?.trim()) {
    lines.push(``)
    lines.push(`Ishtirokchilar:`)
    lines.push(d.ishtirokchilar)
  }
  if (d.taklifEtilganlar?.trim()) {
    lines.push(``)
    lines.push(`Taklif etilganlar:`)
    lines.push(d.taklifEtilganlar)
  }
  return lines.join('\n')
}

function kunTartibi(d: BayonnomData): string {
  const items = (d.kunTartibi || []).filter(it => it.masala?.trim())
  if (items.length === 0) {
    // Legacy fallback — eski mavzu/muhokama/qaror maydonlardan foydalanamiz
    if (d.mavzu || d.muhokama || d.qaror) {
      return `KUN TARTIBI:
1. ${d.mavzu || '___________'}

1-MASALA BO'YICHA:

ESHITILDI:
${d.muhokama || '___________'}

QAROR QILINDI:
${d.qaror || '___________'}`
    }
    return `KUN TARTIBI:
1. ___________________________________________`
  }

  const list = items.map((it, i) => `${i + 1}. ${it.masala}`).join('\n')

  const blocks = items.map((it, i) => {
    const lines: string[] = []
    lines.push(``)
    lines.push(`${i + 1}-MASALA BO'YICHA:`)
    lines.push(``)
    lines.push(`ESHITILDI:`)
    lines.push(it.eshitildi || '___________')
    if (it.muhokama?.trim()) {
      lines.push(``)
      lines.push(`MUHOKAMA QILINDI:`)
      lines.push(it.muhokama)
    }
    if (it.ovoz?.trim()) {
      lines.push(``)
      lines.push(`OVOZ BERISH NATIJALARI: ${it.ovoz}`)
    }
    lines.push(``)
    lines.push(`QAROR QILINDI:`)
    lines.push(it.qaror || '___________')
    if (it.ijroMuddati || it.masulShaxs) {
      const meta: string[] = []
      if (it.masulShaxs)  meta.push(`Mas'ul: ${it.masulShaxs}`)
      if (it.ijroMuddati) meta.push(`Ijro muddati: ${it.ijroMuddati}`)
      lines.push(meta.join('   |   '))
    }
    return lines.join('\n')
  }).join('\n')

  return `KUN TARTIBI:\n${list}\n${blocks}`
}

function imzolar(d: BayonnomData, raisLabel = "Yig'ilish raisi"): string {
  return `${raisLabel}:  _________________ / ${d.rahbar || '___________'} /
Kotib:            _________________ / ${d.kotib || '___________'} /

M.O.`
}

function ilovalarBlok(d: BayonnomData): string {
  if (!d.ilovalar?.trim()) return ''
  return `\nILOVALAR:\n${d.ilovalar}\n`
}

// ──────────────────────────────────────────────
// BAYONNOMA shablonlari (12 ta)
// ──────────────────────────────────────────────
export const BAYONNOMA_TEMPLATES: Record<string, (d: BayonnomData) => string> = {

  // 1) Umumiy yig'ilish
  YIGILIS: (d) => `${header(d.orgNomi, "Yig'ilish bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d)}

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d)}`,

  // 2) Ta'sis yig'ilishi (yangi tashkilot tashkil etilganda)
  TASIS: (d) => `${header(d.orgNomi, "Ta'sis yig'ilishi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Ta'sis yig'ilishi raisi")}

Ta'sis yig'ilishi yuridik shaxs tashkil etish maqsadida o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
Mazkur bayonnoma asosida ${d.orgNomi} yuridik shaxs sifatida ro'yxatdan o'tkazilishi kerak.

${imzolar(d, "Ta'sis yig'ilishi raisi")}`,

  // 3) Aksiyadorlar / ishtirokchilar umumiy yig'ilishi (LLC/JSC)
  AKSIYADORLAR: (d) => `${header(d.orgNomi, "Ishtirokchilar (aksiyadorlar) umumiy yig'ilishi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d)}

Yig'ilish O'zbekiston Respublikasining "Mas'uliyati cheklangan jamiyatlar to'g'risida"gi qonuni asosida o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d)}`,

  // 4) Direktorlar kengashi (kuzatuv kengashi)
  DIREKTORLAR_KENGASHI: (d) => `${header(d.orgNomi, "Direktorlar kengashi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Kengash raisi")}

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d, "Kengash raisi")}`,

  // 5) Komissiya yig'ilishi (umumiy)
  KOMISSIYA: (d) => `${header(d.orgNomi, "Komissiya yig'ilishi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Komissiya quyidagi tarkibda yig'ildi va kun tartibidagi masalalarni ko'rib chiqdi:

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d, "Komissiya raisi")}`,

  // 6) Inventarizatsiya komissiyasi
  INVENTARIZATSIYA: (d) => `${header(d.orgNomi, "Inventarizatsiya komissiyasi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Mol-mulk va moliyaviy majburiyatlarning haqiqiy holatini aniqlash maqsadida inventarizatsiya o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
Inventarizatsiya natijalari bo'yicha ro'yxatlar va dalolatnomalar tuzildi (ilova qilinadi).

${imzolar(d, "Komissiya raisi")}`,

  // 7) Tender / xarid komissiyasi
  TENDER: (d) => `${header(d.orgNomi, "Xarid (tender) komissiyasi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Komissiya yetkazib beruvchilarning takliflarini ko'rib chiqdi va tahlil qildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
Mazkur bayonnoma asosida g'olib bilan shartnoma tuzilishi kerak.

${imzolar(d, "Komissiya raisi")}`,

  // 8) Mol-mulkni hisobdan chiqarish komissiyasi
  HISOBDAN_CHIQARISH: (d) => `${header(d.orgNomi, "Mol-mulkni hisobdan chiqarish komissiyasi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Foydalanish muddati tugagan, eskirgan yoki yaroqsiz holga kelgan mol-mulkni hisobdan chiqarish bo'yicha komissiya yig'ildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
Hisobdan chiqarilgan mol-mulkning ro'yxati va dalolatnomalari ilova qilinadi.

${imzolar(d, "Komissiya raisi")}`,

  // 9) Intizomiy tergov / komissiya
  INTIZOMIY: (d) => `${header(d.orgNomi, "Intizomiy komissiya bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Intizomiy komissiya xodim faoliyatida sodir bo'lgan tartib-qoidalarning buzilishi yuzasidan o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d, "Komissiya raisi")}`,

  // 10) Mehnat muhofazasi va xavfsizligi
  MEHNAT_MUHOFAZASI: (d) => `${header(d.orgNomi, "Mehnat muhofazasi va xavfsizligi yig'ilishi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d)}

Yig'ilish ish joyidagi xavfsizlik holati va mehnat muhofazasi bo'yicha tadbirlarni muhokama qilish uchun o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d)}`,

  // 11) Attestatsiya komissiyasi
  ATTESTATSIYA: (d) => `${header(d.orgNomi, "Attestatsiya komissiyasi bayonnomasi", d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d, "Komissiya raisi")}

Xodimlarning malaka darajasi va egallab turgan lavozimga muvofiqligini baholash maqsadida attestatsiya o'tkazildi.

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d, "Komissiya raisi")}`,

  // 12) Qabul-topshirish (eski format saqlangan, biroz boyitilgan)
  QABUL_TOPSHIRISH: (d) => `${d.orgNomi.toUpperCase()}

QABUL-TOPSHIRISH BAYONNOMASI
№ ${d.raqam}

Sana: ${d.sana}
${d.joy ? `Joyi: ${d.joy}\n` : ''}
Ushbu bayonnoma quyidagilar tomonidan tuzildi:
Topshiruvchi: ${d.rahbar || '___________'}
Qabul qiluvchi: ${d.kotib || '___________'}
${d.taklifEtilganlar?.trim() ? `\nKomissiya a'zolari (guvohlar):\n${d.taklifEtilganlar}` : ''}

TOPSHIRILDI / QABUL QILINDI:
${d.mavzu || '___________'}

HOLATI VA MIQDORI:
${d.muhokama || '___________'}

IZOHLAR VA QARORLAR:
${d.qaror || '___________'}
${ilovalarBlok(d)}
Topshirdi:    _________________ / ${d.rahbar || '___________'} /
Qabul qildi:  _________________ / ${d.kotib  || '___________'} /

M.O.`,

  // 13) Boshqa (general purpose) — kun tartibi bilan
  BOSHQA: (d) => `${header(d.orgNomi, d.mavzu || 'Bayonnoma', d.raqam, d.sana, d.vaqtBoshlanish, d.vaqtTugash, d.joy)}
${kompozitsiya(d)}

${kunTartibi(d)}
${ilovalarBlok(d)}
${imzolar(d)}`,
}

// ──────────────────────────────────────────────
// Type ro'yxatlari
// ──────────────────────────────────────────────
export const BUYRUQ_TYPES = [
  { value: 'ISHGA_QABUL',         label: 'Ishga qabul qilish',    icon: '✅' },
  { value: 'ISHDAN_BOSHATISH',    label: "Ishdan bo'shatish",     icon: '🚫' },
  { value: 'LAVOZIM_OZGARTIRISH', label: "Lavozim o'zgartirish",  icon: '🔄' },
  { value: 'MUKOFOT',             label: 'Mukofot berish',         icon: '🏆' },
  { value: 'BOSHQA',              label: 'Boshqa buyruq',          icon: '📄' },
]

export const BAYONNOMA_TYPES = [
  { value: 'YIGILIS',              label: "Yig'ilish bayonnomasi",                  icon: '👥' },
  { value: 'TASIS',                label: "Ta'sis yig'ilishi bayonnomasi",          icon: '🏛️' },
  { value: 'AKSIYADORLAR',         label: "Ishtirokchilar umumiy yig'ilishi",       icon: '🏢' },
  { value: 'DIREKTORLAR_KENGASHI', label: 'Direktorlar kengashi',                   icon: '💼' },
  { value: 'KOMISSIYA',            label: "Komissiya yig'ilishi",                   icon: '⚖️' },
  { value: 'INVENTARIZATSIYA',     label: 'Inventarizatsiya komissiyasi',           icon: '📦' },
  { value: 'TENDER',               label: 'Xarid (tender) komissiyasi',             icon: '🛒' },
  { value: 'HISOBDAN_CHIQARISH',   label: 'Mol-mulkni hisobdan chiqarish',          icon: '🗑️' },
  { value: 'INTIZOMIY',            label: 'Intizomiy komissiya',                    icon: '📋' },
  { value: 'MEHNAT_MUHOFAZASI',    label: 'Mehnat muhofazasi',                      icon: '🦺' },
  { value: 'ATTESTATSIYA',         label: 'Attestatsiya komissiyasi',               icon: '🎓' },
  { value: 'QABUL_TOPSHIRISH',     label: 'Qabul-topshirish bayonnomasi',           icon: '🔄' },
  { value: 'BOSHQA',               label: 'Boshqa bayonnoma',                       icon: '📝' },
]

// Kun tartibi'da yangi bo'sh masala
export function newAgendaItem(): AgendaItem {
  return { masala: '', eshitildi: '', muhokama: '', ovoz: '', qaror: '' }
}
