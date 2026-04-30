import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Foydalanish shartlari — MyHujjat.uz',
  description: 'MyHujjat.uz xizmatidan foydalanish shartlari va qoidalari',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#475569] hover:text-[#2563EB] transition mb-6">
          <ArrowLeft size={14} /> Bosh sahifa
        </Link>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-10">
          <h1 className="font-display text-2xl sm:text-3xl font-black text-[#0F172A] mb-2">
            Foydalanish shartlari
          </h1>
          <p className="text-sm text-[#94A3B8] mb-8">Oxirgi yangilanish: 2026-yil 27-aprel</p>

          <div className="prose prose-sm sm:prose-base max-w-none text-[#374151] leading-relaxed space-y-6">
            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">1. Umumiy qoidalar</h2>
              <p>
                MyHujjat.uz (keyingi o'rinlarda "Xizmat") — O'zbekiston Respublikasi rezident va norezident
                yuridik shaxslari uchun yuridik-moliyaviy hujjatlarni avtomatik yaratish, saqlash va
                imzolash uchun mo'ljallangan onlayn platforma. Xizmatdan foydalanish orqali siz ushbu
                shartlarga rozilik bildirgan hisoblanasiz.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">2. Hisob ochish</h2>
              <p>
                Xizmatdan foydalanish uchun siz amaldagi email manzili va parol bilan ro'yxatdan
                o'tasiz. Hisob ma'lumotlarining maxfiyligi va ulardan foydalanishda yuzaga keladigan
                barcha amallar uchun siz mas'ul hisoblanasiz. Begona shaxsga hisobingizdan foydalanishga
                ruxsat berish taqiqlanadi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">3. Xizmat doirasi</h2>
              <p>Xizmat orqali siz quyidagi imkoniyatlardan foydalanishingiz mumkin:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Shartnomalar, fakturalar, akt-sverkalar va boshqa hujjatlarni yaratish</li>
                <li>STIR (INN) orqali kontragent ma'lumotlarini avtomatik to'ldirish</li>
                <li>Hujjatlarni PDF va Word formatlarida yuklab olish</li>
                <li>Elektron raqamli imzo (E-imzo) bilan hujjatlarni tasdiqlash</li>
                <li>AI yordamida hujjat mazmunini yaratish (Pro reja)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">4. Obuna va to'lovlar</h2>
              <p>
                Xizmat <strong>FREE</strong> (bepul, oyiga 3 ta shartnoma), <strong>STANDARD</strong> va
                <strong> PRO</strong> rejalari bo'yicha taqdim etiladi. To'lovlar Click va Payme orqali
                amalga oshiriladi. Obuna avtomatik yangilanmaydi — har oy yoki yil tugagach, foydalanuvchi
                qo'lda yangilashi kerak.
              </p>
              <p className="mt-2">
                To'lov amalga oshirilgandan so'ng pul qaytarilmaydi. Texnik nosozliklar yoki Xizmat
                tomonidan bo'lgan xatoliklar bundan mustasno.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">5. Foydalanuvchi mas'uliyati</h2>
              <p>Foydalanuvchi quyidagilarga rozilik bildiradi:</p>
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Faqat haqiqiy va to'g'ri ma'lumotlarni kiritish</li>
                <li>Xizmatdan qonun chiqaruvchi maqsadlarda foydalanmaslik</li>
                <li>Boshqa foydalanuvchilarning huquqlarini buzmaslik</li>
                <li>Tizim xavfsizligiga zarar yetkazadigan amallarni amalga oshirmaslik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">6. Mas'uliyat cheklovi</h2>
              <p>
                Xizmat avtomatik yaratilgan hujjatlarning mazmuniy to'g'riligi uchun mas'uliyatni o'z
                zimmasiga olmaydi. Yaratilgan hujjatlar shablonlar asosida tuziladi va har bir foydalanuvchi
                ularni o'z holatiga moslashtirib, kerak bo'lsa malakali yurist bilan maslahatlashishi
                tavsiya etiladi.
              </p>
              <p className="mt-2">
                Xizmat texnik nosozliklar, server uzilishlari yoki uchinchi shaxs xizmatlari (Soliq API,
                E-imzo, Click/Payme) ishlamasligi natijasida yetkazilgan zarar uchun javobgar emas.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">7. Hisobni bekor qilish</h2>
              <p>
                Foydalanuvchi istagan vaqtda hisobini o'chirishi mumkin. Xizmat ham foydalanuvchi shu
                shartlarni buzgan taqdirda hisobni bloklashga haqli. Hisob o'chirilgandan so'ng
                ma'lumotlar qonunchilikda belgilangan muddat davomida saqlanadi va keyin to'liq o'chiriladi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">8. Shartlarga o'zgartirish</h2>
              <p>
                Xizmat ushbu shartlarni istalgan vaqtda yangilashga haqli. Yangilanishlar saytda e'lon
                qilinadi va elektron pochta orqali ma'lumot beriladi. Yangilanishlardan keyin Xizmatdan
                foydalanish — yangi shartlarni qabul qilganlikni anglatadi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold text-[#0F172A] mt-6 mb-3">9. Aloqa</h2>
              <p>
                Savollar yoki shikoyatlar uchun: <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] hover:underline">support@myhujjat.uz</a>
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
