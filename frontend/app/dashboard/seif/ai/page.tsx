'use client'

import { useState }   from 'react'
import { useQuery }   from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { useAuth }    from '@/hooks/useAuth'
import api            from '@/lib/api'
import toast          from 'react-hot-toast'

import { ProLockScreen } from './_components/ProLockScreen'
import { DocTypePicker } from './_components/DocTypePicker'
import { PromptForm }    from './_components/PromptForm'
import { HistoryList }   from './_components/HistoryList'
import { ResultPanel }   from './_components/ResultPanel'
import { DOC_TYPES }     from './_components/constants'

export default function AiGeneratorPage() {
  const { currentOrg, isPro } = useAuth()

  const [docType,  setDocType]  = useState<string>(DOC_TYPES[0].value)
  const [category, setCategory] = useState('all')
  const [prompt,   setPrompt]   = useState('')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [, setSavedId]          = useState<string | null>(null)

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ['ai-history', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/ai/history?orgId=${currentOrg.id}`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  if (!isPro) return <ProLockScreen />

  const handleGenerate = async () => {
    if (!prompt.trim())   { toast.error('Talablarni kiriting');     return }
    if (!currentOrg?.id)  { toast.error('Tashkilot tanlanmagan');   return }

    setLoading(true)
    setResult('')
    setSavedId(null)

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
      })

      setResult(data.content)
      setSavedId(data.id)
      toast.success('Hujjat yaratildi!')
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Xatolik yuz berdi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="AI Hujjat Generatsiya"
        description="Tabiiy til bilan professional hujjatlar yarating"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Seif',      path: '/dashboard/seif' },
          { label: 'AI' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chap: tanlash + so'rov + tarix */}
        <div className="lg:col-span-1 space-y-4">
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
            onSelect={(content, id) => { setResult(content); setSavedId(id) }}
          />
        </div>

        {/* O'ng: natija */}
        <div className="lg:col-span-2">
          <ResultPanel
            loading={loading}
            result={result}
            docType={docType}
            orgName={currentOrg?.name}
          />
        </div>
      </div>
    </div>
  )
}
