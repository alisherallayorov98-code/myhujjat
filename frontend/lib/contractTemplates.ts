export type ContractType =
  | 'OLDI_SOTDI' | 'XIZMAT'    | 'IJARA'    | 'PUDRAT'
  | 'QOSHIMCHA'  | 'MOLIYAVIY' | 'DAVAL'    | 'XALQARO'
  | 'AGENTLIK'   | 'TRANSPORT' | 'LIZING'   | 'BOSHQA'

export const CONTRACT_TYPE_CONFIG: Record<ContractType, {
  name:    string
  icon:    string
  color:   string
  bg:      string
  parties: { buyer: string; seller: string }
}> = {
  OLDI_SOTDI: { name: 'Oldi-sotdi',           icon: '🛒', color: 'text-[#2563EB]', bg: 'bg-[#DBEAFE]', parties: { buyer: 'Xaridor',      seller: 'Sotuvchi'       } },
  XIZMAT:     { name: "Xizmat ko'rsatish",    icon: '🔧', color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]', parties: { buyer: 'Buyurtmachi',  seller: 'Ijrochi'        } },
  IJARA:      { name: 'Ijara',                icon: '🏢', color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', parties: { buyer: 'Ijarachi',     seller: 'Ijaraberuvchi'  } },
  PUDRAT:     { name: 'Pudrat',               icon: '🏗️', color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]', parties: { buyer: 'Buyurtmachi',  seller: 'Pudratchi'      } },
  QOSHIMCHA:  { name: "Qo'shimcha",           icon: '📎', color: 'text-[#0891B2]', bg: 'bg-[#CFFAFE]', parties: { buyer: 'Tomon 1',      seller: 'Tomon 2'        } },
  MOLIYAVIY:  { name: 'Moliyaviy yordam',     icon: '💰', color: 'text-[#059669]', bg: 'bg-[#D1FAE5]', parties: { buyer: 'Qarz oluvchi', seller: 'Qarz beruvchi'  } },
  DAVAL:      { name: 'Daval',                icon: '♻️', color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', parties: { buyer: 'Davalchi',     seller: 'Qayta ishlovchi'} },
  XALQARO:    { name: 'Xalqaro',             icon: '🌐', color: 'text-[#1D4ED8]', bg: 'bg-[#DBEAFE]', parties: { buyer: 'Buyer',        seller: 'Seller'         } },
  AGENTLIK:   { name: 'Agentlik',             icon: '🤝', color: 'text-[#9333EA]', bg: 'bg-[#F3E8FF]', parties: { buyer: 'Buyurtmachi',  seller: 'Agent'          } },
  TRANSPORT:  { name: 'Transport',            icon: '🚛', color: 'text-[#EA580C]', bg: 'bg-[#FFEDD5]', parties: { buyer: 'Yuk egasi',    seller: 'Tashuvchi'      } },
  LIZING:     { name: 'Lizing',              icon: '🚗', color: 'text-[#0369A1]', bg: 'bg-[#E0F2FE]', parties: { buyer: 'Lizingchi',    seller: 'Lizingberuvchi' } },
  BOSHQA:     { name: 'Boshqa',              icon: '📄', color: 'text-[#475569]', bg: 'bg-[#F1F5F9]', parties: { buyer: 'Tomon 1',      seller: 'Tomon 2'        } },
}

export interface ContractData {
  orgNomi:    string
  orgInn:     string
  orgRahbar:  string
  orgBank:    string
  orgHisob:   string
  orgMfo:     string
  orgManzil:  string
  cpNomi:     string
  cpInn:      string
  cpRahbar:   string
  cpBank:     string
  cpHisob:    string
  cpMfo:      string
  cpManzil:   string
  raqam:      string
  sana:       string
  shahar:     string
  summa:      string
  summaMatn:  string
  extra?:     Record<string, string>
}

export function fillTemplate(template: string, data: ContractData): string {
  let result = template

  const replacements: Record<string, string> = {
    '{{ORG_NOMI}}':    data.orgNomi    || '___________',
    '{{ORG_INN}}':     data.orgInn     || '___________',
    '{{ORG_RAHBAR}}':  data.orgRahbar  || '___________',
    '{{ORG_BANK}}':    data.orgBank    || '___________',
    '{{ORG_HISOB}}':   data.orgHisob   || '___________',
    '{{ORG_MFO}}':     data.orgMfo     || '___________',
    '{{ORG_MANZIL}}':  data.orgManzil  || '___________',
    '{{CP_NOMI}}':     data.cpNomi     || '___________',
    '{{CP_INN}}':      data.cpInn      || '___________',
    '{{CP_RAHBAR}}':   data.cpRahbar   || '___________',
    '{{CP_BANK}}':     data.cpBank     || '___________',
    '{{CP_HISOB}}':    data.cpHisob    || '___________',
    '{{CP_MFO}}':      data.cpMfo      || '___________',
    '{{CP_MANZIL}}':   data.cpManzil   || '___________',
    '{{RAQAM}}':       data.raqam      || '___',
    '{{SANA}}':        data.sana       || '___________',
    '{{SHAHAR}}':      data.shahar     || 'Toshkent',
    '{{SUMMA}}':       data.summa      || '0',
    '{{SUMMA_MATN}}':  data.summaMatn  || '___________',
    ...Object.fromEntries(
      Object.entries(data.extra || {}).map(([k, v]) => [`{{${k}}}`, v || `___`])
    ),
  }

  Object.entries(replacements).forEach(([key, val]) => {
    result = result.replaceAll(key, val)
  })

  return result
}

export const CONTRACT_TEMPLATES: Record<ContractType, string> = {
  OLDI_SOTDI: `OLDI-SOTDI SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Sotuvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Xaridor"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksi 386, 414–505-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga ushbu shartnoma asosida quyidagi tovarni (keyingi o'rinlarda — "Tovar") mulk huquqi bilan beradi, Xaridor esa Tovarni qabul qilib, narxini shartnomada belgilangan tartibda to'laydi.
1.2. Tovar nomi va tavsifi: spesifikatsiyada ko'rsatiladi.
1.3. Tovar sifati O'zbekiston Respublikasida amal qiluvchi davlat standartlari (O'zDSt), texnik reglamentlar va sanitariya-gigiyena talablariga javob berishi shart (FK 425-modda).
1.4. Sotuvchi Tovarga taalluqli barcha hujjatlarni (sertifikat, pasport, foydalanish bo'yicha qo'llanma) Xaridorga topshirishga majburdir (FK 437-modda).

2. NARX VA TO'LOV TARTIBI

2.1. Tovarning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS amaldagi qonunchilikka muvofiq hisoblanadi (Soliq kodeksi 238-modda).
2.2. Narx shartnoma amal qilish davrida o'zgarmas, agar Tomonlar yozma qo'shimcha kelishuv bilan boshqacha kelishmagan bo'lsa.
2.3. Xaridor Tovarni qabul qilgandan so'ng 10 (o'n) bank ish kuni ichida to'lovni amalga oshiradi, agar Tomonlar boshqacha tartibni kelishmagan bo'lsa.
2.4. To'lov bank ko'chirmasi yo'li bilan, Sotuvchining hisob raqamiga amalga oshiriladi.

3. YETKAZIB BERISH VA QABUL QILISH

3.1. Yetkazib berish muddati: shartnoma imzolanganidan keyin 30 (o'ttiz) kalendar kun ichida.
3.2. Yetkazib berish manzili: Xaridorning yuridik manzili yoki Tomonlar kelishuvi asosida belgilangan joy.
3.3. Tovarni qabul qilish-topshirish dalolatnomasi (akti) imzolanishi bilan yetkazib berish bajarilgan hisoblanadi.
3.4. Xaridor Tovarni qabul qilish vaqtida miqdor va tashqi belgilari bo'yicha tekshiradi. Yashirin nuqsonlar 14 (o'n to'rt) kalendar kun ichida yozma da'vo (pretenziya) bilan bildirilishi shart (FK 462-modda).

4. MULK HUQUQI VA TASODIFIY YO'QOTISH XAVFI

4.1. Tovarga mulk huquqi va tasodifiy yo'qotish xavfi Tovar Xaridorga (yoki uning vakiliga) topshirilgan paytdan o'tadi (FK 187, 423-moddalar).

5. KAFOLAT VA NUQSONLI TOVAR

5.1. Sotuvchi Tovar uchun ishlab chiqaruvchi kafolatini saqlaydi.
5.2. Kafolat muddati ichida nuqson aniqlangan taqdirda Xaridor o'z xohishiga ko'ra quyidagilardan birini talab qilish huquqiga ega (FK 467-modda):
    — Tovar narxini mutanosib kamaytirish;
    — Nuqsonlarni o'rinli muddatda bepul bartaraf etish;
    — Sifatsiz Tovarni shartnoma talablariga mos Tovarga almashtirish yoki shartnomadan voz kechib, to'langan summani qaytarish.

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Sotuvchi majburdir:
    — Tovarni belgilangan muddatda, miqdor, sifat va to'plamga muvofiq topshirish;
    — Tovarga taalluqli barcha texnik va huquqiy hujjatlarni topshirish;
    — Tovarning uchinchi shaxslar huquqlaridan xoli ekanligini kafolatlash (FK 437-modda).

6.2. Xaridor majburdir:
    — Tovarni shartnoma shartlariga muvofiq qabul qilish;
    — Tovar narxini belgilangan muddatda to'lash (FK 458-modda);
    — Aniqlangan nuqsonlar haqida Sotuvchini o'z vaqtida xabardor qilish.

7. JAVOBGARLIK

7.1. Tovarni yetkazib berish kechiktirilgan har bir kun uchun Sotuvchi Xaridorga kechiktirilgan summaning 0,1% miqdorida penya to'laydi (FK 327-modda).
7.2. To'lov kechiktirilgan har bir kun uchun Xaridor Sotuvchiga kechiktirilgan summaning 0,1% miqdorida penya to'laydi.
7.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
7.4. Penya to'lash Tomonlarni asosiy majburiyatdan ozod qilmaydi.

8. FORS-MAJOR

8.1. Tomonlar majburiyatlarini bajara olmaslik uchun, agar bu fors-major (yengib bo'lmaydigan kuchlar) — tabiiy ofat, urush, embargo, davlat organlarining oldindan ko'zda tutilmagan qarorlari natijasida sodir bo'lgan bo'lsa, javobgarlikdan ozod etiladilar.
8.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
8.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.
8.4. Agar fors-major 30 (o'ttiz) kalendar kundan ortiq davom etsa, har bir Tomon shartnomani bekor qilish huquqiga ega.

9. NIZOLARNI HAL QILISH

9.1. Tomonlar barcha nizo va kelishmovchiliklarni dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilishga harakat qiladilar.
9.2. Da'voga javob berish muddati — uni olgandan keyin 30 (o'ttiz) kalendar kun.
9.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

10. MAXFIYLIK

10.1. Tomonlar shartnomaning shartlari va shartnoma ijrosi davomida bir-biriga yetkazilgan tijorat sirini tashkil qiladigan ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
10.2. Maxfiylik majburiyati shartnoma tugaganidan keyin 3 (uch) yil davomida amal qiladi.

11. ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

11.1. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qilish majburiyatini oladilar.
11.2. Tomonlar shartnoma ijrosi uchun zarur bo'lgan shaxsiy ma'lumotlarni "Shaxsga doir ma'lumotlar to'g'risida"gi O'zbekiston Respublikasi qonuni (547-XII-son) talablariga muvofiq qayta ishlashga rozilik bildiradilar.

12. UMUMIY QOIDALAR

12.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda, har ikki Tomonning vakolatli vakillari imzosi va muhri bilan rasmiylashtiriladi.
12.2. Shartnomaning biron-bir bandi bekor yoki bajarib bo'lmas deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
12.3. Shartnoma imzolangan kundan kuchga kiradi va to'liq ijro etilgunga qadar amal qiladi.
12.4. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada, har bir Tomon uchun bittadan, davlat tilida tuzildi.
12.5. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.`,

  XIZMAT: `XIZMAT KO'RSATISH SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijrochi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 703–720-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachining topshirig'iga binoan ushbu shartnomada belgilangan xizmatlarni (keyingi o'rinlarda — "Xizmat") shaxsan yoki o'z mas'uliyati ostida ko'rsatishni o'z zimmasiga oladi, Buyurtmachi esa ko'rsatilgan Xizmatni qabul qilib, narxini to'lashga majburdir (FK 703-modda).
1.2. Xizmat turi va tavsifi: spesifikatsiyada belgilanadi.
1.3. Xizmat ko'rsatish muddati va joyi Tomonlar tomonidan kelishiladi.

2. NARX VA TO'LOV TARTIBI

2.1. Xizmatning umumiy narxi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS amaldagi qonunchilikka muvofiq hisoblanadi (Soliq kodeksi 238-modda).
2.2. Buyurtmachi Xizmat ko'rsatilganidan so'ng 5 (besh) bank ish kuni ichida to'lovni amalga oshiradi.
2.3. To'lov Qabul-topshirish dalolatnomasi imzolanishi asosida bank ko'chirmasi yo'li bilan amalga oshiriladi.

3. XIZMATNI BAJARISH TARTIBI

3.1. Ijrochi Xizmatni shaxsan ko'rsatishi shart, agar shartnomada boshqacha nazarda tutilmagan bo'lsa (FK 705-modda).
3.2. Buyurtmachi Xizmatni ko'rsatish uchun zarur ma'lumot, hujjat va sharoitlarni o'z vaqtida taqdim etishga majburdir.

4. XIZMATNI QABUL QILISH

4.1. Xizmat tugagach, Tomonlar Qabul-topshirish dalolatnomasini (akti) imzolaydilar.
4.2. Buyurtmachi aktni olgandan keyin 5 (besh) ish kuni ichida uni imzolaydi yoki yozma asoslangan e'tirozlarini taqdim etadi. Belgilangan muddatda imzo qo'yilmasa va e'tiroz bildirilmasa, Xizmat to'liq ko'rsatilgan va qabul qilingan hisoblanadi (FK 715-modda).

5. TOMONLARNING HUQUQ VA MAJBURIYATLARI

5.1. Ijrochi majburdir:
    — Xizmatni belgilangan muddat va sifatda ko'rsatish;
    — Buyurtmachining qonuniy ko'rsatmalariga rioya qilish;
    — Xizmat ko'rsatish jarayonida olingan ma'lumotlarning maxfiyligini saqlash.

5.2. Buyurtmachi majburdir:
    — Xizmat narxini belgilangan muddat va tartibda to'lash;
    — Xizmatni qabul qilish va akt imzolash;
    — Xizmat ko'rsatish uchun zarur sharoit, hujjat va ma'lumotlarni taqdim etish.

6. JAVOBGARLIK

6.1. Xizmat muddatdan kechiktirilgan har bir kun uchun Ijrochi Buyurtmachiga shartnoma summasining 0,1% miqdorida penya to'laydi.
6.2. To'lov kechiktirilgan har bir kun uchun Buyurtmachi Ijrochiga kechiktirilgan summaning 0,1% miqdorida penya to'laydi.
6.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).

7. FORS-MAJOR

7.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, davlat organlarining oldindan ko'zda tutilmagan qarorlari) javobgarlikdan ozod etiladilar.
7.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni yozma ravishda xabardor qilishi shart.
7.3. Fors-major holati O'zbekiston Respublikasi Savdo-sanoat palatasi yoki vakolatli organ tomonidan beriladigan rasmiy guvohnoma bilan tasdiqlanadi.

8. SHARTNOMANI BEKOR QILISH

8.1. Buyurtmachi xizmat ko'rsatishdan istalgan vaqtda voz kechishi mumkin, ammo Ijrochiga bu paytgacha haqiqatan ko'rsatilgan Xizmat uchun haq to'lashi va aniq zararlarni qoplashi shart (FK 718-modda).
8.2. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

9. NIZOLARNI HAL QILISH

9.1. Tomonlar barcha nizolarni dastlab muzokaralar va da'vo tartibida hal qilishga harakat qiladilar.
9.2. Da'voga javob berish muddati — 30 (o'ttiz) kalendar kun.
9.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SHAHAR}} shahri Iqtisodiy sudi tomonidan, O'zbekiston Respublikasi qonunchiligi asosida ko'rib chiqiladi.

10. MAXFIYLIK, ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

10.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri va boshqa maxfiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar (3 yil davomida).
10.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qiladilar.
10.3. Shaxsiy ma'lumotlar "Shaxsga doir ma'lumotlar to'g'risida"gi qonun (547-XII-son) talablariga muvofiq qayta ishlanadi.

11. UMUMIY QOIDALAR

11.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda rasmiylashtiriladi.
11.2. Shartnomaning biron-bir bandi bekor deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
11.3. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
11.4. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.`,

  IJARA: `IJARA SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijaraga beruvchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Ijarachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 535–595-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraga beruvchi Ijarachiga ushbu shartnoma asosida haq evaziga vaqtincha egalik qilish va foydalanish uchun quyidagi mulkni (keyingi o'rinlarda — "Ob'ekt") topshiradi (FK 535-modda).
1.2. Ob'ektning tavsifi va manzili: spesifikatsiyada belgilanadi.
1.3. Ob'ektning maqsadi (foydalanish turi): kelishilgan tartibda.
1.4. Ijaraga beruvchi Ob'ektga mulk huquqiga ega ekanligini va Ob'ektni ijaraga berishga to'siq bo'ladigan uchinchi shaxslar huquqlari mavjud emasligini kafolatlaydi (FK 536-modda).

2. IJARA MUDDATI

2.1. Ijara muddati Tomonlar kelishuviga ko'ra belgilanadi.
2.2. Ko'chmas mulk uchun ijara muddati 1 (bir) yildan ortiq bo'lsa, shartnoma davlat ro'yxatidan o'tkazilishi shart (FK 540-modda).

3. IJARA HAQI VA TO'LOV TARTIBI

3.1. Oylik ijara haqi: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS amaldagi qonunchilikka muvofiq hisoblanadi.
3.2. Ijara haqi har oyning 5-sanasigacha bank ko'chirmasi orqali to'lanadi.
3.3. Ijaraga beruvchi yiliga 1 (bir) martadan ko'p ijara haqini bir tomonlama oshira olmaydi (FK 543-modda). Oshirish to'g'risida 30 (o'ttiz) kalendar kun oldin yozma xabar yuboriladi.

4. TOMONLARNING HUQUQ VA MAJBURIYATLARI

4.1. Ijaraga beruvchi majburdir:
    — Ob'ektni shartnomada belgilangan muddat va sifatda topshirish (FK 538-modda);
    — Ob'ektning kapital ta'mirlanishini o'z hisobidan amalga oshirish (FK 549-modda);
    — Ob'ektga taalluqli mulk solig'ini to'lash.

4.2. Ijarachi majburdir:
    — Ob'ektni faqat shartnomada belgilangan maqsadda ishlatish (FK 545-modda);
    — Joriy ta'mirni o'z hisobidan amalga oshirish;
    — Ijara haqi va kommunal to'lovlarni o'z vaqtida to'lash;
    — Ob'ektni sublease (qayta ijaraga) berish uchun yozma rozilik olish (FK 547-modda);
    — Shartnoma tugagach, Ob'ektni asl holatda qaytarish.

5. JAVOBGARLIK

5.1. Ijara haqi kechiktirilgan har bir kun uchun Ijarachi Ijaraga beruvchiga kechiktirilgan summaning 0,1% miqdorida penya to'laydi.
5.2. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).
5.3. Ijarachi Ob'ektga yetkazilgan zarar (tabiiy eskirishdan tashqari) uchun to'liq javobgar.

6. FORS-MAJOR

6.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, davlat organlarining oldindan ko'zda tutilmagan qarorlari) javobgarlikdan ozod etiladilar.
6.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni xabardor qilishi shart.

7. SHARTNOMANI BEKOR QILISH

7.1. Shartnoma muddatidan oldin Ijaraga beruvchining talabiga ko'ra sud tartibida bekor qilinadi, agar Ijarachi (FK 559-modda):
    — Ob'ektdan shartnoma shartlariga zid yoki maqsadidan tashqari foydalansa;
    — Ob'ektni jiddiy yomonlashtirsa;
    — Ijara haqini ketma-ket 2 (ikki) marta yoki undan ko'p oy to'lamasa.
7.2. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 30 (o'ttiz) kalendar kun oldin yuborilishi shart.

8. NIZOLARNI HAL QILISH

8.1. Nizolar dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilinadi.
8.2. Da'voga javob berish muddati — 30 (o'ttiz) kalendar kun.
8.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SHAHAR}} shahri Iqtisodiy sudi tomonidan ko'rib chiqiladi.

9. MAXFIYLIK, ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

9.1. Tomonlar tijorat siri va shaxsiy ma'lumotlarni uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar.
9.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qiladilar.
9.3. Shaxsiy ma'lumotlar "Shaxsga doir ma'lumotlar to'g'risida"gi qonun (547-XII-son) talablariga muvofiq qayta ishlanadi.

10. UMUMIY QOIDALAR

10.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda rasmiylashtiriladi.
10.2. Shartnomaning biron-bir bandi bekor deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
10.3. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
10.4. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.`,

  PUDRAT: `PUDRAT SHARTNOMASI

№ {{RAQAM}}

{{SHAHAR}} sh.                                    "{{SANA}}"

{{ORG_NOMI}}, STIR: {{ORG_INN}}, ustav asosida ish yurituvchi rahbari {{ORG_RAHBAR}} nomidan (keyingi o'rinlarda — "Pudratchi"), bir tomondan, va {{CP_NOMI}}, STIR: {{CP_INN}}, ustav asosida ish yurituvchi rahbari {{CP_RAHBAR}} nomidan (keyingi o'rinlarda — "Buyurtmachi"), ikkinchi tomondan, birgalikda — "Tomonlar", har biri alohida — "Tomon", deb yuritiladigan, O'zbekiston Respublikasi Fuqarolik kodeksining 631–704-moddalariga muvofiq quyidagi shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga binoan ushbu shartnoma va loyiha-smeta hujjatlari (LSH) asosida ushbu shartnomada belgilangan ishlarni (keyingi o'rinlarda — "Ishlar") bajarishni o'z zimmasiga oladi, Buyurtmachi esa Ishlarni qabul qilib, ularning narxini to'lashga majburdir (FK 666-modda).
1.2. Ishlar turi va hajmi: spesifikatsiyada belgilanadi.
1.3. Ish manzili va shartlari Tomonlar tomonidan kelishilgan tartibda.
1.4. Pudratchi Ishlarni shaxsan yoki o'z mas'uliyati ostida jalb qilingan subpudratchilar orqali bajarishi mumkin (FK 670-modda).

2. NARX VA TO'LOV TARTIBI

2.1. Ishlarning umumiy qiymati: {{SUMMA}} so'm ({{SUMMA_MATN}}). QQS amaldagi qonunchilikka muvofiq hisoblanadi.
2.2. Narx LSH asosida belgilanadi va shartnoma amal qilish davrida o'zgarmas (FK 668-modda).
2.3. To'lov tartibi (bosqichma-bosqich):
    — 30% — avans, shartnoma imzolangandan keyin 5 ish kuni ichida;
    — 40% — oraliq, ishlar 50% bajarilganligi haqida bajarilgan ishlar dalolatnomasi imzolangandan keyin;
    — 30% — yakuniy, qabul-topshirish dalolatnomasi imzolangandan keyin.
2.4. Qo'shimcha ishlar Buyurtmachining yozma roziligi bilan, alohida smeta asosida bajariladi (FK 670-modda).

3. ISH MUDDATLARI

3.1. Ishlar boshlanish sanasi va tugallanish sanasi spesifikatsiyada belgilanadi.
3.2. Muddatlar Tomonlar yozma kelishuvi asosida uzaytirilishi mumkin (ob-havo, materiallarni kech yetkazib berish, fors-major va h.k.).

4. ISHLARNI QABUL QILISH

4.1. Bosqichli Ishlar bajarilgach, Pudratchi Buyurtmachiga bajarilgan ishlar dalolatnomasi taqdim etadi.
4.2. Buyurtmachi 10 (o'n) ish kuni ichida hujjatlarni ko'rib, imzolaydi yoki yozma asoslangan e'tirozlarini bildiradi. Belgilangan muddatda imzo qo'yilmasa va e'tiroz bildirilmasa, Ishlar to'liq qabul qilingan hisoblanadi (FK 690-modda).

5. SIFAT VA KAFOLAT

5.1. Bajarilgan Ishlar O'zRespublikasi ShNQ, texnik reglamentlar va shartnoma talablariga muvofiq bo'lishi shart.
5.2. Pudratchi Ishlarga 24 (yigirma to'rt) oy kafolat beradi (FK 694-modda).
5.3. Yashirin nuqsonlar uchun Pudratchining javobgarligi qabul qilingandan keyin 5 (besh) yil davomida saqlanadi (FK 695-modda).

6. TOMONLARNING HUQUQ VA MAJBURIYATLARI

6.1. Pudratchi majburdir:
    — Ishlarni shartnoma muddati va sifatda bajarish;
    — Xavfsizlik va atrof-muhit muhofazasi normalariga rioya qilish;
    — Ishlarda ishlatiladigan materiallar uchun javobgar bo'lish (FK 671-modda).

6.2. Buyurtmachi majburdir:
    — To'lovlarni shartnomada belgilangan muddatda amalga oshirish;
    — Pudratchiga LSH va ish maydoniga kirishni ta'minlash;
    — Bajarilgan ishlarni belgilangan muddatlarda qabul qilish.

7. JAVOBGARLIK

7.1. Ishlarni bajarish kechiktirilgan har bir kun uchun Pudratchi shartnoma summasining 0,1% miqdorida penya to'laydi.
7.2. To'lov kechiktirilgan har bir kun uchun Buyurtmachi kechiktirilgan summaning 0,1% miqdorida penya to'laydi.
7.3. Penya, neustoyka va ustamaning umumiy summasi shartnoma summasidan oshmasligi shart (FK 326-modda).

8. FORS-MAJOR

8.1. Tomonlar fors-major holatlarida (tabiiy ofat, urush, embargo, davlat organlarining qarorlari) javobgarlikdan ozod etiladilar.
8.2. Fors-major holatiga uchragan Tomon, holat boshlangandan keyin 7 (yetti) kalendar kun ichida boshqa Tomonni xabardor qilishi shart.
8.3. Fors-major holati O'zR Savdo-sanoat palatasi guvohnoma bilan tasdiqlanadi.

9. SHARTNOMANI BEKOR QILISH

9.1. Buyurtmachi shartnomadan istalgan vaqtda voz kechishi mumkin, ammo bu paytgacha bajarilgan ish uchun haq to'lashi va zararlarni qoplashi shart (FK 715-modda).
9.2. Bir tomonlama bekor qilish to'g'risidagi yozma xabarnoma 14 (o'n to'rt) kalendar kun oldin yuborilishi shart.

10. NIZOLARNI HAL QILISH

10.1. Nizolar dastlab muzokaralar va da'vo (pretenziya) tartibida hal qilinadi.
10.2. Da'voga javob berish muddati — 30 (o'ttiz) kalendar kun.
10.3. Agar nizo da'vo tartibida hal qilinmasa, nizo {{SHAHAR}} shahri Iqtisodiy sudi tomonidan ko'rib chiqiladi.

11. MAXFIYLIK, ANTIKORRUPTSIYA VA SHAXSIY MA'LUMOTLAR

11.1. Tomonlar shartnoma ijrosi davomida olingan tijorat siri va loyiha hujjatlarini uchinchi shaxslarga oshkor qilmaslik majburiyatini oladilar (3 yil davomida).
11.2. Tomonlar O'zbekiston Respublikasining "Korruptsiyaga qarshi kurashish to'g'risida"gi qonuniga rioya qiladilar.
11.3. Shaxsiy ma'lumotlar "Shaxsga doir ma'lumotlar to'g'risida"gi qonun (547-XII-son) talablariga muvofiq qayta ishlanadi.

12. UMUMIY QOIDALAR

12.1. Shartnomaga barcha o'zgartish va qo'shimchalar yozma shaklda rasmiylashtiriladi.
12.2. Shartnomaning biron-bir bandi bekor deb topilsa, qolgan qismlari o'z kuchini saqlaydi.
12.3. Shartnoma 2 (ikki) bir xil yuridik kuchga ega nusxada davlat tilida tuzildi.
12.4. Shartnomada nazarda tutilmagan masalalarda Tomonlar O'zbekiston Respublikasi qonunchiligiga rioya qiladilar.`,

  QOSHIMCHA: `QO'SHIMCHA KELISHUV
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}}, {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}}, {{CP_RAHBAR}} nomidan, ikkinchi tomondan, — {{ASOSIY_SHARTNOMA}} sonli shartnomaga quyidagi qo'shimchalarni kiritish haqida kelishdilar:

1. O'ZGARTIRISHLAR

{{OZGARTIRISHLAR}}

2. QOLGAN SHARTLAR

2.1. Ushbu qo'shimcha kelishuv imzolanmagan barcha boshqa shartlar o'z kuchida qoladi.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  MOLIYAVIY: `MOLIYAVIY YORDAM SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Qarz beruvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Qarz oluvchi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:

1. SHARTNOMA PREDMETI

1.1. Qarz beruvchi Qarz oluvchiga {{SUMMA}} ({{SUMMA_MATN}}) so'm miqdorida foizsiz moliyaviy yordam beradi.
1.2. Maqsad: {{MAQSAD}}.

2. QAYTARISH MUDDATI

2.1. Qarz oluvchi summani {{QAYTARISH_MUDDATI}} gacha qaytaradi.
2.2. Muddatidan oldin qaytarish mumkin.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  DAVAL: `DAVAL SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Davalchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Qayta ishlovchi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:

1. SHARTNOMA PREDMETI

1.1. Davalchi {{XOMASHYO}} ni Qayta ishlovchiga topshiradi.
1.2. Qayta ishlovchi ushbu xomashyoni {{TAYYOR_MAHSULOT}} ga qayta ishlaydi.
1.3. Miqdor: {{MIQDOR}}.

2. NARX

2.1. Qayta ishlash xizmati narxi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.

3. MUDDATLAR

3.1. Xomashyo topshirish: {{TOPSHIRISH_SANA}}.
3.2. Tayyor mahsulot qaytarish: {{QAYTARISH_SANA}}.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  XALQARO: `INTERNATIONAL CONTRACT
No. {{RAQAM}}

{{SHAHAR}}                                           "{{SANA}}"

{{ORG_NOMI}} (hereinafter "Seller"), represented by {{ORG_RAHBAR}}, on the one hand, and {{CP_NOMI}} (hereinafter "Buyer"), represented by {{CP_RAHBAR}}, on the other hand, have concluded this contract:

1. SUBJECT OF CONTRACT

1.1. Seller agrees to supply {{TOVAR}} to Buyer.
1.2. Quantity and specifications are defined in the Specification attached hereto.

2. PRICE AND PAYMENT

2.1. Total contract value: {{SUMMA}} {{VALYUTA}}.
2.2. Payment terms: {{TOLOV_SHART}}.
2.3. Payment method: {{TOLOV_USUL}}.

3. DELIVERY

3.1. Delivery terms: {{INCOTERMS}}.
3.2. Delivery period: {{YETKAZISH_MUDDAT}}.

4. GOVERNING LAW

4.1. This contract shall be governed by the laws of the Republic of Uzbekistan.

PARTIES:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       Seal                                    Seal`,

  AGENTLIK: `AGENTLIK SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Buyurtmachi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Agent"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:

1. SHARTNOMA PREDMETI

1.1. Buyurtmachi Agent ga {{AGENTLIK_VAZIFASI}} vakolatini beradi.
1.2. Agent o'z nomidan, lekin Buyurtmachi hisobiga harakat qiladi.

2. MUKOFOT

2.1. Agentlik mukofoti: {{MUKOFOT}}.
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}.

3. AGENT MAJBURIYATLARI

3.1. Buyurtmachi manfaatlarini himoya qilish.
3.2. Hisobot berish.
3.3. Maxfiylikni saqlash.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  TRANSPORT: `TRANSPORT XIZMATLARI SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Tashuvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Yuk egasi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:

1. SHARTNOMA PREDMETI

1.1. Tashuvchi Yuk egasining yukini {{YUK_JONATISH}} dan {{YUK_YETKAZISH}} ga yetkazib beradi.
1.2. Yuk: {{YUK_TAVSIF}}.
1.3. Og'irlik/hajm: {{YUK_OGIRLIK}}.

2. NARX

2.1. Transport xizmati narxi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.

3. MUDDATLAR

3.1. Yukni jo'natish sanasi: {{JONATISH_SANA}}.
3.2. Yetkazib berish muddati: {{YETKAZISH_MUDDAT}}.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  LIZING: `LIZING SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Lizing beruvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Lizing oluvchi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:

1. SHARTNOMA PREDMETI

1.1. Lizing beruvchi {{LIZING_OBYEKT}} ni Lizing oluvchiga moliyaviy lizing shartlarida beradi.
1.2. Obyekt qiymati: {{OBYEKT_QIYMATI}} so'm.

2. LIZING TO'LOVLARI

2.1. Boshlang'ich to'lov: {{BOSHLANGICH_TOLOV}} so'm.
2.2. Oylik to'lov: {{OYLIK_TOLOV}} so'm.
2.3. Lizing muddati: {{LIZING_MUDDAT}} oy.
2.4. Jami to'lov: {{SUMMA}} ({{SUMMA_MATN}}) so'm.

3. MULKCHILIK

3.1. Lizing muddati davomida obyekt Lizing beruvchi mulki hisoblanadi.
3.2. Barcha to'lovlar amalga oshirilgandan so'ng Lizing oluvchi mulkiga o'tadi.

TOMONLAR:
{{ORG_NOMI}}                           {{CP_NOMI}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  BOSHQA: `SHARTNOMA
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}}, {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}}, {{CP_RAHBAR}} nomidan, ikkinchi tomondan, quyidagilar haqida ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

{{SHARTNOMA_PREDMETI}}

2. NARX VA TO'LOV

2.1. Umumiy summa: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}.

3. BOSHQA SHARTLAR

{{BOSHQA_SHARTLAR}}

4. TOMONLARNING REKVIZITLARI

{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,
}

export const CONTRACT_EXTRA_FIELDS: Partial<Record<ContractType, {
  key:         string
  label:       string
  placeholder: string
  required?:   boolean
}[]>> = {
  XIZMAT: [
    { key: 'XIZMAT_TURI', label: 'Xizmat turi',   placeholder: "Dasturiy ta'minot ishlab chiqish", required: true },
    { key: 'QQS_HOLAT',   label: 'QQS holati',    placeholder: 'QQS hisoblanadi / hisoblanmaydi' },
  ],
  IJARA: [
    { key: 'IJARA_OBYEKT', label: 'Ijara obyekti',      placeholder: 'Ofis xonasi, sklad...', required: true },
    { key: 'IJARA_MANZIL', label: 'Obyekt manzili',     placeholder: "To'liq manzil", required: true },
    { key: 'IJARA_MAYDON', label: 'Maydon (kv.m)',      placeholder: '50' },
    { key: 'IJARA_BOSHI',  label: 'Ijara boshlanishi',  placeholder: '01.01.2025' },
    { key: 'IJARA_OXIRI',  label: 'Ijara tugashi',      placeholder: '31.12.2025' },
    { key: 'KOMMUNAL',     label: "Kommunal to'lovlar", placeholder: "Ijarachi tomonidan to'lanadi" },
  ],
  PUDRAT: [
    { key: 'PUDRAT_ISHI',   label: 'Bajariladigan ish',  placeholder: "Ta'mirlash, qurilish...", required: true },
    { key: 'PUDRAT_MANZIL', label: 'Ish manzili',        placeholder: "To'liq manzil" },
    { key: 'TOLOV_TARTIBI', label: "To'lov tartibi",     placeholder: "50% oldin, 50% keyin" },
    { key: 'BOSHLANISH',    label: 'Boshlanish sanasi',  placeholder: '01.01.2025' },
    { key: 'TUGALLANISH',   label: 'Tugallanish sanasi', placeholder: '01.03.2025' },
  ],
  QOSHIMCHA: [
    { key: 'ASOSIY_SHARTNOMA', label: 'Asosiy shartnoma raqami',          placeholder: 'SH-2024/01-001', required: true },
    { key: 'OZGARTIRISHLAR',   label: "Kiritilayotgan o'zgartirishlar",   placeholder: "Narx o'zgarishi...", required: true },
  ],
  MOLIYAVIY: [
    { key: 'MAQSAD',            label: 'Moliyaviy yordam maqsadi', placeholder: 'Ishlab chiqarish uchun', required: true },
    { key: 'QAYTARISH_MUDDATI', label: 'Qaytarish muddati',        placeholder: '31.12.2025', required: true },
  ],
  DAVAL: [
    { key: 'XOMASHYO',        label: 'Xomashyo nomi',       placeholder: 'Paxta, un...', required: true },
    { key: 'TAYYOR_MAHSULOT', label: 'Tayyor mahsulot',      placeholder: 'Ip, non...',   required: true },
    { key: 'MIQDOR',          label: 'Miqdor',               placeholder: '1000 kg' },
    { key: 'TOPSHIRISH_SANA', label: 'Xomashyo topshirish', placeholder: '01.01.2025' },
    { key: 'QAYTARISH_SANA',  label: 'Mahsulot qaytarish',  placeholder: '15.01.2025' },
  ],
  XALQARO: [
    { key: 'TOVAR',            label: 'Tovar nomi',        placeholder: 'Cotton fiber', required: true },
    { key: 'VALYUTA',          label: 'Valyuta',           placeholder: 'USD',          required: true },
    { key: 'TOLOV_SHART',      label: "To'lov sharti",     placeholder: '100% prepayment' },
    { key: 'TOLOV_USUL',       label: "To'lov usuli",      placeholder: 'Bank transfer, LC' },
    { key: 'INCOTERMS',        label: 'Incoterms',         placeholder: 'FOB, CIF, EXW...' },
    { key: 'YETKAZISH_MUDDAT', label: 'Delivery period',   placeholder: '30 days from payment' },
  ],
  AGENTLIK: [
    { key: 'AGENTLIK_VAZIFASI', label: 'Agentlik vazifasi', placeholder: 'Tovar sotish, mijoz topish...', required: true },
    { key: 'MUKOFOT',           label: 'Mukofot miqdori',   placeholder: "5% yoki 500,000 so'm", required: true },
    { key: 'TOLOV_TARTIBI',     label: "To'lov tartibi",    placeholder: "Har oyda, sotish bo'yicha" },
  ],
  TRANSPORT: [
    { key: 'YUK_JONATISH',     label: "Jo'natish joyi",     placeholder: 'Toshkent', required: true },
    { key: 'YUK_YETKAZISH',    label: 'Yetkazish joyi',     placeholder: 'Samarqand', required: true },
    { key: 'YUK_TAVSIF',       label: 'Yuk tavsifi',        placeholder: 'Un, 50 qop' },
    { key: 'YUK_OGIRLIK',      label: "Og'irlik/hajm",      placeholder: '2500 kg' },
    { key: 'JONATISH_SANA',    label: "Jo'natish sanasi",   placeholder: '01.01.2025' },
    { key: 'YETKAZISH_MUDDAT', label: 'Yetkazish muddati',  placeholder: '3 kun' },
  ],
  LIZING: [
    { key: 'LIZING_OBYEKT',     label: 'Lizing obyekti',         placeholder: 'Avtomobil, uskuna...', required: true },
    { key: 'OBYEKT_QIYMATI',    label: 'Obyekt qiymati',         placeholder: '100,000,000' },
    { key: 'BOSHLANGICH_TOLOV', label: "Boshlang'ich to'lov",    placeholder: '20,000,000' },
    { key: 'OYLIK_TOLOV',       label: "Oylik to'lov",           placeholder: '5,000,000' },
    { key: 'LIZING_MUDDAT',     label: 'Lizing muddati (oy)',    placeholder: '24' },
  ],
  BOSHQA: [
    { key: 'SHARTNOMA_PREDMETI', label: 'Shartnoma predmeti', placeholder: 'Batafsil yozing...', required: true },
    { key: 'TOLOV_TARTIBI',      label: "To'lov tartibi",     placeholder: "Bank o'tkazma orqali" },
    { key: 'BOSHQA_SHARTLAR',    label: 'Boshqa shartlar',    placeholder: "Qo'shimcha shartlar..." },
  ],
}
