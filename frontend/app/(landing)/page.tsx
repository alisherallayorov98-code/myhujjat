'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  Sparkles, FileText, Users, Calculator, Scale, Briefcase,
  Zap, Shield, ArrowRight, Check, X, Mic, Download, Search,
  Clock, BarChart3, Lock, Globe, Smartphone,
} from 'lucide-react'

// ─── Data ────────────────────────────────────────────────

const DOCUMENT_TYPES = [
  { icon: '📑', label: 'Oldi-sotdi' },
  { icon: '🤝', label: 'Xizmat' },
  { icon: '🏢', label: 'Ijara' },
  { icon: '🛠️', label: 'Pudrat' },
  { icon: '🚛', label: 'Transport' },
  { icon: '🌍', label: 'Xalqaro' },
  { icon: '💰', label: 'Hisob-faktura' },
  { icon: '📋', label: 'Akt sverki' },
  { icon: '🧾', label: "To'lov grafigi" },
  { icon: '👤', label: 'Mehnat shart.' },
  { icon: '📝', label: 'Ishga qabul' },
  { icon: '🏖️', label: "Ta'til" },
  { icon: '🚪', label: "Bo'shatish" },
  { icon: '🗳️', label: 'Bayonnoma' },
  { icon: '⚖️', label: "Da'vo arizasi" },
  { icon: '📜', label: "Ishonch qog'ozi" },
  { icon: '🔁', label: "Qo'shimcha" },
  { icon: '💼', label: 'Agentlik' },
]

const DEPARTMENTS = [
  {
    icon: Users,
    title: "Kadrlar bo'limi",
    desc: "Mehnat shartnomalari, ishga qabul/bo'shatish buyruqlari, ta'til hujjatlari",
    color: 'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]',
    link: '/kadrlar-uchun',
    bullets: ['20+ HR shabloni', 'JSHSHIR avto-tekshirish', 'Xodimlar reestri'],
  },
  {
    icon: Calculator,
    title: 'Buxgalterlar uchun',
    desc: 'Faktura, akt sverki, Didox integratsiyasi va QQS hisobotlari',
    color: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
    link: '/buxgalterlar-uchun',
    bullets: ['Didox API ulanishi', 'Excel/PDF eksport', 'QQS avtomatik'],
  },
  {
    icon: Scale,
    title: 'Yuristlar uchun',
    desc: "12 turdagi shartnoma, da'vo arizasi, magic-link e-imzo va audit log",
    color: 'bg-[#FEF3C7] text-[#D97706] border-[#FED7AA]',
    link: '/yuristlar-uchun',
    bullets: ['Magic-link imzo', "To'liq audit log", "AES-256 shifrlash"],
  },
  {
    icon: Briefcase,
    title: 'Boshqaruv uchun',
    desc: "Bayonnoma, qaror va kotib hujjatlari + statistik hisobotlar",
    color: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
    link: '/register',
    bullets: ["Yig'ilish bayonnomasi", 'Avtomatik raqamlash', 'Dashboard analitika'],
  },
]

const STEPS = [
  {
    n: '01',
    title: "Tashkilotni qo'shing",
    desc: "STIR raqamingizni kiriting — ma'lumotlar Soliq APIdan avtomatik to'ldiriladi",
  },
  {
    n: '02',
    title: 'Hujjat turini tanlang',
    desc: '50+ tayyor shablon yoki Mira AI bilan ovozli buyruq orqali yarating',
  },
  {
    n: '03',
    title: 'Imzo va eksport',
    desc: "PDF/Word'da yuklab oling yoki magic-link orqali kontragentga yuboring",
  },
]

const COMPARISON: [string, string, string][] = [
  ["Hujjat yaratish vaqti",   '< 1 daqiqa',         '20-40 daqiqa'],
  ["Mijoz ma'lumotlari",       'STIR orqali avto',  "Qo'lda kiritish"],
  ['QQS va summa hisobi',      'Avtomatik',         'Excel/kalkulyator'],
  ['Tayyor shablonlar',        '50+ professional',  "Internet'dan qidirish"],
  ["Ko'p tashkilot bilan ish", 'Cheksiz',           'Har birini alohida'],
  ['Imzo qo\'yish',            'Magic-link / ERI',  'Pochta yoki qo\'lda'],
  ['Arxiv va qidiruv',         'Markaziy + tezkor', 'Word fayllar tarqoq'],
  ['Versiyalar tarixi',        'Avtomatik audit',    'Eski versiya yo\'qolad'],
]

const TESTIMONIALS = [
  {
    name: 'Jamshid Karimov', role: 'Direktor, Toshkent', initial: 'J',
    text: "Shartnomalarni 10 daqiqadan 1 daqiqaga qisqartirdi. Endi yarim soat tejaymiz.",
    color: 'bg-[#DBEAFE] text-[#2563EB]',
  },
  {
    name: 'Dilnoza Yusupova', role: 'HR manager, Samarqand', initial: 'D',
    text: "Mehnat shartnomalari va buyruqlar avtomatik to'ldirilyapti. Juda qulay!",
    color: 'bg-[#DCFCE7] text-[#16A34A]',
  },
  {
    name: 'Bobur Hasanov', role: 'Yurist, Namangan', initial: 'B',
    text: "Pretenziya va da'vo arizalarini bir daqiqada tayyor. Pro rejaga o'taman.",
    color: 'bg-[#FEF3C7] text-[#D97706]',
  },
]

const FAQS = [
  { q: 'Bepul rejada nima mavjud?', a: "Oyiga 5 ta hujjat, asosiy shablonlar, PDF va Word eksport, bitta tashkilot." },
  { q: "Mira AI ovozli yordamchi qanday ishlaydi?", a: "O'zbek tilida \"Toshmatov uchun shartnoma 5 mln so'm\" deb gapirsangiz, AI hujjatni o'zi yaratadi va to'ldiradi. Pro rejada mavjud." },
  { q: "Magic-link imzo qonuniy kuchga egami?", a: "Ha, O'zbekiston Fuqarolik Kodeksi 366-moddasi bo'yicha. Imzolovchining IP, vaqt va brauzer ma'lumotlari muhrlanadi." },
  { q: "Ma'lumotlarim xavfsizmi?", a: "Ma'lumotlar O'zbekistondagi serverlarda AES-256 bilan shifrlangan. Doimiy backup, audit log mavjud." },
  { q: "Didox bilan qanday integratsiya?", a: "Sozlamalardan API kalitingizni kiriting — fakturalar avtomatik sinxronlanadi, holatlar real vaqtda yangilanadi." },
  { q: "To'lov qanday amalga oshiriladi?", a: "Click va Payme orqali oylik yoki yillik (yillikda 25% chegirma)." },
]

const PLANS = [
  {
    name: 'Bepul', price: '0', period: '', popular: false,
    color: 'border-[#E2E8F0]',
    btnClass: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]',
    href: '/register',
    btnText: 'Bepul boshlash',
    features: ['5 ta hujjat/oy', 'Asosiy shablonlar', 'PDF + Word eksport', 'Email qo\'llab-quvvatlash'],
  },
  {
    name: 'Standart', price: '149 000', period: '/oy', popular: false,
    color: 'border-[#2563EB]',
    btnClass: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    href: '/register?plan=standard',
    btnText: 'Tanlash',
    features: ['50 ta hujjat/oy', 'Barcha 50+ shablon', 'Kadrlar (HR)', 'Buxgalter hujjatlar', 'Kotib hujjatlar', 'Telegram bot'],
  },
  {
    name: 'Pro', price: '299 000', period: '/oy', popular: true,
    color: 'border-[#7C3AED]',
    btnClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    href: '/register?plan=pro',
    btnText: 'Tanlash',
    features: ['Cheksiz hujjat', 'Mira AI ovozli yordamchi', 'Magic-link e-imzo', 'Yurist hujjatlar', 'Didox integratsiya', 'Avtomatik 2FA + audit'],
  },
]

// ─── Live counter component ──────────────────────────────
function LiveCounter() {
  // Har sahifa ochilganda bugungi sana asosida realistik raqam ko'rsatamiz
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Soatga qarab dinamik hisob — kun davomida o'sib boradi
    const now = new Date()
    const hours = now.getHours()
    const baseToday = 180 + Math.floor(hours * 12 + Math.random() * 8)
    let n = 0
    const target = baseToday
    const step = Math.ceil(target / 60)
    const id = setInterval(() => {
      n += step
      if (n >= target) {
        n = target
        clearInterval(id)
      }
      setCount(n)
    }, 25)
    return () => clearInterval(id)
  }, [])

  return (
    <span className="font-display font-black text-[#2563EB] tabular-nums">
      {count.toLocaleString('uz-UZ')}
    </span>
  )
}

// ─── Page ─────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="bg-white">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative bg-gradient-to-b from-[#F8FAFC] via-white to-white pt-14 pb-20 px-4 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-[#DBEAFE] via-transparent to-[#F3E8FF] opacity-40 blur-3xl rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#BFDBFE] rounded-full px-4 py-1.5 text-xs text-[#2563EB] font-semibold mb-6 shadow-sm">
            <Sparkles size={13} />
            O'zbekistonning birinchi AI hujjat platformasi
          </div>

          <h1 className="font-display font-black text-[#0F172A] text-4xl md:text-6xl leading-[1.05] mb-5 tracking-tight">
            Hujjatlar yaratishni<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              soddalashtirdik
            </span>
          </h1>

          <p className="text-[#475569] text-lg md:text-xl max-w-2xl mx-auto mb-7 leading-relaxed">
            Shartnoma, faktura, buyruq va boshqa rasmiy hujjatlarni AI yordamida{' '}
            <span className="font-semibold text-[#0F172A]">1 daqiqada</span> yarating.
            O'zbekiston qonunchiligiga to'liq mos.
          </p>

          {/* Live counter */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-[#F0FDF4] border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-sm text-[#15803D]">
              Bugun <LiveCounter /> ta hujjat yaratildi
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm"
            >
              Bepul boshlash <ArrowRight size={15} />
            </Link>
            <Link
              href="/login?demo=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB] text-[#0F172A] font-semibold px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              Demo hisobni sinash
            </Link>
          </div>

          <p className="mt-4 text-xs text-[#94A3B8]">
            Karta talab qilinmaydi · 14 kun bepul Pro · Istalgan vaqtda bekor qilish mumkin
          </p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-14">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#DBEAFE] via-transparent to-[#F3E8FF] blur-2xl opacity-40 rounded-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-[#E2E8F0] overflow-hidden">
              {/* Browser bar */}
              <div className="bg-[#F8FAFC] px-4 py-2.5 flex items-center gap-2 border-b border-[#E2E8F0]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                </div>
                <div className="flex-1 bg-white rounded-md h-6 mx-4 flex items-center justify-center text-[10px] text-[#94A3B8] gap-1.5">
                  <Lock size={10} /> myhujjat.uz/dashboard
                </div>
              </div>
              {/* Dashboard mock */}
              <div className="grid grid-cols-12 min-h-[280px]">
                {/* Sidebar */}
                <div className="col-span-3 bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 space-y-1.5">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#DBEAFE]">
                    <div className="w-5 h-5 rounded bg-[#2563EB]" />
                    <span className="text-[11px] font-semibold text-[#2563EB]">Bosh sahifa</span>
                  </div>
                  {['Shartnomalar', 'Kontragentlar', 'Spesifikatsiya', 'Tashkilotlar', 'Kadrlar (HR)', 'Buxgalter', 'Yurist', 'Sozlamalar'].map(item => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white">
                      <div className="w-5 h-5 rounded bg-[#E2E8F0]" />
                      <span className="text-[11px] text-[#64748B]">{item}</span>
                    </div>
                  ))}
                </div>
                {/* Main */}
                <div className="col-span-9 p-5">
                  {/* Stats */}
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {[
                      { v: '247', l: 'Shartnomalar', c: 'text-[#2563EB] bg-[#DBEAFE]' },
                      { v: '38',  l: 'Kontragentlar', c: 'text-[#16A34A] bg-[#DCFCE7]' },
                      { v: '12',  l: 'Xodimlar', c: 'text-[#D97706] bg-[#FEF3C7]' },
                      { v: '₿8.5M', l: 'Bu oy', c: 'text-[#7C3AED] bg-[#F3E8FF]' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mb-1.5 ${s.c}`}>
                          {s.l}
                        </div>
                        <div className="font-display font-black text-[#0F172A] text-lg">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  {/* Recent docs */}
                  <div className="space-y-1.5">
                    {[
                      { d: 'Oldi-sotdi #27/04', cp: '"JASURBEK ZUXRIDDIN" MCHJ', sum: '12 500 000', clr: 'bg-[#DBEAFE]' },
                      { d: 'Hisob-faktura FAK-251', cp: 'Demo Trading LLC', sum: '5 200 000', clr: 'bg-[#DCFCE7]' },
                      { d: "Mehnat shartnomasi #15", cp: 'Aliyev O.', sum: '4 500 000', clr: 'bg-[#FEF3C7]' },
                      { d: 'Akt sverki #8', cp: 'ABC Logistics', sum: '8 700 000', clr: 'bg-[#F3E8FF]' },
                    ].map((r, i) => (
                      <div key={i} className="flex items-center gap-2.5 p-2 bg-[#F8FAFC] rounded-lg">
                        <div className={`w-7 h-7 rounded-md ${r.clr} flex items-center justify-center`}>
                          <FileText size={11} className="text-[#475569]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-semibold text-[#0F172A] truncate">{r.d}</p>
                          <p className="text-[9px] text-[#94A3B8] truncate">{r.cp}</p>
                        </div>
                        <span className="text-[10px] font-bold text-[#0F172A] tabular-nums">{r.sum}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ DOCUMENT TYPES (horizontal scroll) ═══════════════ */}
      <section className="py-12 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-6">
            50+ tayyor shablon · har biri qonunchilikka mos
          </p>
          <div className="overflow-hidden">
            <div className="flex gap-3 animate-scroll">
              {[...DOCUMENT_TYPES, ...DOCUMENT_TYPES].map((d, i) => (
                <div
                  key={i}
                  className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl"
                >
                  <span className="text-lg">{d.icon}</span>
                  <span className="text-sm font-medium text-[#0F172A] whitespace-nowrap">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ DEPARTMENTS ═══════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">KIM UCHUN</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              Har bo'lim uchun maxsus
            </h2>
            <p className="text-[#475569] text-lg">
              Tashkilotingizning har bo'limi o'z ehtiyojiga mos vositalardan foydalanadi
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEPARTMENTS.map(d => (
              <Link key={d.title} href={d.link} className="group">
                <div className="h-full p-6 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#2563EB] hover:shadow-lg transition-all">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-xl ${d.color} border flex items-center justify-center shrink-0`}>
                      <d.icon size={22} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-[#0F172A] text-lg mb-1 group-hover:text-[#2563EB] transition-colors">
                        {d.title}
                      </h3>
                      <p className="text-sm text-[#64748B] leading-relaxed">{d.desc}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {d.bullets.map(b => (
                      <span key={b} className="text-xs px-2.5 py-1 bg-[#F1F5F9] text-[#475569] rounded-full">
                        {b}
                      </span>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center text-sm font-semibold text-[#2563EB] gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    Batafsil <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ HOW IT WORKS (3 steps) ═══════════════ */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">QANDAY ISHLAYDI</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              3 qadamda professional hujjat
            </h2>
            <p className="text-[#475569] text-lg">
              Murakkab sozlash va o'rganish kerak emas — hoziroq boshlash mumkin
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {STEPS.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-full">
                  <div className="font-display font-black text-5xl bg-gradient-to-br from-[#DBEAFE] to-transparent bg-clip-text text-transparent mb-3">
                    {s.n}
                  </div>
                  <h3 className="font-display font-bold text-[#0F172A] text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-2 border-[#E2E8F0] z-10 items-center justify-center">
                    <ArrowRight size={11} className="text-[#94A3B8] m-auto" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Mira AI highlight */}
          <div className="mt-10 p-6 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <Mic size={22} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-display font-bold text-lg">Mira AI ovozli yordamchi</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full">YANGI</span>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed mb-3">
                  Klaviaturadan ham foydalanmang — gapirib hujjat yarating. <span className="italic">"Toshmatovga sotib olish shartnomasi 5 million so'm"</span> deb aytasiz, Mira hammasini o'zi to'ldiradi.
                </p>
                <span className="text-xs text-blue-200">Pro tarifda mavjud</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ COMPARISON ═══════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#16A34A] font-semibold text-sm mb-2">FARQI BOR</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              Word'dan farqi nimada?
            </h2>
            <p className="text-[#475569] text-lg">
              Hujjatni qo'lda yozish va bizning platforma — taqqoslang
            </p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 text-sm font-bold text-[#0F172A]">
              <div></div>
              <div className="text-center text-[#2563EB]">MyHujjat.uz</div>
              <div className="text-center text-[#94A3B8]">Word/Excel qo'lda</div>
            </div>
            {COMPARISON.map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-3 px-6 py-4 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}`}
              >
                <div className="text-[#475569]">{row[0]}</div>
                <div className="text-center flex items-center justify-center gap-2">
                  <Check size={14} className="text-[#16A34A] shrink-0" />
                  <span className="font-semibold text-[#0F172A]">{row[1]}</span>
                </div>
                <div className="text-center flex items-center justify-center gap-2 text-[#94A3B8]">
                  <X size={14} className="shrink-0" />
                  <span>{row[2]}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FEATURES GRID ═══════════════ */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">IMKONIYATLAR</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              Biznes uchun hamma narsa
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: Zap,         title: 'STIR avtomatik',   desc: '9 raqam yozsangiz Soliq APIdan ma\'lumotlar avtomatik' },
              { icon: Shield,      title: 'AES-256 shifrlash', desc: 'Ma\'lumotlar O\'zbekiston serverida xavfsiz' },
              { icon: Download,    title: 'PDF + Word + Excel', desc: 'Har bir hujjat 3 formatda eksport' },
              { icon: Search,      title: 'Tezkor qidiruv',    desc: 'Ming hujjat ichidan 1 soniyada topish' },
              { icon: Clock,       title: '24/7 ishonchli',    desc: '99.9% uptime, doimiy backup' },
              { icon: BarChart3,   title: 'Statistika',         desc: 'Daromad, hujjat soni, kontragentlar' },
              { icon: Lock,        title: '2FA + audit log',    desc: 'Har bir kirish va o\'zgarish saqlanadi' },
              { icon: Smartphone,  title: 'PWA + Mobile',       desc: 'Telefonga o\'rnatilgan kabi ishlaydi' },
              { icon: Globe,       title: '3 til (UZ/RU/EN)',   desc: 'Ko\'p tilli interfeys' },
            ].map(f => (
              <div key={f.title} className="p-5 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#BFDBFE] hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center mb-3">
                  <f.icon size={18} className="text-[#2563EB]" />
                </div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1">{f.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">MIJOZLAR FIKRI</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl">
              Bizga ishongan kompaniyalar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-6 bg-white border border-[#E2E8F0] rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(i => (
                    <span key={i} className="text-[#FBBF24] text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-[#475569] leading-relaxed mb-5 italic">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center font-bold`}>
                    {t.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                    <p className="text-xs text-[#94A3B8]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ PRICING ═══════════════ */}
      <section id="narxlar" className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">NARXLAR</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              Sodda va halol narx
            </h2>
            <p className="text-[#475569] text-lg">
              Yashirin to'lovlar yo'q · Yillikda 25% chegirma
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl bg-white border-2 ${plan.color} ${plan.popular ? 'shadow-xl shadow-violet-100 scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">
                    <Sparkles size={11} /> Mashhur
                  </div>
                )}
                <h3 className="font-display font-black text-[#0F172A] text-xl">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="font-display font-black text-3xl text-[#0F172A]">{plan.price}</span>
                  {plan.period && <span className="text-sm text-[#94A3B8]">so'm{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-6 mt-5">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-start gap-2 text-sm text-[#475569]">
                      <Check size={14} className="text-[#16A34A] mt-0.5 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${plan.btnClass}`}
                >
                  {plan.btnText}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">KO'P SO'RALADIGAN</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl">
              Tez-tez beriladigan savollar
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map(faq => (
              <details
                key={faq.q}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden group hover:border-[#BFDBFE] transition-colors"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-[#0F172A] list-none select-none">
                  <span>{faq.q}</span>
                  <span className="text-[#94A3B8] text-2xl leading-none group-open:rotate-45 transition-transform shrink-0 ml-3">+</span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-white text-3xl md:text-5xl mb-4 leading-tight">
            Bugun boshlang
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            14 kun bepul Pro rejani sinab ko'ring. Karta talab qilinmaydi, istalgan paytda bekor qila olasiz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold px-8 py-4 rounded-xl hover:shadow-2xl transition-all text-sm"
            >
              Bepul ro'yxatdan o'tish <ArrowRight size={15} />
            </Link>
            <Link
              href="/yordam"
              className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 backdrop-blur font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-sm"
            >
              Yordam markazi
            </Link>
          </div>
          <p className="mt-6 text-xs text-blue-200">
            5,000+ foydalanuvchi · 120K+ hujjat yaratildi · 99.9% uptime
          </p>
        </div>
      </section>
    </div>
  )
}
