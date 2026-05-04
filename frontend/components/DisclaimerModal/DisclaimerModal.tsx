'use client'

import { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ShieldAlert, FileWarning, Loader2 } from 'lucide-react'
import { Modal }   from '@/components/ui/Modal'
import { Button }  from '@/components/ui/Button'
import api         from '@/lib/api'
import toast       from 'react-hot-toast'

interface DisclaimerPayload {
  version:     string
  lastUpdated: string
  text:        string
}

interface Props {
  open:        boolean
  templateRef: string  // "system_OLDI_SOTDI", "industry_qurilish-pudrat"
  onClose:     () => void
  onAccepted:  () => void
}

export function DisclaimerModal({ open, templateRef, onClose, onAccepted }: Props) {
  const t      = useTranslations('disclaimerModal')
  const locale = useLocale()
  const qc     = useQueryClient()
  const [agreed, setAgreed] = useState(false)

  const { data, isLoading } = useQuery<DisclaimerPayload>({
    queryKey: ['disclaimer', locale],
    queryFn:  () => api.get('/acknowledgements/disclaimer', { params: { locale } }).then(r => r.data),
    enabled:  open,
    staleTime: 5 * 60 * 1000,
  })

  const acceptMut = useMutation({
    mutationFn: () => api.post('/acknowledgements', { templateRef }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['disclaimer-check', templateRef] })
      toast.success(t('accepted'))
      setAgreed(false)
      onAccepted()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={t('title')}
      description={t('subtitle')}
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={acceptMut.isPending}>
            {t('cancel')}
          </Button>
          <Button
            size="sm"
            disabled={!agreed || isLoading}
            loading={acceptMut.isPending}
            onClick={() => acceptMut.mutate()}
          >
            {t('acceptBtn')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-xl p-3.5">
          <ShieldAlert size={18} className="text-[#B45309] shrink-0 mt-0.5" />
          <div className="text-xs text-[#92400E] leading-relaxed">
            {t('warningHeader')}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 size={22} className="animate-spin text-[#2563EB]" />
          </div>
        ) : data ? (
          <>
            <div className="flex items-center gap-2 text-xs text-[#475569]">
              <FileWarning size={12} />
              <span>{t('versionLabel', { version: data.version, date: data.lastUpdated })}</span>
            </div>

            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 max-h-[40vh] overflow-y-auto">
              <pre className="text-[12.5px] text-[#1E293B] leading-relaxed whitespace-pre-wrap font-sans">
                {data.text}
              </pre>
            </div>

            <label className="flex items-start gap-3 p-3 bg-white border border-[#E2E8F0] rounded-xl cursor-pointer hover:bg-[#F8FAFC] transition">
              <input
                type="checkbox"
                checked={agreed}
                onChange={e => setAgreed(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-[#2563EB] rounded border-[#CBD5E1] focus:ring-[#2563EB]"
              />
              <span className="text-sm text-[#0F172A] leading-snug">
                {t('agreeCheckbox')}
              </span>
            </label>
          </>
        ) : (
          <p className="text-sm text-[#DC2626]">{t('loadFailed')}</p>
        )}
      </div>
    </Modal>
  )
}

// ============================================
// Yordamchi: foydalanuvchi shu shablon uchun joriy disclaimer'ni qabul qilganmi?
// ============================================
export function useDisclaimerCheck(templateRef: string | null) {
  return useQuery<{
    accepted:        boolean
    acceptedAt:      string | null
    currentVersion:  string
    acceptedVersion: string | null
  }>({
    queryKey: ['disclaimer-check', templateRef],
    queryFn:  () => api.get('/acknowledgements/check', { params: { templateRef } }).then(r => r.data),
    enabled:  !!templateRef,
    staleTime: 60 * 1000,
  })
}
