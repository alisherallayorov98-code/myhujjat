import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

export interface CreateTemplateDto {
  organizationId: string
  contractType:   string
  name:           string
  content:        string
  isPublic?:      boolean
}

export interface UpdateTemplateDto {
  name?:     string
  content?:  string
  isPublic?: boolean
}

// Tizim shablonlari — 3 tilda nomlar (content asosan UZ qoladi, yuridik
// tarjimon ko'rib chiqgandan keyin to'liq lokalizatsiya qo'shiladi)
const SYSTEM_TEMPLATES: {
  contractType: string
  name:    string         // UZ — default
  nameUz?: string
  nameOz?: string
  nameRu?: string
  content: string
}[] = [
  {
    contractType: 'OLDI_SOTDI',
    name:   "Oldi-sotdi shartnomasi (standart)",
    nameUz: "Oldi-sotdi shartnomasi (standart)",
    nameOz: "Олди-сотди шартномаси (стандарт)",
    nameRu: "Договор купли-продажи (стандартный)",
    content: `OLDI-SOTDI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Sotuvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Xaridor"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksi 386, 414–505-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga ushbu shartnoma asosida quyidagi tovarni (keyingi o'rinlarda — "Tovar") mulk huquqi bilan beradi, Xaridor esa Tovarni qabul qilib, narxini shartnomada belgilangan tartibda to'laydi.
1.2. Tovarning nomi va tavsifi: {{TOVAR_NOMI}}.
1.3. Tovar miqdori: {{TOVAR_MIQDORI}}.
1.4. Tovar sifati: {{TOVAR_SIFATI}}. Tovar O'zbekiston Respublikasida amal qiluvchi davlat standartlari (O'zDSt), texnik reglamentlar va sanitariya-gigiyena talablariga javob berishi shart (FK 425-modda).
1.5. Tovarning to'plami (komplektligi) va o'rami: {{TOVAR_KOMPLEKT}}. Sotuvchi Tovarga taalluqli barcha hujjatlarni (sertifikat, pasport, foydalanish bo'yicha qo'llanma, kelib chiqishi to'g'risida ma'lumot) Xaridorga topshirishga majburdir (FK 437-modda).

2. NARX VA TO'LOV TARTIBI

2.1. Tovarning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. Narx shartnoma amal qilish davrida o'zgarmas hisoblanadi, agar Tomonlar yozma qo'shimcha kelishuv (akt) bilan boshqacha kelishmagan bo'lsa.
2.3. To'lov tartibi: {{TOLOV_TARTIBI}}.
2.4. To'lov muddati: {{TOLOV_MUDDAT}}.
2.5. To'lov pul ko'chirish yo'li bilan, Sotuvchining ushbu shartnomada ko'rsatilgan hisob raqamiga amalga oshiriladi. To'lov sanasi — pul mablag'i Sotuvchining hisob raqamiga kelib tushgan sana hisoblanadi.
2.6. Xaridor o'z xohishi bilan Tovarga avans (oldindan to'lov) berishi mumkin. Avans summasi va muddati: {{AVANS_SHARTI}}.

3. YETKAZIB BERISH VA QABUL QILISH

3.1. Yetkazib berish muddati: {{YETKAZISH_MUDDAT}}.
3.2. Yetkazib berish manzili: {{YETKAZISH_MANZIL}}.
3.3. Yetkazib berish shartlari (Incoterms 2020 yoki shartnoma asosida): {{YETKAZISH_SHARTLARI}}. Yetkazib berish xarajatlari: {{YETKAZISH_XARAJATI}}.
3.4. Tovarni qabul qilish-topshirish dalolatnomasi (akti) imzolanishi bilan yetkazib berish bajarilgan hisoblanadi. Akt 2 nusxada tuzilib, har ikki Tomonda saqlanadi.
3.5. Xaridor Tovarni qabul qilish vaqtida miqdor va tashqi belgilari bo'yicha tekshiradi. Yashirin nuqsonlar 14 (o'n to'rt) kalendar kun ichida, ammo kafolat muddati doirasida yozma da'vo (pretenziya) bilan bildirilishi shart (FK 462-modda).

4. MULK HUQUQI VA TASODIFIY YO'QOTISH XAVFI

4.1. Tovarga mulk huquqi Xaridorga Tovar Sotuvchi tomonidan unga (yoki uning vakiliga) topshirilgan paytdan o'tadi (FK 187, 423-moddalar).
4.2. Tovarning tasodifan yo'q bo'lishi yoki shikastlanishi xavfi mulk huquqi o'tgan paytdan boshlab Xaridor zimmasiga yuklanadi (FK 423-modda).

5. KAFOLAT VA NUQSONLI TOVAR

5.1. Sotuvchi Tovar uchun kafolat muddatini belgilaydi: {{KAFOLAT_MUDDAT}}. Kafolat muddati Tovar topshirilgan kundan boshlanadi.
5.2. Kafolat muddati ichida nuqson aniqlangan taqdirda Xaridor o'z xohishiga ko'ra quyidagilardan birini talab qilish huquqiga ega (FK 467-modda):
    — Tovar narxini mutanosib kamaytirish;
    — Nuqsonlarni o'rinli muddatda bepul bartaraf etish;
    — Nuqsonlarni o'zi bartaraf etish va xarajatlarini Sotuvchidan undirish;
    — Sifatsiz Tovarni shartnoma talablariga mos Tovarga almashtirish yoki shartnomadan voz kechib, to'langan summani qaytarish.
5.3. Nuqson Sotuvchining aybi bilan kelib chiqqan deb taxmin qilinadi, agar u Xaridorga tovar topshirilgunga qadar yoki shu paytgacha mavjud bo'lgan sabablardan kelib chiqqan bo'lsa (FK 466-modda).

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Sotuvchi majburdir:
    — Tovarni belgilangan muddatda, miqdor, sifat va to'plamga muvofiq topshirish;
    — Tovarga taalluqli barcha texnik va huquqiy hujjatlarni topshirish;
    — Tovarning uchinchi shaxslar huquqlaridan xoli ekanligini kafolatlash (FK 437-modda).

6.2. Sotuvchi huquqi bor:
    — Xaridordan Tovar narxini o'z vaqtida olish;
    — To'lov kechiktirilgan taqdirda Tovarni topshirishni to'xtatib turish (FK 333-modda).

6.3. Xaridor majburdir:
    — Tovarni shartnoma shartlariga muvofiq qabul qilish;
    — Tovar narxini belgilangan muddatda to'lash (FK 458-modda);
    — Aniqlangan nuqsonlar haqida Sotuvchini o'z vaqtida xabardor qilish.

6.4. Xaridor huquqi bor:
    — Sifatli va shartnomaga mos Tovar olish;
    — Nuqsonli Tovar uchun FK 467-moddada nazarda tutilgan choralarni qo'llash.

7. JAVOBGARLIK

7.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va ushbu shartnomaga muvofiq javobgar bo'ladilar.
7.2. Tovarni yetkazib berish kechiktirilgan har bir kun uchun Sotuvchi Xaridorga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi (FK 327-modda).
7.3. To'lov kechiktirilgan har bir kun uchun Xaridor Sotuvchiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
7.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
7.5. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi.
7.6. Yetkazilgan haqiqiy zarar penyadan ortiq qismda alohida undiriladi.

8. FORS-MAJOR

8.1. Tomonlar majburiyatlarini bajara olmaslik yoki kechiktirib bajarish uchun, agar bu fors-major (yengib bo'lmaydigan kuchlar) — tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari natijasida sodir bo'lgan bo'lsa, javobgarlikdan ozod etiladilar (FK 333-modda).
8.2. Fors-major holati boshlangan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart. O'z vaqtida xabardor qilmaslik fors-majorga tayanish huquqidan mahrum etadi.
8.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanishi lozim.
8.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon sud yo'liga bormasdan, yozma xabarnoma bilan shartnomani bekor qilish huquqiga ega bo'ladi.

9. MAXFIYLIK

9.1. Tomonlar shartnomaning shartlari, shuningdek shartnoma ijrosi davomida bir-biriga yetkazilgan tijorat sirini tashkil qiladigan ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
9.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.
9.3. Maxfiy ma'lumotlar qonun talabi yoki sud qarori asosida vakolatli organlarga taqdim etilishi mustasno.

10. SHARTNOMANI BEKOR QILISH

10.1. Shartnoma quyidagi hollarda bekor qilinadi (FK 379, 384-moddalar):
    — Tomonlarning yozma kelishuvi bilan;
    — Boshqa Tomon shartnoma shartlarini muhim darajada buzganda — sud tartibida;
    — Qonunchilikda nazarda tutilgan boshqa hollarda.
10.2. Shartnoma muhim darajada buzilgan hisoblanadi, jumladan: tovar muddatdan 30 (o'ttiz) kun va undan ko'p kechiktirilganda, to'lov muddatdan 30 (o'ttiz) kun va undan ko'p kechiktirilganda yoki sifatsiz tovar takroran yetkazib berilganda.
10.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
11.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

12. ALOQA VA XABARNOMALAR

12.1. Shartnoma bo'yicha barcha rasmiy xabarnomalar yozma shaklda — qo'lma-qo'l, kuryer xizmati, buyurtmali xat (xabarnomali) yoki Tomonlar tan oladigan elektron pochta orqali yuboriladi.
12.2. Aloqa rekvizitlari: Sotuvchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Xaridor — {{CP_EMAIL}}, {{CP_TELEFON}}.
12.3. Rekvizitlar o'zgargan taqdirda Tomon 5 (besh) ish kuni ichida boshqa Tomonni xabardor qilishga majbur. Aks holda eski rekvizitlarga yuborilgan xabar olingan deb hisoblanadi.

13. ANTIKORRUPTSIYA BANDI

13.1. Tomonlar shartnomani tuzish va ijro etish jarayonida O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
13.2. Tomonlar va ularning xodimlari shartnoma bilan bog'liq holda hech qanday qonunga zid haq, sovg'a, foyda yoki taklif berishmaydi va olishmaydi.

14. SHAXSIY MA'LUMOTLAR

14.1. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.
14.2. Ma'lumotlar faqat shartnoma maqsadlarida qayta ishlanadi va uchinchi shaxslarga, qonunda nazarda tutilgan hollardan tashqari, oshkor qilinmaydi.

15. UMUMIY QOIDALAR

15.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, har ikki Tomonning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
15.2. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
15.3. Shartnoma imzolangan kundan kuchga kiradi va to'liq ijro etilgunga qadar amal qiladi. Umumiy amal qilish muddati: {{MUDDAT}}.
15.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada, har bir Tomon uchun bittadan, davlat tilida tuzildi.
15.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

16. TOMONLARNING REKVIZITLARI VA IMZOLARI

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

_______________ / {{ORG_RAHBAR}} /              _______________ / {{CP_RAHBAR}} /
       M.O'.                                            M.O'.`,
  },
  {
    contractType: 'XIZMAT',
    name:   "Xizmat ko'rsatish shartnomasi (standart)",
    nameUz: "Xizmat ko'rsatish shartnomasi (standart)",
    nameOz: "Хизмат кўрсатиш шартномаси (стандарт)",
    nameRu: "Договор оказания услуг (стандартный)",
    content: `XIZMAT KO'RSATISH SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijrochi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 703–720-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachining topshirig'iga binoan ushbu shartnomada belgilangan xizmatlarni (keyingi o'rinlarda — "Xizmat") shaxsan yoki o'z mas'uliyati ostida ko'rsatishni o'z zimmasiga oladi, Buyurtmachi esa ko'rsatilgan Xizmatni qabul qilib, narxini to'lashga majburdir (FK 703-modda).
1.2. Xizmat turi va tavsifi: {{XIZMAT_NOMI}}.
1.3. Xizmat hajmi, mazmuni va texnik shartlari: {{XIZMAT_SHARTLARI}}.
1.4. Xizmat ko'rsatish joyi: {{XIZMAT_JOYI}}.
1.5. Xizmat ko'rsatish muddati: boshlanish — {{XIZMAT_BOSHI}}, tugash — {{XIZMAT_TUGASHI}}.

2. NARX VA TO'LOV TARTIBI

2.1. Xizmatning umumiy narxi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. Xizmat narxi shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. To'lov tartibi: {{TOLOV_TARTIBI}}.
2.4. To'lov muddati: {{TOLOV_MUDDAT}}.
2.5. To'lov bank ko'chirmasi orqali Ijrochining hisob raqamiga amalga oshiriladi. To'lov sanasi — pul mablag'i Ijrochining hisob raqamiga kelib tushgan sana hisoblanadi.
2.6. Avans (oldindan to'lov) sharti: {{AVANS_SHARTI}}.

3. XIZMATNI BAJARISH TARTIBI

3.1. Ijrochi Xizmatni shaxsan ko'rsatishi shart, agar shartnomada boshqacha nazarda tutilmagan bo'lsa (FK 705-modda). Ijrochi uchinchi shaxslarni jalb qilish uchun Buyurtmachidan yozma rozilik olishi kerak.
3.2. Ijrochi Xizmatni ko'rsatish jarayonida Buyurtmachining yozma ko'rsatmalariga amal qiladi, ammo o'z professional mustaqilligini saqlaydi.
3.3. Buyurtmachi Xizmatni ko'rsatish uchun zarur ma'lumot, hujjat va sharoitlarni o'z vaqtida taqdim etishga majburdir.

4. XIZMATNI QABUL QILISH

4.1. Xizmat to'liq yoki bosqichma-bosqich tugagach, Tomonlar Qabul-topshirish dalolatnomasini (akti) imzolaydilar.
4.2. Akt 2 (ikki) nusxada tuzilib, har bir Tomonda bittadan saqlanadi.
4.3. Buyurtmachi aktni olgandan keyin 5 (besh) ish kuni ichida uni imzolaydi yoki yozma asoslangan e'tirozlarini taqdim etadi. Belgilangan muddatda imzo qo'yilmasa va e'tiroz bildirilmasa, Xizmat to'liq ko'rsatilgan va qabul qilingan hisoblanadi (FK 715-modda).
4.4. E'tirozlar asosli bo'lsa, Ijrochi belgilangan kamchiliklarni o'z hisobidan, kelishilgan muddatda bartaraf etadi.

5. SIFAT VA KAFOLAT

5.1. Ko'rsatiladigan Xizmat O'zbekiston Respublikasining qonunchiligi, kasbiy standartlar va shartnomada belgilangan talablarga to'liq mos kelishi shart.
5.2. Ijrochi ko'rsatilgan Xizmatga {{KAFOLAT_MUDDAT}} muddatga kafolat beradi. Kafolat muddati Qabul-topshirish dalolatnomasi imzolangan kundan boshlanadi.
5.3. Kafolat muddati ichida nuqson aniqlangan taqdirda, Ijrochi kamchilikni o'z hisobidan bepul bartaraf etadi yoki Buyurtmachining xohishiga ko'ra Xizmat narxini mutanosib kamaytiradi (FK 717-modda).

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Ijrochi majburdir:
    — Xizmatni belgilangan muddat va sifatda ko'rsatish;
    — Buyurtmachining qonuniy ko'rsatmalariga rioya qilish;
    — Xizmat ko'rsatish jarayonida olingan ma'lumotlarning maxfiyligini saqlash;
    — Xizmat tugagach, hisobot (zarur bo'lsa) va Qabul-topshirish dalolatnomasini taqdim etish.

6.2. Ijrochi huquqi bor:
    — Xizmat narxini o'z vaqtida olish;
    — Buyurtmachidan zarur ma'lumot va hujjatlarni talab qilish;
    — Buyurtmachi majburiyatlarini bajarmagani sababli kelib chiqqan kechikishlarda javobgar bo'lmaslik.

6.3. Buyurtmachi majburdir:
    — Xizmat narxini belgilangan muddat va tartibda to'lash;
    — Xizmatni qabul qilish va akt imzolash;
    — Xizmat ko'rsatish uchun zarur sharoit, hujjat va ma'lumotlarni taqdim etish.

6.4. Buyurtmachi huquqi bor:
    — Xizmat ko'rsatish jarayonida o'z manfaatlariga zarar yetkazmasdan nazorat olib borish;
    — Xizmatda kamchilik aniqlanganda — uni bartaraf etishni yoki narxni kamaytirishni talab qilish.

7. JAVOBGARLIK

7.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va ushbu shartnomaga muvofiq javobgar bo'ladilar.
7.2. Xizmat muddatdan kechiktirilgan har bir kun uchun Ijrochi Buyurtmachiga shartnoma summasining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
7.3. To'lov kechiktirilgan har bir kun uchun Buyurtmachi Ijrochiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
7.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
7.5. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi.

8. FORS-MAJOR

8.1. Tomonlar majburiyatlarini bajara olmaslik yoki kechiktirib bajarish uchun, agar bu fors-major (yengib bo'lmaydigan kuchlar) — tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari natijasida sodir bo'lgan bo'lsa, javobgarlikdan ozod etiladilar.
8.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
8.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
8.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

9. MAXFIYLIK

9.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri, intellektual mulk va shaxsiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
9.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.
9.3. Ushbu band qonun talabi yoki sud qarori asosida vakolatli organlarga ma'lumot taqdim etishga taalluqli emas.

10. SHARTNOMANI BEKOR QILISH

10.1. Buyurtmachi xizmat ko'rsatishdan istalgan vaqtda voz kechishi mumkin, ammo Ijrochiga bu paytgacha haqiqatan ko'rsatilgan Xizmat uchun haq to'lashi va aniq zararlarni qoplashi shart (FK 718-modda).
10.2. Ijrochi shartnomadan voz kechishi mumkin, ammo Buyurtmachiga bu bilan yetkazilgan zararlarni to'liq qoplashi shart (FK 718-modda).
10.3. Shartnoma muhim darajada buzilganda — sud tartibida bekor qilinadi (FK 384-modda).
10.4. Shartnomani bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

11. NIZOLARNI HAL QILISH

11.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
11.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
11.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

12. ALOQA VA XABARNOMALAR

12.1. Shartnoma bo'yicha rasmiy xabarnomalar yozma shaklda — qo'lma-qo'l, kuryer xizmati, buyurtmali xat yoki Tomonlar tan oladigan elektron pochta orqali yuboriladi.
12.2. Aloqa rekvizitlari: Ijrochi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Buyurtmachi — {{CP_EMAIL}}, {{CP_TELEFON}}.
12.3. Rekvizitlar o'zgargan taqdirda Tomon 5 (besh) ish kuni ichida boshqa Tomonni xabardor qilishga majbur.

13. ANTIKORRUPTSIYA BANDI

13.1. Tomonlar shartnomani tuzish va ijro etish jarayonida O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
13.2. Tomonlar va ularning xodimlari shartnoma bilan bog'liq holda hech qanday qonunga zid haq, sovg'a, foyda yoki taklif berishmaydi va olishmaydi.

14. SHAXSIY MA'LUMOTLAR

14.1. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.
14.2. Ma'lumotlar faqat shartnoma maqsadlarida ishlatiladi va uchinchi shaxslarga oshkor qilinmaydi.

15. UMUMIY QOIDALAR

15.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, har ikki Tomonning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
15.2. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
15.3. Shartnoma imzolangan kundan kuchga kiradi va to'liq ijro etilgunga qadar amal qiladi. Umumiy amal qilish muddati: {{MUDDAT}}.
15.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
15.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

16. TOMONLARNING REKVIZITLARI VA IMZOLARI

IJROCHI:                                        BUYURTMACHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_______________ / {{ORG_RAHBAR}} /              _______________ / {{CP_RAHBAR}} /
       M.O'.                                            M.O'.`,
  },
  {
    contractType: 'IJARA',
    name:   "Ijara shartnomasi (standart)",
    nameUz: "Ijara shartnomasi (standart)",
    nameOz: "Ижара шартномаси (стандарт)",
    nameRu: "Договор аренды (стандартный)",
    content: `IJARA SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                                  "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijaraga beruvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijarachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 535–595-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraga beruvchi Ijarachiga ushbu shartnoma asosida haq evaziga vaqtincha egalik qilish va foydalanish uchun quyidagi mulkni (keyingi o'rinlarda — "Ob'ekt") topshiradi (FK 535-modda).
1.2. Ob'ektning tavsifi: {{MULK_TAVSIFI}}.
1.3. Ob'ektning manzili va kadastr (inventar) raqami: {{MULK_MANZILI}}, kadastr raqami — {{MULK_KADASTR}}.
1.4. Ob'ektning umumiy maydoni: {{MULK_MAYDON}} kv. m.
1.5. Ob'ektning maqsadi (foydalanish turi): {{MULK_MAQSAD}}.
1.6. Ijaraga beruvchi Ob'ektga mulk huquqiga ega ekanligini va Ob'ektni ijaraga berishga to'siq bo'ladigan uchinchi shaxslar huquqlari mavjud emasligini kafolatlaydi (FK 536-modda).
1.7. Ob'ektning holatini tasdiqlovchi Qabul-topshirish dalolatnomasi shartnomaga ajralmas qism sifatida ilova qilinadi.

2. IJARA HAQI VA TO'LOV TARTIBI

2.1. Oylik ijara haqi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS bandiga muvofiq: {{QQS_HOLATI}} (Soliq kodeksi 238-modda).
2.2. Ijara haqi tarkibida quyidagilar kiradi/kirmaydi: {{IJARA_TARKIBI}} (kommunal xizmatlar, internet, qo'riqlash va h.k.).
2.3. Ijara haqi har oyning {{TOLOV_KUNI}}-sanasigacha to'lanadi.
2.4. To'lov shakli: {{TOLOV_SHAKLI}} (bank ko'chirmasi orqali).
2.5. To'lov sanasi — pul mablag'i Ijaraga beruvchining hisob raqamiga kelib tushgan sana hisoblanadi.
2.6. Garov puli (deposit): {{GAROV_PULI}} so'm. Garov puli shartnoma tugagandan keyin mulk shikastlanmaganligi va to'lov qarzdorligi yo'qligi tasdiqlangach, 10 (o'n) ish kuni ichida qaytariladi.
2.7. Ijaraga beruvchi yiliga 1 (bir) martadan ko'p ijara haqini bir tomonlama oshira olmaydi va oshirish miqdori inflyatsiya darajasidan oshmasligi shart (FK 543-modda). Oshirish to'g'risida 30 (o'ttiz) kalendar kun oldin yozma xabar yuboriladi.

3. IJARA MUDDATI VA TOPSHIRISH-QABUL QILISH

3.1. Ijara muddati: {{IJARA_MUDDAT}}. Boshlanish sanasi: {{IJARA_BOSHI}}, tugash sanasi: {{IJARA_TUGASHI}}.
3.2. Ko'chmas mulk uchun ijara muddati 1 (bir) yildan ortiq bo'lsa, shartnoma davlat ro'yxatidan o'tkazilishi shart (FK 540-modda, "Ko'chmas mulkka bo'lgan huquqlarni davlat ro'yxatiga olish to'g'risida"gi qonun).
3.3. Ob'ekt Ijarachiga shartnoma imzolangandan keyin {{TOPSHIRISH_KUN}} kun ichida Qabul-topshirish dalolatnomasi asosida topshiriladi.
3.4. Aktda Ob'ektning holati, jihozlari ro'yxati va o'lchov ko'rsatkichlari (elektr, suv, gaz hisoblagichlari) qayd etiladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraga beruvchi majburdir:
    — Ob'ektni shartnomada belgilangan muddat va sifatda topshirish (FK 538-modda);
    — Ob'ektning kapital ta'mirlanishini o'z hisobidan amalga oshirish (FK 549-modda);
    — Ob'ektga taalluqli barcha hujjatlarni Ijarachiga taqdim etish;
    — Ijara haqini o'z vaqtida to'laganida Ob'ektdan to'siqsiz foydalanishga sharoit yaratish;
    — Ob'ektga taalluqli mulk solig'ini to'lash.

4.2. Ijaraga beruvchi huquqi bor:
    — Ob'ektdan foydalanish ustidan nazorat olib borish (oldindan ogohlantirgan holda, oqilona vaqtda);
    — Shartnoma muhim darajada buzilganda uni bekor qilish.

4.3. Ijarachi majburdir:
    — Ob'ektni faqat shartnomada belgilangan maqsadda ishlatish (FK 545-modda);
    — Ob'ektni ehtiyotkorlik bilan saqlash, joriy ta'mirni o'z hisobidan amalga oshirish;
    — Ijara haqi va kommunal to'lovlarni o'z vaqtida to'lash;
    — Ob'ektni sublease (qayta ijaraga) berish uchun Ijaraga beruvchining yozma roziligini olish (FK 547-modda);
    — Shartnoma tugagach, Ob'ektni asl holatda (tabiiy eskirishni hisobga olgan holda) Qabul-topshirish dalolatnomasi asosida qaytarish.

4.4. Ijarachi huquqi bor:
    — Shartnoma shartlariga muvofiq Ob'ektdan to'sqinliksiz foydalanish;
    — Shartnoma muddati tugagach, agar shartnomani lozim darajada bajargan bo'lsa, yangi muddatga shartnoma tuzishda boshqa shaxslar oldida ustunlik huquqiga ega bo'lish (FK 555-modda).

5. OB'EKTGA O'ZGARTIRISH KIRITISH

5.1. Ijarachi Ob'ektga ajralmas yaxshilash (rekonstruksiya, qayta jihozlash) kiritishi uchun Ijaraga beruvchining yozma roziligini olishi shart.
5.2. Ijaraga beruvchining roziligi bilan amalga oshirilgan ajralmas yaxshilashlar uchun Ijarachi shartnoma tugagach kompensatsiya talab qilish huquqiga ega (FK 553-modda).
5.3. Rozilik olinmasdan kiritilgan ajralmas yaxshilashlar Ijarachi tomonidan kompensatsiya qilinmaydi.

6. JAVOBGARLIK

6.1. Tomonlar shartnoma majburiyatlarini bajarmaganligi yoki lozim darajada bajarmaganligi uchun O'zbekiston Respublikasi qonunchiligi va ushbu shartnomaga muvofiq javobgar bo'ladilar.
6.2. Ijara haqi kechiktirilgan har bir kun uchun Ijarachi Ijaraga beruvchiga kechiktirilgan summaning {{PENYA_FOIZ}}% miqdorida penya to'laydi.
6.3. Ob'ekt o'z vaqtida topshirilmagan har bir kun uchun aybdor Tomon oylik ijara haqining {{PENYA_FOIZ}}% miqdorida penya to'laydi.
6.4. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
6.5. Ijarachi Ob'ektga yetkazilgan zarar (tabiiy eskirishdan tashqari) uchun to'liq javobgar.

7. FORS-MAJOR

7.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, ish tashlash, davlat organlarining oldindan ko'zda tutilmagan qarorlari) majburiyatlarini bajarmaslik yoki kechiktirib bajarish uchun javobgarlikdan ozod etiladilar.
7.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
7.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
7.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

8. SHARTNOMANI BEKOR QILISH

8.1. Shartnoma muddatidan oldin Ijaraga beruvchining talabiga ko'ra sud tartibida bekor qilinadi, agar Ijarachi (FK 559-modda):
    — Ob'ektdan shartnoma shartlariga zid yoki maqsadidan tashqari foydalansa;
    — Ob'ektni jiddiy yomonlashtirsa;
    — Ijara haqini ketma-ket 2 (ikki) marta yoki undan ko'p oy to'lamasa;
    — Kelishilgan kapital ta'mirlanishni amalga oshirmasa.
8.2. Ijarachining talabiga ko'ra shartnoma sud tartibida bekor qilinadi, agar Ijaraga beruvchi (FK 560-modda):
    — Ob'ektni shartnomada belgilangan muddatda topshirmasa yoki foydalanishga to'sqinlik qilsa;
    — Ob'ektda foydalanishga to'sqinlik qiladigan nuqsonlar mavjud bo'lsa;
    — Kapital ta'mirni o'z vaqtida amalga oshirmasa.
8.3. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 30 (o'ttiz) kalendar kun oldin yuborilishi shart, agar shartnomada boshqa muddat belgilanmagan bo'lsa.

9. NIZOLARNI HAL QILISH

9.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
9.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
9.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SUD_SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

10. MAXFIYLIK

10.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri va shaxsiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
10.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.

11. ALOQA VA XABARNOMALAR

11.1. Shartnoma bo'yicha rasmiy xabarnomalar yozma shaklda — qo'lma-qo'l, kuryer, buyurtmali xat yoki Tomonlar tan oladigan elektron pochta orqali yuboriladi.
11.2. Aloqa rekvizitlari: Ijaraga beruvchi — {{ORG_EMAIL}}, {{ORG_TELEFON}}; Ijarachi — {{CP_EMAIL}}, {{CP_TELEFON}}.
11.3. Rekvizitlar o'zgargan taqdirda Tomon 5 (besh) ish kuni ichida boshqa Tomonni xabardor qilishga majbur.

12. ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

12.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
12.2. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.

13. UMUMIY QOIDALAR

13.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, har ikki Tomonning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
13.2. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
13.3. Shartnoma imzolangan kundan kuchga kiradi va belgilangan muddat tugagunga qadar amal qiladi.
13.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi. Davlat ro'yxatidan o'tkazish talab qilinsa, qo'shimcha nusxa tayyorlanadi.
13.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.

14. TOMONLARNING REKVIZITLARI VA IMZOLARI

IJARAGA BERUVCHI:                               IJARACHI:
{{ORG_NOMI}}                                    {{CP_NOMI}}
Manzil: {{ORG_MANZIL}}                          Manzil: {{CP_MANZIL}}
STIR: {{ORG_INN}}                               STIR: {{CP_INN}}
Bank: {{ORG_BANK}}                              Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                              H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                                MFO: {{CP_MFO}}
Tel: {{ORG_TELEFON}}                            Tel: {{CP_TELEFON}}
Email: {{ORG_EMAIL}}                            Email: {{CP_EMAIL}}

Rahbar: {{ORG_RAHBAR}}                          Rahbar: {{CP_RAHBAR}}

_______________ / {{ORG_RAHBAR}} /              _______________ / {{CP_RAHBAR}} /
       M.O'.                                            M.O'.`,
  },
]

@Injectable()
export class TemplatesService {
  constructor(private prisma: PrismaService) {}

  async findAll(orgId: string, query: {
    contractType?: string
    search?:       string
    page?:         number
    limit?:        number
  } = {}) {
    const { contractType, search, page = 1 } = query
    const limit = Math.min(query.limit || 30, 100)

    const where: any = {
      OR: [
        { isSystem: true },
        { organizationId: orgId },
      ],
      ...(contractType ? { contractType } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' as const } } : {}),
    }

    const [total, data] = await Promise.all([
      this.prisma.template.count({ where }),
      this.prisma.template.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: [{ isSystem: 'desc' }, { createdAt: 'desc' }],
        select: {
          id: true, contractType: true, name: true, isSystem: true,
          isPublic: true, organizationId: true, createdAt: true,
        },
      }),
    ])

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } }
  }

  async findOne(id: string) {
    const tpl = await this.prisma.template.findUnique({ where: { id } })
    if (!tpl) throw new NotFoundException('Shablon topilmadi')
    return tpl
  }

  async create(dto: CreateTemplateDto) {
    return this.prisma.template.create({
      data: {
        organizationId: dto.organizationId,
        contractType:   dto.contractType as any,
        name:           dto.name,
        content:        dto.content,
        isSystem:       false,
        isPublic:       dto.isPublic ?? false,
      },
    })
  }

  async update(id: string, orgId: string, dto: UpdateTemplateDto) {
    const tpl = await this.findOne(id)
    if (tpl.isSystem) throw new ForbiddenException('Tizim shablonini o\'zgartirib bo\'lmaydi')
    if (tpl.organizationId !== orgId) throw new ForbiddenException('Ruxsat yo\'q')
    return this.prisma.template.update({ where: { id }, data: dto })
  }

  async remove(id: string, orgId: string) {
    const tpl = await this.findOne(id)
    if (tpl.isSystem) throw new ForbiddenException('Tizim shablonini o\'chirib bo\'lmaydi')
    if (tpl.organizationId !== orgId) throw new ForbiddenException('Ruxsat yo\'q')
    return this.prisma.template.delete({ where: { id } })
  }

  async seedSystemTemplates() {
    for (const t of SYSTEM_TEMPLATES) {
      const exists = await this.prisma.template.findFirst({
        where: { isSystem: true, contractType: t.contractType as any, name: t.name },
      })
      if (!exists) {
        await this.prisma.template.create({
          data: { ...t, contractType: t.contractType as any, isSystem: true, isPublic: true },
        })
      }
    }
  }
}
