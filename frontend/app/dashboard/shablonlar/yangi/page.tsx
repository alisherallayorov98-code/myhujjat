'use client'

import { useState, useRef, useEffect }    from 'react'
import { useRouter, useSearchParams }     from 'next/navigation'
import { ChevronLeft, Eye, Code, Save }   from 'lucide-react'
import { useQuery, useMutation }          from '@tanstack/react-query'
import { PageHeader }                     from '@/components/layout/PageHeader'
import { Card }                           from '@/components/ui/Card'
import { Button }                         from '@/components/ui/Button'
import { Input }                          from '@/components/ui/Input'
import { Select }                         from '@/components/ui/Select'
import { useAuth }                        from '@/hooks/useAuth'
import api                                from '@/lib/api'
import { CONTRACT_TYPE_CONFIG, ContractType, fillTemplate } from '@/lib/contractTemplates'
import { cn }                             from '@/lib/cn'

const PLACEHOLDERS = [
  { key: '{{ORG_NOMI}}',    label: 'Tashkilot nomi' },
  { key: '{{ORG_INN}}',     label: 'Tashkilot STIR' },
  { key: '{{ORG_RAHBAR}}',  label: 'Rahbar ismi' },
  { key: '{{ORG_BANK}}',    label: 'Bank nomi' },
  { key: '{{ORG_HISOB}}',   label: 'Hisob raqam' },
  { key: '{{ORG_MFO}}',     label: 'MFO' },
  { key: '{{ORG_MANZIL}}',  label: 'Tashkilot manzili' },
  { key: '{{CP_NOMI}}',     label: 'Kontragent nomi' },
  { key: '{{CP_INN}}',      label: 'Kontragent STIR' },
  { key: '{{CP_RAHBAR}}',   label: 'Kontragent rahbari' },
  { key: '{{CP_BANK}}',     label: 'Kontragent banki' },
  { key: '{{CP_HISOB}}',    label: 'Kontragent h/r' },
  { key: '{{CP_MFO}}',      label: 'Kontragent MFO' },
  { key: '{{CP_MANZIL}}',   label: 'Kontragent manzili' },
  { key: '{{RAQAM}}',       label: 'Shartnoma raqami' },
  { key: '{{SANA}}',        label: 'Shartnoma sanasi' },
  { key: '{{SHAHAR}}',      label: 'Shahar' },
  { key: '{{SUMMA}}',       label: 'Summa (raqamda)' },
  { key: '{{SUMMA_MATN}}',  label: 'Summa (so\'zda)' },
  { key: '{{MUDDAT}}',      label: 'Shartnoma muddati' },
  { key: '{{TOLOV_TARTIBI}}', label: 'To\'lov tartibi' },
  { key: '{{TOLOV_MUDDAT}}',  label: 'To\'lov muddati' },
  { key: '{{PENYA_FOIZ}}',    label: 'Penya foizi' },
]

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

const TYPE_OPTIONS = Object.entries(CONTRACT_TYPE_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.name,
}))

export default function YangiShablonPage() {
  const { currentOrg }  = useAuth()
  const router          = useRouter()
  const searchParams    = useSearchParams()
  const fromId          = searchParams.get('from')
  const textareaRef     = useRef<HTMLTextAreaElement>(null)

  const [name,         setName]         = useState('')
  const [contractType, setContractType] = useState<string>('OLDI_SOTDI')
  const [content,      setContent]      = useState('')
  const [previewMode,  setPreviewMode]  = useState(false)

  // Load source template if copying
  useQuery({
    queryKey: ['template-source', fromId],
    queryFn:  () => api.get(`/templates/${fromId}`).then(r => r.data),
    enabled:  !!fromId,
    onSuccess: (tpl: any) => {
      setContractType(tpl.contractType)
      setContent(tpl.content)
      setName(tpl.name + ' (nusxa)')
    },
  } as any)

  const saveMut = useMutation({
    mutationFn: () => api.post('/templates', {
      organizationId: currentOrg!.id,
      contractType,
      name,
      content,
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

  return (
    <div>
      <PageHeader
        title="Yangi shablon"
        description="O'z shartnoma shablonini yarating"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Shablonlar', path: '/dashboard/shablonlar' },
          { label: 'Yangi' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
              <ChevronLeft size={14} className="mr-1" />Orqaga
            </Button>
            <Button
              size="sm"
              loading={saveMut.isPending}
              disabled={!name || !content}
              onClick={() => saveMut.mutate()}
              leftIcon={<Save size={14} />}
            >
              Saqlash
            </Button>
          </div>
        }
      />

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <div className="w-full lg:w-56 lg:shrink-0 space-y-4">
          <Card padding="sm">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              Sozlamalar
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Shablon nomi</label>
                <Input
                  placeholder="Shablon nomi..."
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Shartnoma turi</label>
                <Select
                  options={TYPE_OPTIONS}
                  value={contractType}
                  onChange={e => setContractType(e.target.value)}
                />
              </div>
            </div>
          </Card>

          <Card padding="sm">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              O'zgaruvchilar
            </p>
            <div className="space-y-1 max-h-96 overflow-y-auto pr-1">
              {PLACEHOLDERS.map(p => (
                <button
                  key={p.key}
                  onClick={() => insertPlaceholder(p.key)}
                  className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-[#F1F5F9] group transition-colors"
                >
                  <p className="text-[10px] font-mono text-[#7C3AED] group-hover:text-[#5B21B6]">
                    {p.key}
                  </p>
                  <p className="text-[10px] text-[#94A3B8]">{p.label}</p>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Editor */}
        <div className="flex-1 min-w-0">
          <Card padding="none" className="overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#E2E8F0]">
              <p className="text-xs font-medium text-[#475569]">
                {previewMode ? 'Ko\'rish rejimi (namunaviy ma\'lumotlar bilan)' : 'Muharrir'}
              </p>
              <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-0.5">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    !previewMode ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'
                  )}
                >
                  <Code size={12} />Muharrir
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    previewMode ? 'bg-white text-[#0F172A] shadow-sm' : 'text-[#94A3B8]'
                  )}
                >
                  <Eye size={12} />Ko'rish
                </button>
              </div>
            </div>

            {previewMode ? (
              <pre className="p-5 text-sm text-[#1E293B] font-mono whitespace-pre-wrap min-h-[600px] bg-[#FAFAFA]">
                {preview || <span className="text-[#CBD5E1]">Matn kiriting...</span>}
              </pre>
            ) : (
              <textarea
                ref={textareaRef}
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Shartnoma matnini kiriting. O'zgaruvchilarni chap paneldan bosib qo'shing..."
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
