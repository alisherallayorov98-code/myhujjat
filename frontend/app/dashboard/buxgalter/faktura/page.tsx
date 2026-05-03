'use client'

import { useState }                                      from 'react'
import { useRouter }                                     from 'next/navigation'
import { useTranslations }                               from 'next-intl'
import { Plus, Save, Download, RefreshCw }               from 'lucide-react'
import { useMutation, useQuery, useQueryClient }          from '@tanstack/react-query'
import { PageHeader }                                     from '@/components/layout/PageHeader'
import { Button }                                         from '@/components/ui/Button'
import { Input }                                          from '@/components/ui/Input'
import { Card }                                           from '@/components/ui/Card'
import { Modal }                                          from '@/components/ui/Modal'
import { EmptyState }                                     from '@/components/ui/Skeleton'
import { useAuth }                                        from '@/hooks/useAuth'
import api                                                from '@/lib/api'
import { generateFakturaText }                            from '@/lib/buxgalterTemplates'
import {
  newSpecItem, calcSpecItem, calcSpecTotals,
  QQS_OPTIONS, type SpecItem, type QqsFoiz,
} from '@/lib/qqs'
import { exportContractPdf }                              from '@/lib/export/contractPdf'
import { formatCurrency, formatDate }                     from '@/lib/formatters'
import toast                                              from 'react-hot-toast'

const today = () => new Date().toISOString().split('T')[0]

export default function FakturaPage() {
  const t = useTranslations('accountant')
  const router           = useRouter()
  const qc               = useQueryClient()
  const { currentOrg }   = useAuth()
  const [modal, setModal] = useState(false)
  const [preview, setPreview] = useState('')
  const [items, setItems]     = useState<SpecItem[]>([newSpecItem()])
  const [form, setForm]       = useState({
    raqam:     '',
    sana:      today(),
    cpId:      '',
    notes:     '',
    shartnoma: '',
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: fakturalar = [], isLoading } = useQuery<any[]>({
    queryKey: ['fakturalar', currentOrg?.id],
    queryFn:  () => api.get(`/documents?orgId=${currentOrg!.id}&type=FAKTURA`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  function updateItem(i: number, field: keyof SpecItem, val: string | number) {
    setItems(prev => {
      const next = [...prev]
      const item = { ...next[i], [field]: val }
      if (['miqdori', 'narxi', 'qqsFoiz'].includes(field as string)) {
        const m = field === 'miqdori' ? Number(val) : item.miqdori
        const n = field === 'narxi'   ? Number(val) : item.narxi
        const q = (field === 'qqsFoiz' ? val : item.qqsFoiz) as QqsFoiz
        const c = calcSpecItem(m, n, q)
        item.qqsSumma = c.qqsSumma
        item.summa    = c.summa
      }
      next[i] = item
      return next
    })
  }

  const totals = calcSpecTotals(items)

  function buildPreview() {
    const cp   = cps.find((c: any) => c.id === form.cpId)
    const raqam = form.raqam || `FAK-${new Date().getFullYear()}-${String(fakturalar.length + 1).padStart(3, '0')}`
    const text = generateFakturaText({
      raqam,
      sana:      form.sana,
      orgNomi:   currentOrg?.name        || '',
      orgInn:    currentOrg?.inn         || '',
      orgRahbar: currentOrg?.directorName || '',
      orgBank:   currentOrg?.bankName    || '',
      orgHisob:  currentOrg?.bankAccount || '',
      orgMfo:    currentOrg?.mfo         || '',
      orgManzil: currentOrg?.address     || '',
      cpNomi:    cp?.name        || '',
      cpInn:     cp?.inn         || '',
      cpRahbar:  cp?.directorName || '',
      cpBank:    cp?.bankName    || '',
      cpHisob:   cp?.bankAccount || '',
      cpMfo:     cp?.mfo         || '',
      cpManzil:  cp?.address     || '',
      items,
      notes:     form.notes,
      shartnoma: form.shartnoma,
    })
    setPreview(text)
    return { text, raqam }
  }

  const mutation = useMutation({
    mutationFn: () => {
      const { text, raqam } = buildPreview()
      return api.post('/documents', {
        organizationId: currentOrg!.id,
        type:           'FAKTURA',
        title:          `Faktura ${raqam}`,
        docDate:        form.sana,
        content: {
          type:        'FAKTURA',
          formData:    { raqam, sana: form.sana, notes: form.notes, shartnoma: form.shartnoma },
          items,
          text,
          totalAmount: totals.umumiy,
        },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fakturalar'] })
      toast.success(t('fakturaSaved'))
      setModal(false)
      setItems([newSpecItem()])
      setForm({ raqam: '', sana: today(), cpId: '', notes: '', shartnoma: '' })
      setPreview('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  function openModal() {
    setItems([newSpecItem()])
    setPreview('')
    setForm({ raqam: '', sana: today(), cpId: '', notes: '', shartnoma: '' })
    setModal(true)
  }

  return (
    <div>
      <PageHeader
        title={t('fakturaTitle')}
        description={t('fakturaPageDesc')}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: t('breadcrumb'), path: '/dashboard/buxgalter' },
          { label: t('fakturaLabel') },
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={openModal}>
            {t('newFaktura')}
          </Button>
        }
      />

      {fakturalar.length === 0 && !isLoading ? (
        <EmptyState
          icon={<span className="text-3xl">🧾</span>}
          title={t('noFakturas')}
          description={t('createFirstFaktura')}
          action={{ label: t('newFaktura'), onClick: openModal }}
        />
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {[t('tableRaqam'), t('tableSarlavha'), t('tableSumma'), t('tableSana'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {fakturalar.map((doc: any) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/hujjat/${doc.id}`)}
                  className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono text-[#2563EB]">{doc.number}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{doc.title}</td>
                  <td className="px-4 py-3 text-sm font-semibold tabular-nums">
                    {doc.content?.totalAmount ? formatCurrency(doc.content.totalAmount) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">
                    {formatDate(doc.docDate || doc.createdAt, 'short')}
                  </td>
                  <td className="px-4 py-3">
                    {doc.content?.text && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          exportContractPdf({
                            title:   doc.title,
                            content: doc.content.text,
                            orgName: currentOrg?.name,
                          })
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#2563EB] transition-all"
                      >
                        <Download size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t('newFaktura')}
        size="xl"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setModal(false)}>{t('close')}</Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={13} />} onClick={() => buildPreview()}>
              {t('view')}
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}
              onClick={() => {
                const { text, raqam } = buildPreview()
                exportContractPdf({ title: `Faktura ${raqam}`, content: text, orgName: currentOrg?.name })
              }}>
              PDF
            </Button>
            <Button size="sm" leftIcon={<Save size={13} />}
              loading={mutation.isPending}
              onClick={() => mutation.mutate()}>
              {t('save')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label={t('raqam')} placeholder={t('raqamPlace')}
                value={form.raqam} onChange={e => setForm(f => ({ ...f, raqam: e.target.value }))} />
              <Input label={t('sana')} type="date"
                value={form.sana} onChange={e => setForm(f => ({ ...f, sana: e.target.value }))} />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#374151]">{t('buyer')}</label>
              <select
                value={form.cpId}
                onChange={e => setForm(f => ({ ...f, cpId: e.target.value }))}
                className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="">{t('selectCp')}</option>
                {cps.map((cp: any) => (
                  <option key={cp.id} value={cp.id}>{cp.name}</option>
                ))}
              </select>
            </div>

            <Input label={t('shartnoma')} placeholder={t('shartnomaPlace')}
              value={form.shartnoma} onChange={e => setForm(f => ({ ...f, shartnoma: e.target.value }))} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#0F172A]">{t('tovarlarServices')}</p>
                <button
                  onClick={() => setItems(p => [...p, newSpecItem()])}
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Plus size={12} /> {t('addItem')}
                </button>
              </div>

              <div className="space-y-2">
                {items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1.5 items-center">
                    <input
                      value={item.nomi}
                      onChange={e => updateItem(i, 'nomi', e.target.value)}
                      placeholder={t('itemName')}
                      className="col-span-4 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none focus:border-[#2563EB]"
                    />
                    <input type="number"
                      value={item.miqdori || ''}
                      onChange={e => updateItem(i, 'miqdori', parseFloat(e.target.value) || 0)}
                      placeholder={t('itemQty')}
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums"
                    />
                    <input type="number"
                      value={item.narxi || ''}
                      onChange={e => updateItem(i, 'narxi', parseFloat(e.target.value) || 0)}
                      placeholder={t('itemPrice')}
                      className="col-span-3 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums"
                    />
                    <select
                      value={item.qqsFoiz}
                      onChange={e => updateItem(i, 'qqsFoiz', e.target.value as QqsFoiz)}
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-1 focus:outline-none"
                    >
                      {QQS_OPTIONS.map(q => (
                        <option key={q.value} value={q.value}>{q.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => items.length > 1 && setItems(p => p.filter((_, idx) => idx !== i))}
                      className="col-span-1 h-8 flex items-center justify-center text-[#CBD5E1] hover:text-[#DC2626] transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-1">
                <div className="flex justify-between text-xs text-[#475569]">
                  <span>{t('jami')}</span>
                  <span className="tabular-nums">{totals.jami.toLocaleString('uz-UZ')} {t('som')}</span>
                </div>
                <div className="flex justify-between text-xs text-[#D97706]">
                  <span>{t('qqs')}</span>
                  <span className="tabular-nums">{totals.jamiQqs.toLocaleString('uz-UZ')} {t('som')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-[#0F172A]">
                  <span>{t('umumiy')}</span>
                  <span className="tabular-nums">{totals.umumiy.toLocaleString('uz-UZ')} {t('som')}</span>
                </div>
              </div>
            </div>

            <Input label={t('izoh')} placeholder={t('izohPlace')}
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>

          <div>
            <p className="text-sm font-semibold text-[#0F172A] mb-2">{t('preview')}</p>
            <div className="h-[480px] overflow-auto rounded-xl border border-[#E2E8F0] bg-[#F1F5F9] p-3">
              {preview ? (
                <div
                  className="bg-white shadow-sm mx-auto p-6 leading-relaxed text-[#0F172A]"
                  style={{ fontFamily: '"Times New Roman", serif', fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}
                >
                  {preview}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
                  {t('previewHint')}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
