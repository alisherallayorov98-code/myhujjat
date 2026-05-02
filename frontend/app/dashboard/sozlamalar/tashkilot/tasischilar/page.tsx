'use client'

import { useState }                                  from 'react'
import { useTranslations }                           from 'next-intl'
import { Plus, Edit2, Trash2, Users }                from 'lucide-react'
import { useQuery, useMutation, useQueryClient }     from '@tanstack/react-query'
import { Card }                                      from '@/components/ui/Card'
import { Button }                                    from '@/components/ui/Button'
import { Input }                                     from '@/components/ui/Input'
import { Modal }                                     from '@/components/ui/Modal'
import { useAuth }                                   from '@/hooks/useAuth'
import api                                           from '@/lib/api'
import toast                                         from 'react-hot-toast'

type FounderForm = { ism: string; jshshir: string; ulush: string; manzil: string }

export default function TasischchilarPage() {
  const t = useTranslations('settings')
  const { currentOrg } = useAuth()
  const qc             = useQueryClient()
  const [modal,    setModal]    = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [form, setForm]         = useState<FounderForm>({ ism: '', jshshir: '', ulush: '', manzil: '' })

  const { data: founders = [] } = useQuery({
    queryKey: ['founders', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/founders?orgId=${currentOrg.id}`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const closeModal = () => {
    setModal(false)
    setEditItem(null)
    setForm({ ism: '', jshshir: '', ulush: '', manzil: '' })
  }

  const mutation = useMutation({
    mutationFn: (d: FounderForm) => {
      const payload = { ...d, ulush: d.ulush ? Number(d.ulush) : undefined }
      if (editItem) return api.put(`/founders/${editItem.id}`, payload)
      return api.post(`/founders?orgId=${currentOrg?.id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['founders'] })
      toast.success(editItem ? t('tasischiUpdated') : t('tasischiAdded'))
      closeModal()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/founders/${id}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['founders'] })
      toast.success(t('tasischiDeleted'))
    },
  })

  const totalUlush = founders.reduce((s: number, f: any) => s + (Number(f.ulush) || 0), 0)

  return (
    <div className="max-w-lg space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-[#0F172A]">{t('tasischilar')}</h2>
        <Button size="sm" leftIcon={<Plus size={14} />} onClick={() => setModal(true)}>
          {t('addTasischi')}
        </Button>
      </div>

      {founders.length === 0 ? (
        <Card className="text-center py-8">
          <Users size={28} className="mx-auto text-[#94A3B8] opacity-40 mb-2" />
          <p className="text-sm text-[#94A3B8]">{t('noTasischilar')}</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {founders.map((f: any) => (
            <Card key={f.id} className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                <span className="text-[#2563EB] font-bold text-sm">{f.ism?.[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0F172A]">{f.ism}</p>
                <p className="text-xs text-[#94A3B8]">
                  {f.jshshir && `${t('tasischiJshshir')}: ${f.jshshir}`}
                  {f.ulush   && ` • ${t('tasischiUlush')}: ${f.ulush}%`}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditItem(f)
                    setForm({ ism: f.ism, jshshir: f.jshshir || '', ulush: String(f.ulush || ''), manzil: f.manzil || '' })
                    setModal(true)
                  }}
                  className="p-1.5 rounded text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#DBEAFE]"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => deleteMutation.mutate(f.id)}
                  className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2]"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </Card>
          ))}

          {totalUlush > 0 && (
            <p className="text-xs text-right text-[#94A3B8]">
              {t('totalUlush')}{' '}
              <strong className={totalUlush === 100 ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                {totalUlush}%
              </strong>
              {totalUlush !== 100 && ` ${t('ulushMustBe100')}`}
            </p>
          )}
        </div>
      )}

      <Modal
        open={modal}
        onClose={closeModal}
        title={editItem ? t('tasischiEdit') : t('tasischiAdd')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={closeModal}>{t('tasischiCancel')}</Button>
            <Button
              size="sm"
              loading={mutation.isPending}
              disabled={!form.ism}
              onClick={() => mutation.mutate(form)}
            >
              {t('tasischiSave')}
            </Button>
          </>
        }
      >
        <div className="space-y-3 py-2">
          <Input
            label={t('tasischiFullName')}
            value={form.ism}
            onChange={e => setForm(f => ({ ...f, ism: e.target.value }))}
          />
          <Input
            label={t('tasischiJshshir')}
            value={form.jshshir}
            onChange={e => setForm(f => ({ ...f, jshshir: e.target.value }))}
          />
          <Input
            label={t('tasischiUlush')}
            type="number"
            value={form.ulush}
            onChange={e => setForm(f => ({ ...f, ulush: e.target.value }))}
          />
          <Input
            label={t('tasischiManzil')}
            value={form.manzil}
            onChange={e => setForm(f => ({ ...f, manzil: e.target.value }))}
          />
        </div>
      </Modal>
    </div>
  )
}
