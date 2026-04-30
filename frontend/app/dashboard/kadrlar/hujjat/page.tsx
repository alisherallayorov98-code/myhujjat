'use client'

import { useState }                                      from 'react'
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

const HR_DOCS = [
  {
    id:    'ishga_qabul',
    name:  "Ishga qabul buyrug'i",
    icon:  UserCheck,
    color: 'text-[#16A34A]',
    bg:    'bg-[#DCFCE7]',
    desc:  "Yangi xodimni ishga qabul qilish uchun rasmiy buyruq",
  },
  {
    id:    'mehnat_shartnoma',
    name:  'Mehnat shartnomasi',
    icon:  FileText,
    color: 'text-[#2563EB]',
    bg:    'bg-[#DBEAFE]',
    desc:  "Xodim va tashkilot o'rtasidagi to'liq mehnat shartnomasi",
  },
  {
    id:    'tatil',
    name:  "Ta'til buyrug'i",
    icon:  FileText,
    color: 'text-[#D97706]',
    bg:    'bg-[#FEF3C7]',
    desc:  "Yillik asosiy yoki qo'shimcha ta'til berish buyrug'i",
  },
  {
    id:    'boshatish',
    name:  "Ishdan bo'shatish",
    icon:  UserX,
    color: 'text-[#DC2626]',
    bg:    'bg-[#FEE2E2]',
    desc:  "Xodimni ishdan bo'shatish buyrug'i",
  },
]

const today = () => new Date().toISOString().split('T')[0]

export default function HRHujjatlarPage() {
  const { currentOrg }  = useAuth()
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [preview, setPreview]         = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [loading, setLoading]         = useState(false)

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
        title   = `Ishga qabul buyrug'i № ${d.raqam}`
        break
      case 'mehnat_shartnoma':
        content = generateMehnatShartnoma(d)
        title   = `Mehnat shartnomasi № ${d.raqam}`
        break
      case 'tatil':
        content = generateTatilBuyruq(d)
        title   = `Ta'til buyrug'i № ${d.raqam}`
        break
      case 'boshatish':
        content = generateIshdanBoshtirish(d)
        title   = `Ishdan bo'shatish buyrug'i № ${d.raqam}`
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
      toast.success('PDF yuklandi ✓')
    } catch {
      toast.error('Xatolik')
    } finally {
      setLoading(false)
    }
  }

  async function handleDocx() {
    if (!preview) return
    setLoading(true)
    try {
      await exportContractDocx({ title: previewTitle, content: preview, orgName: currentOrg?.name })
      toast.success('Word yuklandi ✓')
    } catch {
      toast.error('Xatolik')
    } finally {
      setLoading(false)
    }
  }

  const upd = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <div>
      <PageHeader
        title="HR Hujjatlar"
        description="Kadrlar bo'limi hujjatlarini yarating"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Kadrlar',   path: '/dashboard/kadrlar' },
          { label: 'Hujjatlar' },
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
                <span>Yaratish</span>
                <ArrowRight size={12} />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Forma */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0F172A]">
                {HR_DOCS.find(d => d.id === selectedDoc)?.name}
              </h3>
              <button
                onClick={() => { setSelectedDoc(null); setPreview('') }}
                className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
              >
                ← Orqaga
              </button>
            </div>

            <div className="space-y-4">
              {/* Xodim tanlash */}
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-[#374151]">Xodim *</label>
                <select
                  value={form.xodimId}
                  onChange={e => upd('xodimId', e.target.value)}
                  className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                >
                  <option value="">Xodimni tanlang</option>
                  {employees.map((emp: any) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.ism} — {emp.lavozim || "lavozim yo'q"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Input label="Buyruq raqami" value={form.raqam}
                  onChange={e => upd('raqam', e.target.value)} />
                <Input label="Sana" type="date" value={form.sana}
                  onChange={e => upd('sana', e.target.value)} />
              </div>

              <Input
                label="Lavozim"
                placeholder={selectedEmployee?.lavozim || 'Lavozim'}
                value={form.lavozim}
                onChange={e => upd('lavozim', e.target.value)}
              />
              <Input
                label="Bo'lim"
                placeholder={selectedEmployee?.bolim || "Bo'lim (ixtiyoriy)"}
                value={form.bolim}
                onChange={e => upd('bolim', e.target.value)}
              />
              <Input
                label="Oylik maosh (so'm)"
                type="number"
                placeholder={selectedEmployee?.maosh || '0'}
                value={form.maosh}
                onChange={e => upd('maosh', e.target.value)}
              />
              <Input label="Ish boshlagan sana" type="date"
                value={form.ishBoshi} onChange={e => upd('ishBoshi', e.target.value)} />

              {selectedDoc === 'tatil' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input label="Ta'til boshi" type="date"
                    value={form.tatilBoshi} onChange={e => upd('tatilBoshi', e.target.value)} />
                  <Input label="Ta'til oxiri" type="date"
                    value={form.tatilOxiri} onChange={e => upd('tatilOxiri', e.target.value)} />
                  <Input label="Kunlar soni"
                    value={form.tatilKunlar} onChange={e => upd('tatilKunlar', e.target.value)} />
                </div>
              )}

              {selectedDoc === 'boshatish' && (
                <div className="space-y-3">
                  <Input label="Bo'shatish sanasi" type="date"
                    value={form.boshatishSana} onChange={e => upd('boshatishSana', e.target.value)} />
                  <Input label="Sababi"
                    value={form.boshatishSababi} onChange={e => upd('boshatishSababi', e.target.value)} />
                </div>
              )}

              {selectedDoc === 'mehnat_shartnoma' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Shartnoma muddati" value={form.shartnomaMuddat}
                    onChange={e => upd('shartnomaMuddat', e.target.value)}
                    placeholder="belgilanmagan muddatga" />
                  <Input label="Sinov muddati" value={form.sinovMuddat}
                    onChange={e => upd('sinovMuddat', e.target.value)}
                    placeholder="3 (uch) oy" />
                </div>
              )}

              <Button fullWidth onClick={handleGenerate} leftIcon={<FileText size={15} />}>
                Hujjat shakllantirish
              </Button>
            </div>
          </Card>

          {/* Preview */}
          <Card padding="none">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-sm font-semibold text-[#0F172A]">Ko'rib chiqish</p>
              {preview && (
                <div className="flex gap-2">
                  <Button size="xs" variant="outline" loading={loading} onClick={handlePdf}>
                    PDF
                  </Button>
                  <Button size="xs" variant="outline" loading={loading} onClick={handleDocx}>
                    Word
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
                    <p className="text-sm">Hujjat ko'rinishi bu yerda chiqadi</p>
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
