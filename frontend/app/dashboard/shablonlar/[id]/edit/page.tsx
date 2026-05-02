'use client'

import { useState, useRef, useEffect, use } from 'react'
import { useTranslations }                from 'next-intl'
import { useRouter, useSearchParams }     from 'next/navigation'
import { ChevronLeft, Eye, Code, Save }   from 'lucide-react'
import { useQuery, useMutation }          from '@tanstack/react-query'
import { PageHeader }                     from '@/components/layout/PageHeader'
import { Card }                           from '@/components/ui/Card'
import { Button }                         from '@/components/ui/Button'
import { Input }                          from '@/components/ui/Input'
import { useAuth }                        from '@/hooks/useAuth'
import api                                from '@/lib/api'
import { fillTemplate }                   from '@/lib/contractTemplates'
import { cn }                             from '@/lib/cn'

const PLACEHOLDER_KEYS = [
  'ORG_NOMI', 'ORG_INN', 'ORG_RAHBAR', 'ORG_BANK', 'ORG_HISOB', 'ORG_MFO', 'ORG_MANZIL',
  'CP_NOMI',  'CP_INN',  'CP_RAHBAR',  'CP_BANK',  'CP_HISOB',  'CP_MFO',  'CP_MANZIL',
  'RAQAM',    'SANA',    'SHAHAR',     'SUMMA',    'SUMMA_MATN','MUDDAT',
] as const

const SAMPLE_DATA = {
  orgNomi:   'DEMO TASHKILOT MChJ',
  orgInn:    '123456789',
  orgRahbar: 'Aliyev Akbar Akbarovich',
  orgBank:   'Kapitalbank',
  orgHisob:  '20208000200000000001',
  orgMfo:    '00873',
  orgManzil: 'Toshkent sh., Chilonzor t., 1-uy',
  cpNomi:    'KONTRAGENT KORXONA MChJ',
  cpInn:     '987654321',
  cpRahbar:  'Karimov Bekzod Bekzodovich',
  cpBank:    'Ipoteka bank',
  cpHisob:   '20208000200000000002',
  cpMfo:     '00896',
  cpManzil:  'Toshkent sh., Yunusobod t., 5-uy',
  raqam:     '2025/001',
  sana:      '2025-yil 1-yanvar',
  shahar:    'Toshkent',
  summa:     '10 000 000',
  summaMatn: "o'n million",
}

export default function EditShablonPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('shablonlar')
  const { id } = use(params)
  const { currentOrg }  = useAuth()
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const viewOnly        = searchParams.get('view') === 'true'
  const textareaRef     = useRef<HTMLTextAreaElement>(null)

  const [name,        setName]        = useState('')
  const [content,     setContent]     = useState('')
  const [previewMode, setPreviewMode] = useState(viewOnly)
  const [isSystem,    setIsSystem]    = useState(false)

  const { isLoading } = useQuery({
    queryKey: ['template', id],
    queryFn:  () => api.get(`/templates/${id}`).then(r => r.data),
    onSuccess: (tpl: any) => {
      setName(tpl.name)
      setContent(tpl.content)
      setIsSystem(tpl.isSystem)
      if (tpl.isSystem) setPreviewMode(true)
    },
  } as any)

  const saveMut = useMutation({
    mutationFn: () => api.put(`/templates/${id}?orgId=${currentOrg!.id}`, {
      name, content,
    }),
    onSuccess: () => router.push('/dashboard/shablonlar'),
  })

  function insertPlaceholder(key: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end   = el.selectionEnd
    const next  = content.slice(0, start) + key + content.slice(end)
    setContent(next)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + key.length, start + key.length)
    }, 0)
  }

  const preview = fillTemplate(content, SAMPLE_DATA as any)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={isSystem ? name : t('editTitle')}
        description={isSystem ? t('systemTpl') : t('editDesc')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb'), path: '/dashboard/shablonlar' },
          { label: isSystem ? t('viewBreadcrumb') : t('editBreadcrumb') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ChevronLeft size={14} className="mr-1" />{t('back')}
            </Button>
            {!isSystem && (
              <Button
                size="sm"
                loading={saveMut.isPending}
                disabled={!name || !content}
                onClick={() => saveMut.mutate()}
                leftIcon={<Save size={14} />}
              >
                {t('save')}
              </Button>
            )}
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="w-full lg:w-56 lg:shrink-0 space-y-4">
          {!isSystem && (
            <Card padding="sm">
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                {t('settings')}
              </p>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">{t('tplName')}</label>
                <Input
                  placeholder={t('tplNamePlace')}
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-xs"
                />
              </div>
            </Card>
          )}

          <Card padding="sm">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              {t('variables')}
            </p>
            <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
              {PLACEHOLDER_KEYS.map(k => (
                <button
                  key={k}
                  onClick={() => !isSystem && !previewMode && insertPlaceholder(`{{${k}}}`)}
                  disabled={isSystem || previewMode}
                  className={cn(
                    'w-full text-left px-2 py-1.5 rounded-lg transition-colors',
                    !isSystem && !previewMode
                      ? 'hover:bg-[#F1F5F9] cursor-pointer'
                      : 'cursor-default opacity-60'
                  )}
                >
                  <p className="text-[10px] font-mono text-[#7C3AED]">{`{{${k}}}`}</p>
                  <p className="text-[10px] text-[#94A3B8]">{t(`ph.${k}` as any)}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex-1 min-w-0">
          <Card padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#475569]">
                {previewMode ? t('previewModeShort') : t('editor')}
              </p>
              {!isSystem && (
                <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                      !previewMode ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'
                    )}
                  >
                    <Code size={12} />{t('editorTab')}
                  </button>
                  <button
                    onClick={() => setPreviewMode(true)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                      previewMode ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'
                    )}
                  >
                    <Eye size={12} />{t('viewTab')}
                  </button>
                </div>
              )}
            </div>

            {previewMode ? (
              <pre className="p-5 text-sm text-[#1E293B] font-mono whitespace-pre-wrap min-h-[600px] bg-[#FAFAFA]">
                {preview || <span className="text-[#CBD5E1]">{t('noContent')}</span>}
              </pre>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder={t('tplPlaceShort')}
                className="w-full p-5 text-sm font-mono text-[#1E293B] resize-none outline-none bg-white min-h-[600px]"
                style={{ height: Math.max(600, content.split('\n').length * 22) + 'px' }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
