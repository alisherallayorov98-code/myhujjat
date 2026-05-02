import type { Metadata }   from 'next'
import { getTranslations } from 'next-intl/server'
import { useTranslations } from 'next-intl'
import { UseCasePage }     from '@/components/landing/UseCasePage'

export async function generateMetadata(): Promise<Metadata> {
  const t = await (getTranslations as any)('useCases.buxgalter.metadata')
  return {
    title:       t('title'),
    description: t('description'),
    alternates:  { canonical: '/buxgalterlar-uchun' },
  }
}

export default function BuxgalterlarPage() {
  const t = useTranslations('useCases')
  const config = (t.raw as any)('buxgalter') as any
  return <UseCasePage config={config} />
}
