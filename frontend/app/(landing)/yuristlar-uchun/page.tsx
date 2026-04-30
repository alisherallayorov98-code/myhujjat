import type { Metadata } from 'next'
import { UseCasePage }   from '@/components/landing/UseCasePage'

export const metadata: Metadata = {
  title:       'Yuristlar uchun — MyHujjat.uz',
  description: "Shartnomalar, da'vo arizalari, yuridik xulosalar va boshqa hujjatlarni AI yordamida bir daqiqada yarating. Magic-link e-imzo, audit log, xavfsiz arxiv.",
  alternates:  { canonical: '/yuristlar-uchun' },
}

export default function YuristlarPage() {
  return (
    <UseCasePage config={{
      title:    "Yuristlar uchun",
      subtitle: "Yuristlar va huquqshunoslar",
      hero: {
        headline:    "Yuristlar uchun professional hujjat avtomatlashtirish",
        description: "Shartnomalar, da'vo arizalari, yuridik xulosalar va kelishuvlar — barchasini AI yordamida bir daqiqada yarating. Audit log, magic-link imzo, xavfsiz arxiv.",
        cta:         "14 kun bepul sinab ko'rish",
      },
      stats: [
        { value: '12 tur', label: 'Shartnoma turi' },
        { value: '50+',    label: 'Yuridik shablon' },
        { value: '< 30s',  label: 'Imzo qo\'yish vaqti' },
        { value: 'AES-256', label: 'Shifrlash' },
      ],
      problems: [
        {
          title: "Har bir shartnoma — kun yarim ish",
          description: "Standard shartnomani har safar nol'dan yozish, kontragent ma'lumotlarini topish, raqamlarni hisoblash.",
        },
        {
          title: "Imzo olish — uzoq sayohat",
          description: "Mijoz boshqa shaharda. Hujjatni jo'natish, qaytib kelishini kutish, skanerlash, qo'shish — 3-5 kun yo'qoladi.",
        },
        {
          title: "Eski versiyalar yo'qoladi",
          description: "Word fayli o'zgartirilgan, lekin qaysi versiya tasdiqlangan? Kim qachon o'zgartirdi? Audit yo'q.",
        },
      ],
      solutions: [
        {
          icon:        'doc',
          title:       'AI shablon generator',
          description: "Mijoz va shartnoma turini tanlang — AI to'liq matnni siz uchun yaratadi. Faqat tahrir qilib tasdiqlaysiz.",
        },
        {
          icon:        'clock',
          title:       'Magic-link e-imzo',
          description: "Hujjatni link orqali yuboring. Mijoz brauzerda imzolaydi — 30 soniya ichida tasdiq tayyor.",
        },
        {
          icon:        'shield',
          title:       "To'liq audit log",
          description: "Har bir o'zgarish, har bir imzo, har bir kirish — vaqtga muhrlangan ko'rinishda saqlanadi.",
        },
      ],
      features: [
        "12 turdagi shartnoma shabloni — Oldi-sotdi, Xizmat, Ijara, Pudrat va boshqalar",
        "AI yordamchi — shartnomani so'z bilan tasvirlasangiz yozib beradi",
        "Magic-link e-imzo — emaildan bosib, brauzerda imzo qo'yish",
        "Audit log — har bir amal vaqt va IP bilan saqlanadi",
        "Versiyalar tarixi — eski ko'rinishlarga qaytish",
        "PDF/A export — sud uchun o'zgarmas format",
        "Kontragent bazasi — bir marta kiriting, qayta foydalaning",
        "Maxfiylik darajalari — har bir hujjatga kim kira oladi",
      ],
      documents: [
        "Oldi-sotdi shartnomasi",
        "Xizmat ko'rsatish shartnomasi",
        "Ijara shartnomasi",
        "Pudrat shartnomasi",
        "Qo'shma shartnoma",
        "Lizing shartnomasi",
        "Da'vo arizasi",
        "Kelishuv bayonnomasi",
      ],
      faq: [
        {
          q: "Magic-link imzo qonuniy kuchga egami?",
          a: "Ha, hujjat bilan birgalikda imzolovchining IP, vaqt va brauzer ma'lumotlari muhrlanadi. Bu O'zbekiston Fuqarolik Kodeksi 366-moddasi bo'yicha tomonlar kelishuvi bilan kuchga ega.",
        },
        {
          q: "Audit log qancha vaqt saqlanadi?",
          a: "Bepul tarifda 30 kun, Standart 6 oy, Pro tarifda cheksiz. Har bir yozuv shifrlangan va o'zgartirib bo'lmaydigan tarzda saqlanadi.",
        },
        {
          q: "AI tomonidan yaratilgan shartnomani ishonish mumkinmi?",
          a: "AI faqat shablon yaratadi — siz har doim ko'rib chiqib, tasdiqlashingiz kerak. Tizim aniq O'zbekiston qonunchiligiga mos shablonlardan foydalanadi, lekin har bir holat individualdir.",
        },
        {
          q: "Mijozlarim sizda ro'yxatdan o'tishi kerakmi?",
          a: "Yo'q, magic-link orqali imzolash uchun mijoz ro'yxatdan o'tmaydi. Ular emaildan link bosib, ismi va imzosini qo'yish kifoya.",
        },
        {
          q: "Hujjatlarni qanday himoya qilasizlar?",
          a: "Barcha hujjatlar AES-256-GCM bilan shifrlangan, ma'lumotlar O'zbekistondagi serverlarda saqlanadi, doimiy backup. ISO 27001 mosligida tizim qurilgan.",
        },
      ],
    }} />
  )
}
