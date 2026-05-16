import Link               from 'next/link'
import type { Metadata }  from 'next'
import { getTranslations } from 'next-intl/server'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://myhujjat.uz'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('landing.metadata')
  return {
    metadataBase: new URL(SITE_URL),
    title:        t('title'),
    description:  t('description'),
    keywords:     'shartnoma, hujjat, e-imzo, uzbekiston, buxgalter, kadrlar, yurist, faktura, akt sverki',
    authors:      [{ name: 'MyHujjat.uz' }],
    creator:      'MyHujjat.uz',
    publisher:    'MyHujjat.uz',
    formatDetection: { email: false, telephone: false, address: false },
    alternates: {
      canonical: '/',
      languages: {
        'uz-UZ': '/',
        'ru-RU': '/?lang=ru',
      },
    },
    openGraph: {
      title:       t('ogTitle'),
      description: t('ogDescription'),
      type:        'website',
      locale:      'uz_UZ',
      url:         SITE_URL,
      siteName:    'MyHujjat.uz',
      images: [
        { url: '/opengraph-image', width: 1200, height: 630, alt: "MyHujjat.uz — O'zbekiston hujjat platformasi" },
      ],
    },
    twitter: {
      card:        'summary_large_image',
      title:       'MyHujjat.uz',
      description: t('twitterDescription'),
      images:      ['/opengraph-image'],
    },
    robots: {
      index:   true,
      follow:  true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  }
}

async function LandingHeader() {
  const t = await getTranslations('landing.header')
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
              {t('kimUchun')}
            </summary>
            <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-lg p-2 z-50">
              <Link href="/buxgalterlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                {t('buxgalter')}
              </Link>
              <Link href="/yuristlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                {t('yurist')}
              </Link>
              <Link href="/kadrlar-uchun" className="block px-3 py-2 rounded-lg hover:bg-[#F1F5F9] text-[#0F172A]">
                {t('kadrlar')}
              </Link>
            </div>
          </details>
          <Link href="/narxlar" className="text-[#475569] hover:text-[#0F172A] transition-colors">{t('narxlar')}</Link>
          <Link href="/haqida"  className="text-[#475569] hover:text-[#0F172A] transition-colors">{t('haqida')}</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="text-sm text-[#475569] hover:text-[#0F172A] px-3 py-2"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="text-sm bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            {t('register')}
          </Link>
        </div>
      </div>
    </header>
  )
}

async function LandingFooter() {
  const t  = await getTranslations('landing.footer')
  const th = await getTranslations('landing.header')
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
              {t('tagline')}
            </p>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">{t('kimUchun')}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/buxgalterlar-uchun" className="hover:text-white transition-colors">{th('buxgalter')}</Link></li>
              <li><Link href="/yuristlar-uchun"    className="hover:text-white transition-colors">{th('yurist')}</Link></li>
              <li><Link href="/kadrlar-uchun"      className="hover:text-white transition-colors">{th('kadrlar')}</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-white text-sm font-semibold mb-3">{t('kompaniya')}</p>
            <ul className="space-y-2 text-sm">
              {[
                { label: t('haqida'),  href: '/haqida'  },
                { label: t('narxlar'), href: '/narxlar' },
                { label: t('yordam'),  href: '/yordam'  },
                { label: t('terms'),   href: '/terms'   },
                { label: t('privacy'), href: '/privacy' },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="hover:text-white transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-[#1E293B] pt-6 flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="text-xs">&copy; {new Date().getFullYear()} MyHujjat.uz. {t('copyright')}</p>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/terms"   className="hover:text-white transition-colors">{t('termsShort')}</Link>
            <span className="text-[#1E293B]">·</span>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('privacyShort')}</Link>
            <span className="text-[#1E293B]">·</span>
            <span>🇺🇿 {t('city')}</span>
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
