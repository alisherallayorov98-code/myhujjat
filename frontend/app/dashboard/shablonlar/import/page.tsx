'use client'

import { useState, useRef } from 'react'
import { useTranslations }   from 'next-intl'
import { useRouter }         from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, FileUp, ClipboardPaste, FileText, Save, Loader2 } from 'lucide-react'
import { PageHeader }        from '@/components/layout/PageHeader'
import { Card }              from '@/components/ui/Card'
import { Button }            from '@/components/ui/Button'
import { Input }             from '@/components/ui/Input'
import { Select }            from '@/components/ui/Select'
import { useAuth }           from '@/hooks/useAuth'
import api                   from '@/lib/api'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { cn }                from '@/lib/cn'
import toast                 from 'react-hot-toast'

type Mode   = 'paste' | 'upload'
type Source = 'PASTE' | 'WORD_UPLOAD' | 'CUSTOM'

interface PreviewBlock {
  id?:    string
  type:   'heading' | 'clause' | 'paragraph' | 'list' | 'signature'
  level?: number
  number?: string
  text:   string
}

export default function ImportShablonPage() {
  const t  = useTranslations('userTemplates')
  const tc = useTranslations('contracts')
  const { currentOrg } = useAuth()
  const router         = useRouter()
  const qc             = useQueryClient()
  const fileRef        = useRef<HTMLInputElement>(null)

  const [mode,         setMode]         = useState<Mode>('paste')
  const [name,         setName]         = useState('')
  const [contractType, setContractType] = useState<string>('OLDI_SOTDI')
  const [rawText,      setRawText]      = useState('')
  const [fileName,     setFileName]     = useState<string | null>(null)
  const [parsing,      setParsing]      = useState(false)
  const [preview,      setPreview]      = useState<PreviewBlock[] | null>(null)

  const TYPE_OPTIONS = Object.keys(CONTRACT_TYPE_CONFIG).map(value => ({
    value,
    label: tc(`types.${value}` as any),
  }))

  // Word .docx faylni mammoth bilan brauzerda parse qilamiz
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.docx')) {
      toast.error(t('onlyDocx'))
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(t('fileTooBig'))
      return
    }

    setParsing(true)
    setFileName(file.name)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const mammoth = await import('mammoth')
      const { value } = await mammoth.extractRawText({ arrayBuffer })
      setRawText(value)
      if (!name.trim()) {
        setName(file.name.replace(/\.docx$/i, '').slice(0, 100))
      }
      toast.success(t('parsed'))
    } catch (err: any) {
      toast.error(err?.message || t('parseError'))
      setFileName(null)
    } finally {
      setParsing(false)
    }
  }

  // Server'dan blok preview olish (parse-text endpoint)
  async function showPreview() {
    if (!rawText.trim()) {
      toast.error(t('emptyContent'))
      return
    }
    try {
      const { data } = await api.post('/user-templates/parse-text', { text: rawText })
      setPreview(data.blocks ?? [])
    } catch {
      toast.error(t('parseError'))
    }
  }

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!name.trim())     throw new Error(t('nameRequired'))
      if (!rawText.trim())  throw new Error(t('emptyContent'))
      if (!currentOrg?.id)  throw new Error(t('noOrg'))

      const source: Source = mode === 'upload' ? 'WORD_UPLOAD' : 'PASTE'
      const res = await api.post('/user-templates', {
        organizationId: currentOrg.id,
        name:           name.trim(),
        contractType,
        source,
        rawContent:     rawText,
        blocks:         preview ?? undefined,
      })
      return res.data
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['user-templates'] })
      toast.success(t('saved'))
      router.push('/dashboard/shablonlar')
    },
    onError: (e: any) => toast.error(e?.message || e?.response?.data?.message || t('saveError')),
  })

  return (
    <div>
      <PageHeader
        title={t('importTitle')}
        description={t('importDescription')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb'), path: '/dashboard/shablonlar' },
          { label: t('importBreadcrumb') },
        ]}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<ChevronLeft size={14} />}
            onClick={() => router.push('/dashboard/shablonlar')}
          >
            {t('back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">{t('mode')}</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('paste')}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition',
                  mode === 'paste'
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]',
                )}
              >
                <ClipboardPaste size={16} />
                <span className="font-medium">{t('modePaste')}</span>
              </button>
              <button
                onClick={() => setMode('upload')}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl border text-xs transition',
                  mode === 'upload'
                    ? 'bg-[#DBEAFE] border-[#2563EB] text-[#1D4ED8]'
                    : 'bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC]',
                )}
              >
                <FileUp size={16} />
                <span className="font-medium">{t('modeUpload')}</span>
              </button>
            </div>
          </div>

          <Input
            label={t('tplName')}
            placeholder={t('tplNamePlace')}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={200}
          />

          <Select
            label={t('contractType')}
            value={contractType}
            options={TYPE_OPTIONS}
            onChange={e => setContractType(e.target.value)}
          />

          {mode === 'upload' && (
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">{t('docxFile')}</label>
              <input
                ref={fileRef}
                type="file"
                accept=".docx"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                className="w-full"
                leftIcon={parsing ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />}
                onClick={() => fileRef.current?.click()}
                disabled={parsing}
              >
                {fileName ?? t('chooseFile')}
              </Button>
              <p className="text-xs text-[#94A3B8] mt-2">{t('uploadHint')}</p>
            </div>
          )}

          <div className="space-y-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              variant="outline"
              className="w-full"
              leftIcon={<FileText size={14} />}
              onClick={showPreview}
              disabled={!rawText.trim()}
            >
              {t('previewBlocks')}
            </Button>
            <Button
              className="w-full"
              leftIcon={<Save size={14} />}
              loading={saveMut.isPending}
              onClick={() => saveMut.mutate()}
              disabled={!rawText.trim() || !name.trim()}
            >
              {t('saveBtn')}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#0F172A]">
              {mode === 'paste' ? t('pasteHere') : t('extractedText')}
            </p>
            {rawText && (
              <span className="text-xs text-[#94A3B8]">{t('charsCount', { count: rawText.length })}</span>
            )}
          </div>

          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            placeholder={mode === 'paste' ? t('pastePlace') : t('uploadFirst')}
            className="w-full h-[450px] p-4 rounded-xl border border-[#E2E8F0] text-sm font-mono leading-relaxed bg-[#F8FAFC] resize-none focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
          />

          {preview && preview.length > 0 && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
              <p className="text-sm font-semibold text-[#0F172A] mb-2">
                {t('blocksDetected', { count: preview.length })}
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto bg-[#F8FAFC] rounded-xl p-3">
                {preview.map((b, i) => (
                  <div key={b.id ?? i} className="flex items-start gap-2 text-xs">
                    <span className={cn(
                      'shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px]',
                      b.type === 'heading'   ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                      b.type === 'clause'    ? 'bg-[#DCFCE7] text-[#15803D]' :
                      b.type === 'signature' ? 'bg-[#FEF3C7] text-[#B45309]' :
                                               'bg-[#F1F5F9] text-[#475569]',
                    )}>
                      {b.number ?? b.type}
                    </span>
                    <span className={cn(
                      'flex-1',
                      b.type === 'heading' ? 'font-semibold text-[#0F172A]' : 'text-[#475569]',
                    )}>
                      {b.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
