export interface YuristData {
  orgNomi:    string
  orgInn:     string
  orgRahbar:  string
  orgManzil?: string
  orgBank?:   string
  orgHisob?:  string
  orgMfo?:    string
  orgTel?:    string
  cpNomi:     string
  cpInn?:     string
  cpRahbar?:  string
  cpManzil?:  string
  raqam:      string
  sana:       string
  extra?:     Record<string, string>
}

// ============================================
// PRETENZIYA
// ============================================
export function generatePretenziya(d: YuristData): string {
  return `PRETENZIYA
(Da'vogar xat)

Kimga: ${d.cpNomi}
       ${d.cpManzil || '_______________'}
       ${d.cpRahbar ? 'Rahbar: ' + d.cpRahbar : ''}

Kimdan: ${d.orgNomi}
        ${d.orgManzil || '_______________'}

Raqam: № ${d.raqam}               Sana: ${d.sana}

Hurmatli ${d.cpRahbar || 'Rahbar'},

${d.orgNomi} (keyingi o'rinlarda "Da'vogar") sizning tashkilotingiz ${d.cpNomi} (keyingi o'rinlarda "Javobgar") ga quyidagi talab bilan murojaat qiladi.

TALABNING ASOSI:

${d.extra?.ASOS || `Tomonlar o'rtasida tuzilgan № ${d.extra?.SHARTNOMA_RAQAM || '___'} sonli ${d.extra?.SHARTNOMA_SANA || '___'} yildagi shartnomaga muvofiq, Javobgar quyidagi majburiyatlarni bajarmagan:`}

${d.extra?.MAJBURIYAT || '— _______________________________________________'}

TALAB MIQDORI:

Qarz miqdori: ${d.extra?.QARZ_SUMMA || '_______________'}
Penya (${d.extra?.PENYA_FOIZ || '0,1'}% × ${d.extra?.KECH_KUNLAR || '___'} kun): ${d.extra?.PENYA_SUMMA || '_______________'}
Jami talab: ${d.extra?.JAMI_TALAB || '_______________'}

TALABIMIZ:

Ushbu pretenziya qabul qilinganidan boshlab ${d.extra?.JAVOB_MUDDAT || "10 (o'n)"} ish kuni ichida:
1. ${d.extra?.TALAB || "Qarz summasini to'liq to'lab, undirilgan penyani ham o'tkazish."};
2. Bajarilgan ishlar haqida yozma xabar berish.

OGOHLANTIRISH:

Ushbu pretenziya qondirilmasa, ${d.orgNomi} O'zbekiston Respublikasi Iqtisodiy sudiga murojaat qilishga majbur bo'ladi. Sud xarajatlari va advokatlik haqi ham Javobgar zimmasiga yuklatiladi.

To'lov rekvizitlari:
Bank: ${d.orgBank || '_______________'}
H/r:  ${d.orgHisob || '_______________'}
MFO:  ${d.orgMfo || '_______________'}

Hurmat bilan,

_______________ / ${d.orgRahbar} /
       M.O.
${d.orgNomi}
Tel: ${d.orgTel || '_______________'}`
}

// ============================================
// DA'VO ARIZASI
// ============================================
export function generateDavoAriza(d: YuristData): string {
  return `O'ZBEKISTON RESPUBLIKASI
${d.extra?.SUD_NOMI || 'TOSHKENT SHAHAR IQTISODIY SUDI'}GA

Da'vogar:        ${d.orgNomi}
                 STIR: ${d.orgInn}
                 Manzil: ${d.orgManzil || '_______________'}
                 Tel: ${d.orgTel || '_______________'}

Javobgar:        ${d.cpNomi}
                 ${d.cpInn ? 'STIR: ' + d.cpInn : ''}
                 Manzil: ${d.cpManzil || '_______________'}

DA'VO ARIZASI

${d.extra?.DAVO_PREDMETI || "Pul mablag'larini undirib berish to'g'risida"}
Talab miqdori: ${d.extra?.JAMI_TALAB || '_______________'}

HOLATNING BAYONI:

${d.extra?.HOLAT || `${d.orgNomi} (Da'vogar) va ${d.cpNomi} (Javobgar) o'rtasida ${d.extra?.SHARTNOMA_SANA || '___'} yilda № ${d.extra?.SHARTNOMA_RAQAM || '___'} sonli shartnoma tuzilgan.`}

Ushbu shartnoma bo'yicha Da'vogar o'z majburiyatlarini to'liq bajargan, ya'ni:
${d.extra?.DAVOGAR_BAJARGAN || '— _______________________________________________'}

Javobgar esa quyidagi majburiyatlarni bajarmagan:
${d.extra?.JAVOBGAR_BAJARMAGAN || '— _______________________________________________'}

${d.sana} sanasida Da'vogar Javobgarga № ${d.raqam} sonli pretenziya yo'llagan. Biroq pretenziya qondirilmagan.

HUQUQIY ASOS:

O'zbekiston Respublikasi Fuqarolik kodeksining 327, 333-moddalari, Iqtisodiy protsessual kodeksining tegishli moddalari asosida.

TALABLAR:

Javobgardan Da'vogar foydasiga quyidagilarni undirishni so'rayman:
1. Asosiy qarz: ${d.extra?.QARZ_SUMMA || '_______________'};
2. Penya: ${d.extra?.PENYA_SUMMA || '_______________'};
3. Davlat boji: ${d.extra?.DAVLAT_BOJI || '_______________'}.

ILOVA:

1. Shartnoma nusxasi;
2. Pretenziya va qabul qilganligi haqida dalil;
3. To'lov hujjatlari;
4. Davlat boji to'langan kvitansiya;
5. Ishonch qog'ozi (vakil orqali).

"${d.sana}"

_______________ / ${d.orgRahbar} /
${d.orgNomi}`
}

// ============================================
// ISHONCH QOG'OZI
// ============================================
export function generateIshonchQogoz(d: YuristData): string {
  return `ISHONCH QOG'OZI

${d.sana}

${d.orgNomi}, STIR: ${d.orgInn}, yuridik manzil: ${d.orgManzil || '_______________'}, rahbari ${d.orgRahbar} nomidan:

VAKILGA:

${d.extra?.VAKIL_ISM || '_______________'}, passport: ${d.extra?.VAKIL_PASSPORT || '_______________'}, manzil: ${d.extra?.VAKIL_MANZIL || '_______________'}

VAKOLAT BERAMAN:

Quyidagi masalalar bo'yicha ${d.orgNomi} manfaatlarini ifodalash uchun:

${d.extra?.VAKOLAT_DOIRASI ||
`1. ${d.cpNomi} bilan munosabatlarda manfaatlarimni ifoda etish;
2. Hujjatlarni imzolash va olish;
3. Sudlarda ishtirok etish;
4. Yuridik ahamiyatga ega barcha harakatlarni amalga oshirish.`}

Ushbu ishonch qog'ozi ${d.extra?.AMAL_MUDDAT || '1 (bir) yil'} muddatga berilgan.
${d.extra?.QAYTA_VAKOLAT || 'Qayta vakolat berish taqiqlanadi.'}

_______________ / ${d.orgRahbar} /
       M.O.
${d.orgNomi}

Notarial tasdiqlash: _______________`
}

// ============================================
// KELISHUV BITIMI
// ============================================
export function generateKelishuvBitimi(d: YuristData): string {
  return `KELISHUV BITIMI

${d.extra?.SHAHAR || 'Toshkent'} shahri                    "${d.sana}"

${d.orgNomi} (keyingi o'rinlarda "1-Tomon"), ${d.orgRahbar} nomidan, bir tomondan, va ${d.cpNomi} (keyingi o'rinlarda "2-Tomon"), ${d.cpRahbar || '_______________'} nomidan, ikkinchi tomondan, ${d.extra?.NIZO_HAQIDA || 'mavjud kelishmovchilik'} bo'yicha quyidagi kelishuv bitimine erishdilar:

1. KELISHUV PREDMETI

${d.extra?.KELISHUV_PREDMETI || `Tomonlar ${d.extra?.SHARTNOMA_RAQAM ? '№ ' + d.extra.SHARTNOMA_RAQAM + ' sonli shartnoma' : "o'rtasidagi kelishmovchilik"} bo'yicha o'zaro kelishuvga erishdilar.`}

2. 1-TOMON MAJBURIYATLARI

${d.extra?.TOMON1_MAJBURIYAT || '2.1. _______________________________________________'}

3. 2-TOMON MAJBURIYATLARI

${d.extra?.TOMON2_MAJBURIYAT || '3.1. _______________________________________________'}

4. TO'LOV SHARTLARI

${d.extra?.TOLOV_SHARTLARI ||
`4.1. 2-Tomon ${d.extra?.TOLOV_SUMMA || '_______________'} miqdorida to'lov amalga oshiradi.
4.2. To'lov muddati: ${d.extra?.TOLOV_MUDDAT || '_______________'}.`}

5. YAKUNIY QOIDALAR

5.1. Ushbu bitim imzolanganidan so'ng tomonlarning da'vo talablari o'z kuchini yo'qotadi.
5.2. Bitim 2 nusxada tuzilgan.

1-TOMON:                               2-TOMON:
${d.orgNomi}                           ${d.cpNomi}

_______________ / ${d.orgRahbar} /     _______________ / ${d.cpRahbar || '___'} /
       M.O.                                    M.O.`
}
