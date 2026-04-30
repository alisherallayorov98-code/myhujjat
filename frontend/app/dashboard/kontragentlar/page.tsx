'use client'

import { useState }    from 'react'
import { Plus, Users, Search, Edit2, AlertCircle, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient }   from '@tanstack/react-query'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Button }       from '@/components/ui/Button'
import { Input }        from '@/components/ui/Input'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Modal }        from '@/components/ui/Modal'
import { EmptyState, TableRowSkeleton } from '@/components/ui/Skeleton'
import { StirInput, type StirData } from '@/components/shared/StirInput'
import { useAuth }      from '@/hooks/useAuth'
import api              from '@/lib/api'
import { exportCounterpartiesExcel } from '@/lib/export/listExport'
import toast            from 'react-hot-toast'
import { cn }           from '@/lib/cn'

interface Counterparty {
  id:             string
  name:           string
  inn?:           string
  directorName?:  string
  bankName?:      string
  bankAccount?:   string
  mfo?:           string
  address?:       string
  phone?:         string
  stirStatus?:    'active' | 'inactive' | 'unknown'
}

// ============================================
// KONTRAGENT FORM MODAL
// ============================================
function CpFormModal({ cp, open, onClose, orgId }: {
  cp?:     Counterparty | null
  open:    boolean
  onClose: () => void
  orgId:   string
}) {
  const qc     = useQueryClient()
  const isEdit = !!cp

  const [form, setForm] = useState({
    name:         cp?.name         || '',
    inn:          cp?.inn          || '',
    directorName: cp?.directorName || '',
    bankName:     cp?.bankName     || '',
    bankAccount:  cp?.bankAccount  || '',
    mfo:          cp?.mfo          || '',
    address:      cp?.address      || '',
    phone:        cp?.phone        || '',
  })
  const mutation = useMutation({
    mutationFn: async (data: typeof form) => {
      if (isEdit) return api.put(`/counterparties/${cp!.id}`, data)
      return api.post('/counterparties', { ...data, organizationId: orgId })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['counterparties'] })
      toast.success(isEdit ? 'Kontragent yangilandi' : "Kontragent qo'shildi")
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const handleStirData = (data: StirData) => {
    setForm(f => ({
      ...f,
      inn:          data.inn          || f.inn,
      name:         data.name         || f.name,
      directorName: data.directorName || f.directorName,
      address:      data.address      || f.address,
      phone:        data.phone        || f.phone,
    }))
  }

  const upd = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <Modal
      open={open} onClose={onClose}
      title={isEdit ? 'Kontragentni tahrirlash' : 'Yangi kontragent'}
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
      <div className="space-y-4">
        {/* STIR — auto-fill */}
        <StirInput
          value={form.inn}
          onChange={v => upd('inn', v)}
          onData={handleStirData}
          autoSearch
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nomi *" placeholder="Kompaniya nomi"
            value={form.name} onChange={e => upd('name', e.target.value)} required />
          <Input label="Rahbar" placeholder="Familiya Ism Otasining ismi"
            value={form.directorName} onChange={e => upd('directorName', e.target.value)} />
          <Input label="Telefon" placeholder="+998 71 123 45 67"
            value={form.phone} onChange={e => upd('phone', e.target.value)} />
          <Input label="Bank" placeholder="Xalq banki"
            value={form.bankName} onChange={e => upd('bankName', e.target.value)} />
          <Input label="MFO" placeholder="00014"
            value={form.mfo} onChange={e => upd('mfo', e.target.value)} />
          <Input label="Hisob raqami" placeholder="20208000000000000000"
            value={form.bankAccount} onChange={e => upd('bankAccount', e.target.value)} />
        </div>

        <Input label="Manzil" placeholder="Shahar, tuman, ko'cha"
          value={form.address} onChange={e => upd('address', e.target.value)} />
      </div>
    </Modal>
  )
}

// ============================================
// ASOSIY SAHIFA
// ============================================
export default function KontragentlarPage() {
  const { currentOrg } = useAuth()
  const [search,   setSearch]   = useState('')
  const [addModal, setAddModal] = useState(false)
  const [editCp,   setEditCp]   = useState<Counterparty | null>(null)

  const { data: cps = [], isLoading } = useQuery({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/counterparties?orgId=${currentOrg.id}`)
      return data as Counterparty[]
    },
    enabled: !!currentOrg?.id,
  })

  const filtered = cps.filter(cp =>
    !search ||
    cp.name?.toLowerCase().includes(search.toLowerCase()) ||
    cp.inn?.includes(search)
  )

  if (!currentOrg) {
    return (
      <EmptyState
        icon={<AlertCircle size={28} />}
        title="Tashkilot tanlanmagan"
        description="Avval tashkilot tanlang"
      />
    )
  }

  return (
    <div>
      <PageHeader
        title="Kontragentlar"
        description="Shartnoma ikkinchi tomonlari"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Kontragentlar' }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />}
              onClick={() => {
                if (filtered.length === 0) { toast.error("Eksport uchun ma'lumot yo'q"); return }
                exportCounterpartiesExcel(filtered, currentOrg?.name || 'tashkilot')
                toast.success('Excel yuklandi')
              }}>
              Excel
            </Button>
            <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => setAddModal(true)}>
              Qo'shish
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Input
          placeholder="Nom yoki STIR bo'yicha qidirish..."
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {['Nomi', 'STIR', 'Rahbar', 'Bank', 'Holat', ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={6} />
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={<Users size={24} />}
                      title="Kontragentlar yo'q"
                      description="Birinchi kontragentni qo'shing"
                      action={{ label: "Qo'shish", onClick: () => setAddModal(true) }}
                    />
                  </td>
                </tr>
              ) : (
                filtered.map(cp => (
                  <tr key={cp.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-[#0F172A]">{cp.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#475569]">
                      {cp.inn || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569]">
                      {cp.directorName || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">
                      {cp.bankName || '—'}
                    </td>
                    <td className="px-4 py-3">
                      {cp.stirStatus ? (
                        <Badge
                          variant={
                            cp.stirStatus === 'active'   ? 'success' :
                            cp.stirStatus === 'inactive' ? 'danger'  : 'default'
                          }
                          dot size="sm"
                        >
                          {cp.stirStatus === 'active'   ? 'Faol' :
                           cp.stirStatus === 'inactive' ? 'Nofaol' : "Noma'lum"}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">Tekshirilmagan</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setEditCp(cp)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-all"
                      >
                        <Edit2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <CpFormModal
        open={addModal || !!editCp}
        cp={editCp}
        orgId={currentOrg.id}
        onClose={() => { setAddModal(false); setEditCp(null) }}
      />
    </div>
  )
}
