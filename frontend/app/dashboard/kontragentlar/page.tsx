'use client'

import { useState }    from 'react'
import { useTranslations } from 'next-intl'
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

function CpFormModal({ cp, open, onClose, orgId }: {
  cp?:     Counterparty | null
  open:    boolean
  onClose: () => void
  orgId:   string
}) {
  const t      = useTranslations('counterparties')
  const tu     = useTranslations('ui')
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
      toast.success(isEdit ? t('toast.updated') : t('toast.added'))
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
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
      title={isEdit ? t('editCounterparty') : t('newCounterparty')}
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
      <div className="space-y-4">
        <StirInput
          value={form.inn}
          onChange={v => upd('inn', v)}
          onData={handleStirData}
          autoSearch
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('form.name')} placeholder={t('form.namePlaceholder')}
            value={form.name} onChange={e => upd('name', e.target.value)} required />
          <Input label={t('form.director')} placeholder={t('form.directorPlaceholder')}
            value={form.directorName} onChange={e => upd('directorName', e.target.value)} />
          <Input label={t('form.phone')} placeholder={t('form.phonePlaceholder')}
            value={form.phone} onChange={e => upd('phone', e.target.value)} />
          <Input label={t('form.bankName')} placeholder={t('form.bankPlaceholder')}
            value={form.bankName} onChange={e => upd('bankName', e.target.value)} />
          <Input label={t('form.mfo')} placeholder={t('form.mfoPlaceholder')}
            value={form.mfo} onChange={e => upd('mfo', e.target.value)} />
          <Input label={t('form.bankAccount')} placeholder={t('form.bankAccountPlaceholder')}
            value={form.bankAccount} onChange={e => upd('bankAccount', e.target.value)} />
        </div>

        <Input label={t('form.address')} placeholder={t('form.addressPlaceholder')}
          value={form.address} onChange={e => upd('address', e.target.value)} />
      </div>
    </Modal>
  )
}

export default function KontragentlarPage() {
  const t = useTranslations('counterparties')
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
        title={t('noOrgSelected')}
        description={t('selectOrgFirst')}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('title') }
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />}
              onClick={() => {
                if (filtered.length === 0) { toast.error(t('toast.noExportData')); return }
                exportCounterpartiesExcel(filtered, currentOrg?.name || 'tashkilot')
                toast.success(t('toast.excelDownloaded'))
              }}>
              Excel
            </Button>
            <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => setAddModal(true)}>
              {t('add')}
            </Button>
          </div>
        }
      />

      <div className="mb-4">
        <Input
          placeholder={t('searchPlaceholder')}
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
                {[t('table.name'), t('table.stir'), t('table.director'), t('table.bank'), t('table.status'), ''].map(h => (
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
                      title={t('noCounterparties')}
                      description={t('noCounterpartiesDescription')}
                      action={{ label: t('add'), onClick: () => setAddModal(true) }}
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
                          {cp.stirStatus === 'active'   ? t('active') :
                           cp.stirStatus === 'inactive' ? t('inactive') : t('unknown')}
                        </Badge>
                      ) : (
                        <span className="text-xs text-[#94A3B8]">{t('checking')}</span>
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
        key={editCp?.id ?? (addModal ? 'new' : 'closed')}
        open={addModal || !!editCp}
        cp={editCp}
        orgId={currentOrg.id}
        onClose={() => { setAddModal(false); setEditCp(null) }}
      />
    </div>
  )
}
