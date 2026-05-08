'use client'

import { useState, useEffect } from 'react'
import { useTranslations }     from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bot, Save, Lock, Sparkles, Shield, Hash, Loader2,
  FileText, ArrowRight,
} from 'lucide-react'
import { Card }            from '@/components/ui/Card'
import { Button }          from '@/components/ui/Button'
import { Input }           from '@/components/ui/Input'
import { Select }          from '@/components/ui/Select'
import { useAuth }         from '@/hooks/useAuth'
import api                 from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/formatters'
import toast               from 'react-hot-toast'
import { cn }              from '@/lib/cn'
import Link                from 'next/link'
import { MiraTestChat }   from '@/components/VoiceAssistant/MiraTestChat'

const TRUST_THRESHOLD = 10  // 10 ta muvaffaqiyatli shartnomadan so'ng auto-send ochiladi

interface MiraSettings {
  id:                    string
  defaultContractType:   string
  defaultAmount:         string | number
  defaultCity:           string
  defaultProductName:    string | null
  defaultPaymentDays:    number
  numberingScheme:       'date' | 'date-seq' | 'counter' | 'ask-each'
  customPrefix:          string | null
  lastCounter:           number
  autoSendEnabled:       boolean
  autoSignEnabled:       boolean
  confirmationThreshold: string | number | null
  successCount:          number
  lastUsedAt:            string | null
}

function Toggle({ checked, onChange, disabled }: {
  checked: boolean; onChange: (v: boolean) => void; disabled?: boolean
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'w-10 h-5 rounded-full transition-colors relative shrink-0',
        disabled && 'opacity-40 cursor-not-allowed',
        checked ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]',
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
        checked ? 'left-5' : 'left-0.5',
      )} />
    </button>
  )
}

export default function MiraSettingsPage() {
  const t  = useTranslations('mira')
  const tc = useTranslations('contracts')
  const { currentOrg } = useAuth()
  const qc = useQueryClient()

  const [form, setForm] = useState<Partial<MiraSettings>>({})

  const { data, isLoading } = useQuery<MiraSettings>({
    queryKey: ['mira-settings', currentOrg?.id],
    queryFn:  async () => {
      const { data } = await api.get('/mira/settings')
      return data
    },
    enabled:  !!currentOrg?.id,
  })

  const { data: recentContracts = [] } = useQuery<any[]>({
    queryKey: ['mira-recent-contracts', currentOrg?.id],
    queryFn:  async () => {
      const { data } = await api.get('/mira/recent-contracts')
      return data
    },
    enabled: !!currentOrg?.id,
  })

  useEffect(() => {
    if (data) setForm({
      defaultContractType:   data.defaultContractType,
      defaultAmount:         Number(data.defaultAmount) || 0,
      defaultCity:           data.defaultCity || 'Toshkent',
      defaultProductName:    data.defaultProductName || '',
      defaultPaymentDays:    data.defaultPaymentDays || 10,
      numberingScheme:       data.numberingScheme,
      customPrefix:          data.customPrefix || '',
      autoSendEnabled:       data.autoSendEnabled,
      autoSignEnabled:       data.autoSignEnabled,
      confirmationThreshold: data.confirmationThreshold ? Number(data.confirmationThreshold) : null,
    })
  }, [data])

  const saveMut = useMutation({
    mutationFn: async () => {
      const { data } = await api.patch('/mira/settings', form)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mira-settings'] })
      toast.success(t('saved'))
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || t('saveError'))
    },
  })

  const update = <K extends keyof MiraSettings>(key: K, value: any) =>
    setForm(s => ({ ...s, [key]: value }))

  const successCount = data?.successCount || 0
  const trustUnlocked = successCount >= TRUST_THRESHOLD

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 size={20} className="animate-spin text-[#2563EB]" />
      </div>
    )
  }

  const contractTypeOptions = [
    'OLDI_SOTDI', 'XIZMAT', 'IJARA', 'PUDRAT', 'QOSHIMCHA', 'MOLIYAVIY',
    'DAVAL', 'XALQARO', 'AGENTLIK', 'TRANSPORT', 'LIZING', 'BOSHQA',
  ].map(v => ({ value: v, label: tc(`types.${v}` as any) }))

  return (
    <div className="max-w-2xl space-y-5">
      {/* Sarlavha */}
      <div>
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <h2 className="font-display text-xl font-black text-[#0F172A]">{t('title')}</h2>
        </div>
        <p className="text-sm text-[#475569] leading-relaxed">{t('description')}</p>
      </div>

      {/* Standart qiymatlar */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-[#2563EB]" />
          <h3 className="font-bold text-[#0F172A] text-sm">{t('defaultsTitle')}</h3>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">{t('defaultsDesc')}</p>

        <div className="space-y-4">
          <Select
            label={t('contractType')}
            value={form.defaultContractType || 'OLDI_SOTDI'}
            onChange={e => update('defaultContractType', e.target.value)}
            options={contractTypeOptions}
          />

          <Input
            type="number"
            label={t('amount')}
            value={form.defaultAmount as number || 0}
            onChange={e => update('defaultAmount', Number(e.target.value) || 0)}
            hint={t('amountHint')}
            placeholder="500000000"
          />

          <Input
            label={t('city')}
            value={form.defaultCity || ''}
            onChange={e => update('defaultCity', e.target.value)}
            placeholder="Toshkent"
          />

          <Input
            label={t('productName')}
            value={form.defaultProductName || ''}
            onChange={e => update('defaultProductName', e.target.value)}
            hint={t('productNameHint')}
          />

          <Input
            type="number"
            label={t('paymentDays')}
            value={form.defaultPaymentDays || 10}
            onChange={e => update('defaultPaymentDays', Number(e.target.value) || 10)}
            min={1}
            max={365}
          />
        </div>
      </Card>

      {/* Raqamlash sxemasi */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Hash size={16} className="text-[#2563EB]" />
          <h3 className="font-bold text-[#0F172A] text-sm">{t('numberingTitle')}</h3>
        </div>
        <p className="text-xs text-[#94A3B8] mb-4">{t('numberingDesc')}</p>

        <div className="space-y-2">
          {[
            { value: 'date',     label: t('schemeDate'),     desc: t('schemeDateDesc') },
            { value: 'date-seq', label: t('schemeDateSeq'),  desc: t('schemeDateSeqDesc') },
            { value: 'counter',  label: t('schemeCounter'),  desc: t('schemeCounterDesc') },
            { value: 'ask-each', label: t('schemeAskEach'),  desc: t('schemeAskEachDesc') },
          ].map(opt => (
            <label
              key={opt.value}
              className={cn(
                'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all',
                form.numberingScheme === opt.value
                  ? 'border-[#2563EB] bg-[#EFF6FF]'
                  : 'border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC]'
              )}
            >
              <input
                type="radio"
                name="numberingScheme"
                value={opt.value}
                checked={form.numberingScheme === opt.value}
                onChange={() => update('numberingScheme', opt.value)}
                className="mt-1 accent-[#2563EB]"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-[#0F172A]">{opt.label}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{opt.desc}</p>
              </div>
            </label>
          ))}
        </div>

        {form.numberingScheme === 'counter' && (
          <div className="mt-4">
            <Input
              label={t('customPrefix')}
              value={form.customPrefix || ''}
              onChange={e => update('customPrefix', e.target.value.toUpperCase())}
              placeholder="DV"
              hint={t('customPrefixHint')}
              maxLength={20}
            />
          </div>
        )}
      </Card>

      {/* Avtomatik yuborish (trust-gated) */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield size={16} className="text-[#2563EB]" />
          <h3 className="font-bold text-[#0F172A] text-sm">{t('trustTitle')}</h3>
        </div>

        {!trustUnlocked && (
          <div className="mb-4 p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg flex items-start gap-2">
            <Lock size={14} className="text-[#A16207] shrink-0 mt-0.5" />
            <p className="text-xs text-[#854D0E]">
              {t('trustLockMsg', { current: successCount, needed: TRUST_THRESHOLD })}
            </p>
          </div>
        )}

        {trustUnlocked && (
          <div className="mb-4 p-3 bg-[#DCFCE7] border border-[#BBF7D0] rounded-lg flex items-start gap-2">
            <Sparkles size={14} className="text-[#16A34A] shrink-0 mt-0.5" />
            <p className="text-xs text-[#14532D]">{t('trustReady')}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#0F172A]">{t('autoSendLabel')}</p>
              <p className="text-xs text-[#94A3B8]">{t('autoSendDesc')}</p>
            </div>
            <Toggle
              checked={!!form.autoSendEnabled}
              onChange={v => update('autoSendEnabled', v)}
              disabled={!trustUnlocked}
            />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#0F172A]">{t('autoSignLabel')}</p>
              <p className="text-xs text-[#94A3B8]">{t('autoSignDesc')}</p>
            </div>
            <Toggle
              checked={!!form.autoSignEnabled}
              onChange={v => update('autoSignEnabled', v)}
            />
          </div>

          <Input
            type="number"
            label={t('thresholdLabel')}
            value={form.confirmationThreshold as number || ''}
            onChange={e => {
              const n = Number(e.target.value)
              update('confirmationThreshold', e.target.value === '' ? null : (Number.isNaN(n) ? null : n))
            }}
            hint={t('thresholdHint')}
            placeholder="100000000"
          />
        </div>

        <div className="mt-4 p-3 bg-[#F0F9FF] border border-[#BFDBFE] rounded-lg">
          <p className="text-xs text-[#1E40AF] leading-relaxed">{t('securityNotice')}</p>
        </div>
      </Card>

      {/* Statistika */}
      {successCount > 0 && (
        <Card>
          <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
            {t('successCountTitle')}
          </p>
          <p className="text-sm text-[#0F172A]">
            {t('successCountText', { count: successCount })}
          </p>
          <p className="text-xs text-[#94A3B8] mt-1">
            {data?.lastUsedAt
              ? t('lastUsed', { date: formatDate(data.lastUsedAt, 'long') })
              : t('neverUsed')}
          </p>
        </Card>
      )}

      {/* Mira tarixi — createdByMira shartnomalar */}
      {(successCount > 0 || recentContracts.length > 0) && (
        <Card padding="none" className="overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={14} className="text-[#7C3AED]" />
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider">
                {t('recentTitle')}
              </p>
            </div>
            <Link
              href="/dashboard/shartnomalar"
              className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
            >
              {t('recentAll')} <ArrowRight size={11} />
            </Link>
          </div>
          {recentContracts.length === 0 ? (
            <div className="px-5 py-6 text-center">
              <FileText size={24} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-sm text-[#94A3B8]">{t('recentEmpty')}</p>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recentContracts.map((c: any) => (
                <Link
                  key={c.id}
                  href={`/dashboard/shartnomalar/${c.id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-[#F8FAFC] transition group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-[#7C3AED]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {c.contractNumber}
                    </p>
                    <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                      {c.counterparty?.name || '—'} · {formatDate(c.createdAt, 'short')}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {Number(c.amount) > 0 ? formatCurrency(c.amount) : '—'}
                    </p>
                    <span className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                      c.status === 'ACTIVE'    ? 'bg-[#DBEAFE] text-[#1D4ED8]' :
                      c.status === 'COMPLETED' ? 'bg-[#DCFCE7] text-[#16A34A]' :
                      c.status === 'CANCELLED' ? 'bg-[#FEE2E2] text-[#DC2626]' :
                                                  'bg-[#F1F5F9] text-[#475569]'
                    )}>
                      {c.status}
                    </span>
                  </div>
                  <ArrowRight size={13} className="text-[#CBD5E1] group-hover:text-[#7C3AED] shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Mini test chat */}
      <Card>
        <MiraTestChat />
      </Card>

      <Button
        leftIcon={<Save size={14} />}
        onClick={() => saveMut.mutate()}
        loading={saveMut.isPending}
      >
        {t('save')}
      </Button>
    </div>
  )
}
