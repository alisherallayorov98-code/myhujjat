import type { Metadata }   from 'next'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { UseCasePage }     from '@/components/landing/UseCasePage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await (getTranslations as any)('useCases.yurist.metadata')
  return {
    title:       t('title'),
    description: t('description'),
    alternates:  { canonical: '/yuristlar-uchun' },
  }
}

export default function YuristlarPage() {
  const t = useTranslations('useCases')
  const config = (t.raw as any)('yurist') as any
  return <UseCasePage config={config} />
}
