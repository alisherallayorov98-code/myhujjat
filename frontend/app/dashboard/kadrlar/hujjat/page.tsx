'use client'

import { useState }                                      from 'react'
import { useTranslations }                               from 'next-intl'
import { FileText, UserCheck, UserX, ArrowRight }        from 'lucide-react'
import { useQuery }                                       from '@tanstack/react-query'
import { PageHeader }                                     from '@/components/layout/PageHeader'
import { Card }                                           from '@/components/ui/Card'
import { Button }                                         from '@/components/ui/Button'
import { Input }                                          from '@/components/ui/Input'
import { useAuth }                                        from '@/hooks/useAuth'
import api                                                from '@/lib/api'
import { exportContractPdf }                              from '@/lib/export/contractPdf'
import { exportContractDocx }                             from '@/lib/export/contractDocx'
import {
  generateIshgaQabulBuyruq,
  generateMehnatShartnoma,
  generateTatilBuyruq,
  generateIshdanBoshtirish,
  type XodimData,
} from '@/lib/kadrlarTemplates'
import { formatAmountWords } from '@/lib/formatters'
import toast                 from 'react-hot-toast'
import { cn }                from '@/lib/cn'

const today = () => new Date().toISOString().split('T')[0]

export default function HRHujjatlarPage() {
  const t = useTranslations('hr')
  const { currentOrg }  = useAuth()
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [preview, setPreview]         = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [loading, setLoading]         = useState(false)

  const HR_DOCS = [
    {
      id:    'ishga_qabul',
      name:  t('ishgaQabulName'),
      icon:  UserCheck,
      color: 'text-[#16A34A]',
      bg:    'bg-[#DCFCE7]',
      desc:  t('ishgaQabulDesc'),
    },
    {
      id:    'mehnat_shartnoma',
      name:  t('mehnatShartnomaName'),
      icon:  FileText,
      color: 'text-[#2563EB]',
      bg:    'bg-[#DBEAFE]',
      desc:  t('mehnatShartnomaDesc'),
    },
    {
      id:    'tatil',
      name:  t('tatilName'),
      icon:  FileText,
      color: 'text-[#D97706]',
      bg:    'bg-[#FEF3C7]',
      desc:  t('tatilDesc'),
    },
    {
      id:    'boshatish',
      name:  t('boshatishName'),
      icon:  UserX,
      color: 'text-[#DC2626]',
      bg:    'bg-[#FEE2E2]',
      desc:  t('boshatishDesc'),
    },
  ]

  const [form, setForm] = useState({
    xodimId:          '',
    raqam:            `HR-${new Date().getFullYear()}-001`,
    sana:             today(),
    lavozim:          '',
    bolim:            '',
    maosh:            '',
    ishBoshi:         today(),
    tatilBoshi:       '',
    tatilOxiri:       '',
    tatilKunlar:      '15',
    boshatishSana:    '',
    boshatishSababi:  "xodimning o'z xohishiga ko'ra (Mehnat kodeksi 97-moddasi 1-bandi)",
    shartnomaMuddat:  'belgilanmagan muddatga',
    sinovMuddat:      '3 (uch) oy',
  })

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['employees', currentOrg?.id],
    queryFn:  () => api.get(`/employees?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const selectedEmployee = employees.find(e => e.id === form.xodimId)

  function buildXodimData(): XodimData {
    const maoshVal = form.maosh || selectedEmployee?.maosh || ''
    const maoshNum = Number(maoshVal)
    return {
      orgNomi:         currentOrg?.name         || '',
      orgInn:          currentOrg?.inn           || '',
      orgRahbar:       currentOrg?.directorName  || '',
      orgManzil:       currentOrg?.address,
      xodimIsm:        selectedEmployee?.ism     || '_______________',
      xodimJshshir:    selectedEmployee?.jshshir,
      xodimPassport:   selectedEmployee?.passport,
      xodimLavozim:    form.lavozim || selectedEmployee?.lavozim || '_______________',
      xodimBolim:      form.bolim   || selectedEmployee?.bolim,
      xodimMaosh:      maoshNum > 0 ? maoshNum.toLocaleString('uz-UZ') + " so'm" : '_______________',
      xodimMaoshMatn:  maoshNum > 0 ? formatAmountWords(maoshNum) : undefined,
      xodimIshBoshi:   form.ishBoshi ? new Date(form.ishBoshi).toLocaleDateString('uz-UZ') : '___',
      xodimTel:        selectedEmployee?.tel,
      raqam:           form.raqam,
      sana:            new Date(form.sana).toLocaleDateString('uz-UZ'),
      extra: {
        SHAHAR:           currentOrg?.address?.split(',')[0]?.trim() || 'Toshkent',
        SHARTNOMA_MUDDAT: form.shartnomaMuddat,
        SINOV_MUDDAT:     form.sinovMuddat,
        TATIL_BOSHI:      form.tatilBoshi  ? new Date(form.tatilBoshi).toLocaleDateString('uz-UZ')  : '',
        TATIL_OXIRI:      form.tatilOxiri  ? new Date(form.tatilOxiri).toLocaleDateString('uz-UZ')  : '',
        TATIL_KUNLAR:     form.tatilKunlar,
        BOSHATISH_SANA:   form.boshatishSana ? new Date(form.boshatishSana).toLocaleDateString('uz-UZ') : '',
        BOSHATISH_SABABI: form.boshatishSababi,
      },
    }
  }

  function handleGenerate() {
    const d = buildXodimData()
    let content = ''
    let title   = ''

    switch (selectedDoc) {
      case 'ishga_qabul':
        content = generateIshgaQabulBuyruq(d)
        title   = `${t('ishgaQabulName')} № ${d.raqam}`
        break
      case 'mehnat_shartnoma':
        content = generateMehnatShartnoma(d)
        title   = `${t('mehnatShartnomaName')} № ${d.raqam}`
        break
      case 'tatil':
        content = generateTatilBuyruq(d)
        title   = `${t('tatilName')} № ${d.raqam}`
        break
      case 'boshatish':
        content = generateIshdanBoshtirish(d)
        title   = `${t('boshatishName')} № ${d.raqam}`
        break
    }

    setPreview(content)
    setPreviewTitle(title)
  }

  async function handlePdf() {
    if (!preview) return
    setLoading(true)
    try {
      await exportContractPdf({ title: previewTitle, content: preview, orgName: currentOrg?.name })
      toast.success(t('pdfDownloaded'))
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDocx() {
    if (!preview) return
    setLoading(true)
    try {
      await exportContractDocx({ title: previewTitle, content: preview, orgName: currentOrg?.name })
      toast.success(t('wordDownloaded'))
    } catch {
      toast.error(t('error'))
    } finally {
      setLoading(false)
    }
  }

  const upd = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div>
      <PageHeader
        title={t('hrDocsTitle')}
        description={t('hrDocsDesc')}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: t('breadcrumb'), path: '/dashboard/kadrlar' },
          { label: t('hrDocsBreadcrumb') },
        ]}
      />

      {!selectedDoc ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HR_DOCS.map(doc => (
            <button
              key={doc.id}
              onClick={() => { setSelectedDoc(doc.id); setPreview('') }}
              className="p-5 rounded-xl bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all text-left group"
            >
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', doc.bg)}>
                <doc.icon size={22} className={doc.color} />
              </div>
              <p className="font-semibold text-[#0F172A] mb-1">{doc.name}</p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{doc.desc}</p>
              <div className="flex items-center gap-1 mt-3 text-xs text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
                <span>{t('create')}</span>
                <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0F172A]">
                {HR_DOCS.find(d => d.id === selectedDoc)?.name}
              </h3>
              <button
                onClick={() => { setSelectedDoc(null); setPreview('') }}
                className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
              >
                ← {t('back')}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#374151]">{t('selectEmployee')}</label>
                <select
                  value={form.xodimId}
                  onChange={e => upd('xodimId', e.target.value)}
                  className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">{t('selectEmployeePlace')}</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.ism} — {emp.lavozim || t('noLavozim')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label={t('buyruqRaqam')} value={form.raqam}
                  onChange={e => upd('raqam', e.target.value)} />
                <Input label={t('sana')} type="date" value={form.sana}
                  onChange={e => upd('sana', e.target.value)} />
              </div>

              <Input
                label={t('lavozim')}
                placeholder={selectedEmployee?.lavozim || t('lavozim')}
                value={form.lavozim}
                onChange={e => upd('lavozim', e.target.value)}
              />
              <Input
                label={t('bolim')}
                placeholder={selectedEmployee?.bolim || t('bolimPlace')}
                value={form.bolim}
                onChange={e => upd('bolim', e.target.value)}
              />
              <Input
                label={t('monthlySalary')}
                type="number"
                placeholder={selectedEmployee?.maosh || '0'}
                value={form.maosh}
                onChange={e => upd('maosh', e.target.value)}
              />
              <Input label={t('ishBoshi')} type="date"
                value={form.ishBoshi} onChange={e => upd('ishBoshi', e.target.value)} />

              {selectedDoc === 'tatil' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label={t('tatilBoshi')} type="date"
                    value={form.tatilBoshi} onChange={e => upd('tatilBoshi', e.target.value)} />
                  <Input label={t('tatilOxiri')} type="date"
                    value={form.tatilOxiri} onChange={e => upd('tatilOxiri', e.target.value)} />
                  <Input label={t('tatilKunlar')}
                    value={form.tatilKunlar} onChange={e => upd('tatilKunlar', e.target.value)} />
                </div>
              )}

              {selectedDoc === 'boshatish' && (
                <div className="space-y-3">
                  <Input label={t('boshatishSana')} type="date"
                    value={form.boshatishSana} onChange={e => upd('boshatishSana', e.target.value)} />
                  <Input label={t('boshatishSabab')}
                    value={form.boshatishSababi} onChange={e => upd('boshatishSababi', e.target.value)} />
                </div>
              )}

              {selectedDoc === 'mehnat_shartnoma' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label={t('shartnomaMuddat')} value={form.shartnomaMuddat}
                    onChange={e => upd('shartnomaMuddat', e.target.value)}
                    placeholder={t('shartnomaMuddatPlace')} />
                  <Input label={t('sinovMuddat')} value={form.sinovMuddat}
                    onChange={e => upd('sinovMuddat', e.target.value)}
                    placeholder={t('sinovMuddatPlace')} />
                </div>
              )}

              <Button fullWidth onClick={handleGenerate} leftIcon={<FileText size={15} />}>
                {t('generateDocument')}
              </Button>
            </div>
          </Card>

          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-sm font-semibold text-[#0F172A]">{t('preview')}</p>
              {preview && (
                <div className="flex gap-2">
                  <Button size="xs" variant="outline" loading={loading} onClick={handlePdf}>
                    {t('pdf')}
                  </Button>
                  <Button size="xs" variant="outline" loading={loading} onClick={handleDocx}>
                    {t('word')}
                  </Button>
                </div>
              )}
            </div>
            <div className="p-6 min-h-96 overflow-auto max-h-[600px]">
              {preview ? (
                <pre
                  className="whitespace-pre-wrap text-xs leading-relaxed text-[#0F172A]"
                  style={{ fontFamily: '"Times New Roman", serif', fontSize: '12px', lineHeight: '1.8' }}
                >
                  {preview}
                </pre>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#94A3B8]">
                  <div className="text-center">
                    <FileText size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm">{t('previewPlaceholder')}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
