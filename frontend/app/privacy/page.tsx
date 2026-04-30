import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Maxfiylik siyosati — MyHujjat.uz',
  description: 'MyHujjat.uz foydalanuvchi ma\'lumotlarini qanday yig\'adi, ishlatadi va himoyalaydi',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#2563EB] transition mb-6">
          <ArrowLeft size={14} /> Bosh sahifa
        </Link>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0F172A] mb-2">
            Maxfiylik siyosati
          </h1>
          <p className="text-sm text-[#94A3B8] mb-8">Oxirgi yangilanish: 2026-yil 27-aprel</p>

          <div className="prose prose-sm sm:prose-base max-w-none text-[#374151] leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">1. Kirish</h2>
              <p>
                MyHujjat.uz (keyingi o'rinlarda "Biz", "Xizmat") foydalanuvchilarning shaxsiy
                ma'lumotlarini himoya qilishni o'z burchimiz deb biladi. Ushbu hujjat sizning
                ma'lumotlaringiz qanday yig'ilishi, saqlanishi va ishlatilishini batafsil tushuntiradi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">2. Yig'iladigan ma'lumotlar</h2>
              <p>Biz quyidagi ma'lumotlarni yig'amiz:</p>

              <h3 className="text-base font-semibold text-[#0F172A] mt-4 mb-2">2.1. Hisob ma'lumotlari</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ism va familiya</li>
                <li>Email manzil</li>
                <li>Telefon raqam (ixtiyoriy)</li>
                <li>Avatar rasmi (ixtiyoriy)</li>
                <li>Parol (shifrlangan holatda saqlanadi)</li>
              </ul>

              <h3 className="text-base font-semibold text-[#0F172A] mt-4 mb-2">2.2. Tashkilot va biznes ma'lumotlari</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>Tashkilot nomi, STIR (INN)</li>
                <li>Yuridik manzil, telefon</li>
                <li>Bank rekvizitlari (MFO, hisob raqam)</li>
                <li>Rahbar va bosh hisobchi ma'lumotlari</li>
                <li>Kontragentlar ma'lumotlari (siz qo'shgan)</li>
                <li>Yaratilgan hujjatlar mazmuni</li>
              </ul>

              <h3 className="text-base font-semibold text-[#0F172A] mt-4 mb-2">2.3. Texnik ma'lumotlar</h3>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP manzil va brauzer turi</li>
                <li>Kirish vaqti va sahifalar tarixi (audit log)</li>
                <li>Qurilma ma'lumotlari (mobil/desktop)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">3. Ma'lumotlardan foydalanish</h2>
              <p>Yig'ilgan ma'lumotlar quyidagi maqsadlarda ishlatiladi:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Xizmat ko'rsatish va hujjatlarni yaratish</li>
                <li>Hisobingiz xavfsizligini ta'minlash</li>
                <li>Texnik yordam va bildirishnomalar yuborish</li>
                <li>Xizmat sifatini yaxshilash uchun statistik tahlil</li>
                <li>Qonun talabiga ko'ra davlat organlariga taqdim etish</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">4. Ma'lumotlarni uchinchi shaxslarga berish</h2>
              <p>
                Biz sizning shaxsiy ma'lumotlaringizni uchinchi shaxslarga sotmaymiz va bermaymiz, faqat
                quyidagi holatlardan tashqari:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li><strong>Soliq API:</strong> STIR ma'lumotlarini olish uchun (Davlat soliq qo'mitasi)</li>
                <li><strong>To'lov tizimlari:</strong> Click va Payme orqali to'lov amalga oshirilganda</li>
                <li><strong>E-imzo provayderlari:</strong> Elektron imzo qo'yishda</li>
                <li><strong>Email xizmati (Resend):</strong> Bildirishnoma xatlarini yuborish uchun</li>
                <li><strong>Davlat organlari:</strong> Sud qarori yoki qonun talabiga ko'ra</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">5. Ma'lumotlar xavfsizligi</h2>
              <p>Biz ma'lumotlarni himoya qilish uchun quyidagi choralarni ko'ramiz:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Parollar bcrypt algoritmi bilan shifrlanadi</li>
                <li>HTTPS (SSL/TLS) shifrlash barcha ma'lumotlar uzatishida</li>
                <li>Ma'lumotlar bazasiga cheklangan kirish (faqat avtorizatsiyalangan kodlar)</li>
                <li>Muntazam zaxira nusxa (backup) olish</li>
                <li>Audit log — barcha amallar yozilib boriladi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">6. Cookies va kuzatuv</h2>
              <p>
                Biz faqat zarur (essential) cookies'lardan foydalanamiz — sessiya saqlash, til tanlash va
                interfeys sozlamalari uchun. Reklamalar yoki uchinchi shaxs analitika xizmatlari ishlatilmaydi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">7. Sizning huquqlaringiz</h2>
              <p>Sizning quyidagi huquqlaringiz mavjud:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>O'zingiz haqingizdagi ma'lumotlarni ko'rish va yuklab olish</li>
                <li>Noto'g'ri ma'lumotlarni tuzatish</li>
                <li>Hisobingizni va barcha ma'lumotlarni o'chirish</li>
                <li>Ma'lumotlarning ishlatilishi haqida tushuntirish so'rash</li>
              </ul>
              <p className="mt-2">
                Bu huquqlardan foydalanish uchun: <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] hover:underline">support@myhujjat.uz</a>
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">8. Ma'lumotlarni saqlash muddati</h2>
              <p>
                Hisob faol bo'lgan davrda ma'lumotlar saqlanadi. Hisob o'chirilgandan so'ng:
              </p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Shaxsiy ma'lumotlar 30 kun ichida o'chiriladi</li>
                <li>Yaratilgan hujjatlar O'zbekiston Respublikasi soliq qonunchiligiga ko'ra 5 yil saqlanadi</li>
                <li>Audit log ma'lumotlari xavfsizlik maqsadida 1 yil saqlanadi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">9. Bolalar</h2>
              <p>
                Xizmatdan 18 yoshga to'lmagan shaxslar foydalana olmaydi. Agar siz 18 yoshdan kichik
                ekaningiz aniqlansa, hisobingiz o'chiriladi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">10. O'zgarishlar</h2>
              <p>
                Ushbu siyosat vaqti-vaqti bilan yangilanishi mumkin. Muhim o'zgarishlar haqida sizga email
                orqali xabar beriladi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">11. Aloqa</h2>
              <p>
                Maxfiylik bilan bog'liq savollar uchun: <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] hover:underline">support@myhujjat.uz</a>
              </p>
            </section>
          </div>
        </div>

        <p className="text-center text-xs text-[#94A3B8] mt-6">
          MyHujjat.uz — O'zbekiston uchun hujjat platformasi
        </p>
      </div>
    </div>
  )
}
