import type { Metadata } from 'next'
import { UseCasePage }   from '@/components/landing/UseCasePage'

export const metadata: Metadata = {
  title:       'Kadrlar bo\'limi uchun — MyHujjat.uz',
  description: "Buyruqlar, mehnat shartnomalari, ta'tillar, ishga qabul va boshqa HR hujjatlarini bir daqiqada yarating. Tashkilot va xodim ma'lumotlarini bir marta kiriting.",
  alternates:  { canonical: '/kadrlar-uchun' },
}

export default function KadrlarPage() {
  return (
    <UseCasePage config={{
      title:    "Kadrlar bo'limi uchun",
      subtitle: "Kadrlar va HR mutaxassislari",
      hero: {
        headline:    "HR hujjatlarini avtomatlashtirilgan tarzda yarating",
        description: "Buyruqlar, mehnat shartnomalari, ta'tillar, ishga qabul va bo'shatish hujjatlari — barchasini bitta tizimda. Xodim ma'lumotlarini bir marta kiriting, har bir hujjatga avtomatik joylashadi.",
        cta:         "14 kun bepul sinab ko'rish",
      },
      stats: [
        { value: '20+',     label: 'HR shabloni' },
        { value: '< 1 daq', label: 'Buyruq yaratish' },
        { value: 'PDF/Word', label: 'Eksport formati' },
        { value: '∞',       label: 'Xodimlar soni' },
      ],
      problems: [
        {
          title: "Har bir buyruq — qayta yozish",
          description: "Ta'til buyrug'i, ishga qabul, bo'shatish — Word'da har safar shablonni qayta to'ldirish.",
        },
        {
          title: "Xodim ma'lumotlari tarqoq",
          description: "JSHSHIR, lavozim, oylik maosh — har bir buyruq uchun bazadan qidirish va kiritish kerak.",
        },
        {
          title: "Imzo va arxiv chalkash",
          description: "Imzolangan buyruqlar Word fayli sifatida turli papkalar orasida yo'qoladi.",
        },
      ],
      solutions: [
        {
          icon:        'doc',
          title:       "Tayyor HR shablonlar",
          description: "20+ ko'p ishlatiladigan buyruq va shartnomalar shablonlari — qonunchilikka mos.",
        },
        {
          icon:        'clock',
          title:       "Xodimlar bazasi",
          description: "Xodim ma'lumotlari bir marta kiritiladi — har bir buyruqqa avtomatik joylashtiriladi.",
        },
        {
          icon:        'shield',
          title:       "Markazlashgan arxiv",
          description: "Barcha imzolangan hujjatlar bir joyda. Xodim, sana yoki turi bo'yicha tezda topish.",
        },
      ],
      features: [
        "Ishga qabul buyrug'i — bitta bosishda",
        "Mehnat shartnomasi — to'liq qonunchilik talablariga mos",
        "Ta'til buyrug'i — kun va sana avtomatik hisoblanadi",
        "Bo'shatish buyrug'i — sabablar va ko'rsatkichlar bilan",
        "Komandirovka buyrug'i va hisobot",
        "Mukofot va jarima buyruqlari",
        "Xodimlar reestri — to'liq ma'lumotlar",
        "Kadrlar bo'limi statistikasi — kim, qachon, qancha",
      ],
      documents: [
        "Ishga qabul qilish to'g'risida buyruq",
        "Mehnat shartnomasi",
        "Mehnat ta'tili buyrug'i",
        "Ishdan bo'shatish buyrug'i",
        "Kasallik varaqasi to'g'risida buyruq",
        "Komandirovka buyrug'i",
        "Mukofot/jarima buyrug'i",
        "Lavozimga o'tkazish buyrug'i",
      ],
      faq: [
        {
          q: "Xodim ma'lumotlarini qayerga saqlash kerak?",
          a: "Kadrlar > Xodimlar bo'limidan har bir xodim uchun JSHSHIR, lavozim, oylik maosh va boshqa ma'lumotlarni kiriting. Bu ma'lumotlar har bir buyruqqa avtomatik joylashtiriladi.",
        },
        {
          q: "Buyruqni Word formatida olish mumkinmi?",
          a: "Ha, har bir hujjatni PDF yoki Word formatida yuklab olish mumkin. Imzo va muhr joylashuvini sozlamalardan o'zgartirishingiz mumkin.",
        },
        {
          q: "Buyruq raqami avtomatik beriladimi?",
          a: "Ha, har bir buyruq turi uchun raqamlash avtomatik. Siz boshlang'ich raqamni belgilashingiz mumkin (masalan, 2026 yil 1-yanvardan boshlash).",
        },
        {
          q: "Qancha xodim qo'shishim mumkin?",
          a: "Bepul tarifda 10 ta, Standart 100 ta, Pro tarifda cheksiz. Xodimlar soni ko'p bo'lsa Pro tavsiya etiladi.",
        },
        {
          q: "Mehnat kodeksiga o'zgarishlar yetkaziladi?",
          a: "Ha, qonunchilik o'zgarsa shablonlar 24 soat ichida yangilanadi. Eski shablonlar arxivda saqlanadi.",
        },
      ],
    }} />
  )
}
