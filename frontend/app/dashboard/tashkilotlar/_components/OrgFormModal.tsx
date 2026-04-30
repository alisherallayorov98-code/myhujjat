'use client'

import { useState }                 from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal }                    from '@/components/ui/Modal'
import { Button }                   from '@/components/ui/Button'
import { Input }                    from '@/components/ui/Input'
import { StirInput, JshshirInput, type StirData } from '@/components/shared/StirInput'
import api                          from '@/lib/api'
import toast                        from 'react-hot-toast'
import { cn }                       from '@/lib/cn'
import type { Organization }        from '@/lib/types'

interface Props {
  org?:    Organization | null
  open:    boolean
  onClose: () => void
}

export function OrgFormModal({ org, open, onClose }: Props) {
  const qc     = useQueryClient()
  const isEdit = !!org

  const [form, setForm] = useState({
    name:             org?.name            || '',
    inn:              org?.inn             || '',
    directorName:     org?.directorName    || '',
    directorPinfl:    org?.directorPinfl   || '',
    bankName:         org?.bankName        || '',
    bankAccount:      org?.bankAccount     || '',
    mfo:              org?.mfo             || '',
    address:          org?.address         || '',
    phone:            org?.phone           || '',
    qqsReg:           org?.qqsReg          || '',
    qqsStavka:        org?.qqsStavka       || '12',
    chiefAccountant:  org?.chiefAccountant || '',
  })

  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) return api.put(`/organizations/${org!.id}`, data)
      return api.post('/organizations', data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] })
      toast.success(isEdit ? 'Tashkilot yangilandi' : "Tashkilot qo'shildi")
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const handleStirData = (data: StirData) => {
    setForm(f => ({
      ...f,
      name:            data.name            || f.name,
      inn:             data.inn             || f.inn,
      directorName:    data.directorName    || f.directorName,
      directorPinfl:   data.directorPinfl   || f.directorPinfl,
      address:         data.address         || f.address,
      phone:           data.phone           || f.phone,
      qqsReg:          data.qqsreg          || f.qqsReg,
      chiefAccountant: data.accountantName  || f.chiefAccountant,
    }))
  }

  const upd = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <Modal
      open={open} onClose={onClose}
      title={isEdit ? 'Tashkilotni tahrirlash' : 'Yangi tashkilot'}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Bekor qilish</Button>
          <Button size="sm" loading={mutation.isPending}
            onClick={() => mutation.mutate(form)} disabled={!form.name}>
            {isEdit ? 'Saqlash' : "Qo'shish"}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {!isEdit && (
          <div>
            <p className="text-sm font-semibold text-[#0F172A] mb-2">
              STIR orqali avtomatik to'ldirish
            </p>
            <StirInput
              value={form.inn}
              onChange={v => upd('inn', v)}
              onData={handleStirData}
              autoSearch
            />
          </div>
        )}

        <div className={cn(!isEdit && 'border-t border-[#E2E8F0] pt-4')}>
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Asosiy ma'lumotlar</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Tashkilot nomi *" placeholder="Toshmatov Savdo MChJ"
              value={form.name} onChange={e => upd('name', e.target.value)} required />
            {isEdit && (
              <Input label="STIR" placeholder="123456789" hint="9 ta raqam"
                value={form.inn} onChange={e => upd('inn', e.target.value.replace(/\D/g, '').slice(0, 9))} />
            )}
            <Input label="Rahbar ismi" placeholder="Toshmatov Alisher Bekovich"
              value={form.directorName} onChange={e => upd('directorName', e.target.value)} />
            <JshshirInput
              label="Rahbar JSHSHIR"
              value={form.directorPinfl}
              onChange={v => upd('directorPinfl', v)}
              onData={d => upd('directorName', d.fullName || form.directorName)}
            />
            <Input label="Telefon" placeholder="+998 71 123 45 67"
              value={form.phone} onChange={e => upd('phone', e.target.value)} />
            <Input label="Bosh hisobchi" placeholder="Rahimova Dilnoza"
              value={form.chiefAccountant} onChange={e => upd('chiefAccountant', e.target.value)} />
          </div>
          <div className="mt-4">
            <Input label="Yuridik manzil" placeholder="Toshkent sh., Yunusobod t., Amir Temur ko'chasi, 108"
              value={form.address} onChange={e => upd('address', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">Bank ma'lumotlari</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Bank nomi" placeholder="Xalq banki"
              value={form.bankName} onChange={e => upd('bankName', e.target.value)} />
            <Input label="MFO" placeholder="00014"
              value={form.mfo} onChange={e => upd('mfo', e.target.value.replace(/\D/g, '').slice(0, 5))} />
            <div className="sm:col-span-2">
              <Input label="Hisob raqami" placeholder="20208000000000000000"
                value={form.bankAccount} onChange={e => upd('bankAccount', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">QQS</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label="QQS to'lovchisi raqami" placeholder="302060000000"
              value={form.qqsReg} onChange={e => upd('qqsReg', e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#374151]">QQS stavkasi</label>
              <select
                value={form.qqsStavka}
                onChange={e => upd('qqsStavka', e.target.value)}
                className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value="0">0%</option>
                <option value="12">12%</option>
                <option value="15">15%</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
