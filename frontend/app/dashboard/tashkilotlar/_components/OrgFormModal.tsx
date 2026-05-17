'use client'

import { useState }                 from 'react'
import { useTranslations }          from 'next-intl'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal }                    from '@/components/ui/Modal'
import { Button }                   from '@/components/ui/Button'
import { Input }                    from '@/components/ui/Input'
import { StirInput, JshshirInput, type StirData } from '@/components/shared/StirInput'
import api                          from '@/lib/api'
import toast                        from 'react-hot-toast'
import { cn }                       from '@/lib/cn'
import type { Organization }        from '@/lib/types'
import { useAuth }                  from '@/hooks/useAuth'
import { getBankByMfo }             from '@/lib/bankMfo'

interface Props {
  org?:    Organization | null
  open:    boolean
  onClose: () => void
}

export function OrgFormModal({ org, open, onClose }: Props) {
  const t  = useTranslations('organizations')
  const tu = useTranslations('ui')
  const qc                  = useQueryClient()
  const { loadOrganizations } = useAuth()
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
      loadOrganizations()
      toast.success(isEdit ? t('toast.updated') : t('toast.added'))
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
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
      title={isEdit ? t('editOrg') : t('newOrg')}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>{tu('cancel')}</Button>
          <Button size="sm" loading={mutation.isPending}
            onClick={() => mutation.mutate(form)} disabled={!form.name}>
            {isEdit ? tu('save') : t('add')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {!isEdit && (
          <div>
            <p className="text-sm font-semibold text-[#0F172A] mb-2">
              {t('stirAutoFill')}
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
          <p className="text-sm font-semibold text-[#0F172A] mb-3">{t('mainInfo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('form.name')} placeholder={t('form.namePlaceholder')}
              value={form.name} onChange={e => upd('name', e.target.value)} required />
            {isEdit && (
              <Input label={t('form.stir')} placeholder="123456789" hint={t('form.stirHint')}
                value={form.inn} onChange={e => upd('inn', e.target.value.replace(/\D/g, '').slice(0, 9))} />
            )}
            <Input label={t('form.directorName')} placeholder={t('form.directorPlaceholder')}
              value={form.directorName} onChange={e => upd('directorName', e.target.value)} />
            <JshshirInput
              label={t('form.directorPinfl')}
              value={form.directorPinfl}
              onChange={v => upd('directorPinfl', v)}
              onData={d => upd('directorName', d.fullName || form.directorName)}
            />
            <Input label={t('form.phone')} placeholder={t('form.phonePlaceholder')}
              value={form.phone} onChange={e => upd('phone', e.target.value)} />
            <Input label={t('form.chiefAccountant')} placeholder={t('form.chiefAccountantPlaceholder')}
              value={form.chiefAccountant} onChange={e => upd('chiefAccountant', e.target.value)} />
          </div>
          <div className="mt-4">
            <Input label={t('form.address')} placeholder={t('form.addressPlaceholder')}
              value={form.address} onChange={e => upd('address', e.target.value)} />
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">{t('bankInfo')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label={t('form.bankName')} placeholder={t('form.bankPlaceholder')}
              value={form.bankName} onChange={e => upd('bankName', e.target.value)} />
            <Input label={t('form.mfo')} placeholder={t('form.mfoPlaceholder')}
              value={form.mfo} onChange={e => {
                const mfo = e.target.value.replace(/\D/g, '').slice(0, 5)
                const bank = mfo.length === 5 ? getBankByMfo(mfo) : null
                upd('mfo', mfo)
                if (bank) upd('bankName', bank)
              }} />
            <div className="sm:col-span-2">
              <Input label={t('form.bankAccount')} placeholder={t('form.bankAccountPlaceholder')}
                value={form.bankAccount} onChange={e => upd('bankAccount', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">{t('qqs')}</p>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('qqsPayer')} placeholder={t('form.qqsRegPlaceholder')}
              value={form.qqsReg} onChange={e => upd('qqsReg', e.target.value)} />
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#374151]">{t('qqsRate')}</label>
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
