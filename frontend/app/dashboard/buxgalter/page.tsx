'use client'

import Link                from 'next/link'
import { ArrowRight }      from 'lucide-react'
import { PageHeader }      from '@/components/layout/PageHeader'
import { Card }            from '@/components/ui/Card'

const MODULES = [
  {
    href:  '/dashboard/buxgalter/faktura',
    icon:  '🧾',
    label: 'Faktura',
    desc:  "Hisob-faktura yaratish, QQS bilan",
    color: 'bg-[#DCFCE7]',
  },
  {
    href:  '/dashboard/buxgalter/akt-sverki',
    icon:  '📊',
    label: 'Akt-sverka',
    desc:  "O'zaro hisob-kitob tekshirish hujjati",
    color: 'bg-[#FEF3C7]',
  },
  {
    href:  '/dashboard/buxgalter/tolov-grafigi',
    icon:  '📅',
    label: "To'lov grafigi",
    desc:  "Qarz bo'yicha oylik to'lov jadvali",
    color: 'bg-[#EDE9FE]',
  },
]

export default function BuxgalterPage() {
  return (
    <div>
      <PageHeader
        title="💼 Buxgalter bo'limi"
        description="Faktura, akt-sverka va to'lov grafigi"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Buxgalter' },
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
