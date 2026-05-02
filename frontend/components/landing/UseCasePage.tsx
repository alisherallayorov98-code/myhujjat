'use client'

import Link  from 'next/link'
import { useTranslations } from 'next-intl'
import {
  CheckCircle2, Sparkles, ArrowRight, Clock, Shield, FileText,
} from 'lucide-react'

export interface UseCaseConfig {
  title:    string
  subtitle: string
  hero: {
    headline:    string
    description: string
    cta:         string
  }
  problems: { title: string; description: string }[]
  solutions: { title: string; description: string; icon?: 'doc' | 'shield' | 'clock' }[]
  features: string[]
  documents: string[]
  stats: { label: string; value: string }[]
  faq: { q: string; a: string }[]
}

export function UseCasePage({ config }: { config: UseCaseConfig }) {
  const t = useTranslations('useCases.ui')
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#F8FAFC] via-white to-[#DBEAFE]/30 px-4 pt-14 pb-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DBEAFE] text-[#2563EB] text-xs font-semibold mb-5">
            <Sparkles size={13} />
            {config.title}
          </div>
          <h1 className="font-display font-black text-[#0F172A] text-3xl sm:text-5xl leading-tight mb-5">
            {config.hero.headline}
          </h1>
          <p className="text-lg text-[#475569] leading-relaxed max-w-2xl mx-auto mb-8">
            {config.hero.description}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm transition-colors"
            >
              {config.hero.cta}
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/narxlar"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white hover:bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-semibold text-sm transition-colors"
            >
              {t('ctaSecondary')}
            </Link>
          </div>

          {/* Statistika */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-12">
            {config.stats.map(s => (
              <div key={s.label} className="bg-white rounded-xl border border-[#E2E8F0] p-4 text-center">
                <p className="font-display font-black text-[#2563EB] text-2xl">{s.value}</p>
                <p className="text-xs text-[#64748B] mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Muammolar */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-[#DC2626] font-semibold text-sm mb-2">{t('problemsTag')}</p>
          <h2 className="font-display font-black text-[#0F172A] text-2xl sm:text-3xl">
            {config.subtitle} {t('problemsTitle')}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {config.problems.map((p, i) => (
            <div key={i} className="bg-[#FEF2F2] border border-[#FECACA] rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center mb-3">
                <span className="text-xl">😩</span>
              </div>
              <h3 className="font-display font-bold text-[#991B1B] text-base mb-1.5">{p.title}</h3>
              <p className="text-sm text-[#7F1D1D] leading-relaxed">{p.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Yechim */}
      <section className="bg-[#F8FAFC] px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[#16A34A] font-semibold text-sm mb-2">{t('solutionsTag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-2xl sm:text-3xl">
              {t('solutionsTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {config.solutions.map((s, i) => {
              const Icon = s.icon === 'shield' ? Shield : s.icon === 'clock' ? Clock : FileText
              return (
                <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center mb-3">
                    <Icon size={18} className="text-[#16A34A]" />
                  </div>
                  <h3 className="font-display font-bold text-[#0F172A] text-base mb-1.5">{s.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{s.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Xususiyatlar va hujjatlar */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-display font-black text-[#0F172A] text-2xl mb-5">
              {t('featuresTitle')}
            </h2>
            <ul className="space-y-3">
              {config.features.map((f, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-[#16A34A] shrink-0 mt-0.5" />
                  <span className="text-sm text-[#0F172A]">{f}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="font-display font-black text-[#0F172A] text-2xl mb-5">
              {t('documentsTitle')}
            </h2>
            <div className="grid grid-cols-1 gap-2">
              {config.documents.map((d, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] flex items-center justify-center shrink-0">
                    <FileText size={15} className="text-[#2563EB]" />
                  </div>
                  <span className="text-sm font-medium text-[#0F172A]">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F8FAFC] px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-black text-[#0F172A] text-2xl sm:text-3xl text-center mb-10">
            {t('faqTitle')}
          </h2>
          <div className="space-y-3">
            {config.faq.map((item, i) => (
              <details key={i} className="bg-white border border-[#E2E8F0] rounded-xl group">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-[#0F172A] text-sm flex items-center justify-between">
                  {item.q}
                  <ArrowRight size={15} className="text-[#94A3B8] transition-transform group-open:rotate-90" />
                </summary>
                <p className="px-5 pb-4 text-sm text-[#475569] leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-3xl sm:text-4xl mb-4">
            {t('finalCtaTitle')}
          </h2>
          <p className="text-lg text-blue-100 mb-8">
            {t('finalCtaSubtitle')}
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-blue-50 text-[#1E3A8A] font-bold text-base transition-colors"
          >
            {t('finalCtaButton')}
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  )
}
