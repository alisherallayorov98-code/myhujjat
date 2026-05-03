'use client'

import { useState, useEffect, useMemo } from 'react'
import Link                              from 'next/link'
import { useRouter }                     from 'next/navigation'
import { useTranslations }               from 'next-intl'
import { useQuery }                      from '@tanstack/react-query'
import {
  ChevronLeft, ChevronRight, Loader2, Trash2, Send, FileText,
} from 'lucide-react'
import { PageHeader }    from '@/components/layout/PageHeader'
import { Card }          from '@/components/ui/Card'
import { Button }        from '@/components/ui/Button'
import { useAuth }       from '@/hooks/useAuth'
import api               from '@/lib/api'
import { cn }            from '@/lib/cn'
import toast             from 'react-hot-toast'

import { Step1Template }   from './_components/Step1Template'
import { Step2Recipients } from './_components/Step2Recipients'
import { Step3Numbering }  from './_components/Step3Numbering'
import { Step4Execute }    from './_components/Step4Execute'
import type { BulkDraft, BulkItem } from './_components/types'

import { ProLockBulk } from './_components/ProLockBulk'

export default function OmmaviyShartnomaPage() {
  const t = useTranslations('bulkSend')
  const router = useRouter()
  const { currentOrg, isPro } = useAuth()
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [draft, setDraft] = useState<BulkDraft | null>(null)
  const [saving, setSaving] = useState(false)

  // Pro lock
  if (!isPro) return <ProLockBulk />

  // Joriy draft yoki yangi yaratish
  const { data, isLoading, refetch } = useQuery<BulkDraft>({
    queryKey: ['bulk-send-draft', currentOrg?.id],
    queryFn:  async () => {
      const { data } = await api.get('/bulk-send/draft')
      return data
    },
    enabled:  !!currentOrg?.id,
  })

  useEffect(() => {
    if (data) {
      setDraft({
        ...data,
        defaultAmount: Number(data.defaultAmount) || 0,
        items:         (data.items as any) || [],
      })
      if (data.currentStep && data.currentStep !== step) {
        setStep(Math.min(4, Math.max(1, data.currentStep)) as any)
      }
    }
  }, [data?.id])

  // Patch — har o'zgarishda backend'ga saqlash (debounced)
  const patchDraft = async (patch: Partial<BulkDraft>) => {
    if (!draft) return
    setDraft({ ...draft, ...patch })
    setSaving(true)
    try {
      await api.patch(`/bulk-send/draft/${draft.id}`, patch)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('error'))
    } finally {
      setSaving(false)
    }
  }

  const updateItem = (idx: number, patch: Partial<BulkItem>) => {
    if (!draft) return
    const next = draft.items.map((it, i) => i === idx ? { ...it, ...patch } : it)
    setDraft({ ...draft, items: next })
    // backend'ga saqlash optional — execute paytida statuslar tezkor o'zgaradi
  }

  const setAllItems = (items: BulkItem[]) => {
    if (!draft) return
    setDraft({ ...draft, items })
  }

  const refreshDraft = async (): Promise<BulkDraft> => {
    const r = await refetch()
    return r.data!
  }

  const handleDiscard = async () => {
    if (!draft) return
    if (!confirm(t('discardConfirm'))) return
    await api.delete(`/bulk-send/draft/${draft.id}`)
    await refetch()
    setStep(1)
    toast.success(t('saved'))
  }

  const handleNext = async () => {
    if (step === 4) return
    const next = (step + 1) as 1 | 2 | 3 | 4
    setStep(next)
    await patchDraft({ currentStep: next })
  }
  const handleBack = async () => {
    if (step === 1) return
    const prev = (step - 1) as 1 | 2 | 3 | 4
    setStep(prev)
    await patchDraft({ currentStep: prev })
  }

  const canGoNext = useMemo(() => {
    if (!draft) return false
    if (step === 1) {
      const hasContent = draft.templateId || (draft.customContent && draft.customContent.trim())
      return !!(draft.contractType && hasContent)
    }
    if (step === 2) {
      const items = draft.items || []
      if (items.length === 0) return false
      // Hammasi 'ready' yoki yuqori bo'lishi kerak
      return items.every(it => ['ready', 'created', 'signed', 'sent'].includes(it.status))
    }
    if (step === 3) {
      if (draft.numberingMode === 'sequential') {
        return !!draft.startNumber?.trim()
      }
      // manual rejimda har bir item'ning contractNumber'i bo'lishi kerak
      return draft.items.every(it => !!it.contractNumber)
    }
    return true
  }, [draft, step])

  if (isLoading || !draft) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard',  path: '/dashboard' },
          { label: 'Shartnomalar', path: '/dashboard/shartnomalar' },
          { label: t('navItem') },
        ]}
        actions={
          draft.status === 'draft' && draft.items.length > 0 ? (
            <Button size="sm" variant="outline" leftIcon={<Trash2 size={13} />} onClick={handleDiscard}>
              {t('discard')}
            </Button>
          ) : null
        }
      />

      {/* Step indicator */}
      <Card className="mb-5">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((n, idx) => {
            const active   = step === n
            const complete = step > n
            const labels = [t('step1Title'), t('step2Title'), t('step3Title'), t('step4Title')]
            return (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all',
                  active && 'bg-[#2563EB] text-white shadow-md scale-110',
                  complete && 'bg-[#16A34A] text-white',
                  !active && !complete && 'bg-[#F1F5F9] text-[#94A3B8]',
                )}>
                  {n}
                </div>
                <p className={cn(
                  'text-xs hidden md:block',
                  active ? 'text-[#0F172A] font-semibold' : 'text-[#94A3B8]',
                )}>
                  {labels[idx]}
                </p>
                {n < 4 && <div className={cn('flex-1 h-0.5', complete ? 'bg-[#16A34A]' : 'bg-[#F1F5F9]')} />}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Step content */}
      <div className="max-w-3xl">
        {step === 1 && <Step1Template draft={draft} onChange={patchDraft} />}
        {step === 2 && <Step2Recipients draft={draft} onChange={patchDraft} />}
        {step === 3 && <Step3Numbering draft={draft} onChange={patchDraft} />}
        {step === 4 && (
          <Step4Execute
            draft={draft}
            orgId={currentOrg?.id || ''}
            onItemUpdate={updateItem}
            onAllItemsSet={setAllItems}
            onComplete={() => refetch()}
            refreshDraft={refreshDraft}
          />
        )}
      </div>

      {/* Footer nav */}
      <div className="max-w-3xl flex items-center justify-between mt-6 sticky bottom-4 bg-white/80 backdrop-blur-sm py-3 px-4 rounded-xl border border-[#E2E8F0]">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ChevronLeft size={14} />}
          onClick={handleBack}
          disabled={step === 1 || draft.status !== 'draft'}
        >
          {t('back')}
        </Button>

        <div className="text-xs text-[#94A3B8]">
          {saving && <span className="flex items-center gap-1"><Loader2 size={11} className="animate-spin" /> {t('saved')}</span>}
        </div>

        {step < 4 ? (
          <Button
            size="sm"
            rightIcon={<ChevronRight size={14} />}
            onClick={handleNext}
            disabled={!canGoNext}
          >
            {t('next')}
          </Button>
        ) : draft.status === 'completed' ? (
          <Link href="/dashboard/shartnomalar">
            <Button size="sm" leftIcon={<FileText size={14} />}>
              {t('step4ViewContracts')}
            </Button>
          </Link>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}
