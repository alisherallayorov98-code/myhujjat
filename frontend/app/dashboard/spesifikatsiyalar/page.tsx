'use client'

import { useState, useRef, useCallback, useMemo } from 'react'
import Link            from 'next/link'
import { useRouter }   from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  Plus, ClipboardList, Download, Search, X, Trash2, Edit2,
  TrendingUp, DollarSign, FileText,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Button }      from '@/components/ui/Button'
import { Input }       from '@/components/ui/Input'
import { Card }        from '@/components/ui/Card'
import { Badge }       from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState }  from '@/components/ui/Skeleton'
import { useAuth }     from '@/hooks/useAuth'
import { useDebouncedValue }   from '@/hooks/useDebouncedValue'
import { useKeyboardShortcut } from '@/hooks/useKeyboardShortcut'
import api             from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { calcSpecTotals } from '@/lib/qqs'
import { exportSpecExcel } from '@/lib/export/specExport'
import { cn }          from '@/lib/cn'
import toast           from 'react-hot-toast'

export default function SpesifikatsiyalarPage() {
  const t = useTranslations('specifications')
  const { currentOrg } = useAuth()
  const router         = useRouter()
  const qc             = useQueryClient()

  const [search,    setSearch]    = useState('')
  const [deleteSpec, setDeleteSpec] = useState<any | null>(null)
  const debouncedSearch = useDebouncedValue(search, 300)

  const searchInputRef = useRef<HTMLInputElement>(null)
  useKeyboardShortcut('mod+k', useCallback(() => searchInputRef.current?.focus(), []))
  useKeyboardShortcut('mod+n', useCallback(() => {
    router.push('/dashboard/spesifikatsiyalar/yangi')
  }, [router]))

  const { data: specs = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['specifications', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/specifications?orgId=${currentOrg.id}`)
      return data
    },
    enabled: !!currentOrg?.id,
    retry:   1,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/specifications/${id}?orgId=${currentOrg?.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['specifications'] })
      setDeleteSpec(null)
      toast.success(t('toast.deleted'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toast.error')),
  })

  // Frontend filter: search bo'yicha
  const filtered = useMemo(() => {
    if (!debouncedSearch.trim()) return specs as any[]
    const q = debouncedSearch.toLowerCase()
    return (specs as any[]).filter(s =>
      String(s.specNumber || '').toLowerCase().includes(q) ||
      String(s.contract?.contractNumber || '').toLowerCase().includes(q) ||
      String(s.contract?.counterparty?.name || '').toLowerCase().includes(q)
    )
  }, [specs, debouncedSearch])

  // Statistika
  const stats = useMemo(() => {
    const arr = specs as any[]
    const total = arr.length
    const totalAmount = arr.reduce((sum, s) => {
      const tot = calcSpecTotals(s.items || [])
      return sum + tot.umumiy
    }, 0)
    const totalRows = arr.reduce((sum, s) => sum + (s.items?.length || 0), 0)
    return { total, totalAmount, totalRows }
  }, [specs])

  const handleExcel = async (spec: any) => {
    await exportSpecExcel({
      specNumber:  spec.specNumber,
      orgName:     currentOrg?.name || '',
      contractNum: spec.contract?.contractNumber,
      items:       spec.items || [],
      notes:       spec.notes,
    })
    toast.success(t('toast.excelDownloaded'))
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('title') },
        ]}
        actions={
          <Link href="/dashboard/spesifikatsiyalar/yangi">
            <Button leftIcon={<Plus size={14} />} size="sm">{t('new')}</Button>
          </Link>
        }
      />

      {/* Statistika */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          <SpecStatCard
            label={t('stats.total')}
            value={stats.total.toLocaleString()}
            icon={<ClipboardList size={16} />}
            color="bg-[#F1F5F9] text-[#475569]"
          />
          <SpecStatCard
            label={t('stats.totalRows')}
            value={stats.totalRows.toLocaleString()}
            icon={<FileText size={16} />}
            color="bg-[#DBEAFE] text-[#1D4ED8]"
          />
          <SpecStatCard
            label={t('stats.totalAmount')}
            value={formatCurrency(stats.totalAmount)}
            icon={<DollarSign size={16} />}
            color="bg-[#EDE9FE] text-[#7C3AED]"
          />
        </div>
      )}

      {/* Search */}
      {(stats.total > 0 || debouncedSearch) && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative max-w-sm flex-1 sm:flex-initial">
            <Input
              ref={searchInputRef}
              placeholder={t('searchPlaceholder') + ' (Ctrl+K)'}
              leftIcon={<Search size={15} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9]"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <span className="text-xs text-[#94A3B8] shrink-0">
            {filtered.length} / {stats.total} {t('rows')}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
            <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] flex items-center justify-center">
              <ClipboardList size={20} className="text-[#DC2626]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Ma'lumotlarni yuklashda xatolik</p>
              <p className="text-xs text-[#94A3B8] mt-0.5">Internet aloqasini tekshirib, qayta urinib ko'ring</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>Qayta urinish</Button>
          </div>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title={debouncedSearch ? t('noSearchResults') : t('noSpecs')}
          description={debouncedSearch ? '' : t('noSpecsDescription')}
          action={debouncedSearch ? undefined : {
            label:   t('newSpec'),
            onClick: () => router.push('/dashboard/spesifikatsiyalar/yangi'),
          }}
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC]">
                  {[t('table.number'), t('table.contract'), t('table.rows'), t('table.totalAmount'), t('table.date'), ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((spec: any) => {
                  const items  = spec.items || []
                  const totals = calcSpecTotals(items)
                  return (
                    <tr key={spec.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/spesifikatsiyalar/${spec.id}`}>
                          <span className="text-sm font-mono text-[#2563EB] hover:underline">
                            {spec.specNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569]">
                        {spec.contract
                          ? `№ ${spec.contract.contractNumber}`
                          : <span className="text-[#CBD5E1]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">{items.length} {t('rows')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[#0F172A]">
                        {formatCurrency(totals.umumiy)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">
                        {formatDate(spec.createdAt, 'short')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleExcel(spec)}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#DCFCE7] transition-all"
                            title={t('tooltip.excelDownload')}
                          >
                            <Download size={14} />
                          </button>
                          <Link
                            href={`/dashboard/spesifikatsiyalar/${spec.id}`}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#DBEAFE] transition-all"
                            title={t('edit')}
                          >
                            <Edit2 size={14} />
                          </Link>
                          <button
                            onClick={() => setDeleteSpec(spec)}
                            className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                            title={t('delete')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!deleteSpec}
        onClose={() => setDeleteSpec(null)}
        onConfirm={() => deleteSpec && deleteMutation.mutate(deleteSpec.id)}
        title={t('deleteTitle')}
        description={deleteSpec ? t('deleteConfirm', { number: deleteSpec.specNumber }) : ''}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  )
}

function SpecStatCard({ label, value, icon, color }: {
  label: string; value: string; icon: React.ReactNode; color: string
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
