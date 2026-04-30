'use client'

import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { YURIST_DOCS } from './DocCardGrid'

export interface FormState {
  raqam:            string
  sana:             string
  cpNomi:           string
  cpInn:            string
  cpRahbar:         string
  cpManzil:         string
  shartnomaRaqam:   string
  shartnomaSana:    string
  majburiyat:       string
  qarzSumma:        string
  penyaFoiz:        string
  penyaSumma:       string
  jamiTalab:        string
  javobMuddat:      string
  sudNomi:          string
  davoPredmeti:     string
  davlatBoji:       string
  vakilIsm:         string
  vakilPassport:    string
  vakilManzil:      string
  vakolatDoirasi:   string
  amalMuddat:       string
  kelishuvPredmeti: string
  tomon1Majburiyat: string
  tomon2Majburiyat: string
  tolovSumma:       string
  tolovMuddat:      string
}

interface Props {
  selectedDoc: string
  form:        FormState
  setForm:     (updater: (f: FormState) => FormState) => void
  cps:         any[]
  onBack:      () => void
  onGenerate:  () => void
}

export function YuristForm({ selectedDoc, form, setForm, cps, onBack, onGenerate }: Props) {
  const upd = (key: keyof FormState, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-[#0F172A]">
        {YURIST_DOCS.find(d => d.id === selectedDoc)?.name}
      </h3>
      <button
        onClick={onBack}
        className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
      >
        ← Orqaga
      </button>
    </div>
  ) as any
}

// Asosiy form maydonlari komponenti — Card ichida ishlatiladi
export function YuristFormFields({ selectedDoc, form, setForm, cps }: Omit<Props, 'onBack' | 'onGenerate'>) {
  const upd = (key: keyof FormState, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      {/* Umumiy */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="Raqam" value={form.raqam} onChange={e => upd('raqam', e.target.value)} />
        <Input label="Sana"  value={form.sana}  onChange={e => upd('sana',  e.target.value)} />
      </div>

      {/* Kontragent */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#374151]">
          {selectedDoc === 'pretenziya' ? 'Javobgar' : 'Ikkinchi tomon'} *
        </label>
        <select
          value={form.cpNomi}
          onChange={e => {
            const cp = cps.find((c: any) => c.name === e.target.value)
            if (cp) {
              setForm(f => ({
                ...f,
                cpNomi:   cp.name,
                cpInn:    cp.inn          || '',
                cpRahbar: cp.directorName || '',
                cpManzil: cp.address      || '',
              }))
            } else {
              upd('cpNomi', e.target.value)
            }
          }}
          className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">Kontragent tanlang</option>
          {cps.map((cp: any) => (
            <option key={cp.id} value={cp.name}>{cp.name}</option>
          ))}
        </select>
      </div>

      {form.cpNomi && (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Rahbar" value={form.cpRahbar} onChange={e => upd('cpRahbar', e.target.value)} />
          <Input label="STIR"   value={form.cpInn}    onChange={e => upd('cpInn',    e.target.value)} />
        </div>
      )}

      {selectedDoc === 'pretenziya' && <PretenziyaFields form={form} upd={upd} />}
      {selectedDoc === 'davo_ariza' && <DavoArizaFields form={form} upd={upd} />}
      {selectedDoc === 'ishonch_qogoz' && <IshonchFields form={form} upd={upd} />}
      {selectedDoc === 'kelishuv' && <KelishuvFields form={form} upd={upd} />}
    </div>
  )
}

type FieldsProps = { form: FormState; upd: (k: keyof FormState, v: string) => void }

function PretenziyaFields({ form, upd }: FieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Shartnoma raqami" value={form.shartnomaRaqam} onChange={e => upd('shartnomaRaqam', e.target.value)} />
        <Input label="Shartnoma sanasi" value={form.shartnomaSana}  onChange={e => upd('shartnomaSana',  e.target.value)} />
      </div>
      <Input label="Bajarilmagan majburiyat"
        placeholder="Tovar yetkazib bermagan, xizmat ko'rsatmagan..."
        value={form.majburiyat} onChange={e => upd('majburiyat', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Qarz summasi (so'm)" type="number" value={form.qarzSumma}
          onChange={e => upd('qarzSumma', e.target.value)} />
        <Input label="Penya stavkasi (%)" value={form.penyaFoiz}
          onChange={e => upd('penyaFoiz', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Penya summasi (so'm)" type="number" value={form.penyaSumma}
          onChange={e => upd('penyaSumma', e.target.value)} />
        <Input label="Jami talab (so'm)" type="number" value={form.jamiTalab}
          onChange={e => upd('jamiTalab', e.target.value)} />
      </div>
      <Input label="Javob berish muddati" value={form.javobMuddat}
        onChange={e => upd('javobMuddat', e.target.value)} />
    </>
  )
}

function DavoArizaFields({ form, upd }: FieldsProps) {
  return (
    <>
      <Input label="Sud nomi"     value={form.sudNomi}      onChange={e => upd('sudNomi', e.target.value)} />
      <Input label="Da'vo predmeti" value={form.davoPredmeti} onChange={e => upd('davoPredmeti', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Shartnoma raqami" value={form.shartnomaRaqam} onChange={e => upd('shartnomaRaqam', e.target.value)} />
        <Input label="Shartnoma sanasi" value={form.shartnomaSana}  onChange={e => upd('shartnomaSana',  e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Qarz summasi (so'm)" type="number" value={form.qarzSumma}
          onChange={e => upd('qarzSumma', e.target.value)} />
        <Input label="Jami talab (so'm)" type="number" value={form.jamiTalab}
          onChange={e => upd('jamiTalab', e.target.value)} />
      </div>
      <Input label="Davlat boji (so'm)" type="number" value={form.davlatBoji}
        onChange={e => upd('davlatBoji', e.target.value)} />
    </>
  )
}

function IshonchFields({ form, upd }: FieldsProps) {
  return (
    <>
      <Input label="Vakil ismi to'liq" value={form.vakilIsm} onChange={e => upd('vakilIsm', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Passport"     value={form.vakilPassport} onChange={e => upd('vakilPassport', e.target.value)} />
        <Input label="Amal muddati" value={form.amalMuddat}    onChange={e => upd('amalMuddat',    e.target.value)} />
      </div>
      <Input label="Vakil manzili" value={form.vakilManzil} onChange={e => upd('vakilManzil', e.target.value)} />
      <Input label="Vakolat doirasi (ixtiyoriy)"
        placeholder="Bo'sh qoldiring — standart matn qo'yiladi"
        value={form.vakolatDoirasi}
        onChange={e => upd('vakolatDoirasi', e.target.value)} />
    </>
  )
}

function KelishuvFields({ form, upd }: FieldsProps) {
  return (
    <>
      <Input label="Kelishuv predmeti" value={form.kelishuvPredmeti} onChange={e => upd('kelishuvPredmeti', e.target.value)} />
      <Input label="1-Tomon majburiyati" value={form.tomon1Majburiyat} onChange={e => upd('tomon1Majburiyat', e.target.value)} />
      <Input label="2-Tomon majburiyati" value={form.tomon2Majburiyat} onChange={e => upd('tomon2Majburiyat', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label="To'lov summasi (so'm)" type="number" value={form.tolovSumma}
          onChange={e => upd('tolovSumma', e.target.value)} />
        <Input label="To'lov muddati" value={form.tolovMuddat}
          onChange={e => upd('tolovMuddat', e.target.value)} />
      </div>
    </>
  )
}
