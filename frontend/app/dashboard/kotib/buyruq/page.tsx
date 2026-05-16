'use client'

import { useState, useMemo }                              from 'react'
import { useTranslations }                                from 'next-intl'
import { useQuery, useMutation, useQueryClient }          from '@tanstack/react-query'
import { PageHeader }         from '@/components/layout/PageHeader'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import { Card }               from '@/components/ui/Card'
import { Modal }              from '@/components/ui/Modal'
import { EmptyState }         from '@/components/ui/Skeleton'
import { useAuth }            from '@/hooks/useAuth'
import api                    from '@/lib/api'
import {
  BUYRUQ_TYPES, BUYRUQ_TEMPLATES, BuyruqData,
} from '@/lib/kotibTemplates'
import { exportContractPdf }  from '@/lib/export/contractPdf'
import { exportContractDocx } from '@/lib/export/contractDocx'
import { printHtml }          from '@/lib/printDocument'
import { renderKotibHtml }    from '@/lib/renderKotibHtml'
import { format }             from 'date-fns'
import { cn }                 from '@/lib/cn'
import {
  Plus, FileText, Trash2, Download, Copy, Check,
  ChevronLeft, Eye, Save, Maximize2, Printer, BookMarked, X,
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

const STATUS_CLS: Record<string, string> = {
  DRAFT: 'bg-[#F1F5F9] text-[#475569]',
  FINAL: 'bg-[#DCFCE7] text-[#16A34A]',
  SENT:  'bg-[#DBEAFE] text-[#1D4ED8]',
}

const EMPTY_DATA: BuyruqData = {
  raqam: '', sana: format(new Date(), 'yyyy-MM-dd'),
  orgNomi: '', orgRahbar: '', xodimIsm: '', xodimLavozim: '',
  xodimBolim: '', maosh: '', sabab: '', ishBoshi: '', ishOxiri: '',
  asosiy: '', qoshimcha: '', mavzu: '',
}

export default function BuyruqPage() {
  const t = useTranslations('secretary')
  const { currentOrg: activeOrg }   = useAuth()
  const qc                          = useQueryClient()
  const [step, setStep]             = useState<Step>('list')
  const [fullscreen, setFullscreen] = useState(false)
  const [kind, setKind]             = useState(BUYRUQ_TYPES[0].value)
  const [form, setForm]             = useState<BuyruqData>({ ...EMPTY_DATA })
  const [copied, setCopied]         = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toDelete, setToDelete]     = useState<string | null>(null)
  const [error, setError]           = useState('')
  const [showTplModal, setShowTplModal] = useState(false)
  const [tplName, setTplName]           = useState('')

  const buyruqLabel = (val: string) => t(`buyruqType_${val}` as any)

  const STATUS_LBL: Record<string, string> = {
    DRAFT: t('statusDraft'),
    FINAL: t('statusFinal'),
    SENT:  t('statusSent'),
  }

  const { data: docs = [], isLoading } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id, 'BUYRUQ'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BUYRUQ&limit=100`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees', activeOrg?.id],
    queryFn:  () => api.get(`/employees?orgId=${activeOrg!.id}&limit=200`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const { data: myTemplates = [] } = useQuery<any[]>({
    queryKey: ['user-templates', activeOrg?.id, 'BUYRUQ'],
    queryFn:  async () => {
      const res = await api.get(`/user-templates?orgId=${activeOrg!.id}&limit=100`)
      return (res.data.data || []).filter((t: any) => {
        try { return JSON.parse(t.rawContent || '{}').docModule === 'BUYRUQ' }
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
  })

  const updateStatusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.put(`/documents/${id}?orgId=${activeOrg!.id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['documents', activeOrg?.id] }),
  })

  const saveTplMut = useMutation({
    mutationFn: (name: string) => api.post('/user-templates', {
      organizationId: activeOrg!.id,
      name,
      source: 'CUSTOM',
      rawContent: JSON.stringify({ docModule: 'BUYRUQ', kind, data: form }),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-templates', activeOrg?.id, 'BUYRUQ'] })
      setShowTplModal(false)
      setTplName('')
    },
  })

  const deleteTplMut = useMutation({
    mutationFn: (id: string) => api.delete(`/user-templates/${id}?orgId=${activeOrg!.id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['user-templates', activeOrg?.id, 'BUYRUQ'] }),
  })

  function applyTemplate(tpl: any) {
    try {
      const { kind: k, data } = JSON.parse(tpl.rawContent || '{}')
      if (k) setKind(k)
      if (data) setForm({ ...data, sana: format(new Date(), 'yyyy-MM-dd'), raqam: '' })
    } catch {}
  }

  function applyEmployee(emp: any) {
    setForm(p => ({
      ...p,
      xodimIsm:     emp.ism      || p.xodimIsm,
      xodimLavozim: emp.lavozim  || p.xodimLavozim,
      xodimBolim:   emp.bolim    || p.xodimBolim,
      maosh:        emp.maosh    || p.maosh,
      ishBoshi:     emp.ishBoshi || p.ishBoshi,
    }))
  }

  const displayForm = useMemo(() => ({ ...form, sana: toDmy(form.sana) }), [form])
  const preview     = useMemo(() => {
    try { return BUYRUQ_TEMPLATES[kind]?.(displayForm) ?? '' } catch { return '' }
  }, [kind, displayForm])
  const previewHtml = useMemo(() => preview ? renderKotibHtml(preview) : '', [preview])

  function updateForm(k: keyof BuyruqData, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function initNew() {
    setForm({
      ...EMPTY_DATA,
      sana:      format(new Date(), 'yyyy-MM-dd'),
      orgNomi:   activeOrg?.name        ?? '',
      orgRahbar: activeOrg?.directorName ?? '',
    })
    setKind(BUYRUQ_TYPES[0].value)
    setError('')
    setStep('form')
  }

  async function handleSave(status: 'DRAFT' | 'FINAL') {
    if (!activeOrg) return
    if (!form.raqam.trim()) { setError(t('raqamMajburiy') || 'Buyruq raqami kiritilishi shart'); return }
    if (!form.sana)         { setError(t('sanaMajburiy')  || 'Sana kiritilishi shart'); return }
    setError('')
    setSaving(true)
    try {
      const typeLabel = buyruqLabel(kind)
      await api.post('/documents', {
        organizationId: activeOrg.id,
        type:           'BUYRUQ',
        title:          `${typeLabel} — ${form.xodimIsm || form.mavzu || form.raqam}`,
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

  async function handlePdf()  {
    await exportContractPdf({ title: `${buyruqLabel(kind)} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
  }
  async function handleDocx() {
    await exportContractDocx({ title: `${buyruqLabel(kind)} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
  }
  function handleCopy() {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  /* ─── LIST ─── */
  if (step === 'list') return (
    <div>
      <PageHeader
        title={t('buyruqlar')}
        description={t('buyruqlarDesc')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('kotib'),  path: '/dashboard/kotib' },
          { label: t('buyruqlar') },
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={initNew}>
            {t('yangiBuyruq')}
          </Button>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : docs.length === 0 ? (
        <EmptyState
          icon={<FileText size={28} />}
          title={t('buyruqlarYoq')}
          description={t('yangiBuyruqYarating')}
          action={{ label: t('yangiBuyruq'), onClick: initNew }}
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {[t('raqam'), t('sarlavha'), t('sana'), t('status'), ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {docs.map(d => (
                  <tr
                    key={d.id}
                    className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group cursor-pointer"
                    onClick={() => window.location.href = `/dashboard/hujjat/${d.id}`}
                  >
                    <td className="px-4 py-3 text-sm font-mono text-[#2563EB]">{d.number}</td>
                    <td className="px-4 py-3 text-sm font-medium text-[#0F172A] max-w-[220px] truncate" title={d.title}>{d.title}</td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{d.docDate || format(new Date(d.createdAt), 'dd.MM.yyyy')}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); updateStatusMut.mutate({ id: d.id, status: nextStatus(d.status) }) }}
                        className={cn('text-xs font-medium px-2.5 py-1 rounded-full hover:opacity-75 transition-opacity', STATUS_CLS[d.status] ?? STATUS_CLS.DRAFT)}
                        title={t('holatniOzgartirish')}
                      >
                        {STATUS_LBL[d.status] ?? d.status}
                      </button>
                    </td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      {toDelete === d.id ? (
                        <div className="flex items-center gap-3 justify-end">
                          <button onClick={() => deleteMut.mutate(d.id)} className="text-xs font-medium text-[#DC2626] hover:underline">
                            {t('haOchir')}
                          </button>
                          <button onClick={() => setToDelete(null)} className="text-xs text-[#94A3B8] hover:underline">
                            {t('bekor')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setToDelete(d.id)}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded-lg text-[#CBD5E1] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                        >
                          <Trash2 size={14} />
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
    </div>
  )

  /* ─── FORM ─── */
  return (
    <div>
      <PageHeader
        title={t('yangiBuyruq')}
        description={buyruqLabel(kind)}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('kotib'),  path: '/dashboard/kotib' },
          { label: t('buyruqlar'), onClick: () => setStep('list') },
          { label: t('yangiBuyruq') },
        ]}
        actions={
          <Button variant="outline" size="sm" leftIcon={<ChevronLeft size={14} />} onClick={() => setStep('list')}>
            {t('back')}
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Left: form ─── */}
        <div className="space-y-4">
          {/* My templates */}
          {myTemplates.length > 0 && (
            <div className="bg-[#FEF3C7] border border-[#FDE68A] rounded-xl p-4">
              <p className="text-xs font-semibold text-[#92400E] mb-2.5 flex items-center gap-1.5">
                <BookMarked size={13} /> {t('meningShablonlarim')}
              </p>
              <div className="flex flex-wrap gap-2">
                {myTemplates.map(tpl => (
                  <div key={tpl.id} className="flex items-center gap-1 bg-white border border-[#FDE68A] rounded-lg px-2.5 py-1.5">
                    <button
                      onClick={() => applyTemplate(tpl)}
                      className="text-xs font-medium text-[#92400E] hover:text-[#78350F] transition-colors"
                    >
                      {tpl.name}
                    </button>
                    <button
                      onClick={() => deleteTplMut.mutate(tpl.id)}
                      className="text-[#CBD5E1] hover:text-[#DC2626] transition-colors ml-1"
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Buyruq type */}
          <Card>
            <p className="text-sm font-semibold text-[#0F172A] mb-3">{t('buyruqTuri')}</p>
            <div className="grid grid-cols-2 gap-2">
              {BUYRUQ_TYPES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setKind(b.value)}
                  className={cn(
                    'flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all text-left',
                    kind === b.value
                      ? 'border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]'
                      : 'border-[#E2E8F0] hover:border-[#2563EB]/40 text-[#475569]'
                  )}
                >
                  <span>{b.icon}</span> {buyruqLabel(b.value)}
                </button>
              ))}
            </div>
          </Card>

          {/* Form fields */}
          <Card>
            <p className="text-sm font-semibold text-[#0F172A] mb-4">{t('malumotlar')}</p>

            {error && (
              <div className="mb-4 text-xs text-[#DC2626] bg-[#FEF2F2] border border-[#FECACA] rounded-xl px-3 py-2.5">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label={t('buyruqRaqami')} value={form.raqam}
                  onChange={e => updateForm('raqam', e.target.value)} placeholder="001" required />
                <Input label={t('sana')} type="date" value={form.sana}
                  onChange={e => updateForm('sana', e.target.value)} required />
              </div>

              <Input label={t('tashkilotNomi')} value={form.orgNomi}
                onChange={e => updateForm('orgNomi', e.target.value)} placeholder={t('tashkilotNomi')} />
              <Input label={t('rahbarFio')} value={form.orgRahbar}
                onChange={e => updateForm('orgRahbar', e.target.value)} placeholder={t('rahbarIsmi')} />

              {employees.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#475569]">{t('xodimTanlash')}</label>
                  <select
                    defaultValue=""
                    onChange={e => {
                      const emp = employees.find((x: any) => x.id === e.target.value)
                      if (emp) applyEmployee(emp)
                      e.target.value = ''
                    }}
                    className="w-full h-10 rounded-lg text-sm px-3 bg-[#DBEAFE] text-[#1D4ED8] border border-[#BFDBFE] focus:outline-none focus:border-[#2563EB] transition"
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

              <Input label={t('xodimFio')} value={form.xodimIsm}
                onChange={e => updateForm('xodimIsm', e.target.value)} placeholder={t('xodimIsmi')} />
              <Input label={t('lavozim')} value={form.xodimLavozim}
                onChange={e => updateForm('xodimLavozim', e.target.value)} placeholder={t('lavozim')} />

              {['ISHGA_QABUL', 'LAVOZIM_OZGARTIRISH'].includes(kind) && (
                <>
                  <Input label={t('bolim')} value={form.xodimBolim ?? ''}
                    onChange={e => updateForm('xodimBolim', e.target.value)} placeholder={t('bolimNomi')} />
                  <Input label={t('ishBoshlashSanasi')} value={form.ishBoshi ?? ''}
                    onChange={e => updateForm('ishBoshi', e.target.value)} placeholder="dd.mm.yyyy" />
                  <Input label={t('maoshSom')} value={form.maosh ?? ''}
                    onChange={e => updateForm('maosh', e.target.value)} placeholder="5 000 000" />
                </>
              )}

              {kind === 'ISHDAN_BOSHATISH' && (
                <>
                  <Input label={t('ishdanBoshatishSanasi')} value={form.ishOxiri ?? ''}
                    onChange={e => updateForm('ishOxiri', e.target.value)} placeholder="dd.mm.yyyy" />
                  <Input label={t('sabab')} value={form.sabab ?? ''}
                    onChange={e => updateForm('sabab', e.target.value)} placeholder={t('sababiPlace')} />
                </>
              )}

              {kind === 'MUKOFOT' && (
                <>
                  <Input label={t('sabab')} value={form.sabab ?? ''}
                    onChange={e => updateForm('sabab', e.target.value)} placeholder={t('vijdonliMehnat')} />
                  <Input label={t('mukofotMiqdori')} value={form.maosh ?? ''}
                    onChange={e => updateForm('maosh', e.target.value)} placeholder="1 000 000" />
                </>
              )}

              {kind === 'BOSHQA' && (
                <>
                  <Input label={t('mavzu')} value={form.mavzu ?? ''}
                    onChange={e => updateForm('mavzu', e.target.value)} placeholder={t('buyruqMavzusi')} />
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-[#475569]">{t('mazmun')}</label>
                    <textarea
                      value={form.sabab ?? ''}
                      onChange={e => updateForm('sabab', e.target.value)}
                      placeholder={t('buyruqMazmuni')}
                      rows={3}
                      className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB] transition resize-none"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#475569]">{t('qoshimcha')}</label>
                <textarea
                  value={form.qoshimcha ?? ''}
                  onChange={e => updateForm('qoshimcha', e.target.value)}
                  placeholder={t('qoshimchaBandlar')}
                  rows={3}
                  className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:border-[#2563EB] transition resize-none"
                />
              </div>
              <Input label={t('asos')} value={form.asosiy ?? ''}
                onChange={e => updateForm('asosiy', e.target.value)} placeholder={t('mehnatShartnomasi')} />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BookMarked size={13} />}
              onClick={() => { setTplName(''); setShowTplModal(true) }}
            >
              {t('sablonSaqlash')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Save size={13} />}
              loading={saving}
              onClick={() => handleSave('DRAFT')}
              className="flex-1"
            >
              {t('qoralama')}
            </Button>
            <Button
              size="sm"
              leftIcon={<Check size={13} />}
              loading={saving}
              onClick={() => handleSave('FINAL')}
              className="flex-1"
            >
              {t('saqlash')}
            </Button>
          </div>
        </div>

        {/* ─── Right: preview ─── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-sm font-semibold text-[#0F172A] flex items-center gap-2">
              <Eye size={15} className="text-[#94A3B8]" /> {t('korinish')}
            </p>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setFullscreen(true)}
                className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#2563EB] border border-[#E2E8F0] hover:border-[#2563EB]/30 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Maximize2 size={13} /> {t('fullScreen')}
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#0F172A] border border-[#E2E8F0] px-2.5 py-1.5 rounded-lg transition-colors"
              >
                {copied ? <Check size={13} className="text-[#16A34A]" /> : <Copy size={13} />}
                {copied ? t('nusxaOlindi') : t('nusxa')}
              </button>
              <button
                onClick={handleDocx}
                className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] border border-[#BFDBFE] px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Download size={13} /> {t('word')}
              </button>
              <button
                onClick={handlePdf}
                className="flex items-center gap-1.5 text-xs text-[#DC2626] hover:text-[#B91C1C] border border-[#FECACA] px-2.5 py-1.5 rounded-lg transition-colors"
              >
                <Download size={13} /> {t('pdf')}
              </button>
            </div>
          </div>
          <div className="bg-[#F1F5F9] rounded-xl py-6 px-3 min-h-[700px]">
            <div className="bg-white shadow-md mx-auto rounded-sm" style={{ minHeight: 700, maxWidth: '100%' }}>
              {previewHtml
                ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                : <div className="p-8 text-[#94A3B8] text-sm" style={{ fontFamily: '"Times New Roman", serif' }}>
                    {t('malumotlarToldiring')}
                  </div>
              }
            </div>
          </div>
        </div>
      </div>

      {/* ─── Fullscreen preview ─── */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col">
          <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0">
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">{t('back')}</span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <p className="text-sm font-semibold">{t('korinish')}</p>
            <div className="flex-1" />
            <button onClick={() => printHtml(previewHtml)} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Printer size={14} /><span className="hidden sm:inline">{t('print')}</span>
            </button>
            <button onClick={handleDocx} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Download size={14} /><span className="hidden sm:inline">{t('word')}</span>
            </button>
            <button onClick={handlePdf} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Download size={14} /><span className="hidden sm:inline">{t('pdf')}</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
              <div className="bg-white shadow-2xl" style={{ width: '794px', minHeight: '1123px' }}>
                {previewHtml
                  ? <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  : <div className="p-12 text-[#94A3B8] text-sm">{t('malumotlarToldiring')}</div>
                }
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Save template modal ─── */}
      <Modal
        open={showTplModal}
        onClose={() => setShowTplModal(false)}
        title={t('sablonNominiKiriting')}
        size="sm"
        footer={
          <div className="flex gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => setShowTplModal(false)} className="flex-1">
              {t('bekor')}
            </Button>
            <Button
              size="sm"
              disabled={!tplName.trim()}
              loading={saveTplMut.isPending}
              onClick={() => tplName.trim() && saveTplMut.mutate(tplName.trim())}
              className="flex-1"
            >
              {t('saqlash')}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <Input
            autoFocus
            value={tplName}
            onChange={e => setTplName(e.target.value)}
            onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && tplName.trim() && saveTplMut.mutate(tplName.trim())}
            placeholder={t('sablonNomiPlace')}
          />
          <p className="text-xs text-[#94A3B8]">{t('sablonHint')}</p>
        </div>
      </Modal>
    </div>
  )
}
