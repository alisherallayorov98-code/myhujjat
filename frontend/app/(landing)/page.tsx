import Link from 'next/link'

const FEATURES = [
  { icon: '✨', title: 'Mira AI ovozli yordamchi', desc: "O'zbek tilida gapirib hujjat yarating — 'Toshmatov uchun shartnoma 5 mln' kabi.", highlight: true },
  { icon: '📄', title: '12 tur shartnoma',         desc: "Oldi-sotdi, xizmat, ijara, pudrat va boshqalar. O'zbekiston qonunchiligiga mos." },
  { icon: '🤖', title: 'AI hujjat generatsiya',     desc: 'Tabiiy til orqali professional hujjat — Pro rejada.' },
  { icon: '✍️', title: 'E-imzo (ERI)',               desc: 'Shartnomalarni elektron imzo bilan tasdiqlang.' },
  { icon: '🔍', title: 'STIR avtomatik to\'ldirish', desc: "9 raqam yozsangiz Soliq APIdan kompaniya ma'lumotlari avtomatik keladi." },
  { icon: '🚨', title: 'Faktura nazorati',           desc: "Faktura summasi shartnomadan oshib ketsa darhol ogohlantirish." },
  { icon: '📤', title: 'Magic link imzolash',        desc: "Kontragent hisob ochmasdan, bitta link orqali imzolaydi." },
  { icon: '📋', title: 'Spesifikatsiya + QQS',      desc: "0%, 12%, 15% QQS bilan tovar va xizmatlar ro'yxati." },
  { icon: '👥', title: 'Kadrlar (HR)',               desc: "Mehnat shartnomasi, ishga qabul buyrug'i, JSHSHIR tekshirish." },
  { icon: '⚖️', title: 'Yurist hujjatlar',          desc: "Pretenziya, da'vo arizasi, ishonch qog'ozi — Pro rejada." },
  { icon: '💰', title: 'Buxgalter hujjatlar',       desc: 'Faktura, akt-sverka, to\'lov grafigi.' },
  { icon: '🔒', title: 'Xavfsiz saqlash',            desc: 'O\'zbekiston serverlarida. Versiyalar tarixi. Avto-backup.' },
]

const TESTIMONIALS = [
  { name: 'Jamshid Karimov',  role: 'Direktor, Toshkent',   text: "Shartnomalarni 10 daqiqadan 1 daqiqaga qisqartirdi. Ajoyib!" },
  { name: 'Dilnoza Yusupova', role: 'HR manager, Samarqand', text: "Mehnat shartnomalari va buyruqlarni avtomatik to'ldirish — juda qulay." },
  { name: 'Bobur Hasanov',    role: 'Yurist, Namangan',      text: "Pretenziya va da'vo arizalarini bir daqiqada tayyor. Pro rejaga o'taman." },
]

const FAQS = [
  { q: 'Bepul rejada nima mavjud?',        a: "Oyiga 5 ta shartnoma, barcha asosiy shablonlar, PDF va Word eksport." },
  { q: 'E-imzo qanday ishlaydi?',          a: "MyHujjat.uz E-imzo (ERI) bilan integratsiya qilingan. Kalit USB yoki kompyuteringizda bo'lsa, shartnomani bir bosishda imzolaysiz." },
  { q: "Ma'lumotlarim xavfsizmi?",         a: "Ha. Ma'lumotlar O'zbekistonning o'z serverlarida saqlanadi va shifrlangan." },
  { q: 'Didox bilan integratsiya bormi?',  a: "Ha, Pro rejada fakturalarni to'g'ridan-to'g'ri Didox tizimiga yuborish mumkin." },
  { q: "To'lov qanday amalga oshiriladi?", a: "Click va Payme orqali to'lov qabul qilinadi." },
]

const PLANS = [
  {
    name:    'Bepul',
    price:   '0',
    period:  '',
    popular: false,
    color:   'border-[#E2E8F0]',
    btnClass:'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]',
    href:    '/register',
    btnText: 'Bepul boshlash',
    features: ["5 ta shartnoma/oy", 'Asosiy shablonlar', 'PDF eksport', "Email qo'llab quvvatlash"],
  },
  {
    name:    'Standart',
    price:   '149 000',
    period:  '/oy',
    popular: false,
    color:   'border-[#2563EB]',
    btnClass:'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    href:    '/register?plan=standard',
    btnText: 'Tanlash',
    features: ["50 ta shartnoma/oy", 'Barcha shablonlar', 'PDF + Word eksport', 'Kadrlar (HR)', 'Buxgalter hujjatlar', 'Kotib hujjatlar'],
  },
  {
    name:    'Pro',
    price:   '299 000',
    period:  '/oy',
    popular: true,
    color:   'border-[#7C3AED]',
    btnClass:'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    href:    '/register?plan=pro',
    btnText: 'Tanlash',
    features: ['Cheksiz shartnoma', 'AI hujjat generatsiya', 'E-imzo (ERI)', 'Yurist hujjatlar', 'Didox integratsiya', 'Barcha Standart imkoniyatlar'],
  },
]

export default function HomePage() {
  return (
    <div>
      {/* ── HERO ── */}
      <section className="bg-gradient-to-b from-[#EFF6FF] to-white pt-16 pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#DBEAFE] rounded-full px-4 py-1.5 text-sm text-[#2563EB] font-medium mb-6 shadow-sm">
            🇺🇿 O'zbekiston bozori uchun yaratilgan
          </div>

          <h1 className="font-display font-black text-[#0F172A] text-4xl md:text-5xl lg:text-6xl leading-tight mb-5">
            Professional hujjatlar —<br />
            <span className="text-[#2563EB]">bir daqiqada</span>
          </h1>

          <p className="text-[#475569] text-lg md:text-xl max-w-2xl mx-auto mb-8 leading-relaxed">
            Shartnomalar, HR, buxgalter, yurist hujjatlarini O'zbekiston qonunchiligiga mos holda yarating. E-imzo, Didox, AI integratsiyasi bilan.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-8 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm"
            >
              Bepul boshlash →
            </Link>
            <Link
              href="/login?demo=1"
              className="w-full sm:w-auto bg-white border-2 border-[#E2E8F0] hover:border-[#CBD5E1] text-[#0F172A] font-semibold px-8 py-3.5 rounded-xl transition-all text-sm"
            >
              Demo ko'rish
            </Link>
          </div>

          <p className="mt-4 text-xs text-[#94A3B8]">
            Kredit kartasi talab etilmaydi • Bepul rejada 5 ta shartnoma
          </p>
        </div>

        {/* Browser mockup */}
        <div className="max-w-4xl mx-auto mt-14">
          <div className="bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-[#E2E8F0] overflow-hidden">
            <div className="bg-[#F1F5F9] px-4 py-2.5 flex items-center gap-2 border-b border-[#E2E8F0]">
              <div className="flex gap-1.5">
                {['#EF4444', '#F59E0B', '#10B981'].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 bg-white rounded-md h-5 mx-4 flex items-center justify-center text-xs text-[#94A3B8]">
                myhujjat.uz/dashboard
              </div>
            </div>
            <div className="grid grid-cols-4 min-h-[180px]">
              <div className="bg-[#F8FAFC] border-r border-[#E2E8F0] p-4 space-y-2">
                {['Bosh sahifa', 'Shartnomalar', 'Kontragentlar', 'Kadrlar', 'Buxgalter', 'Yurist'].map(item => (
                  <div key={item} className="h-5 rounded bg-[#E2E8F0] text-[10px] flex items-center px-2 text-[#94A3B8]">{item}</div>
                ))}
              </div>
              <div className="col-span-3 p-5">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {['245', '38', '12'].map((v, i) => (
                    <div key={i} className="bg-[#F1F5F9] rounded-lg p-3">
                      <div className="text-[#2563EB] font-black text-lg">{v}</div>
                      <div className="text-[10px] text-[#94A3B8]">{['Shartnomalar', 'Kontragentlar', 'Xodimlar'][i]}</div>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-7 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-12 border-y border-[#E2E8F0] bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '12+', label: 'Shartnoma shabloni' },
              { value: '3',   label: 'Interfeys tili' },
              { value: '99%', label: 'Uptime' },
              { value: '🇺🇿',  label: "O'z serverlar" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="font-display font-black text-[#0F172A] text-3xl">{stat.value}</p>
                <p className="text-sm text-[#94A3B8] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              Biznes uchun hamma narsa
            </h2>
            <p className="text-[#475569] text-lg">O'zbekiston qonunchiligiga mos professional hujjatlar</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(f => {
              const isHighlight = (f as any).highlight
              return (
                <div
                  key={f.title}
                  className={
                    isHighlight
                      ? "p-5 rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] text-white border-0 shadow-lg shadow-violet-200 sm:col-span-2 lg:col-span-2 relative overflow-hidden"
                      : "p-5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#DBEAFE] hover:shadow-md transition-all"
                  }
                >
                  {isHighlight && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full">
                      YANGI
                    </span>
                  )}
                  <div className="text-2xl mb-3">{f.icon}</div>
                  <h3 className={`font-display font-bold text-sm mb-1.5 ${isHighlight ? 'text-white text-base' : 'text-[#0F172A]'}`}>
                    {f.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isHighlight ? 'text-blue-100 text-sm' : 'text-[#94A3B8]'}`}>
                    {f.desc}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="narxlar" className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">Narxlar</h2>
            <p className="text-[#475569]">Kichik biznesdan yirik korporatsiyagacha</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl bg-white border-2 ${plan.color} ${plan.popular ? 'shadow-xl shadow-violet-100' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">
                    Mashhur
                  </div>
                )}
                <h3 className="font-display font-black text-[#0F172A] text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 my-3">
                  <span className="font-display font-black text-3xl text-[#0F172A]">{plan.price}</span>
                  {plan.period && <span className="text-sm text-[#94A3B8]">so'm{plan.period}</span>}
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map(feat => (
                    <li key={feat} className="flex items-center gap-2 text-sm text-[#475569]">
                      <span className="text-[#16A34A]">✓</span> {feat}
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

          <p className="text-center text-sm text-[#94A3B8] mt-6">
            Narxlar yillik to'lovda 25% chegirma bilan mavjud.{' '}
            <Link href="/narxlar" className="text-[#2563EB] hover:underline">Batafsil →</Link>
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display font-black text-[#0F172A] text-3xl text-center mb-10">
            Mijozlar nima deydi
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="p-5 bg-white border border-[#E2E8F0] rounded-xl">
                <p className="text-sm text-[#475569] leading-relaxed mb-4">"{t.text}"</p>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                  <p className="text-xs text-[#94A3B8]">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-display font-black text-[#0F172A] text-3xl text-center mb-10">
            Ko'p so'raladigan savollar
          </h2>
          <div className="space-y-3">
            {FAQS.map(faq => (
              <details
                key={faq.q}
                className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden group"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-semibold text-[#0F172A] list-none select-none">
                  {faq.q}
                  <span className="text-[#94A3B8] text-lg leading-none group-open:rotate-45 transition-transform">+</span>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm text-[#475569] leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-br from-[#2563EB] to-[#7C3AED]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-display font-black text-white text-3xl md:text-4xl mb-4">
            Bugun boshlang
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            7 kun bepul Pro rejani sinab ko'ring. Kredit kartasi shart emas.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-[#2563EB] font-bold px-8 py-3.5 rounded-xl hover:shadow-lg transition-all text-sm"
          >
            Bepul ro'yxatdan o'tish →
          </Link>
        </div>
      </section>
    </div>
  )
}
