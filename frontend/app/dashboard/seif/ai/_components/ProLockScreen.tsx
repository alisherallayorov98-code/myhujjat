'use client'

import Link            from 'next/link'
import { useTranslations } from 'next-intl'
import { Lock, Sparkles } from 'lucide-react'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import api             from '@/lib/api'
import toast           from 'react-hot-toast'

export function ProLockScreen() {
  const t = useTranslations('seifAi')
  const handleDemo = async () => {
    try {
      await api.post('/payments/demo')
      toast.success(t('demoActivated'))
      window.location.reload()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('error'))
    }
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Seif',      path: '/dashboard/seif' },
          { label: t('breadcrumb') },
        ]}
      />
      <Card className="text-center py-12">
        <div className="w-16 h-16 rounded-2xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-4">
          <Lock size={28} className="text-[#7C3AED]" />
        </div>
        <h2 className="font-bold text-[#0F172A] text-xl mb-2">{t('lockTitle')}</h2>
        <p className="text-[#94A3B8] text-sm mb-6 max-w-sm mx-auto">
          {t('lockDesc')}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/dashboard/sozlamalar/obuna">
            <Button leftIcon={<Sparkles size={14} />}>{t('goPro')}</Button>
          </Link>
          <Button variant="secondary" onClick={handleDemo}>{t('startDemo')}</Button>
        </div>
      </Card>
    </div>
  )
}
