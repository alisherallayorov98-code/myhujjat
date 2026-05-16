'use client'

import { useState }                                      from 'react'
import { useRouter }                                     from 'next/navigation'
import { useTranslations }                               from 'next-intl'
import { Plus, Save, Download, Eye, Maximize2, Trash2 }   from 'lucide-react'
import { useMutation, useQuery, useQueryClient }          from '@tanstack/react-query'
import { PageHeader }                                     from '@/components/layout/PageHeader'
import { Button }                                         from '@/components/ui/Button'
import { Input }                                          from '@/components/ui/Input'
import { Card }                                           from '@/components/ui/Card'
import { Modal }                                          from '@/components/ui/Modal'
import { EmptyState }                                     from '@/components/ui/Skeleton'
import { FullscreenPreview }                              from '@/components/shared/FullscreenPreview'
import { useAuth }                                        from '@/hooks/useAuth'
import api                                                from '@/lib/api'
import {
  generateAktSverkaText, type AktSverkaData, type AktSverkaMovement,
} from '@/lib/buxgalterTemplates'
import { exportContractPdf }  from '@/lib/export/contractPdf'
import { formatDate }         from '@/lib/formatters'
import toast                  from 'react-hot-toast'

const today = () => new Date().toISOString().split('T')[0]

const EMPTY_MOV: AktSverkaMovement = { sana: '', hujjat: '', debet: 0, kredit: 0 }

export default function AktSverkiPage() {
  const t = useTranslations('accountant')
  const router           = useRouter()
  const qc               = useQueryClient()
  const { currentOrg }   = useAuth()
  const [modal, setModal] = useState(false)
  const [preview, setPreview]       = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [movements, setMovements]   = useState<AktSverkaMovement[]>([{ ...EMPTY_MOV }])
  const [form, setForm] = useState({
    raqam:             '',
    sana:              today(),
    davr:              `${new Date().getFullYear()}-yil`,
    orgInn:            '',
    orgRahbar:         '',
    cpNomi:            '',
    cpInn:             '',
    cpRahbar:          '',
    boshlangichQoldiq: '0',
  })

  const { data: aktlar = [], isLoading } = useQuery<any[]>({
    queryKey: ['akt-sverki', currentOrg?.id],
    queryFn:  () => api.get(`/documents?orgId=${currentOrg!.id}&type=AKT_SVERKI&limit=100`).then(r => r.data.data || []),
    enabled:  !!currentOrg?.id,
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}&limit=100`).then(r => r.data.data || []),
    enabled:  !!currentOrg?.id,
  })

  function updateMov(i: number, field: keyof AktSverkaMovement, val: string | number) {
    setMovements(prev => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: val }
      return next
    })
  }

  function buildData(): AktSverkaData {
    return {
      raqam:             form.raqam || (() => {
        const year = new Date().getFullYear()
        const maxNum = aktlar.reduce((max: number, a: any) => {
          const m = String(a.title || '').match(/ASV-\d{4}-(\d+)/)
          return m ? Math.max(max, parseInt(m[1])) : max
        }, 0)
        return `ASV-${year}-${String(maxNum + 1).padStart(3, '0')}`
      })(),
      sana:              form.sana,
      davr:              form.davr,
      orgNomi:           currentOrg?.name        || '',
      orgInn:            currentOrg?.inn          || form.orgInn,
      orgRahbar:         currentOrg?.directorName || form.orgRahbar,
      cpNomi:            form.cpNomi,
      cpInn:             form.cpInn,
      cpRahbar:          form.cpRahbar,
      movements:         movements.filter(m => m.hujjat || m.debet || m.kredit),
      boshlangichQoldiq: parseFloat(form.boshlangichQoldiq) || 0,
    }
  }

  function handlePreview() {
    setPreview(generateAktSverkaText(buildData()))
  }

  const mutation = useMutation({
    mutationFn: () => {
      const data = buildData()
      const text = generateAktSverkaText(data)
      return api.post('/documents', {
        organizationId: currentOrg!.id,
        type:           'AKT_SVERKI',
        title:          `Akt-sverka № ${data.raqam} — ${data.cpNomi}`,
        docDate:        data.sana,
        content:        { type: 'AKT_SVERKI', formData: form, movements, text },
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['akt-sverki'] })
      toast.success(t('aktSverkaSaved'))
      setModal(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  return (
    <div>
      <PageHeader
        title={t('aktSverkaTitle')}
        description={t('aktSverkaPageDesc')}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: t('breadcrumb'), path: '/dashboard/buxgalter' },
          { label: t('aktSverkaLabel') },
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => { setPreview(''); setModal(true) }}>
            {t('newAktSverka')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : aktlar.length === 0 ? (
        <EmptyState
          icon={<span className="text-3xl">📊</span>}
          title={t('noAktSverkas')}
          description={t('createFirstAktSverka')}
          action={{ label: t('newAktSverka'), onClick: () => setModal(true) }}
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {[t('tableRaqam'), t('tableSarlavha'), t('tableDavr'), t('tableSana'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aktlar.map((doc: any) => (
                <tr
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/hujjat/${doc.id}`)}
                  className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group cursor-pointer"
                >
                  <td className="px-4 py-3 text-sm font-mono text-[#2563EB]">{doc.number}</td>
                  <td className="px-4 py-3 text-sm text-[#475569] max-w-[220px] truncate">{doc.title}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{doc.content?.formData?.davr || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{formatDate(doc.docDate || doc.createdAt, 'short')}</td>
                  <td className="px-4 py-3">
                    {doc.content?.text && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          exportContractPdf({ title: doc.title, content: doc.content.text, orgName: currentOrg?.name })
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
          </div>
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t('newAktSverka')}
        size="lg"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setModal(false)}>{t('close')}</Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" leftIcon={<Eye size={13} />}
              onClick={() => { handlePreview(); setShowPreview(true) }}>
              {t('view')}
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}
              onClick={() => {
                const text = generateAktSverkaText(buildData())
                exportContractPdf({ title: `Akt-sverka`, content: text, orgName: currentOrg?.name })
              }}>
              PDF
            </Button>
            <Button size="sm" leftIcon={<Save size={13} />} loading={mutation.isPending} onClick={() => mutation.mutate()}>
              {t('save')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label={t('raqam')} placeholder={t('raqamPlace')}
                value={form.raqam} onChange={e => setForm(f => ({ ...f, raqam: e.target.value }))} />
              <Input label={t('sana')} type="date"
                value={form.sana} onChange={e => setForm(f => ({ ...f, sana: e.target.value }))} />
            </div>
            <Input label={t('davr')} placeholder={t('davrPlace')}
              value={form.davr} onChange={e => setForm(f => ({ ...f, davr: e.target.value }))} />

            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">{t('kontragent')}</p>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">{t('selectKontragent')}</label>
                <select
                  onChange={e => {
                    const cp = cps.find((c: any) => c.id === e.target.value)
                    if (cp) setForm(f => ({ ...f, cpNomi: cp.name, cpInn: cp.inn || '', cpRahbar: cp.directorName || '' }))
                  }}
                  className="w-full h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">{t('selectPlace')}</option>
                  {cps.map((cp: any) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>
              <Input label={t('kontragentNomi')} placeholder={t('kontragentNomiPlace')}
                value={form.cpNomi} onChange={e => setForm(f => ({ ...f, cpNomi: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input label={t('inn')} placeholder={t('innPlace')}
                  value={form.cpInn} onChange={e => setForm(f => ({ ...f, cpInn: e.target.value }))} />
                <Input label={t('rahbar')} placeholder={t('rahbarPlace')}
                  value={form.cpRahbar} onChange={e => setForm(f => ({ ...f, cpRahbar: e.target.value }))} />
              </div>
            </div>

            <Input label={t('boshlangichQoldiq')} type="number" placeholder="0"
              value={form.boshlangichQoldiq} onChange={e => setForm(f => ({ ...f, boshlangichQoldiq: e.target.value }))} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#0F172A]">{t('harakatlar')}</p>
                <button onClick={() => setMovements(p => [...p, { ...EMPTY_MOV }])}
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                  <Plus size={12} /> {t('addItem')}
                </button>
              </div>
              <div className="space-y-2">
                {movements.map((mov, i) => (
                  <div key={i} className="grid grid-cols-11 gap-1.5 items-center">
                    <input value={mov.sana}
                      onChange={e => updateMov(i, 'sana', e.target.value)}
                      placeholder={t('movSana')} type="date"
                      className="col-span-3 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none" />
                    <input value={mov.hujjat}
                      onChange={e => updateMov(i, 'hujjat', e.target.value)}
                      placeholder={t('movHujjat')}
                      className="col-span-3 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none" />
                    <input type="number" value={mov.debet || ''}
                      onChange={e => updateMov(i, 'debet', parseFloat(e.target.value) || 0)}
                      placeholder={t('movDebet')}
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums" />
                    <input type="number" value={mov.kredit || ''}
                      onChange={e => updateMov(i, 'kredit', parseFloat(e.target.value) || 0)}
                      placeholder={t('movKredit')}
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums" />
                    <button onClick={() => movements.length > 1 && setMovements(p => p.filter((_, idx) => idx !== i))}
                      className="col-span-1 h-8 flex items-center justify-center text-[#CBD5E1] hover:text-[#DC2626] transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tezkor ko'rinish — to'liq ekran uchun "Ko'rish" tugmasi */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#0F172A]">{t('preview')}</p>
                <button
                  onClick={() => { handlePreview(); setShowPreview(true) }}
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1"
                >
                  <Maximize2 size={12} /> {t('view')}
                </button>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3 max-h-[280px] overflow-auto">
                {preview ? (
                  <pre
                    className="text-[11px] text-[#475569] whitespace-pre-wrap leading-relaxed"
                    style={{ fontFamily: '"Times New Roman", serif' }}
                  >
                    {preview.slice(0, 600)}{preview.length > 600 ? '…' : ''}
                  </pre>
                ) : (
                  <div className="text-center text-[#94A3B8] text-xs py-4">
                    {t('previewHint')}
                  </div>
                )}
              </div>
            </div>
        </div>
      </Modal>

      <FullscreenPreview
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title={`Akt-sverka № ${form.raqam || '...'}`}
        content={preview}
        emptyText={t('previewHint')}
        toolbar={
          <button
            onClick={() => {
              const text = generateAktSverkaText(buildData())
              exportContractPdf({ title: `Akt-sverka`, content: text, orgName: currentOrg?.name })
            }}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
          >
            <Download size={14} />
            <span className="hidden sm:inline">PDF</span>
          </button>
        }
      />
    </div>
  )
}
