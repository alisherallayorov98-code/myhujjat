'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations }    from 'next-intl'
import { useRouter }          from 'next/navigation'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader }         from '@/components/layout/PageHeader'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import { Card }               from '@/components/ui/Card'
import { useAuth }            from '@/hooks/useAuth'
import api                    from '@/lib/api'
import {
  CONTRACT_TYPE_CONFIG,
  CONTRACT_TEMPLATES,
  CONTRACT_EXTRA_FIELDS,
  fillTemplate,
  type ContractType,
} from '@/lib/contractTemplates'
import { formatAmountWords }  from '@/lib/formatters'
import { renderContractHtml } from '@/lib/export/contractHtml'
import { type SpecItem }      from '@/lib/qqs'
import { cn }                 from '@/lib/cn'
import toast                  from 'react-hot-toast'
import type { Organization, Counterparty } from '@/lib/types'

import { StepBar }     from './_components/StepBar'
import { CpDropdown }  from './_components/CpDropdown'
import { SpecTable }   from './_components/SpecTable'

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export default function YangiShartnoma() {
  const t = useTranslations('contracts')
  const router         = useRouter()
  const qc             = useQueryClient()
  const { currentOrg } = useAuth()

  const [step,    setStep]    = useState<1 | 2 | 3>(1)
  const [type,    setType]    = useState<ContractType>('OLDI_SOTDI')
  const [preview, setPreview] = useState(false)
  const [orgEdits, setOrgEdits] = useState<Record<string, string>>({})

  const [form, setForm] = useState({
    contractNumber: '',
    contractDate:   today(),
    city:           'Toshkent',
    counterpartyId: '',
    amount:         '',
    extraData:      {} as Record<string, string>,
    specItems:      [] as SpecItem[],
    qqsEnabled:     false,
    qqsRate:        12,
    productName:    '',
  })

  const PARTY_FIELDS: [string, string][] = [
    [t('partyFields.stir'),         'inn'],
    [t('partyFields.name'),         'name'],
    [t('partyFields.director'),     'directorName'],
    [t('partyFields.bank'),         'bankName'],
    [t('partyFields.bankAccount'),  'bankAccount'],
    [t('partyFields.mfo'),          'mfo'],
    [t('partyFields.address'),      'address'],
    [t('partyFields.phone'),        'phone'],
  ]

  const { data: cps = [], refetch: refetchCps } = useQuery<Counterparty[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/counterparties?orgId=${currentOrg.id}`)
      return data as Counterparty[]
    },
    enabled: !!currentOrg?.id,
  })

  useEffect(() => {
    if (!currentOrg) return
    const isQqs = !!(currentOrg.qqsReg?.trim())
    const rate  = currentOrg.qqsStavka ? parseInt(currentOrg.qqsStavka) : 12
    setForm(f => ({ ...f, qqsEnabled: isQqs, qqsRate: isNaN(rate) ? 12 : rate }))
    setOrgEdits({})
  }, [currentOrg?.id])

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/contracts', data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      toast.success(t('toast.created'))
      router.push(`/dashboard/shartnomalar/${res.data.id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  const upd = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }))
  const updExtra = (key: string, val: string) => setForm(f => ({ ...f, extraData: { ...f.extraData, [key]: val } }))

  const specTotal = form.specItems.reduce((s, i) => s + i.summa, 0)
  const mergedOrg: Organization & Record<string, string> | null = currentOrg
    ? { ...currentOrg, ...orgEdits } as any
    : null
  const selectedCp = (cps as Counterparty[]).find(c => c.id === form.counterpartyId)

  const buildPreview = useCallback((): string => {
    const org = mergedOrg
    const cp  = selectedCp
    const amount = specTotal > 0 ? specTotal : parseFloat(form.amount) || 0
    const template = CONTRACT_TEMPLATES[type]
    if (!template) return ''
    return fillTemplate(template, {
      orgNomi:   org?.name          || '___________',
      orgInn:    org?.inn           || '___________',
      orgRahbar: org?.directorName  || '___________',
      orgBank:   (orgEdits.bankName    || org?.bankName)    || '___________',
      orgHisob:  (orgEdits.bankAccount || org?.bankAccount) || '___________',
      orgMfo:    (orgEdits.mfo         || org?.mfo)         || '___________',
      orgManzil: (orgEdits.address     || org?.address)     || '___________',
      cpNomi:    cp?.name           || '___________',
      cpInn:     cp?.inn            || '___________',
      cpRahbar:  cp?.directorName   || '___________',
      cpBank:    cp?.bankName       || '___________',
      cpHisob:   cp?.bankAccount    || '___________',
      cpMfo:     cp?.mfo            || '___________',
      cpManzil:  cp?.address        || '___________',
      raqam:     form.contractNumber || `${new Date().getFullYear()}/001`,
      sana:      form.contractDate ? form.contractDate.split('-').reverse().join('.') : today().split('-').reverse().join('.'),
      shahar:    form.city || 'Toshkent',
      summa:     amount > 0 ? amount.toLocaleString('uz-UZ') : '0',
      summaMatn: amount > 0 ? formatAmountWords(amount) : '___________',
      extra:     form.extraData,
    })
  }, [mergedOrg, selectedCp, form, type, specTotal, orgEdits])

  const buildContractObj = useCallback(() => ({
    contractType:   type,
    contractNumber: form.contractNumber || `${new Date().getFullYear()}/001`,
    contractDate:   form.contractDate || today(),
    city:           form.city || 'Toshkent',
    content:        buildPreview(),
    organization: mergedOrg ? {
      name:         mergedOrg.name,
      inn:          mergedOrg.inn,
      directorName: mergedOrg.directorName,
      bankName:     orgEdits.bankName    || mergedOrg.bankName,
      bankAccount:  orgEdits.bankAccount || mergedOrg.bankAccount,
      mfo:          orgEdits.mfo         || mergedOrg.mfo,
      address:      orgEdits.address     || mergedOrg.address,
    } : null,
    counterparty: selectedCp ? {
      name:         selectedCp.name,
      inn:          selectedCp.inn,
      directorName: selectedCp.directorName,
      bankName:     selectedCp.bankName,
      bankAccount:  selectedCp.bankAccount,
      mfo:          selectedCp.mfo,
      address:      selectedCp.address,
    } : null,
  }), [type, form, mergedOrg, selectedCp, orgEdits, buildPreview])

  function handleCreate() {
    if (!currentOrg?.id) return
    if (!form.contractDate) { toast.error(t('toast.dateRequired')); return }
    const amount = specTotal > 0 ? specTotal : parseFloat(form.amount) || 0
    mutation.mutate({
      organizationId: currentOrg.id,
      counterpartyId: form.counterpartyId || undefined,
      contractType:   type,
      contractNumber: form.contractNumber || undefined,
      contractDate:   form.contractDate,
      city:           form.city,
      amount,
      extraData:      form.extraData,
      productName:    form.productName || undefined,
      specItems:      form.specItems.length > 0 ? form.specItems : undefined,
      qqsEnabled:     form.qqsEnabled,
      qqsRate:        form.qqsRate,
      content:        buildPreview(),
    })
  }

  const typeCfg     = CONTRACT_TYPE_CONFIG[type]
  const extraFields = CONTRACT_EXTRA_FIELDS[type] || []

  if (step === 1) {
    return (
      <div>
        <PageHeader
          title={t('new_.title')}
          description={t('new_.selectType')}
          breadcrumbs={[
            { label: 'Dashboard',   path: '/dashboard' },
            { label: t('title'),    path: '/dashboard/shartnomalar' },
            { label: t('new_.title') },
          ]}
          actions={
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => router.back()}>
              {t('new_.back')}
            </Button>
          }
        />
        <StepBar step={1} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => { setType(key as ContractType); setStep(2) }}
              className={cn(
                'p-4 rounded-xl bg-white border-2 text-left transition-all duration-200',
                type === key
                  ? 'border-[#2563EB] shadow-md shadow-[#2563EB]/10'
                  : 'border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md'
              )}
            >
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3', cfg.bg)}>
                {cfg.icon}
              </div>
              <p className="font-bold text-[#0F172A] text-sm">{t(`types.${key}` as any)}</p>
              <p className="text-xs text-[#94A3B8] mt-1">
                {cfg.parties.buyer} → {cfg.parties.seller}
              </p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div>
        <PageHeader
          title={`${typeCfg.icon} ${t(`types.${type}` as any)}`}
          description={t('new_.partiesAndInfo')}
          breadcrumbs={[
            { label: 'Dashboard',   path: '/dashboard' },
            { label: t('title'),    path: '/dashboard/shartnomalar' },
            { label: t('new_.title') },
          ]}
          actions={
            <div className="flex gap-2">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                {t('new_.back')}
              </Button>
              <Button size="sm" onClick={() => setStep(3)}>
                {t('new_.next')}
              </Button>
            </div>
          }
        />
        <StepBar step={2} />

        <Card className="mb-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Input label={t('new_.form.contractNumberLabel')} placeholder={`${new Date().getFullYear()}/001`}
              value={form.contractNumber} onChange={e => upd('contractNumber', e.target.value)}
              hint={t('new_.form.autoHint')} />
            <Input label={t('new_.form.dateLabel')} type="date"
              value={form.contractDate} onChange={e => upd('contractDate', e.target.value)} />
            <Input label={t('new_.form.cityLabel')} placeholder={t('new_.form.cityPlaceholder')}
              value={form.city} onChange={e => upd('city', e.target.value)} />
            <div>
              <Input label={t('new_.form.amountLabel')} placeholder={t('new_.form.amountPlaceholder')} type="number"
                value={form.amount} onChange={e => upd('amount', e.target.value)} />
              {form.amount && parseFloat(form.amount) > 0 && (
                <p className="text-xs text-[#94A3B8] mt-1 truncate">{formatAmountWords(parseFloat(form.amount))}</p>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card padding="none">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('new_.yourOrg')}</p>
              <p className="font-semibold text-[#0F172A] text-sm mt-0.5">{typeCfg.parties.seller}</p>
            </div>
            {mergedOrg ? (
              <div className="divide-y divide-[#F1F5F9] px-4">
                {PARTY_FIELDS.map(([label, field]) => (
                  <div key={field} className="flex items-center gap-3 py-2">
                    <span className="text-[11px] text-[#94A3B8] w-24 shrink-0">{label}</span>
                    <input
                      value={orgEdits[field] ?? ((mergedOrg as any)[field] ?? '')}
                      onChange={e => setOrgEdits(p => ({ ...p, [field]: e.target.value }))}
                      placeholder="—"
                      className="text-xs text-[#0F172A] flex-1 bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none px-0.5 transition min-w-0"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[#94A3B8]">{t('new_.noOrgSelected')}</div>
            )}
          </Card>

          <Card padding="none">
            <div className="px-4 py-3 border-b border-[#E2E8F0]">
              <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('new_.counterparty')}</p>
                <p className="font-semibold text-[#0F172A] text-sm mt-0.5">{typeCfg.parties.buyer}</p>
              </div>
              <CpDropdown
                cps={cps as Counterparty[]}
                value={form.counterpartyId}
                onChange={(id) => upd('counterpartyId', id)}
                orgId={currentOrg?.id || ''}
                onCpCreated={() => refetchCps()}
              />
            </div>
            {selectedCp ? (
              <div className="divide-y divide-[#F1F5F9] px-4">
                {PARTY_FIELDS.map(([label, field]) => (
                  <div key={field} className="flex items-center gap-3 py-2">
                    <span className="text-[11px] text-[#94A3B8] w-24 shrink-0">{label}</span>
                    <span className="text-xs text-[#0F172A] flex-1 truncate">
                      {(selectedCp as any)[field] || '—'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-sm text-[#94A3B8]">
                {t('new_.noCpSelected')}
              </div>
            )}
          </Card>
        </div>

        {extraFields.length > 0 && (
          <Card>
            <h3 className="font-bold text-[#0F172A] mb-4">{t('new_.extraInfoTitle', { type: t(`types.${type}` as any) })}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {extraFields.map(field => (
                <Input
                  key={field.key}
                  label={field.label + (field.required ? ' *' : '')}
                  placeholder={field.placeholder}
                  value={form.extraData[field.key] || ''}
                  onChange={e => updExtra(field.key, e.target.value)}
                  required={field.required}
                />
              ))}
            </div>
          </Card>
        )}
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={`${typeCfg.icon} ${t(`types.${type}` as any)} — ${t('new_.specifications')}`}
        description={t('new_.specDesc')}
        breadcrumbs={[
          { label: 'Dashboard',   path: '/dashboard' },
          { label: t('title'),    path: '/dashboard/shartnomalar' },
          { label: t('new_.title') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(2)}>
              {t('new_.back')}
            </Button>
            <Button variant="outline" size="sm"
              leftIcon={preview ? <EyeOff size={14} /> : <Eye size={14} />}
              onClick={() => setPreview(v => !v)}>
              {preview ? t('new_.hidePreview') : t('new_.showPreview')}
            </Button>
            <Button size="sm" loading={mutation.isPending} onClick={handleCreate}>
              {t('new_.create')}
            </Button>
          </div>
        }
      />
      <StepBar step={3} />

      <div className={cn('grid gap-6', preview ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1')}>
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F172A]">{t('new_.specTitle')}</h3>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-sm text-[#475569] cursor-pointer select-none">
                  <input type="checkbox" checked={form.qqsEnabled}
                    onChange={e => setForm(f => ({ ...f, qqsEnabled: e.target.checked }))}
                    className="rounded" />
                  QQS
                </label>
                {form.qqsEnabled && (
                  <select value={form.qqsRate}
                    onChange={e => setForm(f => ({ ...f, qqsRate: parseInt(e.target.value) }))}
                    className="text-sm border border-[#E2E8F0] rounded-lg px-2 py-1 focus:outline-none focus:border-[#2563EB]">
                    <option value={0}>0%</option>
                    <option value={12}>12%</option>
                    <option value={15}>15%</option>
                  </select>
                )}
              </div>
            </div>
            <SpecTable
              items={form.specItems}
              onChange={items => setForm(f => ({
                ...f,
                specItems: items,
                amount: items.length > 0 ? String(items.reduce((s, i) => s + i.summa, 0)) : f.amount,
              }))}
            />
          </Card>

          <Card>
            <h3 className="font-bold text-[#0F172A] mb-4">{t('new_.contractAmount')}</h3>
            <div className="space-y-3">
              {form.specItems.length > 0 ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[#475569]">
                    <span>{t('new_.totalNoQqs')}</span>
                    <span className="font-medium">{form.specItems.reduce((s, i) => s + i.miqdori * i.narxi, 0).toLocaleString('uz-UZ')} so'm</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>{t('new_.qqs')}</span>
                    <span className="font-medium">{form.specItems.reduce((s, i) => s + i.qqsSumma, 0).toLocaleString('uz-UZ')} so'm</span>
                  </div>
                  <div className="flex justify-between text-[#0F172A] font-bold text-base border-t border-[#E2E8F0] pt-2 mt-2">
                    <span>{t('new_.total')}</span>
                    <span>{specTotal.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                  {specTotal > 0 && (
                    <p className="text-xs text-[#94A3B8] italic">{formatAmountWords(specTotal)}</p>
                  )}
                </div>
              ) : (
                <Input label={t('new_.form.contractAmountLabel')} placeholder={t('new_.form.amountPlaceholder')} type="number"
                  value={form.amount} onChange={e => upd('amount', e.target.value)}
                  hint={form.amount && parseFloat(form.amount) > 0 ? formatAmountWords(parseFloat(form.amount)) : ''} />
              )}
            </div>
          </Card>
        </div>

        {preview && (
          <Card padding="none" className="overflow-hidden">
            <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-sm font-semibold text-[#0F172A]">{t('new_.previewTitle')}</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('new_.previewDesc')}</p>
            </div>
            <div className="max-h-[700px] overflow-y-auto bg-[#F1F5F9] p-4">
              <div
                className="bg-white shadow-md mx-auto"
                style={{ maxWidth: 794, transform: 'scale(0.85)', transformOrigin: 'top center' }}
                dangerouslySetInnerHTML={{ __html: renderContractHtml(buildContractObj()) }}
              />
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
