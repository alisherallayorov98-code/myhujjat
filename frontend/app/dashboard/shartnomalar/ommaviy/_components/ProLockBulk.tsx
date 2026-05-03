'use client'

import Link                 from 'next/link'
import { useTranslations }  from 'next-intl'
import { Lock, Sparkles }   from 'lucide-react'
import { PageHeader }       from '@/components/layout/PageHeader'
import { Card }             from '@/components/ui/Card'
import { Button }           from '@/components/ui/Button'

export function ProLockBulk() {
  const t = useTranslations('bulkSend')

  return (
    <div>
      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: 'Dashboard',  path: '/dashboard' },
          { label: 'Shartnomalar', path: '/dashboard/shartnomalar' },
          { label: t('navItem') },
        ]}
      />
      <Card className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-[#7C3AED]" />
        </div>
        <h2 className="font-bold text-[#0F172A] text-xl mb-2">{t('proLockTitle')}</h2>
        <p className="text-[#94A3B8] text-sm mb-6 max-w-md mx-auto">
          {t('proLockDesc')}
        </p>
        <Link href="/dashboard/sozlamalar/obuna">
          <Button leftIcon={<Sparkles size={14} />}>{t('goPro')}</Button>
        </Link>
      </Card>
    </div>
  )
}
