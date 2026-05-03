'use client'

import { useState, useRef } from 'react'
import { useTranslations }  from 'next-intl'
import {
  Download, Upload, Plus, Trash2, RefreshCw, CheckCircle2, AlertCircle, Loader2, History, Users,
} from 'lucide-react'
import { Card }       from '@/components/ui/Card'
import { Input }      from '@/components/ui/Input'
import { Button }     from '@/components/ui/Button'
import api            from '@/lib/api'
import toast          from 'react-hot-toast'
import { cn }         from '@/lib/cn'
import { downloadBulkTemplate, parseBulkExcel } from './bulkExcel'
import type { BulkItem, BulkDraft, ItemStatus } from './types'

const MAX = 50

interface Props {
  draft: BulkDraft
  onChange: (patch: Partial<BulkDraft>) => void
}

export function Step2Recipients({ draft, onChange }: Props) {
  const t = useTranslations('bulkSend')
  const fileRef = useRef<HTMLInputElement>(null)
  const [stirInput, setStirInput] = useState('')
  const [fetchingAll, setFetchingAll] = useState(false)
  const [lastYearLoading, setLastYearLoading] = useState(false)

  const items = draft.items || []
  const allReady = items.every(i => i.status === 'ready' || i.status === 'created' || i.status === 'signed' || i.status === 'sent')
  const hasErrors = items.some(i => i.status === 'error')

  const setItems = (next: BulkItem[]) => onChange({ items: next })

  // ─── Manual qo'shish ──────────────────────────────────────
  const handleManualAdd = () => {
    const stir = stirInput.replace(/\D/g, '').slice(0, 9)
    if (stir.length !== 9) { toast.error(t('step2InvalidStir')); return }
    if (items.some(it => it.stir === stir)) { toast.error(t('step2DuplicateStir')); return }
    if (items.length >= MAX) { toast.error(t('step2OverLimit')); return }
    setItems([...items, { stir, status: 'pending' }])
    setStirInput('')
  }

  // ─── Excel yuklash ────────────────────────────────────────
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''  // resetlash (xuddi shu fayl 2-marta tanlansa)

    try {
      const rows = await parseBulkExcel(file)
      const existing = new Set(items.map(it => it.stir))
      const uniqueRows = rows.filter(r => !existing.has(r.stir))

      // Pre-flight tasdiqlash — agar 50 dan oshib ketadigan bo'lsa
      const totalAfter = items.length + uniqueRows.length
      if (totalAfter > MAX) {
        const willTake = MAX - items.length
        const ok = confirm(t('step2ExcelOverLimit', {
          fileRows: rows.length,
          unique:   uniqueRows.length,
          willTake,
          max:      MAX,
        }))
        if (!ok) return
      }

      const newItems: BulkItem[] = uniqueRows.map(r => ({
        stir:           r.stir,
        contractNumber: r.contractNumber,
        amount:         r.amount,
        productName:    r.productName,
        status:         'pending' as const,
      }))

      const combined = [...items, ...newItems].slice(0, MAX)
      setItems(combined)
      const added = combined.length - items.length
      toast.success(t('step2ExcelAdded', { count: added, totalRows: rows.length }))
    } catch (err: any) {
      toast.error(err?.message || t('error'))
    }
  }

  // ─── O'tgan yil hamkorlari ────────────────────────────────
  const handleAddLastYear = async () => {
    setLastYearLoading(true)
    try {
      const { data: cps } = await api.get('/bulk-send/last-year-counterparties')
      if (!Array.isArray(cps) || cps.length === 0) {
        toast(t('step2LastYearEmpty'), { icon: 'ℹ️' })
        return
      }
      const existing = new Set(items.map(it => it.stir))
      const newItems: BulkItem[] = cps
        .filter(c => c.inn && !existing.has(c.inn))
        .map(c => ({
          stir:         c.inn,
          name:         c.name,
          directorName: c.directorName,
          address:      c.address,
          bankName:     c.bankName,
          bankAccount:  c.bankAccount,
          mfo:          c.mfo,
          status:       'ready' as const,  // bizda allaqachon ma'lumot bor
        }))
      const combined = [...items, ...newItems].slice(0, MAX)
      setItems(combined)
      toast.success(`${newItems.length} ta hamkor qo'shildi`)
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('error'))
    } finally {
      setLastYearLoading(false)
    }
  }

  // ─── STIR'larni soliqdan tortish (sequential) ─────────────
  const handleFetchAll = async () => {
    const pending = items.filter(it => it.status === 'pending' || it.status === 'error')
    if (pending.length === 0) return

    setFetchingAll(true)
    let updated = [...items]

    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'pending' && updated[i].status !== 'error') continue

      // Tezkor UI yangilash — shu kontragent fetching holatida
      updated = updated.map((it, idx) => idx === i ? { ...it, status: 'fetching' as ItemStatus } : it)
      onChange({ items: updated })

      try {
        const { data } = await api.get(`/stir/${updated[i].stir}`)
        updated[i] = {
          ...updated[i],
          name:         data.name || updated[i].name,
          directorName: data.directorName,
          address:      data.address,
          status:       'ready' as ItemStatus,
          errorMessage: undefined,
        }
      } catch (e: any) {
        updated[i] = {
          ...updated[i],
          status:       'error' as ItemStatus,
          errorMessage: e?.response?.data?.message || t('stirFetchError'),
        }
      }
      onChange({ items: [...updated] })

      // Soliq API ga rate-limit hurmat (sekin lekin ishonchli)
      if (i < updated.length - 1) {
        await new Promise(r => setTimeout(r, 800))
      }
    }

    setFetchingAll(false)
  }

  const handleRemove = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx))
  }

  return (
    <div className="space-y-5">
      {/* Smart filter — o'tgan yil hamkorlari */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <History size={18} className="text-[#D97706]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#0F172A]">{t('step2LastYear')}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 mb-3">{t('step2LastYearDesc')}</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleAddLastYear}
              loading={lastYearLoading}
              leftIcon={<Plus size={13} />}
              disabled={items.length >= MAX}
            >
              {t('step2LastYearAdd')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Excel + Manual */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Download size={13} />}
            onClick={() => downloadBulkTemplate()}
          >
            {t('step2ExcelDownload')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Upload size={13} />}
            onClick={() => fileRef.current?.click()}
            disabled={items.length >= MAX}
          >
            {t('step2ExcelUpload')}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleExcelUpload}
            className="hidden"
          />
        </div>

        <div className="flex gap-2">
          <Input
            placeholder={t('step2StirPlaceholder')}
            value={stirInput}
            onChange={e => setStirInput(e.target.value.replace(/\D/g, '').slice(0, 9))}
            onKeyDown={e => { if (e.key === 'Enter') handleManualAdd() }}
            maxLength={9}
          />
          <Button onClick={handleManualAdd} leftIcon={<Plus size={13} />} size="sm" disabled={items.length >= MAX}>
            {t('step2Add')}
          </Button>
        </div>
      </Card>

      {/* Hisoblagich + STIR fetch */}
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-2 text-sm">
          <Users size={14} className="text-[#94A3B8]" />
          <span className={cn('font-medium', items.length >= MAX ? 'text-[#DC2626]' : 'text-[#0F172A]')}>
            {t('step2Count', { count: items.length })}
          </span>
        </div>
        {items.some(it => it.status === 'pending' || it.status === 'error') && (
          <Button
            size="sm"
            variant="outline"
            leftIcon={<RefreshCw size={12} className={fetchingAll ? 'animate-spin' : ''} />}
            onClick={handleFetchAll}
            loading={fetchingAll}
          >
            {t('step2FetchAll')}
          </Button>
        )}
      </div>

      {/* Kontragentlar jadvali */}
      {items.length > 0 && (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  <th className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] text-xs uppercase">#</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] text-xs uppercase">{t('step2Stir')}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] text-xs uppercase">{t('step2Name')}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] text-xs uppercase">{t('step2Director')}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] text-xs uppercase">{t('step2Status')}</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                    <td className="px-3 py-2 text-[#94A3B8]">{idx + 1}</td>
                    <td className="px-3 py-2 font-mono text-xs">{item.stir}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={item.name}>{item.name || '—'}</td>
                    <td className="px-3 py-2 max-w-[140px] truncate text-[#475569]" title={item.directorName}>
                      {item.directorName || '—'}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge status={item.status} errorMessage={item.errorMessage} />
                    </td>
                    <td className="px-2 py-2">
                      <button
                        onClick={() => handleRemove(idx)}
                        className="p-1.5 rounded hover:bg-[#FEE2E2] text-[#94A3B8] hover:text-[#DC2626] transition"
                        title={t('step2Remove')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Ogohlantirish — ba'zilar tortilmagan */}
      {items.length > 0 && !allReady && (
        <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg flex items-start gap-2">
          <AlertCircle size={14} className="text-[#A16207] shrink-0 mt-0.5" />
          <p className="text-xs text-[#854D0E]">{t('step2NeedFetch')}</p>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, errorMessage }: { status: ItemStatus; errorMessage?: string }) {
  const t = useTranslations('bulkSend')
  switch (status) {
    case 'pending':
      return <span className="text-xs text-[#94A3B8]">{t('step2StatusPending')}</span>
    case 'fetching':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs text-[#2563EB]">
          <Loader2 size={11} className="animate-spin" />
          {t('step2StatusFetching')}
        </span>
      )
    case 'ready':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-[#15803D]">
          <CheckCircle2 size={11} />
          {t('step2StatusReady')}
        </span>
      )
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-[#DC2626]" title={errorMessage}>
          <AlertCircle size={11} />
          {t('step2StatusError')}
        </span>
      )
    default:
      return <span className="text-xs text-[#94A3B8]">{status}</span>
  }
}
