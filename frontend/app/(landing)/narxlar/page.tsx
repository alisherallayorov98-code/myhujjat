import Link           from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       "Narxlar — MyHujjat.uz",
  description: "MyHujjat.uz tarif rejalari: Bepul, Standart, Pro. O'zbekiston bizneslar uchun.",
}

const COMPARE_ROWS = [
  ['Oylik shartnomalar',        '5 ta',   '50 ta',  'Cheksiz'],
  ['Shablonlar',                'Asosiy', 'Barcha', 'Barcha'],
  ['PDF/Word eksport',          '✓',      '✓',      '✓'],
  ['Kadrlar (HR)',               '✗',      '✓',      '✓'],
  ['Buxgalter hujjatlar',       '✗',      '✓',      '✓'],
  ['Kotib hujjatlar',           '✗',      '✓',      '✓'],
  ['AI hujjat generatsiya',     '✗',      '✗',      '✓'],
  ['Yurist hujjatlar',          '✗',      '✗',      '✓'],
  ['E-imzo (ERI)',               '✗',      '✗',      '✓'],
  ['Didox integratsiya',        '✗',      '✗',      '✓'],
  ["Email qo'llab-quvvatlash",  '✓',      '✓',      '✓'],
]

const PLANS = [
  {
    name:     'Bepul',
    monthly:  '0',
    yearly:   '0',
    color:    'border-[#E2E8F0]',
    btnClass: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]',
    href:     '/register',
    btnText:  'Bepul boshlash',
    popular:  false,
  },
  {
    name:     'Standart',
    monthly:  '149 000',
    yearly:   '111 750',
    color:    'border-[#2563EB]',
    btnClass: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',
    href:     '/register?plan=standard',
    btnText:  'Tanlash',
    popular:  false,
  },
  {
    name:     'Pro',
    monthly:  '299 000',
    yearly:   '224 250',
    color:    'border-[#7C3AED]',
    btnClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',
    href:     '/register?plan=pro',
    btnText:  'Tanlash',
    popular:  true,
  },
]

export default function NarxlarPage() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-[#0F172A] text-4xl mb-3">
            Narxlar va rejalari
          </h1>
          <p className="text-[#475569] text-lg">Har bir biznes uchun mos reja</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-sm text-[#94A3B8]">Oylik</span>
            <div className="w-12 h-6 bg-[#2563EB] rounded-full relative">
              <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
            </div>
            <span className="text-sm text-[#0F172A] font-medium">
              Yillik
              <span className="ml-1.5 text-xs bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full">25% chegirma</span>
            </span>
          </div>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
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

              {/* Yillik narx */}
              <div className="flex items-baseline gap-1 my-3">
                <span className="font-display font-black text-3xl text-[#0F172A]">{plan.yearly}</span>
                {plan.yearly !== '0' && <span className="text-sm text-[#94A3B8]">so'm/oy</span>}
              </div>
              {plan.monthly !== '0' && (
                <p className="text-xs text-[#94A3B8] -mt-2 mb-3">
                  Oylik: {plan.monthly} so'm
                </p>
              )}

              <Link
                href={plan.href}
                className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${plan.btnClass}`}
              >
                {plan.btnText}
              </Link>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <h2 className="font-display font-bold text-[#0F172A] text-2xl mb-6 text-center">
          Batafsil taqqoslash
        </h2>
        <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
          <table className="w-full border-collapse bg-white">
            <thead>
              <tr className="bg-[#F8FAFC]">
                <th className="text-left p-4 text-sm text-[#94A3B8] font-medium border-b border-[#E2E8F0] w-1/2">
                  Imkoniyat
                </th>
                <th className="p-4 text-center text-sm font-bold text-[#0F172A] border-b border-[#E2E8F0]">Bepul</th>
                <th className="p-4 text-center text-sm font-bold text-[#2563EB] border-b border-[#E2E8F0]">Standart</th>
                <th className="p-4 text-center text-sm font-bold text-[#7C3AED] border-b border-[#E2E8F0]">Pro</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map(([feat, free, std, pro], idx) => (
                <tr key={feat} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                  <td className="p-4 text-sm text-[#475569]">{feat}</td>
                  <td className={`p-4 text-center text-sm font-medium ${free === '✗' ? 'text-[#CBD5E1]' : 'text-[#0F172A]'}`}>{free}</td>
                  <td className={`p-4 text-center text-sm font-medium ${std  === '✗' ? 'text-[#CBD5E1]' : 'text-[#2563EB]'}`}>{std}</td>
                  <td className={`p-4 text-center text-sm font-medium ${pro  === '✗' ? 'text-[#CBD5E1]' : 'text-[#7C3AED]'}`}>{pro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center p-8 bg-gradient-to-br from-[#EFF6FF] to-[#F5F3FF] rounded-2xl border border-[#DBEAFE]">
          <h3 className="font-display font-black text-[#0F172A] text-xl mb-2">
            Hali ham savol bormi?
          </h3>
          <p className="text-[#475569] text-sm mb-5">
            7 kun bepul Pro sinab ko'ring yoki biz bilan bog'laning.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/register"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-6 py-2.5 rounded-lg text-sm transition-colors"
            >
              Bepul boshlash →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
