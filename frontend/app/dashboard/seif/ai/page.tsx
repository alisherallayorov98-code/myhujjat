'use client'

import { useState }        from 'react'
import { useTranslations } from 'next-intl'
import { useQuery }        from '@tanstack/react-query'
import { PageHeader }      from '@/components/layout/PageHeader'
import { useAuth }         from '@/hooks/useAuth'
import api                 from '@/lib/api'
import { currentLocale }   from '@/lib/formatters'
import toast               from 'react-hot-toast'

import { ProLockScreen } from './_components/ProLockScreen'
import { DocTypePicker } from './_components/DocTypePicker'
import { PromptForm }    from './_components/PromptForm'
import { HistoryList }   from './_components/HistoryList'
import { ResultPanel }   from './_components/ResultPanel'
import { DOC_TYPES }     from './_components/constants'

export default function AiGeneratorPage() {
  const t      = useTranslations('seifAi')
  const { currentOrg, isPro } = useAuth()

  const [docType,    setDocType]    = useState<string>(DOC_TYPES[0].value)
  const [category,   setCategory]   = useState('all')
  const [prompt,     setPrompt]     = useState('')
  const [loading,    setLoading]    = useState(false)
  const [streaming,  setStreaming]  = useState(false)
  const [result,     setResult]     = useState('')
  const [savedId,    setSavedId]    = useState<string | null>(null)

  const { data: history = [], refetch: refetchHistory } = useQuery<any[]>({
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
    if (!prompt.trim())  { toast.error(t('promptRequired')); return }
    if (!currentOrg?.id) { toast.error(t('noOrg'));          return }

    setLoading(true)
    setResult('')
    setSavedId(null)

    const orgData: Record<string, string> = {
      Nomi:    currentOrg.name                  || '',
      STIR:    (currentOrg as any).inn           || '',
      Rahbar:  (currentOrg as any).directorName  || '',
      Bank:    (currentOrg as any).bankName      || '',
      Manzil:  (currentOrg as any).address       || '',
    }
    const body = JSON.stringify({
      orgId: currentOrg.id, docType, prompt, orgData,
      targetLang: currentLocale(),
    })

    try {
      const token   = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'
      const res     = await fetch(`${baseUrl}/ai/generate/stream`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let   buffer  = ''
      let   full    = ''

      setLoading(false)
      setStreaming(true)

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const obj = JSON.parse(line.slice(6))
            if (obj.text)  { full += obj.text; setResult(full) }
            if (obj.done)  { toast.success(t('docCreated')); if (obj.id) setSavedId(obj.id); refetchHistory() }
            if (obj.error) throw new Error(obj.error)
          } catch {
            // non-JSON SSE line — skip
          }
        }
      }
    } catch (e: any) {
      toast.error(e?.message || t('error'))
      setLoading(false)
    } finally {
      setStreaming(false)
    }
  }

  const hasResult = !!(result || loading || streaming)

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

      {hasResult ? (
        /* Two-column layout while generating / result ready */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
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
                streaming={streaming}
                onGenerate={handleGenerate}
              />
            </div>
            <ResultPanel
              loading={loading}
              streaming={streaming}
              result={result}
              docType={docType}
              orgName={currentOrg?.name}
              savedId={savedId}
            />
          </div>
          {history.length > 0 && !streaming && (
            <div className="max-w-2xl">
              <HistoryList history={history} orgId={currentOrg?.id} />
            </div>
          )}
        </div>
      ) : (
        /* Single-column layout before first generation */
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
            streaming={streaming}
            onGenerate={handleGenerate}
          />
          <HistoryList
            history={history}
            orgId={currentOrg?.id}
          />
        </div>
      )}
    </div>
  )
}
