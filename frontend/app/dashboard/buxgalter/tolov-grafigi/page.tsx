'use client'

import { useState }                                      from 'react'
import { Plus, Download, Check }                         from 'lucide-react'
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
  calcTolovGrafigi, type TolovGrafigiData, type TolovQatori,
} from '@/lib/buxgalterTemplates'
import { exportSpecExcel }                                from '@/lib/export/specExport'
import { formatCurrency, formatAmountWords }              from '@/lib/formatters'
import toast                                              from 'react-hot-toast'
import { cn }                                             from '@/lib/cn'

const today = () => new Date().toISOString().split('T')[0]

export default function TolovGrafigiPage() {
  const qc               = useQueryClient()
  const { currentOrg }   = useAuth()
  const [modal, setModal] = useState(false)
  const [rows, setRows]   = useState<TolovQatori[]>([])
  const [form, setForm]   = useState({
    raqam:        '',
    sana:         today(),
    cpNomi:       '',
    asosiyQarz:   '',
    foizStavka:   '0',
    tolovSoni:    '12',
    boshlashSana: today(),
    shartnoma:    '',
  })

  const { data: grafiklar = [], isLoading } = useQuery<any[]>({
    queryKey: ['tolov-grafik', currentOrg?.id],
    queryFn:  () => api.get(`/documents?orgId=${currentOrg!.id}&type=TOLOV_GRAFIGI`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  function handleCalc() {
    if (!form.asosiyQarz || !form.tolovSoni) return
    const data: TolovGrafigiData = {
      raqam:        form.raqam,
      sana:         form.sana,
      orgNomi:      currentOrg?.name || '',
      cpNomi:       form.cpNomi,
      asosiyQarz:   parseFloat(form.asosiyQarz),
      foizStavka:   parseFloat(form.foizStavka) || 0,
      tolovSoni:    parseInt(form.tolovSoni),
      boshlashSana: form.boshlashSana,
      shartnoma:    form.shartnoma,
    }
    setRows(calcTolovGrafigi(data))
  }

  function togglePaid(i: number) {
    setRows(prev => prev.map((r, idx) => idx === i ? { ...r, tolangan: !r.tolangan } : r))
  }

  const mutation = useMutation({
    mutationFn: () => api.post('/documents', {
      organizationId: currentOrg!.id,
      type:           'TOLOV_GRAFIGI',
      title:          `To'lov grafigi — ${form.cpNomi || 'Kontragent'} — ${formatCurrency(parseFloat(form.asosiyQarz) || 0)}`,
      docDate:        form.sana,
      content:        { type: 'TOLOV_GRAFIGI', formData: form, rows },
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tolov-grafik'] })
      toast.success("To'lov grafigi saqlandi ✓")
      setModal(false)
      setRows([])
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  async function handleExcel() {
    if (!rows.length) { toast.error('Avval hisoblang'); return }
    const items = rows.map(r => ({
      nomi:     `${r.oy}-oy (${r.sana})`,
      birlik:   "to'lov",
      miqdori:  1,
      narxi:    r.jami,
      qqsFoiz:  'siz' as const,
      qqsSumma: 0,
      summa:    r.jami,
    }))
    await exportSpecExcel({
      specNumber: form.raqam || 'GRF-001',
      orgName:    currentOrg?.name || '',
      items,
      notes: `Asosiy qarz: ${formatCurrency(parseFloat(form.asosiyQarz) || 0)}, Foiz: ${form.foizStavka}%, Muddat: ${form.tolovSoni} oy`,
    })
    toast.success('Excel yuklandi ✓')
  }

  const jamiTolov        = rows.reduce((s, r) => s + r.jami, 0)
  const jamiTolanganSum  = rows.filter(r => r.tolangan).reduce((s, r) => s + r.jami, 0)

  function openModal() {
    setRows([])
    setForm({ raqam: '', sana: today(), cpNomi: '', asosiyQarz: '', foizStavka: '0', tolovSoni: '12', boshlashSana: today(), shartnoma: '' })
    setModal(true)
  }

  return (
    <div>
      <PageHeader
        title="📅 To'lov grafigi"
        description="Qarz bo'yicha oylik to'lov jadvali"
        breadcrumbs={[
          { label: 'Dashboard',  path: '/dashboard' },
          { label: 'Buxgalter', path: '/dashboard/buxgalter' },
          { label: "To'lov grafigi" },
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={openModal}>
            Yangi grafik
          </Button>
        }
      />

      {grafiklar.length === 0 && !isLoading ? (
        <EmptyState
          icon={<span className="text-3xl">📅</span>}
          title="Grafiklar yo'q"
          description="Birinchi to'lov grafigini yarating"
          action={{ label: 'Yangi grafik', onClick: openModal }}
        />
      ) : (
        <Card padding="none">
          <div className="divide-y divide-[#E2E8F0]">
            {grafiklar.map((doc: any) => {
              const docRows  = doc.content?.rows || []
              const jamiSum  = docRows.reduce((s: number, r: any) => s + r.jami, 0)
              const tolangan = docRows.filter((r: any) => r.tolangan).length
              return (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[#F8FAFC]">
                  <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] flex items-center justify-center text-base">📅</div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#0F172A]">{doc.title}</p>
                    <p className="text-xs text-[#94A3B8]">
                      {docRows.length} oy · {formatCurrency(jamiSum)} · To'landi: {tolangan}/{docRows.length}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Yangi to'lov grafigi"
        size="xl"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setModal(false)}>Yopish</Button>
            <div className="flex-1" />
            {rows.length > 0 && (
              <Button variant="secondary" size="sm" leftIcon={<Download size={13} />} onClick={handleExcel}>
                Excel
              </Button>
            )}
            {rows.length > 0 && (
              <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate()}>
                Saqlash
              </Button>
            )}
          </div>
        }
      >
        {/* Sozlamalar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
          <Input label="Kontragent nomi" placeholder="Toshmatov MChJ"
            value={form.cpNomi} onChange={e => setForm(f => ({ ...f, cpNomi: e.target.value }))} />
          <Input label="Asosiy qarz (so'm) *" type="number" placeholder="10 000 000"
            value={form.asosiyQarz} onChange={e => setForm(f => ({ ...f, asosiyQarz: e.target.value }))} />
          <Input label="To'lov soni (oy) *" type="number" placeholder="12"
            value={form.tolovSoni} onChange={e => setForm(f => ({ ...f, tolovSoni: e.target.value }))} />
          <Input label="Foiz stavkasi (%)" type="number" placeholder="0 = foizsiz"
            value={form.foizStavka} onChange={e => setForm(f => ({ ...f, foizStavka: e.target.value }))} />
          <Input label="Boshlanish sanasi" type="date"
            value={form.boshlashSana} onChange={e => setForm(f => ({ ...f, boshlashSana: e.target.value }))} />
          <Input label="Shartnoma (ixtiyoriy)" placeholder="№ SH-2025-001"
            value={form.shartnoma} onChange={e => setForm(f => ({ ...f, shartnoma: e.target.value }))} />
        </div>

        <Button fullWidth variant="secondary"
          onClick={handleCalc}
          disabled={!form.asosiyQarz || !form.tolovSoni}>
          Grafikni hisoblash
        </Button>

        {/* Jadval */}
        {rows.length > 0 && (
          <div className="mt-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-[#0F172A]">To'lov jadvali</p>
              <div className="flex gap-3 text-xs">
                <span className="text-[#16A34A] font-medium">
                  To'landi: {formatCurrency(jamiTolanganSum)}
                </span>
                <span className="text-[#94A3B8]">
                  Jami: {formatCurrency(jamiTolov)}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
              <table className="w-full">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                    {['Oy', 'Sana', 'Asosiy', 'Foiz', 'Jami', 'Qoldiq', 'Holat'].map(h => (
                      <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-[#94A3B8] uppercase">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className={cn('border-b border-[#F1F5F9]', row.tolangan && 'bg-[#F0FDF4]')}>
                      <td className="px-3 py-2.5 text-sm text-[#94A3B8]">{row.oy}</td>
                      <td className="px-3 py-2.5 text-sm text-[#475569]">{row.sana}</td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right">{row.asosiy.toLocaleString('uz-UZ')}</td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right text-[#D97706]">
                        {row.foiz > 0 ? row.foiz.toLocaleString('uz-UZ') : '—'}
                      </td>
                      <td className="px-3 py-2.5 text-sm font-semibold tabular-nums text-right">{row.jami.toLocaleString('uz-UZ')}</td>
                      <td className="px-3 py-2.5 text-sm tabular-nums text-right text-[#475569]">{row.qoldiq.toLocaleString('uz-UZ')}</td>
                      <td className="px-3 py-2.5">
                        <button
                          onClick={() => togglePaid(i)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all',
                            row.tolangan
                              ? 'bg-[#DCFCE7] text-[#15803D]'
                              : 'bg-[#F1F5F9] text-[#94A3B8] hover:bg-[#E2E8F0]'
                          )}
                        >
                          {row.tolangan ? <><Check size={11} /> To'landi</> : 'Belgilash'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-3 p-3 bg-[#F8FAFC] rounded-lg text-xs text-[#94A3B8] italic">
              Jami: {formatAmountWords(jamiTolov)}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
