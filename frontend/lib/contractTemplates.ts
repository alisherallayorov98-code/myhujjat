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

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Sotuvchi" deb yuritiladi), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Xaridor" deb yuritiladi), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Sotuvchi Xaridorga tovarlarni sotish, Xaridor esa ushbu tovarlarni qabul qilib olish va to'lash majburiyatini oladi.
1.2. Tovarning nomi, miqdori va narxi ushbu shartnomaga ilova qilinadigan Spesifikatsiyada ko'rsatiladi.
1.3. Tovarlar sifati amaldagi standartlar va texnik shartlarga muvofiq bo'lishi kerak.

2. TOVAR NARXI VA UMUMIY SUMMA

2.1. Ushbu shartnoma bo'yicha tovarlarning umumiy qiymati {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. Narx O'zbekiston Respublikasi milliy valyutasida — so'mda belgilangan.
2.3. QQS amaldagi qonunchilikka muvofiq hisoblab qo'shiladi.

3. TO'LOV TARTIBI

3.1. Xaridor tovarni qabul qilib olgandan so'ng 10 (o'n) bank ishi kuni ichida to'lovni amalga oshiradi.
3.2. To'lov bank o'tkazma yo'li bilan amalga oshiriladi.

4. TOVARNI YETKAZIB BERISH

4.1. Tovarni yetkazib berish muddati: shartnoma imzolanganidan keyin 30 (o'ttiz) kalendar kun ichida.
4.2. Yetkazib berish joyi: Xaridorning yuridik manzili yoki kelishilgan joy.

5. TOMONLARNING HUQUQ VA MAJBURIYATLARI

5.1. Sotuvchi:
— belgilangan muddatda va sifatda tovar yetkazib berish;
— tovar bilan birga barcha kerakli hujjatlarni taqdim etish.

5.2. Xaridor:
— tovarni belgilangan muddatda qabul qilish;
— to'lovni o'z vaqtida amalga oshirish.

6. MAS'ULIYAT

6.1. To'lovni kechiktirganlik uchun har kun uchun 0,1% miqdorida penya.
6.2. Tovar yetkazishni kechiktirganlik uchun har kun uchun 0,1% miqdorida penya.

7. FORS-MAJOR

7.1. Tomonlar nazoratidan tashqari holatlarda majburiyatlardan ozod etiladi.

8. NIZOLARNI HAL ETISH

8.1. Nizolar muzokaralar yo'li bilan hal etiladi.
8.2. Kelishilmasa, O'zbekiston Respublikasi sudida ko'rib chiqiladi.

9. SHARTNOMA MUDDATI

9.1. Shartnoma imzolanganidan boshlab kuchga kiradi va majburiyatlar to'liq bajarilguncha amal qiladi.

10. TOMONLARNING REKVIZITLARI

SOTUVCHI:                              XARIDOR:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}
Manzil: {{ORG_MANZIL}}                 Manzil: {{CP_MANZIL}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  XIZMAT: `XIZMAT KO'RSATISH SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Ijrochi" deb yuritiladi), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi" deb yuritiladi), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijrochi Buyurtmachiga {{XIZMAT_TURI}} xizmatini ko'rsatish, Buyurtmachi esa ushbu xizmat uchun to'lov amalga oshirish majburiyatini oladi.
1.2. Xizmat ko'rsatish muddati va hajmi kelishilgan tartibda belgilanadi.

2. SHARTNOMA NARXI

2.1. Xizmat ko'rsatishning umumiy qiymati {{SUMMA}} ({{SUMMA_MATN}}) so'mni tashkil etadi.
2.2. QQS {{QQS_HOLAT}}.

3. TO'LOV TARTIBI

3.1. Buyurtmachi xizmat ko'rsatilganidan so'ng 5 (besh) bank ishi kuni ichida to'lov amalga oshiradi.
3.2. To'lov aktni imzolash asosida bank o'tkazma yo'li bilan amalga oshiriladi.

4. IJROCHI MAJBURIYATLARI

4.1. Sifatli va o'z vaqtida xizmat ko'rsatish.
4.2. Buyurtmachining talablarini hisobga olish.
4.3. Maxfiy ma'lumotlarni oshkor etmaslik.

5. BUYURTMACHI MAJBURIYATLARI

5.1. Zarur ma'lumotlar va materiallarni o'z vaqtida taqdim etish.
5.2. Bajarilgan ishni qabul qilish va aktni imzolash.
5.3. Haq to'lash.

6. TOMONLARNING REKVIZITLARI

IJROCHI:                               BUYURTMACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  IJARA: `IJARA SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Ijaraberuvchi" deb yuritiladi), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Ijarachi" deb yuritiladi), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Ijaraberuvchi Ijarachiga {{IJARA_OBYEKT}} ni vaqtinchalik foydalanishga beradi.
1.2. Manzil: {{IJARA_MANZIL}}.
1.3. Maydon: {{IJARA_MAYDON}} kv.m.

2. IJARA MUDDATI

2.1. Ijara muddati: {{IJARA_BOSHI}} dan {{IJARA_OXIRI}} gacha.
2.2. Tomonlar kelishgan holda ijara muddati uzaytirilishi mumkin.

3. IJARA HAQI

3.1. Oylik ijara haqi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
3.2. To'lov har oyning 5 kunigacha amalga oshiriladi.
3.3. Kommunal to'lovlar: {{KOMMUNAL}}.

4. TOMONLAR MAJBURIYATLARI

4.1. Ijaraberuvchi:
— mulkni kelishilgan holda topshirish;
— kapital ta'mirlash.

4.2. Ijarachi:
— mulkdan maqsadga muvofiq foydalanish;
— joriy ta'mirlash;
— o'z vaqtida ijara haqi to'lash.

5. TOMONLARNING REKVIZITLARI

IJARABERUVCHI:                         IJARACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

  PUDRAT: `PUDRAT SHARTNOMASI
№ {{RAQAM}}

{{SHAHAR}} shahri                                    "{{SANA}}"

{{ORG_NOMI}} (keyingi o'rinlarda "Pudratchi" deb yuritiladi), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi" deb yuritiladi), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:

1. SHARTNOMA PREDMETI

1.1. Pudratchi Buyurtmachining topshirig'iga ko'ra {{PUDRAT_ISHI}} ishlarini bajarish, Buyurtmachi esa natijani qabul qilib to'lash majburiyatini oladi.
1.2. Ish manzili: {{PUDRAT_MANZIL}}.

2. NARX VA TO'LOV

2.1. Umumiy narx: {{SUMMA}} ({{SUMMA_MATN}}) so'm.
2.2. To'lov tartibi: {{TOLOV_TARTIBI}}.

3. MUDDATLAR

3.1. Boshlanish: {{BOSHLANISH}}.
3.2. Tugallanish: {{TUGALLANISH}}.

4. TOMONLARNING REKVIZITLARI

PUDRATCHI:                             BUYURTMACHI:
{{ORG_NOMI}}                           {{CP_NOMI}}
INN: {{ORG_INN}}                       INN: {{CP_INN}}
Bank: {{ORG_BANK}}                     Bank: {{CP_BANK}}
H/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}
MFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}

_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/
       M.O.                                    M.O.`,

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
