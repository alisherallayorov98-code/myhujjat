/**
 * Soha-spesifik shartnoma shablonlari
 * Tizimga import qilinishi mumkin (templates.service'da yoki UI da ko'rsatish uchun)
 */

import type { ContractType } from './contractTemplates'

export type Lang = 'uz' | 'oz' | 'ru'

export interface IndustryTemplate {
  id:           string
  industry:     string         // soha
  industryIcon: string
  name:         string         // UZ default
  nameOz?:      string
  nameRu?:      string
  description:  string         // UZ default
  descriptionOz?: string
  descriptionRu?: string
  contractType: ContractType
  content:      string         // UZ qoladi (yuridik matn — pro translator kerak)
  tags:         string[]
}

// Soha labellari 3 tilda
export const INDUSTRIES = [
  { key: 'qurilish',  label: 'Qurilish',                labelOz: 'Қурилиш',                 labelRu: 'Строительство',     icon: '🏗️', color: 'bg-[#FFEDD5] text-[#EA580C]' },
  { key: 'savdo',     label: 'Savdo',                   labelOz: 'Савдо',                   labelRu: 'Торговля',          icon: '🛒', color: 'bg-[#DBEAFE] text-[#2563EB]' },
  { key: 'it',        label: 'IT/Texnologiya',          labelOz: 'ИТ/Технология',           labelRu: 'IT/Технологии',     icon: '💻', color: 'bg-[#EDE9FE] text-[#7C3AED]' },
  { key: 'talim',     label: "Ta'lim",                  labelOz: 'Таълим',                  labelRu: 'Образование',       icon: '🎓', color: 'bg-[#DCFCE7] text-[#16A34A]' },
  { key: 'restoran',  label: 'Restoran/Yetkazib berish', labelOz: 'Ресторан/Етказиб бериш', labelRu: 'Ресторан/Доставка', icon: '🍽️', color: 'bg-[#FEF3C7] text-[#D97706]' },
  { key: 'transport', label: 'Transport',               labelOz: 'Транспорт',               labelRu: 'Транспорт',         icon: '🚛', color: 'bg-[#CFFAFE] text-[#0891B2]' },
  { key: 'tibbiyot',  label: 'Tibbiyot',                labelOz: 'Тиббиёт',                 labelRu: 'Медицина',          icon: '⚕️', color: 'bg-[#FEE2E2] text-[#DC2626]' },
  { key: 'kreativ',   label: 'Kreativ/Dizayn',          labelOz: 'Креатив/Дизайн',          labelRu: 'Креатив/Дизайн',    icon: '🎨', color: 'bg-[#FDF4FF] text-[#A855F7]' },
] as const

// Helper — joriy tilda label qaytaradi
export function getIndustryLabel(key: string, lang: Lang): string {
  const ind = INDUSTRIES.find(i => i.key === key)
  if (!ind) return key
  if (lang === 'oz') return ind.labelOz
  if (lang === 'ru') return ind.labelRu
  return ind.label
}

// Helper — template nomini tilda qaytaradi
export function getTemplateName(t: IndustryTemplate, lang: Lang): string {
  if (lang === 'oz' && t.nameOz) return t.nameOz
  if (lang === 'ru' && t.nameRu) return t.nameRu
  return t.name
}

// Helper — template tavsifini tilda qaytaradi
export function getTemplateDescription(t: IndustryTemplate, lang: Lang): string {
  if (lang === 'oz' && t.descriptionOz) return t.descriptionOz
  if (lang === 'ru' && t.descriptionRu) return t.descriptionRu
  return t.description
}

export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  // ─── QURILISH ──────────────────────────────────────────────
  {
    id: 'qurilish-pudrat',
    industry: 'qurilish',
    industryIcon: '🏗️',
    name:   'Qurilish pudrat shartnomasi',
    nameOz: 'Қурилиш пудрат шартномаси',
    nameRu: 'Договор строительного подряда',
    description:   "Asosiy qurilish ishlari uchun (ta'mirlash, qurilish, montaj)",
    descriptionOz: "Асосий қурилиш ишлари учун (таъмирлаш, қурилиш, монтаж)",
    descriptionRu: 'Для основных строительных работ (ремонт, строительство, монтаж)',
    contractType: 'PUDRAT',
    tags: ['qurilish', "ta'mirlash", 'montaj', 'subpodryad'],
    content: `QURILISH PUDRAT SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Pudratchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 631–704-moddalari va shaharsozlik to'g'risidagi qonun hujjatlariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga binoan ushbu shartnoma va loyiha-smeta hujjatlari (LSH) asosida ushbu shartnomada belgilangan qurilish ishlarini (keyingi o'rinlarda — "Ishlar") bajarishni o'z zimmasiga oladi, Buyurtmachi esa Ishlarni qabul qilib, ularning narxini to'lashga majburdir (FK 666-modda).
1.2. Obyekt manzili: {{OBYEKT_MANZIL}}.
1.3. Bajariladigan ishlar turi va hajmi: {{ISH_TURLARI}}.
1.4. Loyiha-smeta hujjatlari (LSH) shartnomaga ajralmas ilova hisoblanadi.
1.5. Pudratchi Ishlarni shaxsan yoki o'z mas'uliyati ostida jalb qilingan subpudratchilar orqali bajarishi mumkin (FK 670-modda). Bunda Pudratchi subpudratchilarning ishlari uchun Buyurtmachi oldida to'liq javobgar bo'ladi.

2. NARX VA TO'LOV TARTIBI

2.1. Ishlarning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}), jumladan QQS — Soliq kodeksi 238-moddasiga muvofiq.
2.2. Narx LSH asosida belgilanadi va shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa (FK 668-modda).
2.3. To'lov tartibi (bosqichma-bosqich):
    — 30% — avans, shartnoma imzolangandan keyin 5 ish kuni ichida;
    — 40% — oraliq to'lov, Ishlar 50% bajarilganligi haqida bajarilgan ishlar dalolatnomasi (KS-2, KS-3 yoki KB-2, KB-3 shakllari) imzolangandan keyin 10 ish kuni ichida;
    — 30% — yakuniy to'lov, yakuniy qabul-topshirish dalolatnomasi imzolangandan keyin 10 ish kuni ichida.
2.4. Qo'shimcha ishlar Buyurtmachining yozma roziligi (qo'shimcha kelishuv) bilan, alohida smeta asosida bajariladi (FK 670-modda). Yozma rozilik olinmagan qo'shimcha ishlar uchun haq to'lanmasligi mumkin.
2.5. To'lov bank ko'chirmasi orqali Pudratchining hisob raqamiga amalga oshiriladi. To'lov sanasi — pul mablag'i Pudratchining hisob raqamiga kelib tushgan sana hisoblanadi.

3. ISH MUDDATLARI

3.1. Ishlar boshlanish sanasi: {{BOSHLANISH}}.
3.2. Ishlar tugallanish sanasi: {{TUGALLANISH}}.
3.3. Oraliq bosqichlar muddatlari Ishlar grafigida (LSH ilovasida) belgilanadi va Tomonlar uchun majburiy hisoblanadi.
3.4. Muddatlar quyidagi hollarda Tomonlar yozma kelishuvi asosida uzaytirilishi mumkin: ob-havo sharoitlarining keskin yomonlashishi, Buyurtmachi tomonidan zarur LSH yoki materiallarni o'z vaqtida taqdim etmaslik, fors-major holatlari, davlat organlari ko'rsatmasi.

4. ISHLARNI BAJARISH SHARTLARI VA XAVFSIZLIK

4.1. Pudratchi Ishlarni O'zbekiston Respublikasining shaharsozlik normalari va qoidalari (ShNQ), texnik reglamentlar va davlat standartlari (O'zDSt) talablariga to'liq muvofiq bajarishi shart.
4.2. Pudratchi ish maydonida mehnat xavfsizligi, yong'in xavfsizligi va atrof-muhit muhofazasi qoidalariga rioya qilish bo'yicha to'liq mas'uliyatni o'z zimmasiga oladi.
4.3. Pudratchi xodimlarining ish maydonida sodir bo'lgan baxtsiz hodisalar uchun Pudratchi javobgar bo'ladi va Buyurtmachini bunday holatlardan ozod qiladi.
4.4. Pudratchi ish maydonida saqlanadigan materiallar va asbob-uskunalar uchun mas'uliyatni o'z zimmasiga oladi.
4.5. Buyurtmachi yoki uning vakili Ishlarning borishini istalgan vaqtda nazorat qilish huquqiga ega, ammo Pudratchining tezkor faoliyatiga aralashmasdan (FK 663-modda).

5. ISHLARNI QABUL QILISH

5.1. Bosqichli Ishlar bajarilgach, Pudratchi Buyurtmachiga bajarilgan ishlar dalolatnomasi (KS-2 yoki KB-2 shaklida) va smeta-moliyaviy hisob (KS-3 yoki KB-3 shaklida) taqdim etadi.
5.2. Buyurtmachi 10 (o'n) ish kuni ichida hujjatlarni ko'rib, imzolaydi yoki yozma asoslangan e'tirozlarini bildiradi. Belgilangan muddatda imzo qo'yilmasa va e'tiroz bildirilmasa, Ishlar to'liq qabul qilingan hisoblanadi (FK 690-modda).
5.3. Yakuniy qabul-topshirish dalolatnomasi vakolatli komissiya tomonidan imzolanadi. Komissiya tarkibiga Buyurtmachi vakili, Pudratchi vakili va, agar zarur bo'lsa, mustaqil ekspert kiradi.

6. SIFAT VA KAFOLAT

6.1. Bajarilgan Ishlar O'zRespublikasi ShNQ, texnik reglamentlar, LSH va shartnoma talablariga muvofiq bo'lishi shart.
6.2. Pudratchi Ishlarga 24 (yigirma to'rt) oy kafolat beradi. Kafolat muddati yakuniy qabul-topshirish dalolatnomasi imzolangan kundan boshlanadi (FK 694-modda).
6.3. Kafolat muddati ichida nuqson aniqlanganda, Pudratchi Buyurtmachi xabarini olganidan keyin 30 (o'ttiz) kalendar kun ichida nuqsonlarni o'z hisobidan bartaraf etishga majburdir.
6.4. Yashirin nuqsonlar uchun Pudratchining javobgarligi qabul qilingandan keyin 5 (besh) yil davomida saqlanadi (FK 695-modda).
6.5. Pudratchi sifatsiz materiallar yoki uskunalardan foydalanish natijasida yetkazilgan zarar uchun ham javobgar.

7. TOMONLARNING HUQUQ VA MAJBURIYATLARI

7.1. Pudratchi majburdir:
    — Ishlarni shartnoma muddati va sifatda bajarish;
    — LSH va xavfsizlik normalariga rioya qilish;
    — Ishlarda ishlatiladigan materiallar va texnologiyaning sifati uchun javobgar bo'lish (FK 671-modda);
    — Ishlar borasida har 2 (ikki) haftada Buyurtmachiga yozma hisobot berish;
    — Buyurtmachining yozma ko'rsatmalari va loyiha o'zgarishlariga rioya qilish.

7.2. Pudratchi huquqi bor:
    — Ishlar haqini o'z vaqtida olish;
    — Buyurtmachi tomonidan loyiha o'zgartirilsa, qo'shimcha xarajat va muddat talab qilish (FK 670-modda);
    — Buyurtmachi to'lovni kechiktirsa, Ishlarni to'xtatib turish (FK 333-modda).

7.3. Buyurtmachi majburdir:
    — To'lovlarni shartnomada belgilangan muddatda amalga oshirish;
    — Pudratchiga LSH, ish maydoniga kirishni va kerakli ruxsatnomalarni o'z vaqtida taqdim etish;
    — Bajarilgan ishlarni belgilangan muddatlarda qabul qilish.

7.4. Buyurtmachi huquqi bor:
    — Ishlar borishini istalgan vaqtda nazorat qilish (FK 663-modda);
    — Sifatsiz Ishlarni qayta bajarishni talab qilish;
    — Pudratchi Ishlarni jiddiy kechiktirsa, shartnomadan voz kechib, zararlarni undirish (FK 715-modda).

8. JAVOBGARLIK

8.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va ushbu shartnomaga muvofiq javobgar bo'ladilar.
8.2. Ishlarni bajarish kechiktirilgan har bir kun uchun Pudratchi Buyurtmachiga shartnoma summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.3. To'lov kechiktirilgan har bir kun uchun Buyurtmachi Pudratchiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
8.5. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi. Yetkazilgan haqiqiy zarar penyadan ortiq qismda alohida undiriladi.

9. FORS-MAJOR

9.1. Tomonlar majburiyatlarini bajara olmaslik uchun, agar bu fors-major (yengib bo'lmaydigan kuchlar) — tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari natijasida sodir bo'lgan bo'lsa, javobgarlikdan ozod etiladilar.
9.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
9.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
9.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

10. SHARTNOMANI BEKOR QILISH

10.1. Buyurtmachi shartnomadan istalgan vaqtda voz kechishi mumkin, ammo Pudratchiga bu paytgacha haqiqatan bajarilgan Ishlar uchun haq to'lashi va sodir bo'lgan zararlarni qoplashi shart (FK 715-modda).
10.2. Pudratchi shartnomadan voz kechishi mumkin, agar Buyurtmachi muhim shartlarni buzsa (to'lovni 30 kun va undan ko'p kechiktirsa, LSH yoki ish maydoniga kirishni ta'minlamasa).
10.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
11.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.
11.4. Murakkab texnik nizolar ekspert tomonidan ko'rib chiqilishi mumkin (xarajatlar aybdor Tomonga yuklanadi).

12. MAXFIYLIK

12.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri, loyiha hujjatlari va texnik ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
12.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.

13. ALOQA, ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

13.1. Shartnoma bo'yicha rasmiy xabarnomalar yozma shaklda — qo'lma-qo'l, kuryer xizmati, buyurtmali xat yoki Tomonlar tan oladigan elektron pochta orqali yuboriladi. Aloqa rekvizitlari: Pudratchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Buyurtmachi — {{CP_EMAIL}}, {{CP_TELEFON}}.
13.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
13.3. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.

14. SUG'URTA

14.1. Pudratchi qurilish-montaj risklarini sug'urta qiladi, agar shartnoma summasi 1 milliard so'mdan oshsa yoki Buyurtmachi yozma talab qilsa.
14.2. Sug'urta xarajatlari LSH tarkibida hisobga olinadi.

15. UMUMIY QOIDALAR

15.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
15.2. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
15.3. Shartnoma imzolangan kundan kuchga kiradi va Tomonlar majburiyatlarini to'liq bajargunga qadar amal qiladi.
15.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
15.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

16. TOMONLARNING REKVIZITLARI VA IMZOLARI

PUDRATCHI:                                      BUYURTMACHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  {
    id: 'qurilish-material',
    industry: 'qurilish',
    industryIcon: '🏗️',
    name:   'Qurilish materiallari yetkazib berish',
    nameOz: 'Қурилиш материалларини етказиб бериш',
    nameRu: 'Поставка строительных материалов',
    description:   "Sement, g'isht, armatura va boshqa materiallarni yetkazib berish",
    descriptionOz: "Цемент, ғишт, арматура ва бошқа материалларни етказиб бериш",
    descriptionRu: 'Поставка цемента, кирпича, арматуры и других материалов',
    contractType: 'OLDI_SOTDI',
    tags: ['materiallar', 'yetkazib berish', 'sement', "g'isht"],
    content: `QURILISH MATERIALLARI YETKAZIB BERISH SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Sotuvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Xaridor"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 414–505-moddalari va yetkazib berish bo'yicha maxsus normalariga (FK 424-modda) muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga ushbu shartnoma asosida partiyalar bilan qurilish materiallarini (keyingi o'rinlarda — "Tovar") yetkazib beradi, Xaridor esa Tovarni qabul qilib, narxini to'lashga majburdir.
1.2. Tovar nomi va asosiy turi: {{TOVAR_NOMI}} (sement, g'isht, armatura, qum, shag'al va boshqa qurilish materiallari).
1.3. Har bir partiyaning aniq miqdori, navi, brendi va narxi shartnomaga ilova qilinadigan Spesifikatsiyada (1-ilova) yoki har bir buyurtma bo'yicha alohida tuziladigan akt-spesifikatsiyada ko'rsatiladi.
1.4. Tovar sifati O'zbekiston Respublikasining amaldagi davlat standartlari (O'zDSt), shaharsozlik normalari (ShNQ) va texnik reglamentlar talablariga muvofiq bo'lishi shart.
1.5. Sotuvchi har bir partiya uchun kelib chiqishi to'g'risida sertifikat, sifat pasporti va boshqa zarur hujjatlarni taqdim etishi shart (FK 437-modda).

2. NARX VA TO'LOV TARTIBI

2.1. Shartnomaning umumiy taxminiy summasi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. Aniq narxlar Spesifikatsiyada belgilanadi va shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. Bozor narxlari sezilarli darajada (15% dan ortiq) o'zgarsa, Sotuvchi narxni qayta ko'rib chiqishni taklif qilish huquqiga ega; bunda Xaridor 10 (o'n) ish kuni ichida yozma javob beradi yoki shartnomadan voz kechish huquqiga ega bo'ladi.
2.4. To'lov tartibi: {{TOLOV_TARTIBI}} (avans, qisman avans, faktura asosida yoki har bir partiyadan keyin).
2.5. To'lov muddati: har bir partiyani qabul qilgan kundan keyin 5 (besh) ish kuni ichida bank ko'chirmasi orqali amalga oshiriladi, agar Spesifikatsiyada boshqacha belgilanmagan bo'lsa.
2.6. To'lov sanasi — pul mablag'i Sotuvchining hisob raqamiga kelib tushgan sana hisoblanadi.

3. YETKAZIB BERISH TARTIBI

3.1. Yetkazib berish manzili: {{YETKAZISH_JOY}}.
3.2. Yetkazib berish bosqichlari va miqdorlari Spesifikatsiyada yoki Xaridorning yozma buyurtmasi (zayavkasi) asosida belgilanadi.
3.3. Yetkazib berish muddati: Xaridorning yozma buyurtmasi olingandan keyin 3–7 (uch–yetti) ish kuni ichida, agar Spesifikatsiyada boshqacha belgilanmagan bo'lsa.
3.4. Yetkazib berish shartlari (Incoterms 2020 yoki shartnoma asosida): {{YETKAZISH_SHARTLARI}} (DAP, EXW yoki yetkazib berish Sotuvchi/Xaridor tomonidan).
3.5. Transport va yetkazib berish xarajatlari: {{TRANSPORT_XARAJAT}} (Sotuvchi/Xaridor zimmasida, Spesifikatsiyaga ko'ra).
3.6. Tovarni tushirish ishlari, agar shartnomada boshqacha kelishilmagan bo'lsa, Xaridor zimmasida va uning hisobidan amalga oshiriladi.
3.7. Tovar yo'lda buzilmasligi va sifatini saqlashi uchun Sotuvchi mos qadoq, sertifikatlangan transport va sharoitlardan foydalanadi.

4. MULK HUQUQI VA TASODIFIY YO'QOTISH XAVFI

4.1. Tovarga mulk huquqi va tasodifiy yo'qotish xavfi Tovar Xaridorga (yoki uning vakiliga) topshirilgan paytdan o'tadi (FK 187, 423-moddalar).
4.2. Yetkazib berish manzilida Tovar topshirilishi qabul-topshirish dalolatnomasi (TTN — yuk xati va sifat sertifikati bilan birga) imzolanishi orqali rasmiylashtiriladi.

5. QABUL QILISH VA NUQSONLAR

5.1. Xaridor Tovarni qabul qilish vaqtida miqdor (yuk xati va Spesifikatsiya bo'yicha) va tashqi belgilarini (qadoq holati, vizual nuqsonlar) tekshiradi.
5.2. Aniq nuqsonlar aniqlangan taqdirda, Xaridor TTN'ga eslatma qo'yadi va Sotuvchini darhol yozma ravishda xabardor qiladi.
5.3. Yashirin nuqsonlar (sement sifatining pastligi, armatura mexanik xususiyatlari va h.k.) Tovar topshirilgan kundan boshlab 14 (o'n to'rt) kalendar kun ichida yozma da'vo (pretenziya) bilan bildirilishi mumkin (FK 462-modda). Texnik xulosa zarur bo'lsa, mustaqil ekspert jalb qilinadi (xarajat aybdor Tomonga yuklanadi).
5.4. Sifatsiz Tovar aniqlangan holda Xaridor o'z xohishiga ko'ra quyidagilardan birini talab qilish huquqiga ega (FK 467-modda):
    — narxni mutanosib kamaytirish;
    — nuqsonlarni o'rinli muddatda bepul bartaraf etish;
    — sifatsiz Tovarni 7 (yetti) kalendar kun ichida shartnoma talablariga mos Tovarga almashtirish;
    — shartnomadan voz kechib, to'langan summani qaytarish.

6. KAFOLAT

6.1. Sotuvchi har bir Tovar partiyasi uchun ishlab chiqaruvchi tomonidan belgilangan kafolat muddatini saqlaydi va sifat sertifikati orqali tasdiqlaydi.
6.2. Sement, armatura va shu kabi muddatga sezgir materiallar uchun saqlash sharoitlari va saqlash muddati Spesifikatsiyada ko'rsatiladi.
6.3. Sotuvchi Tovarning uchinchi shaxslar huquqlaridan xoli ekanligini kafolatlaydi.

7. TOMONLARNING HUQUQ VA MAJBURIYATLARI

7.1. Sotuvchi majburdir:
    — Tovarni Spesifikatsiyaga muvofiq miqdor, sifat va muddatda yetkazib berish;
    — Sifat sertifikati va boshqa zarur hujjatlarni taqdim etish;
    — Mos qadoq va transport sharoitlarini ta'minlash.

7.2. Sotuvchi huquqi bor:
    — Tovar narxini o'z vaqtida olish;
    — To'lov 14 (o'n to'rt) kun va undan ko'p kechiktirilsa, keyingi yetkazib berishni to'xtatib turish (FK 333-modda).

7.3. Xaridor majburdir:
    — Tovarni shartnoma shartlariga muvofiq qabul qilish;
    — Tovar narxini belgilangan muddatda to'lash (FK 458-modda);
    — Tushirish ishlarini o'z vaqtida tashkil qilish.

7.4. Xaridor huquqi bor:
    — Sifatli va muvofiq Tovar olish;
    — Nuqsonli Tovar uchun FK 467-moddada nazarda tutilgan choralarni qo'llash;
    — Tovarning kelishi haqida oldindan xabardor qilinish.

8. JAVOBGARLIK

8.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va shartnomaga muvofiq javobgar bo'ladilar.
8.2. Tovar yetkazib berish kechiktirilgan har bir kun uchun Sotuvchi Xaridorga kechiktirilgan partiya summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.3. To'lov kechiktirilgan har bir kun uchun Xaridor Sotuvchiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
8.5. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi.

9. FORS-MAJOR

9.1. Tomonlar majburiyatlarini bajara olmaslik uchun, agar bu fors-major (yengib bo'lmaydigan kuchlar) — tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari, transport infratuzilmasidagi global uzilishlar natijasida sodir bo'lgan bo'lsa, javobgarlikdan ozod etiladilar.
9.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
9.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
9.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

10. SHARTNOMANI BEKOR QILISH

10.1. Shartnoma quyidagi hollarda bekor qilinadi (FK 379, 384-moddalar):
    — Tomonlarning yozma kelishuvi bilan;
    — Boshqa Tomon shartnoma shartlarini muhim darajada buzganda — sud tartibida;
    — Qonunchilikda nazarda tutilgan boshqa hollarda.
10.2. Shartnoma muhim darajada buzilgan deb hisoblanadi: Tovarni 30 (o'ttiz) kun va undan ko'p kechiktirib yetkazib berish, sifatsiz Tovarni takroran yetkazib berish, to'lovni ketma-ket 30 kun va undan ko'p kechiktirish.
10.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
11.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

12. MAXFIYLIK, ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

12.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri va biznes ma'lumotlarini uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.
12.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
12.3. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.

13. UMUMIY QOIDALAR

13.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
13.2. Aloqa rekvizitlari: Sotuvchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Xaridor — {{CP_EMAIL}}, {{CP_TELEFON}}.
13.3. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
13.4. Shartnoma imzolangan kundan kuchga kiradi va Tomonlar majburiyatlarini to'liq bajargunga qadar amal qiladi. Umumiy amal qilish muddati: {{MUDDAT}}.
13.5. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

SOTUVCHI:                                       XARIDOR:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  // ─── IT / TEXNOLOGIYA ──────────────────────────────────────
  {
    id: 'it-saas',
    industry: 'it',
    industryIcon: '💻',
    name:   "SaaS / dasturiy ta'minot xizmati",
    nameOz: 'SaaS / дастурий таъминот хизмати',
    nameRu: 'SaaS / Программное обеспечение как услуга',
    description:   "Bulutli xizmat ko'rsatish (oylik yoki yillik obuna)",
    descriptionOz: "Булутли хизмат кўрсатиш (ойлик ёки йиллик обуна)",
    descriptionRu: 'Облачные услуги (ежемесячная или годовая подписка)',
    contractType: 'XIZMAT',
    tags: ['saas', "dasturiy ta'minot", 'bulut', 'obuna'],
    content: `DASTURIY TA'MINOT XIZMATI SHARTNOMASI (SaaS)

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Provayder"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Mijoz"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksi 703–720-moddalari va "Axborotlashtirish to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Provayder Mijozga {{XIZMAT_NOMI}} bulutli dasturiy ta'minotidan (keyingi o'rinlarda — "Xizmat") obuna asosida foydalanish huquqini taqdim etadi (SaaS — Software as a Service modeli).
1.2. Xizmat URL: {{XIZMAT_URL}}.
1.3. Bir vaqtda foydalanish mumkin bo'lgan foydalanuvchilar soni: {{FOYDALANUVCHILAR}}.
1.4. Tarif rejasi va imkoniyatlar ro'yxati shartnomaga ilova qilinadi (1-ilova).
1.5. Xizmat 24/7 rejimida ishlaydi (rejalashtirilgan texnik ishlar bundan mustasno — Mijoz oldindan kamida 24 soat avval xabardor qilinadi).

2. NARX VA TO'LOV TARTIBI

2.1. Oylik obuna haqi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}, har bir billing davri uchun avans tarzida.
2.3. Birinchi to'lov shartnoma imzolangandan keyin 5 (besh) ish kuni ichida amalga oshiriladi.
2.4. Provayder yiliga 1 (bir) marta tarif bahosini ko'tarish huquqiga ega; ko'tarilish miqdori inflyatsiya darajasidan oshmasligi va Mijozni 60 (oltmish) kalendar kun oldin yozma xabardor qilish kerak. Bunday holatda Mijoz shartnomadan voz kechish huquqiga ega.
2.5. To'lov kechiktirilgan har bir kun uchun {{PENYA_FOIZ}}% penya undiriladi (FK 326-modda — penya summasi shartnoma summasidan oshmaydi).

3. SLA — XIZMAT KAFOLATLARI (Service Level Agreement)

3.1. Xizmatning ishlash vaqti (uptime): kalendar oyda kamida 99.5% (oyiga maks. ~3.6 soat rejasiz to'xtash).
3.2. Rejalashtirilgan texnik ishlar uptime hisobidan chiqariladi.
3.3. Texnik yordam vaqti: ish kunlari 09:00–18:00 ({{VAQT_ZONASI}}, masalan: UTC+5 Toshkent).
3.4. Kritik incidentlar (xizmat to'liq to'xtagan) — 4 soat ichida boshlangan reaksiya.
3.5. Yuqori darajadagi incidentlar (ayrim funksiyalar ishlamayotgan) — 8 soat ichida.
3.6. Oddiy incidentlar — keyingi ish kunining oxirigacha.
3.7. Agar oylik uptime 99.5% dan past bo'lsa, Mijoz keyingi oy uchun mutanosib chegirma olish huquqiga ega: 99–99.5% — 10%, 95–99% — 25%, 95% dan past — 50%.

4. MA'LUMOTLAR XAVFSIZLIGI VA SHAXSIY MA'LUMOTLAR

4.1. Mijoz ma'lumotlari saqlanish va uzatish vaqtida shifrlanadi (TLS 1.2+ va AES-256 yoki shu darajadagi standartlar).
4.2. Provayder kuniga kamida 1 (bir) marta avtomatik backup amalga oshiradi va kamida 30 (o'ttiz) kun davomida saqlaydi.
4.3. Mijoz ma'lumotlari Mijozning intellektual mulki hisoblanadi. Provayder ulardan faqat Xizmatni ko'rsatish maqsadida foydalanadi.
4.4. Provayder Mijoz ma'lumotlarini uchinchi shaxslarga sotmaydi va marketing maqsadlarida ishlatmaydi.
4.5. Tomonlar O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuni (547-XII-son) talablariga rioya qiladilar. Mijozdan kelgan shaxsiy ma'lumotlar O'zbekiston Respublikasi hududidagi serverlarda saqlanadi (qonun talab qilgan hollarda).
4.6. Ma'lumotlarning sizib chiqishi (data breach) aniqlangan zahoti Provayder Mijozni 72 (yetmish ikki) soat ichida xabardor qiladi va sodir bo'lgan voqea, sabab va qabul qilingan choralar haqida hisobot beradi.
4.7. Shartnoma tugagandan keyin Provayder Mijoz ma'lumotlarini 30 (o'ttiz) kun davomida saqlaydi (Mijoz eksport qilishi uchun), keyin esa qaytarib bo'lmas tarzda yo'q qiladi va yozma tasdiq beradi.

5. INTELLEKTUAL MULK

5.1. Xizmatga oid barcha intellektual mulk huquqlari (kod, dizayn, brendlar, tovar belgilari) Provayderda saqlanadi.
5.2. Mijoz Xizmatdan foydalanish huquqini oladi, ammo uni nusxalash, qayta sotish, dekompilyatsiya yoki teskari injiniring qilish huquqiga ega emas.
5.3. Mijoz tomonidan Xizmatga yuklangan ma'lumotlar va kontent Mijozning intellektual mulki bo'lib qoladi.

6. TOMONLAR MAJBURIYATLARI

6.1. Provayder majburdir:
    — Xizmatni shartnoma va SLA shartlariga muvofiq ko'rsatish;
    — Texnik yordam taqdim etish;
    — Xavfsizlik standartlarini saqlash va monitoring olib borish;
    — Mijozni rejalashtirilgan texnik ishlar haqida oldindan xabardor qilish.

6.2. Mijoz majburdir:
    — Obuna haqini o'z vaqtida to'lash;
    — Login va parolni yashirin saqlash;
    — Xizmatni qonuniy maqsadlarda ishlatish va xavfsizlik talablariga rioya qilish;
    — O'z foydalanuvchilarining harakatlari uchun javobgar bo'lish.

6.3. Mijoz Xizmatda quyidagilarni qilishga huquqi yo'q:
    — qonunga zid kontent saqlash;
    — Xizmatga DDoS yoki shu kabi hujumlar amalga oshirish;
    — boshqa foydalanuvchilarning ma'lumotlariga ruxsatsiz kirishga harakat qilish;
    — Xizmatni qayta sotish yoki uchinchi shaxslarga taqdim etish (sublicensing) — Provayderning yozma roziligisiz.

7. JAVOBGARLIK VA CHEKLOVLAR

7.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va shartnomaga muvofiq javobgar bo'ladilar.
7.2. Provayderning umumiy javobgarligi har qanday holatda Mijoz tomonidan oxirgi 12 (o'n ikki) oyda to'langan summa bilan cheklanadi.
7.3. Provayder bilvosita zararlar (foyda yo'qotilishi, biznes uzilishi, ma'lumot yo'qotishi natijasida kelib chiqqan oqibatli zararlar) uchun javobgar emas, agar bu Provayderning qo'pol e'tiborsizligi yoki qasddan harakatidan kelib chiqmagan bo'lsa.
7.4. Mijoz Provayder qo'shimcha xizmatlar talab qilgan, lekin yozma kelishuv tuzilmagan bo'lsa, ular uchun haq talab qila olmaydi.

8. XIZMATNI TO'XTATIB TURISH

8.1. Provayder quyidagi hollarda Xizmatni to'xtatib turish huquqiga ega (Mijozni xabardor qilgan holda):
    — to'lov 14 (o'n to'rt) kun va undan ko'p kechiktirilganda;
    — Mijoz xavfsizlik qoidalarini buzganda;
    — sud yoki davlat organi qarori bilan.

8.2. To'xtatish davrida Mijoz to'lovdan ozod etilmaydi, agar to'xtatish Provayderning aybi bilan bo'lmagan bo'lsa.

9. FORS-MAJOR

9.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari, internet provayderlari sabab bo'lgan global uzilishlar) majburiyatlarini bajarmaslik uchun javobgarlikdan ozod etiladilar.
9.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
9.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.

10. NDA VA MAXFIYLIK

10.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
10.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.

11. SHARTNOMANI BEKOR QILISH

11.1. Shartnoma {{MUDDAT}} muddatga tuziladi va avtomatik yangilanadi, agar Tomonlardan biri muddat tugashidan 30 (o'ttiz) kun oldin yozma ravishda yangilamaslik haqida xabardor qilmagan bo'lsa.
11.2. Har bir Tomon shartnomadan voz kechish huquqiga ega, agar boshqa Tomon muhim shartlarni buzsa va bunday buzilish 30 (o'ttiz) kalendar kun ichida bartaraf etilmasa.
11.3. Bir tomonlama shartnomadan voz kechish to'g'risidagi yozma xabarnoma 30 (o'ttiz) kalendar kun oldin yuborilishi shart.

12. NIZOLARNI HAL QILISH

12.1. Tomonlar barcha nizolarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
12.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
12.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

13. ANTIKORRUPTSIYA, ALOQA VA UMUMIY QOIDALAR

13.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
13.2. Aloqa rekvizitlari: Provayder — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Mijoz — {{CP_EMAIL}}, {{CP_TELEFON}}.
13.3. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
13.4. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
13.5. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

PROVAYDER:                                      MIJOZ:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  {
    id: 'it-development',
    industry: 'it',
    industryIcon: '💻',
    name:   "Dasturiy ta'minot ishlab chiqish",
    nameOz: 'Дастурий таъминот ишлаб чиқиш',
    nameRu: 'Разработка программного обеспечения',
    description:   'Web sayt, mobil ilova yoki maxsus dastur yaratish',
    descriptionOz: 'Веб сайт, мобиль илова ёки махсус дастур яратиш',
    descriptionRu: 'Создание сайта, мобильного приложения или специального ПО',
    contractType: 'PUDRAT',
    tags: ['development', 'web', 'mobile', 'ilova', 'sayt'],
    content: `DASTURIY TA'MINOT ISHLAB CHIQISH SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Ishlab chiquvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 631–704-moddalari va "Mualliflik huquqi va turdosh huquqlar to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ishlab chiquvchi Buyurtmachining topshirig'iga binoan ushbu shartnoma va Texnik topshiriq (TT, 1-ilova) asosida quyidagi dasturiy mahsulotni (keyingi o'rinlarda — "Mahsulot") yaratish va Buyurtmachiga topshirish majburiyatini oladi (FK 666-modda).
1.2. Mahsulot turi va tavsifi: {{MAHSULOT_TAVSIFI}} (web sayt, mobil ilova, korporativ tizim, API va h.k.).
1.3. Mahsulot platformalari va texnologiyalari: {{TEXNOLOGIYALAR}}.
1.4. Texnik topshiriq Tomonlar tomonidan yozma kelishilgan va shartnomaga ajralmas ilova qilingan hujjat bo'lib, unda funksiyalar ro'yxati, dizayn talablari, integratsiyalar, samaradorlik va xavfsizlik standartlari belgilanadi.
1.5. Mahsulot Buyurtmachi uchun maxsus yaratiladi (work-for-hire); standart kutubxonalar va ochiq manba (open-source) komponentlari bundan mustasno.

2. NARX VA TO'LOV BOSQICHLARI

2.1. Loyihaning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. Narx fix-price asosida belgilanadi va shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. To'lov bosqichlari (milestone-based):
    — 30% (avans) — shartnoma imzolanganidan keyin 5 ish kuni ichida (kickoff);
    — 40% (oraliq) — birinchi ishchi prototip (alpha/MVP) taqdim etilib, oraliq qabul-topshirish dalolatnomasi imzolangandan keyin 10 ish kuni ichida;
    — 30% (yakuniy) — yakuniy qabul-topshirish dalolatnomasi imzolangandan keyin 10 ish kuni ichida.
2.4. Texnik topshiriqdan tashqari qo'shimcha funksiyalar (change requests) Buyurtmachining yozma roziligi bilan, alohida byudjet va muddat asosida bajariladi (FK 670-modda).
2.5. To'lov bank ko'chirmasi orqali Ishlab chiquvchining hisob raqamiga amalga oshiriladi.

3. ISH BOSQICHLARI VA MUDDATLAR

3.1. 1-bosqich — Tahlil va dizayn (UX/UI mockuplar, ma'lumotlar bazasi sxemasi, arxitektura): {{BOSQICH_1}} ish kuni.
3.2. 2-bosqich — Ishlab chiqish (frontend, backend, integratsiyalar, kod yozish): {{BOSQICH_2}} ish kuni.
3.3. 3-bosqich — Test va deploy (QA, bug-fix, ishga tushirish, hujjatlashtirish): {{BOSQICH_3}} ish kuni.
3.4. Umumiy muddat: {{UMUMIY_MUDDAT}} ish kuni, boshlanish — {{BOSHLANISH}}, tugallanish — {{TUGALLANISH}}.
3.5. Buyurtmachining kechiktirilgan fikr-mulohazalari (feedback) yoki TT o'zgarishlari muddatlarni mutanosib uzaytirishi mumkin.

4. INTELLEKTUAL MULK HUQUQLARI

4.1. Yakuniy to'lov to'liq amalga oshirilgan paytdan boshlab Mahsulotga oid mualliflik huquqlari (manba kod, dizayn fayllar, hujjatlar, ma'lumotlar bazasi sxemasi) va mulkiy huquqlar (foydalanish, nusxalash, modifikatsiyalash, tarqatish) Buyurtmachiga to'liq o'tkaziladi (mualliflik huquqi to'g'risidagi qonun, FK 1098-modda).
4.2. Ishlab chiquvchi yakuniy to'lov amalga oshirilganidan keyin manba kodni (source code), unga taalluqli barcha hujjatlarni va ishlab chiqarish muhitidan ko'chirish (handoff) materiallarini Buyurtmachiga topshiradi.
4.3. Ochiq manba (open-source) kutubxonalar va uchinchi tomon kompenentlariga oid huquqlar tegishli litsenziyalarda saqlanadi. Ishlab chiquvchi Buyurtmachiga ishlatilgan barcha open-source komponentlar va litsenziyalari ro'yxatini taqdim etadi.
4.4. Ishlab chiquvchi yaratilgan kodni boshqa loyihalarga qayta ishlatishi mumkin emas, agar bu Buyurtmachining maxfiy biznes-mantiqini yoki maxsus yechimlarini o'z ichiga olsa.
4.5. Ishlab chiquvchi yaratilgan Mahsulotning Buyurtmachining yoki uchinchi shaxslarning intellektual mulk huquqlarini buzmasligini kafolatlaydi.

5. KAFOLAT VA QO'LLAB-QUVVATLASH

5.1. Ishlab chiquvchi Mahsulotga 6 (olti) oy kafolat beradi. Kafolat muddati yakuniy qabul-topshirish dalolatnomasi imzolangan kundan boshlanadi (FK 694-modda).
5.2. Kafolat muddati ichida aniqlangan xatolar (bug) Ishlab chiquvchining hisobidan tuzatiladi:
    — kritik xatolar (Mahsulot ishlamayotgan) — 24 soat ichida boshlangan reaksiya;
    — yuqori darajadagi xatolar — 3 ish kuni ichida tuzatish;
    — oddiy xatolar — keyingi planli release davrida.
5.3. Kafolat quyidagilarga taalluqli emas:
    — Buyurtmachi yoki uchinchi shaxs tomonidan o'zgartirilgan yoki noto'g'ri ishlatilgan kod;
    — uchinchi tomon servislaridagi (API, hosting) uzilishlar;
    — TT da nazarda tutilmagan yangi funksiyalarga so'rovlar.
5.4. Yashirin nuqsonlar uchun Ishlab chiquvchining javobgarligi qabul qilingandan keyin 2 (ikki) yil davomida saqlanadi (FK 695-modda).

6. QABUL QILISH TARTIBI

6.1. Har bir bosqich tugagach, Ishlab chiquvchi Buyurtmachiga Mahsulotni va Qabul-topshirish dalolatnomasini taqdim etadi.
6.2. Buyurtmachi 10 (o'n) ish kuni ichida Mahsulotni TT ga muvofiqligini tekshiradi va aktni imzolaydi yoki yozma asoslangan e'tirozlarini bildiradi.
6.3. Buyurtmachi belgilangan muddatda javob bermasa, Mahsulot to'liq qabul qilingan hisoblanadi (FK 690-modda).
6.4. E'tirozlar asosli bo'lsa, Ishlab chiquvchi belgilangan kamchiliklarni o'z hisobidan, kelishilgan muddatda bartaraf etadi.

7. TOMONLARNING HUQUQ VA MAJBURIYATLARI

7.1. Ishlab chiquvchi majburdir:
    — Mahsulotni TT va shartnoma talablariga muvofiq, kelishilgan muddatda bajarish;
    — Sifatli kod yozish, sanoat standartlariga rioya qilish;
    — Buyurtmachiga oraliq hisobotlar berish (sprint demolari, weekly progress reports);
    — Manba kodni va hujjatlarni Buyurtmachiga topshirish.

7.2. Buyurtmachi majburdir:
    — To'lovlarni shartnoma muddatlarida amalga oshirish;
    — TT va kerakli ma'lumotlarni o'z vaqtida taqdim etish;
    — Bosqichlarni o'z vaqtida ko'rib chiqish va imzolash.

8. JAVOBGARLIK

8.1. Mahsulot muddatdan kechiktirilgan har bir kun uchun Ishlab chiquvchi Buyurtmachiga shartnoma summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.2. To'lov kechiktirilgan har bir kun uchun Buyurtmachi Ishlab chiquvchiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
8.4. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi.
8.5. Ishlab chiquvchining umumiy javobgarligi har qanday holatda ushbu shartnoma summasi bilan cheklanadi (Ishlab chiquvchining qo'pol e'tiborsizligi yoki qasddan harakatidan kelib chiqqan zarar bundan mustasno).

9. MAXFIYLIK

9.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri, biznes ma'lumotlar, manba kod, dizayn va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
9.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 5 (besh) yil davomida amal qiladi.
9.3. Buyurtmachi Mahsulotni Ishlab chiquvchining portfeliosida ishora sifatida ishlatishga rozilik beradi (yashirin maxfiy ma'lumotlardan tashqari), agar yozma rad etilmagan bo'lsa.

10. SHAXSIY MA'LUMOTLAR

10.1. Mahsulot foydalanuvchi shaxsiy ma'lumotlarini qayta ishlasa, Tomonlar O'zbekiston Respublikasining "Shaxsga doir ma'lumotlar to'g'risida"gi qonuni (547-XII-son) talablariga rioya qiladilar.
10.2. Ishlab chiquvchi shaxsiy ma'lumotlarni xavfsiz qayta ishlash uchun zarur shifrlash, kirish nazorati va backup mexanizmlarini joriy qiladi.

11. FORS-MAJOR

11.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari) javobgarlikdan ozod etiladilar.
11.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
11.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
11.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

12. SHARTNOMANI BEKOR QILISH

12.1. Buyurtmachi shartnomadan istalgan vaqtda voz kechishi mumkin, ammo Ishlab chiquvchiga bu paytgacha haqiqatan bajarilgan ish uchun haq to'lashi va aniq zararlarni qoplashi shart (FK 715-modda).
12.2. Ishlab chiquvchi shartnomadan voz kechishi mumkin, agar Buyurtmachi muhim shartlarni buzsa (to'lovni 30 kun va undan ko'p kechiktirsa, TT yoki kerakli ma'lumotlarni taqdim etmasa).
12.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

13. NIZOLARNI HAL QILISH

13.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
13.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
13.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.
13.4. Murakkab texnik nizolarda mustaqil texnik ekspert jalb qilinadi (xarajatlar aybdor Tomonga yuklanadi).

14. UMUMIY QOIDALAR

14.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
14.2. Aloqa rekvizitlari: Ishlab chiquvchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Buyurtmachi — {{CP_EMAIL}}, {{CP_TELEFON}}.
14.3. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
14.4. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
14.5. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

15. TOMONLARNING REKVIZITLARI VA IMZOLARI

ISHLAB CHIQUVCHI:                               BUYURTMACHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  {
    id: 'it-nda',
    industry: 'it',
    industryIcon: '💻',
    name:   'NDA (Maxfiylik shartnomasi)',
    nameOz: 'НДА (Махфийлик шартномаси)',
    nameRu: 'NDA (Соглашение о неразглашении)',
    description:   "Tijorat sirini saqlash bo'yicha o'zaro shartnoma",
    descriptionOz: "Тижорат сирини сақлаш бўйича ўзаро шартнома",
    descriptionRu: 'Взаимное соглашение о сохранении коммерческой тайны',
    contractType: 'BOSHQA',
    tags: ['nda', 'maxfiylik', 'tijorat siri', 'confidentiality'],
    content: `MAXFIYLIK SHARTNOMASI (NON-DISCLOSURE AGREEMENT, NDA)

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Tomon-1"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Tomon-2"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksi va "Tijorat siri to'g'risida"gi qonun (910-XII-son) talablariga muvofiq quyidagi shartnomani (keyingi o'rinlarda — "NDA") tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Tomonlar muzokaralar, hamkorlik, ish bo'yicha kelishuv va boshqa o'zaro aloqalar jarayonida bir-biriga taqdim etadigan har qanday Maxfiy ma'lumotning maxfiyligini ta'minlash majburiyatini oladi.
1.2. NDA quyidagi maqsadda tuziladi: {{NDA_MAQSAD}} (keyingi o'rinlarda — "Maqsad").
1.3. NDA o'zaro hisoblanadi: har bir Tomon ham Oshkor qiluvchi (Disclosing Party), ham Qabul qiluvchi (Receiving Party) sifatida ishtirok etishi mumkin.

2. MAXFIY MA'LUMOT TUSHUNCHASI

2.1. "Maxfiy ma'lumot" — yozma, og'zaki, elektron yoki boshqa shaklda taqdim etilgan, savdo qiymatiga ega bo'lgan va Oshkor qiluvchi Tomon tomonidan maxfiy deb belgilangan har qanday ma'lumot, jumladan, lekin ular bilan cheklanmagan holda:
    — moliyaviy ma'lumotlar (balans, daromad, xarajatlar, narx-naqsh, byudjetlar);
    — mijozlar va kontragentlar ro'yxati va ular haqidagi ma'lumotlar;
    — biznes-rejalar, marketing strategiyalari, sotuv prognozlari;
    — texnologik ishlanmalar, manba kodi (source code), algoritmlar, ma'lumotlar bazasi tuzilmalari, intellektual mulk obyektlari;
    — texnik hujjatlar, ixtirochilik, foydali model va boshqa intellektual mulk obyektlari;
    — xodimlar va ish haqi haqidagi shaxsiy ma'lumotlar;
    — boshqaruv qarorlari va ichki yo'riqnomalar;
    — "MAXFIY" yoki "CONFIDENTIAL" deb belgilangan har qanday boshqa ma'lumot.

2.2. Og'zaki taqdim etilgan ma'lumot ham, agar Oshkor qiluvchi Tomon uni 14 (o'n to'rt) kalendar kun ichida yozma ravishda tasdiqlasa, Maxfiy ma'lumot hisoblanadi.

3. QABUL QILUVCHI TOMON MAJBURIYATLARI

3.1. Qabul qiluvchi Tomon Maxfiy ma'lumotni:
    — faqat Maqsadda foydalanadi va boshqa hech qanday maqsadda ishlatmaydi;
    — Oshkor qiluvchi Tomonning yozma roziligisiz uchinchi shaxslarga oshkor qilmaydi yoki uzatmaydi;
    — kamida o'zining shu darajadagi maxfiy ma'lumotlariga ko'rsatadigan e'tibor darajasida himoya qiladi (lekin har holda — oqilona darajadan kam emas);
    — faqat Maqsad bilan bog'liq bo'lgan o'z xodimlari yoki maslahatchilariga, ular maxfiylik majburiyatlarini olgan holda taqdim etadi va ular harakatlari uchun to'liq javobgar bo'ladi.

3.2. Qabul qiluvchi Tomon Maxfiy ma'lumotning ruxsatsiz ishlatilishi yoki oshkor qilinishi haqida bilgan zahoti Oshkor qiluvchi Tomonni 3 (uch) ish kuni ichida yozma ravishda xabardor qilishga majburdir.

3.3. NDA tugaganda yoki Oshkor qiluvchi Tomon yozma talab qilganda, Qabul qiluvchi Tomon barcha Maxfiy ma'lumotlarni (jumladan nusxa, qayd va elektron fayllar) 10 (o'n) ish kuni ichida qaytarib beradi yoki Oshkor qiluvchi Tomonning yozma ko'rsatmasi asosida yo'q qiladi va yo'q qilingani haqida yozma tasdiq taqdim etadi.

4. ISTISNOLAR

4.1. Quyidagi ma'lumotlar Maxfiy hisoblanmaydi:
    — Qabul qiluvchi Tomonning aybisiz ommaviy bo'lib qolgan ma'lumotlar;
    — Qabul qiluvchi Tomon NDA tuzilgunga qadar mustaqil ravishda biladigan, tegishli yozma isboti bilan tasdiqlangan ma'lumotlar;
    — Maxfiy ma'lumotsiz mustaqil ravishda yaratilgan ma'lumotlar (clean-room development);
    — uchinchi shaxs tomonidan qonuniy asosda olingan, maxfiylik majburiyatisiz taqdim etilgan ma'lumotlar.

4.2. Qabul qiluvchi Tomon qonun talabi yoki sud, prokuratura, soliq yoki boshqa vakolatli organ qarori asosida Maxfiy ma'lumotni oshkor qilishga majbur bo'lsa, bunday talab haqida darhol Oshkor qiluvchi Tomonni xabardor qiladi (qonun ruxsat bergan holda) va oshkor qilish doirasini minimal hajm bilan cheklashga harakat qiladi.

5. INTELLEKTUAL MULK

5.1. NDA Maxfiy ma'lumotga oid intellektual mulk huquqlarini Qabul qiluvchi Tomonga o'tkazmaydi. Barcha huquqlar Oshkor qiluvchi Tomonda saqlanib qoladi.
5.2. Qabul qiluvchi Tomon Maxfiy ma'lumotga asoslangan asar, texnologiya yoki ishlanma yarata olmaydi, bunda alohida yozma kelishuv tuzilmagan bo'lsa.

6. JAVOBGARLIK VA NEUSTOYKA

6.1. Maxfiylik majburiyatini buzgan Tomon Oshkor qiluvchi Tomonga yetkazilgan haqiqiy zararni to'liq qoplaydi.
6.2. Maxfiylik buzilganligi har bir holati uchun aybdor Tomon Oshkor qiluvchi Tomonga {{NEUSTOYKA_SUMMA}} so'm miqdorida neustoyka to'laydi. Neustoyka summasi ushbu shartnoma summasi yoki konkret zararni isbotlashga to'sqinlik qilmaydi.
6.3. Neustoyka, jarima va ustamaning umumiy summasi haqiqiy zarardan kam bo'lganda, qoldiq qism alohida undiriladi (FK 326-modda).

7. NDA MUDDATI VA QONUNGA RIOYA

7.1. NDA imzolangan kundan kuchga kiradi va {{MUDDAT}} davomida amal qiladi.
7.2. NDA tugaganidan yoki bekor qilinganidan keyin ham maxfiylik majburiyati 5 (besh) yil davomida saqlanadi. Tijorat sirini tashkil qiladigan ma'lumotlar uchun esa — uning maxfiylik xususiyati saqlanib turgan davrda.
7.3. Tomonlar O'zbekiston Respublikasining "Tijorat siri to'g'risida"gi qonuni va "Shaxsga doir ma'lumotlar to'g'risida"gi qonun (547-XII-son) talablariga rioya qilish majburiyatini oladilar.

8. FORS-MAJOR

8.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, davlat organlarining oldindan ko'zda tutilmagan qarorlari) NDA majburiyatlarini bajarmaslik uchun, bunday holatlar maxfiy ma'lumotni oshkor qilishga olib kelgan bo'lmasa, javobgarlikdan ozod etiladilar.

9. NIZOLARNI HAL QILISH

9.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo tartibida hal qilishga harakat qiladilar.
9.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
9.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.
9.4. Maxfiylik buzilishini oldini olish uchun Oshkor qiluvchi Tomon sud orqali jiddiy oraliq chora (jumladan ta'qiqlovchi qaror) talab qilish huquqiga ega.

10. UMUMIY QOIDALAR

10.1. NDA ga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
10.2. NDA ning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
10.3. Aloqa rekvizitlari: Tomon-1 — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Tomon-2 — {{CP_EMAIL}}, {{CP_TELEFON}}.
10.4. NDA 2 (ikki) bir xil yuridik kuchga ega nusxada, har bir Tomon uchun bittadan, davlat tilida tuzildi.
10.5. NDA da nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

11. TOMONLARNING REKVIZITLARI VA IMZOLARI

TOMON-1:                                        TOMON-2:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  // ─── SAVDO ────────────────────────────────────────────────
  {
    id: 'savdo-dilership',
    industry: 'savdo',
    industryIcon: '🛒',
    name:   "Dilerlik (mahsulot tarqatish) shartnomasi",
    nameOz: 'Дилерлик (маҳсулот тарқатиш) шартномаси',
    nameRu: 'Дилерский договор (распространение продукции)',
    description:   "Mahsulotni hududda eksklyuziv yoki noeksklyuziv sotish",
    descriptionOz: "Маҳсулотни ҳудудда эксклюзив ёки ноэксклюзив сотиш",
    descriptionRu: 'Эксклюзивная или неэксклюзивная продажа продукции в регионе',
    contractType: 'AGENTLIK',
    tags: ['dilership', 'tarqatish', 'distribution'],
    content: `DILERLIK (TARQATISH) SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Yetkazib beruvchi" yoki "Ishlab chiqaruvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Diler"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 414–505 va 829–849-moddalari, "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi qonun va "Raqobat to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Yetkazib beruvchi Dilerga ushbu shartnoma asosida {{HUDUD}} hududida (keyingi o'rinlarda — "Hudud") {{MAHSULOT}} mahsulotini (keyingi o'rinlarda — "Mahsulot") tarqatish va sotish huquqini beradi, Diler esa Mahsulotni o'z hisobidan sotib olib, Hududda Yetkazib beruvchi tomonidan tasdiqlangan brend standartlariga muvofiq sotadi.
1.2. Dilerlik turi: {{DILERLIK_TURI}}:
    — Eksklyuziv: Yetkazib beruvchi Hududda boshqa dilerga huquq bermaydi va o'zi ham to'g'ridan-to'g'ri sotmaydi;
    — Noeksklyuziv (oddiy): Yetkazib beruvchi Hududda boshqa dilerlarga ham huquq berishi mumkin.
1.3. Diler Mahsulotni o'z nomidan va o'z hisobidan sotadi (savdo dilerligi). Diler Yetkazib beruvchining vakili sifatida emas, mustaqil yuridik shaxs sifatida ish yuritadi.
1.4. Mahsulotning to'liq ro'yxati, narxi va chegirma stavkalari shartnomaga ilova qilingan Spesifikatsiyada (1-ilova) belgilanadi.

2. NARX, CHEGIRMA VA TO'LOV

2.1. Yetkazib beruvchi Dilerga e'lon qilingan ulgurji narxlardan {{CHEGIRMA}}% chegirma beradi (diler chegirmasi).
2.2. Yetkazib beruvchi tomonidan tavsiya etilgan chakana narxlar (RRP — Recommended Retail Price) Spesifikatsiyada ko'rsatiladi. Diler chakana narxni mustaqil belgilash huquqiga ega ("Raqobat to'g'risida"gi qonunga muvofiq), ammo brendning umumiy bozor strategiyasini buzmaslik tavsiya etiladi.
2.3. Yetkazib beruvchi narxlarni 30 (o'ttiz) kalendar kun oldin yozma xabar bilan o'zgartirish huquqiga ega.
2.4. To'lov tartibi: {{TOLOV_TARTIBI}} (avans, faktura asosida, kechiktirilgan to'lov).
2.5. Diler kechiktirilgan to'lov olgan bo'lsa, har bir kechiktirilgan kun uchun shartnoma summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.

3. YETKAZIB BERISH

3.1. Mahsulot Dilerning yozma buyurtmasi (zayavkasi) olingandan keyin 5 (besh) ish kuni ichida yetkazib beriladi, agar Spesifikatsiyada boshqacha belgilanmagan bo'lsa.
3.2. Yetkazib berish manzili va shartlari (Incoterms 2020 yoki shartnoma asosida): {{YETKAZISH_SHARTLARI}}.
3.3. Mulk huquqi va tasodifiy yo'qotish xavfi Mahsulot Dilerga (yoki uning vakiliga) topshirilgan paytdan o'tadi (FK 187, 423-moddalar).
3.4. Mahsulotning sifati Yetkazib beruvchi tomonidan kafolatlanadi va sifat sertifikati har bir partiya bilan birga taqdim etiladi.

4. DILER MAJBURIYATLARI

4.1. Oyiga kamida {{MIN_HAJM}} so'mlik (yoki {{MIN_DONA}} dona) Mahsulot xarid qilish (minimal sotib olish hajmi).
4.2. Mahsulotni faqat Hududda sotish; Hudud tashqarisida sotuv yoki onlayn savdo orqali boshqa hududlarga uzatish — faqat Yetkazib beruvchining yozma roziligi bilan.
4.3. Brend standartlariga rioya qilish:
    — sotuv joyi tashqi va ichki ko'rinishi;
    — reklama va marketing materiallari (banner, katalog, ijtimoiy tarmoqlardagi e'lonlar);
    — Mahsulotni saqlash va ko'rgazma tartibi;
    — xodimlarning brend trening kursini tugatishi.
4.4. Har oy oxirida (keyingi oyning 5-sanasigacha) sotuv hisobotini taqdim etish: sotilgan Mahsulot miqdori, ombor qoldig'i, mijozlardan kelgan fikr-mulohazalar.
4.5. Mahsulotni qabul qilganda miqdor va sifatni tekshirish; nuqsonlar aniqlangan taqdirda 14 (o'n to'rt) kalendar kun ichida yozma da'vo bildirish.
4.6. Yetkazib beruvchining intellektual mulkini (tovar belgisi, logotip, brend) faqat shartnoma maqsadlarida ishlatish.

5. YETKAZIB BERUVCHI MAJBURIYATLARI

5.1. Mahsulotni Dilerning buyurtmasiga muvofiq yetkazib berish.
5.2. Marketing materiallari (banner, katalog, raqamli kontent) bilan ta'minlash.
5.3. Diler xodimlari uchun mahsulot, sotuv va xizmat ko'rsatish bo'yicha trening (yiliga kamida 1 marta) o'tkazish.
5.4. Sifatsiz Mahsulotlarni almashtirish yoki narxni qaytarish (FK 467-modda).
5.5. Tovar belgisi va brendning huquqiy himoyasini ta'minlash.
5.6. Eksklyuziv dilerlik holatida Hududda boshqa dilerga yoki to'g'ridan-to'g'ri xaridorlarga sotmaslik.

6. KAFOLAT VA NUQSONLI MAHSULOT

6.1. Yetkazib beruvchi Mahsulot uchun ishlab chiqaruvchi kafolatini saqlaydi.
6.2. Diler oxirgi xaridor (iste'molchi)dan kelgan kafolat da'volarini Yetkazib beruvchiga 7 (yetti) ish kuni ichida uzatadi.
6.3. Yetkazib beruvchi sifatsiz Mahsulotni almashtiradi yoki narxni qaytaradi (FK 467-modda).
6.4. Iste'molchilarning huquqlari "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi O'zbekiston Respublikasi qonuniga muvofiq himoya qilinadi.

7. JAVOBGARLIK

7.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va shartnomaga muvofiq javobgar bo'ladilar.
7.2. Mahsulot yetkazib berish kechiktirilgan har bir kun uchun Yetkazib beruvchi Dilerga kechiktirilgan partiya summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
7.3. Diler Mahsulotni Hudud tashqarisida sotsa yoki minimal hajm majburiyatini bajarmasa, Yetkazib beruvchining ko'rgan zarari uchun javobgar bo'ladi.
7.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
7.5. Diler oxirgi xaridorlar oldida o'zining mas'uliyati uchun mustaqil javobgar bo'ladi (Yetkazib beruvchi vakili sifatida emas).

8. INTELLEKTUAL MULK VA BREND

8.1. Yetkazib beruvchining tovar belgisi, logotipi, brend va boshqa intellektual mulk obyektlari uning mulki hisoblanadi.
8.2. Diler bu intellektual mulkni faqat shartnoma maqsadlarida, Yetkazib beruvchining yozma yo'riqnomalariga muvofiq ishlatadi.
8.3. Shartnoma tugagandan keyin Diler 30 (o'ttiz) kalendar kun ichida brendga oid barcha materiallarni (banner, kontent, vizit kartochkalar va h.k.) olib tashlaydi yoki yo'q qiladi.

9. RAQOBAT VA HAMKORLIK CHEKLOVI

9.1. Diler shartnoma davomida raqobatdosh mahsulotlarni (Yetkazib beruvchining mahsulotlari bilan bevosita raqobatlashadigan) sotmaslik majburiyatini oladi (eksklyuziv dilerlik holatida).
9.2. Diler shartnoma tugagandan keyin {{RAQOBAT_CHEKLOVI_OY}} oy davomida bir xil hudud va segmentda raqobatdosh brend dilerligini olishi cheklanadi (raqobat to'g'risidagi qonun talablariga rioya qilingan holda).

10. MAXFIYLIK

10.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri (narx-naqsh, mijozlar bazasi, marketing strategiyalari, savdo statistikasi) ni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
10.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.

11. FORS-MAJOR

11.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari) javobgarlikdan ozod etiladilar.
11.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
11.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
11.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

12. SHARTNOMANI BEKOR QILISH

12.1. Shartnoma 1 (bir) yil muddatga tuziladi va Tomonlar yozma e'tiroz bildirmasa har keyingi yil uchun avtomatik yangilanadi.
12.2. Shartnoma muhim darajada buzilganda — sud tartibida bekor qilinadi (FK 384-modda):
    — Diler minimal hajm majburiyatini ketma-ket 3 (uch) oy bajarmaganda;
    — Diler Hudud tashqarisida sotuvni amalga oshirsa (eksklyuziv holatda);
    — Brend standartlari jiddiy buzilganda;
    — To'lov ketma-ket 30 (o'ttiz) kun va undan ko'p kechiktirilganda.
12.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 60 (oltmish) kalendar kun oldin yuborilishi shart.
12.4. Shartnoma bekor qilingach, Diler ombordagi Mahsulot qoldig'ini Yetkazib beruvchining yozma roziligi bilan 90 (to'qson) kun davomida sotish huquqini saqlaydi.

13. NIZOLARNI HAL QILISH

13.1. Tomonlar barcha nizolarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
13.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
13.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

14. UMUMIY QOIDALAR

14.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
14.2. Tomonlar shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.
14.3. Aloqa rekvizitlari: Yetkazib beruvchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Diler — {{CP_EMAIL}}, {{CP_TELEFON}}.
14.4. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
14.5. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
14.6. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

15. TOMONLARNING REKVIZITLARI VA IMZOLARI

YETKAZIB BERUVCHI:                              DILER:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  // ─── TA'LIM ────────────────────────────────────────────────
  {
    id: 'talim-kurs',
    industry: 'talim',
    industryIcon: '🎓',
    name:   "O'quv kurs xizmati",
    nameOz: 'Ўқув курс хизмати',
    nameRu: 'Услуги обучающих курсов',
    description:   "Til kurslari, IT kurslari, qo'shimcha ta'lim",
    descriptionOz: "Тил курслари, ИТ курслари, қўшимча таълим",
    descriptionRu: 'Языковые курсы, IT-курсы, дополнительное образование',
    contractType: 'XIZMAT',
    tags: ["o'quv", 'kurs', "ta'lim", 'trening'],
    content: `O'QUV KURS XIZMATI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "O'quv markazi" yoki "Ijrochi"), bir tomondan, va {{CP_NOMI}}, pasport: {{CP_PASSPORT}}, JShShIR: {{CP_JSHSHIR}}, manzili: {{CP_MANZIL}} (keyingi o'rinlarda — "Tinglovchi" yoki "Buyurtmachi"), shaxsiy nomidan, ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 703–720-moddalari, "Ta'lim to'g'risida"gi qonun (637-son), "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. O'quv markazi Tinglovchiga ushbu shartnomada belgilangan o'quv xizmatlarini (keyingi o'rinlarda — "Xizmat") ko'rsatadi, Tinglovchi esa Xizmatni qabul qilib, narxini to'lashga majburdir.
1.2. Kurs nomi va yo'nalishi: {{KURS_NOMI}}.
1.3. Kurs darajasi va dasturi: {{KURS_DARAJA}} (boshlang'ich/o'rta/yuqori). Kurs dasturi shartnomaga ilova qilinadi (1-ilova).
1.4. Kurs davomiyligi: {{KURS_DAVOMIYLIGI}} (umumiy soatlar va oylar).
1.5. Darslar haftada {{HAFTA_KUNI}} kun, kuniga {{SOAT}} soatdan o'tkaziladi.
1.6. O'qitish formati: {{FORMAT}} (offline auditoriyada / online platformada / aralash).
1.7. Kurs boshlanish sanasi: {{KURS_BOSHI}}, tugash sanasi: {{KURS_TUGASHI}}.
1.8. Bir guruhdagi tinglovchilar maksimal soni: {{GURUH_HAJMI}}.

2. NARX VA TO'LOV TARTIBI

2.1. Kursning umumiy narxi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}}.
2.2. Narx kurs davomida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. To'lov tartibi: {{TOLOV_TARTIBI}}:
    — bir martalik to'liq to'lov (chegirma bilan);
    — oylik bo'lib to'lash: har oyning 5-sanasigacha {{OYLIK_TOLOV}} so'm.
2.4. To'lov bank ko'chirmasi, plastik karta yoki naqd shaklda amalga oshiriladi.
2.5. Kurs boshlanishidan oldin avans (oldindan to'lov) summasi: {{AVANS}} so'm.

3. O'QUV MARKAZI MAJBURIYATLARI

3.1. Kelishilgan kurs dasturi bo'yicha sifatli ta'lim ko'rsatish:
    — kasbiy malakali o'qituvchilar bilan ta'minlash;
    — zarur o'quv materiallari (kitob, qo'llanma, raqamli resurslar) taqdim etish;
    — kurs davomida progress monitoringi va fikr-mulohaza berish.
3.2. Kurs uchun mos auditoriya sharoitlari (yoritilganlik, asbob-uskuna, sanitariya holati) ta'minlash; online format uchun esa platforma barqarorligini ta'minlash.
3.3. Tinglovchining shaxsiy ma'lumotlarini va o'quv natijalarini maxfiy saqlash.
3.4. Kurs muvaffaqiyatli tugatilganidan keyin (kamida 80% qatnashish va yakuniy testdan muvaffaqiyatli o'tish bilan) sertifikat berish.
3.5. Kursni rejaga muvofiq olib borish; agar O'quv markazi sababi bilan kurs to'xtatilsa, mutanosib pul qaytariladi yoki muqobil dars taklif qilinadi.

4. TINGLOVCHI MAJBURIYATLARI

4.1. Belgilangan jadvalga muvofiq darslarga qatnashish.
4.2. To'lovni o'z vaqtida amalga oshirish (har oyning 5-sanasigacha, agar bo'lib to'lash tanlangan bo'lsa).
4.3. O'quv markazning ichki qoidalariga (intizom, xavfsizlik, etika) rioya qilish.
4.4. O'quv materiallari va auditoriya jihozlariga ehtiyotkorlik bilan munosabat qilish; zarar yetkazgan taqdirda qoplash.
4.5. Online format holatida — o'z hisobidan zarur texnik vositalarni (kompyuter, internet) ta'minlash.

5. SIFAT KAFOLATLARI

5.1. Tinglovchi olgan ta'lim "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi qonunga muvofiq sifat talablariga javob berishi shart.
5.2. Agar Tinglovchi taqdim etilayotgan ta'limning sifatidan qoniqmasa, yozma da'vo bildiradi. O'quv markazi 10 (o'n) ish kuni ichida da'voni ko'rib chiqadi va kamchilikni bartaraf etadi yoki narxni mutanosib kamaytiradi.
5.3. Kurs nomi yoki tarkibida e'lon qilingan dasturlardan jiddiy chetlanish — shartnoma muhim darajada buzilishi hisoblanadi.

6. PUL QAYTARISH SIYOSATI

6.1. Tinglovchi shartnomadan istalgan vaqtda voz kechishi mumkin (FK 718-modda, "Iste'molchi huquqlari" qonuni).
6.2. Pul qaytarish tartibi:
    — Kurs boshlanishidan oldin voz kechish: 100% qaytariladi;
    — Kurs boshlangan kundan 7 (yetti) kalendar kun ichida voz kechish: 100% qaytariladi (cooling-off period);
    — Birinchi oy ichida voz kechish: haqiqatan o'qitilgan qismi va sodir bo'lgan to'g'ridan-to'g'ri xarajatlar (auditoriya, materiallar) chegirib, qoldig'i qaytariladi;
    — Birinchi oydan keyin voz kechish: faqat O'quv markazi sababi bilan to'xtatilgan hollarda mutanosib qaytariladi.
6.3. Pul qaytarish 10 (o'n) ish kuni ichida amalga oshiriladi.
6.4. Tibbiy sabab (rasmiy tibbiy ma'lumotnoma bilan), favqulodda hayotiy holatlar (vafot, jiddiy kasallik) yoki fors-major holatlarida pul qaytarish to'liq amalga oshiriladi.

7. INTELLEKTUAL MULK

7.1. O'quv materiallari (kitoblar, qo'llanmalar, video darslar, prezentatsiyalar, kod misollari) O'quv markazining intellektual mulki hisoblanadi.
7.2. Tinglovchi materiallarni faqat shaxsiy o'qish maqsadida ishlatadi; ularni nusxalash, tarqatish, sotish yoki ommaviy joylashtirish — yozma roziliksiz taqiqlanadi.
7.3. Tinglovchining kurs davomida yaratgan ishlari (kod, dizayn, hisobotlar) Tinglovchining mulki bo'lib qoladi, lekin O'quv markazi ularni o'z marketingida (Tinglovchining oldindan roziligi bilan) ishlatishi mumkin.

8. JAVOBGARLIK

8.1. To'lov kechiktirilgan har bir kun uchun Tinglovchi O'quv markaziga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
8.2. O'quv markazi sababi bilan dars o'tkazilmagan har bir holat uchun keyingi sanada kompensatsiya o'tkaziladi yoki summaning mutanosib qismi qaytariladi.
8.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).

9. SHAXSIY MA'LUMOTLAR

9.1. Tomonlar Tinglovchining shaxsiy ma'lumotlarini "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.
9.2. Ma'lumotlar faqat o'quv jarayonini tashkil qilish, sertifikatlash va qonun bilan belgilangan hisobot maqsadlarida ishlatiladi.
9.3. Tinglovchining yozma roziligi bilan ma'lumotlar O'quv markazining marketing maqsadlarida (testimonial, before/after, portfolio) ishlatilishi mumkin.

10. FORS-MAJOR

10.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, davlat organlarining oldindan ko'zda tutilmagan qarorlari, jumladan epidemiya tufayli karantin tartiblari) javobgarlikdan ozod etiladilar.
10.2. Fors-major holati 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega; bunda mutanosib pul qaytariladi.
10.3. Pandemiya yoki shu kabi holatlarda O'quv markazi darslarni online formatga o'tkazish huquqiga ega; Tinglovchi rozi bo'lmasa, kurs to'xtatiladi va mutanosib pul qaytariladi.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizolarni dastlab muzokaralar va yozma da'vo tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 15 (o'n besh) kalendar kun.
11.3. Iste'molchi huquqlariga oid nizolar Tinglovchi tomonidan O'zbekiston Respublikasi Iste'molchi huquqlarini himoya qilish jamiyati yoki Davlat raqobat qo'mitasiga arz qilinishi mumkin.
11.4. Sud nizolari Tinglovchining yashash joyi yoki O'quv markazining joylashgan joyiga ko'ra umumiy yurisdiksiya sudlari tomonidan ko'rib chiqiladi.

12. UMUMIY QOIDALAR

12.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda Tomonlarning imzolari bilan rasmiylashtiriladi.
12.2. Aloqa rekvizitlari: O'quv markazi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Tinglovchi — {{CP_EMAIL}}, {{CP_TELEFON}}.
12.3. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
12.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
12.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

13. TOMONLARNING REKVIZITLARI VA IMZOLARI

O'QUV MARKAZI:                                  TINGLOVCHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               Pasport: {{CP_PASSPORT}}
Bank: {{ORG_BANK}}                              JShShIR: {{CP_JSHSHIR}}
H/r: {{ORG_HISOB}}                              Tel: {{CP_TELEFON}}
Tel: {{ORG_TELEFON}}                            Email: {{CP_EMAIL}}
Email: {{ORG_EMAIL}}

Rahbar: {{ORG_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_NOMI}}/
       M.O'.                                            (imzo)`
  },

  // ─── RESTORAN / YETKAZIB BERISH ────────────────────────────
  {
    id: 'restoran-yetkazish',
    industry: 'restoran',
    industryIcon: '🍽️',
    name:   'Yetkazib berish xizmati',
    nameOz: 'Етказиб бериш хизмати',
    nameRu: 'Услуги доставки',
    description:   'Restoran/oshxona ovqatlarini yetkazib berish hamkorligi',
    descriptionOz: 'Ресторан/ошхона овқатларини етказиб бериш ҳамкорлиги',
    descriptionRu: 'Партнёрство по доставке еды из ресторанов и кафе',
    contractType: 'XIZMAT',
    tags: ['yetkazib berish', 'delivery', 'restoran', 'oshxona'],
    content: `OVQAT YETKAZIB BERISH XIZMATI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Restoran" yoki "Buyurtmachi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Yetkazib beruvchi" yoki "Ijrochi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 703–720-moddalari, sanitariya-gigiyena qoidalari va "Iste'molchilarning huquqlarini himoya qilish to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Yetkazib beruvchi Restoran tomonidan tayyorlangan ovqatlarni va boshqa mahsulotlarni (keyingi o'rinlarda — "Buyurtma") oxirgi mijozlarga (keyingi o'rinlarda — "Mijozlar") yetkazib berish xizmatini ko'rsatish majburiyatini oladi.
1.2. Xizmat hududi: {{HUDUD}} (shahar/tuman/aniq tumanlar ro'yxati).
1.3. Ish vaqti: kuniga {{ISH_VAQTI}} (masalan: 09:00 – 23:00, hafta kunlari va dam olish kunlari).
1.4. Yetkazib berishni amalga oshirish vositasi: {{TRANSPORT}} (avtomobil, mototsikl, velosiped, piyoda).
1.5. Yetkazib beruvchi xodimlari ovqat sanitariya talablari bo'yicha tibbiy ko'rikdan o'tgan bo'lishi va sanitariya kitobchasiga ega bo'lishi shart.

2. NARX VA TO'LOV

2.1. Har bir muvaffaqiyatli yetkazilgan Buyurtma uchun yetkazib berish to'lovi: {{TOLOV_PER_BUYURTMA}} so'm.
2.2. Yetkazib beruvchining qo'shimcha mukofoti: {{MUKOFOT_TARTIBI}} (yuqori reyting, sezon, masofa va h.k. uchun).
2.3. To'lov haftalik (har hafta yakshanba kuni) yoki oylik (har oyning 5-sanasigacha) hisob-kitob qilinadi.
2.4. Hisob-kitob bank ko'chirmasi orqali Yetkazib beruvchining hisob raqamiga amalga oshiriladi.
2.5. Mijoz Buyurtma uchun naqd to'lasa, Yetkazib beruvchi pulni Restoranga shartnomada belgilangan tartibda topshiradi (kuniga, hafta yakuni va h.k.).
2.6. To'lov kechiktirilgan har bir kun uchun {{PENYA_FOIZ}}% penya undiriladi.

3. YETKAZIB BERUVCHI MAJBURIYATLARI

3.1. Buyurtmani Restorandan olganidan keyin {{YETKAZISH_MUDDAT}} (masalan: 30 daqiqa) ichida Mijozga yetkazib berish, agar uzoqlik yoki yo'l sharoiti boshqacha vaqtni talab qilmasa.
3.2. Ovqatlarning sifati va haroratini saqlash uchun:
    — termal sumka yoki maxsus konteynerlardan foydalanish;
    — issiq va sovuq taomlarni alohida saqlash;
    — yetkazib berish vaqtida ovqatni jismonan zararlamaslik.
3.3. Sanitariya va gigiyena talablariga rioya qilish: tozalanadigan kiyim, qo'l yuvish, qo'lqop, niqob (qonun talab qilgan hollarda).
3.4. Mijozlar bilan xushmuomala munosabatda bo'lish; nizoli holatda Restoranni darhol xabardor qilish.
3.5. Yo'l harakati qoidalariga rioya qilish, transport vositasining texnik xavfsizligini ta'minlash; yo'l-transport hodisasi sodir bo'lsa, qonun talablariga muvofiq harakat qilish.
3.6. Restoran logotipi va brand atributlari (formali kiyim, sumka, transport stikeri) bilan harakat qilish; ulardan faqat shartnoma maqsadlarida foydalanish.

4. RESTORAN MAJBURIYATLARI

4.1. Buyurtmani Yetkazib beruvchi kelganidan keyin {{TAYYORLASH_MUDDAT}} (masalan: 15 daqiqa) ichida tayyorlab berish.
4.2. Mahsulotni mos qadoq va belgilash bilan taqdim etish (manzil, telefon, buyurtma raqami, narx, sana).
4.3. Yetkazib beruvchini brand atributlari (logotipli sumka, kiyim, stiker) bilan ta'minlash, agar shartnomada nazarda tutilgan bo'lsa.
4.4. To'lovlarni shartnoma muddatlarida amalga oshirish.
4.5. Yetkazib beruvchi xodimlari uchun mahsulot va xizmat ko'rsatish bo'yicha qisqa trening o'tkazish.

5. MAS'ULIYAT VA SIFAT KAFOLATLARI

5.1. Yetkazib beruvchi yo'lda yetkazilgan zarar uchun (ovqatning to'kilishi, sovushi, yo'qolishi va h.k.) javobgar va Restoranga yetkazilgan zararni qoplaydi (Buyurtma narxining 100% miqdorida).
5.2. Restoran ovqatning sifati va xavfsizligi (sanitariya, ingredientlar) uchun javobgar; ovqatlanish bilan bog'liq Mijoz shikoyatlari Restoran zimmasida.
5.3. Mijoz shikoyatlari ikkala Tomon o'rtasida 5 (besh) ish kuni ichida ko'rib chiqiladi va aybdorlik darajasi aniqlanadi.
5.4. Mijozning sog'lig'iga zarar yetkazilgan holatda — qonun belgilangan tartibda javobgarlik aniqlanadi.
5.5. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).

6. SUG'URTA

6.1. Yetkazib beruvchi o'z xodimlarini va transport vositalarini sug'urta qilish bo'yicha mas'uliyatni o'z zimmasiga oladi.
6.2. Restoran tovuq, baliq, qaymoq va boshqa tez buziladigan mahsulotlarni qadoqlashda, transportlash sharoitlari bo'yicha aniq ko'rsatmalar berishi shart.

7. SHAXSIY MA'LUMOTLAR VA MIJOZ MA'LUMOTLARI

7.1. Mijoz haqidagi ma'lumotlar (ism, telefon, manzil) "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlanadi.
7.2. Yetkazib beruvchi Mijoz ma'lumotlarini faqat yetkazib berish maqsadlarida ishlatadi va keyin yo'q qiladi.
7.3. Mijozlar bazasini Yetkazib beruvchi o'z biznesi maqsadida (raqobatdosh restoran reklamasi va h.k.) ishlatishi qat'iyan taqiqlanadi.

8. INTELLEKTUAL MULK

8.1. Restoran logotipi, brendi va boshqa intellektual mulk obyektlari Restoranning mulki hisoblanadi.
8.2. Yetkazib beruvchi bu intellektual mulkni faqat shartnoma maqsadlarida ishlatadi; shartnoma tugagandan keyin barcha brand atributlari (kiyim, sumka, stiker) qaytariladi yoki yo'q qilinadi.

9. FORS-MAJOR

9.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari, jumladan epidemiya tufayli karantin tartiblari) javobgarlikdan ozod etiladilar.
9.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
9.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.

10. SHARTNOMANI BEKOR QILISH

10.1. Shartnoma {{MUDDAT}} muddatga tuziladi va Tomonlar yozma e'tiroz bildirmasa har keyingi muddat uchun avtomatik yangilanadi.
10.2. Har bir Tomon shartnomadan voz kechish huquqiga ega, agar boshqa Tomon muhim shartlarni buzsa: ketma-ket 5 (besh) buyurtmadan ko'p muvaffaqiyatsiz yetkazib berish, sanitariya talablarini buzish, Mijoz ma'lumotlarini noto'g'ri ishlatish.
10.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizolarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
11.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

12. UMUMIY QOIDALAR

12.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri (mijozlar bazasi, narxlar, savdo statistikasi) ni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar. Maxfiylik majburiyati shartnoma tugaganidan keyin 2 (ikki) yil davomida amal qiladi.
12.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
12.3. Aloqa rekvizitlari: Restoran — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Yetkazib beruvchi — {{CP_EMAIL}}, {{CP_TELEFON}}.
12.4. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
12.5. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
12.6. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

13. TOMONLARNING REKVIZITLARI VA IMZOLARI

RESTORAN:                                       YETKAZIB BERUVCHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },

  // ─── KREATIV / DIZAYN ─────────────────────────────────────
  {
    id: 'kreativ-dizayn',
    industry: 'kreativ',
    industryIcon: '🎨',
    name:   'Dizayn xizmati shartnomasi',
    nameOz: 'Дизайн хизмати шартномаси',
    nameRu: 'Договор дизайнерских услуг',
    description:   'Logo, brendbuk, web dizayn, marketing materiallari',
    descriptionOz: 'Логотип, брендбук, веб дизайн, маркетинг материаллари',
    descriptionRu: 'Логотип, брендбук, веб-дизайн, маркетинговые материалы',
    contractType: 'PUDRAT',
    tags: ['dizayn', 'logo', 'brendbuk', 'kreativ'],
    content: `DIZAYN XIZMATI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Dizayner" yoki "Ijrochi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 631–704-moddalari va "Mualliflik huquqi va turdosh huquqlar to'g'risida"gi qonun talablariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Dizayner Buyurtmachining topshirig'iga binoan ushbu shartnoma va ijodiy briff (1-ilova) asosida quyidagi dizayn ishlarini (keyingi o'rinlarda — "Dizayn") bajarish va Buyurtmachiga topshirish majburiyatini oladi:
{{ISH_RUYXATI}}
1.2. Dizayn turi va mazmuni: {{DIZAYN_TURI}} (logo, brendbuk, web dizayn, marketing materiallari, qadoq dizayni va h.k.).
1.3. Yakuniy taqdim etiladigan fayllar formati: {{FORMATLAR}} (PDF, AI, PSD, FIG, PNG, SVG, ZIP arxiv va h.k.).
1.4. Ijodiy briff Tomonlar tomonidan yozma kelishilgan va shartnomaga ajralmas ilova qilingan hujjat bo'lib, unda dizayn maqsadi, maqsadli auditoriya, brand qadriyatlari, ranglar palitra, tipografiya va boshqa kreativ ko'rsatkichlar belgilanadi.

2. NARX VA TO'LOV TARTIBI

2.1. Loyihaning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}}.
2.2. Narx fix-price asosida belgilanadi va shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. To'lov bosqichlari:
    — 50% (avans) — shartnoma imzolanganidan keyin 5 ish kuni ichida (kickoff);
    — 50% (yakuniy) — yakuniy qabul-topshirish dalolatnomasi imzolangandan keyin 5 ish kuni ichida.
2.4. Briffdan tashqari qo'shimcha ishlar (yangi konsept, qo'shimcha format, briffga kirmaydigan elementlar) Buyurtmachining yozma roziligi bilan, alohida byudjet asosida bajariladi.
2.5. To'lov bank ko'chirmasi orqali Dizaynerning hisob raqamiga amalga oshiriladi.

3. ISH JARAYONI VA MUDDATLAR

3.1. Loyiha boshlanish sanasi: {{BOSHLANISH}}. Tugallanish sanasi: {{TUGALLANISH}}.
3.2. Bosqichlar:
    — Konsept va moodboard taqdim etish: {{KONSEPT_MUDDAT}} ish kuni;
    — Birinchi to'liq versiya (V1): {{V1_MUDDAT}} ish kuni;
    — Reviziya bosqichlari: {{REVIZIYA_SONI}} marta (har biri 3 ish kuni);
    — Yakuniy versiya va fayllarni topshirish: {{YAKUNIY_MUDDAT}} ish kuni.
3.3. Buyurtmachi har bosqichda 3 (uch) ish kuni ichida fikr-mulohaza beradi. Belgilangan muddatda javob bermaslik holatida muddat mutanosib uzaytiriladi.
3.4. Briffga kirmaydigan reviziyalar yoki konsept o'zgarishi qo'shimcha ish hisoblanadi va alohida hisoblanadi.

4. INTELLEKTUAL MULK HUQUQLARI

4.1. Yakuniy to'lov to'liq amalga oshirilgan paytdan boshlab Dizaynga oid mulkiy mualliflik huquqlari (foydalanish, nusxalash, modifikatsiyalash, tarqatish, sublitsenziyalash) Buyurtmachiga to'liq o'tkaziladi (FK 1098-modda, Mualliflik huquqi qonuni).
4.2. Mualliflikning shaxsiy noimulkiy huquqi (avtorlik) Dizaynerda saqlanadi.
4.3. Yakuniy fayllar (manba fayllar — AI, PSD, FIG va h.k.) yakuniy to'lov amalga oshirilgandan keyin Buyurtmachiga topshiriladi.
4.4. Dizayner Buyurtmachi yoki uchinchi shaxslarning intellektual mulk huquqlarini buzmaydi (stock, fonts va boshqa elementlarni litsenziyali manbalardan oladi).
4.5. Dizayner ushbu loyihaning yakuniy versiyasini o'z portfeliosida (web sayt, ijtimoiy tarmoqlar, professional platformalar) ko'rsatish huquqiga ega, agar Buyurtmachi yozma ravishda rad etmagan bo'lsa va loyiha mahfiy hisoblanmasa.
4.6. Buyurtmachi Dizaynerning ijodiy hissasiga oid eslatma (credit) berishi taklif etiladi (lekin majburiy emas).

5. RAD ETILGAN KONSEPTLAR

5.1. Buyurtmachi tomonidan rad etilgan konseptlar va oraliq versiyalar Dizaynerning intellektual mulki bo'lib qoladi va u ularni boshqa loyihalarda yoki o'z portfeliosida ishlatish huquqiga ega.

6. STOK MATERIALLAR VA UCHINCHI TOMON ELEMENTLARI

6.1. Dizayn tarkibida stok rasmlari, fontlar yoki boshqa litsenziyali materiallar ishlatilsa, Dizayner ularning litsenziyalari va shartlari haqida Buyurtmachini xabardor qiladi.
6.2. Litsenziya xarajatlari, agar shartnoma summasiga kiritilmagan bo'lsa, Buyurtmachi tomonidan alohida qoplanadi.

7. KAFOLAT

7.1. Dizayner yakuniy fayllarda 30 (o'ttiz) kalendar kun davomida texnik xatolar (notog'ri o'lchamlar, ekspot xatolar, fayl korruptsiyasi) bo'lsa, ularni o'z hisobidan tuzatadi.
7.2. Stilistik o'zgarishlar (Buyurtmachining yangi orzu-istaklari) reviziya hisoblanadi va shartnomada belgilangan reviziya soni bilan cheklanadi; qo'shimcha — alohida byudjet asosida.

8. TOMONLAR HAMKORLIGI VA MAJBURIYATLARI

8.1. Buyurtmachi majburdir:
    — to'lovlarni shartnoma muddatlarida amalga oshirish;
    — kerakli ma'lumotlarni (kontent, brand kitobi, mavjud materiallar, logotipo, reklama fotosurat va h.k.) 3 (uch) ish kuni ichida taqdim etish;
    — har bosqich uchun yozma fikr-mulohaza berish.

8.2. Dizayner majburdir:
    — Dizaynni briff va shartnoma talablariga muvofiq, kelishilgan muddatda bajarish;
    — Sifatli fayllarni va manba materiallarni topshirish;
    — Buyurtmachining intellektual mulki va mahfiy ma'lumotlarini muhofaza qilish.

8.3. Tomonlar hamkorlik kanali sifatida quyidagilarni ishlatadilar: email ({{ORG_EMAIL}}, {{CP_EMAIL}}), Slack/Telegram, Figma/Miro va boshqa kelishilgan vositalar.

9. JAVOBGARLIK

9.1. Dizayn muddatdan kechiktirilgan har bir kun uchun Dizayner Buyurtmachiga shartnoma summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
9.2. To'lov kechiktirilgan har bir kun uchun Buyurtmachi Dizaynerga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
9.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
9.4. Dizaynerning umumiy javobgarligi har qanday holatda ushbu shartnoma summasi bilan cheklanadi.

10. MAXFIYLIK

10.1. Tomonlar shartnoma ijrosi davomida olingan brand strategiyasi, biznes ma'lumotlar va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
10.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.
10.3. Buyurtmachi maxsus yozma rad etmagan bo'lsa, Dizayner yakuniy mahsulotni o'z portfeliosida ko'rsatish huquqiga ega (8.5-bandda nazarda tutilgan).

11. FORS-MAJOR

11.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari) javobgarlikdan ozod etiladilar.
11.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
11.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.

12. SHARTNOMANI BEKOR QILISH

12.1. Buyurtmachi shartnomadan istalgan vaqtda voz kechishi mumkin, ammo Dizaynerga bu paytgacha haqiqatan bajarilgan ish uchun haq to'lashi va aniq zararlarni qoplashi shart (FK 715, 718-moddalar).
12.2. Dizayner shartnomadan voz kechishi mumkin, agar Buyurtmachi muhim shartlarni buzsa (to'lovni 30 kun va undan ko'p kechiktirsa, briff yoki kerakli ma'lumotlarni taqdim etmasa).
12.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

13. NIZOLARNI HAL QILISH

13.1. Tomonlar barcha nizolarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
13.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
13.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

14. UMUMIY QOIDALAR

14.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
14.2. Tomonlar shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.
14.3. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda Tomonlarning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
14.4. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
14.5. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.

15. TOMONLARNING REKVIZITLARI VA IMZOLARI

DIZAYNER:                                       BUYURTMACHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_________________ /{{ORG_RAHBAR}}/              _________________ /{{CP_RAHBAR}}/
       M.O'.                                            M.O'.`
  },
]
