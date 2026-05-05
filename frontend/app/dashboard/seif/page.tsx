'use client'

import { useState, useRef, useCallback }                  from 'react'
import Link                                              from 'next/link'
import { useTranslations }                               from 'next-intl'
import {
  Archive, Search, FileText, Sparkles, ClipboardList, Eye, X,
} from 'lucide-react'
import { useQuery }                                      from '@tanstack/react-query'
import { PageHeader }                                    from '@/components/layout/PageHeader'
import { Card }                                          from '@/components/ui/Card'
import { Input }                                         from '@/components/ui/Input'
import { Badge, ContractStatusBadge }                    from '@/components/ui/Badge'
import { EmptyState, TableRowSkeleton }                  from '@/components/ui/Skeleton'
import { useAuth }                                       from '@/hooks/useAuth'
import { useDebouncedValue }                             from '@/hooks/useDebouncedValue'
import { useKeyboardShortcut }                           from '@/hooks/useKeyboardShortcut'
import api                                               from '@/lib/api'
import { formatCurrency, formatDate }                    from '@/lib/formatters'
import { CONTRACT_TYPE_CONFIG }                          from '@/lib/contractTemplates'
import { cn }                                            from '@/lib/cn'

interface SeifDoc {
  id:        string
  type:      string
  subType:   string
  title:     string
  subtitle:  string
  status:    string
  amount:    number | null
  createdAt: string
}

interface SeifStats {
  contracts: number
  aiDocs:    number
  specs:     number
  total:     number
}

function DocTypeIcon({ type, subType }: { type: string; subType: string }) {
  if (type === 'ai') {
    return (
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center shrink-0">
        <Sparkles size={16} className="text-white" />
      </div>
    )
  }
  const cfg = CONTRACT_TYPE_CONFIG[subType as keyof typeof CONTRACT_TYPE_CONFIG]
  if (cfg) {
    return (
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0', cfg.bg)}>
        {cfg.icon}
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
      <FileText size={16} className="text-[#94A3B8]" />
    </div>
  )
}

export default function SeifPage() {
  const t = useTranslations('vault')
  const { currentOrg } = useAuth()

  const STAT_CARDS = [
    { key: 'total',     label: t('totalDocs'),  Icon: Archive,       color: 'text-[#2563EB]', bg: 'bg-[#DBEAFE]' },
    { key: 'contracts', label: t('contracts'),  Icon: FileText,       color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]' },
    { key: 'aiDocs',    label: t('aiDocs'),     Icon: Sparkles,       color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]' },
    { key: 'specs',     label: t('specs'),      Icon: ClipboardList,  color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' },
  ]

  const [search,     setSearch]     = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [page,       setPage]       = useState(1)
  const debouncedSearch = useDebouncedValue(search, 300)

  const searchInputRef = useRef<HTMLInputElement>(null)
  useKeyboardShortcut('mod+k', useCallback(() => searchInputRef.current?.focus(), []))

  const { data, isLoading } = useQuery<{ data: SeifDoc[]; meta: any }>({
    queryKey: ['seif', currentOrg?.id, debouncedSearch, typeFilter, page],
    queryFn:  () => {
      const params = new URLSearchParams({
        orgId: currentOrg!.id,
        page:  String(page),
        limit: '30',
      })
      if (debouncedSearch)      params.set('search', debouncedSearch)
      if (typeFilter !== 'all') params.set('type',   typeFilter)
      return api.get(`/documents/seif?${params}`).then(r => r.data)
    },
    enabled: !!currentOrg?.id,
  })

  const { data: stats } = useQuery<SeifStats>({
    queryKey: ['seif-stats', currentOrg?.id],
    queryFn:  () => api.get(`/documents/seif/stats?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const docs       = data?.data  ?? []
  const totalPages = Math.ceil((data?.meta?.total ?? 0) / 30)

  const TYPE_FILTERS = [
    { id: 'all',      label: t('all'),         count: stats?.total     ?? 0 },
    { id: 'contract', label: t('contracts'),   count: stats?.contracts ?? 0 },
    { id: 'ai',       label: t('aiDocs'),      count: stats?.aiDocs    ?? 0 },
  ]

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb') },
        ]}
      />

      {/* Statistika */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map(({ key, label, Icon, color, bg }) => (
          <Card key={key} className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xl font-bold text-[#0F172A]">
                {stats ? (stats as any)[key] : 0}
              </p>
              <p className="text-xs text-[#94A3B8]">{label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filtrlar */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative max-w-xs flex-1 sm:flex-initial">
          <Input
            ref={searchInputRef}
            placeholder={t('searchPlace') + ' (Ctrl+K)'}
            leftIcon={<Search size={15} />}
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

        <div className="flex gap-1 bg-[#F1F5F9] rounded-lg p-1">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => { setTypeFilter(f.id); setPage(1) }}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                typeFilter === f.id
                  ? 'bg-white text-[#0F172A] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#475569]'
              )}
            >
              {f.label}
              <span className={cn(
                'text-[10px] px-1.5 rounded-full',
                typeFilter === f.id
                  ? 'bg-[#DBEAFE] text-[#2563EB]'
                  : 'bg-[#E2E8F0] text-[#94A3B8]'
              )}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Jadval */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#E2E8F0]">
                {[t('tableHujjat'), t('tableTur'), t('tableKontragent'), t('tableSana'), t('tableSumma'), t('tableHolat'), ''].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={7} />)
              ) : docs.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<Archive size={28} />}
                      title={t('noDocs')}
                      description={search ? t('noDocsSearch') : t('noDocsDesc')}
                    />
                  </td>
                </tr>
              ) : (
                docs.map(doc => {
                  const cfg = doc.type === 'contract'
                    ? CONTRACT_TYPE_CONFIG[doc.subType as keyof typeof CONTRACT_TYPE_CONFIG]
                    : null
                  return (
                    <tr key={`${doc.type}-${doc.id}`}
                      className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <DocTypeIcon type={doc.type} subType={doc.subType} />
                          <p className="text-sm font-medium text-[#0F172A] truncate max-w-[220px]">
                            {doc.title}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={doc.type === 'ai' ? 'info' : 'default'} size="sm">
                          {doc.type === 'ai'
                            ? t('ai')
                            : cfg?.name ?? doc.subType
                          }
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569]">{doc.subtitle}</td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">
                        {formatDate(doc.createdAt, 'short')}
                      </td>
                      <td className="px-4 py-3 text-sm tabular-nums text-[#0F172A]">
                        {doc.amount && Number(doc.amount) > 0 ? formatCurrency(Number(doc.amount)) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {doc.type === 'contract'
                          ? <ContractStatusBadge status={doc.status} />
                          : <Badge variant="success" size="sm">{t('ready')}</Badge>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {doc.type === 'contract' && (
                            <Link href={`/dashboard/shartnomalar/${doc.id}`}>
                              <span className="flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#2563EB] hover:bg-[#DBEAFE] transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                <Eye size={14} />
                              </span>
                            </Link>
                          )}
                          {doc.type === 'ai' && (
                            <Link href={`/dashboard/seif/ai/${doc.id}`}>
                              <span className="flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#7C3AED] hover:bg-[#EDE9FE] transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100">
                                <Eye size={14} />
                              </span>
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-1.5 p-4 border-t border-[#E2E8F0]">
            {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={cn(
                  'w-8 h-8 rounded-lg text-sm font-medium transition-all',
                  page === i + 1
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#475569] hover:bg-[#F1F5F9]'
                )}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
