import type { Metadata } from 'next'
import { UseCasePage }   from '@/components/landing/UseCasePage'

export const metadata: Metadata = {
  title:       'Buxgalterlar uchun — MyHujjat.uz',
  description: "Faktura, akt sverki, hisob-faktura va barcha buxgalterlik hujjatlarini AI yordamida 1 daqiqada yarating. Didox bilan integratsiya, Excel eksport.",
  alternates:  { canonical: '/buxgalterlar-uchun' },
}

export default function BuxgalterlarPage() {
  return (
    <UseCasePage config={{
      title:    "Buxgalterlar uchun",
      subtitle: "Buxgalterlar",
      hero: {
        headline:    "Buxgalterlar uchun professional hujjat platformasi",
        description: "Faktura, akt sverki, shartnomalar va hisobotlarni AI yordamida bir daqiqada yarating. Didox bilan integratsiya, Excel/PDF eksport, qonunchilikka mos shablonlar.",
        cta:         "14 kun bepul sinab ko'rish",
      },
      stats: [
        { value: '5,000+',  label: 'Buxgalter foydalanadi' },
        { value: '120K+',   label: 'Hujjat yaratildi' },
        { value: '< 1 daq', label: "Hujjat yaratish vaqti" },
        { value: '99.9%',   label: 'Server uptime' },
      ],
      problems: [
        {
          title: "Excel va Word'da har safar qayta yozish",
          description: "Har bir mijoz uchun shablonni qo'lda to'ldirish, raqamlarni xatosiz hisoblash zerikarli va vaqt oluvchi.",
        },
        {
          title: "Didox / Roaming bilan ishlash murakkab",
          description: "Oylik 100+ faktura — har birini qo'lda kiritish, holatini kuzatish, eslatish.",
        },
        {
          title: "Qonunchilik o'zgarsa hammasi notog'ri",
          description: "STIR formati, QQS stavkasi, MFO — yangiliklarni kuzatib borish va shablonlarga moslash kerak.",
        },
      ],
      solutions: [
        {
          icon:        'doc',
          title:       'Avtomatik shablon to\'ldirish',
          description: "Mijoz va tashkilot ma'lumotlarini bir marta kiriting — tizim har bir hujjatga avtomatik joylashtiradi.",
        },
        {
          icon:        'clock',
          title:       'Didox API integratsiyasi',
          description: "Faktura olingan zahoti tizimga tushadi. Holatlar avtomatik kuzatiladi, eslatmalar kelib turadi.",
        },
        {
          icon:        'shield',
          title:       'Qonunchilikka mos',
          description: "Barcha shablonlar O'zbekiston soliq qonunchiligiga ko'ra yangilanib turadi. Sizga faqat to'ldirish kifoya.",
        },
      ],
      features: [
        "Faktura yaratish (incoming/outgoing) — bir marta bosish",
        "Akt sverki — kontragent bilan avtomatik tahlil",
        "Didox API ulanishi — barcha fakturalar avtomatik sinxron",
        "QQS hisoblash — to'g'ri stavka avtomatik tanlanadi",
        "Excel eksport — 1C / Hisobchi formatlari",
        "STIR / MFO tekshirish — soliq idora bilan onlayn tekshirish",
        "Ko'p tashkilot bitta hisob — bir nechta firma bilan ishlash",
        "Telegram bot — fakturalar haqida bildirishnomalar",
      ],
      documents: [
        "Hisob-faktura (oddiy va elektron)",
        "Akt sverki (uchrashma)",
        "Shartnoma (xizmat, oldi-sotdi, ijara)",
        "Tovar yo'l xati (TTN)",
        "Bajarilgan ish akti",
        "To'lov ko'rsatmasi",
        "Soliq hisoboti shablonlari",
      ],
      faq: [
        {
          q: "Didox bilan qanday ulanaman?",
          a: "Sozlamalar > Didox bo'limidan API kalitingiz va foydalanuvchi kalitingizni kiriting. Tizim avtomatik ulanib, fakturalaringiz har 5 daqiqada sinxronlanadi.",
        },
        {
          q: "Hisob-faktura formatini o'zgartirish mumkinmi?",
          a: "Ha, tashkilot logotipini, rangini va imzo joyini sozlamalardan o'zgartirishingiz mumkin. PRO tarifda to'liq shablon tahriri mavjud.",
        },
        {
          q: "Excel eksport qaysi formatlarda?",
          a: "1C, Hisobchi, oddiy XLSX — barchasi qo'llab-quvvatlanadi. Eksport bir bosishda amalga oshadi.",
        },
        {
          q: "Bir nechta firma bilan ishlay olamanmi?",
          a: "Ha, bitta hisobdan cheksiz tashkilot qo'shishingiz mumkin. Har bir tashkilot uchun alohida fakturalar va shartnomalar saqlanadi.",
        },
        {
          q: "Bepul tarifda nima bor?",
          a: "Bepul tarifda 5 ta hujjat oyiga, bitta tashkilot va asosiy shablonlar bor. To'liq imkoniyatlar uchun Standart yoki Pro tarifga o'ting.",
        },
      ],
    }} />
  )
}
