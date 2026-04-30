/**
 * Soha-spesifik shartnoma shablonlari
 * Tizimga import qilinishi mumkin (templates.service'da yoki UI da ko'rsatish uchun)
 */

import type { ContractType } from './contractTemplates'

export interface IndustryTemplate {
  id:           string
  industry:     string         // soha
  industryIcon: string
  name:         string
  description:  string
  contractType: ContractType
  content:      string
  tags:         string[]
}

export const INDUSTRIES = [
  { key: 'qurilish',  label: 'Qurilish',     icon: '🏗️', color: 'bg-[#FFEDD5] text-[#EA580C]' },
  { key: 'savdo',     label: 'Savdo',        icon: '🛒', color: 'bg-[#DBEAFE] text-[#2563EB]' },
  { key: 'it',        label: 'IT/Texnologiya', icon: '💻', color: 'bg-[#EDE9FE] text-[#7C3AED]' },
  { key: 'talim',     label: "Ta'lim",       icon: '🎓', color: 'bg-[#DCFCE7] text-[#16A34A]' },
  { key: 'restoran',  label: 'Restoran/Yetkazib berish', icon: '🍽️', color: 'bg-[#FEF3C7] text-[#D97706]' },
  { key: 'transport', label: 'Transport',    icon: '🚛', color: 'bg-[#CFFAFE] text-[#0891B2]' },
  { key: 'tibbiyot',  label: 'Tibbiyot',     icon: '⚕️', color: 'bg-[#FEE2E2] text-[#DC2626]' },
  { key: 'kreativ',   label: 'Kreativ/Dizayn', icon: '🎨', color: 'bg-[#FDF4FF] text-[#A855F7]' },
] as const

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  // ─── QURILISH ──────────────────────────────────────────────
  {
    id: 'qurilish-pudrat',
    industry: 'qurilish',
    industryIcon: '🏗️',
    name: 'Qurilish pudrat shartnomasi',
    description: 'Asosiy qurilish ishlari uchun (ta\'mirlash, qurilish, montaj)',
    contractType: 'PUDRAT',
    tags: ['qurilish', "ta'mirlash", 'montaj', 'subpodryad'],
    content: `QURILISH PUDRAT SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Pudratchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi {{OBYEKT_MANZIL}} manzilida joylashgan obyektda quyidagi qurilish ishlarini bajarishni o'z zimmasiga oladi:
{{ISH_TURLARI}}

1.2. Buyurtmachi pudratchiga zarur loyiha-smeta hujjatlari, materiallar va ish maydoniga kirishni ta'minlaydi.

2. NARX VA TO'LOV TARTIBI

2.1. Ishlarning umumiy qiymati: {{SUMMA}} ({{SUMMA_MATN}}) so'm, jumladan QQS.
2.2. To'lov tartibi:
— 30% — shartnoma imzolanganidan keyin 5 ish kuni ichida (avans);
— 40% — ishlar 50% bajarilganida (oraliq);
— 30% — ishlarni qabul qilish aktiga binoan (yakuniy).

3. ISH MUDDATLARI

3.1. Ish boshlanishi: {{BOSHLANISH}}.
3.2. Tugallanishi: {{TUGALLANISH}}.
3.3. Tomonlar kelishuvi bo'yicha muddatlar uzaytirilishi mumkin (ob-havo, materiallarni kech yetkazib berish va h.k.).

4. SIFAT VA KAFOLAT

4.1. Bajarilgan ishlar O'zRespublikasi ShNQ va texnik shartlariga muvofiq bo'lishi kerak.
4.2. Ishlarga 24 (yigirma to'rt) oy kafolat beriladi.
4.3. Yashirin nuqsonlar aniqlangan taqdirda Pudratchi o'z hisobidan ularni bartaraf etadi.

5. TOMONLAR MAS'ULIYATI

5.1. Pudratchi:
— ish maydonida xavfsizlikni ta'minlash;
— atrof-muhitga zarar yetkazmaslik;
— bajarilgan ishlar haqida har 2 haftada hisobot berish.

5.2. Buyurtmachi:
— belgilangan muddatlarda to'lovni amalga oshirish;
— ishlarni qabul qilishda 3 kun ichida e'tiroz bildirish.

6. TOMONLARNING REKVIZITLARI

PUDRATCHI:                             BUYURTMACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  {
    id: 'qurilish-material',
    industry: 'qurilish',
    industryIcon: '🏗️',
    name: 'Qurilish materiallari yetkazib berish',
    description: 'Sement, g\'isht, armatura va boshqa materiallarni yetkazib berish',
    contractType: 'OLDI_SOTDI',
    tags: ['materiallar', 'yetkazib berish', 'sement', "g'isht"],
    content: `QURILISH MATERIALLARI YETKAZIB BERISH SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Sotuvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Xaridor"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga {{TOVAR_NOMI}} (keyingi o'rinlarda "Tovar") yetkazib berish, Xaridor esa qabul qilish va to'lash majburiyatini oladi.
1.2. Tovarning miqdori, navi va narxi shartnomaga ilova qilingan Spesifikatsiyada ko'rsatiladi.
1.3. Tovar sifati amaldagi davlat standartlariga muvofiq bo'lishi kerak.

2. UMUMIY QIYMAT VA TO'LOV

2.1. Shartnoma summasi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov bank o'tkazma yo'li bilan, har bir partiyani qabul qilgandan keyin 5 ish kuni ichida amalga oshiriladi.

3. YETKAZIB BERISH SHARTLARI

3.1. Yetkazib berish manzili: {{YETKAZISH_JOY}}.
3.2. Yetkazib berish muddati: har bir partiya uchun buyurtmadan keyin 3-7 ish kuni.
3.3. Yetkazib berish vositasi: Sotuvchi tomonidan ta'minlanadi.
3.4. Tushirish ishlarini Xaridor o'z hisobidan tashkil qiladi.

4. QABUL QILISH TARTIBI

4.1. Tovar miqdori va sifati yetkazib berish vaqtida Xaridor vakili tomonidan tekshiriladi.
4.2. Yashirin nuqsonlar aniqlanganda 7 kun ichida da'vo bildirish mumkin.

5. TOMONLARNING REKVIZITLARI

SOTUVCHI:                              XARIDOR:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  // ─── IT / TEXNOLOGIYA ──────────────────────────────────────
  {
    id: 'it-saas',
    industry: 'it',
    industryIcon: '💻',
    name: 'SaaS / dasturiy ta\'minot xizmati',
    description: 'Bulutli xizmat ko\'rsatish (oylik yoki yillik obuna)',
    contractType: 'XIZMAT',
    tags: ['saas', "dasturiy ta'minot", 'bulut', 'obuna'],
    content: `DASTURIY TA'MINOT XIZMATI SHARTNOMASI (SaaS)
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Provayder"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Mijoz"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Provayder Mijozga {{XIZMAT_NOMI}} dasturiy ta'minotidan foydalanish huquqini taqdim etadi (SaaS modeli).
1.2. Foydalanuvchilar soni: {{FOYDALANUVCHILAR}} kishi.
1.3. Xizmat 24/7 rejimida ishlaydi (rejalashtirilgan texnik ishlar bundan mustasno).

2. SHARTNOMA NARXI

2.1. Oylik to'lov: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov har oyning 5-sanasigacha avans tartibida amalga oshiriladi.
2.3. Birinchi oyning to'lovi shartnoma imzolangandan 5 ish kuni ichida.

3. SLA — XIZMAT KAFOLATLARI

3.1. Xizmatning ishlash vaqti: 99.5% (oyiga maks. 3.5 soat to'xtash).
3.2. Texnik yordam: ish kunlari 09:00-18:00 (Toshkent vaqti).
3.3. Kritik xatolarni 4 soat ichida hal qilish.

4. MA'LUMOTLAR XAVFSIZLIGI

4.1. Mijoz ma'lumotlari shifrlangan holatda saqlanadi.
4.2. Har kunlik avtomatik backup.
4.3. Provayder Mijoz ma'lumotlarini uchinchi shaxslarga uzatmaydi.

5. SHARTNOMA MUDDATI

5.1. Shartnoma {{MUDDAT}} muddatga tuziladi va avtomatik yangilanadi.
5.2. Shartnomani 30 kun oldin ogohlantirish bilan bekor qilish mumkin.

6. TOMONLARNING REKVIZITLARI

PROVAYDER:                             MIJOZ:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  {
    id: 'it-development',
    industry: 'it',
    industryIcon: '💻',
    name: 'Dasturiy ta\'minot ishlab chiqish',
    description: 'Web sayt, mobil ilova yoki maxsus dastur yaratish',
    contractType: 'PUDRAT',
    tags: ['development', 'web', 'mobile', 'ilova', 'sayt'],
    content: `DASTURIY TA'MINOT ISHLAB CHIQISH SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Ishlab chiquvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ishlab chiquvchi quyidagi mahsulotni yaratishni o'z zimmasiga oladi:
{{MAHSULOT_TAVSIFI}}

1.2. Texnik shartlar shartnomaga ilova qilingan TZ (Texnik topshiriq) hujjatida belgilangan.

2. NARX VA TO'LOV BOSQICHLARI

2.1. Umumiy qiymat: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov bosqichlari:
— 30% — shartnoma imzolanganda (kickoff);
— 40% — birinchi prototip taqdim etilganda;
— 30% — yakuniy versiyani qabul qilish aktiga binoan.

3. ISH BOSQICHLARI VA MUDDATLAR

3.1. 1-bosqich: Tahlil va dizayn — {{BOSQICH_1}} kun.
3.2. 2-bosqich: Ishlab chiqish — {{BOSQICH_2}} kun.
3.3. 3-bosqich: Test va deploy — {{BOSQICH_3}} kun.
3.4. Umumiy muddat: {{UMUMIY_MUDDAT}} kun.

4. INTELLEKTUAL MULK HUQUQLARI

4.1. Yakuniy to'lov amalga oshirilgandan so'ng kod va dizayn Buyurtmachining mulki bo'ladi.
4.2. Ishlab chiquvchi 6 oy davomida bepul bug-fix taqdim etadi.

5. KAFOLAT VA QO'LLAB-QUVVATLASH

5.1. Yetkazib berilgan dasturda 6 oy ichida aniqlangan xatolar bepul tuzatiladi.
5.2. Yangi funksiyalar qo'shilishi alohida shartnoma bilan amalga oshiriladi.

6. TOMONLARNING REKVIZITLARI

ISHLAB CHIQUVCHI:                      BUYURTMACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  {
    id: 'it-nda',
    industry: 'it',
    industryIcon: '💻',
    name: 'NDA (Maxfiylik shartnomasi)',
    description: "Tijorat sirini saqlash bo'yicha o'zaro shartnoma",
    contractType: 'BOSHQA',
    tags: ['nda', 'maxfiylik', 'tijorat siri', 'confidentiality'],
    content: `MAXFIYLIK SHARTNOMASI (NDA)
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Tomon-1"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Tomon-2"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Tomonlar hamkorlik jarayonida bir-birlariga taqdim etadigan ma'lumotlarning maxfiyligini ta'minlash majburiyatini oladi.

2. MAXFIY MA'LUMOT TUSHUNCHASI

2.1. Maxfiy ma'lumotlarga quyidagilar kiradi:
— moliyaviy ma'lumotlar;
— mijozlar bazasi va biznes-rejalar;
— texnologik ishlanmalar va kodlar;
— marketing strategiyalari;
— xodimlar haqidagi shaxsiy ma'lumotlar;
— "MAXFIY" deb belgilangan har qanday boshqa ma'lumot.

3. MAJBURIYATLAR

3.1. Tomonlar maxfiy ma'lumotlarni:
— uchinchi shaxslarga oshkor qilmaslik;
— faqat shartnoma maqsadlarida ishlatish;
— shartnoma tugaganidan keyin qaytarish yoki yo'q qilish.

4. ISTISNOLAR

4.1. Quyidagi holatlar maxfiyat buzilishi hisoblanmaydi:
— ma'lumot allaqachon ommaviy bo'lsa;
— sud yoki davlat organi talabiga ko'ra;
— oldindan yozma rozilik bilan oshkor qilingan bo'lsa.

5. MAS'ULIYAT

5.1. Maxfiyatni buzgan tomon yetkazilgan zararni qoplaydi.
5.2. Bunda jarima 50,000,000 (ellik million) so'mdan kam bo'lmaydi.

6. SHARTNOMA MUDDATI

6.1. Shartnoma {{MUDDAT}} yil davomida amal qiladi.
6.2. Shartnoma tugaganidan keyin ham maxfiyat majburiyati 5 (besh) yil davomida saqlanadi.

7. TOMONLARNING REKVIZITLARI

TOMON-1:                               TOMON-2:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  // ─── SAVDO ────────────────────────────────────────────────
  {
    id: 'savdo-dilership',
    industry: 'savdo',
    industryIcon: '🛒',
    name: "Dilerlik (mahsulot tarqatish) shartnomasi",
    description: "Mahsulotni hududda eksklyuziv yoki noeksklyuziv sotish",
    contractType: 'AGENTLIK',
    tags: ['dilership', 'tarqatish', 'distribution'],
    content: `DILERLIK SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Yetkazib beruvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Diler"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Yetkazib beruvchi Dilerga {{HUDUD}} hududida {{MAHSULOT}} mahsulotini sotish huquqini beradi.
1.2. Dilerlik turi: {{DILERLIK_TURI}} (eksklyuziv / noeksklyuziv).

2. NARX VA CHEGIRMA

2.1. Yetkazib beruvchi Dilerga ulgurji narxlardan {{CHEGIRMA}}% chegirma beradi.
2.2. Diler tavsiya etilgan chakana narxdan past sotmasligi shart.

3. DILER MAJBURIYATLARI

3.1. Oyiga kamida {{MIN_HAJM}} so'mlik mahsulot xarid qilish.
3.2. Mahsulotni faqat shartnoma hududida sotish.
3.3. Brand standartlariga rioya qilish (sotuv joyi, reklama).
3.4. Har oy oxirida sotuv hisobotini taqdim etish.

4. YETKAZIB BERUVCHI MAJBURIYATLARI

4.1. Mahsulotni 5 ish kuni ichida yetkazib berish.
4.2. Marketing materiallari (banner, katalog) bilan ta'minlash.
4.3. Trening va o'qitish o'tkazish.

5. SHARTNOMA MUDDATI

5.1. Shartnoma 1 (bir) yil muddatga tuziladi.
5.2. Tomonlar e'tiroz bildirmasa avtomatik yangilanadi.

6. TOMONLARNING REKVIZITLARI

YETKAZIB BERUVCHI:                     DILER:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  // ─── TA'LIM ────────────────────────────────────────────────
  {
    id: 'talim-kurs',
    industry: 'talim',
    industryIcon: '🎓',
    name: "O'quv kurs xizmati",
    description: "Til kurslari, IT kurslari, qo'shimcha ta'lim",
    contractType: 'XIZMAT',
    tags: ["o'quv", 'kurs', "ta'lim", 'trening'],
    content: `O'QUV KURS XIZMATI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "O'quv markaz"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Tinglovchi"), shaxsiy nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. O'quv markaz Tinglovchiga {{KURS_NOMI}} kursi bo'yicha o'quv xizmatlarini ko'rsatadi.
1.2. Kurs davomiyligi: {{KURS_DAVOMIYLIGI}} (oy / hafta).
1.3. Darslar haftada {{HAFTA_KUNI}} kun, kuniga {{SOAT}} soatdan o'tkaziladi.
1.4. O'qitish formati: {{FORMAT}} (oflayn / onlayn / aralash).

2. KURS NARXI VA TO'LOV

2.1. Kurs umumiy narxi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov tartibi: {{TOLOV_TARTIBI}} (bir martalik / oylik bo'lib).
2.3. Bo'lib to'lash: har oyning 5-sanasigacha {{OYLIK_TOLOV}} so'm.

3. O'QUV MARKAZ MAJBURIYATLARI

3.1. Sifatli o'qituvchilar bilan ta'minlash.
3.2. O'quv materiallarini taqdim etish.
3.3. Kurs tugagandan keyin sertifikat berish (kamida 80% darsga qatnashganda).

4. TINGLOVCHI MAJBURIYATLARI

4.1. Belgilangan jadvalga muvofiq darslarga qatnashish.
4.2. To'lovni o'z vaqtida amalga oshirish.
4.3. O'quv markazning ichki qoidalariga rioya qilish.

5. PUL QAYTARISH

5.1. Kurs boshlanganidan 7 kun ichida 100% pul qaytariladi.
5.2. Birinchi oydan keyin pul qaytarilmaydi.

6. TOMONLARNING REKVIZITLARI

O'QUV MARKAZ:                          TINGLOVCHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       Pasport: ___________

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.`
  },

  // ─── RESTORAN / YETKAZIB BERISH ────────────────────────────
  {
    id: 'restoran-yetkazish',
    industry: 'restoran',
    industryIcon: '🍽️',
    name: 'Yetkazib berish xizmati',
    description: 'Restoran/oshxona ovqatlarini yetkazib berish hamkorligi',
    contractType: 'XIZMAT',
    tags: ['yetkazib berish', 'delivery', 'restoran', 'oshxona'],
    content: `OVQAT YETKAZIB BERISH XIZMATI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Restoran"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Yetkazuvchi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Yetkazuvchi Restoran tomonidan tayyorlangan ovqatlarni mijozlarga yetkazib berish xizmatini ko'rsatadi.
1.2. Xizmat hududi: {{HUDUD}}.
1.3. Ish vaqti: kuniga {{ISH_VAQTI}} (masalan: 09:00 - 23:00).

2. NARX VA TO'LOV

2.1. Har bir buyurtma uchun yetkazib berish to'lovi: {{TOLOV_PER_BUYURTMA}} so'm.
2.2. Oylik mukofot: yetkazib berilgan har bir buyurtma uchun belgilangan to'lov.
2.3. Hisob-kitob har hafta yakshanba kuni amalga oshiriladi.

3. YETKAZUVCHI MAJBURIYATLARI

3.1. Buyurtmalarni 30 daqiqa ichida yetkazib berish.
3.2. Ovqatlarning issiqligi va sifatini saqlash (termal sumka).
3.3. Mijozlar bilan xushmuomala bo'lish.
3.4. Sanitariya talablariga rioya qilish.

4. RESTORAN MAJBURIYATLARI

4.1. Buyurtmani 15 daqiqa ichida tayyorlash.
4.2. Yetkazuvchini reklama materiallari bilan ta'minlash.
4.3. To'lovni o'z vaqtida amalga oshirish.

5. MAS'ULIYAT

5.1. Yetkazuvchi yo'lda yetkazilgan zarar uchun (ovqat to'kilishi va h.k.) javobgar.
5.2. Mijoz shikoyatlari ikkala tomon o'rtasida ko'rib chiqiladi.

6. TOMONLARNING REKVIZITLARI

RESTORAN:                              YETKAZUVCHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },

  // ─── KREATIV / DIZAYN ─────────────────────────────────────
  {
    id: 'kreativ-dizayn',
    industry: 'kreativ',
    industryIcon: '🎨',
    name: 'Dizayn xizmati shartnomasi',
    description: 'Logo, brendbuk, web dizayn, marketing materiallari',
    contractType: 'PUDRAT',
    tags: ['dizayn', 'logo', 'brendbuk', 'kreativ'],
    content: `DIZAYN XIZMATI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Dizayner"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Dizayner Buyurtmachi uchun quyidagi dizayn ishlarini bajaradi:
{{ISH_RUYXATI}}

1.2. Yakuniy mahsulot formatlari: {{FORMATLAR}} (PDF, AI, PNG, SVG va h.k.).

2. NARX VA TO'LOV

2.1. Umumiy narx: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov: 50% oldindan, 50% ishlar topshirilgandan so'ng.

3. ISH JARAYONI VA MUDDATLAR

3.1. Birinchi konsept taqdim etish: {{KONSEPT_MUDDAT}} kun.
3.2. Ko'p marotaba qayta ishlash imkoniyati: {{REVIZIYA_SONI}} marta.
3.3. Yakuniy versiya: {{YAKUNIY_MUDDAT}} kun.

4. INTELLEKTUAL MULK

4.1. Yakuniy to'lov amalga oshirilgandan so'ng dizaynning barcha huquqlari Buyurtmachiga o'tadi.
4.2. Dizayner o'z portfoliosi uchun ishni ko'rsatish huquqiga ega.

5. TOMONLAR HAMKORLIGI

5.1. Buyurtmachi zarur ma'lumotlarni 3 kun ichida taqdim etadi.
5.2. Dizayner takliflarni email orqali yuboradi.

6. TOMONLARNING REKVIZITLARI

DIZAYNER:                              BUYURTMACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`
  },
]
