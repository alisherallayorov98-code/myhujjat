'use client'

import Link                from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight, Sparkles } from 'lucide-react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card }            from '@/components/ui/Card'
import { DynamicFeatureRunner } from '@/components/DynamicFeatureRunner/DynamicFeatureRunner'
import { BUXGALTER_FEATURES }   from '@/lib/dynamicFeatures'

export default function BuxgalterPage() {
  const t = useTranslations('accountant')

  const MODULES = [
    {
      href:  '/dashboard/buxgalter/faktura',
      icon:  '🧾',
      label: t('fakturaLabel'),
      desc:  t('fakturaDesc'),
      color: 'bg-[#DCFCE7]',
    },
    {
      href:  '/dashboard/buxgalter/akt-sverki',
      icon:  '📊',
      label: t('aktSverkaLabel'),
      desc:  t('aktSverkaDesc'),
      color: 'bg-[#FEF3C7]',
    },
    {
      href:  '/dashboard/buxgalter/tolov-grafigi',
      icon:  '📅',
      label: t('tolovGrafigiLabel'),
      desc:  t('tolovGrafigiDesc'),
      color: 'bg-[#EDE9FE]',
    },
    {
      href:  '/dashboard/buxgalter/nazorat',
      icon:  '🔍',
      label: t('nazorat.label'),
      desc:  t('nazorat.labelDesc'),
      color: 'bg-[#FEE2E2]',
    },
  ]

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb') },
        ]}
      />

      {/* Asosiy 3 ta */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">{t('mainDocs')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MODULES.map(mod => (
            <Link key={mod.href} href={mod.href}>
              <Card hoverable className="flex gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${mod.color}`}>
                  {mod.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#0F172A]">{mod.label}</p>
                  <p className="text-sm text-[#94A3B8] mt-0.5">{mod.desc}</p>
                </div>
                <ArrowRight size={18} className="text-[#CBD5E1] shrink-0 self-center" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* AI orqali — qo'shimcha 6 ta */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {t('aiCreate')}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED]">Pro</span>
        </div>
        <DynamicFeatureRunner features={BUXGALTER_FEATURES} />
      </div>
    </div>
  )
}
