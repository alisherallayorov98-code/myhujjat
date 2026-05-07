'use client'

import { useState, useMemo, useCallback } from 'react'
import Link                        from 'next/link'
import { useRouter }               from 'next/navigation'
import { useTranslations }         from 'next-intl'
import {
  Plus, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Download, ChevronLeft, ChevronRight, Calendar, Trash2, Copy, Send, Eye,
  TrendingUp, CheckCircle, FileEdit, DollarSign, X, Filter, Star, Loader2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import { Card }      from '@/components/ui/Card'
import { ContractStatusBadge } from '@/components/ui/Badge'
import { ConfirmDialog }     from '@/components/ui/Modal'
import { EmptyState, TableRowSkeleton } from '@/components/ui/Skeleton'
import { useDebouncedValue }   from '@/hooks/useDebouncedValue'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import { useRef }              from 'react'
import { useAuth }   from '@/hooks/useAuth'
import api           from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { exportContractsExcel } from '@/lib/export/listExport'
import { cn }        from '@/lib/cn'
import toast         from 'react-hot-toast'

type SortKey   = 'createdAt' | 'amount' | 'contractNumber' | 'contractDate'
type SortOrder = 'asc' | 'desc'
type DateRange = 'all' | 'last7days' | 'last30days' | 'thisMonth' | 'lastMonth' | 'thisYear'

export default function ShartnomalarPage() {
  const t     = useTranslations('contracts')
  const tBulk = useTranslations('bulkSend')
  const { currentOrg, canCreate, isPro } = useAuth()
  const router = useRouter()
  const qc = useQueryClient()

  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [cpFilter,     setCpFilter]     = useState('')
  const [dateRange,    setDateRange]    = useState<DateRange>('all')

  // Search debounce — har harf yozganda emas, 300ms keyin API chaqiriladi
  const debouncedSearch = useDebouncedValue(search, 300)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const [sortKey,      setSortKey]      = useState<SortKey>('createdAt')
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('desc')
  const [page,             setPage]             = useState(1)
  const [selected,         setSelected]         = useState<Set<string>>(new Set())
  const [bulkConfirm,      setBulkConfirm]      = useState<string | null>(null)
  const [bulkDeleteOpen,   setBulkDeleteOpen]   = useState(false)
  const [excelLoading,     setExcelLoading]     = useState(false)

  // Keyboard shortcuts (power users uchun)
  useKeyboardShortcut('mod+n', useCallback(() => {
    if (canCreate) router.push('/dashboard/shartnomalar/yangi')
  }, [canCreate, router]))
  useKeyboardShortcut('mod+k', useCallback(() => {
    searchInputRef.current?.focus()
  }, []))
  useKeyboardShortcut('escape', useCallback(() => {
    if (selected.size > 0) setSelected(new Set())
  }, [selected.size]))

  // Statistika kartochkalari uchun
  const { data: stats } = useQuery<{
    total:       number
    active:      number
    draft:       number
    completed:   number
    cancelled:   number
    thisMonth:   number
    totalAmount: number
  }>({
    queryKey: ['contract-stats', currentOrg?.id],
    queryFn:  () => api.get(`/contracts/stats/${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['contracts', currentOrg?.id, debouncedSearch, typeFilter, statusFilter, cpFilter, page],
    queryFn:  async () => {
      if (!currentOrg?.id) return { data: [], meta: { total: 0, totalPages: 1 } }
      const params = new URLSearchParams({
        orgId: currentOrg.id,
        page:  String(page),
        limit: '20',
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(typeFilter      && { type: typeFilter }),
        ...(statusFilter    && { status: statusFilter }),
        ...(cpFilter        && { counterpartyId: cpFilter }),
      })
      const { data } = await api.get(`/contracts?${params}`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  // Kontragentlar ro'yxati — filter dropdown uchun
  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties-list', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}&limit=200`).then(r => r.data?.data || []),
    enabled:  !!currentOrg?.id,
  })

  const bulkStatusMut = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await Promise.all(ids.map(id =>
        api.patch(`/contracts/${id}/status?orgId=${currentOrg!.id}`, { status })
      ))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['contract-stats'] })
      const count = selected.size
      setSelected(new Set())
      toast.success(t('bulk.updated', { count }))
    },
  })

  const togglePinMut = useMutation({
    mutationFn: (id: string) => api.patch(`/contracts/${id}/pin?orgId=${currentOrg!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  const bulkDeleteMut = useMutation({
    mutationFn: () => api.post('/contracts/bulk-delete', {
      orgId: currentOrg!.id,
      ids:   Array.from(selected),
    }),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      qc.invalidateQueries({ queryKey: ['contract-stats'] })
      const count = res.data?.deleted ?? 0
      setSelected(new Set())
      setBulkDeleteOpen(false)
      toast.success(t('bulk.deleted', { count }))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  const rawContracts = data?.data || []

  // Sana oralig'i filtri (frontend)
  const filteredByDate = useMemo(() => {
    if (dateRange === 'all') return rawContracts
    const now = new Date()
    return rawContracts.filter((c: any) => {
      const d = new Date(c.contractDate || c.createdAt)
      const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
      switch (dateRange) {
        case 'last7days':
          return diffDays >= 0 && diffDays <= 7
        case 'last30days':
          return diffDays >= 0 && diffDays <= 30
        case 'thisMonth':
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        case 'lastMonth': {
          const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear()
        }
        case 'thisYear':
          return d.getFullYear() === now.getFullYear()
        default:
          return true
      }
    })
  }, [rawContracts, dateRange])

  // Faol filterlar soni — "Tozalash" tugmasini ko'rsatish va badge uchun
  const activeFiltersCount = useMemo(() => {
    let n = 0
    if (search.trim())  n++
    if (typeFilter)     n++
    if (statusFilter)   n++
    if (cpFilter)       n++
    if (dateRange !== 'all') n++
    return n
  }, [search, typeFilter, statusFilter, cpFilter, dateRange])

  function clearAllFilters() {
    setSearch('')
    setTypeFilter('')
    setStatusFilter('')
    setCpFilter('')
    setDateRange('all')
    setPage(1)
  }

  // Sortlash (frontend)
  const contracts = useMemo(() => {
    const sorted = [...filteredByDate].sort((a: any, b: any) => {
      let cmp = 0
      if (sortKey === 'amount') cmp = Number(a.amount) - Number(b.amount)
      else if (sortKey === 'contractNumber') cmp = String(a.contractNumber).localeCompare(String(b.contractNumber))
      else cmp = new Date(a[sortKey] || 0).getTime() - new Date(b[sortKey] || 0).getTime()
      return sortOrder === 'asc' ? cmp : -cmp
    })
    return sorted
  }, [filteredByDate, sortKey, sortOrder])

  const totalPages = data?.meta?.totalPages || 1
  const allOnPageSelected = contracts.length > 0 && contracts.every((c: any) => selected.has(c.id))

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortOrder(o => o === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('desc')
    }
  }

  function toggleSelected(id: string) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (allOnPageSelected) {
      setSelected(new Set())
    } else {
      const ids = new Set(contracts.map((c: any) => c.id))
      setSelected(ids)
      toast.success(t('bulk.allSelected', { count: ids.size }))
    }
  }

  async function handleExportExcel() {
    if (contracts.length === 0) { toast.error(t('toast.noExportData')); return }
    setExcelLoading(true)
    try {
      await exportContractsExcel(contracts, currentOrg?.name || 'tashkilot')
      toast.success(t('toast.excelDownloaded'))
    } finally {
      setExcelLoading(false)
    }
  }

  function handleBulkStatus(status: string) {
    if (selected.size === 0) return
    setBulkConfirm(status)
  }
  function executeBulkStatus() {
    if (!bulkConfirm) return
    bulkStatusMut.mutate({ ids: Array.from(selected), status: bulkConfirm })
    setBulkConfirm(null)
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('totalCount', { count: data?.meta?.total || 0 })}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('title') },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />} loading={excelLoading} onClick={handleExportExcel}>
              Excel
            </Button>
            {isPro && (
              <Link href="/dashboard/shartnomalar/ommaviy">
                <Button variant="outline" size="sm" leftIcon={<Send size={14} />}>
                  {tBulk('navItem')}
                </Button>
              </Link>
            )}
            <Link href="/dashboard/shartnomalar/yangi">
              <Button leftIcon={<Plus size={14} />} size="sm" disabled={!canCreate}
                title={!canCreate ? t('limit.limitReached') : ''}>
                {t('new')}
              </Button>
            </Link>
          </div>
        }
      />

      {/* Statistika kartochkalari */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <StatCard
            label={t('stats.total')}
            value={stats.total.toLocaleString()}
            icon={<FileText size={16} />}
            color="bg-[#F1F5F9] text-[#475569]"
          />
          <StatCard
            label={t('stats.active')}
            value={stats.active.toLocaleString()}
            icon={<CheckCircle size={16} />}
            color="bg-[#DCFCE7] text-[#15803D]"
          />
          <StatCard
            label={t('stats.draft')}
            value={stats.draft.toLocaleString()}
            icon={<FileEdit size={16} />}
            color="bg-[#FEF3C7] text-[#B45309]"
          />
          <StatCard
            label={t('stats.thisMonth')}
            value={stats.thisMonth.toLocaleString()}
            icon={<TrendingUp size={16} />}
            color="bg-[#DBEAFE] text-[#1D4ED8]"
          />
          <StatCard
            label={t('stats.totalAmount')}
            value={formatCurrency(stats.totalAmount)}
            icon={<DollarSign size={16} />}
            color="bg-[#EDE9FE] text-[#7C3AED]"
            full
          />
        </div>
      )}

      {/* Filtrlar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative max-w-xs flex-1 sm:flex-initial">
          <Input
            ref={searchInputRef}
            placeholder={t('filter.search') + ' (Ctrl+K)'}
            leftIcon={isFetching && search ? <Loader2 size={15} className="animate-spin text-[#2563EB]" /> : <Search size={15} />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          {search && (
            <button
              onClick={() => { setSearch(''); setPage(1) }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]"
              title={t('filter.clearSearch')}
            >
              <X size={13} />
            </button>
          )}
        </div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="">{t('filter.allTypes')}</option>
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="">{t('filter.allStatuses')}</option>
          <option value="DRAFT">{t('statusOptions.DRAFT')}</option>
          <option value="ACTIVE">{t('statusOptions.ACTIVE')}</option>
          <option value="COMPLETED">{t('statusOptions.COMPLETED')}</option>
          <option value="CANCELLED">{t('statusOptions.CANCELLED')}</option>
        </select>
        <select value={cpFilter} onChange={e => { setCpFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] max-w-[200px]">
          <option value="">{t('filter.allCps')}</option>
          {cps.map((cp: any) => (
            <option key={cp.id} value={cp.id}>{cp.name}</option>
          ))}
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="all">{t('filter.allDates')}</option>
          <option value="last7days">{t('filter.last7days')}</option>
          <option value="last30days">{t('filter.last30days')}</option>
          <option value="thisMonth">{t('filter.thisMonth')}</option>
          <option value="lastMonth">{t('filter.lastMonth')}</option>
          <option value="thisYear">{t('filter.thisYear')}</option>
        </select>
        {activeFiltersCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="h-10 px-3 rounded-lg text-sm bg-[#FEE2E2] text-[#B91C1C] hover:bg-[#FECACA] flex items-center gap-1.5 transition border border-[#FECACA]"
          >
            <X size={13} />
            {t('filter.clearAll')} ({activeFiltersCount})
          </button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl flex items-center gap-3">
          <span className="text-sm font-medium text-[#1E40AF]">
            {t('bulk.selected', { count: selected.size })}
          </span>
          <div className="flex-1" />
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('ACTIVE')}>
            {t('bulk.makeActive')}
          </Button>
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('COMPLETED')}>
            {t('bulk.makeCompleted')}
          </Button>
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('CANCELLED')}>
            {t('bulk.makeCancelled')}
          </Button>
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

      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
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
                <th className="w-8 px-2 py-3" />
                <ThSort label={t('table.number')}     col="contractNumber" sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('table.type')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('table.counterparty')}</th>
                <ThSort label={t('table.date')}     col="contractDate" sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} />
                <ThSort label={t('table.amount')}    col="amount"        sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} align="right" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">{t('table.status')}</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={9} />
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <EmptyState
                      icon={<FileText size={28} />}
                      title={t('empty.title')}
                      description={t('empty.description')}
                      action={{
                        label: t('new'),
                        onClick: () => router.push('/dashboard/shartnomalar/yangi'),
                      }}
                    />
                  </td>
                </tr>
              ) : (
                contracts.map((c: any) => {
                  const typeCfg = CONTRACT_TYPE_CONFIG[c.contractType as keyof typeof CONTRACT_TYPE_CONFIG]
                  const isChecked = selected.has(c.id)
                  return (
                    <tr key={c.id}
                      className={cn(
                        'border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group',
                        isChecked && 'bg-[#F0F9FF]',
                      )}>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelected(c.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => togglePinMut.mutate(c.id)}
                          className={cn(
                            'p-1 rounded transition-all',
                            c.isPinned
                              ? 'text-[#F59E0B] hover:text-[#D97706] hover:bg-[#FEF3C7]'
                              : 'text-[#CBD5E1] hover:text-[#F59E0B] hover:bg-[#FEF3C7] opacity-100 lg:opacity-0 lg:group-hover:opacity-100',
                            c.isPinned && 'opacity-100',
                          )}
                          title={c.isPinned ? t('unpin') : t('pin')}
                        >
                          <Star size={14} className={c.isPinned ? 'fill-current' : ''} />
                        </button>
                      </td>
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        <span className="text-xs font-mono text-[#2563EB]">{c.contractNumber}</span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        <div className="flex items-center gap-1.5">
                          <span>{typeCfg?.icon}</span>
                          <span className="text-sm text-[#475569]">{typeCfg?.name || c.contractType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#0F172A] cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        {c.counterparty?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8] cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        {formatDate(c.contractDate, 'short')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#0F172A] tabular-nums text-right cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        {c.amount > 0 ? formatCurrency(c.amount) : '—'}
                      </td>
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => router.push(`/dashboard/shartnomalar/${c.id}`)}>
                        <ContractStatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => router.push(`/dashboard/shartnomalar/${c.id}/preview`)}
                            title={t('viewBtn')}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#DBEAFE] transition-all"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/shartnomalar/yangi?cloneFrom=${c.id}`)}
                            title={t('clone.button')}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#DCFCE7] transition-all"
                          >
                            <Copy size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        )}
      </Card>

      <ConfirmDialog
        open={!!bulkConfirm}
        onClose={() => setBulkConfirm(null)}
        onConfirm={executeBulkStatus}
        title={t('bulk.confirmTitle')}
        description={bulkConfirm ? t('bulk.confirmStatus', {
          count: selected.size,
          status: (t.raw as any)('statusOptions')[bulkConfirm] || bulkConfirm,
        }) : ''}
        variant={bulkConfirm === 'CANCELLED' ? 'danger' : 'primary'}
        loading={bulkStatusMut.isPending}
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
function StatCard({ label, value, icon, color, full }: {
  label: string
  value: string
  icon:  React.ReactNode
  color: string
  full?: boolean
}) {
  return (
    <div className={cn(
      'bg-white border border-[#E2E8F0] rounded-xl p-3.5 flex items-center gap-3',
      full && 'col-span-2 sm:col-span-1 lg:col-span-1',
    )}>
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

// ─── Saralanadigan ustun sarlavhasi ──────────────────────────────────
function ThSort({ label, col, sortKey, sortOrder, onClick, align = 'left' }: {
  label: string
  col:   SortKey
  sortKey: SortKey
  sortOrder: SortOrder
  onClick: (col: SortKey) => void
  align?: 'left' | 'right'
}) {
  const active = sortKey === col
  return (
    <th
      className={cn(
        'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#94A3B8] cursor-pointer hover:text-[#475569] transition select-none',
        align === 'right' ? 'text-right' : 'text-left'
      )}
      onClick={() => onClick(col)}
    >
      <span className={cn('inline-flex items-center gap-1', active && 'text-[#2563EB]')}>
        {label}
        {active
          ? (sortOrder === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />)
          : <ArrowUpDown size={11} className="opacity-40" />
        }
      </span>
    </th>
  )
}

// ─── Compact pagination (1...4 5 6...10) ─────────────────────────────
function Pagination({ page, totalPages, onPageChange }: {
  page:        number
  totalPages:  number
  onPageChange: (p: number) => void
}) {
  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: (number | '...')[] = [1]
    if (page > 3) out.push('...')
    const start = Math.max(2, page - 1)
    const end   = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) out.push(i)
    if (page < totalPages - 2) out.push('...')
    out.push(totalPages)
    return out
  }
  const pages = getPages()

  return (
    <div className="flex justify-center items-center gap-1 p-3 border-t border-[#E2E8F0]">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 transition"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-[#94A3B8] text-xs">...</span>
      ) : (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'w-8 h-8 rounded-lg text-sm font-medium transition-all',
            page === p ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F1F5F9]'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 transition"
      >
        <ChevronRight size={14} />
      </button>
      <span className="ml-2 text-xs text-[#94A3B8] whitespace-nowrap">{page} / {totalPages}</span>
    </div>
  )
}
