'use client'

import { useState, useMemo }                     from 'react'
import { useRouter }                             from 'next/navigation'
import { useTranslations }                       from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth }                               from '@/hooks/useAuth'
import api from '@/lib/api'
import {
  BAYONNOMA_TYPES, BAYONNOMA_TEMPLATES,
  newAgendaItem,
  type BayonnomData, type AgendaItem,
} from '@/lib/kotibTemplates'
import { exportContractPdf }  from '@/lib/export/contractPdf'
import { exportContractDocx } from '@/lib/export/contractDocx'
import { printHtml }          from '@/lib/printDocument'
import { renderKotibHtml }    from '@/lib/renderKotibHtml'
import { format }             from 'date-fns'
import toast                  from 'react-hot-toast'
import { FullscreenPreview } from '@/components/shared/FullscreenPreview'
import {
  Plus, Users, Trash2, Download, Copy, Check,
  ChevronLeft, Eye, Save, Maximize2, Printer, ChevronDown, BookMarked, X, Loader2,
} from 'lucide-react'

interface DocRow {
  id: string; type: string; title: string; number: string
  docDate: string; status: string; createdAt: string
}

type Step = 'list' | 'form'

function toDmy(iso: string) {
  if (!iso || !iso.includes('-')) return iso
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

const STATUS_ORDER = ['DRAFT', 'FINAL', 'SENT']
function nextStatus(s: string) {
  const i = STATUS_ORDER.indexOf(s)
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length]
}

const EMPTY: BayonnomData = {
  raqam: '', sana: format(new Date(), 'yyyy-MM-dd'),
  vaqtBoshlanish: '', vaqtTugash: '', joy: '',
  orgNomi: '', rahbar: '', kotib: '',
  ishtirokchilar: '', taklifEtilganlar: '',
  kvorumJami: '', kvorumKelgan: '',
  kunTartibi: [newAgendaItem()],
  ilovalar: '',
  mavzu: '', muhokama: '', qaror: '',
}

export default function BayonnomPage() {
  const t = useTranslations('secretary')
  const router                      = useRouter()
  const { currentOrg: activeOrg }   = useAuth()
  const qc                          = useQueryClient()
  const [step, setStep]             = useState<Step>('list')
  const [fullscreen, setFullscreen] = useState(false)
  const [kind, setKind]             = useState(BAYONNOMA_TYPES[0].value)
  const [form, setForm]             = useState<BayonnomData>({ ...EMPTY })
  const [copied, setCopied]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [exporting, setExporting]   = useState<'pdf' | 'docx' | null>(null)
  const [toDelete, setToDelete]     = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [typeOpen, setTypeOpen]     = useState(false)
  const [showTplModal, setShowTplModal] = useState(false)
  const [tplName, setTplName]           = useState('')

  const bayonnomaLabel  = (val: string) => t(`bayonnomaType_${val}` as any)
  const isQabulTopshirish = kind === 'QABUL_TOPSHIRISH'

  const STATUS_CLS: Record<string, string> = {
    DRAFT: 'bg-[#F1F5F9] text-[#475569]',
    FINAL: 'bg-[#DCFCE7] text-[#16A34A]',
    SENT:  'bg-[#DBEAFE] text-[#1D4ED8]',
  }
  const STATUS_LBL: Record<string, string> = {
    DRAFT: t('statusDraft'),
    FINAL: t('statusFinal'),
    SENT:  t('statusSent'),
  }

  const { data: docs = [], isLoading } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id, 'BAYONNOMA'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BAYONNOMA&limit=100`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees', activeOrg?.id],
    queryFn:  () => api.get(`/employees?orgId=${activeOrg!.id}&limit=200`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const { data: myTemplates = [] } = useQuery<any[]>({
    queryKey: ['user-templates', activeOrg?.id, 'BAYONNOMA'],
    queryFn:  async () => {
      const res = await api.get(`/user-templates?orgId=${activeOrg!.id}&limit=100`)
      return (res.data.data || []).filter((t: any) => {
        try { return JSON.parse(t.rawContent || '{}').docModule === 'BAYONNOMA' }
        catch { return false }
      })
    },
    enabled: !!activeOrg,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}?orgId=${activeOrg!.id}`),
    onSuccess:  () => {
      setToDelete(null)
      qc.invalidateQueries({ queryKey: ['documents', activeOrg?.id] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "O'chirishda xatolik"),
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/documents/${id}?orgId=${activeOrg!.id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', activeOrg?.id] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik yuz berdi'),
  })

  const saveTplMut = useMutation({
    mutationFn: (name: string) => api.post('/user-templates', {
      organizationId: activeOrg!.id,
      name,
      source: 'CUSTOM',
      rawContent: JSON.stringify({ docModule: 'BAYONNOMA', kind, data: form }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-templates', activeOrg?.id, 'BAYONNOMA'] })
      setShowTplModal(false)
      setTplName('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Shablon saqlanmadi'),
  })

  const deleteTplMut = useMutation({
    mutationFn: (id: string) => api.delete(`/user-templates/${id}?orgId=${activeOrg!.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-templates', activeOrg?.id, 'BAYONNOMA'] }),
    onError: (e: any) => toast.error(e?.response?.data?.message || "Shablon o'chirilmadi"),
  })

  function applyTemplate(tpl: any) {
    try {
      const { kind: k, data } = JSON.parse(tpl.rawContent || '{}')
      if (k) setKind(k)
      if (data) setForm({
        ...data,
        sana: format(new Date(), 'yyyy-MM-dd'),
        raqam: '',
        kunTartibi: data.kunTartibi?.length ? data.kunTartibi : [newAgendaItem()],
      })
    } catch {}
  }

  function appendEmployee(emp: any) {
    const line = emp.ism + (emp.lavozim ? ` — ${emp.lavozim}` : '')
    update('ishtirokchilar', form.ishtirokchilar
      ? form.ishtirokchilar + '\n' + line
      : line
    )
  }

  const displayForm = useMemo(() => ({ ...form, sana: toDmy(form.sana) }), [form])

  const preview = useMemo(() => {
    try { return BAYONNOMA_TEMPLATES[kind]?.(displayForm) ?? '' } catch { return '' }
  }, [kind, displayForm])

  const previewHtml = useMemo(() => preview ? renderKotibHtml(preview) : '', [preview])

  function update(k: keyof BayonnomData, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function updateAgenda(i: number, key: keyof AgendaItem, v: string) {
    setForm(p => ({
      ...p,
      kunTartibi: p.kunTartibi.map((it, idx) => idx === i ? { ...it, [key]: v } : it),
    }))
  }
  function addAgenda() {
    setForm(p => ({ ...p, kunTartibi: [...p.kunTartibi, newAgendaItem()] }))
  }
  function removeAgenda(i: number) {
    setForm(p => ({
      ...p,
      kunTartibi: p.kunTartibi.length <= 1 ? p.kunTartibi : p.kunTartibi.filter((_, idx) => idx !== i),
    }))
  }

  function initNew() {
    setForm({
      ...EMPTY,
      sana:      format(new Date(), 'yyyy-MM-dd'),
      kunTartibi: [newAgendaItem()],
      orgNomi:   activeOrg?.name        ?? '',
      rahbar:    activeOrg?.directorName ?? '',
      joy:       activeOrg?.address     ?? '',
    })
    setKind(BAYONNOMA_TYPES[0].value)
    setError('')
    setStep('form')
  }

  async function handleSave(status: 'DRAFT' | 'FINAL') {
    if (!activeOrg) return
    const missing: string[] = []
    if (!form.raqam.trim())   missing.push('Bayonnoma raqami')
    if (!form.sana)           missing.push('Sana')
    if (!form.orgNomi.trim()) missing.push('Tashkilot nomi')
    if (missing.length) {
      const msg = `To'ldirilmagan maydonlar: ${missing.join(', ')}`
      setError(msg)
      toast.error(msg)
      return
    }
    setError('')
    setSaving(true)
    try {
      const typeLabel = bayonnomaLabel(kind)
      const titleHint = isQabulTopshirish ? form.mavzu : (form.kunTartibi[0]?.masala || form.mavzu)
      await api.post('/documents', {
        organizationId: activeOrg.id,
        type:           'BAYONNOMA',
        title:          `${typeLabel} — ${titleHint || form.raqam}`,
        number:         form.raqam,
        docDate:        toDmy(form.sana),
        content:        { kind, text: preview, data: { ...form, sana: toDmy(form.sana) } },
        status,
      })
      qc.invalidateQueries({ queryKey: ['documents', activeOrg.id] })
      setStep('list')
    } finally {
      setSaving(false)
    }
  }

  async function handlePdf() {
    setExporting('pdf')
    try {
      await exportContractPdf({ title: `${bayonnomaLabel(kind)} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
      toast.success('PDF yuklandi')
    } catch { toast.error('PDF faylini yuklashda xatolik') }
    finally { setExporting(null) }
  }

  async function handleDocx() {
    setExporting('docx')
    try {
      await exportContractDocx({ title: `${bayonnomaLabel(kind)} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
      toast.success('Word yuklandi')
    } catch { toast.error('Word faylini yuklashda xatolik') }
    finally { setExporting(null) }
  }

  function handleCopy() {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (step === 'list') return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#0F172A]">{t('bayonnomalar')}</h1>
        <button
          onClick={initNew}
          className="flex items-center gap-2 bg-[#7C3AED] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#6D28D9] transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('yangiBayonnoma')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-x-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[0,1,2,3].map(i => (
              <div key={i} className="h-12 bg-[#F1F5F9] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : docs.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-14 h-14 mx-auto text-[#E2E8F0] mb-4" />
            <p className="text-[#64748B] font-medium">{t('bayonnomalarYoq')}</p>
            <p className="text-[#94A3B8] text-sm mt-1">{t('yangiBayonnomaYarating')}</p>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="text-left border-b border-[#F1F5F9]">
                <th className="px-5 py-3 font-medium text-[#64748B]">{t('raqam')}</th>
                <th className="px-5 py-3 font-medium text-[#64748B]">{t('sarlavha')}</th>
                <th className="px-5 py-3 font-medium text-[#64748B]">{t('sana')}</th>
                <th className="px-5 py-3 font-medium text-[#64748B]">{t('status')}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {docs.map(d => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/dashboard/hujjat/${d.id}`)}
                  className="hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <td className="px-5 py-3 text-[#64748B]">{d.number}</td>
                  <td className="px-5 py-3 font-medium text-[#0F172A]">{d.title}</td>
                  <td className="px-5 py-3 text-[#64748B]">{d.docDate || format(new Date(d.createdAt), 'dd.MM.yyyy')}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={e => { e.stopPropagation(); updateStatusMut.mutate({ id: d.id, status: nextStatus(d.status) }) }}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full hover:opacity-75 transition-opacity ${STATUS_CLS[d.status] ?? STATUS_CLS.DRAFT}`}
                      title="Holatni o'zgartirish uchun bosing"
                    >
                      {STATUS_LBL[d.status] ?? d.status}
                    </button>
                  </td>
                  <td className="px-5 py-3 text-right" onClick={e => e.stopPropagation()}>
                    {toDelete === d.id ? (
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          onClick={() => deleteMut.mutate(d.id)}
                          className="text-xs font-medium text-[#DC2626] hover:underline"
                        >
                          Ha, o'chir
                        </button>
                        <button
                          onClick={() => setToDelete(null)}
                          className="text-xs text-[#94A3B8] hover:underline"
                        >
                          Bekor
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setToDelete(d.id)}
                        className="text-[#CBD5E1] hover:text-[#DC2626] transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('list')} className="text-[#94A3B8] hover:text-[#374151] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-[#0F172A]">{t('yangiBayonnoma')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {myTemplates.length > 0 && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#B45309] mb-2 flex items-center gap-1.5">
                <BookMarked className="w-3.5 h-3.5" /> Mening shablonlarim
              </p>
              <div className="flex flex-wrap gap-2">
                {myTemplates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-1 bg-white border border-[#FDE68A] rounded-lg px-2.5 py-1.5">
                    <button
                      onClick={() => applyTemplate(tpl)}
                      className="text-xs font-medium text-[#92400E] hover:text-[#D97706] transition-colors"
                    >
                      {tpl.name}
                    </button>
                    <button
                      onClick={() => deleteTplMut.mutate(tpl.id)}
                      className="text-[#CBD5E1] hover:text-[#FCA5A5] transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bayonnoma turi — dropdown */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5">
            <p className="text-sm font-medium text-[#374151] mb-3">{t('bayonnomaTuri')}</p>
            <div className="relative">
              <button
                onClick={() => setTypeOpen(p => !p)}
                className="w-full flex items-center justify-between border border-[#C4B5FD] bg-[#F3E8FF] text-[#6D28D9] rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-[#EDE9FE] transition-colors"
              >
                <span className="flex items-center gap-2">
                  <span>{BAYONNOMA_TYPES.find(b => b.value === kind)?.icon}</span>
                  {bayonnomaLabel(kind)}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${typeOpen ? 'rotate-180' : ''}`} />
              </button>
              {typeOpen && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-lg overflow-hidden">
                  <div className="max-h-72 overflow-y-auto">
                    {BAYONNOMA_TYPES.map(b => (
                      <button
                        key={b.value}
                        onClick={() => { setKind(b.value); setTypeOpen(false) }}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm text-left hover:bg-[#F3E8FF] transition-colors ${
                          kind === b.value ? 'bg-[#F3E8FF] text-[#7C3AED] font-medium' : 'text-[#374151]'
                        }`}
                      >
                        <span className="shrink-0">{b.icon}</span>
                        {bayonnomaLabel(b.value)}
                        {kind === b.value && <Check className="w-3.5 h-3.5 ml-auto text-[#7C3AED]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Asosiy ma'lumotlar */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
            <p className="text-sm font-medium text-[#374151]">{t('malumotlar')}</p>

            {error && (
              <div className="text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('bayonnomaRaqami')} value={form.raqam}
                onChange={v => { update('raqam', v); if (v.trim()) setError('') }} placeholder="001" required
                error={!!error && !form.raqam.trim()} />
              <Field label={t('sana')} value={form.sana} type="date"
                onChange={v => { update('sana', v); if (v) setError('') }} required
                error={!!error && !form.sana} />
            </div>

            {!isQabulTopshirish && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('vaqtBoshlanish')} value={form.vaqtBoshlanish || ''}
                  onChange={v => update('vaqtBoshlanish', v)} placeholder="10:00" />
                <Field label={t('vaqtTugash')} value={form.vaqtTugash || ''}
                  onChange={v => update('vaqtTugash', v)} placeholder="12:30" />
              </div>
            )}

            <Field label={t('joyi')} value={form.joy || ''}
              onChange={v => update('joy', v)} placeholder={t('joyiPlace')} />

            <Field label={t('tashkilotNomi')} value={form.orgNomi}
              onChange={v => { update('orgNomi', v); if (v.trim()) setError('') }} placeholder={t('tashkilotNomi')}
              error={!!error && !form.orgNomi.trim()} />

            {isQabulTopshirish ? (
              <>
                <Field label={t('topshiruvchi')} value={form.rahbar}
                  onChange={v => update('rahbar', v)} placeholder={t('fio')} />
                <Field label={t('qabulQiluvchi')} value={form.kotib}
                  onChange={v => update('kotib', v)} placeholder={t('fio')} />
                <TextareaField label={t('topshirildi')} value={form.mavzu}
                  onChange={v => update('mavzu', v)} placeholder={t('topshirildiPlace')} />
                <TextareaField label={t('holatiMiqdori')} value={form.muhokama}
                  onChange={v => update('muhokama', v)} placeholder={t('holatiPlace')} />
                <TextareaField label={t('izohlarQarorlar')} value={form.qaror}
                  onChange={v => update('qaror', v)} placeholder={t('qarorlar')} />
                <TextareaField label={t('komissiyaAzolari')} value={form.taklifEtilganlar || ''}
                  onChange={v => update('taklifEtilganlar', v)} placeholder={t('komissiyaAzolariPlace')} />
              </>
            ) : (
              <>
                <Field label={t('yigilishRaisi')} value={form.rahbar}
                  onChange={v => update('rahbar', v)} placeholder={t('fio')} />
                <Field label={t('kotib')} value={form.kotib}
                  onChange={v => update('kotib', v)} placeholder={t('fio')} />

                <div className="grid grid-cols-2 gap-3">
                  <Field label={t('kvorumJami')} value={form.kvorumJami || ''}
                    onChange={v => update('kvorumJami', v)} placeholder="12" />
                  <Field label={t('kvorumKelgan')} value={form.kvorumKelgan || ''}
                    onChange={v => update('kvorumKelgan', v)} placeholder="10" />
                </div>

                {employees.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-[#64748B] mb-1">{t('xodimlarQoshish')}</label>
                    <select
                      defaultValue=""
                      onChange={e => {
                        const emp = employees.find((x: any) => x.id === e.target.value)
                        if (emp) appendEmployee(emp)
                        e.target.value = ''
                      }}
                      className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#A78BFA] transition bg-[#F3E8FF] text-[#6D28D9]"
                    >
                      <option value="" disabled>{t('xodimTanlashJoy')}</option>
                      {employees.map((emp: any) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.ism}{emp.lavozim ? ` — ${emp.lavozim}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <TextareaField label={t('ishtirokchilar')} value={form.ishtirokchilar}
                  onChange={v => update('ishtirokchilar', v)} placeholder={t('ishtirokchilarPlace')} rows={4} />
                <TextareaField label={t('taklifEtilganlar')} value={form.taklifEtilganlar || ''}
                  onChange={v => update('taklifEtilganlar', v)} placeholder={t('taklifEtilganlarPlace')} rows={2} />

                {kind === 'BOSHQA' && (
                  <Field label={t('mavzu')} value={form.mavzu}
                    onChange={v => update('mavzu', v)} placeholder={t('yigilishMavzusi')} />
                )}
              </>
            )}
          </div>

          {/* Kun tartibi */}
          {!isQabulTopshirish && (
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-[#374151]">{t('kunTartibi')}</p>
                <button
                  onClick={addAgenda}
                  className="flex items-center gap-1.5 text-xs text-[#7C3AED] hover:text-[#6D28D9] border border-[#DDD6FE] hover:border-[#C4B5FD] px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('masalaQoshish')}
                </button>
              </div>

              <div className="space-y-4">
                {form.kunTartibi.map((it, i) => (
                  <div key={i} className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#7C3AED]">
                        {t('masalaN', { n: i + 1 })}
                      </span>
                      {form.kunTartibi.length > 1 && (
                        <button
                          onClick={() => removeAgenda(i)}
                          className="text-[#CBD5E1] hover:text-[#DC2626] transition-colors p-1"
                          title={t('masalaOchirish')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <Field label={t('masala')} value={it.masala}
                      onChange={v => updateAgenda(i, 'masala', v)} placeholder={t('masalaPlace')} />
                    <TextareaField label={t('eshitildi')} value={it.eshitildi}
                      onChange={v => updateAgenda(i, 'eshitildi', v)} placeholder={t('eshitildiPlace')} rows={3} />
                    <TextareaField label={t('muhokamaQilindi')} value={it.muhokama}
                      onChange={v => updateAgenda(i, 'muhokama', v)} placeholder={t('muhokamaPlace')} rows={3} />
                    <Field label={t('ovozBerish')} value={it.ovoz}
                      onChange={v => updateAgenda(i, 'ovoz', v)} placeholder={t('ovozBerishPlace')} />
                    <TextareaField label={t('qaror')} value={it.qaror}
                      onChange={v => updateAgenda(i, 'qaror', v)} placeholder={t('qarorPlace')} rows={3} />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label={t('masulShaxs')} value={it.masulShaxs || ''}
                        onChange={v => updateAgenda(i, 'masulShaxs', v)} placeholder={t('fio')} />
                      <Field label={t('ijroMuddati')} value={it.ijroMuddati || ''}
                        onChange={v => updateAgenda(i, 'ijroMuddati', v)} placeholder="dd.mm.yyyy" />
                    </div>
                  </div>
                ))}
              </div>

              <TextareaField label={t('ilovalar')} value={form.ilovalar || ''}
                onChange={v => update('ilovalar', v)} placeholder={t('ilovalarPlace')} rows={2} />
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => { setTplName(''); setShowTplModal(true) }}
              className="flex items-center gap-2 justify-center bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              <BookMarked className="w-4 h-4" /> Shablon saqlash
            </button>
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="flex items-center gap-2 flex-1 justify-center bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t('qoralama')}
            </button>
            <button
              onClick={() => handleSave('FINAL')}
              disabled={saving}
              className="flex items-center gap-2 flex-1 justify-center bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {t('saqlash')}
            </button>
          </div>

          {showTplModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
              <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm space-y-4">
                <h3 className="font-semibold text-[#0F172A] flex items-center gap-2">
                  <BookMarked className="w-4 h-4 text-[#F59E0B]" /> Shablon nomini kiriting
                </h3>
                <input
                  autoFocus
                  value={tplName}
                  onChange={e => setTplName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && tplName.trim() && saveTplMut.mutate(tplName.trim())}
                  placeholder="Masalan: Aksiyadorlar yig'ilishi"
                  className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/20 focus:border-[#F59E0B] transition"
                />
                <p className="text-xs text-[#94A3B8]">
                  Keyingi safar shu shablon tanlansa, barcha maydonlar avto-to'ladi.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowTplModal(false)}
                    className="flex-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#374151] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    Bekor
                  </button>
                  <button
                    onClick={() => tplName.trim() && saveTplMut.mutate(tplName.trim())}
                    disabled={!tplName.trim() || saveTplMut.isPending}
                    className="flex-1 bg-[#FFFBEB]0 hover:bg-[#D97706] text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    Saqlash
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-medium text-[#374151] flex items-center gap-2">
              <Eye className="w-4 h-4" /> {t('korinish')}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFullscreen(true)}
                className="flex items-center gap-1.5 text-xs text-[#374151] hover:text-[#1D4ED8] border border-[#E2E8F0] hover:border-[#93C5FD] px-2.5 py-1.5 rounded-lg transition-colors">
                <Maximize2 className="w-3.5 h-3.5" /> {t('fullScreen')}
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-gray-800 border border-[#E2E8F0] px-2.5 py-1.5 rounded-lg transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('nusxaOlindi') : t('nusxa')}
              </button>
              <button onClick={handleDocx} disabled={!!exporting}
                className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1E40AF] border border-[#BFDBFE] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {exporting === 'docx' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} {t('word')}
              </button>
              <button onClick={handlePdf} disabled={!!exporting}
                className="flex items-center gap-1.5 text-xs text-[#DC2626] hover:text-[#991B1B] border border-[#FECACA] px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                {exporting === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />} {t('pdf')}
              </button>
            </div>
          </div>
          <div className="bg-[#F1F5F9] rounded-2xl py-6 px-3 min-h-[700px]">
            <div className="bg-white shadow-md mx-auto rounded-sm" style={{ minHeight: 700, maxWidth: '100%' }}>
              {previewHtml
                ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                : <div className="p-8 text-[#94A3B8] text-sm" style={{ fontFamily: '"Times New Roman", serif' }}>{t('malumotlarToldiring')}</div>
              }
            </div>
          </div>
        </div>
      </div>

      <FullscreenPreview
        open={fullscreen}
        onClose={() => setFullscreen(false)}
        title={t('korinish')}
        html={previewHtml || undefined}
        emptyText={t('malumotlarToldiring')}
        toolbar={
          <>
            <button
              disabled={!!exporting}
              onClick={handleDocx}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 transition"
            >
              {exporting === 'docx' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {t('word')}
            </button>
            <button
              disabled={!!exporting}
              onClick={handlePdf}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-white/10 hover:bg-white/20 disabled:opacity-50 transition"
            >
              {exporting === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {t('pdf')}
            </button>
          </>
        }
      />
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', required, error }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; required?: boolean; error?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">
        {label}{required && <span className="text-[#FCA5A5] ml-0.5">*</span>}
      </label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
          error
            ? 'border-[#DC2626] focus:ring-[#DC2626]/20 focus:border-[#DC2626]'
            : 'border-[#E2E8F0] focus:ring-[#7C3AED]/20 focus:border-[#A78BFA]'
        }`}
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#A78BFA] transition resize-none"
      />
    </div>
  )
}
