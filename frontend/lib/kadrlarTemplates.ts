export interface XodimData {
  orgNomi:         string
  orgInn:          string
  orgRahbar:       string
  orgManzil?:      string
  xodimIsm:        string
  xodimJshshir?:   string
  xodimPassport?:  string
  xodimLavozim:    string
  xodimBolim?:     string
  xodimMaosh:      string
  xodimMaoshMatn?: string
  xodimIshBoshi:   string
  xodimTel?:       string
  raqam:           string
  sana:            string
  extra?:          Record<string, string>
}

// ============================================
// ISHGA QABUL BUYRUG'I
// ============================================
export function generateIshgaQabulBuyruq(d: XodimData): string {
  return `BUYRUQ
№ ${d.raqam}

"${d.sana}"                                         ${d.orgNomi}

XODIMNI ISHGA QABUL QILISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimIsm}ni ${d.xodimIshBoshi} sanasidan boshlab ${d.xodimBolim ? d.xodimBolim + " bo'limiga " : ""}${d.xodimLavozim} lavozimiga qabul qilish.

2. Oylik ish haqi: ${d.xodimMaosh} (${d.xodimMaoshMatn || '___________'}) so'm.

3. Sinov muddati: ${d.extra?.SINOV_MUDDAT || '3 (uch) oy'}.

4. Mehnat shartnomasini ${d.extra?.SHARTNOMA_MUDDAT || 'belgilanmagan muddatga'} tuzish.

Asosiy shartnoma: № ${d.extra?.SHARTNOMA_RAQAM || '___'} dan ${d.extra?.SHARTNOMA_SANA || '___'}.

Buyruqni e'lon qilish uchun: ${d.xodimIsm}

Rahbar: _______________ / ${d.orgRahbar} /
                M.O.

Buyruq bilan tanishtirildi: _______________ / ${d.xodimIsm} /
"___" ___________ ${new Date().getFullYear()} yil`
}

// ============================================
// MEHNAT SHARTNOMASI
// ============================================
export function generateMehnatShartnoma(d: XodimData): string {
  return `MEHNAT SHARTNOMASI
№ ${d.raqam}

${d.extra?.SHAHAR || 'Toshkent'} shahri                    "${d.sana}"

${d.orgNomi} (keyingi o'rinlarda "Ish beruvchi" deb yuritiladi), ${d.orgRahbar} nomidan, bir tomondan, va ${d.xodimIsm} (keyingi o'rinlarda "Xodim" deb yuritiladi)${d.xodimJshshir ? ', JSHSHIR: ' + d.xodimJshshir : ''}, ikkinchi tomondan, ushbu mehnat shartnomasini tuzdilar:

1. UMUMIY QOIDALAR

1.1. Ish beruvchi Xodimni ${d.xodimBolim ? d.xodimBolim + " bo'limiga " : ''}${d.xodimLavozim} lavozimiga qabul qiladi.
1.2. Ish joyi: ${d.orgManzil || d.orgNomi + ' tashkilotining bosh idorasi'}.
1.3. Shartnoma turi: ${d.extra?.SHARTNOMA_TURI || 'Muddatsiz mehnat shartnomasi'}.
1.4. Ishga kirish sanasi: ${d.xodimIshBoshi}.
${d.extra?.SINOV_MUDDAT ? `1.5. Sinov muddati: ${d.extra.SINOV_MUDDAT}.` : ''}

2. XODIM HUQUQ VA MAJBURIYATLARI

2.1. Xodim quyidagi majburiyatlarni oladi:
— o'z lavozim ko'rsatmalariga muvofiq vazifalarni bajarish;
— mehnat intizomiga rioya qilish;
— tashkilot mulkini saqlash;
— xizmat sirini saqlash.

2.2. Xodim quyidagi huquqlarga ega:
— belgilangan miqdorda ish haqi olish;
— yillik mehnat ta'tili (${d.extra?.TATIL_KUNLAR || '15 ish kuni'});
— kasaba uyushmasi a'zosi bo'lish.

3. ISH BERUVCHI HUQUQ VA MAJBURIYATLARI

3.1. Ish beruvchi majburiyatlari:
— o'z vaqtida ish haqi to'lash;
— xavfsiz ish sharoiti yaratish;
— mehnat qonunchiligiga rioya qilish.

4. ISH HAQI

4.1. Oylik ish haqi: ${d.xodimMaosh} (${d.xodimMaoshMatn || '___________'}) so'm.
4.2. To'lov sanasi: har oyning ${d.extra?.TOLOV_SANA || "25-kuni"}.
4.3. To'lov usuli: ${d.extra?.TOLOV_USUL || 'bank kartasi orqali'}.
4.4. Mukofotlar: ${d.extra?.MUKOFOT || "korxona foydasi va xodim ko'rsatkichlari asosida"}.

5. ISH VAQTI

5.1. Haftalik ish vaqti: ${d.extra?.ISH_VAQTI || '40 soat (5 kunlik ish haftasi)'}.
5.2. Ish kuni: ${d.extra?.ISH_KUNI || 'dushanbadan jumagacha, 9:00 dan 18:00 gacha'}.
5.3. Tushlik tanaffus: ${d.extra?.TUSHLIK || '13:00 dan 14:00 gacha'}.

6. TA'TIL

6.1. Yillik asosiy ta'til: ${d.extra?.TATIL_KUNLAR || '15 ish kuni'}.
6.2. Ta'til davomida o'rtacha ish haqi saqlanadi.

7. JAVOBGARLIK

7.1. Tomonlar O'zbekiston Respublikasi Mehnat kodeksiga muvofiq javob beradi.
7.2. Moddiy javobgarlik: to'g'ridan-to'g'ri yetkazilgan zarar miqdorida.

8. SHARTNOMANI BEKOR QILISH

8.1. Shartnoma O'zbekiston Respublikasi Mehnat kodeksi 97-107-moddalari asosida bekor qilinishi mumkin.
8.2. Xodim istagiga ko'ra: 2 hafta oldin ogohlantirish.

9. NIZOLARNI HAL ETISH

9.1. Mehnat nizolari birinchi navbatda muzokaralar yo'li bilan hal etiladi.
9.2. Kelishilmasa — mehnat nizolari komissiyasi yoki sud orqali.

10. YAKUNIY QOIDALAR

10.1. Shartnoma 2 nusxada tuzilgan — har bir tomonga bittadan.
10.2. Shartnoma imzolanganidan boshlab kuchga kiradi.

ISH BERUVCHI:                          XODIM:
${d.orgNomi}                           ${d.xodimIsm}
INN: ${d.orgInn}                       JSHSHIR: ${d.xodimJshshir || '_______________'}
Manzil: ${d.orgManzil || '___'}        ${d.xodimPassport ? 'Passport: ' + d.xodimPassport : ''}

_______________ / ${d.orgRahbar} /     _______________ / ${d.xodimIsm} /
       M.O.`
}

// ============================================
// TA'TIL BUYRUG'I
// ============================================
export function generateTatilBuyruq(d: XodimData): string {
  return `BUYRUQ
№ ${d.raqam}

"${d.sana}"                                         ${d.orgNomi}

MEHNAT TA'TILI BERISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimLavozim} ${d.xodimIsm}ga ${d.extra?.TATIL_BOSHI || '___'} sanasidan ${d.extra?.TATIL_OXIRI || '___'} sanasigacha bo'lgan muddatga jami ${d.extra?.TATIL_KUNLAR || '___'} kalendar kun yillik asosiy mehnat ta'tili berish.

2. Ta'til davomida o'rtacha ish haqi saqlash.

3. Ta'til puli to'lash: ta'til boshlanishidan 3 kun oldin.

Asos: Mehnat kodeksi 134-moddasi.

Rahbar: _______________ / ${d.orgRahbar} /
                M.O.

Buyruq bilan tanishtirildi: _______________ / ${d.xodimIsm} /
"___" ___________ ${new Date().getFullYear()} yil`
}

// ============================================
// ISHDAN BO'SHATISH BUYRUG'I
// ============================================
export function generateIshdanBoshtirish(d: XodimData): string {
  return `BUYRUQ
№ ${d.raqam}

"${d.sana}"                                         ${d.orgNomi}

XODIMNI ISHDAN BO'SHATISH TO'G'RISIDA

${d.orgNomi} rahbari ${d.orgRahbar} buyuradi:

1. ${d.xodimLavozim} ${d.xodimIsm}ni ${d.extra?.BOSHATISH_SANA || d.sana} sanasidan ishdan bo'shatish.

2. Bo'shatish sababi: ${d.extra?.BOSHATISH_SABABI || "xodimning o'z xohishiga ko'ra (Mehnat kodeksi 97-moddasi 1-bandi)"}.

3. Hisob-kitob qilish va ish daftarchasini qaytarish.

Rahbar: _______________ / ${d.orgRahbar} /
                M.O.

Buyruq bilan tanishtirildi: _______________ / ${d.xodimIsm} /`
}
