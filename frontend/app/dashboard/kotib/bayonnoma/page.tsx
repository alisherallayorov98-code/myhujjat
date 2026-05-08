'use client'

import { useState, useMemo }                     from 'react'
import { useRouter }                             from 'next/navigation'
import { useTranslations }                       from 'next-intl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth }                           from '@/hooks/useAuth'
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
import {
  Plus, Users, Trash2, Download, Copy, Check,
  ChevronLeft, Eye, Save, Maximize2, Printer,
} from 'lucide-react'

interface DocRow {
  id: string; type: string; title: string; number: string
  docDate: string; status: string; createdAt: string
}

type Step = 'list' | 'form'

const EMPTY: BayonnomData = {
  raqam: '', sana: format(new Date(), 'dd.MM.yyyy'),
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
  const router          = useRouter()
  const { currentOrg: activeOrg } = useAuth()
  const qc              = useQueryClient()
  const [step, setStep] = useState<Step>('list')
  const [fullscreen, setFullscreen] = useState(false)
  const [kind, setKind] = useState(BAYONNOMA_TYPES[0].value)
  const [form, setForm] = useState<BayonnomData>({ ...EMPTY })
  const [copied, setCopied]  = useState(false)
  const [saving, setSaving]  = useState(false)

  const bayonnomaLabel = (val: string) => t(`bayonnomaType_${val}` as any)
  const isQabulTopshirish = kind === 'QABUL_TOPSHIRISH'

  const { data: docs = [], isLoading } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id, 'BAYONNOMA'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BAYONNOMA&limit=100`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}?orgId=${activeOrg!.id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents', activeOrg?.id] }),
  })

  const preview = useMemo(() => {
    try { return BAYONNOMA_TEMPLATES[kind]?.(form) ?? '' } catch { return '' }
  }, [kind, form])

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
      kunTartibi: [newAgendaItem()],
      orgNomi: activeOrg?.name ?? '',
      rahbar:  activeOrg?.directorName ?? '',
      joy:     activeOrg?.address ?? '',
    })
    setKind(BAYONNOMA_TYPES[0].value)
    setStep('form')
  }

  async function handleSave(status: 'DRAFT' | 'FINAL') {
    if (!activeOrg) return
    setSaving(true)
    try {
      const typeLabel = bayonnomaLabel(kind)
      const titleHint = isQabulTopshirish ? form.mavzu : (form.kunTartibi[0]?.masala || form.mavzu)
      await api.post('/documents', {
        organizationId: activeOrg.id,
        type:           'BAYONNOMA',
        title:          `${typeLabel} — ${titleHint || form.raqam}`,
        number:         form.raqam,
        docDate:        form.sana,
        // text — saved rendered preview; data — structured form for re-editing later
        content:        { kind, text: preview, data: form },
        status,
      })
      qc.invalidateQueries({ queryKey: ['documents', activeOrg.id] })
      setStep('list')
    } finally {
      setSaving(false)
    }
  }

  async function handlePdf() {
    const label = bayonnomaLabel(kind)
    await exportContractPdf({ title: `${label} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
  }

  async function handleDocx() {
    const label = bayonnomaLabel(kind)
    await exportContractDocx({ title: `${label} № ${form.raqam}`, content: preview, orgName: form.orgNomi })
  }

  function handleCopy() {
    navigator.clipboard.writeText(preview)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const STATUS_CLS: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    FINAL: 'bg-green-100 text-green-700',
    SENT:  'bg-blue-100 text-blue-700',
  }
  const STATUS_LBL: Record<string, string> = {
    DRAFT: t('statusDraft'),
    FINAL: t('statusFinal'),
    SENT:  t('statusSent'),
  }

  if (step === 'list') return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('bayonnomalar')}</h1>
        <button
          onClick={initNew}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('yangiBayonnoma')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">{t('yuklanmoqda')}</div>
        ) : docs.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{t('bayonnomalarYoq')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('yangiBayonnomaYarating')}</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-gray-100">
                <th className="px-5 py-3 font-medium text-gray-500">{t('raqam')}</th>
                <th className="px-5 py-3 font-medium text-gray-500">{t('sarlavha')}</th>
                <th className="px-5 py-3 font-medium text-gray-500">{t('sana')}</th>
                <th className="px-5 py-3 font-medium text-gray-500">{t('status')}</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {docs.map(d => (
                <tr
                  key={d.id}
                  onClick={() => router.push(`/dashboard/hujjat/${d.id}`)}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-5 py-3 text-gray-500">{d.number}</td>
                  <td className="px-5 py-3 font-medium text-gray-900">{d.title}</td>
                  <td className="px-5 py-3 text-gray-500">{d.docDate || format(new Date(d.createdAt), 'dd.MM.yyyy')}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_CLS[d.status] ?? STATUS_CLS.DRAFT}`}>
                      {STATUS_LBL[d.status] ?? d.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteMut.mutate(d.id)
                      }}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
        <button onClick={() => setStep('list')} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('yangiBayonnoma')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          {/* Bayonnoma turi */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('bayonnomaTuri')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {BAYONNOMA_TYPES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setKind(b.value)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-medium transition-all text-left ${
                    kind === b.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span className="shrink-0">{b.icon}</span>
                  <span className="truncate">{bayonnomaLabel(b.value)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Asosiy ma'lumotlar */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700">{t('malumotlar')}</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('bayonnomaRaqami')} value={form.raqam}
                onChange={v => update('raqam', v)} placeholder="001" />
              <Field label={t('sana')} value={form.sana}
                onChange={v => update('sana', v)} placeholder="dd.mm.yyyy" />
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
              onChange={v => update('orgNomi', v)} placeholder={t('tashkilotNomi')} />

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

          {/* Kun tartibi (faqat QABUL_TOPSHIRISH bo'lmaganda) */}
          {!isQabulTopshirish && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-700">{t('kunTartibi')}</p>
                <button
                  onClick={addAgenda}
                  className="flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 border border-purple-200 hover:border-purple-300 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> {t('masalaQoshish')}
                </button>
              </div>

              <div className="space-y-4">
                {form.kunTartibi.map((it, i) => (
                  <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-700">
                        {t('masalaN', { n: i + 1 })}
                      </span>
                      {form.kunTartibi.length > 1 && (
                        <button
                          onClick={() => removeAgenda(i)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
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

          <div className="flex gap-3">
            <button
              onClick={() => handleSave('DRAFT')}
              disabled={saving}
              className="flex items-center gap-2 flex-1 justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {t('qoralama')}
            </button>
            <button
              onClick={() => handleSave('FINAL')}
              disabled={saving}
              className="flex items-center gap-2 flex-1 justify-center bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> {t('saqlash')}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Eye className="w-4 h-4" /> {t('korinish')}
            </p>
            <div className="flex gap-2 flex-wrap">
              <button onClick={() => setFullscreen(true)}
                className="flex items-center gap-1.5 text-xs text-gray-700 hover:text-blue-700 border border-gray-200 hover:border-blue-300 px-2.5 py-1.5 rounded-lg transition-colors">
                <Maximize2 className="w-3.5 h-3.5" /> {t('fullScreen')}
              </button>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 px-2.5 py-1.5 rounded-lg transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? t('nusxaOlindi') : t('nusxa')}
              </button>
              <button onClick={handleDocx}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 border border-blue-200 px-2.5 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" /> {t('word')}
              </button>
              <button onClick={handlePdf}
                className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 border border-red-200 px-2.5 py-1.5 rounded-lg transition-colors">
                <Download className="w-3.5 h-3.5" /> {t('pdf')}
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

      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col">
          <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0">
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">{t('back')}</span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <p className="text-sm font-semibold">{t('korinish')}</p>
            <div className="flex-1" />
            <button onClick={() => printHtml(previewHtml)} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Printer className="w-4 h-4" /><span className="hidden sm:inline">{t('print')}</span>
            </button>
            <button onClick={handleDocx} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" /><span className="hidden sm:inline">{t('word')}</span>
            </button>
            <button onClick={handlePdf} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" /><span className="hidden sm:inline">{t('pdf')}</span>
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
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition"
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={rows}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400 transition resize-none"
      />
    </div>
  )
}
