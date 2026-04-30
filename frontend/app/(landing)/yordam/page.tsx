'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, ChevronDown, Mail, MessageCircle, Phone, ArrowRight } from 'lucide-react'

const SECTIONS = [
  {
    id:    'getting-started',
    title: 'Boshlash',
    items: [
      {
        q: "Hisob qanday ochiladi?",
        a: "Saytning yuqori o'ng burchagidagi 'Bepul boshlash' tugmasini bosing. Email va parol kiritib, ro'yxatdan o'ting. Email orqali tasdiqlash xati keladi.",
      },
      {
        q: "Birinchi shartnomani qanday yaratish kerak?",
        a: "1) Sozlamalar → Tashkilot — o'z tashkilotingizni qo'shing (STIR orqali avtomatik to'ldiriladi). 2) Kontragentlar — hamkor kompaniyani qo'shing. 3) Shartnomalar → Yangi — turini tanlab, ma'lumotlarni kiritib yarating.",
      },
      {
        q: "STIR avto-to'ldirish ishlamayapti?",
        a: "STIR (9 raqam) Soliq APIga so'rov yuboradi. Agar muvaffaqiyatsiz bo'lsa: 1) Internet aloqasini tekshiring, 2) STIR'ning haqiqiyligini tekshiring, 3) 30 daqiqadan keyin qaytadan urinib ko'ring (rate limit bo'lishi mumkin).",
      },
    ],
  },
  {
    id:    'mira',
    title: '✨ Mira AI yordamchi',
    items: [
      {
        q: "Mira AI nima va qanday ishlaydi?",
        a: "Mira — bu o'zbek tilida gapiradigan AI yordamchi. O'ng pastdagi sehrli tugmani bosib, mikrofonga gapiring. Mira sizning aytganingizni tushunadi va saytdagi amalni bajaradi: shartnoma yaratadi, kontragent qo'shadi, statistika beradi va h.k.",
      },
      {
        q: "Mira nima qila oladi?",
        a: "Hozirgi imkoniyatlari: 1) Yangi shartnoma yaratish (\"Toshmatov MChJ uchun shartnoma 5 mln\"), 2) Yangi kontragent qo'shish, 3) STIR orqali kompaniyani qidirish, 4) Shartnomalar ro'yxatini berish, 5) Statistika ko'rsatish.",
      },
      {
        q: "Mira faqat o'zbek tilini biladimi?",
        a: "Ha, Mira faqat O'zbekiston biznesi uchun mo'ljallangan va o'zbek tilini juda yaxshi tushunadi. Boshqa tillar (rus/ingliz) hozircha qo'llab-quvvatlanmaydi.",
      },
      {
        q: "Mira'ning ovozi noto'g'ri eshityapti?",
        a: "Brauzeringizning audio sozlamalarini tekshiring. Agar muammo davom etsa, Chrome yoki Edge'dan foydalaning — bularda audio sifati eng yaxshi.",
      },
    ],
  },
  {
    id:    'contracts',
    title: 'Shartnomalar',
    items: [
      {
        q: "Qaysi shartnoma turlari mavjud?",
        a: "12 ta tur: Oldi-sotdi, Xizmat ko'rsatish, Ijara, Pudrat, Qo'shimcha shartnoma, Moliyaviy yordam, Daval, Xalqaro, Agentlik, Transport, Lizing, Boshqa.",
      },
      {
        q: "Shartnomani qanday imzolash mumkin?",
        a: "2 ta yo'l: 1) E-imzo (ERI) — Pro rejada, USB kalit yoki kompyuteringizdagi sertifikat orqali. 2) Magic link — kontragentga noyob link yuborasiz, u hisob ochmasdan to'ldirib imzolaydi.",
      },
      {
        q: "Faktura summasi shartnomadan oshib ketdi — nima qilaman?",
        a: "Bu Didox integratsiyasi ulangan paytda avtomatik aniqlanadi. Ogohlantirish ko'rinadi va 'Qo'shimcha shartnoma yaratish' tugmasi paydo bo'ladi. Shu tugma orqali avtomatik QOSHIMCHA shartnoma drafti tayyorlanadi.",
      },
      {
        q: "Shartnomani PDF yoki Word'ga qanday yuklab olaman?",
        a: "Shartnoma sahifasida yuqori o'ng burchakda PDF va Word tugmalari bor. Shuningdek, list sahifasidan Excel orqali bir nechta shartnomani eksport qilish mumkin.",
      },
    ],
  },
  {
    id:    'subscription',
    title: 'Obuna va to\'lov',
    items: [
      {
        q: "Bepul rejada nima mavjud?",
        a: "Oyiga 5 ta shartnoma, barcha asosiy shablonlar, PDF va Word eksport, kontragentlar, tashkilotlar — hammasi bor. Cheklov: AI generatsiya va Yurist hujjatlar Pro rejada.",
      },
      {
        q: "Pro rejaga qanday o'taman?",
        a: "Sozlamalar → Obuna → 'Pro tanlash' tugmasini bosing. Click yoki Payme orqali to'lash mumkin. To'lov tasdiqlangach Pro funksiyalar darhol ochiladi.",
      },
      {
        q: "Demo rejani qanday boshlayman?",
        a: "AI yoki Yurist sahifasiga kirsangiz 'Demo boshlash' tugmasi paydo bo'ladi. 7 kun bepul barcha Pro funksiyalardan foydalanasiz.",
      },
      {
        q: "Pulni qaytarib olish mumkinmi?",
        a: "Ha, agar siz birinchi 7 kun ichida xato qilgan bo'lsangiz yoki xizmat sifati past bo'lsa, support@myhujjat.uz ga yozing — pul qaytariladi.",
      },
    ],
  },
  {
    id:    'security',
    title: "Xavfsizlik",
    items: [
      {
        q: "Ma'lumotlarim qanday himoya qilinadi?",
        a: "Barcha ma'lumotlar O'zbekiston serverlarida shifrlangan holatda saqlanadi. Parollar bcrypt bilan, ulanish HTTPS orqali. Avto-backup har kun. Audit log barcha amallarni qaydlaydi.",
      },
      {
        q: "Hisobimni hech kim bilmasligi uchun nima qilishim kerak?",
        a: "1) Kuchli parol qo'ying (kamida 8 belgi, raqam, katta harf). 2) Boshqa hisoblardan farqli parol. 3) Sozlamalar → Xavfsizlik → 2FA yoqing (kelajakda).",
      },
      {
        q: "Hisobimni o'chirish mumkinmi?",
        a: "Ha, support@myhujjat.uz ga email yuboring. 7 kun ichida barcha shaxsiy ma'lumotlaringiz o'chiriladi. Yaratilgan rasmiy hujjatlar O'zRespublikasi soliq qonunchiligiga ko'ra 5 yil saqlanadi.",
      },
    ],
  },
  {
    id:    'integrations',
    title: 'Integratsiyalar',
    items: [
      {
        q: "Didox integratsiya qanday ishlaydi?",
        a: "Sozlamalar → Didox bo'limidan API kalitlarini kiritasiz. Keyin har 30 daqiqada Didox'dagi fakturalar avtomatik bizning saytga sinxronlanadi. Har bir faktura shartnoma raqami orqali bog'lanadi va summa nazorati ishlaydi.",
      },
      {
        q: "Telegram bot bormi?",
        a: "Ha, @MyHujjatBot — kelajakda. Telegram'dan to'g'ridan-to'g'ri shartnoma yaratish, statistika ko'rish, STIR qidirish mumkin bo'ladi.",
      },
      {
        q: "1C bilan integratsiya?",
        a: "Hozir to'g'ridan-to'g'ri 1C integratsiya yo'q. Lekin Excel orqali ma'lumotlarni almashish mumkin (eksport va import).",
      },
    ],
  },
]

export default function YordamPage() {
  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const filtered = SECTIONS.map(s => ({
    ...s,
    items: s.items.filter(i =>
      !search ||
      i.q.toLowerCase().includes(search.toLowerCase()) ||
      i.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.items.length > 0)

  function toggle(id: string) {
    setOpenIds(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display font-black text-[#0F172A] text-3xl sm:text-4xl mb-3">
            Yordam markazi
          </h1>
          <p className="text-[#475569] text-lg mb-8">
            Savol va javoblar — sayt funksiyalari haqida
          </p>

          <div className="relative max-w-xl mx-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Savol qidiring..."
              className="w-full h-12 pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>
        </div>
      </div>

      {/* FAQ sections */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#94A3B8]">"{search}" bo'yicha hech narsa topilmadi</p>
            <p className="text-sm text-[#CBD5E1] mt-2">support@myhujjat.uz ga yozib so'rang</p>
          </div>
        ) : filtered.map(section => (
          <div key={section.id} id={section.id}>
            <h2 className="font-display font-black text-[#0F172A] text-xl mb-4">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const id = `${section.id}-${i}`
                const open = openIds.has(id)
                return (
                  <div key={id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-semibold text-[#0F172A]">{item.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-[#94A3B8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-4 -mt-1">
                        <p className="text-sm text-[#475569] leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl p-8 text-white mt-12">
          <h3 className="font-display font-bold text-xl mb-2">Javob topa olmadingizmi?</h3>
          <p className="text-blue-100 mb-6">Biz bilan bog'laning — tezda javob qaytaramiz</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="mailto:support@myhujjat.uz"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <Mail size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">Email</p>
                <p className="text-sm font-semibold">support@myhujjat.uz</p>
              </div>
            </a>
            <a href="https://t.me/myhujjat_uz" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <MessageCircle size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">Telegram</p>
                <p className="text-sm font-semibold">@myhujjat_uz</p>
              </div>
            </a>
            <a href="tel:+998711234567"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <Phone size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">Telefon</p>
                <p className="text-sm font-semibold">+998 71 123-45-67</p>
              </div>
            </a>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center pt-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#475569] hover:text-[#2563EB]">
            <ArrowRight size={14} className="rotate-180" />
            Bosh sahifa
          </Link>
        </div>
      </div>
    </div>
  )
}
