'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  FileText, AlertTriangle, AlertCircle, CheckCircle2,
  Plus, Upload, Trash2, ArrowRight, Sparkles,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import { Modal }   from '@/components/ui/Modal'
import api         from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn }      from '@/lib/cn'
import toast       from 'react-hot-toast'

interface Invoice {
  id:             string
  source:         string
  documentNumber: string | null
  documentDate:   string | null
  sellerName:     string | null
  buyerName:      string | null
  direction:      'INCOMING' | 'OUTGOING'
  amount:         number
  vatAmount:      number
  totalAmount:    number
  status:         string
  createdAt:      string
}

interface ContractData {
  id:             string
  contractNumber: string
  amount:         number
  totalInvoiced:  number
  invoiceCount:   number
  alertLevel:     string | null
}

interface Props {
  contract: ContractData
  orgId:    string
}

export function InvoicesPanel({ contract, orgId }: Props) {
  const t = useTranslations('invoicesPanel')
  const qc = useQueryClient()
  const [addOpen, setAddOpen] = useState(false)

  const ALERT_CONFIG: Record<string, { color: string; bg: string; border: string; label: string; icon: any }> = {
    WARNING:          { color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]', label: t('alertWarning'),     icon: AlertCircle },
    CRITICAL:         { color: 'text-[#EA580C]', bg: 'bg-[#FFEDD5]', border: 'border-[#FED7AA]', label: t('alertCritical'),    icon: AlertTriangle },
    EXCEEDED:         { color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]', border: 'border-[#FECACA]', label: t('alertExceeded'),    icon: AlertTriangle },
    CRITICAL_OVERAGE: { color: 'text-white',     bg: 'bg-[#991B1B]', border: 'border-[#7F1D1D]', label: t('alertSignificant'), icon: AlertTriangle },
  }

  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices', contract.id],
    queryFn:  () => api.get(`/invoices/contract/${contract.id}`).then(r => r.data),
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['invoices', contract.id] })
      qc.invalidateQueries({ queryKey: ['contract',  contract.id] })
      toast.success(t('deleted'))
    },
  })

  const total   = Number(contract.amount) || 0
  const used    = Number(contract.totalInvoiced) || 0
  const percent = total > 0 ? (used / total) * 100 : 0
  const remaining = total - used
  const overage   = used - total

  const alert = contract.alertLevel ? ALERT_CONFIG[contract.alertLevel] : null

  return (
    <Card padding="none" className="overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={14} className="text-[#94A3B8]" />
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t('title')}</p>
          <span className="text-xs text-[#94A3B8]">({invoices.length})</span>
        </div>
        <div className="flex gap-2">
          <Button size="xs" variant="outline" leftIcon={<Plus size={12} />} onClick={() => setAddOpen(true)}>
            {t('manualAdd')}
          </Button>
        </div>
      </div>

      <div className="px-5 py-4 border-b border-[#E2E8F0]">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-[#475569]">
            {t('contractAmount')} <span className="text-[#0F172A] font-bold">{formatCurrency(total)}</span>
          </p>
          <p className={cn(
            'text-sm font-bold',
            percent >= 100 ? 'text-[#DC2626]' :
            percent >=  95 ? 'text-[#EA580C]' :
            percent >=  80 ? 'text-[#D97706]' : 'text-[#16A34A]'
          )}>
            {percent.toFixed(1)}%
          </p>
        </div>

        <div className="relative w-full h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              percent >= 100 ? 'bg-gradient-to-r from-[#DC2626] to-[#991B1B]' :
              percent >=  95 ? 'bg-[#EA580C]' :
              percent >=  80 ? 'bg-[#D97706]' :
                              'bg-gradient-to-r from-[#16A34A] to-[#22C55E]'
            )}
            style={{ width: `${Math.min(percent, 100)}%` }}
          />
          {percent > 100 && (
            <div className="absolute inset-y-0 right-0 w-1 bg-white" />
          )}
        </div>

        <div className="flex justify-between text-xs text-[#94A3B8] mt-2">
          <span>{t('used')} <strong className="text-[#475569]">{formatCurrency(used)}</strong></span>
          {remaining >= 0 ? (
            <span>{t('remaining')} <strong className="text-[#16A34A]">{formatCurrency(remaining)}</strong></span>
          ) : (
            <span className="text-[#DC2626]">{t('exceeded', { amount: formatCurrency(overage) })}</span>
          )}
        </div>
      </div>

      {alert && (
        <div className={cn('px-5 py-3 border-b flex items-start gap-3', alert.bg, alert.border)}>
          <alert.icon size={18} className={cn('shrink-0 mt-0.5', alert.color)} />
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', alert.color)}>
              {contract.alertLevel === 'EXCEEDED' || contract.alertLevel === 'CRITICAL_OVERAGE'
                ? (overage > 0
                    ? t('alertExceededMsgWith', { amount: formatCurrency(overage) })
                    : t('alertExceededMsg'))
                : contract.alertLevel === 'CRITICAL'
                ? t('alertCriticalMsg', { remaining: formatCurrency(remaining) })
                : t('alertWarningMsg')}
            </p>
            {(contract.alertLevel === 'EXCEEDED' || contract.alertLevel === 'CRITICAL_OVERAGE') && (
              <p className={cn('text-xs mt-1', alert.color, 'opacity-80')}>
                {t('alertHint', { bold: t('alertHintBold') })}
              </p>
            )}
          </div>
          {(contract.alertLevel === 'EXCEEDED' || contract.alertLevel === 'CRITICAL_OVERAGE') && (
            <Button
              size="xs"
              variant={contract.alertLevel === 'CRITICAL_OVERAGE' ? 'secondary' : 'primary'}
              leftIcon={<Sparkles size={11} />}
              onClick={() => {
                window.location.href = `/dashboard/shartnomalar/yangi?type=QOSHIMCHA&parentId=${contract.id}&extraAmount=${overage}`
              }}
            >
              {t('createAdditional')}
            </Button>
          )}
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="p-10 text-center">
          <FileText size={32} className="mx-auto text-[#CBD5E1] mb-2" />
          <p className="text-sm text-[#94A3B8] mb-3">{t('noInvoices')}</p>
          <p className="text-xs text-[#CBD5E1]">
            {t('noInvoicesHint')}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-[#F1F5F9]">
          {invoices.map(inv => (
            <div key={inv.id} className="px-5 py-3 flex items-center gap-3 hover:bg-[#F8FAFC] group">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                inv.direction === 'OUTGOING' ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-[#FEF3C7] text-[#D97706]'
              )}>
                <FileText size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-[#0F172A] truncate">
                    {inv.documentNumber || `${t('title')} #${inv.id.slice(0, 6)}`}
                  </p>
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569]">
                    {inv.source}
                  </span>
                  {inv.direction === 'OUTGOING' && (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">
                      {t('fromUs')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5 truncate">
                  {inv.documentDate ? formatDate(inv.documentDate, 'short') : '—'}
                  {inv.sellerName && ` · ${inv.sellerName}`}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold text-[#0F172A]">{formatCurrency(Number(inv.totalAmount))}</p>
                {Number(inv.vatAmount) > 0 && (
                  <p className="text-[10px] text-[#94A3B8]">{t('qqs')} {formatCurrency(Number(inv.vatAmount))}</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (confirm(t('deleteConfirm'))) removeMut.mutate(inv.id)
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <ManualAddModal
        contractId={contract.id}
        contractNumber={contract.contractNumber}
        orgId={orgId}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </Card>
  )
}

function ManualAddModal({ contractId, contractNumber, orgId, open, onClose }: {
  contractId: string
  contractNumber: string
  orgId: string
  open: boolean
  onClose: () => void
}) {
  const t = useTranslations('invoicesPanel')
  const qc = useQueryClient()
  const [form, setForm] = useState({
    documentNumber: '',
    documentDate:   new Date().toISOString().split('T')[0],
    amount:         '',
    vatAmount:      '',
    direction:      'INCOMING' as 'INCOMING' | 'OUTGOING',
  })

  const upd = (k: keyof typeof form, v: string) => setForm(f => ({ ...f, [k]: v }))

  const createMut = useMutation({
    mutationFn: () => api.post('/invoices', {
      organizationId:  orgId,
      source:          'MANUAL',
      contractId,
      contractNumber,
      documentNumber:  form.documentNumber || undefined,
      documentDate:    form.documentDate,
      direction:       form.direction,
      amount:          Number(form.amount) || 0,
      vatAmount:       Number(form.vatAmount) || 0,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invoices', contractId] })
      qc.invalidateQueries({ queryKey: ['contract',  contractId] })
      toast.success(t('added'))
      onClose()
      setForm({ documentNumber: '', documentDate: new Date().toISOString().split('T')[0], amount: '', vatAmount: '', direction: 'INCOMING' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  return (
    <Modal
      open={open} onClose={onClose}
      title={t('modalTitle')}
      size="md"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>{t('cancel')}</Button>
          <Button size="sm" loading={createMut.isPending}
            onClick={() => createMut.mutate()} disabled={!form.amount}>
            {t('addBtn')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('invoiceNumber')} placeholder={t('invoiceNumberPlace')}
            value={form.documentNumber} onChange={e => upd('documentNumber', e.target.value)} />
          <Input label={t('invoiceDate')} type="date"
            value={form.documentDate} onChange={e => upd('documentDate', e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[#374151]">{t('direction')}</label>
          <div className="flex gap-2">
            <button
              onClick={() => upd('direction', 'INCOMING')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm border-2 transition',
                form.direction === 'INCOMING'
                  ? 'border-[#D97706] bg-[#FEF3C7] text-[#92400E]'
                  : 'border-[#E2E8F0] text-[#475569]'
              )}
            >
              {t('directionIncoming')}
            </button>
            <button
              onClick={() => upd('direction', 'OUTGOING')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm border-2 transition',
                form.direction === 'OUTGOING'
                  ? 'border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]'
                  : 'border-[#E2E8F0] text-[#475569]'
              )}
            >
              {t('directionOutgoing')}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('amount')} type="number" placeholder="0"
            value={form.amount} onChange={e => upd('amount', e.target.value)} />
          <Input label={t('vat')} type="number" placeholder="0"
            value={form.vatAmount} onChange={e => upd('vatAmount', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}
