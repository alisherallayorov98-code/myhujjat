'use client'

import { useState }   from 'react'
import Link           from 'next/link'
import { Lock, Zap }  from 'lucide-react'
import { useQuery }   from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card }       from '@/components/ui/Card'
import { Button }     from '@/components/ui/Button'
import { useAuth }    from '@/hooks/useAuth'
import api            from '@/lib/api'
import { exportContractPdf  } from '@/lib/export/contractPdf'
import { exportContractDocx } from '@/lib/export/contractDocx'
import {
  generatePretenziya,
  generateDavoAriza,
  generateIshonchQogoz,
  generateKelishuvBitimi,
  type YuristData,
} from '@/lib/yuristTemplates'
import toast from 'react-hot-toast'

import { DocCardGrid }    from './_components/DocCardGrid'
import { YuristFormFields, type FormState } from './_components/YuristForm'
import { PreviewPanel }   from './_components/PreviewPanel'

const today = () => new Date().toLocaleDateString('uz-UZ')

const INITIAL_FORM: FormState = {
  raqam:            `YUR-${new Date().getFullYear()}-001`,
  sana:             today(),
  cpNomi:           '',
  cpInn:            '',
  cpRahbar:         '',
  cpManzil:         '',
  shartnomaRaqam:   '',
  shartnomaSana:    '',
  majburiyat:       '',
  qarzSumma:        '',
  penyaFoiz:        '0,1',
  penyaSumma:       '',
  jamiTalab:        '',
  javobMuddat:      "10 (o'n)",
  sudNomi:          'TOSHKENT SHAHAR IQTISODIY SUDI',
  davoPredmeti:     "Pul mablag'larini undirib berish to'g'risida",
  davlatBoji:       '',
  vakilIsm:         '',
  vakilPassport:    '',
  vakilManzil:      '',
  vakolatDoirasi:   '',
  amalMuddat:       '1 (bir) yil',
  kelishuvPredmeti: '',
  tomon1Majburiyat: '',
  tomon2Majburiyat: '',
  tolovSumma:       '',
  tolovMuddat:      '',
}

const DOC_TITLE_MAP: Record<string, (raqam: string, sana: string) => string> = {
  pretenziya:    raqam       => `Pretenziya № ${raqam}`,
  davo_ariza:    raqam       => `Da'vo arizasi № ${raqam}`,
  ishonch_qogoz: (_, sana)   => `Ishonch qog'ozi ${sana}`,
  kelishuv:      raqam       => `Kelishuv bitimi № ${raqam}`,
}

const DOC_GENERATOR_MAP: Record<string, (d: YuristData) => string> = {
  pretenziya:    generatePretenziya,
  davo_ariza:    generateDavoAriza,
  ishonch_qogoz: generateIshonchQogoz,
  kelishuv:      generateKelishuvBitimi,
}

export default function YuristPage() {
  const { currentOrg, isPro } = useAuth()
  const [selectedDoc,  setSelectedDoc]  = useState<string | null>(null)
  const [preview,      setPreview]      = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [loading,      setLoading]      = useState(false)
  const [form,         setForm]         = useState<FormState>(INITIAL_FORM)

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  function buildData(): YuristData {
    const fmt = (v: string) => v ? Number(v).toLocaleString('uz-UZ') + " so'm" : ''
    return {
      orgNomi:   currentOrg?.name         || '',
      orgInn:    currentOrg?.inn           || '',
      orgRahbar: currentOrg?.directorName  || '',
      orgManzil: currentOrg?.address,
      orgBank:   currentOrg?.bankName,
      orgHisob:  currentOrg?.bankAccount,
      orgMfo:    currentOrg?.mfo,
      orgTel:    currentOrg?.phone,
      cpNomi:    form.cpNomi,
      cpInn:     form.cpInn    || undefined,
      cpRahbar:  form.cpRahbar || undefined,
      cpManzil:  form.cpManzil || undefined,
      raqam:     form.raqam,
      sana:      form.sana,
      extra: {
        SHARTNOMA_RAQAM:   form.shartnomaRaqam,
        SHARTNOMA_SANA:    form.shartnomaSana,
        MAJBURIYAT:        form.majburiyat,
        QARZ_SUMMA:        fmt(form.qarzSumma),
        PENYA_FOIZ:        form.penyaFoiz,
        PENYA_SUMMA:       fmt(form.penyaSumma),
        JAMI_TALAB:        fmt(form.jamiTalab),
        JAVOB_MUDDAT:      form.javobMuddat,
        SUD_NOMI:          form.sudNomi,
        DAVO_PREDMETI:     form.davoPredmeti,
        DAVLAT_BOJI:       fmt(form.davlatBoji),
        VAKIL_ISM:         form.vakilIsm,
        VAKIL_PASSPORT:    form.vakilPassport,
        VAKIL_MANZIL:      form.vakilManzil,
        VAKOLAT_DOIRASI:   form.vakolatDoirasi,
        AMAL_MUDDAT:       form.amalMuddat,
        KELISHUV_PREDMETI: form.kelishuvPredmeti,
        TOMON1_MAJBURIYAT: form.tomon1Majburiyat,
        TOMON2_MAJBURIYAT: form.tomon2Majburiyat,
        TOLOV_SUMMA:       fmt(form.tolovSumma),
        TOLOV_MUDDAT:      form.tolovMuddat,
      },
    }
  }

  function handleGenerate() {
    if (!selectedDoc) return
    const generator = DOC_GENERATOR_MAP[selectedDoc]
    const titleFn   = DOC_TITLE_MAP[selectedDoc]
    if (!generator || !titleFn) return
    const data = buildData()
    setPreview(generator(data))
    setPreviewTitle(titleFn(data.raqam, data.sana))
  }

  async function handleExport(type: 'pdf' | 'docx') {
    if (!preview) return
    setLoading(true)
    try {
      const opts = { title: previewTitle, content: preview, orgName: currentOrg?.name }
      if (type === 'pdf') await exportContractPdf(opts)
      else                await exportContractDocx(opts)
      toast.success(`${type === 'pdf' ? 'PDF' : 'Word'} yuklandi ✓`)
    } catch {
      toast.error('Eksport xatosi')
    } finally {
      setLoading(false)
    }
  }

  // ── PRO LOCK ─────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div>
        <PageHeader title="⚖️ Yurist bo'limi" breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Yurist' },
        ]} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mb-6">
            <Lock size={32} className="text-[#D97706]" />
          </div>
          <h2 className="font-semibold text-[#0F172A] text-2xl mb-3">Pro rejada mavjud</h2>
          <p className="text-[#475569] text-base max-w-md leading-relaxed mb-6">
            Pretenziya, da'vo arizasi, ishonch qog'ozi va boshqa yuridik hujjatlar
            yaratish uchun Pro rejaga o'ting.
          </p>
          <Link href="/dashboard/sozlamalar/obuna">
            <Button leftIcon={<Zap size={15} />}>Pro rejaga o'tish</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── MAIN ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="⚖️ Yurist bo'limi"
        description="Yuridik hujjatlarni yarating"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Yurist' },
        ]}
      />

      {!selectedDoc ? (
        <DocCardGrid onSelect={(id) => { setSelectedDoc(id); setPreview('') }} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[#0F172A]">
                {selectedDoc === 'pretenziya' ? 'Pretenziya' :
                 selectedDoc === 'davo_ariza' ? "Da'vo arizasi" :
                 selectedDoc === 'ishonch_qogoz' ? "Ishonch qog'ozi" :
                 'Kelishuv bitimi'}
              </h3>
              <button
                onClick={() => { setSelectedDoc(null); setPreview('') }}
                className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
              >
                ← Orqaga
              </button>
            </div>
            <YuristFormFields
              selectedDoc={selectedDoc}
              form={form}
              setForm={setForm}
              cps={cps}
            />
            <Button fullWidth onClick={handleGenerate} className="mt-4">
              Hujjat shakllantirish
            </Button>
          </Card>

          <PreviewPanel preview={preview} loading={loading} onExport={handleExport} />
        </div>
      )}
    </div>
  )
}
