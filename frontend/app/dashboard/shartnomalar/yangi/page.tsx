'use client'

import { useState, useEffect, useCallback, useDeferredValue, useMemo } from 'react'
import { useTranslations }    from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Eye, EyeOff, Plus, Trash2, Printer } from 'lucide-react'
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
import { formatAmountWords, formatCurrency, formatNumber } from '@/lib/formatters'
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

/**
 * Foydalanuvchi qo'shgan sarlavha+matn bandlarni shartnoma matniga
 * REKVIZITLAR bo'limidan oldin joylaydi. Agar REKVIZITLAR yo'q bo'lsa,
 * matn oxiriga qo'shiladi.
 */
function injectCustomSections(
  text:     string,
  sections: { title: string; body: string }[],
): string {
  const valid = sections.filter(s => s.title.trim() || s.body.trim())
  if (valid.length === 0) return text

  const block = valid
    .map(s => `\n\n${s.title.trim().toUpperCase()}\n\n${s.body.trim()}\n`)
    .join('')

  const rekvIdx = text.search(/\n\s*\d+\.\s*TOMONLARNING\s+REKVIZITLARI/i)
  if (rekvIdx > -1) {
    return text.slice(0, rekvIdx) + block + text.slice(rekvIdx)
  }
  return text + block
}

export default function YangiShartnoma() {
  const t = useTranslations('contracts')
  const router         = useRouter()
  const searchParams   = useSearchParams()
  const cloneFromId    = searchParams.get('cloneFrom')
  const qc             = useQueryClient()
  const { currentOrg } = useAuth()

  // Tashkilot yo'q bo'lsa, avval qo'shishni so'rab dashboard'ga qaytaramiz.
  useEffect(() => {
    if (currentOrg === null) {
      toast.error(t('toast.orgRequired'))
      router.replace('/dashboard/tashkilotlar?required=1')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrg])

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
    customSections: [] as { title: string; body: string }[],
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
      const { data } = await api.get(`/counterparties?orgId=${currentOrg.id}&limit=100`)
      return (data.data || []) as Counterparty[]
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

  // ─── Nusxa olish — manba shartnomadan ma'lumotlarni o'tkazib olish
  const [cloneSourceNumber, setCloneSourceNumber] = useState<string | null>(null)
  const { data: cloneSource } = useQuery<any>({
    queryKey: ['contract-clone-source', cloneFromId],
    queryFn:  () => api.get(`/contracts/${cloneFromId}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!cloneFromId && !!currentOrg?.id,
  })

  useEffect(() => {
    if (!cloneSource) return
    setType(cloneSource.contractType)
    setForm(f => ({
      ...f,
      // KEEP — shu narsalar nusxalandi:
      city:         cloneSource.city || f.city,
      extraData:    cloneSource.extraData || {},
      specItems:    (cloneSource.specifications?.[0]?.items || []) as SpecItem[],
      qqsEnabled:   cloneSource.qqsEnabled ?? f.qqsEnabled,
      qqsRate:      cloneSource.qqsRate    ?? f.qqsRate,
      productName:  cloneSource.productName || '',
      customSections: (cloneSource.customSections || []) as { title: string; body: string }[],
      // RESET — yangi shartnoma uchun bo'sh:
      contractNumber: '',
      contractDate:   today(),
      counterpartyId: '',
      amount:         '',
    }))
    setCloneSourceNumber(cloneSource.contractNumber || cloneSource.id?.slice(0, 8))
    setStep(2) // 1-bosqichni o'tkazib yuboramiz
  }, [cloneSource])

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
    const filled = fillTemplate(template, {
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
      summa:     amount > 0 ? formatNumber(amount) : '0',
      summaMatn: amount > 0 ? formatAmountWords(amount) : '___________',
      extra:     form.extraData,
    })
    return injectCustomSections(filled, form.customSections)
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

  // ─── Preview HTML — kechiktirib hisoblanadi (raqsga tushish muammosini bartaraf etadi)
  // useDeferredValue: keystroke vaqtida ko'rib chiqish bloklanmaydi, React fonda yangilaydi
  // useMemo:         HTML faqat input to'xtaganda qayta yaratiladi
  const deferredForm     = useDeferredValue(form)
  const deferredOrgEdits = useDeferredValue(orgEdits)
  const deferredType     = useDeferredValue(type)
  const previewHtml = useMemo(() => {
    if (!preview) return ''
    return renderContractHtml(buildContractObj())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, deferredForm, deferredOrgEdits, deferredType, currentOrg?.id, selectedCp?.id])

  function handleCreate() {
    if (!currentOrg?.id) return
    if (!form.counterpartyId) { toast.error(t('toast.cpRequired')); return }
    if (!form.contractDate)   { toast.error(t('toast.dateRequired')); return }
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
      customSections: form.customSections.filter(s => s.title.trim() || s.body.trim()),
      content:        buildPreview(),
    })
  }

  // ─── Custom sections helpers ──────────────────────────────
  function addSection() {
    setForm(f => ({
      ...f,
      customSections: [...f.customSections, { title: '', body: '' }],
    }))
  }
  function updateSection(i: number, key: 'title' | 'body', val: string) {
    setForm(f => ({
      ...f,
      customSections: f.customSections.map((s, idx) => idx === i ? { ...s, [key]: val } : s),
    }))
  }
  function removeSection(i: number) {
    setForm(f => ({
      ...f,
      customSections: f.customSections.filter((_, idx) => idx !== i),
    }))
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

        {cloneSourceNumber && (
          <div className="mb-4 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-lg flex items-start gap-2">
            <span className="text-[#2563EB] text-base">📋</span>
            <p className="text-sm text-[#1E40AF]">
              {t('clone.banner', { number: cloneSourceNumber })}
            </p>
          </div>
        )}

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

      <div className="grid gap-6 grid-cols-1">
        <div className="space-y-5">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#0F172A]">{t('new_.specTitle')}</h3>
              <div className="flex items-center gap-3">
                <label
                  className={cn(
                    'flex items-center gap-1.5 text-sm select-none',
                    currentOrg?.qqsReg ? 'text-[#475569] cursor-pointer' : 'text-[#94A3B8] cursor-not-allowed'
                  )}
                  title={!currentOrg?.qqsReg ? t('new_.qqsNotRegistered') : undefined}
                >
                  <input type="checkbox" checked={form.qqsEnabled}
                    disabled={!currentOrg?.qqsReg}
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
                    <span className="font-medium">{formatCurrency(form.specItems.reduce((s, i) => s + i.miqdori * i.narxi, 0))}</span>
                  </div>
                  <div className="flex justify-between text-[#475569]">
                    <span>{t('new_.qqs')}</span>
                    <span className="font-medium">{formatCurrency(form.specItems.reduce((s, i) => s + i.qqsSumma, 0))}</span>
                  </div>
                  <div className="flex justify-between text-[#0F172A] font-bold text-base border-t border-[#E2E8F0] pt-2 mt-2">
                    <span>{t('new_.total')}</span>
                    <span>{formatCurrency(specTotal)}</span>
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

          {/* Qo'shimcha bandlar (Tarkibi builder) */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-[#0F172A]">{t('sections.title')}</h3>
                <p className="text-xs text-[#94A3B8] mt-0.5">{t('sections.desc')}</p>
              </div>
              <Button size="sm" variant="outline" leftIcon={<Plus size={13} />} onClick={addSection}>
                {t('sections.add')}
              </Button>
            </div>

            {form.customSections.length === 0 ? (
              <p className="text-sm text-[#94A3B8] text-center py-4 italic">
                {t('sections.empty')}
              </p>
            ) : (
              <div className="space-y-3">
                {form.customSections.map((sec, i) => (
                  <div key={i} className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#94A3B8]">{i + 1}.</span>
                      <input
                        value={sec.title}
                        onChange={e => updateSection(i, 'title', e.target.value)}
                        placeholder={t('sections.titlePlace')}
                        className="flex-1 bg-white border border-[#E2E8F0] rounded-md px-2.5 py-1.5 text-sm font-semibold focus:outline-none focus:border-[#2563EB]"
                      />
                      <button
                        onClick={() => removeSection(i)}
                        className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition"
                        title={t('sections.remove')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={sec.body}
                      onChange={e => updateSection(i, 'body', e.target.value)}
                      placeholder={t('sections.bodyPlace')}
                      rows={3}
                      className="w-full bg-white border border-[#E2E8F0] rounded-md px-2.5 py-2 text-sm leading-relaxed focus:outline-none focus:border-[#2563EB] resize-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

      </div>

      {preview && (
        <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col print-fullscreen">
          <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0 preview-toolbar no-print">
            <button
              onClick={() => setPreview(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t('new_.back')}</span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <div>
              <p className="text-sm font-semibold">{t('new_.previewTitle')}</p>
              <p className="text-[11px] text-white/50 leading-none mt-0.5 hidden sm:block">{t('new_.previewDesc')}</p>
            </div>
            <div className="flex-1" />
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">{t('new_.print')}</span>
            </button>
            <Button size="sm" loading={mutation.isPending} onClick={handleCreate}>
              {t('new_.create')}
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
              <div
                className="bg-white shadow-2xl print-document"
                style={{ width: '794px', minHeight: '1123px' }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
