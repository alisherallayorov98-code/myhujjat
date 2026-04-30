'use client'

import { useState }                                      from 'react'
import { Plus, Save, Download, RefreshCw, Trash2 }       from 'lucide-react'
import { useMutation, useQuery, useQueryClient }          from '@tanstack/react-query'
import { PageHeader }                                     from '@/components/layout/PageHeader'
import { Button }                                         from '@/components/ui/Button'
import { Input }                                          from '@/components/ui/Input'
import { Card }                                           from '@/components/ui/Card'
import { Modal }                                          from '@/components/ui/Modal'
import { EmptyState }                                     from '@/components/ui/Skeleton'
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
  const qc               = useQueryClient()
  const { currentOrg }   = useAuth()
  const [modal, setModal] = useState(false)
  const [preview, setPreview]       = useState('')
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
    queryFn:  () => api.get(`/documents?orgId=${currentOrg!.id}&type=AKT_SVERKI`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
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
      raqam:             form.raqam || `ASV-${new Date().getFullYear()}-${String(aktlar.length + 1).padStart(3, '0')}`,
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
      toast.success('Akt-sverka saqlandi ✓')
      setModal(false)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  return (
    <div>
      <PageHeader
        title="📊 Akt-sverka"
        description="O'zaro hisob-kitob tekshirish hujjati"
        breadcrumbs={[
          { label: 'Dashboard',  path: '/dashboard' },
          { label: 'Buxgalter', path: '/dashboard/buxgalter' },
          { label: 'Akt-sverka' },
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => { setPreview(''); setModal(true) }}>
            Yangi akt-sverka
          </Button>
        }
      />

      {aktlar.length === 0 && !isLoading ? (
        <EmptyState
          icon={<span className="text-3xl">📊</span>}
          title="Akt-sverkalar yo'q"
          description="Birinchi akt-sverkani yarating"
          action={{ label: 'Yangi akt-sverka', onClick: () => setModal(true) }}
        />
      ) : (
        <Card padding="none">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['Raqam', 'Sarlavha', 'Davr', 'Sana', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {aktlar.map((doc: any) => (
                <tr key={doc.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                  <td className="px-4 py-3 text-sm font-mono text-[#2563EB]">{doc.number}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{doc.title}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{doc.content?.formData?.davr || '—'}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{formatDate(doc.docDate || doc.createdAt, 'short')}</td>
                  <td className="px-4 py-3">
                    {doc.content?.text && (
                      <button
                        onClick={() => exportContractPdf({ title: doc.title, content: doc.content.text, orgName: currentOrg?.name })}
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
        title="Yangi akt-sverka"
        size="xl"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setModal(false)}>Yopish</Button>
            <div className="flex-1" />
            <Button variant="secondary" size="sm" leftIcon={<RefreshCw size={13} />} onClick={handlePreview}>Ko'rish</Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={13} />}
              onClick={() => {
                const text = generateAktSverkaText(buildData())
                exportContractPdf({ title: `Akt-sverka`, content: text, orgName: currentOrg?.name })
              }}>
              PDF
            </Button>
            <Button size="sm" leftIcon={<Save size={13} />} loading={mutation.isPending} onClick={() => mutation.mutate()}>
              Saqlash
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chap: Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Raqam" placeholder="Avtomatik"
                value={form.raqam} onChange={e => setForm(f => ({ ...f, raqam: e.target.value }))} />
              <Input label="Sana" type="date"
                value={form.sana} onChange={e => setForm(f => ({ ...f, sana: e.target.value }))} />
            </div>
            <Input label="Davr" placeholder="2025-yil I-chorak"
              value={form.davr} onChange={e => setForm(f => ({ ...f, davr: e.target.value }))} />

            {/* Kontragent */}
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <p className="text-xs font-semibold text-[#475569] uppercase tracking-wide">Kontragent</p>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#374151]">Kontragent tanlash</label>
                <select
                  onChange={e => {
                    const cp = cps.find((c: any) => c.id === e.target.value)
                    if (cp) setForm(f => ({ ...f, cpNomi: cp.name, cpInn: cp.inn || '', cpRahbar: cp.directorName || '' }))
                  }}
                  className="w-full h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">Tanlang...</option>
                  {cps.map((cp: any) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
                </select>
              </div>
              <Input label="Kontragent nomi" placeholder="MChJ nomi"
                value={form.cpNomi} onChange={e => setForm(f => ({ ...f, cpNomi: e.target.value }))} />
              <div className="grid grid-cols-2 gap-2">
                <Input label="INN" placeholder="123456789"
                  value={form.cpInn} onChange={e => setForm(f => ({ ...f, cpInn: e.target.value }))} />
                <Input label="Rahbar" placeholder="F.I.O"
                  value={form.cpRahbar} onChange={e => setForm(f => ({ ...f, cpRahbar: e.target.value }))} />
              </div>
            </div>

            <Input label="Boshlanish qoldig'i (so'm)" type="number" placeholder="0"
              value={form.boshlangichQoldiq} onChange={e => setForm(f => ({ ...f, boshlangichQoldiq: e.target.value }))} />

            {/* Harakatlar jadvali */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-semibold text-[#0F172A]">Harakatlar</p>
                <button onClick={() => setMovements(p => [...p, { ...EMPTY_MOV }])}
                  className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
                  <Plus size={12} /> Qo'shish
                </button>
              </div>
              <div className="space-y-2">
                {movements.map((mov, i) => (
                  <div key={i} className="grid grid-cols-11 gap-1.5 items-center">
                    <input value={mov.sana}
                      onChange={e => updateMov(i, 'sana', e.target.value)}
                      placeholder="Sana" type="date"
                      className="col-span-3 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none" />
                    <input value={mov.hujjat}
                      onChange={e => updateMov(i, 'hujjat', e.target.value)}
                      placeholder="Hujjat"
                      className="col-span-3 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none" />
                    <input type="number" value={mov.debet || ''}
                      onChange={e => updateMov(i, 'debet', parseFloat(e.target.value) || 0)}
                      placeholder="Debet"
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums" />
                    <input type="number" value={mov.kredit || ''}
                      onChange={e => updateMov(i, 'kredit', parseFloat(e.target.value) || 0)}
                      placeholder="Kredit"
                      className="col-span-2 h-8 text-xs rounded-lg border border-[#E2E8F0] px-2 focus:outline-none text-right tabular-nums" />
                    <button onClick={() => movements.length > 1 && setMovements(p => p.filter((_, idx) => idx !== i))}
                      className="col-span-1 h-8 flex items-center justify-center text-[#CBD5E1] hover:text-[#DC2626] transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* O'ng: Preview */}
          <div>
            <p className="text-sm font-semibold text-[#0F172A] mb-2">Ko'rib chiqish</p>
            <div className="h-[480px] overflow-auto rounded-xl border border-[#E2E8F0] bg-[#FAFAFA] p-4">
              {preview ? (
                <pre className="whitespace-pre-wrap text-xs leading-relaxed text-[#0F172A] font-mono">{preview}</pre>
              ) : (
                <div className="flex items-center justify-center h-full text-[#94A3B8] text-sm">
                  Ma'lumotlarni to'ldiring va "Ko'rish" bosing
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
