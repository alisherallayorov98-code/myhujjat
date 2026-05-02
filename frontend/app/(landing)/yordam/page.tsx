'use client'

import { useState }       from 'react'
import Link               from 'next/link'
import { useTranslations } from 'next-intl'
import { Search, ChevronDown, Mail, MessageCircle, Phone, ArrowRight } from 'lucide-react'

interface Section {
  id:    string
  title: string
  items: { q: string; a: string }[]
}

export default function YordamPage() {
  const t = useTranslations('help')
  const sections: Section[] = (t.raw as any)('sections') || []

  const [search, setSearch] = useState('')
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())

  const filtered = sections.map(s => ({
    ...s,
    items: s.items.filter(i =>
      !search ||
      i.q.toLowerCase().includes(search.toLowerCase()) ||
      i.a.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter(s => s.items.length > 0)

  function toggle(id: string) {
    setOpenIds(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* Hero */}
      <div className="bg-gradient-to-b from-[#EFF6FF] to-[#F8FAFC] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="font-display font-black text-[#0F172A] text-3xl sm:text-4xl mb-3">
            {t('title')}
          </h1>
          <p className="text-[#475569] text-lg mb-8">
            {t('subtitle')}
          </p>

          <div className="relative max-w-xl mx-auto">
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full h-12 pl-12 pr-4 bg-white border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 shadow-sm"
            />
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          </div>
        </div>
      </div>

      {/* FAQ sections */}
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
        {filtered.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#94A3B8]">{t('noResults', { query: search })}</p>
            <p className="text-sm text-[#CBD5E1] mt-2">{t('noResultsHint')}</p>
          </div>
        ) : filtered.map(section => (
          <div key={section.id} id={section.id}>
            <h2 className="font-display font-black text-[#0F172A] text-xl mb-4">{section.title}</h2>
            <div className="space-y-2">
              {section.items.map((item, i) => {
                const id = `${section.id}-${i}`
                const open = openIds.has(id)
                return (
                  <div key={id} className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden">
                    <button
                      onClick={() => toggle(id)}
                      className="w-full px-5 py-4 flex items-center justify-between gap-3 text-left"
                    >
                      <span className="text-sm font-semibold text-[#0F172A]">{item.q}</span>
                      <ChevronDown
                        size={16}
                        className={`text-[#94A3B8] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {open && (
                      <div className="px-5 pb-4 -mt-1">
                        <p className="text-sm text-[#475569] leading-relaxed">{item.a}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {/* Contact */}
        <div className="bg-gradient-to-br from-[#2563EB] to-[#7C3AED] rounded-2xl p-8 text-white mt-12">
          <h3 className="font-display font-bold text-xl mb-2">{t('contactTitle')}</h3>
          <p className="text-blue-100 mb-6">{t('contactSubtitle')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <a href="mailto:support@myhujjat.uz"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <Mail size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">{t('emailLabel')}</p>
                <p className="text-sm font-semibold">support@myhujjat.uz</p>
              </div>
            </a>
            <a href="https://t.me/myhujjat_uz" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <MessageCircle size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">{t('telegramLabel')}</p>
                <p className="text-sm font-semibold">@myhujjat_uz</p>
              </div>
            </a>
            <a href="tel:+998711234567"
              className="flex items-center gap-3 bg-white/10 hover:bg-white/15 rounded-xl px-4 py-3 transition">
              <Phone size={18} />
              <div className="text-left">
                <p className="text-xs text-blue-100">{t('phoneLabel')}</p>
                <p className="text-sm font-semibold">+998 71 123-45-67</p>
              </div>
            </a>
          </div>
        </div>

        {/* Back to home */}
        <div className="text-center pt-4">
          <Link href="/" className="inline-flex items-center gap-1 text-sm text-[#475569] hover:text-[#2563EB]">
            <ArrowRight size={14} className="rotate-180" />
            {t('backToHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
