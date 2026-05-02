import Link               from 'next/link'
import type { Metadata }  from 'next'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'

export async function generateMetadata(): Promise<Metadata> {
  const t = await (getTranslations as any)('about.metadata')
  return {
    title:       t('title'),
    description: t('description'),
  }
}

export default function HaqidaPage() {
  const t = useTranslations('about')
  const values = (t.raw as any)('values') as { icon: string; title: string; text: string }[]
  const tc = (t.raw as any)('contact') as { title: string; emailLabel: string; addressLabel: string; address: string }

  return (
    <div className="py-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-display font-black text-[#0F172A] text-4xl mb-4">
            {t('title')}
          </h1>
          <p className="text-[#475569] text-lg leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="prose max-w-none space-y-6 text-[#475569] text-sm leading-relaxed">
          <p dangerouslySetInnerHTML={{ __html: t('intro') }} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {values.map(item => (
              <div key={item.title} className="p-5 bg-white border border-[#E2E8F0] rounded-xl">
                <div className="text-2xl mb-2">{item.icon}</div>
                <h3 className="font-bold text-[#0F172A] text-sm mb-1">{item.title}</h3>
                <p className="text-xs text-[#94A3B8]">{item.text}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0]">
            <h3 className="font-bold text-[#0F172A] mb-2">{tc.title}</h3>
            <p>{tc.emailLabel} <a href="mailto:info@myhujjat.uz" className="text-[#2563EB]">info@myhujjat.uz</a></p>
            <p>{tc.addressLabel} {tc.address}</p>
          </div>
        </div>

        <div className="text-center mt-10">
          <Link
            href="/register"
            className="inline-block bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-8 py-3 rounded-xl text-sm transition-colors"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>
    </div>
  )
}
