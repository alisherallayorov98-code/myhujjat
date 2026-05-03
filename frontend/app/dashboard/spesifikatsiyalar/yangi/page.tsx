'use client'

import { useState, useCallback } from 'react'
import { useTranslations }       from 'next-intl'
import { useRouter }             from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Save, Download, Calculator } from 'lucide-react'
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
import toast            from 'react-hot-toast'

export default function YangiSpesifikatsiya() {
  const t = useTranslations('specifications')
  const router         = useRouter()
  const qc             = useQueryClient()
  const { currentOrg } = useAuth()

  const [items,      setItems]      = useState<SpecItem[]>([newSpecItem()])
  const [notes,      setNotes]      = useState('')
  const [contractId, setContractId] = useState('')

  const { data: contracts = [] } = useQuery({
    queryKey: ['contracts-list', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/contracts?orgId=${currentOrg.id}&limit=50`)
      return data.data || []
    },
    enabled: !!currentOrg?.id,
  })

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
      return next
    })
  }, [])

  const totals = calcSpecTotals(items)

  const mutation = useMutation({
    mutationFn: () => api.post('/specifications', {
      organizationId: currentOrg!.id,
      contractId:     contractId || undefined,
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
      specNumber:  'YANGI',
      orgName:     currentOrg?.name || '',
      contractNum: contract?.contractNumber,
      items,
      notes,
    })
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
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleExcel}>
              Excel
            </Button>
            <Button size="sm" leftIcon={<Save size={14} />} loading={mutation.isPending} onClick={() => mutation.mutate()}>
              {t('save')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[#374151]">{t('attachToContract')}</label>
            <select
              value={contractId}
              onChange={e => setContractId(e.target.value)}
              className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">{t('selectContract')}</option>
              {(contracts as any[]).map((c: any) => (
                <option key={c.id} value={c.id}>
                  № {c.contractNumber} — {c.counterparty?.name || t('noCpName')}
                </option>
              ))}
            </select>
          </div>
          <Input
            label={t('form.notes')}
            placeholder={t('form.notesPlaceholder')}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </Card>

      <Card padding="none" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
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
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#94A3B8] hover:text-[#DC2626] transition-all disabled:opacity-0 disabled:pointer-events-none"
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
