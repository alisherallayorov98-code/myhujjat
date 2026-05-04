'use client'

import { useState }   from 'react'
import { useTranslations } from 'next-intl'
import { useRouter }  from 'next/navigation'
import { useQuery }   from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth }    from '@/hooks/useAuth'
import api            from '@/lib/api'
import { currentLocale } from '@/lib/formatters'
import toast          from 'react-hot-toast'

import { ProLockScreen } from './_components/ProLockScreen'
import { DocTypePicker } from './_components/DocTypePicker'
import { PromptForm }    from './_components/PromptForm'
import { HistoryList }   from './_components/HistoryList'
import { DOC_TYPES }     from './_components/constants'

export default function AiGeneratorPage() {
  const t      = useTranslations('seifAi')
  const router = useRouter()
  const { currentOrg, isPro } = useAuth()

  const [docType,  setDocType]  = useState<string>(DOC_TYPES[0].value)
  const [category, setCategory] = useState('all')
  const [prompt,   setPrompt]   = useState('')
  const [loading,  setLoading]  = useState(false)

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['ai-history', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/ai/history?orgId=${currentOrg.id}&limit=50`)
      return data.data || []
    },
    enabled: !!currentOrg?.id,
  })

  if (!isPro) return <ProLockScreen />

  const handleGenerate = async () => {
    if (!prompt.trim())   { toast.error(t('promptRequired'));     return }
    if (!currentOrg?.id)  { toast.error(t('noOrg'));              return }

    setLoading(true)

    try {
      const orgData: Record<string, string> = {
        'Nomi':   currentOrg.name             || '',
        'STIR':   (currentOrg as any).inn     || '',
        'Rahbar': (currentOrg as any).directorName || '',
        'Bank':   (currentOrg as any).bankName     || '',
        'H/r':    (currentOrg as any).bankAccount  || '',
        'MFO':    (currentOrg as any).mfo          || '',
        'Manzil': (currentOrg as any).address      || '',
      }

      const { data } = await api.post('/ai/generate', {
        orgId: currentOrg.id, docType, prompt, orgData,
        targetLang: currentLocale(),
      })

      toast.success(t('docCreated'))
      // Yaratilgan hujjatga avtomatik o'tish — to'liq sahifa
      router.push(`/dashboard/seif/ai/${data.id}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('error'))
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Seif',      path: '/dashboard/seif' },
          { label: t('breadcrumb') },
        ]}
      />

      {/* Yagona kolonkali kompakt forma — natija alohida sahifada ochiladi */}
      <div className="max-w-2xl mx-auto space-y-4">
        <DocTypePicker
          category={category}
          setCategory={setCategory}
          docType={docType}
          setDocType={setDocType}
        />
        <PromptForm
          docType={docType}
          prompt={prompt}
          setPrompt={setPrompt}
          loading={loading}
          onGenerate={handleGenerate}
        />
        <HistoryList
          history={history}
          orgId={currentOrg?.id}
        />
      </div>
    </div>
  )
}
