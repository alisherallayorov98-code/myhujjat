'use client'

import { useState, useEffect, useMemo, type ReactNode } from 'react'
import { useTranslations }   from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft, Save, Plus, Trash2, ArrowUp, ArrowDown, Eye, FileText,
  Heading, AlignLeft, FileSignature, List as ListIcon, Loader2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card }       from '@/components/ui/Card'
import { Button }     from '@/components/ui/Button'
import { Input }      from '@/components/ui/Input'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useAuth }    from '@/hooks/useAuth'
import api            from '@/lib/api'
import { cn }         from '@/lib/cn'
import toast          from 'react-hot-toast'

type BlockType = 'heading' | 'clause' | 'paragraph' | 'signature' | 'list'

interface Block {
  id?:    string
  type:   BlockType
  level?: number
  number?: string
  text:   string
}

interface UserTemplate {
  id:             string
  name:           string
  contractType:   string | null
  source:         string
  blocks:         Block[]
  rawContent:     string | null
  organizationId: string
  createdAt:      string
  updatedAt:      string
}

const BLOCK_ICONS: Record<BlockType, ReactNode> = {
  heading:   <Heading size={13} />,
  clause:    <ListIcon size={13} />,
  paragraph: <AlignLeft size={13} />,
  signature: <FileSignature size={13} />,
  list:      <ListIcon size={13} />,
}

function genId(): string {
  return 'b' + Math.random().toString(36).slice(2, 10)
}

export default function MineTemplateEditPage() {
  const t  = useTranslations('userTemplates')
  const tc = useTranslations('contracts')
  const tp = useTranslations('shablonlar')
  const { currentOrg } = useAuth()
  const router = useRouter()
  const params = useParams()
  const qc     = useQueryClient()
  const id     = params?.id as string

  const [name,   setName]   = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [previewMode, setPreviewMode] = useState(false)
  const [deleteOpen, setDeleteOpen]   = useState(false)

  const { data, isLoading } = useQuery<UserTemplate>({
    queryKey: ['user-template', id],
    queryFn:  () => api.get(`/user-templates/${id}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!id && !!currentOrg?.id,
  })

  useEffect(() => {
    if (data) {
      setName(data.name)
      const initial: Block[] = Array.isArray(data.blocks) && data.blocks.length > 0
        ? data.blocks.map(b => ({ ...b, id: b.id ?? genId() }))
        : []
      setBlocks(initial)
    }
  }, [data])

  const saveMut = useMutation({
    mutationFn: () => api.put(`/user-templates/${id}?orgId=${currentOrg!.id}`, {
      name:   name.trim(),
      blocks,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-template', id] })
      qc.invalidateQueries({ queryKey: ['user-templates'] })
      toast.success(t('saved'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('saveError')),
  })

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/user-templates/${id}?orgId=${currentOrg!.id}`),
    onSuccess: () => {
      toast.success(tp('deleteBtn'))
      router.push('/dashboard/shablonlar')
    },
  })

  function updateBlock(idx: number, patch: Partial<Block>) {
    setBlocks(prev => prev.map((b, i) => (i === idx ? { ...b, ...patch } : b)))
  }

  function addBlockAfter(idx: number, type: BlockType) {
    const newBlock: Block = { id: genId(), type, text: '' }
    setBlocks(prev => [...prev.slice(0, idx + 1), newBlock, ...prev.slice(idx + 1)])
  }

  function deleteBlock(idx: number) {
    setBlocks(prev => prev.filter((_, i) => i !== idx))
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const target = idx + dir
    if (target < 0 || target >= blocks.length) return
    setBlocks(prev => {
      const next = [...prev]
      ;[next[idx], next[target]] = [next[target], next[idx]]
      return next
    })
  }

  // Bloklarni eskizga (preview) aylantirish
  const previewText = useMemo(() => {
    return blocks.map(b => {
      if (b.type === 'heading') return `\n${b.number ? b.number + '. ' : ''}${b.text.toUpperCase()}\n`
      if (b.type === 'clause')  return `${b.number ? b.number + '. ' : ''}${b.text}`
      if (b.type === 'signature') return `\n${b.text}`
      return b.text
    }).join('\n')
  }, [blocks])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-[#2563EB]" />
      </div>
    )
  }

  if (!data) {
    return <div className="p-6 text-sm text-[#94A3B8]">{tp('noContent')}</div>
  }

  return (
    <div>
      <PageHeader
        title={name || data.name}
        description={t('editorTitle')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: tp('breadcrumb'), path: '/dashboard/shablonlar' },
          { label: t('editorBreadcrumb') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              leftIcon={<ChevronLeft size={14} />}
              onClick={() => router.push('/dashboard/shablonlar')}
            >
              {t('back')}
            </Button>
            <Button
              variant="outline" size="sm"
              leftIcon={<Eye size={14} />}
              onClick={() => setPreviewMode(p => !p)}
            >
              {previewMode ? t('editorMode') : t('previewMode')}
            </Button>
            <Button
              size="sm"
              leftIcon={<Save size={14} />}
              loading={saveMut.isPending}
              onClick={() => saveMut.mutate()}
            >
              {t('saveBtn')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="lg:col-span-1 space-y-4">
          <Input
            label={t('tplName')}
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={200}
          />
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">{t('contractType')}</label>
            <p className="text-sm text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
              {data.contractType ? tc(`types.${data.contractType}` as any) : '—'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">{t('source')}</label>
            <p className="text-sm text-[#475569] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
              {data.source}
            </p>
          </div>
          <div className="pt-3 border-t border-[#E2E8F0]">
            <p className="text-xs text-[#94A3B8] mb-2">{t('blocksCount', { count: blocks.length })}</p>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-[#DC2626] hover:bg-[#FEF2F2] hover:border-[#FECACA]"
              leftIcon={<Trash2 size={13} />}
              onClick={() => setDeleteOpen(true)}
              loading={deleteMut.isPending}
            >
              {tp('deleteBtn')}
            </Button>
          </div>
        </Card>

        <Card className="lg:col-span-3">
          {previewMode ? (
            <div className="bg-[#F8FAFC] rounded-xl p-4 max-h-[70vh] overflow-y-auto">
              <pre className="text-xs leading-relaxed text-[#1E293B] whitespace-pre-wrap font-sans">
                {previewText || t('emptyContent')}
              </pre>
            </div>
          ) : (
            <div className="space-y-2">
              {blocks.length === 0 && (
                <div className="text-center py-8 text-sm text-[#94A3B8]">
                  {t('noBlocks')}
                  <Button
                    size="sm"
                    className="mx-auto mt-3"
                    leftIcon={<Plus size={13} />}
                    onClick={() => setBlocks([{ id: genId(), type: 'heading', text: '' }])}
                  >
                    {t('addFirstBlock')}
                  </Button>
                </div>
              )}

              {blocks.map((b, idx) => (
                <BlockEditor
                  key={b.id ?? idx}
                  block={b}
                  index={idx}
                  total={blocks.length}
                  onChange={patch => updateBlock(idx, patch)}
                  onDelete={() => deleteBlock(idx)}
                  onMove={dir => moveBlock(idx, dir)}
                  onAddAfter={(type) => addBlockAfter(idx, type)}
                  t={t}
                />
              ))}
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { deleteMut.mutate(); setDeleteOpen(false) }}
        title={tp('deleteTitle')}
        description={tp('deleteConfirm')}
        variant="danger"
        loading={deleteMut.isPending}
      />
    </div>
  )
}

// ============================================
// Bitta blok editori
// ============================================
function BlockEditor({
  block, index, total,
  onChange, onDelete, onMove, onAddAfter, t,
}: {
  block: Block
  index: number
  total: number
  onChange:   (patch: Partial<Block>) => void
  onDelete:   () => void
  onMove:     (dir: -1 | 1) => void
  onAddAfter: (type: BlockType) => void
  t: ReturnType<typeof useTranslations<'userTemplates'>>
}) {
  return (
    <div className={cn(
      'group rounded-xl border bg-white transition',
      block.type === 'heading' ? 'border-[#BFDBFE] bg-[#F0F9FF]' :
      block.type === 'signature' ? 'border-[#FCD34D] bg-[#FFFBEB]' :
      'border-[#E2E8F0]',
    )}>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-[#F1F5F9]">
        <span className={cn(
          'text-[10px] px-1.5 py-0.5 rounded font-mono',
          block.type === 'heading'   ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
          block.type === 'clause'    ? 'bg-[#DCFCE7] text-[#15803D]' :
          block.type === 'signature' ? 'bg-[#FEF3C7] text-[#B45309]' :
                                        'bg-[#F1F5F9] text-[#475569]',
        )}>
          {BLOCK_ICONS[block.type]}
          <span className="ml-1">{block.type}</span>
        </span>
        {(block.type === 'heading' || block.type === 'clause') && (
          <input
            value={block.number ?? ''}
            onChange={e => onChange({ number: e.target.value })}
            placeholder={t('numberPh')}
            className="w-16 text-xs px-2 py-1 rounded bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
          />
        )}
        <select
          value={block.type}
          onChange={e => onChange({ type: e.target.value as BlockType })}
          className="text-xs px-2 py-1 rounded bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="heading">{t('typeHeading')}</option>
          <option value="clause">{t('typeClause')}</option>
          <option value="paragraph">{t('typeParagraph')}</option>
          <option value="signature">{t('typeSignature')}</option>
        </select>
        <div className="flex-1" />
        <button
          onClick={() => onMove(-1)}
          disabled={index === 0}
          className="p-1.5 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30"
          title={t('moveUp')}
        >
          <ArrowUp size={13} />
        </button>
        <button
          onClick={() => onMove(1)}
          disabled={index === total - 1}
          className="p-1.5 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30"
          title={t('moveDown')}
        >
          <ArrowDown size={13} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
          title={t('deleteBlock')}
        >
          <Trash2 size={13} />
        </button>
      </div>
      <div className="p-3">
        <textarea
          value={block.text}
          onChange={e => onChange({ text: e.target.value })}
          rows={block.type === 'heading' ? 1 : block.type === 'clause' ? 2 : 3}
          placeholder={t(`placeholderText`)}
          className={cn(
            'w-full text-sm rounded bg-transparent focus:outline-none resize-none',
            block.type === 'heading' ? 'font-bold text-[#0F172A]' : 'text-[#475569] leading-relaxed',
          )}
        />
      </div>
      <div className="flex items-center justify-center gap-1 px-3 pb-2 opacity-0 group-hover:opacity-100 transition">
        <span className="text-[10px] text-[#94A3B8]">{t('addAfter')}:</span>
        {(['heading', 'clause', 'paragraph', 'signature'] as BlockType[]).map(type => (
          <button
            key={type}
            onClick={() => onAddAfter(type)}
            className="text-[10px] px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569] hover:bg-[#DBEAFE] hover:text-[#1D4ED8] transition flex items-center gap-1"
          >
            <Plus size={10} />
            {type}
          </button>
        ))}
      </div>
    </div>
  )
}
