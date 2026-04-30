'use client'

import { useState, useMemo }       from 'react'
import Link                        from 'next/link'
import {
  Plus, FileText, Search, ArrowUpDown, ArrowUp, ArrowDown,
  Download, ChevronLeft, ChevronRight, Calendar, Trash2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button }    from '@/components/ui/Button'
import { Input }     from '@/components/ui/Input'
import { Card }      from '@/components/ui/Card'
import { ContractStatusBadge } from '@/components/ui/Badge'
import { EmptyState, TableRowSkeleton } from '@/components/ui/Skeleton'
import { useAuth }   from '@/hooks/useAuth'
import api           from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { exportContractsExcel } from '@/lib/export/listExport'
import { cn }        from '@/lib/cn'
import toast         from 'react-hot-toast'

type SortKey   = 'createdAt' | 'amount' | 'contractNumber' | 'contractDate'
type SortOrder = 'asc' | 'desc'
type DateRange = 'all' | 'thisMonth' | 'lastMonth' | 'thisYear'

export default function ShartnomalarPage() {
  const { currentOrg, canCreate } = useAuth()
  const qc = useQueryClient()

  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange,    setDateRange]    = useState<DateRange>('all')
  const [sortKey,      setSortKey]      = useState<SortKey>('createdAt')
  const [sortOrder,    setSortOrder]    = useState<SortOrder>('desc')
  const [page,         setPage]         = useState(1)
  const [selected,     setSelected]     = useState<Set<string>>(new Set())

  const { data, isLoading } = useQuery({
    queryKey: ['contracts', currentOrg?.id, search, typeFilter, statusFilter, page],
    queryFn:  async () => {
      if (!currentOrg?.id) return { data: [], meta: { total: 0, totalPages: 1 } }
      const params = new URLSearchParams({
        orgId: currentOrg.id,
        page:  String(page),
        limit: '20',
        ...(search       && { search }),
        ...(typeFilter   && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter }),
      })
      const { data } = await api.get(`/contracts?${params}`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const bulkStatusMut = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      await Promise.all(ids.map(id =>
        api.patch(`/contracts/${id}/status?orgId=${currentOrg!.id}`, { status })
      ))
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contracts'] })
      setSelected(new Set())
      toast.success(`${selected.size} ta shartnoma yangilandi`)
    },
  })

  const rawContracts = data?.data || []

  // Sana oralig'i filtri (frontend)
  const filteredByDate = useMemo(() => {
    if (dateRange === 'all') return rawContracts
    const now = new Date()
    return rawContracts.filter((c: any) => {
      const d = new Date(c.contractDate || c.createdAt)
      switch (dateRange) {
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
      setSelected(new Set(contracts.map((c: any) => c.id)))
    }
  }

  function handleExportExcel() {
    if (contracts.length === 0) { toast.error("Eksport uchun shartnoma yo'q"); return }
    exportContractsExcel(contracts, currentOrg?.name || 'tashkilot')
    toast.success("Excel yuklandi")
  }

  function handleBulkStatus(status: string) {
    if (selected.size === 0) return
    if (!confirm(`${selected.size} ta shartnoma holati "${status}" ga o'zgartirilsinmi?`)) return
    bulkStatusMut.mutate({ ids: Array.from(selected), status })
  }

  return (
    <div>
      <PageHeader
        title="Shartnomalar"
        description={`Jami: ${data?.meta?.total || 0} ta shartnoma`}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Shartnomalar' },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={handleExportExcel}>
              Excel
            </Button>
            <Link href="/dashboard/shartnomalar/yangi">
              <Button leftIcon={<Plus size={14} />} size="sm" disabled={!canCreate}
                title={!canCreate ? 'Limit tugadi' : ''}>
                Yangi shartnoma
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filtrlar */}
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <Input
          placeholder="Qidirish..."
          leftIcon={<Search size={15} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="">Barcha turlar</option>
          {Object.entries(CONTRACT_TYPE_CONFIG).map(([key, cfg]) => (
            <option key={key} value={key}>{cfg.name}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="">Barcha holatlar</option>
          <option value="DRAFT">Qoralama</option>
          <option value="ACTIVE">Faol</option>
          <option value="COMPLETED">Tugagan</option>
          <option value="CANCELLED">Bekor</option>
        </select>
        <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)}
          className="h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
          <option value="all">Barcha sanalar</option>
          <option value="thisMonth">Bu oy</option>
          <option value="lastMonth">O'tgan oy</option>
          <option value="thisYear">Bu yil</option>
        </select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl flex items-center gap-3">
          <span className="text-sm font-medium text-[#1E40AF]">
            {selected.size} ta tanlandi
          </span>
          <div className="flex-1" />
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('ACTIVE')}>
            Faol qilish
          </Button>
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('COMPLETED')}>
            Tugagan
          </Button>
          <Button size="xs" variant="outline" onClick={() => handleBulkStatus('CANCELLED')}>
            Bekor qilish
          </Button>
          <Button size="xs" variant="outline" onClick={() => setSelected(new Set())}>
            Tozalash
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
                <ThSort label="Raqam"     col="contractNumber" sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Tur</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Kontragent</th>
                <ThSort label="Sana"     col="contractDate" sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} />
                <ThSort label="Summa"    col="amount"        sortKey={sortKey} sortOrder={sortOrder} onClick={toggleSort} align="right" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">Holat</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} cols={8} />
                ))
              ) : contracts.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<FileText size={28} />}
                      title="Shartnomalar yo'q"
                      description="Birinchi shartnomani yarating"
                      action={{
                        label: 'Yangi shartnoma',
                        onClick: () => window.location.href = '/dashboard/shartnomalar/yangi',
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
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        <span className="text-xs font-mono text-[#2563EB]">{c.contractNumber}</span>
                      </td>
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        <div className="flex items-center gap-1.5">
                          <span>{typeCfg?.icon}</span>
                          <span className="text-sm text-[#475569]">{typeCfg?.name || c.contractType}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#0F172A] cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        {c.counterparty?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8] cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        {formatDate(c.contractDate, 'short')}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-[#0F172A] tabular-nums text-right cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        {c.amount > 0 ? formatCurrency(c.amount) : '—'}
                      </td>
                      <td className="px-4 py-3 cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        <ContractStatusBadge status={c.status} />
                      </td>
                      <td className="px-3 py-3 cursor-pointer"
                        onClick={() => window.location.href = `/dashboard/shartnomalar/${c.id}`}>
                        <span className="text-[#94A3B8] opacity-0 group-hover:opacity-100 text-xs">→</span>
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
    </div>
  )
}
