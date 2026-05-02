'use client'

import { useState }                                      from 'react'
import { useTranslations }                               from 'next-intl'
import { Plus, Users, Search, Edit2, Trash2, Building2, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient }          from '@tanstack/react-query'
import { PageHeader }                                     from '@/components/layout/PageHeader'
import { Button }                                         from '@/components/ui/Button'
import { Input }                                          from '@/components/ui/Input'
import { Card }                                           from '@/components/ui/Card'
import { Badge }                                          from '@/components/ui/Badge'
import { Modal }                                          from '@/components/ui/Modal'
import { EmptyState, TableRowSkeleton }                   from '@/components/ui/Skeleton'
import { useAuth }                                        from '@/hooks/useAuth'
import api                                                from '@/lib/api'
import { exportEmployeesExcel }                          from '@/lib/export/listExport'
import toast                                              from 'react-hot-toast'
import Link                                               from 'next/link'

interface Employee {
  id:            string
  ism:           string
  jshshir?:      string
  lavozim?:      string
  bolim?:        string
  maosh?:        string
  ishBoshi?:     string
  tel?:          string
  tugilganSana?: string
}

function XodimModal({
  xodim, open, onClose, orgId,
}: {
  xodim?:  Employee | null
  open:    boolean
  onClose: () => void
  orgId:   string
}) {
  const t  = useTranslations('hr')
  const qc     = useQueryClient()
  const isEdit = !!xodim

  const [form, setForm] = useState({
    ism:          xodim?.ism          ?? '',
    jshshir:      xodim?.jshshir      ?? '',
    passport:     '',
    lavozim:      xodim?.lavozim      ?? '',
    bolim:        xodim?.bolim        ?? '',
    maosh:        xodim?.maosh        ?? '',
    ishBoshi:     xodim?.ishBoshi     ?? new Date().toISOString().split('T')[0],
    tel:          xodim?.tel          ?? '',
    tugilganSana: xodim?.tugilganSana ?? '',
    manzil:       '',
  })
  const [pinflLoading, setPinflLoading] = useState(false)

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      isEdit
        ? api.put(`/employees/${xodim!.id}`, data)
        : api.post('/employees', { ...data, organizationId: orgId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employees-stats'] })
      toast.success(isEdit ? t('employeeUpdated') : t('employeeAdded'))
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  async function checkPinfl() {
    if (!form.jshshir || form.jshshir.length !== 14) return
    setPinflLoading(true)
    try {
      const { data } = await api.get(`/stir/pinfl/${form.jshshir}`)
      if (data.fullName) {
        setForm(f => ({ ...f, ism: data.fullName }))
        toast.success(t('jshshirFound'))
      }
    } catch {
      toast.error(t('jshshirNotFound'))
    } finally {
      setPinflLoading(false)
    }
  }

  const upd = (key: keyof typeof form, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? t('editEmployee') : t('newEmployee')}
      size="lg"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>{t('cancel')}</Button>
          <Button size="sm" loading={mutation.isPending} disabled={!form.ism}
            onClick={() => mutation.mutate(form)}>
            {isEdit ? t('save') : t('add')}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label={t('jshshir')}
              placeholder={t('jshshirPlace')}
              value={form.jshshir}
              onChange={e => upd('jshshir', e.target.value.replace(/\D/g, '').slice(0, 14))}
              hint={t('jshshirHint')}
            />
          </div>
          <Button size="sm" variant="secondary"
            loading={pinflLoading}
            disabled={form.jshshir.length !== 14}
            onClick={checkPinfl}>
            {t('check')}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label={t('fullName')} placeholder={t('fullNamePlace')}
            value={form.ism} onChange={e => upd('ism', e.target.value)} required />
          <Input label={t('passport')} placeholder={t('passportPlace')}
            value={form.passport} onChange={e => upd('passport', e.target.value)} />
          <Input label={t('lavozim')} placeholder={t('lavozimPlace')}
            value={form.lavozim} onChange={e => upd('lavozim', e.target.value)} />
          <Input label={t('bolim')} placeholder={t('bolimPlace')}
            value={form.bolim} onChange={e => upd('bolim', e.target.value)} />
          <Input label={t('monthlySalary')} placeholder={t('salaryPlace')} type="number"
            value={form.maosh} onChange={e => upd('maosh', e.target.value)} />
          <Input label={t('ishBoshi')} type="date"
            value={form.ishBoshi} onChange={e => upd('ishBoshi', e.target.value)} />
          <Input label={t('phone')} placeholder={t('phonePlace')}
            value={form.tel} onChange={e => upd('tel', e.target.value)} />
          <Input label={t('birthDate')} type="date"
            value={form.tugilganSana} onChange={e => upd('tugilganSana', e.target.value)} />
        </div>
        <Input label={t('address')} placeholder={t('addressPlace')}
          value={form.manzil} onChange={e => upd('manzil', e.target.value)} />
      </div>
    </Modal>
  )
}

export default function KadrlarPage() {
  const t = useTranslations('hr')
  const { currentOrg } = useAuth()
  const qc             = useQueryClient()

  const [search,    setSearch]    = useState('')
  const [addModal,  setAddModal]  = useState(false)
  const [editXodim, setEditXodim] = useState<Employee | null>(null)

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['employees', currentOrg?.id, search],
    queryFn:  () => {
      const params = new URLSearchParams({ orgId: currentOrg!.id })
      if (search) params.set('search', search)
      return api.get(`/employees?${params}`).then(r => r.data)
    },
    enabled: !!currentOrg?.id,
  })

  const { data: stats } = useQuery<{ total: number; active: number; bolimlar: any[] }>({
    queryKey: ['employees-stats', currentOrg?.id],
    queryFn:  () => api.get(`/employees/stats?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/employees/${id}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['employees'] })
      qc.invalidateQueries({ queryKey: ['employees-stats'] })
      toast.success(t('employeeDeleted'))
    },
  })

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('totalEmployees', { count: employees.length })}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />}
              onClick={() => {
                if (employees.length === 0) { toast.error(t('noEmployeesExport')); return }
                exportEmployeesExcel(employees, currentOrg?.name || 'tashkilot')
                toast.success(t('excelDownloaded'))
              }}>
              {t('excel')}
            </Button>
            <Link href="/dashboard/kadrlar/hujjat">
              <Button variant="secondary" size="sm">{t('hrDocuments')}</Button>
            </Link>
            <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => setAddModal(true)}>
              {t('addEmployee')}
            </Button>
          </div>
        }
      />

      {/* Statistika */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
              <Users size={18} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0F172A]">{stats.active}</p>
              <p className="text-xs text-[#94A3B8]">{t('activeEmployees')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-[#16A34A]" />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0F172A]">{stats.bolimlar?.length ?? 0}</p>
              <p className="text-xs text-[#94A3B8]">{t('departments')}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Qidiruv */}
      <div className="mb-4">
        <Input
          placeholder={t('searchPlace')}
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {/* Jadval */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {[t('tableEmployee'), t('tableLavozim'), t('tableBolim'), t('tableSalary'), t('tableIshBoshi'), t('tablePhone'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Users size={28} />}
                      title={t('noEmployees')}
                      description={t('addFirstEmployee')}
                      action={{ label: t('addEmployee'), onClick: () => setAddModal(true) }}
                    />
                  </td>
                </tr>
              ) : (
                employees.map(emp => (
                  <tr key={emp.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
                          <span className="text-white text-xs font-bold">{emp.ism?.[0]?.toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#0F172A]">{emp.ism}</p>
                          {emp.jshshir && <p className="text-xs text-[#94A3B8]">{emp.jshshir}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569]">{emp.lavozim || '—'}</td>
                    <td className="px-4 py-3">
                      {emp.bolim
                        ? <Badge variant="default" size="sm">{emp.bolim}</Badge>
                        : <span className="text-[#94A3B8] text-sm">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-sm tabular-nums text-[#0F172A]">
                      {emp.maosh ? Number(emp.maosh).toLocaleString('uz-UZ') + ` ${t('som')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">
                      {emp.ishBoshi ? new Date(emp.ishBoshi).toLocaleDateString('uz-UZ') : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8]">{emp.tel || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => setEditXodim(emp)}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(t('deleteConfirm', { name: emp.ism }))) {
                              deleteMutation.mutate(emp.id)
                            }
                          }}
                          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <XodimModal
        key={editXodim?.id ?? (addModal ? 'new' : 'closed')}
        open={addModal || !!editXodim}
        xodim={editXodim}
        orgId={currentOrg?.id ?? ''}
        onClose={() => { setAddModal(false); setEditXodim(null) }}
      />
    </div>
  )
}
