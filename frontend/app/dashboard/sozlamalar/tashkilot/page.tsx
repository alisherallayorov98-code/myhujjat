'use client'

import { useState, useEffect }             from 'react'
import { Save, Building2 }                 from 'lucide-react'
import { useMutation }                     from '@tanstack/react-query'
import { Card }                            from '@/components/ui/Card'
import { Button }                          from '@/components/ui/Button'
import { Input }                           from '@/components/ui/Input'
import { useAuth }                         from '@/hooks/useAuth'
import api                                 from '@/lib/api'
import toast                               from 'react-hot-toast'

export default function TashkilotSozlamalarPage() {
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
      toast.success("Tashkilot ma'lumotlari saqlandi ✓")
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const upd = (key: string, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  if (!currentOrg) {
    return (
      <div className="text-sm text-[#94A3B8] p-4">
        Tashkilot tanlanmagan
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Building2 size={18} className="text-[#2563EB]" />
          <h2 className="font-bold text-[#0F172A]">Tashkilot ma'lumotlari</h2>
        </div>

        <div className="space-y-4">
          <Input
            label="Tashkilot nomi *"
            value={form.name}
            onChange={e => upd('name', e.target.value)}
            hint={currentOrg.inn ? `STIR: ${currentOrg.inn}` : undefined}
          />
          <Input
            label="Rahbar F.I.O."
            placeholder="Toshmatov Jasur Baxtiyorovich"
            value={form.directorName}
            onChange={e => upd('directorName', e.target.value)}
          />
          <Input
            label="Manzil"
            placeholder="Toshkent sh., Yunusobod t., ..."
            value={form.address}
            onChange={e => upd('address', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Telefon"
              placeholder="+998 71 123 45 67"
              value={form.phone}
              onChange={e => upd('phone', e.target.value)}
            />
            <Input
              label="OKED"
              placeholder="62010"
              value={form.oked}
              onChange={e => upd('oked', e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-[#0F172A] text-sm mb-4">Bank rekvizitlari</h3>
        <div className="space-y-4">
          <Input
            label="Bank nomi"
            placeholder="Xalq banki"
            value={form.bankName}
            onChange={e => upd('bankName', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Hisob raqami"
              placeholder="20208000000000000001"
              value={form.bankAccount}
              onChange={e => upd('bankAccount', e.target.value)}
            />
            <Input
              label="MFO"
              placeholder="00014"
              value={form.mfo}
              onChange={e => upd('mfo', e.target.value)}
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
        Saqlash
      </Button>
    </div>
  )
}
