'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useTranslations }       from 'next-intl'
import { useRouter }             from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, Download, Calculator, FileType2 } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Button }       from '@/components/ui/Button'
import { Input }        from '@/components/ui/Input'
import { Card }         from '@/components/ui/Card'
import { useAuth }      from '@/hooks/useAuth'
import api              from '@/lib/api'
import {
  calcSpecItem, calcSpecTotals,
  newSpecItem, BIRLIKLAR, QQS_OPTIONS,
  type SpecItem, type QqsFoiz,
} from '@/lib/qqs'
import { formatAmountWords, formatNumber } from '@/lib/formatters'
import { exportSpecExcel }   from '@/lib/export/specExport'
import { exportSpecDocx }    from '@/lib/export/specDocx'
import { CpDropdown }   from '../../shartnomalar/yangi/_components/CpDropdown'
import toast            from 'react-hot-toast'
import type { Counterparty } from '@/lib/types'

export default function YangiSpesifikatsiya() {
  const t = useTranslations('specifications')
  const router         = useRouter()
  const qc             = useQueryClient()
  const { currentOrg } = useAuth()

  const [items,          setItems]          = useState<SpecItem[]>([newSpecItem()])
  const [notes,          setNotes]          = useState('')
  const [contractId,     setContractId]     = useState('')
  const [counterpartyId, setCounterpartyId] = useState('')
  const [specNumber,     setSpecNumber]     = useState('')
  const [itemsError,     setItemsError]     = useState('')

  // Shartnomalar ro'yxati (biriktirish uchun)
  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-list', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/contracts?orgId=${currentOrg.id}&limit=50`)
      return data.data || []
    },
    enabled: !!currentOrg?.id,
  })

  // Kontragentlar ro'yxati (rekvizit uchun)
  const { data: cps = [], refetch: refetchCps } = useQuery<Counterparty[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/counterparties?orgId=${currentOrg.id}&limit=200`)
      return data.data || []
    },
    enabled: !!currentOrg?.id,
  })

  // Shartnoma tanlanganda kontragent avtomatik to'ldiriladi
  useEffect(() => {
    if (!contractId) return
    const c = (contracts as any[]).find((x: any) => x.id === contractId)
    if (c?.counterpartyId) setCounterpartyId(c.counterpartyId)
  }, [contractId, contracts])

  // Kontragent o'zgartirilganda — agar tanlangan shartnoma boshqa kontragentniki
  // bo'lsa, shartnomani tozalaymiz (mantiqsiz aloqani oldini olish)
  useEffect(() => {
    if (!contractId || !counterpartyId) return
    const c = (contracts as any[]).find((x: any) => x.id === contractId)
    if (c && c.counterpartyId && c.counterpartyId !== counterpartyId) {
      setContractId('')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [counterpartyId])

  const selectedCp = cps.find(c => c.id === counterpartyId)

  // Sahifadan chiqishda saqlashni eslatish (faqat ma'lumot kiritilgan bo'lsa)
  const isDirty = items.some(i => i.nomi || i.miqdori > 0 || i.narxi > 0) || !!notes || !!specNumber
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Shartnomalar dropdown — kontragent tanlangan bo'lsa, faqat unga tegishli
  const filteredContracts = useMemo(() => {
    if (!counterpartyId) return contracts as any[]
    return (contracts as any[]).filter((c: any) => c.counterpartyId === counterpartyId)
  }, [contracts, counterpartyId])

  const addRow    = () => setItems(prev => [...prev, newSpecItem()])
  const removeRow = (i: number) => {
    if (items.length <= 1) return
    setItems(prev => prev.filter((_, idx) => idx !== i))
  }

  const updateItem = useCallback((i: number, field: keyof SpecItem, val: string | number) => {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[i], [field]: val }

      if (['miqdori', 'narxi', 'qqsFoiz'].includes(field as string)) {
        const miqdori = field === 'miqdori' ? Number(val) : item.miqdori
        const narxi   = field === 'narxi'   ? Number(val) : item.narxi
        const foiz    = (field === 'qqsFoiz' ? val : item.qqsFoiz) as QqsFoiz
        const calc    = calcSpecItem(miqdori, narxi, foiz)
        item.qqsSumma = calc.qqsSumma
        item.summa    = calc.summa
      }

      next[i] = item
      if ((field === 'nomi' && String(val).trim()) || (field === 'miqdori' && Number(val) > 0) || (field === 'narxi' && Number(val) > 0)) {
        setItemsError('')
      }
      return next
    })
  }, [])

  // "Barchasi uchun QQS" — bir bosish bilan har qatorga tegishli foiz qo'llaniladi
  const setAllQqs = (foiz: QqsFoiz) => {
    setItems(prev => prev.map(item => {
      const calc = calcSpecItem(item.miqdori, item.narxi, foiz)
      return { ...item, qqsFoiz: foiz, qqsSumma: calc.qqsSumma, summa: calc.summa }
    }))
    toast.success(t('toast.qqsApplied', { rate: foiz === 'siz' ? '0%' : foiz + '%' }))
  }

  const totals = calcSpecTotals(items)

  function validateAndSave() {
    const hasValidItem = items.some(it => it.nomi.trim() && it.miqdori > 0 && it.narxi > 0)
    if (!hasValidItem) {
      const msg = "Kamida bitta to'liq qator kerak (nom, miqdor, narx)"
      setItemsError(msg)
      toast.error(msg)
      return
    }
    setItemsError('')
    mutation.mutate()
  }

  const mutation = useMutation({
    mutationFn: () => api.post('/specifications', {
      organizationId: currentOrg!.id,
      contractId:     contractId || undefined,
      counterpartyId: counterpartyId || undefined,
      specNumber:     specNumber || undefined,
      items,
      notes,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['specifications'] })
      toast.success(t('toast.saved'))
      router.push(`/dashboard/spesifikatsiyalar/${res.data.id}`)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  const handleExcel = async () => {
    const contract = (contracts as any[]).find((c: any) => c.id === contractId)
    await exportSpecExcel({
      specNumber:  specNumber || 'YANGI',
      orgName:     currentOrg?.name || '',
      cpName:      selectedCp?.name,
      contractNum: contract?.contractNumber,
      items,
      notes,
    })
  }

  const handleWord = async () => {
    const contract = (contracts as any[]).find((c: any) => c.id === contractId)
    await exportSpecDocx({
      specNumber:   specNumber || 'YANGI',
      city:         currentOrg?.address?.split(',')[0] || 'Toshkent',
      contractNum:  contract?.contractNumber,
      contractDate: contract?.contractDate,
      org:          currentOrg as any,
      cp:           selectedCp as any,
      items,
      notes,
    })
    toast.success(t('toast.wordDownloaded'))
  }

  return (
    <div>
      <PageHeader
        title={t('newTitle')}
        description={t('newDescription')}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: t('title'),      path: '/dashboard/spesifikatsiyalar' },
          { label: t('new') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => router.back()}>
              {t('back')}
            </Button>
            <Button variant="outline" size="sm" leftIcon={<FileType2 size={14} />} onClick={handleWord}>
              Word
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleExcel}>
              Excel
            </Button>
            <Button size="sm" leftIcon={<Save size={14} />} loading={mutation.isPending} onClick={validateAndSave}>
              {t('save')}
            </Button>
          </div>
        }
      />

      {/* 1-blok: Asosiy ma'lumotlar */}
      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={t('specNumberLabel')}
            placeholder={t('specNumberPlace')}
            value={specNumber}
            onChange={e => setSpecNumber(e.target.value)}
            hint={t('specNumberHint')}
          />
          <Input
            label={t('form.notes')}
            placeholder={t('form.notesPlaceholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#374151]">{t('attachToContract')}</label>
            <select
              value={contractId}
              onChange={e => setContractId(e.target.value)}
              className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] disabled:bg-[#F1F5F9] disabled:cursor-not-allowed"
              disabled={!!counterpartyId && filteredContracts.length === 0}
            >
              <option value="">
                {counterpartyId
                  ? (filteredContracts.length === 0
                      ? t('noContractsForCp')
                      : t('selectContract'))
                  : t('selectContract')
                }
              </option>
              {filteredContracts.map((c: any) => (
                <option key={c.id} value={c.id}>
                  № {c.contractNumber} {!counterpartyId && c.counterparty?.name ? `— ${c.counterparty.name}` : ''}
                </option>
              ))}
            </select>
            {counterpartyId && filteredContracts.length > 0 && (
              <p className="text-[11px] text-[#94A3B8]">
                {t('contractsForCp', { count: filteredContracts.length })}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 2-blok: Tashkilot va kontragent rekvizitlari */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <Card padding="none">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('yourOrg')}</p>
          </div>
          {currentOrg ? (
            <div className="divide-y divide-[#F1F5F9] px-4">
              <PartyRow label={t('partyFields.stir')}        value={currentOrg.inn} />
              <PartyRow label={t('partyFields.name')}        value={currentOrg.name} />
              <PartyRow label={t('partyFields.director')}    value={(currentOrg as any).directorName} />
              <PartyRow label={t('partyFields.bank')}        value={(currentOrg as any).bankName} />
              <PartyRow label={t('partyFields.bankAccount')} value={(currentOrg as any).bankAccount} />
              <PartyRow label={t('partyFields.mfo')}         value={(currentOrg as any).mfo} />
              <PartyRow label={t('partyFields.address')}     value={(currentOrg as any).address} />
              <PartyRow label={t('partyFields.phone')}       value={(currentOrg as any).phone} />
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('noOrgSelected')}</div>
          )}
        </Card>

        <Card padding="none">
          <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8] mb-2">{t('counterparty')}</p>
            <CpDropdown
              cps={cps as Counterparty[]}
              value={counterpartyId}
              onChange={(id) => setCounterpartyId(id)}
              orgId={currentOrg?.id || ''}
              onCpCreated={() => refetchCps()}
            />
          </div>
          {selectedCp ? (
            <div className="divide-y divide-[#F1F5F9] px-4">
              <PartyRow label={t('partyFields.stir')}        value={selectedCp.inn} />
              <PartyRow label={t('partyFields.name')}        value={selectedCp.name} />
              <PartyRow label={t('partyFields.director')}    value={(selectedCp as any).directorName} />
              <PartyRow label={t('partyFields.bank')}        value={(selectedCp as any).bankName} />
              <PartyRow label={t('partyFields.bankAccount')} value={(selectedCp as any).bankAccount} />
              <PartyRow label={t('partyFields.mfo')}         value={(selectedCp as any).mfo} />
              <PartyRow label={t('partyFields.address')}     value={(selectedCp as any).address} />
              <PartyRow label={t('partyFields.phone')}       value={(selectedCp as any).phone} />
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-[#94A3B8]">{t('noCpSelected')}</div>
          )}
        </Card>
      </div>

      {/* 3-blok: Mahsulot ro'yxati + "Barchasi uchun QQS" tezkor tugmalar */}
      <Card padding="none" className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('itemsTitle')}</p>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#475569]">{items.length}</span>
            {itemsError && (
              <span className="text-xs text-[#DC2626]">{itemsError}</span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] text-[#94A3B8]">{t('allQqs')}:</span>
            {(['siz', '0', '12', '15'] as QqsFoiz[]).map(foiz => (
              <button
                key={foiz}
                onClick={() => setAllQqs(foiz)}
                className="text-xs px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#DBEAFE] hover:text-[#1D4ED8] hover:border-[#BFDBFE] transition"
              >
                {foiz === 'siz' ? t('qqsLess') : foiz + '%'}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#94A3B8] w-10">{t('table.num')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#94A3B8]">{t('table.nameRequired')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#94A3B8] w-24">{t('table.unit')}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#94A3B8] w-24">{t('table.qty')}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#94A3B8] w-32">{t('table.priceSom')}</th>
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-[#94A3B8] w-24">{t('table.qqs')}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#94A3B8] w-32">{t('table.qqsAmount')}</th>
                <th className="px-3 py-2.5 text-right text-xs font-semibold text-[#94A3B8] w-36">{t('table.total')}</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-[#F1F5F9] hover:bg-[#FAFAFA] group">
                  <td className="px-3 py-2 text-sm text-[#94A3B8] text-center">{i + 1}</td>
                  <td className="px-3 py-2">
                    <input
                      value={item.nomi}
                      onChange={e => updateItem(i, 'nomi', e.target.value)}
                      placeholder={t('form.namePlaceholder')}
                      className="w-full text-sm bg-transparent border-b border-transparent focus:border-[#2563EB] outline-none py-1 text-[#0F172A] placeholder:text-[#CBD5E1]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.birlik}
                      onChange={e => updateItem(i, 'birlik', e.target.value)}
                      className="w-full text-sm bg-transparent outline-none py-1 text-[#0F172A] cursor-pointer"
                    >
                      {BIRLIKLAR.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min="0"
                      value={item.miqdori || ''}
                      onChange={e => updateItem(i, 'miqdori', parseFloat(e.target.value) || 0)}
                      className="w-full text-sm bg-transparent border-b border-transparent focus:border-[#2563EB] outline-none py-1 text-right tabular-nums text-[#0F172A]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="number" min="0"
                      value={item.narxi || ''}
                      onChange={e => updateItem(i, 'narxi', parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full text-sm bg-transparent border-b border-transparent focus:border-[#2563EB] outline-none py-1 text-right tabular-nums text-[#0F172A]"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={item.qqsFoiz}
                      onChange={e => updateItem(i, 'qqsFoiz', e.target.value as QqsFoiz)}
                      className="w-full text-sm bg-transparent outline-none py-1 text-[#0F172A] cursor-pointer"
                    >
                      {QQS_OPTIONS.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right text-sm tabular-nums text-[#D97706]">
                    {item.qqsSumma > 0 ? formatNumber(item.qqsSumma) : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-sm font-semibold tabular-nums text-[#0F172A]">
                    {formatNumber(item.summa)}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeRow(i)}
                      disabled={items.length <= 1}
                      className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1 rounded text-[#94A3B8] hover:text-[#DC2626] transition-all disabled:opacity-0 disabled:pointer-events-none"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button
          onClick={addRow}
          className="w-full py-3 text-sm text-[#2563EB] hover:bg-[#DBEAFE]/30 transition-colors flex items-center justify-center gap-2 border-t border-[#E2E8F0]"
        >
          <Plus size={15} />
          {t('addRow')}
        </button>
      </Card>

      {/* 4-blok: Jami hisob */}
      <Card className="max-w-sm ml-auto">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={16} className="text-[#2563EB]" />
          <p className="font-bold text-[#0F172A] text-sm">{t('totalSummary')}</p>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-[#475569]">{t('withoutQqs')}</span>
            <span className="tabular-nums font-medium">{formatNumber(totals.jami)} so'm</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#475569]">{t('totalQqs')}</span>
            <span className="tabular-nums text-[#D97706] font-medium">{formatNumber(totals.jamiQqs)} so'm</span>
          </div>
          <div className="border-t border-[#E2E8F0] pt-2 flex justify-between">
            <span className="font-bold text-[#0F172A]">{t('grandTotal')}</span>
            <span className="tabular-nums font-black text-[#0F172A] text-base">{formatNumber(totals.umumiy)} so'm</span>
          </div>
          <p className="text-xs text-[#94A3B8] italic leading-relaxed">
            {formatAmountWords(totals.umumiy)}
          </p>
        </div>
      </Card>
    </div>
  )
}

// ─── Tashkilot/kontragent rekvizit qatori ─────────────────────────
function PartyRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="text-[11px] text-[#94A3B8] w-28 shrink-0">{label}</span>
      <span className="text-xs text-[#0F172A] flex-1 truncate">{value || '—'}</span>
    </div>
  )
}
