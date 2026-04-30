import Link           from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title:       "Haqida — MyHujjat.uz",
  description: "MyHujjat.uz haqida — O'zbekiston uchun professional hujjat platformasi.",
}

export default function HaqidaPage() {
  return (
    <div className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-[#0F172A] text-4xl mb-4">
            MyHujjat.uz haqida
          </h1>
          <p className="text-[#475569] text-lg leading-relaxed">
            O'zbekiston bizneslar uchun yaratilgan professional hujjat platformasi
          </p>
        </div>

        <div className="prose max-w-none space-y-6 text-[#475569] text-sm leading-relaxed">
          <p>
            <strong className="text-[#0F172A]">MyHujjat.uz</strong> — O'zbekiston qonunchiligiga mos shartnomalar,
            HR hujjatlar, buxgalter va yuridik hujjatlarni tez va oson yaratish uchun mo'ljallangan SaaS platforma.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { icon: '🎯', title: 'Missiya',    text: "O'zbekiston bizneslarini qog'ozbozlikdan xalos qilish va vaqtini tejash." },
              { icon: '👁', title: 'Maqsad',     text: "Har bir kichik biznes ham professional hujjatlarga ega bo'lishi kerak." },
              { icon: '🛡️', title: 'Xavfsizlik', text: "Ma'lumotlar O'zbekistonning o'z serverlarida shifrlangan holda saqlanadi." },
              { icon: '🤝', title: 'Qo\'llab-quvvatlash', text: "Ish vaqtida texnik yordam va konsultatsiya xizmati mavjud." },
            ].map(item => (
              <div key={item.title} className="p-5 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-[#94A3B8]">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A] mb-2">Aloqa</h3>
            <p>Email: <a href="mailto:info@myhujjat.uz" className="text-[#2563EB]">info@myhujjat.uz</a></p>
            <p>Manzil: Toshkent sh., O'zbekiston</p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          >
            Bepul boshlash →
          </Link>
        </div>
      </div>
    </div>
  )
}
