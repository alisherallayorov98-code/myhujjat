'use client'

import { useState }              from 'react'
import { useTranslations }       from 'next-intl'
import {
  Shield, Play, Loader2, CheckCircle2, AlertCircle, Key, RefreshCw,
} from 'lucide-react'
import { Card }                          from '@/components/ui/Card'
import { Button }                        from '@/components/ui/Button'
import api                               from '@/lib/api'
import { eimzoClient, EimzoCert, checkEimzoInstalled } from '@/lib/eimzo-client'
import toast                             from 'react-hot-toast'
import { cn }                            from '@/lib/cn'
import type { BulkDraft, BulkItem }      from './types'

interface Props {
  draft: BulkDraft
  orgId: string
  onItemUpdate: (idx: number, patch: Partial<BulkItem>) => void
  onAllItemsSet: (items: BulkItem[]) => void
  onComplete:    () => void
  refreshDraft:  () => Promise<BulkDraft>
}

type Phase = 'idle' | 'connecting' | 'keypick' | 'creating' | 'signing' | 'sending' | 'done' | 'error'

export function Step4Execute({ draft, orgId, onItemUpdate, onAllItemsSet, onComplete, refreshDraft }: Props) {
  const t = useTranslations('bulkSend')
  const [phase, setPhase] = useState<Phase>('idle')
  const [keys, setKeys]   = useState<EimzoCert[]>([])
  const [selectedKey, setSelectedKey] = useState<EimzoCert | null>(null)
  const [progressIdx, setProgressIdx] = useState(0)

  const items = draft.items || []
  const total = items.length
  const successCount = items.filter(it => it.status === 'sent').length
  const errorCount   = items.filter(it => it.status === 'error').length
  const finished = phase === 'done'

  // ─── 1) Backend'da hammasini yaratish (executing) ─────────
  const createAll = async () => {
    setPhase('creating')
    try {
      await api.post(`/bulk-send/draft/${draft.id}/execute`)
      const updated = await refreshDraft()
      onAllItemsSet(updated.items)
      return updated.items
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('executeError'))
      setPhase('error')
      return null
    }
  }

  // ─── 2) E-IMZO ulanish + kalit tanlash ────────────────────
  const connectEimzo = async () => {
    setPhase('connecting')
    const ok = await checkEimzoInstalled()
    if (!ok) { toast.error(t('noEimzo')); setPhase('error'); return false }
    try {
      const ks = await eimzoClient.listCertificates()
      setKeys(ks)
      if (ks.length === 1) {
        setSelectedKey(ks[0])
        setPhase('signing')
        return ks[0]
      }
      setPhase('keypick')
      return null
    } catch (e: any) {
      toast.error(e?.message || t('error'))
      setPhase('error')
      return false
    }
  }

  // ─── 3) Imzolash va Didox'ga yuborish (ketma-ket) ─────────
  const signAndSendAll = async (key: EimzoCert, currentItems: BulkItem[]) => {
    setPhase('signing')
    for (let i = 0; i < currentItems.length; i++) {
      const item = currentItems[i]
      if (!item.contractId || item.status === 'sent' || item.status === 'error') continue

      setProgressIdx(i)
      try {
        // Challenge
        const { data: ch } = await api.get('/eimzo/challenge')
        const { signature, certificate } = await eimzoClient.sign(key.alias, ch.challenge)
        const { data: verifyResp } = await api.post(`/eimzo/verify/${item.contractId}`, {
          challengeId: ch.id,
          signature, certificate,
          signerType: 'us',
        })
        if (!verifyResp.success) throw new Error('Imzo tasdiqlanmadi')

        onItemUpdate(i, { status: 'signed' })
        await api.post(`/bulk-send/draft/${draft.id}/mark-signed`, { contractId: item.contractId })

        // Didox'ga yuborish
        try {
          await api.post(`/didox/send/${item.contractId}?orgId=${orgId}`, {})
          onItemUpdate(i, { status: 'sent' })
          await api.post(`/bulk-send/draft/${draft.id}/mark-sent`, { contractId: item.contractId })
        } catch (e: any) {
          // Didox xato — imzo bor, faqat yuborish muvaffaqiyatsiz
          onItemUpdate(i, { status: 'error', errorMessage: e?.response?.data?.message || 'Didox xato' })
        }
      } catch (e: any) {
        onItemUpdate(i, { status: 'error', errorMessage: e?.message?.slice(0, 100) || 'Imzo xato' })
      }
    }
    setPhase('done')
    onComplete()
  }

  const handleStart = async () => {
    // 1) Backend'da yaratish (agar hali yaratilmagan bo'lsa)
    let workItems: BulkItem[] = items
    if (!items.some(it => it.contractId)) {
      const created = await createAll()
      if (!created) return
      workItems = created
    }

    // 2) E-IMZO
    const k = await connectEimzo()
    if (k === false || k === null) return  // false = error, null = key picker chiqdi

    // 3) Imzolash + yuborish
    await signAndSendAll(k, workItems)
  }

  const handleKeyPick = async (k: EimzoCert) => {
    setSelectedKey(k)
    await signAndSendAll(k, items)
  }

  const phaseLabel = (() => {
    switch (phase) {
      case 'creating':   return t('step4ItemCreating')
      case 'connecting': return t('selectKey')
      case 'signing':    return t('step4ItemSigning')
      case 'sending':    return t('step4ItemSending')
      default:           return ''
    }
  })()

  return (
    <div className="space-y-5">
      {/* Confirm */}
      {phase === 'idle' && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <Shield size={18} className="text-[#2563EB]" />
            <h3 className="font-bold text-[#0F172A] text-sm">{t('step4Confirm')}</h3>
          </div>
          <p className="text-sm text-[#475569] mb-4">{t('step4ConfirmDesc', { count: items.length })}</p>
          <div className="p-3 bg-[#F0F9FF] border border-[#BFDBFE] rounded-lg mb-4">
            <p className="text-xs text-[#1E40AF] leading-relaxed">{t('step4SecurityNotice')}</p>
          </div>
          <Button onClick={handleStart} leftIcon={<Play size={14} />} fullWidth>
            {t('step4Start')}
          </Button>
        </Card>
      )}

      {/* Key picker */}
      {phase === 'keypick' && (
        <Card>
          <p className="text-sm font-medium text-[#374151] mb-3">{t('selectKey')}</p>
          <div className="space-y-2">
            {keys.map(k => {
              const cn_ = k.subjectDn.split(',').find(s => s.includes('CN='))?.replace('CN=', '').trim() || k.alias
              return (
                <button
                  key={k.alias}
                  onClick={() => handleKeyPick(k)}
                  className="w-full flex items-start gap-3 p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#EFF6FF] text-left transition-all"
                >
                  <Key size={16} className="shrink-0 mt-0.5 text-[#2563EB]" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">{cn_}</p>
                    <p className="text-xs text-[#94A3B8]">{k.notAfter}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      )}

      {/* Live progress */}
      {(phase === 'creating' || phase === 'signing' || phase === 'sending' || finished) && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {!finished && <Loader2 size={16} className="animate-spin text-[#2563EB]" />}
              {finished && <CheckCircle2 size={16} className="text-[#16A34A]" />}
              <p className="text-sm font-bold text-[#0F172A]">
                {finished
                  ? t('step4Done')
                  : phaseLabel}
              </p>
            </div>
            <p className="text-xs text-[#94A3B8]">
              {t('step4Progress', { current: successCount + errorCount, total })}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[#F1F5F9] rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-[#2563EB] to-[#7C3AED] transition-all duration-300"
              style={{ width: `${total ? ((successCount + errorCount) / total) * 100 : 0}%` }}
            />
          </div>

          {/* Item list with statuses */}
          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {items.map((item, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs',
                  idx === progressIdx && !finished && 'bg-[#EFF6FF]'
                )}
              >
                <span className="text-[#94A3B8] w-6">{idx + 1}.</span>
                <span className="font-mono text-[#475569] w-20 shrink-0">{item.stir}</span>
                <span className="flex-1 truncate text-[#0F172A]">{item.name || '—'}</span>
                <ItemStatusIcon item={item} active={idx === progressIdx && !finished} />
              </div>
            ))}
          </div>

          {finished && (
            <div className={cn(
              'mt-4 p-3 rounded-lg flex items-start gap-2',
              errorCount === 0
                ? 'bg-[#F0FDF4] border border-[#BBF7D0]'
                : 'bg-[#FEF3C7] border border-[#FDE68A]'
            )}>
              {errorCount === 0
                ? <CheckCircle2 size={14} className="text-[#16A34A] shrink-0 mt-0.5" />
                : <AlertCircle size={14} className="text-[#A16207] shrink-0 mt-0.5" />
              }
              <p className={cn('text-sm', errorCount === 0 ? 'text-[#15803D]' : 'text-[#854D0E]')}>
                {t('step4DoneSuccess', { success: successCount, errors: errorCount })}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Xatolar hisoboti — alohida kartochka, retry tugmasi bilan */}
      {finished && errorCount > 0 && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={16} className="text-[#DC2626]" />
            <h3 className="font-bold text-[#0F172A] text-sm">
              {t('step4ErrorsTitle', { count: errorCount })}
            </h3>
          </div>
          <p className="text-xs text-[#94A3B8] mb-4">{t('step4ErrorsHint')}</p>

          <div className="space-y-2 mb-4">
            {items.map((item, idx) => {
              if (item.status !== 'error') return null
              return (
                <div key={idx} className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        <span className="font-mono text-xs text-[#94A3B8] mr-2">{item.stir}</span>
                        {item.name || '—'}
                      </p>
                      {item.errorMessage && (
                        <p className="text-xs text-[#991B1B] mt-1">{item.errorMessage}</p>
                      )}
                    </div>
                    {item.contractId && (
                      <button
                        onClick={() => retryItem(idx)}
                        disabled={!selectedKey}
                        title={!selectedKey ? t('selectKey') : t('step4Retry')}
                        className="shrink-0 p-1.5 rounded-lg text-[#2563EB] hover:bg-[#DBEAFE] disabled:opacity-40 transition"
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )

  function retryItem(idx: number) {
    const item = items[idx]
    if (!selectedKey || !item.contractId) return
    void signSingle(selectedKey, item, idx)
  }

  async function signSingle(key: EimzoCert, item: BulkItem, idx: number) {
    onItemUpdate(idx, { status: 'created', errorMessage: undefined })
    try {
      const { data: ch } = await api.get('/eimzo/challenge')
      const { signature, certificate } = await eimzoClient.sign(key.alias, ch.challenge)
      const { data: verifyResp } = await api.post(`/eimzo/verify/${item.contractId}`, {
        challengeId: ch.id, signature, certificate, signerType: 'us',
      })
      if (!verifyResp.success) throw new Error('Imzo tasdiqlanmadi')
      onItemUpdate(idx, { status: 'signed' })
      await api.post(`/bulk-send/draft/${draft.id}/mark-signed`, { contractId: item.contractId })

      try {
        await api.post(`/didox/send/${item.contractId}?orgId=${orgId}`, {})
        onItemUpdate(idx, { status: 'sent' })
        await api.post(`/bulk-send/draft/${draft.id}/mark-sent`, { contractId: item.contractId })
      } catch (e: any) {
        onItemUpdate(idx, { status: 'error', errorMessage: e?.response?.data?.message || 'Didox xato' })
      }
    } catch (e: any) {
      onItemUpdate(idx, { status: 'error', errorMessage: e?.message?.slice(0, 100) || 'Imzo xato' })
    }
  }
}

function ItemStatusIcon({ item, active }: { item: BulkItem; active: boolean }) {
  const t = useTranslations('bulkSend')
  if (item.status === 'sent')    return <span className="text-[#16A34A]">{t('step4ItemDone')}</span>
  if (item.status === 'error')   return <span className="text-[#DC2626]" title={item.errorMessage}>{t('step4ItemError')}</span>
  if (item.status === 'signed')  return <Loader2 size={11} className="animate-spin text-[#7C3AED]" />
  if (item.status === 'created') return active ? <Loader2 size={11} className="animate-spin text-[#2563EB]" /> : <span className="text-[#94A3B8]">—</span>
  return <span className="text-[#94A3B8]">—</span>
}

