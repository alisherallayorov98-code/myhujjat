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

export interface BayonnomData {
  raqam:          string
  sana:           string
  orgNomi:        string
  rahbar:         string
  kotib:          string
  ishtirokchilar: string
  mavzu:          string
  muhokama:       string
  qaror:          string
}

// ============================================
// BUYRUQ SHABLONLARI
// ============================================
export const BUYRUQ_TEMPLATES: Record<string, (d: BuyruqData) => string> = {

  ISHGA_QABUL: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()} ni ISHGA QABUL QILISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimIsm} — ${d.xodimLavozim} lavozimiga${d.xodimBolim ? ` ${d.xodimBolim} bo'limiga` : ''} ${d.ishBoshi || d.sana} dan boshlab ishga qabul qilinsin.
${d.maosh ? `\n2. Maosh: ${d.maosh} so'm oylik belgilansin.` : ''}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Asos: ${d.asosiy || "Mehnat shartnomasi va xodimning arizasi."}

Rahbar: _________________ / ${d.orgRahbar} /
                                           M.O.`,

  ISHDAN_BOSHATISH: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()} ni ISHDAN BO'SHATISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimLavozim} lavozimida ishlaydigan ${d.xodimIsm} — ${d.ishOxiri || d.sana} dan boshlab ishdan bo'shatilsin.

2. Sabab: ${d.sabab || "Xodimning o'z xohishiga ko'ra (Mehnat kodeksi 97-modda 1-bandi)."}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Asos: ${d.asosiy || "Xodimning arizasi."}

Rahbar: _________________ / ${d.orgRahbar} /
                                           M.O.`,

  LAVOZIM_OZGARTIRISH: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.xodimIsm.toUpperCase()} ni BOSHQA LAVOZIMGA O'TKAZISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

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

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimLavozim} lavozimidagi ${d.xodimIsm} — ${d.sabab || "vijdonli mehnati uchun"} — ${d.maosh || '___________'} so'm miqdorida bir martalik mukofot berilsin.
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}

Rahbar: _________________ / ${d.orgRahbar} /
                                           M.O.`,

  BOSHQA: (d) => `${d.orgNomi.toUpperCase()}

BUYRUQ № ${d.raqam}
${d.sana}

${d.mavzu ? d.mavzu.toUpperCase() : 'BUYRUQ'} TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

${d.sabab || '1. ___________________________________________'}
${d.qoshimcha ? `\n${d.qoshimcha}` : ''}
${d.asosiy ? `\nAsos: ${d.asosiy}` : ''}

Rahbar: _________________ / ${d.orgRahbar} /
                                           M.O.`,
}

// ============================================
// BAYONNOMA SHABLONLARI
// ============================================
export const BAYONNOMA_TEMPLATES: Record<string, (d: BayonnomData) => string> = {

  YIGILIS: (d) => `${d.orgNomi.toUpperCase()}

BAYONNOMA № ${d.raqam}
${d.sana}

YIG'ILISH BAYONNOMASI

Yig'ilish o'tkazilgan sana: ${d.sana}
Ishtirokchilar: ${d.ishtirokchilar}
Yig'ilish raisi: ${d.rahbar}
Kotib: ${d.kotib}

MUHOKAMA QILINDI:
${d.mavzu}

ESHITILDI:
${d.muhokama}

QAROR QILINDI:
${d.qaror}

Yig'ilish raisi:  _________________ / ${d.rahbar} /
Kotib:            _________________ / ${d.kotib} /`,

  QABUL_TOPSHIRISH: (d) => `${d.orgNomi.toUpperCase()}

QABUL-TOPSHIRISH BAYONNOMASI № ${d.raqam}
${d.sana}

Ushbu bayonnoma quyidagilar tomonidan tuzildi:
Topshiruvchi: ${d.rahbar}
Qabul qiluvchi: ${d.kotib}

TOPSHIRILDI/QABUL QILINDI:
${d.mavzu}

HOLATI VA MIQDORI:
${d.muhokama}

IZOHLAR VA QARORLAR:
${d.qaror}

Topshirdi:   _________________ / ${d.rahbar} /
Qabul qildi: _________________ / ${d.kotib} /`,

  BOSHQA: (d) => `${d.orgNomi.toUpperCase()}

BAYONNOMA № ${d.raqam}
${d.sana}

${d.mavzu ? d.mavzu.toUpperCase() : ''}

Ishtirokchilar: ${d.ishtirokchilar}
Rahbar: ${d.rahbar}
Kotib: ${d.kotib}

ESHITILDI:
${d.muhokama}

QAROR:
${d.qaror}

Rahbar: _________________ / ${d.rahbar} /
Kotib:  _________________ / ${d.kotib} /`,
}

export const BUYRUQ_TYPES = [
  { value: 'ISHGA_QABUL',         label: 'Ishga qabul qilish',    icon: '✅' },
  { value: 'ISHDAN_BOSHATISH',    label: "Ishdan bo'shatish",     icon: '🚫' },
  { value: 'LAVOZIM_OZGARTIRISH', label: "Lavozim o'zgartirish",  icon: '🔄' },
  { value: 'MUKOFOT',             label: 'Mukofot berish',         icon: '🏆' },
  { value: 'BOSHQA',              label: 'Boshqa buyruq',          icon: '📄' },
]

export const BAYONNOMA_TYPES = [
  { value: 'YIGILIS',          label: "Yig'ilish bayonnomasi",        icon: '👥' },
  { value: 'QABUL_TOPSHIRISH', label: 'Qabul-topshirish bayonnomasi', icon: '📦' },
  { value: 'BOSHQA',           label: 'Boshqa bayonnoma',             icon: '📝' },
]
