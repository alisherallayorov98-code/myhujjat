'use client'

import { useState }                   from 'react'
import { Search, Filter }             from 'lucide-react'
import { useQuery }                   from '@tanstack/react-query'
import { Input }                      from '@/components/ui/Input'
import { TableRowSkeleton }           from '@/components/ui/Skeleton'
import api                            from '@/lib/api'
import { formatDate }                 from '@/lib/formatters'
import { cn }                         from '@/lib/cn'

const ACTION_COLORS: Record<string, string> = {
  USER_LOGIN:      'bg-[#2563EB]/20 text-[#60A5FA]',
  USER_LOGOUT:     'bg-[#94A3B8]/20 text-[#94A3B8]',
  USER_CREATE:     'bg-[#16A34A]/20 text-[#4ADE80]',
  USER_BLOCK:      'bg-[#DC2626]/20 text-[#F87171]',
  CONTRACT_CREATE: 'bg-[#16A34A]/20 text-[#4ADE80]',
  CONTRACT_DELETE: 'bg-[#DC2626]/20 text-[#F87171]',
  ORG_CREATE:      'bg-[#7C3AED]/20 text-[#A78BFA]',
  PAYMENT_PAID:    'bg-[#D97706]/20 text-[#FCD34D]',
}

export default function AdminAuditPage() {
  const [page,   setPage]   = useState(1)
  const [action, setAction] = useState('')
  const [entity, setEntity] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', page, action, entity],
    queryFn:  () => {
      const p = new URLSearchParams({ page: String(page), limit: '50' })
      if (action) p.set('action', action)
      if (entity) p.set('entity', entity)
      return api.get(`/admin/audit?${p}`).then(r => r.data)
    },
  })

  const items      = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-xl">Audit log</h2>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Action (USER_LOGIN, ORG_CREATE...)"
          leftIcon={<Search size={14} />}
          value={action}
          onChange={e => { setAction(e.target.value); setPage(1) }}
          className="max-w-xs bg-[#1E293B] border-[#334155] text-white placeholder:text-[#475569]"
        />
        <Input
          placeholder="Entity (User, Contract...)"
          leftIcon={<Filter size={14} />}
          value={entity}
          onChange={e => { setEntity(e.target.value); setPage(1) }}
          className="max-w-xs bg-[#1E293B] border-[#334155] text-white placeholder:text-[#475569]"
        />
      </div>

      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              {['Sana', 'Foydalanuvchi', 'Action', 'Entity', 'IP'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#64748B] text-sm">
                  Audit yozuvlari yo'q
                </td>
              </tr>
            ) : (
              items.map((log: any) => (
                <tr key={log.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                  <td className="px-4 py-2.5 text-xs text-[#94A3B8] tabular-nums whitespace-nowrap">
                    {formatDate(log.createdAt, 'short')}
                  </td>
                  <td className="px-4 py-2.5">
                    {log.user ? (
                      <>
                        <p className="text-xs text-white">{log.user.firstName || log.user.email}</p>
                        <p className="text-[10px] text-[#64748B]">{log.user.email}</p>
                      </>
                    ) : (
                      <span className="text-xs text-[#475569]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium font-mono',
                      ACTION_COLORS[log.action] || 'bg-[#334155] text-[#94A3B8]'
                    )}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#94A3B8]">
                    {log.entity}
                    {log.entityId && (
                      <span className="text-[#475569] ml-1 font-mono">
                        #{log.entityId.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-[#64748B] font-mono">
                    {log.ipAddress || '—'}
                  </td>
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
