'use client'

import { useTranslations } from 'next-intl'
import { Scale } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import { useYuristDocs } from './DocCardGrid'

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
  const t = useTranslations('lawyer')
  const docs = useYuristDocs()
  const upd = (key: keyof FormState, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-[#0F172A]">
        {docs.find(d => d.id === selectedDoc)?.name}
      </h3>
      <button
        onClick={onBack}
        className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
      >
        ← {t('back')}
      </button>
    </div>
  ) as any
}

export function YuristFormFields({ selectedDoc, form, setForm, cps }: Omit<Props, 'onBack' | 'onGenerate'>) {
  const t = useTranslations('lawyer')
  const upd = (key: keyof FormState, val: string) => setForm(f => ({ ...f, [key]: val }))

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('raqam')} value={form.raqam} onChange={e => upd('raqam', e.target.value)} />
        <Input label={t('sana')}  value={form.sana}  onChange={e => upd('sana',  e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-[#374151]">
          {selectedDoc === 'pretenziya' ? t('javobgar') : t('ikkinchiTomon')} *
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
          <option value="">{t('selectCp')}</option>
          {cps.map((cp: any) => (
            <option key={cp.id} value={cp.name}>{cp.name}</option>
          ))}
        </select>
      </div>

      {form.cpNomi && (
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('rahbar')} value={form.cpRahbar} onChange={e => upd('cpRahbar', e.target.value)} />
          <Input label={t('stir')}   value={form.cpInn}    onChange={e => upd('cpInn',    e.target.value)} />
        </div>
      )}

      {selectedDoc === 'pretenziya'    && <PretenziyaFields  form={form} upd={upd} t={t} />}
      {selectedDoc === 'davo_ariza'    && <DavoArizaFields   form={form} upd={upd} t={t} />}
      {selectedDoc === 'ishonch_qogoz' && <IshonchFields     form={form} upd={upd} t={t} />}
      {selectedDoc === 'kelishuv'      && <KelishuvFields    form={form} upd={upd} t={t} />}
    </div>
  )
}

type FieldsProps = { form: FormState; upd: (k: keyof FormState, v: string) => void; t: any }

function PretenziyaFields({ form, upd, t }: FieldsProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('shartnomaRaqam')} value={form.shartnomaRaqam} onChange={e => upd('shartnomaRaqam', e.target.value)} />
        <Input label={t('shartnomaSana')}  value={form.shartnomaSana}  onChange={e => upd('shartnomaSana',  e.target.value)} />
      </div>
      <Input label={t('majburiyat')}
        placeholder={t('majburiyatPlace')}
        value={form.majburiyat} onChange={e => upd('majburiyat', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('qarzSumma')} type="number" value={form.qarzSumma}
          onChange={e => upd('qarzSumma', e.target.value)} />
        <Input label={t('penyaFoiz')} value={form.penyaFoiz}
          onChange={e => upd('penyaFoiz', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('penyaSumma')} type="number" value={form.penyaSumma}
          onChange={e => upd('penyaSumma', e.target.value)} />
        <Input label={t('jamiTalab')} type="number" value={form.jamiTalab}
          onChange={e => upd('jamiTalab', e.target.value)} />
      </div>
      <Input label={t('javobMuddat')} value={form.javobMuddat}
        onChange={e => upd('javobMuddat', e.target.value)} />
    </>
  )
}

function DavoArizaFields({ form, upd, t }: FieldsProps) {
  return (
    <>
      <Input label={t('sudNomi')}      value={form.sudNomi}      onChange={e => upd('sudNomi', e.target.value)} />
      <Input label={t('davoPredmeti')} value={form.davoPredmeti} onChange={e => upd('davoPredmeti', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('shartnomaRaqam')} value={form.shartnomaRaqam} onChange={e => upd('shartnomaRaqam', e.target.value)} />
        <Input label={t('shartnomaSana')}  value={form.shartnomaSana}  onChange={e => upd('shartnomaSana',  e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('qarzSumma')} type="number" value={form.qarzSumma}
          onChange={e => upd('qarzSumma', e.target.value)} />
        <Input label={t('jamiTalab')} type="number" value={form.jamiTalab}
          onChange={e => upd('jamiTalab', e.target.value)} />
      </div>
      <Input label={t('davlatBoji')} type="number" value={form.davlatBoji}
        onChange={e => upd('davlatBoji', e.target.value)} />
    </>
  )
}

function IshonchFields({ form, upd, t }: FieldsProps) {
  return (
    <>
      <Input label={t('vakilIsm')} value={form.vakilIsm} onChange={e => upd('vakilIsm', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('passport')}   value={form.vakilPassport} onChange={e => upd('vakilPassport', e.target.value)} />
        <Input label={t('amalMuddat')} value={form.amalMuddat}    onChange={e => upd('amalMuddat',    e.target.value)} />
      </div>
      <Input label={t('vakilManzil')} value={form.vakilManzil} onChange={e => upd('vakilManzil', e.target.value)} />
      <Input label={t('vakolatDoirasi')}
        placeholder={t('vakolatPlace')}
        value={form.vakolatDoirasi}
        onChange={e => upd('vakolatDoirasi', e.target.value)} />
    </>
  )
}

function KelishuvFields({ form, upd, t }: FieldsProps) {
  return (
    <>
      <Input label={t('kelishuvPredmeti')} value={form.kelishuvPredmeti} onChange={e => upd('kelishuvPredmeti', e.target.value)} />
      <Input label={t('tomon1Majburiyat')} value={form.tomon1Majburiyat} onChange={e => upd('tomon1Majburiyat', e.target.value)} />
      <Input label={t('tomon2Majburiyat')} value={form.tomon2Majburiyat} onChange={e => upd('tomon2Majburiyat', e.target.value)} />
      <div className="grid grid-cols-2 gap-3">
        <Input label={t('tolovSumma')} type="number" value={form.tolovSumma}
          onChange={e => upd('tolovSumma', e.target.value)} />
        <Input label={t('tolovMuddat')} value={form.tolovMuddat}
          onChange={e => upd('tolovMuddat', e.target.value)} />
      </div>
    </>
  )
}
