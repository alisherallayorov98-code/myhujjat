// Dinamik xizmatlar — kotib/kadrlar/buxgalter bo'limlari uchun konfiguratsiya.
// Har bir xizmat: forma maydonlari + AI prompt + metadata.
// Foydalanuvchi formani to'ldiradi → backend /ai/generate chaqiriladi → matn qaytadi.

export type FieldType = 'text' | 'textarea' | 'date' | 'number' | 'select'

export interface FeatureField {
  key:           string
  label:         string
  placeholder?:  string
  type?:         FieldType
  required?:     boolean
  options?:      { value: string; label: string }[]
  hint?:         string
  isCpField?:    boolean       // kontragentdan tanlash
}

export interface FeatureConfig {
  key:         string         // unique id
  icon:        string         // emoji
  title:       string         // ko'rinadigan nom
  description: string
  fields:      FeatureField[]
  /**
   * AI uchun prompt shablon. {{key}} placeholder'lar maydon qiymatlari bilan
   * almashtiriladi. Boshqacha aytganda — AI ga aniq vazifa beriladi.
   */
  promptTemplate: string
  /** Generatsiya qilinadigan hujjat turi (saqlanish uchun) */
  docType:     string
  /** Sahifa qaysi bo'limga tegishli (statistika uchun) */
  category:    'kotib' | 'kadrlar' | 'buxgalter'
}

// ═════════════════════════════════════════════════════════════════════════════
// KOTIB — 13 ta yangi xizmat
// ═════════════════════════════════════════════════════════════════════════════
export const KOTIB_FEATURES: FeatureConfig[] = [
  {
    key:         'rasmiy_xat',
    icon:        '✉️',
    title:       'Rasmiy xat',
    description: 'Hamkorlar, davlat organlari yoki kontragentlarga rasmiy xat',
    docType:     'Rasmiy xat',
    category:    'kotib',
    fields: [
      { key: 'kim_uchun',     label: 'Kimga',           placeholder: "Soliq inspeksiyasi boshlig'iga", required: true },
      { key: 'mavzu',         label: 'Mavzu',           placeholder: "Ma'lumot so'rash haqida", required: true },
      { key: 'xat_raqami',    label: 'Xat raqami',      placeholder: '25/03-15' },
      { key: 'sana',          label: 'Sana',            type: 'date', required: true },
      { key: 'asosiy_mazmun', label: 'Mazmun',          placeholder: '2024-yil 3-kvartal hisoboti...', type: 'textarea', required: true },
      { key: 'muddati',       label: 'Javob muddati',   placeholder: '10 ish kuni ichida' },
    ],
    promptTemplate: `O'zbekiston Respublikasi qonunchiligiga muvofiq professional rasmiy xat tuzing.
Mavzu: {{mavzu}}
Kimga: {{kim_uchun}}
Xat raqami: {{xat_raqami}}
Sana: {{sana}}
Asosiy mazmun: {{asosiy_mazmun}}
Javob muddati: {{muddati}}

Xat rasmiy uslubda, aniq va to'liq bo'lsin. Rekvizitlar (chap yuqorida tashkilot, o'ng yuqorida adresat), salomlashish, asosiy matn, hurmat bilan, imzo joyi.`,
  },
  {
    key:         'taklifnoma',
    icon:        '📨',
    title:       'Taklifnoma',
    description: 'Tadbir, seminar yoki uchrashuvga rasmiy taklifnoma',
    docType:     'Taklifnoma',
    category:    'kotib',
    fields: [
      { key: 'tadbir_nomi',  label: 'Tadbir nomi', placeholder: 'Yillik sheriklar konferensiyasi', required: true },
      { key: 'tadbir_sana',  label: 'Sana va vaqt', placeholder: '15-aprel 2025, 10:00', required: true },
      { key: 'tadbir_joyi',  label: 'Joyi', placeholder: 'Toshkent, Hyatt Regency', required: true },
      { key: 'mehmonga',     label: 'Kimga', placeholder: 'Alfa MChJ direktori', required: true },
      { key: 'dastur',       label: 'Dastur', placeholder: 'Ochilish, ma\'ruzalar, tushlik...', type: 'textarea' },
    ],
    promptTemplate: `Quyidagi tadbirga professional taklifnoma yozing:
Tadbir: {{tadbir_nomi}}
Sana: {{tadbir_sana}}
Joyi: {{tadbir_joyi}}
Kimga: {{mehmonga}}
Dastur: {{dastur}}

Taklifnoma rasmiy va iliq uslubda, RSVP bilan tugasin.`,
  },
  {
    key:         'hisobot',
    icon:        '📊',
    title:       'Hisobot',
    description: 'Oylik, kvartallik yoki loyiha bo\'yicha rasmiy hisobot',
    docType:     'Hisobot',
    category:    'kotib',
    fields: [
      { key: 'hisobot_turi',      label: 'Hisobot turi', placeholder: 'Oylik faoliyat hisoboti', required: true },
      { key: 'davr',              label: 'Davr', placeholder: '2025-yil mart', required: true },
      { key: 'bajarilgan_ishlar', label: 'Bajarilgan ishlar', placeholder: '- 3 ta yangi shartnoma...', type: 'textarea', required: true },
      { key: 'muammolar',         label: 'Muammolar (ixtiyoriy)', placeholder: 'Yetkazib berish kechikdi...', type: 'textarea' },
      { key: 'rejalar',           label: 'Keyingi davr rejalari', placeholder: '- Yangi bozorga chiqish...', type: 'textarea' },
    ],
    promptTemplate: `Tashkilot uchun professional hisobot tuzing:
Tur: {{hisobot_turi}}
Davr: {{davr}}
Bajarilgan: {{bajarilgan_ishlar}}
Muammolar: {{muammolar}}
Rejalar: {{rejalar}}

Hisobot bo'limlarga ajratilsin: kirish, bajarilgan ishlar, muammolar va yechimlar, keyingi davr rejalari, xulosa.`,
  },
  {
    key:         'eslatma',
    icon:        '📌',
    title:       'Ichki eslatma (memo)',
    description: 'Xodimlarga yoki bo\'limlarga rasmiy ichki eslatma',
    docType:     'Memo',
    category:    'kotib',
    fields: [
      { key: 'kimga',  label: 'Kimga', placeholder: "Barcha bo'lim boshliqlari", required: true },
      { key: 'mavzu',  label: 'Mavzu', placeholder: 'Ish vaqti tartibi haqida', required: true },
      { key: 'mazmun', label: 'Mazmun', placeholder: "Quyidagilarga e'tibor...", type: 'textarea', required: true },
      { key: 'muddat', label: 'Muddat (ixtiyoriy)', placeholder: '20-aprelgacha' },
    ],
    promptTemplate: `Tashkilot ichida tarqatish uchun professional memo (ichki eslatma) tuzing:
Kimga: {{kimga}}
Mavzu: {{mavzu}}
Mazmun: {{mazmun}}
Muddat: {{muddat}}

Memo qisqa, aniq, harakatlanuvchi bo'lsin.`,
  },
  {
    key:         'murojaatnoma',
    icon:        '📋',
    title:       'Murojaatnoma / ariza',
    description: 'Davlat organlari yoki rahbariyatga rasmiy murojaatnoma',
    docType:     'Murojaatnoma',
    category:    'kotib',
    fields: [
      { key: 'kimga',           label: 'Kimga', placeholder: 'Toshkent shahar hokimligiga', required: true },
      { key: 'maqsad',          label: 'Maqsad', placeholder: "Ruxsatnoma so'rash", required: true },
      { key: 'asosiy_mazmun',   label: 'Mazmun', placeholder: "Biz O'zbekiston Respublikasining ...", type: 'textarea', required: true },
      { key: 'kutilgan_natija', label: 'Kutilgan natija', placeholder: '30 kunlik ruxsatnoma berish' },
    ],
    promptTemplate: `Davlat organi yoki rahbariyatga professional murojaatnoma/ariza tuzing:
Kimga: {{kimga}}
Maqsad: {{maqsad}}
Mazmun: {{asosiy_mazmun}}
Kutilgan natija: {{kutilgan_natija}}

Rasmiy uslubda, qonuniy asoslar bilan, murojaat tartibida.`,
  },
  {
    key:         'tushuntirish',
    icon:        '📄',
    title:       'Tushuntirish xati',
    description: 'Xodimdan yoki tashkilotdan rasmiy tushuntirish',
    docType:     'Tushuntirish xati',
    category:    'kotib',
    fields: [
      { key: 'xodim_ism',              label: 'Xodim F.I.Sh.', placeholder: 'Rahimov Bobur Aliyevich', required: true },
      { key: 'lavozim',                label: 'Lavozim', placeholder: 'Bosh muhandis', required: true },
      { key: 'hodisa',                 label: 'Voqea', placeholder: '3-aprel kuni kechikib kelgan', required: true },
      { key: 'sabab',                  label: 'Sabab', placeholder: 'Transport muammosi...', type: 'textarea', required: true },
      { key: 'qayta_takrorlanmasligi', label: 'Takrorlanmaslik choralari', placeholder: 'Erta chiqishga harakat...' },
    ],
    promptTemplate: `Xodimdan tushuntirish xati professional matn shaklida tuzing:
Xodim: {{xodim_ism}}, lavozim: {{lavozim}}
Voqea: {{hodisa}}
Sabab: {{sabab}}
Choralar: {{qayta_takrorlanmasligi}}

Birinchi shaxsda yozilsin (Men ...), rasmiy uslubda.`,
  },
  {
    key:         'ishonchnoma',
    icon:        '📜',
    title:       'Ishonchnoma',
    description: 'Vakil tayinlash — bank, hujjat, tender uchun',
    docType:     'Ishonchnoma',
    category:    'kotib',
    fields: [
      { key: 'vakil_ism',      label: 'Vakil F.I.Sh.', placeholder: 'Rahimov Bobur Aliyevich', required: true },
      { key: 'vakil_lavozim',  label: 'Lavozim', placeholder: 'Bosh buxgalter' },
      { key: 'vakil_passport', label: 'Pasport', placeholder: 'AB1234567', required: true },
      { key: 'vakolat_maqsad', label: 'Vakolat maqsadi', placeholder: 'Soliq inspeksiyasidan hujjat olish...', type: 'textarea', required: true },
      { key: 'amal_muddati',   label: 'Muddat', placeholder: '6 oy / 1 yil', required: true },
    ],
    promptTemplate: `Tashkilot nomidan ishonchnoma tuzing (O'zR FK 134-141-modda):
Vakil: {{vakil_ism}}, lavozim: {{vakil_lavozim}}
Pasport: {{vakil_passport}}
Vakolat: {{vakolat_maqsad}}
Muddat: {{amal_muddati}}

Yuridik kuchga ega ishonchnoma — kim, nima qila oladi, qachongacha aniq ko'rsatilsin.`,
  },
  {
    key:         'dalolatnoma',
    icon:        '📑',
    title:       'Dalolatnoma',
    description: 'Qabul-topshirish, yo\'qotish yoki inventarizatsiya akti',
    docType:     'Dalolatnoma',
    category:    'kotib',
    fields: [
      { key: 'dalolatnoma_turi', label: 'Tur', placeholder: 'Qabul-topshirish / Yo\'qotish', required: true },
      { key: 'sana',             label: 'Sana', type: 'date', required: true },
      { key: 'joy',              label: 'Joy', placeholder: 'Tashkilot omborxonasi, Toshkent', required: true },
      { key: 'ishtirokchilar',   label: 'Ishtirokchilar', placeholder: 'Ombor mudiri Karimov A., ...', type: 'textarea', required: true },
      { key: 'predmet',          label: 'Predmet', placeholder: 'Nima topshirildi/tekshirildi...', type: 'textarea', required: true },
      { key: 'xulosa',           label: 'Xulosa', placeholder: "Hujjatlar to'liq topshirildi...", type: 'textarea' },
    ],
    promptTemplate: `Rasmiy dalolatnoma (akt) tuzing:
Tur: {{dalolatnoma_turi}}
Sana: {{sana}}, joy: {{joy}}
Ishtirokchilar: {{ishtirokchilar}}
Predmet: {{predmet}}
Xulosa: {{xulosa}}

Standart dalolatnoma shakliga rioya qiling: nomi, sana/joy, ishtirokchilar, asosiy qism, xulosa, imzolar.`,
  },
  {
    key:         'kafolat_xat',
    icon:        '🔒',
    title:       'Kafolat xati',
    description: 'Hamkor, bank yoki davlat organiga kafolat xati',
    docType:     'Kafolat xati',
    category:    'kotib',
    fields: [
      { key: 'kimga',            label: 'Kimga', placeholder: 'Ipoteka-bank bosh ofisi', required: true },
      { key: 'kafolat_maqsad',   label: 'Maqsad', placeholder: "Kredit to'lovlari", required: true },
      { key: 'kafolat_miqdori',  label: 'Summa (ixtiyoriy)', placeholder: "500 000 000 so'm" },
      { key: 'kafolat_muddati',  label: 'Muddat', placeholder: '2026 yil 31 dekabrgacha', required: true },
      { key: 'qoshimcha',        label: "Qo'shimcha", placeholder: 'Shartnoma bajarilmagan taqdirda...', type: 'textarea' },
    ],
    promptTemplate: `Yuridik kuchga ega kafolat xati tuzing (O'zR FK 322-329 moddalar asosida):
Kimga: {{kimga}}
Maqsad: {{kafolat_maqsad}}
Summa: {{kafolat_miqdori}}
Muddat: {{kafolat_muddati}}
Qo'shimcha: {{qoshimcha}}

Aniq majburiyatlar va kafolat shartlari bilan.`,
  },
  {
    key:         'tabriklash_xat',
    icon:        '🎉',
    title:       'Tabriklash xati',
    description: 'Sherik, mijoz yoki tashkilotga rasmiy tabrik',
    docType:     'Tabriklash xati',
    category:    'kotib',
    fields: [
      { key: 'kimga',         label: 'Kimga', placeholder: '"Alfa" MChJ direktori Karimov A.', required: true },
      { key: 'bayram',        label: 'Bayram', placeholder: "Yangi yil / Navro'z / Yubiley", required: true },
      { key: 'asosiy_mazmun', label: 'Mazmun', placeholder: 'Hamkorlik uchun minnatdorchilik...', type: 'textarea' },
    ],
    promptTemplate: `Iliq va rasmiy tabriklash xati yozing:
Kimga: {{kimga}}
Bayram: {{bayram}}
Mazmun: {{asosiy_mazmun}}

Tabrik chiroyli, samimiy bo'lsin, lekin biznes uslubida.`,
  },
  {
    key:         'rekvizitlar_xat',
    icon:        '📨',
    title:       'Rekvizitlar so\'rovi',
    description: 'Hamkordan bank rekvizitlari yoki hujjat so\'rash',
    docType:     'Rekvizitlar xati',
    category:    'kotib',
    fields: [
      { key: 'kimga',     label: 'Kimga', placeholder: '"Beta Savdo" MChJ', required: true },
      { key: 'sorov_turi', label: "So'rov turi", placeholder: 'Bank rekvizitlari / Ustav nusxasi', required: true },
      { key: 'maqsad',    label: 'Maqsad', placeholder: 'Shartnoma tuzish uchun', required: true },
      { key: 'muddat',    label: 'Muddat', placeholder: '2 ish kuni ichida' },
    ],
    promptTemplate: `Hamkorga rekvizitlar/hujjat so'rash xati tuzing:
Kimga: {{kimga}}
So'rov: {{sorov_turi}}
Maqsad: {{maqsad}}
Muddat: {{muddat}}

Qisqa, aniq, hurmat bilan.`,
  },
  // Tashkiliy buyruqlar — bu alohida sahifa bo'lishi mumkin (8 ta sub-tur)
  // Lekin hozircha config'da to'g'ridan to'g'ri 8 ta yozamiz:
  {
    key:         'buyruq_av_sotib',
    icon:        '🚗',
    title:       'Buyruq: Asosiy vosita sotib olish',
    description: 'Avtomobil, asbob-uskuna xarid qilish',
    docType:     'Buyruq (AV sotib olish)',
    category:    'kotib',
    fields: [
      { key: 'raqam',       label: 'Buyruq raqami', placeholder: '12', required: true },
      { key: 'sana',        label: 'Sana', type: 'date', required: true },
      { key: 'shahar',      label: 'Shahar', placeholder: 'Toshkent' },
      { key: 'vosita_nomi', label: 'Vosita nomi', placeholder: 'Chevrolet Cobalt', required: true },
      { key: 'model',       label: 'Markasi/modeli', placeholder: '2024' },
      { key: 'narxi',       label: 'Taxminiy qiymati', placeholder: "150 000 000 so'm" },
      { key: 'mas_ul',      label: "Mas'ul shaxs", placeholder: 'Karimov A.' },
    ],
    promptTemplate: `Asosiy vosita sotib olish to'g'risida tashkiliy buyruq tuzing:
Raqam: {{raqam}}, sana: {{sana}}, shahar: {{shahar}}
Vosita: {{vosita_nomi}}, model: {{model}}, narxi: {{narxi}}
Mas'ul: {{mas_ul}}

Buyruq formati: tashkilot nomi → BUYRUQ → sarlavha → BUYURAMAN: → 6-7 punkt → imzo.`,
  },
  {
    key:         'buyruq_inventarizatsiya',
    icon:        '📦',
    title:       'Buyruq: Inventarizatsiya',
    description: 'Mol-mulk yoki kassa inventarizatsiyasi',
    docType:     'Buyruq (Inventarizatsiya)',
    category:    'kotib',
    fields: [
      { key: 'raqam',         label: 'Buyruq raqami', required: true },
      { key: 'sana',          label: 'Sana', type: 'date', required: true },
      { key: 'inventar_turi', label: 'Inventarizatsiya turi', placeholder: 'Mol-mulk va asosiy vositalar' },
      { key: 'boshlanish',    label: 'Boshlanish sanasi', type: 'date', required: true },
      { key: 'tugash',        label: 'Tugash sanasi', type: 'date', required: true },
      { key: 'rais',          label: 'Komissiya raisi', placeholder: 'Karimov A.', required: true },
      { key: 'azolar',        label: "A'zolar", placeholder: 'Rahimova D., Aliyev B.', type: 'textarea' },
    ],
    promptTemplate: `Inventarizatsiya o'tkazish bo'yicha buyruq tuzing:
Raqam: {{raqam}}, sana: {{sana}}
Tur: {{inventar_turi}}
Davr: {{boshlanish}} — {{tugash}}
Komissiya raisi: {{rais}}
A'zolar: {{azolar}}

Standart buyruq formatida.`,
  },
]

// ═════════════════════════════════════════════════════════════════════════════
// KADRLAR — yangi shablonlar (mavjud 4 dan tashqari)
// ═════════════════════════════════════════════════════════════════════════════
export const KADRLAR_FEATURES: FeatureConfig[] = [
  {
    key:         'orindoshlik',
    icon:        '👔',
    title:       "Tashqi o'rindoshlik shartnomasi",
    description: 'Asosiy ishidan tashqari ish bilan ishlash shartnomasi',
    docType:     "Tashqi o'rindoshlik",
    category:    'kadrlar',
    fields: [
      { key: 'xodim_ism',     label: 'Xodim F.I.Sh.', required: true },
      { key: 'xodim_pinfl',   label: 'JSHSHIR', placeholder: '14 raqam' },
      { key: 'lavozim',       label: 'Lavozim', required: true },
      { key: 'asosiy_ish',    label: 'Asosiy ish joyi', placeholder: 'Boshqa tashkilot nomi' },
      { key: 'maosh',         label: 'Maosh', placeholder: "3 000 000 so'm" },
      { key: 'soatlar',       label: 'Haftalik soatlar', placeholder: '20' },
      { key: 'boshlanish',    label: 'Boshlanish sanasi', type: 'date', required: true },
    ],
    promptTemplate: `Tashqi o'rindoshlik bo'yicha mehnat shartnomasi tuzing (O'zR MK 80-modda):
Xodim: {{xodim_ism}} (JSHSHIR: {{xodim_pinfl}})
Asosiy ish: {{asosiy_ish}}
Lavozim: {{lavozim}}, maosh: {{maosh}}, haftalik soat: {{soatlar}}
Boshlanish: {{boshlanish}}

Kuniga 4 soatdan, haftada 20 soatdan oshmasin shartlari bilan.`,
  },
  {
    key:         'pudrat',
    icon:        '🔧',
    title:       'Fuqaroviy-huquqiy (Pudrat) shartnomasi',
    description: 'Mehnat shartnomasi emas — bir martalik ish/xizmat bo\'yicha',
    docType:     'Pudrat shartnomasi',
    category:    'kadrlar',
    fields: [
      { key: 'ijrochi_ism',  label: 'Ijrochi F.I.Sh.', required: true },
      { key: 'ijrochi_pinfl', label: 'JSHSHIR' },
      { key: 'ish_turi',     label: 'Bajariladigan ish', placeholder: 'Veb-sayt yaratish', type: 'textarea', required: true },
      { key: 'narx',         label: 'Umumiy narx', placeholder: "10 000 000 so'm", required: true },
      { key: 'muddat',       label: 'Bajarilish muddati', placeholder: '30 kalendar kun', required: true },
      { key: 'natija_aniq',  label: 'Aniq natija', placeholder: 'Ishga tushirilgan veb-sayt + manba kod' },
    ],
    promptTemplate: `Fuqaroviy-huquqiy tusidagi xizmat ko'rsatish (pudrat) shartnomasi tuzing (O'zR FK 656-modda):
Ijrochi: {{ijrochi_ism}} (JSHSHIR: {{ijrochi_pinfl}})
Ish: {{ish_turi}}
Narx: {{narx}}
Muddat: {{muddat}}
Natija: {{natija_aniq}}

MUHIM: Bu mehnat shartnomasi emas — pudrat. Aniq natija va to'lov shartlari bilan.`,
  },
  {
    key:         'nda',
    icon:        '🔒',
    title:       'Maxfiylik (NDA) shartnomasi',
    description: 'Tijorat siri haqida ma\'lumotni oshkor qilmaslik',
    docType:     'NDA',
    category:    'kadrlar',
    fields: [
      { key: 'xodim_ism',    label: 'Xodim F.I.Sh.', required: true },
      { key: 'xodim_pinfl',  label: 'JSHSHIR' },
      { key: 'lavozim',      label: 'Lavozim', required: true },
      { key: 'maxfiy_turi',  label: 'Maxfiy ma\'lumot turi', placeholder: 'Mijozlar bazasi, narx siyosati...', type: 'textarea', required: true },
      { key: 'muddat',       label: 'Maxfiylik muddati', placeholder: '5 yil ishdan ketgandan keyin' },
      { key: 'jarima',       label: 'Buzilganda jarima', placeholder: "100 000 000 so'm" },
    ],
    promptTemplate: `Maxfiylik (NDA) shartnomasi tuzing (O'zR "Tijorat siri to'g'risida"gi qonun):
Xodim: {{xodim_ism}}, lavozim: {{lavozim}}, JSHSHIR: {{xodim_pinfl}}
Maxfiy: {{maxfiy_turi}}
Muddat: {{muddat}}
Jarima: {{jarima}}

Tijorat siri ta'rifi, oshkor qilish taqiqi, javobgarlik bandlari bilan.`,
  },
  {
    key:         'mukofot_buyruq',
    icon:        '🏆',
    title:       'Mukofot (rag\'bat) buyrug\'i',
    description: 'Xodimga moddiy yoki ma\'naviy rag\'bat berish',
    docType:     'Mukofot buyrug\'i',
    category:    'kadrlar',
    fields: [
      { key: 'raqam',          label: 'Buyruq raqami', required: true },
      { key: 'sana',           label: 'Sana', type: 'date', required: true },
      { key: 'xodim_ism',      label: 'Xodim F.I.Sh.', required: true },
      { key: 'lavozim',        label: 'Lavozim', required: true },
      { key: 'mukofot_turi',   label: 'Mukofot turi', placeholder: 'Pul mukofoti / Faxriy yorliq', required: true },
      { key: 'mukofot_summa',  label: 'Summa (agar pul)', placeholder: "2 000 000 so'm" },
      { key: 'sabab',          label: 'Sabab', placeholder: "Vijdonli mehnati uchun...", type: 'textarea', required: true },
    ],
    promptTemplate: `Xodimni rag'batlantirish buyrug'i tuzing (O'zR MK 153-modda):
Raqam: {{raqam}}, sana: {{sana}}
Xodim: {{xodim_ism}} ({{lavozim}})
Mukofot: {{mukofot_turi}}, summa: {{mukofot_summa}}
Sabab: {{sabab}}

Standart buyruq formatida.`,
  },
  {
    key:         'jazo_buyruq',
    icon:        '⚠️',
    title:       'Intizomiy jazo buyrug\'i',
    description: 'Hayfsan, tanbeh yoki ish haqi qisqartirish',
    docType:     'Intizomiy jazo',
    category:    'kadrlar',
    fields: [
      { key: 'raqam',     label: 'Buyruq raqami', required: true },
      { key: 'sana',      label: 'Sana', type: 'date', required: true },
      { key: 'xodim_ism', label: 'Xodim F.I.Sh.', required: true },
      { key: 'lavozim',   label: 'Lavozim', required: true },
      { key: 'jazo_turi', label: 'Jazo turi', placeholder: 'Hayfsan / Tanbeh / Ish haqini kamaytirish', required: true },
      { key: 'qoidabuzar', label: 'Qoidabuzarlik', placeholder: 'Ish vaqtidan oldin chiqib ketish...', type: 'textarea', required: true },
      { key: 'asosiy_hujjat', label: 'Asoslovchi hujjat', placeholder: 'Tushuntirish xati № 25, ...' },
    ],
    promptTemplate: `Xodimga intizomiy jazo qo'llash buyrug'i tuzing (O'zR MK 154-160-modda):
Raqam: {{raqam}}, sana: {{sana}}
Xodim: {{xodim_ism}} ({{lavozim}})
Jazo: {{jazo_turi}}
Qoidabuzarlik: {{qoidabuzar}}
Asos: {{asosiy_hujjat}}

Qonuniy asoslar va xodim huquqlari aks ettirilsin.`,
  },
  {
    key:         'safari_buyruq',
    icon:        '✈️',
    title:       'Xizmat safari buyrug\'i',
    description: 'Xodimni boshqa shahar yoki davlatga xizmat safari',
    docType:     'Xizmat safari buyrug\'i',
    category:    'kadrlar',
    fields: [
      { key: 'raqam',       label: 'Buyruq raqami', required: true },
      { key: 'sana',        label: 'Sana', type: 'date', required: true },
      { key: 'xodim_ism',   label: 'Xodim F.I.Sh.', required: true },
      { key: 'lavozim',     label: 'Lavozim', required: true },
      { key: 'manzil',      label: 'Manzil', placeholder: 'Samarqand shahri', required: true },
      { key: 'maqsad',      label: 'Maqsad', placeholder: 'Yangi mijoz bilan uchrashuv', type: 'textarea', required: true },
      { key: 'boshlanish',  label: 'Boshlanish', type: 'date', required: true },
      { key: 'tugash',      label: 'Tugash', type: 'date', required: true },
    ],
    promptTemplate: `Xizmat safariga yuborish buyrug'i tuzing (O'zR MK 175-modda):
Raqam: {{raqam}}, sana: {{sana}}
Xodim: {{xodim_ism}} ({{lavozim}})
Manzil: {{manzil}}, maqsad: {{maqsad}}
Davr: {{boshlanish}} — {{tugash}}

Xarajatlar (yo'l, kunlik, turar joy) qoplash shartlari bilan.`,
  },
  {
    key:         'qoshimcha_kelishuv',
    icon:        '📝',
    title:       'Qo\'shimcha kelishuv',
    description: 'Mehnat shartnomasiga o\'zgartirish kiritish',
    docType:     "Qo'shimcha kelishuv",
    category:    'kadrlar',
    fields: [
      { key: 'shartnoma_raqam', label: 'Asosiy shartnoma raqami', required: true },
      { key: 'shartnoma_sana',  label: 'Asosiy shartnoma sanasi', type: 'date', required: true },
      { key: 'xodim_ism',       label: 'Xodim F.I.Sh.', required: true },
      { key: 'ozgartirish',     label: "O'zgartirish mazmuni", placeholder: 'Maoshni 5 mln ga oshirish', type: 'textarea', required: true },
      { key: 'sabab',           label: 'Sabab', placeholder: 'Lavozimga ko\'tarilish' },
      { key: 'kuchga_kirish',   label: 'Kuchga kirish', type: 'date', required: true },
    ],
    promptTemplate: `Mehnat shartnomasiga qo'shimcha kelishuv tuzing (O'zR MK 81-modda):
Asosiy shartnoma: №{{shartnoma_raqam}} ({{shartnoma_sana}})
Xodim: {{xodim_ism}}
O'zgartirish: {{ozgartirish}}
Sabab: {{sabab}}
Kuchga kiradi: {{kuchga_kirish}}

Hujjat ikkala tomon imzosi bilan tasdiqlanadi.`,
  },
]

// ═════════════════════════════════════════════════════════════════════════════
// BUXGALTER — yangi xizmatlar (mavjud 3 dan tashqari)
// ═════════════════════════════════════════════════════════════════════════════
export const BUXGALTER_FEATURES: FeatureConfig[] = [
  {
    key:         'dalolatnoma',
    icon:        '✅',
    title:       'Dalolatnoma (akt)',
    description: 'Ish/xizmat bajarilganligi to\'g\'risida rasmiy dalolatnoma',
    docType:     'Dalolatnoma',
    category:    'buxgalter',
    fields: [
      { key: 'kontragent',     label: 'Buyurtmachi', isCpField: true, required: true },
      { key: 'shartnoma_raqam', label: 'Shartnoma raqami', placeholder: '2025/03-15' },
      { key: 'xizmat_turi',    label: 'Bajarilgan xizmat/ish', placeholder: 'Dasturiy ta\'minot...', required: true },
      { key: 'summa',          label: 'Summa', placeholder: "15 000 000 so'm", required: true },
      { key: 'sana',           label: 'Sana', type: 'date', required: true },
    ],
    promptTemplate: `Bajarilgan ish/xizmat bo'yicha dalolatnoma tuzing:
Buyurtmachi: {{kontragent}}
Shartnoma: №{{shartnoma_raqam}}
Xizmat: {{xizmat_turi}}
Summa: {{summa}}
Sana: {{sana}}

Standart akt formatida — qabul-topshirish tafsilotlari bilan.`,
  },
  {
    key:         'talabnoma',
    icon:        '📨',
    title:       'Qarz talabnomasi',
    description: 'Qarzdorga rasmiy pretenziya (FK 327-328 mod.)',
    docType:     'Talabnoma',
    category:    'buxgalter',
    fields: [
      { key: 'qarzdor',        label: 'Qarzdor tashkilot', isCpField: true, required: true },
      { key: 'shartnoma_raqam', label: 'Shartnoma raqami', placeholder: '2024/08-01' },
      { key: 'qarz_summasi',   label: 'Qarz summasi', placeholder: "50 000 000 so'm", required: true },
      { key: 'muddat_utgan',   label: 'Muddati o\'tgan kunlar', placeholder: '45', type: 'number' },
      { key: 'jarima_foiz',    label: 'Kunlik jarima %', placeholder: '0.1', hint: "FK 350-mod.: 0.05–0.5%" },
      { key: 'oxirgi_muhlat',  label: 'Javob muddati (kun)', placeholder: '10' },
    ],
    promptTemplate: `Qarzdorga professional pretenziya/talabnoma tuzing (O'zR FK 327-350-modda):
Qarzdor: {{qarzdor}}
Shartnoma: №{{shartnoma_raqam}}
Qarz: {{qarz_summasi}}, muddat o'tgan: {{muddat_utgan}} kun
Jarima foizi: {{jarima_foiz}}%
Javob muddati: {{oxirgi_muhlat}} ish kuni

Sudga murojaat oldidagi rasmiy ogohlantirish shaklida.`,
  },
  {
    key:         'debitor_undirish',
    icon:        '⚖️',
    title:       'Debitor undirish xati',
    description: 'Sudgacha undirish ogohlantirishi',
    docType:     'Debitor undirish',
    category:    'buxgalter',
    fields: [
      { key: 'qarzdor',       label: 'Qarzdor', isCpField: true, required: true },
      { key: 'qarz_summasi',  label: 'Qarz summasi', required: true },
      { key: 'qarz_sababi',   label: 'Qarz sababi', placeholder: 'Tovarlar yetkazilgan...', type: 'textarea' },
      { key: 'oxirgi_muhlat', label: 'Oxirgi to\'lov muddati', type: 'date' },
      { key: 'sudga_murojaat', label: 'Sud ogohlantirishi', type: 'select', options: [
        { value: 'Ha',  label: 'Ha — sud bilan qo\'rqitish' },
        { value: "Yo'q", label: "Yo'q — oddiy talab" },
      ]},
    ],
    promptTemplate: `Debitor qarzni sudgacha undirish ogohlantirishi tuzing:
Qarzdor: {{qarzdor}}
Summa: {{qarz_summasi}}
Sabab: {{qarz_sababi}}
Oxirgi muhlat: {{oxirgi_muhlat}}
Sud bilan qo'rqitish: {{sudga_murojaat}}

Rasmiy va qat'iy uslubda, xato qilgan kompaniya yana bir imkoniyat olishi.`,
  },
  {
    key:         'avans_hisobot',
    icon:        '💵',
    title:       'Avans hisoboti',
    description: 'Olingan avans bo\'yicha xarajatlar hisoboti',
    docType:     'Avans hisobot',
    category:    'buxgalter',
    fields: [
      { key: 'xodim_ism',     label: 'Xodim F.I.Sh.', required: true },
      { key: 'avans_summa',   label: 'Avans summasi', placeholder: "5 000 000 so'm", required: true },
      { key: 'avans_sana',    label: 'Avans olingan sana', type: 'date' },
      { key: 'maqsad',        label: 'Avans maqsadi', placeholder: 'Xizmat safari xarajatlari' },
      { key: 'xarajatlar',    label: 'Xarajatlar tafsiloti', placeholder: '- Yo\'l: 800 000\n- Mehmonxona: 1 200 000', type: 'textarea', required: true },
      { key: 'qoldiq',        label: 'Qoldiq/farq', placeholder: '+ 200 000 / - 100 000' },
    ],
    promptTemplate: `Avans hisoboti tuzing:
Xodim: {{xodim_ism}}
Avans: {{avans_summa}} ({{avans_sana}})
Maqsad: {{maqsad}}
Xarajatlar:
{{xarajatlar}}
Qoldiq: {{qoldiq}}

Standart avans hisoboti shaklida — xarajatlar jadvali, hujjatlar ro'yxati, qoldiq.`,
  },
  {
    key:         'xarajat_hisobot',
    icon:        '📈',
    title:       'Xarajatlar hisoboti',
    description: 'Davriy xarajatlar haqida hisobot',
    docType:     'Xarajatlar hisoboti',
    category:    'buxgalter',
    fields: [
      { key: 'davr',         label: 'Davr', placeholder: '2025-yil mart', required: true },
      { key: 'umumiy_summa', label: 'Umumiy xarajat', placeholder: "120 000 000 so'm", required: true },
      { key: 'taqsimot',     label: 'Xarajatlar taqsimoti', placeholder: '- Ish haqi: 60M\n- Ofis: 15M', type: 'textarea', required: true },
      { key: 'taqqoslash',   label: 'O\'tgan davr bilan farq', placeholder: '+15% (rejaga nisbatan +5%)' },
      { key: 'xulosa',       label: 'Xulosa va tavsiyalar', type: 'textarea' },
    ],
    promptTemplate: `Tashkilot xarajatlari hisoboti tuzing:
Davr: {{davr}}
Umumiy: {{umumiy_summa}}
Taqsimot: {{taqsimot}}
Taqqoslash: {{taqqoslash}}
Xulosa: {{xulosa}}

Bo'limlar bo'yicha tahlil va keyingi davr uchun tavsiyalar.`,
  },
  {
    key:         'jarima_hisobi',
    icon:        '📐',
    title:       'Penya / jarima hisobi',
    description: 'Shartnoma asosidagi penya hisob-kitobi',
    docType:     'Jarima hisobi',
    category:    'buxgalter',
    fields: [
      { key: 'kontragent',   label: 'Kontragent', isCpField: true, required: true },
      { key: 'shartnoma',    label: 'Shartnoma raqami' },
      { key: 'asosiy_qarz',  label: 'Asosiy qarz', placeholder: "30 000 000 so'm", required: true },
      { key: 'kunlik_foiz',  label: 'Kunlik foiz', placeholder: '0.1', type: 'number' },
      { key: 'kun_soni',     label: 'Muddat o\'tgan kunlar', placeholder: '45', type: 'number' },
    ],
    promptTemplate: `Penya/jarima hisob-kitobi tuzing (FK 350-modda):
Kontragent: {{kontragent}}
Shartnoma: №{{shartnoma}}
Asosiy qarz: {{asosiy_qarz}}
Kunlik %: {{kunlik_foiz}}
Kunlar: {{kun_soni}}

Hisob-kitob jadvali (har kun uchun) va umumiy summa bilan.`,
  },
]

// Hammasi birgalikda — kategoriya bo'yicha qulay
export function getFeaturesForCategory(category: 'kotib' | 'kadrlar' | 'buxgalter'): FeatureConfig[] {
  switch (category) {
    case 'kotib':     return KOTIB_FEATURES
    case 'kadrlar':   return KADRLAR_FEATURES
    case 'buxgalter': return BUXGALTER_FEATURES
  }
}

/** Promptdagi {{key}} placeholder'larni form qiymatlari bilan almashtirish */
export function fillPrompt(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => values[key]?.trim() || '___')
}
