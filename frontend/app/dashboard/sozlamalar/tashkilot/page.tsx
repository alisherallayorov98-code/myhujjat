'use client'

import { useState, useEffect }             from 'react'
import { useTranslations }                 from 'next-intl'
import { Save, Building2 }                 from 'lucide-react'
import { useMutation }                     from '@tanstack/react-query'
import { Card }                            from '@/components/ui/Card'
import { Button }                          from '@/components/ui/Button'
import { Input }                           from '@/components/ui/Input'
import { useAuth }                         from '@/hooks/useAuth'
import api                                 from '@/lib/api'
import toast                               from 'react-hot-toast'
import { getBankByMfo }                    from '@/lib/bankMfo'

export default function TashkilotSozlamalarPage() {
  const t = useTranslations('settings')
  const { currentOrg, loadUser } = useAuth()

  const [form, setForm] = useState({
    name:         '',
    directorName: '',
    address:      '',
    phone:        '',
    bankName:     '',
    bankAccount:  '',
    mfo:          '',
    oked:         '',
  })

  useEffect(() => {
    if (currentOrg) {
      setForm({
        name:         currentOrg.name         || '',
        directorName: currentOrg.directorName || '',
        address:      currentOrg.address      || '',
        phone:        currentOrg.phone        || '',
        bankName:     currentOrg.bankName     || '',
        bankAccount:  currentOrg.bankAccount  || '',
        mfo:          currentOrg.mfo          || '',
        oked:         currentOrg.oked         || '',
      })
    }
  }, [currentOrg])

  const mutation = useMutation({
    mutationFn: () =>
      api.put(`/users/organizations/${currentOrg?.id}`, form),
    onSuccess: () => {
      loadUser()
      toast.success(t('orgSaved'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const upd = (key: string, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  if (!currentOrg) {
    return (
      <div className="text-sm text-[#94A3B8] p-4">
        {t('orgNotSelected')}
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-[#2563EB]" />
          <h2 className="font-bold text-[#0F172A]">{t('orgSettingsTitle')}</h2>
        </div>

        <div className="space-y-4">
          <Input
            label={t('orgName')}
            value={form.name}
            onChange={e => upd('name', e.target.value)}
            hint={currentOrg.inn ? t('stirHint', { inn: currentOrg.inn }) : undefined}
          />
          <Input
            label={t('directorName')}
            placeholder={t('directorPlace')}
            value={form.directorName}
            onChange={e => upd('directorName', e.target.value)}
          />
          <Input
            label={t('address')}
            placeholder={t('addressPlace')}
            value={form.address}
            onChange={e => upd('address', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('phone')}
              placeholder={t('phonePlace')}
              value={form.phone}
              onChange={e => upd('phone', e.target.value)}
            />
            <Input
              label={t('oked')}
              placeholder={t('okedPlace')}
              value={form.oked}
              onChange={e => upd('oked', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#0F172A] text-sm mb-4">{t('bankInfo')}</h3>
        <div className="space-y-4">
          <Input
            label={t('bankName')}
            placeholder={t('bankNamePlace')}
            value={form.bankName}
            onChange={e => upd('bankName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('bankAccount')}
              placeholder={t('bankAccountPlace')}
              value={form.bankAccount}
              onChange={e => upd('bankAccount', e.target.value)}
            />
            <Input
              label={t('mfo')}
              placeholder={t('mfoPlace')}
              value={form.mfo}
              onChange={e => {
                const mfo = e.target.value.replace(/\D/g, '').slice(0, 5)
                const bank = mfo.length === 5 ? getBankByMfo(mfo) : null
                upd('mfo', mfo)
                if (bank) upd('bankName', bank)
              }}
            />
          </div>
        </div>
      </Card>

      <Button
        leftIcon={<Save size={14} />}
        loading={mutation.isPending}
        disabled={!form.name}
        onClick={() => mutation.mutate()}
      >
        {t('save')}
      </Button>
    </div>
  )
}
