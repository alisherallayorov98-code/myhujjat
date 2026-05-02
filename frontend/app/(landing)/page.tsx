'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Sparkles, FileText, Users, Calculator, Scale, Briefcase,
  Zap, Shield, ArrowRight, Check, X, Mic, Download, Search,
  Clock, BarChart3, Lock, Globe, Smartphone,
} from 'lucide-react'

// ─── Live counter component ──────────────────────────────
function LiveCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
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
  const t = useTranslations('landing')

  // Department icon mappings
  const DEPT_ICONS = { hr: Users, accounting: Calculator, lawyer: Scale, management: Briefcase }
  const DEPT_COLORS = {
    hr:         'bg-[#DBEAFE] text-[#2563EB] border-[#BFDBFE]',
    accounting: 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]',
    lawyer:     'bg-[#FEF3C7] text-[#D97706] border-[#FED7AA]',
    management: 'bg-[#F3E8FF] text-[#7C3AED] border-[#E9D5FF]',
  }
  const DEPT_LINKS  = {
    hr:         '/kadrlar-uchun',
    accounting: '/buxgalterlar-uchun',
    lawyer:     '/yuristlar-uchun',
    management: '/register',
  }
  const DEPT_KEYS = ['hr', 'accounting', 'lawyer', 'management'] as const

  // Feature icons
  const FEATURE_ICONS = [Zap, Shield, Download, Search, Clock, BarChart3, Lock, Smartphone, Globe]

  // Testimonial colors
  const TESTI_COLORS = [
    'bg-[#DBEAFE] text-[#2563EB]',
    'bg-[#DCFCE7] text-[#16A34A]',
    'bg-[#FEF3C7] text-[#D97706]',
  ]

  // Pricing styles
  const PLAN_STYLES = [
    { color: 'border-[#E2E8F0]',  btnClass: 'bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#0F172A]',  popular: false, href: '/register' },
    { color: 'border-[#2563EB]',  btnClass: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white',       popular: false, href: '/register?plan=standard' },
    { color: 'border-[#7C3AED]',  btnClass: 'bg-[#7C3AED] hover:bg-[#6D28D9] text-white',       popular: true,  href: '/register?plan=pro' },
  ]
  const PLAN_KEYS = ['free', 'standard', 'pro'] as const
  const PLAN_PRICES = ['0', '149 000', '299 000']

  // Get arrays/objects from JSON
  const docTypes:    { icon: string, label: string }[] = (t.raw('documentTypes.list') as any) || []
  const steps:       { n: string, title: string, desc: string }[] = (t.raw('howItWorks.steps') as any) || []
  const comparison:  string[][] = (t.raw('comparison.rows') as any) || []
  const features:    { title: string, desc: string }[] = (t.raw('features.items') as any) || []
  const testimonials:{ name: string, role: string, initial: string, text: string }[] = (t.raw('testimonials.items') as any) || []
  const faqItems:    { q: string, a: string }[] = (t.raw('faq.items') as any) || []

  return (
    <div className="bg-white">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-[#F8FAFC] via-white to-white pt-14 pb-20 px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-br from-[#DBEAFE] via-transparent to-[#F3E8FF] opacity-40 blur-3xl rounded-full" />
        </div>

        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white border border-[#BFDBFE] rounded-full px-4 py-1.5 text-xs text-[#2563EB] font-semibold mb-6 shadow-sm">
            <Sparkles size={13} />
            {t('badge')}
          </div>

          <h1 className="font-display font-black text-[#0F172A] text-4xl md:text-6xl leading-[1.05] mb-5 tracking-tight">
            {t('hero.title1')}<br />
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              {t('hero.title2')}
            </span>
          </h1>

          <p className="text-[#475569] text-lg md:text-xl max-w-2xl mx-auto mb-7 leading-relaxed">
            {t('hero.subtitle1')}{' '}
            <span className="font-semibold text-[#0F172A]">{t('hero.subtitleAccent')}</span>
            {t('hero.subtitle2')}
          </p>

          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full bg-[#F0FDF4] border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="text-sm text-[#15803D]">
              {t('hero.liveCounterPrefix')} <LiveCounter /> {t('hero.liveCounterSuffix')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold px-7 py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/25 text-sm"
            >
              {t('hero.ctaPrimary')} <ArrowRight size={15} />
            </Link>
            <Link
              href="/login?demo=1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB] text-[#0F172A] font-semibold px-7 py-3.5 rounded-xl transition-all text-sm"
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>

          <p className="mt-4 text-xs text-[#94A3B8]">{t('hero.footnote')}</p>
        </div>

        {/* Dashboard preview */}
        <div className="max-w-5xl mx-auto mt-14">
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-[#DBEAFE] via-transparent to-[#F3E8FF] blur-2xl opacity-40 rounded-3xl" />
            <div className="relative bg-white rounded-2xl shadow-2xl shadow-slate-900/10 border border-[#E2E8F0] overflow-hidden">
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
              <div className="grid grid-cols-12 min-h-[280px]">
                <div className="col-span-3 bg-[#F8FAFC] border-r border-[#E2E8F0] p-3 space-y-1.5">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#DBEAFE]">
                    <div className="w-5 h-5 rounded bg-[#2563EB]" />
                    <span className="text-[11px] font-semibold text-[#2563EB]">{t('preview.sidebar.home')}</span>
                  </div>
                  {[
                    t('preview.sidebar.contracts'),
                    t('preview.sidebar.counterparties'),
                    t('preview.sidebar.specifications'),
                    t('preview.sidebar.organizations'),
                    t('preview.sidebar.hr'),
                    t('preview.sidebar.accounting'),
                    t('preview.sidebar.lawyer'),
                    t('preview.sidebar.settings'),
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white">
                      <div className="w-5 h-5 rounded bg-[#E2E8F0]" />
                      <span className="text-[11px] text-[#64748B]">{item}</span>
                    </div>
                  ))}
                </div>
                <div className="col-span-9 p-5">
                  <div className="grid grid-cols-4 gap-2.5 mb-4">
                    {[
                      { v: '247',   l: t('preview.stats.contracts'),     c: 'text-[#2563EB] bg-[#DBEAFE]' },
                      { v: '38',    l: t('preview.stats.counterparties'), c: 'text-[#16A34A] bg-[#DCFCE7]' },
                      { v: '12',    l: t('preview.stats.employees'),     c: 'text-[#D97706] bg-[#FEF3C7]' },
                      { v: '₿8.5M', l: t('preview.stats.thisMonth'),     c: 'text-[#7C3AED] bg-[#F3E8FF]' },
                    ].map((s, i) => (
                      <div key={i} className="bg-white border border-[#E2E8F0] rounded-lg p-2.5">
                        <div className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mb-1.5 ${s.c}`}>
                          {s.l}
                        </div>
                        <div className="font-display font-black text-[#0F172A] text-lg">{s.v}</div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { d: t('preview.docs.row1'), cp: t('preview.docs.row1Cp'), sum: '12 500 000', clr: 'bg-[#DBEAFE]' },
                      { d: t('preview.docs.row2'), cp: t('preview.docs.row2Cp'), sum: '5 200 000',  clr: 'bg-[#DCFCE7]' },
                      { d: t('preview.docs.row3'), cp: t('preview.docs.row3Cp'), sum: '4 500 000',  clr: 'bg-[#FEF3C7]' },
                      { d: t('preview.docs.row4'), cp: t('preview.docs.row4Cp'), sum: '8 700 000',  clr: 'bg-[#F3E8FF]' },
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

      {/* DOCUMENT TYPES */}
      <section className="py-12 bg-white border-y border-[#E2E8F0]">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-6">
            {t('documentTypes.intro')}
          </p>
          <div className="overflow-hidden">
            <div className="flex gap-3 animate-scroll">
              {[...docTypes, ...docTypes].map((d, i) => (
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

      {/* DEPARTMENTS */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('departments.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              {t('departments.title')}
            </h2>
            <p className="text-[#475569] text-lg">{t('departments.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {DEPT_KEYS.map(key => {
              const Icon = DEPT_ICONS[key]
              const dept = (t.raw as any)(`departments.items.${key}`) as any
              return (
                <Link key={key} href={DEPT_LINKS[key]} className="group">
                  <div className="h-full p-6 bg-white border border-[#E2E8F0] rounded-2xl hover:border-[#2563EB] hover:shadow-lg transition-all">
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`w-12 h-12 rounded-xl ${DEPT_COLORS[key]} border flex items-center justify-center shrink-0`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold text-[#0F172A] text-lg mb-1 group-hover:text-[#2563EB] transition-colors">
                          {dept.title}
                        </h3>
                        <p className="text-sm text-[#64748B] leading-relaxed">{dept.desc}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {(dept.bullets as string[]).map((b: string) => (
                        <span key={b} className="text-xs px-2.5 py-1 bg-[#F1F5F9] text-[#475569] rounded-full">
                          {b}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex items-center text-sm font-semibold text-[#2563EB] gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('departments.more')} <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('howItWorks.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              {t('howItWorks.title')}
            </h2>
            <p className="text-[#475569] text-lg">{t('howItWorks.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative">
            {steps.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 h-full">
                  <div className="font-display font-black text-5xl bg-gradient-to-br from-[#DBEAFE] to-transparent bg-clip-text text-transparent mb-3">
                    {s.n}
                  </div>
                  <h3 className="font-display font-bold text-[#0F172A] text-lg mb-2">{s.title}</h3>
                  <p className="text-sm text-[#475569] leading-relaxed">{s.desc}</p>
                </div>
                {i < steps.length - 1 && (
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
                  <h3 className="font-display font-bold text-lg">{t('howItWorks.mira.title')}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/20 rounded-full">{t('howItWorks.mira.badge')}</span>
                </div>
                <p className="text-blue-100 text-sm leading-relaxed mb-3">
                  {t('howItWorks.mira.desc1')} <span className="italic">{t('howItWorks.mira.example')}</span> {t('howItWorks.mira.desc2')}
                </p>
                <span className="text-xs text-blue-200">{t('howItWorks.mira.footnote')}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#16A34A] font-semibold text-sm mb-2">{t('comparison.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              {t('comparison.title')}
            </h2>
            <p className="text-[#475569] text-lg">{t('comparison.subtitle')}</p>
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-[#F8FAFC] border-b border-[#E2E8F0] px-6 py-4 text-sm font-bold text-[#0F172A]">
              <div></div>
              <div className="text-center text-[#2563EB]">{t('comparison.us')}</div>
              <div className="text-center text-[#94A3B8]">{t('comparison.them')}</div>
            </div>
            {comparison.map((row, i) => (
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

      {/* FEATURES GRID */}
      <section className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('features.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              {t('features.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] || Zap
              return (
                <div key={i} className="p-5 bg-white border border-[#E2E8F0] rounded-xl hover:border-[#BFDBFE] hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-[#DBEAFE] flex items-center justify-center mb-3">
                    <Icon size={18} className="text-[#2563EB]" />
                  </div>
                  <h3 className="font-bold text-[#0F172A] text-sm mb-1">{f.title}</h3>
                  <p className="text-xs text-[#64748B] leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('testimonials.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl">
              {t('testimonials.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((tst, i) => (
              <div key={tst.name} className="p-6 bg-white border border-[#E2E8F0] rounded-2xl">
                <div className="flex gap-1 mb-4">
                  {[1,2,3,4,5].map(j => (
                    <span key={j} className="text-[#FBBF24] text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-[#475569] leading-relaxed mb-5 italic">"{tst.text}"</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${TESTI_COLORS[i]} flex items-center justify-center font-bold`}>
                    {tst.initial}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0F172A]">{tst.name}</p>
                    <p className="text-xs text-[#94A3B8]">{tst.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="narxlar" className="py-20 px-4 bg-[#F8FAFC]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('pricing.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl mb-3">
              {t('pricing.title')}
            </h2>
            <p className="text-[#475569] text-lg">{t('pricing.subtitle')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PLAN_KEYS.map((key, i) => {
              const plan = (t.raw as any)(`pricing.plans.${key}`) as any
              const style = PLAN_STYLES[i]
              return (
                <div
                  key={key}
                  className={`relative p-6 rounded-2xl bg-white border-2 ${style.color} ${style.popular ? 'shadow-xl shadow-violet-100 scale-105' : ''}`}
                >
                  {style.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 bg-[#7C3AED] text-white text-xs font-bold px-3 py-1 rounded-full">
                      <Sparkles size={11} /> {t('pricing.popular')}
                    </div>
                  )}
                  <h3 className="font-display font-black text-[#0F172A] text-xl">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 my-3">
                    <span className="font-display font-black text-3xl text-[#0F172A]">{PLAN_PRICES[i]}</span>
                    {i > 0 && <span className="text-sm text-[#94A3B8]">{t('pricing.currency')}{t('pricing.monthly')}</span>}
                  </div>
                  <ul className="space-y-2.5 mb-6 mt-5">
                    {(plan.features as string[]).map(feat => (
                      <li key={feat} className="flex items-start gap-2 text-sm text-[#475569]">
                        <Check size={14} className="text-[#16A34A] mt-0.5 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={style.href}
                    className={`block text-center py-2.5 rounded-lg text-sm font-semibold transition-colors ${style.btnClass}`}
                  >
                    {plan.btnText}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#2563EB] font-semibold text-sm mb-2">{t('faq.tag')}</p>
            <h2 className="font-display font-black text-[#0F172A] text-3xl md:text-4xl">
              {t('faq.title')}
            </h2>
          </div>

          <div className="space-y-3">
            {faqItems.map(faq => (
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

      {/* FINAL CTA */}
      <section className="relative py-20 px-4 bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#7C3AED] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="font-display font-black text-white text-3xl md:text-5xl mb-4 leading-tight">
            {t('finalCta.title')}
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
            {t('finalCta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#1E3A8A] font-bold px-8 py-4 rounded-xl hover:shadow-2xl transition-all text-sm"
            >
              {t('finalCta.ctaPrimary')} <ArrowRight size={15} />
            </Link>
            <Link
              href="/yordam"
              className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/30 backdrop-blur font-semibold px-8 py-4 rounded-xl hover:bg-white/20 transition-all text-sm"
            >
              {t('finalCta.ctaSecondary')}
            </Link>
          </div>
          <p className="mt-6 text-xs text-blue-200">{t('finalCta.stats')}</p>
        </div>
      </section>
    </div>
  )
}
