'use client'

import { useState }                   from 'react'
import { useQuery }                   from '@tanstack/react-query'
import { TableRowSkeleton }           from '@/components/ui/Skeleton'
import api                            from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn }                         from '@/lib/cn'

export default function AdminPaymentsPage() {
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn:  () => api.get(`/admin/payments?page=${page}`).then(r => r.data),
  })

  const payments   = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-xl">To'lovlar</h2>

      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              {["Foydalanuvchi", 'Plan', 'Summa', 'Holat', 'Sana'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
            ) : payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-[#64748B] text-sm">
                  To'lovlar yo'q
                </td>
              </tr>
            ) : (
              payments.map((p: any) => (
                <tr key={p.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white">{p.user?.firstName}</p>
                    <p className="text-xs text-[#64748B]">{p.user?.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
                      {p.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-white tabular-nums">
                    {formatCurrency(p.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      p.status === 'PAID'    ? 'bg-[#16A34A]/20 text-[#4ADE80]' :
                      p.status === 'PENDING' ? 'bg-[#D97706]/20 text-[#FCD34D]' :
                                               'bg-[#DC2626]/20 text-[#F87171]'
                    )}>
                      {p.status === 'PAID' ? "To'langan" : p.status === 'PENDING' ? "Kutilmoqda" : "Bekor"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">
                    {formatDate(p.createdAt, 'short')}
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
