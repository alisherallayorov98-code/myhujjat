'use client'

import Link                from 'next/link'
import { useTranslations } from 'next-intl'
import { ArrowRight }      from 'lucide-react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card }            from '@/components/ui/Card'

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
  )
}
