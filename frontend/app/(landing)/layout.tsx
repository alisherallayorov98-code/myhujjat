import Link         from 'next/link'
import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myhujjat.uz'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title:       "MyHujjat.uz — O'zbekiston uchun hujjat platformasi",
  description: "Shartnomalar, HR hujjatlar, yuridik hujjatlar, e-imzo — barchasi bir joyda. O'zbekiston qonunchiligiga mos professional hujjatlarni bir daqiqada yarating.",
  keywords:    'shartnoma, hujjat, e-imzo, uzbekiston, buxgalter, kadrlar, yurist, faktura, akt sverki',
  authors:     [{ name: 'MyHujjat.uz' }],
  creator:     'MyHujjat.uz',
  publisher:   'MyHujjat.uz',
  formatDetection: { email: false, telephone: false, address: false },
  alternates: {
    canonical: '/',
    languages: {
      'uz-UZ': '/',
      'ru-RU': '/?lang=ru',
    },
  },
  openGraph: {
    title:       'MyHujjat.uz — O\'zbekiston uchun hujjat platformasi',
    description: "AI yordamida 1 daqiqada professional shartnoma. Shartnomalar, fakturalar, e-imzo.",
    type:        'website',
    locale:      'uz_UZ',
    url:         SITE_URL,
    siteName:    'MyHujjat.uz',
    images: [
      { url: '/icons/icon-512.png', width: 512, height: 512, alt: 'MyHujjat.uz' },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'MyHujjat.uz',
    description: "O'zbekiston uchun hujjat platformasi",
    images:      ['/icons/icon-512.png'],
  },
  robots: {
    index:   true,
    follow:  true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
            <span className="text-white font-black text-sm">M</span>
          </div>
          <span className="font-display font-black text-[#0F172A] text-lg">MyHujjat.uz</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <details className="relative group">
            <summary className="list-none cursor-pointer text-[#475569] hover:text-[#0F172A] transition-colors">
              Kim uchun
            </summary>
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 z-50">
              <Link href="/buxgalterlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                Buxgalterlar uchun
              </Link>
              <Link href="/yuristlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                Yuristlar uchun
              </Link>
              <Link href="/kadrlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                Kadrlar bo'limi uchun
              </Link>
            </div>
          </details>
          <Link href="/narxlar" className="text-[#475569] hover:text-[#0F172A] transition-colors">Narxlar</Link>
          <Link href="/haqida"  className="text-[#475569] hover:text-[#0F172A] transition-colors">Haqida</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-[#475569] hover:text-[#0F172A] px-3 py-2"
          >
            Kirish
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            Bepul boshlash
          </Link>
        </div>
      </div>
    </header>
  )
}

function LandingFooter() {
  return (
    <footer className="bg-[#0F172A] text-[#94A3B8]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center">
                <span className="text-white font-black text-sm">M</span>
              </div>
              <span className="text-white font-display font-black text-lg">MyHujjat.uz</span>
            </div>
            <p className="text-sm leading-relaxed max-w-xs">
              O'zbekiston bizneslar uchun professional hujjat yaratish platformasi. Shartnomalar, HR, yurist, buxgalter hujjatlarini bir daqiqada yarating.
            </p>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">Kim uchun</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/buxgalterlar-uchun" className="hover:text-white transition-colors">Buxgalterlar uchun</Link></li>
              <li><Link href="/yuristlar-uchun"    className="hover:text-white transition-colors">Yuristlar uchun</Link></li>
              <li><Link href="/kadrlar-uchun"      className="hover:text-white transition-colors">Kadrlar uchun</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">Kompaniya</p>
            <ul className="space-y-2 text-sm">
              {[
                { label: 'Haqida',                  href: '/haqida'  },
                { label: 'Narxlar',                 href: '/narxlar' },
                { label: 'Yordam markazi',          href: '/yordam'  },
                { label: 'Foydalanish shartlari',   href: '/terms'   },
                { label: 'Maxfiylik siyosati',      href: '/privacy' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1E293B] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs">&copy; {new Date().getFullYear()} MyHujjat.uz. Barcha huquqlar himoyalangan.</p>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/terms"   className="hover:text-white transition-colors">Shartlar</Link>
            <span className="text-[#1E293B]">·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">Maxfiylik</Link>
            <span className="text-[#1E293B]">·</span>
            <span>🇺🇿 Toshkent</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingHeader />
      <main className="flex-1">{children}</main>
      <LandingFooter />
    </div>
  )
}
