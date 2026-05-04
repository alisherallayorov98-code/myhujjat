'use client'

import { useState, useMemo }                              from 'react'
import { useRouter }                                      from 'next/navigation'
import { useTranslations }                                from 'next-intl'
import { useQuery, useMutation, useQueryClient }          from '@tanstack/react-query'
import { useAuth }                                        from '@/hooks/useAuth'
import api from '@/lib/api'
import {
  BUYRUQ_TYPES, BUYRUQ_TEMPLATES, BuyruqData,
} from '@/lib/kotibTemplates'
import { exportContractPdf }  from '@/lib/export/contractPdf'
import { exportContractDocx } from '@/lib/export/contractDocx'
import { format }             from 'date-fns'
import {
  Plus, FileText, Trash2, Download, Copy, Check,
  ChevronLeft, Eye, Save, Maximize2, Printer,
} from 'lucide-react'

interface DocRow {
  id: string; type: string; title: string; number: string
  docDate: string; status: string; createdAt: string
}

type Step = 'list' | 'form' | 'preview'

const EMPTY_DATA: BuyruqData = {
  raqam: '', sana: format(new Date(), 'dd.MM.yyyy'),
  orgNomi: '', orgRahbar: '', xodimIsm: '', xodimLavozim: '',
  xodimBolim: '', maosh: '', sabab: '', ishBoshi: '', ishOxiri: '',
  asosiy: '', qoshimcha: '', mavzu: '',
}

export default function BuyruqPage() {
  const t = useTranslations('secretary')
  const router          = useRouter()
  const { currentOrg: activeOrg } = useAuth()
  const qc              = useQueryClient()
  const [step, setStep] = useState<Step>('list')
  const [fullscreen, setFullscreen] = useState(false)
  const [kind, setKind] = useState(BUYRUQ_TYPES[0].value)
  const [form, setForm] = useState<BuyruqData>({ ...EMPTY_DATA })
  const [copied, setCopied]   = useState(false)
  const [saving, setSaving]   = useState(false)

  const buyruqLabel = (val: string) => t(`buyruqType_${val}` as any)

  const { data: docs = [], isLoading } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id, 'BUYRUQ'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BUYRUQ&limit=100`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/documents/${id}?orgId=${activeOrg!.id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['documents', activeOrg?.id] }),
  })

  const preview = useMemo(() => {
    try { return BUYRUQ_TEMPLATES[kind]?.(form) ?? '' } catch { return '' }
  }, [kind, form])

  function updateForm(k: keyof BuyruqData, v: string) {
    setForm(p => ({ ...p, [k]: v }))
  }

  function initNew() {
    const org = activeOrg
    setForm({
      ...EMPTY_DATA,
      orgNomi:   org?.name ?? '',
      orgRahbar: org?.directorName ?? '',
    })
    setKind(BUYRUQ_TYPES[0].value)
    setStep('form')
  }

  async function handleSave(status: 'DRAFT' | 'FINAL') {
    if (!activeOrg) return
    setSaving(true)
    try {
      const typeLabel = buyruqLabel(kind)
      await api.post('/documents', {
        organizationId: activeOrg.id,
        type:           'BUYRUQ',
        title:          `${typeLabel} — ${form.xodimIsm || form.mavzu || form.raqam}`,
        docDate:        form.sana,
        content:        { kind, ...form },
        status,
      })
      qc.invalidateQueries({ queryKey: ['documents', activeOrg.id] })
      setStep('list')
    } finally {
      setSaving(false)
    }
  }

  async function handlePdf() {
    const typeLabel = buyruqLabel(kind)
    await exportContractPdf({
      title:   `${typeLabel} № ${form.raqam}`,
      content: preview,
      orgName: form.orgNomi,
    })
  }

  async function handleDocx() {
    const typeLabel = buyruqLabel(kind)
    await exportContractDocx({
      title:   `${typeLabel} № ${form.raqam}`,
      content: preview,
      orgName: form.orgNomi,
    })
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
        <h1 className="text-2xl font-bold text-gray-900">{t('buyruqlar')}</h1>
        <button
          onClick={initNew}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> {t('yangiBuyruq')}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">{t('yuklanmoqda')}</div>
        ) : docs.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-14 h-14 mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">{t('buyruqlarYoq')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('yangiBuyruqYarating')}</p>
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
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setStep('list')} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-gray-900">{t('yangiBuyruq')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-700 mb-3">{t('buyruqTuri')}</p>
            <div className="grid grid-cols-2 gap-2">
              {BUYRUQ_TYPES.map(b => (
                <button
                  key={b.value}
                  onClick={() => setKind(b.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                    kind === b.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  <span>{b.icon}</span> {buyruqLabel(b.value)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <p className="text-sm font-medium text-gray-700">{t('malumotlar')}</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('buyruqRaqami')} value={form.raqam}
                onChange={v => updateForm('raqam', v)} placeholder="001" />
              <Field label={t('sana')} value={form.sana} type="text"
                onChange={v => updateForm('sana', v)} placeholder="dd.mm.yyyy" />
            </div>

            <Field label={t('tashkilotNomi')} value={form.orgNomi}
              onChange={v => updateForm('orgNomi', v)} placeholder={t('tashkilotNomi')} />
            <Field label={t('rahbarFio')} value={form.orgRahbar}
              onChange={v => updateForm('orgRahbar', v)} placeholder={t('rahbarIsmi')} />
            <Field label={t('xodimFio')} value={form.xodimIsm}
              onChange={v => updateForm('xodimIsm', v)} placeholder={t('xodimIsmi')} />
            <Field label={t('lavozim')} value={form.xodimLavozim}
              onChange={v => updateForm('xodimLavozim', v)} placeholder={t('lavozim')} />

            {['ISHGA_QABUL', 'LAVOZIM_OZGARTIRISH'].includes(kind) && (
              <>
                <Field label={t('bolim')} value={form.xodimBolim ?? ''}
                  onChange={v => updateForm('xodimBolim', v)} placeholder={t('bolimNomi')} />
                <Field label={t('ishBoshlashSanasi')} value={form.ishBoshi ?? ''}
                  onChange={v => updateForm('ishBoshi', v)} placeholder="dd.mm.yyyy" />
                <Field label={t('maoshSom')} value={form.maosh ?? ''}
                  onChange={v => updateForm('maosh', v)} placeholder="5 000 000" />
              </>
            )}

            {kind === 'ISHDAN_BOSHATISH' && (
              <>
                <Field label={t('ishdanBoshatishSanasi')} value={form.ishOxiri ?? ''}
                  onChange={v => updateForm('ishOxiri', v)} placeholder="dd.mm.yyyy" />
                <Field label={t('sabab')} value={form.sabab ?? ''}
                  onChange={v => updateForm('sabab', v)} placeholder={t('sababiPlace')} />
              </>
            )}

            {kind === 'MUKOFOT' && (
              <>
                <Field label={t('sabab')} value={form.sabab ?? ''}
                  onChange={v => updateForm('sabab', v)} placeholder={t('vijdonliMehnat')} />
                <Field label={t('mukofotMiqdori')} value={form.maosh ?? ''}
                  onChange={v => updateForm('maosh', v)} placeholder="1 000 000" />
              </>
            )}

            {kind === 'BOSHQA' && (
              <>
                <Field label={t('mavzu')} value={form.mavzu ?? ''}
                  onChange={v => updateForm('mavzu', v)} placeholder={t('buyruqMavzusi')} />
                <TextareaField label={t('mazmun')} value={form.sabab ?? ''}
                  onChange={v => updateForm('sabab', v)} placeholder={t('buyruqMazmuni')} />
              </>
            )}

            <TextareaField label={t('qoshimcha')} value={form.qoshimcha ?? ''}
              onChange={v => updateForm('qoshimcha', v)} placeholder={t('qoshimchaBandlar')} />
            <Field label={t('asos')} value={form.asosiy ?? ''}
              onChange={v => updateForm('asosiy', v)} placeholder={t('mehnatShartnomasi')} />
          </div>

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
              className="flex items-center gap-2 flex-1 justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
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
            <div className="flex gap-2">
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
            <div
              className="bg-white shadow-md mx-auto p-8 rounded-sm whitespace-pre-wrap"
              style={{
                fontFamily: '"Times New Roman", serif',
                fontSize: 13,
                lineHeight: 1.7,
                minHeight: 700,
                maxWidth: '100%',
              }}
            >
              {preview || t('malumotlarToldiring')}
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
            <button onClick={() => window.print()} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
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
              <div
                className="bg-white shadow-2xl p-12 whitespace-pre-wrap"
                style={{
                  width: '794px',
                  minHeight: '1123px',
                  fontFamily: '"Times New Roman", serif',
                  fontSize: 14,
                  lineHeight: 1.8,
                }}
              >
                {preview || t('malumotlarToldiring')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        type={type} value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition"
      />
    </div>
  )
}

function TextareaField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <textarea
        value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} rows={3}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition resize-none"
      />
    </div>
  )
}
