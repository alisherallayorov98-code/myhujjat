'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter }    from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Plus, Users, Search, Edit2, AlertCircle, Download,
  Trash2, X, FileText, RefreshCw, TrendingUp, CheckCircle, Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient }   from '@tanstack/react-query'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Button }       from '@/components/ui/Button'
import { Input }        from '@/components/ui/Input'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Modal, ConfirmDialog }        from '@/components/ui/Modal'
import { Pagination }   from '@/components/ui/Pagination'
import { EmptyState, TableRowSkeleton } from '@/components/ui/Skeleton'
import { StirInput, type StirData } from '@/components/shared/StirInput'
import { useAuth }      from '@/hooks/useAuth'
import { useDebouncedValue }   from '@/hooks/useDebouncedValue'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import api              from '@/lib/api'
import { exportCounterpartiesExcel } from '@/lib/export/listExport'
import { cn }           from '@/lib/cn'
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
  const router = useRouter()
  const qc = useQueryClient()
  const { currentOrg } = useAuth()
  const [search,        setSearch]        = useState('')
  const [statusFilter,  setStatusFilter]  = useState('')
  const [page,          setPage]          = useState(1)
  const [addModal,      setAddModal]      = useState(false)
  const [editCp,        setEditCp]        = useState<Counterparty | null>(null)
  const [deleteCp,      setDeleteCp]      = useState<Counterparty | null>(null)
  const [selected,      setSelected]      = useState<Set<string>>(new Set())
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  // Search debounce — har harf yozganda emas, 300ms keyin
  const debouncedSearch = useDebouncedValue(search, 300)

  const searchInputRef = useRef<HTMLInputElement>(null)
  useKeyboardShortcut('mod+k', useCallback(() => {
    searchInputRef.current?.focus()
  }, []))
  useKeyboardShortcut('mod+n', useCallback(() => {
    setAddModal(true)
  }, []))
  useKeyboardShortcut('escape', useCallback(() => {
    if (selected.size > 0) setSelected(new Set())
  }, [selected.size]))

  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ['counterparties', currentOrg?.id, page, debouncedSearch, statusFilter],
    queryFn:  async () => {
      if (!currentOrg?.id) return { data: [] as Counterparty[], meta: { total: 0, totalPages: 1, page: 1, limit: 20 } }
      const params = new URLSearchParams({
        orgId: currentOrg.id,
        page:  String(page),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
      })
      const { data } = await api.get(`/counterparties?${params}`)
      return data as { data: Counterparty[]; meta: { total: number; totalPages: number; page: number; limit: number } }
    },
    enabled: !!currentOrg?.id,
    retry:   1,
  })

  // Frontend STIR statusi bo'yicha filter
  const rawCps = data?.data || []
  const filtered = statusFilter
    ? rawCps.filter((cp: Counterparty) => cp.stirStatus === statusFilter)
    : rawCps
  const cps        = rawCps
  const totalPages = data?.meta?.totalPages || 1
  const total      = data?.meta?.total || 0
  const allOnPageSelected = filtered.length > 0 && filtered.every((c: Counterparty) => selected.has(c.id))

  // ─── Mutations
  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/counterparties/${id}?orgId=${currentOrg!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['counterparties'] })
      setDeleteCp(null)
      toast.success(t('toast.deleted'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  function toggleSelected(id: string) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  function toggleSelectAll() {
    if (allOnPageSelected) setSelected(new Set())
    else setSelected(new Set(filtered.map((c: Counterparty) => c.id)))
  }

  const bulkDeleteMut = useMutation({
    mutationFn: async () => {
      const ids = Array.from(selected)
      await Promise.all(ids.map(id =>
        api.delete(`/counterparties/${id}?orgId=${currentOrg!.id}`)
      ))
      return { count: ids.length }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['counterparties'] })
      setSelected(new Set())
      setBulkDeleteOpen(false)
      toast.success(t('toast.bulkDeleted', { count: res.count }))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

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

      {/* Statistika kartochkalari */}
      {total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <CpStatCard
            label={t('stats.total')}
            value={total.toLocaleString()}
            icon={<Users size={16} />}
            color="bg-[#F1F5F9] text-[#475569]"
          />
          <CpStatCard
            label={t('stats.active')}
            value={cps.filter((c: Counterparty) => c.stirStatus === 'active').length.toLocaleString()}
            icon={<CheckCircle size={16} />}
            color="bg-[#DCFCE7] text-[#15803D]"
          />
          <CpStatCard
            label={t('stats.inactive')}
            value={cps.filter((c: Counterparty) => c.stirStatus === 'inactive').length.toLocaleString()}
            icon={<AlertCircle size={16} />}
            color="bg-[#FEE2E2] text-[#B91C1C]"
          />
          <CpStatCard
            label={t('stats.unknown')}
            value={cps.filter((c: Counterparty) => !c.stirStatus || c.stirStatus === 'unknown').length.toLocaleString()}
            icon={<RefreshCw size={16} />}
            color="bg-[#FEF3C7] text-[#B45309]"
          />
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-sm flex-1 sm:flex-initial">
          <Input
            ref={searchInputRef}
            placeholder={t('searchPlaceholder') + ' (Ctrl+K)'}
            leftIcon={isFetching && debouncedSearch ? <Loader2 size={15} className="animate-spin text-[#2563EB]" /> : <Search size={15} />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]"
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">{t('filter.allStatuses')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
          <option value="unknown">{t('unknown')}</option>
        </select>
        {(search || statusFilter) && (
          <button
            onClick={() => { setSearch(''); setStatusFilter(''); setPage(1) }}
            className="h-10 px-3 rounded-lg text-sm bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] flex items-center gap-1.5 transition border border-[#FECACA]"
          >
            <X size={13} />
            {t('filter.clearAll')}
          </button>
        )}
        <div className="flex-1" />
        {total > 0 && (
          <span className="text-xs text-[#94A3B8] shrink-0">
            {filtered.length} / {total} ta
          </span>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-[#1E40AF]">
            {t('bulk.selected', { count: selected.size })}
          </span>
          <div className="flex-1" />
          <Button
            size="xs" variant="outline"
            className="text-red-500 hover:bg-red-50 hover:border-red-200"
            leftIcon={<Trash2 size={11} />}
            onClick={() => setBulkDeleteOpen(true)}
          >
            {t('bulk.delete')}
          </Button>
          <Button size="xs" variant="outline" onClick={() => setSelected(new Set())}>
            {t('bulk.clear')}
          </Button>
        </div>
      )}

      {isError ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
              <Users size={20} className="text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Ma'lumotlarni yuklashda xatolik</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Internet aloqasini tekshirib, qayta urinib ko'ring</p>
            </div>
            <button onClick={() => refetch()} className="text-xs font-medium text-[#2563EB] hover:underline">Qayta urinish</button>
          </div>
        </Card>
      ) : !isLoading && filtered.length === 0 && (
        <EmptyState
          icon={<Users size={28} />}
          title={t('noCounterparties')}
          description={t('noCounterpartiesDescription')}
          action={{ label: t('add'), onClick: () => setAddModal(true) }}
        />
      )}

      {(isLoading || filtered.length > 0) && (
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <th className="w-10 px-3 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
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
                  <TableRowSkeleton key={i} cols={7} />
                ))
              ) : (
                filtered.map((cp: Counterparty) => {
                  const isChecked = selected.has(cp.id)
                  return (
                  <tr key={cp.id} className={cn(
                    'border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group',
                    isChecked && 'bg-[#F0F9FF]',
                  )}>
                    <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelected(cp.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{cp.name}</p>
                    </td>
                    <td className="px-4 py-3 text-sm font-mono text-[#475569]">
                      {cp.inn || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#475569] max-w-[160px] truncate">
                      {cp.directorName || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#94A3B8] max-w-[160px] truncate">
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
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => router.push(`/dashboard/shartnomalar/yangi?cpId=${cp.id}`)}
                          title={t('newContract')}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#DCFCE7] transition-all"
                        >
                          <FileText size={14} />
                        </button>
                        <button
                          onClick={() => setEditCp(cp)}
                          title={t('edit')}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#DBEAFE] transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteCp(cp)}
                          title={t('delete')}
                          className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-[#E2E8F0]">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}
      </Card>
      )}

      <CpFormModal
        key={editCp?.id ?? (addModal ? 'new' : 'closed')}
        open={addModal || !!editCp}
        cp={editCp}
        orgId={currentOrg.id}
        onClose={() => { setAddModal(false); setEditCp(null) }}
      />

      <ConfirmDialog
        open={!!deleteCp}
        onClose={() => setDeleteCp(null)}
        onConfirm={() => deleteCp && deleteMut.mutate(deleteCp.id)}
        title={t('deleteTitle')}
        description={deleteCp ? t('deleteConfirm', { name: deleteCp.name }) : ''}
        variant="danger"
        loading={deleteMut.isPending}
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={() => bulkDeleteMut.mutate()}
        title={t('bulk.deleteTitle')}
        description={t('bulk.deleteConfirm', { count: selected.size })}
        variant="danger"
        loading={bulkDeleteMut.isPending}
      />
    </div>
  )
}

// ─── Statistika kartochkasi ─────────────────────────────────────────
function CpStatCard({ label, value, icon, color }: {
  label: string
  value: string
  icon:  React.ReactNode
  color: string
}) {
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex items-center gap-3">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-[#94A3B8] truncate">{label}</p>
        <p className="text-base font-bold text-[#0F172A] truncate tabular-nums">{value}</p>
      </div>
    </div>
  )
}
