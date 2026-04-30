export interface ContractData {
  orgNomi:   string
  orgInn:    string
  orgRahbar: string
  orgBank:   string
  orgHisob:  string
  orgMfo:    string
  orgManzil: string
  cpNomi:    string
  cpInn:     string
  cpRahbar:  string
  cpBank:    string
  cpHisob:   string
  cpMfo:     string
  cpManzil:  string
  raqam:     string
  sana:      string
  shahar:    string
  summa:     string
  summaMatn: string
  extra?:    Record<string, string>
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
      Object.entries(data.extra || {}).map(([k, v]) => [`{{${k}}}`, v || '___'])
    ),
  }

  Object.entries(replacements).forEach(([key, val]) => {
    result = result.replaceAll(key, val)
  })

  return result
}

export const CONTRACT_TEMPLATES: Record<string, string> = {
  OLDI_SOTDI: `OLDI-SOTDI SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (keyingi o'rinlarda "Sotuvchi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Xaridor"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan, ushbu shartnomani tuzdilar:\n\n1. SHARTNOMA PREDMETI\n\n1.1. Sotuvchi Xaridorga tovarlarni sotish, Xaridor esa qabul qilib to'lash majburiyatini oladi.\n1.2. Tovarning nomi, miqdori Spesifikatsiyada ko'rsatiladi.\n\n2. NARX VA TO'LOV\n\n2.1. Umumiy qiymat: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n2.2. To'lov 10 bank kuni ichida bank o'tkazma orqali.\n\n3. YETKAZIB BERISH\n\n3.1. Muddati: 30 kalendar kun ichida.\n\n4. TOMONLARNING REKVIZITLARI\n\nSOTUVCHI:                              XARIDOR:\n{{ORG_NOMI}}                           {{CP_NOMI}}\nINN: {{ORG_INN}}                       INN: {{CP_INN}}\nBank: {{ORG_BANK}}                     Bank: {{CP_BANK}}\nH/r: {{ORG_HISOB}}                     H/r: {{CP_HISOB}}\nMFO: {{ORG_MFO}}                       MFO: {{CP_MFO}}\n\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  XIZMAT: `XIZMAT KO'RSATISH SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (keyingi o'rinlarda "Ijrochi"), {{ORG_RAHBAR}} nomidan, bir tomondan, va {{CP_NOMI}} (keyingi o'rinlarda "Buyurtmachi"), {{CP_RAHBAR}} nomidan, ikkinchi tomondan:\n\n1. SHARTNOMA PREDMETI\n\n1.1. Ijrochi Buyurtmachiga {{XIZMAT_TURI}} xizmatini ko'rsatadi.\n\n2. NARX\n\n2.1. Xizmat qiymati: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n2.2. QQS: {{QQS_HOLAT}}.\n\nIJROCHI:                               BUYURTMACHI:\n{{ORG_NOMI}}                           {{CP_NOMI}}\nINN: {{ORG_INN}}                       INN: {{CP_INN}}\n\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  IJARA: `IJARA SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Ijaraberuvchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Ijarachi), {{CP_RAHBAR}} nomidan:\n\n1. Ijaraberuvchi Ijarachiga {{IJARA_OBYEKT}} ni beradi. Manzil: {{IJARA_MANZIL}}. Maydon: {{IJARA_MAYDON}} kv.m.\n2. Muddati: {{IJARA_BOSHI}} — {{IJARA_OXIRI}}.\n3. Oylik ijara haqi: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n4. Kommunal: {{KOMMUNAL}}.\n\nIJARABERUVCHI:                         IJARACHI:\n{{ORG_NOMI}}                           {{CP_NOMI}}\nINN: {{ORG_INN}}                       INN: {{CP_INN}}\n\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  PUDRAT: `PUDRAT SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Pudratchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Buyurtmachi), {{CP_RAHBAR}} nomidan:\n\n1. Pudratchi {{PUDRAT_ISHI}} ishlarini bajaradi. Manzil: {{PUDRAT_MANZIL}}.\n2. Narx: {{SUMMA}} ({{SUMMA_MATN}}) so'm. To'lov: {{TOLOV_TARTIBI}}.\n3. Muddatlar: {{BOSHLANISH}} — {{TUGALLANISH}}.\n\nPUDRATCHI:                             BUYURTMACHI:\n{{ORG_NOMI}}                           {{CP_NOMI}}\n\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  QOSHIMCHA: `QO'SHIMCHA KELISHUV\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} va {{CP_NOMI}} — {{ASOSIY_SHARTNOMA}} sonli shartnomaga quyidagi o'zgartirishlar kiritildi:\n\n{{OZGARTIRISHLAR}}\n\nBoshqa shartlar o'z kuchida qoladi.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  MOLIYAVIY: `MOLIYAVIY YORDAM SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Qarz beruvchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Qarz oluvchi), {{CP_RAHBAR}} nomidan:\n\n1. Qarz beruvchi {{SUMMA}} ({{SUMMA_MATN}}) so'm foizsiz moliyaviy yordam beradi.\n2. Maqsad: {{MAQSAD}}.\n3. Qaytarish muddati: {{QAYTARISH_MUDDATI}}.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  DAVAL: `DAVAL SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Davalchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Qayta ishlovchi), {{CP_RAHBAR}} nomidan:\n\n1. Davalchi {{XOMASHYO}} ({{MIQDOR}}) ni topshiradi, Qayta ishlovchi {{TAYYOR_MAHSULOT}} ga qayta ishlaydi.\n2. Narx: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n3. Topshirish: {{TOPSHIRISH_SANA}}. Qaytarish: {{QAYTARISH_SANA}}.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  XALQARO: `INTERNATIONAL CONTRACT\nNo. {{RAQAM}}\n\n{{SHAHAR}}                                           "{{SANA}}"\n\n{{ORG_NOMI}} (Seller), represented by {{ORG_RAHBAR}}, and {{CP_NOMI}} (Buyer), represented by {{CP_RAHBAR}}:\n\n1. Seller supplies {{TOVAR}} to Buyer.\n2. Total value: {{SUMMA}} {{VALYUTA}}. Payment: {{TOLOV_SHART}} via {{TOLOV_USUL}}.\n3. Delivery: {{INCOTERMS}}, within {{YETKAZISH_MUDDAT}}.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       Seal                                    Seal`,

  AGENTLIK: `AGENTLIK SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Buyurtmachi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Agent), {{CP_RAHBAR}} nomidan:\n\n1. Buyurtmachi Agentga {{AGENTLIK_VAZIFASI}} vakolatini beradi.\n2. Agentlik mukofoti: {{MUKOFOT}}. To'lov: {{TOLOV_TARTIBI}}.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  TRANSPORT: `TRANSPORT XIZMATLARI SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Tashuvchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Yuk egasi), {{CP_RAHBAR}} nomidan:\n\n1. Tashuvchi yukni {{YUK_JONATISH}} dan {{YUK_YETKAZISH}} ga yetkazadi.\n2. Yuk: {{YUK_TAVSIF}} ({{YUK_OGIRLIK}}).\n3. Narx: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n4. Jo'natish: {{JONATISH_SANA}}. Yetkazish: {{YETKAZISH_MUDDAT}}.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  LIZING: `LIZING SHARTNOMASI\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}} (Lizing beruvchi), {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}} (Lizing oluvchi), {{CP_RAHBAR}} nomidan:\n\n1. Lizing obyekti: {{LIZING_OBYEKT}} (qiymati: {{OBYEKT_QIYMATI}} so'm).\n2. Boshlang'ich to'lov: {{BOSHLANGICH_TOLOV}} so'm.\n3. Oylik to'lov: {{OYLIK_TOLOV}} so'm x {{LIZING_MUDDAT}} oy.\n4. Jami: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,

  BOSHQA: `SHARTNOMA\n№ {{RAQAM}}\n\n{{SHAHAR}} shahri                                    "{{SANA}}"\n\n{{ORG_NOMI}}, {{ORG_RAHBAR}} nomidan, va {{CP_NOMI}}, {{CP_RAHBAR}} nomidan:\n\n1. PREDMET\n\n{{SHARTNOMA_PREDMETI}}\n\n2. NARX: {{SUMMA}} ({{SUMMA_MATN}}) so'm.\nTo'lov: {{TOLOV_TARTIBI}}.\n\n3. BOSHQA SHARTLAR\n\n{{BOSHQA_SHARTLAR}}\n\n{{ORG_NOMI}}                           {{CP_NOMI}}\nINN: {{ORG_INN}}                       INN: {{CP_INN}}\n_________________ /{{ORG_RAHBAR}}/     _________________ /{{CP_RAHBAR}}/\n       M.O.                                    M.O.`,
}
