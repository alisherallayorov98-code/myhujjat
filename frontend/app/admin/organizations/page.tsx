'use client'

import { useState }                   from 'react'
import { Search, Building2 }          from 'lucide-react'
import { useQuery }                   from '@tanstack/react-query'
import { Input }                      from '@/components/ui/Input'
import { TableRowSkeleton }           from '@/components/ui/Skeleton'
import api                            from '@/lib/api'
import { formatDate }                 from '@/lib/formatters'
import { cn }                         from '@/lib/cn'

export default function AdminOrganizationsPage() {
  const [page,   setPage]   = useState(1)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orgs', page, search],
    queryFn:  () => {
      const p = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) p.set('search', search)
      return api.get(`/admin/organizations?${p}`).then(r => r.data)
    },
  })

  const orgs       = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1
  const total      = data?.meta?.total      ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-xl">Tashkilotlar</h2>
        <span className="text-xs text-[#64748B]">{total} ta jami</span>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Nom yoki STIR..."
          leftIcon={<Search size={14} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs bg-[#1E293B] border-[#334155] text-white placeholder:text-[#475569]"
        />
      </div>

      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              {['Tashkilot', 'STIR', 'Egasi', 'Shartnoma', 'Kontragent', 'Yaratilgan'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
            ) : orgs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#64748B] text-sm">
                  Tashkilotlar topilmadi
                </td>
              </tr>
            ) : (
              orgs.map((org: any) => (
                <tr key={org.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 flex items-center justify-center shrink-0">
                        <Building2 size={14} className="text-[#60A5FA]" />
                      </div>
                      <p className="text-sm text-white font-medium truncate max-w-[200px]">{org.name}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8] font-mono">
                    {org.inn || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs text-white">{org.user?.firstName || '—'}</p>
                    <p className="text-[10px] text-[#64748B]">{org.user?.email}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{org._count?.contracts ?? 0}</td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{org._count?.counterparties ?? 0}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{formatDate(org.createdAt, 'short')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={cn(
                'w-8 h-8 rounded text-sm transition-all',
                page === i + 1 ? 'bg-[#2563EB] text-white' : 'text-[#94A3B8] hover:bg-[#334155]'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
