'use client'

import { useState }                                    from 'react'
import { Search, Shield, ShieldOff, Gift }             from 'lucide-react'
import { useQuery, useMutation, useQueryClient }       from '@tanstack/react-query'
import { Button }                                      from '@/components/ui/Button'
import { Input }                                       from '@/components/ui/Input'
import { Modal }                                       from '@/components/ui/Modal'
import { Select }                                      from '@/components/ui/Select'
import { TableRowSkeleton }                            from '@/components/ui/Skeleton'
import api                                             from '@/lib/api'
import { formatDate }                                  from '@/lib/formatters'
import toast                                           from 'react-hot-toast'
import { cn }                                          from '@/lib/cn'

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search,      setSearch]      = useState('')
  const [planFilter,  setPlanFilter]  = useState('')
  const [page,        setPage]        = useState(1)
  const [grantModal,  setGrantModal]  = useState<string | null>(null)
  const [grantPlan,   setGrantPlan]   = useState('PRO')
  const [grantMonths, setGrantMonths] = useState('1')

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, planFilter, page],
    queryFn:  () => {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search)     params.set('search', search)
      if (planFilter) params.set('plan',   planFilter)
      return api.get(`/admin/users?${params}`).then(r => r.data)
    },
  })

  const blockMut = useMutation({
    mutationFn: ({ id, block }: { id: string; block: boolean }) =>
      api.put(`/admin/users/${id}/toggle-block`, { block }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Yangilandi')
    },
    onError: () => toast.error('Xatolik'),
  })

  const grantMut = useMutation({
    mutationFn: (id: string) =>
      api.post(`/admin/users/${id}/grant-subscription`, {
        plan:   grantPlan,
        months: parseInt(grantMonths),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] })
      toast.success('Obuna berildi ✓')
      setGrantModal(null)
    },
    onError: () => toast.error('Xatolik'),
  })

  const users      = data?.data ?? []
  const totalPages = data?.meta?.totalPages ?? 1

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-xl">Foydalanuvchilar</h2>

      {/* Filtrlar */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Email yoki ism..."
          leftIcon={<Search size={14} />}
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs bg-[#1E293B] border-[#334155] text-white placeholder:text-[#475569]"
        />
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(1) }}
          className="h-10 rounded-lg text-sm px-3 bg-[#1E293B] border border-[#334155] text-white focus:outline-none focus:border-[#2563EB]"
        >
          <option value="">Barcha planlar</option>
          <option value="FREE">Bepul</option>
          <option value="STANDARD">Standart</option>
          <option value="PRO">Pro</option>
        </select>
      </div>

      {/* Jadval */}
      <div className="bg-[#1E293B] rounded-xl border border-[#334155] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#334155]">
              {['Foydalanuvchi', 'Plan', 'Tashkilotlar', "Reg. sana", 'Holat', ''].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-[#64748B]">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} cols={6} />
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-[#64748B] text-sm">
                  Foydalanuvchilar topilmadi
                </td>
              </tr>
            ) : (
              users.map((user: any) => (
                <tr key={user.id} className="border-b border-[#334155] hover:bg-[#334155]/30">
                  <td className="px-4 py-3">
                    <p className="text-sm text-white font-medium">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-[#64748B]">{user.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      user.subscription?.plan === 'PRO'
                        ? 'bg-[#7C3AED]/20 text-[#A78BFA]'
                        : user.subscription?.plan === 'STANDARD'
                          ? 'bg-[#2563EB]/20 text-[#60A5FA]'
                          : 'bg-[#334155] text-[#94A3B8]'
                    )}>
                      {user.subscription?.plan || 'FREE'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">
                    {user._count?.organizations ?? 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#64748B]">
                    {formatDate(user.createdAt, 'short')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      user.isActive
                        ? 'bg-[#16A34A]/20 text-[#4ADE80]'
                        : 'bg-[#DC2626]/20 text-[#F87171]'
                    )}>
                      {user.isActive ? 'Faol' : 'Bloklangan'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setGrantModal(user.id)}
                        title="Obuna berish"
                        className="p-1.5 rounded text-[#64748B] hover:text-[#A78BFA] hover:bg-[#7C3AED]/20 transition-colors"
                      >
                        <Gift size={14} />
                      </button>
                      <button
                        onClick={() => blockMut.mutate({ id: user.id, block: user.isActive })}
                        title={user.isActive ? 'Bloklash' : 'Faollashtirish'}
                        className={cn(
                          'p-1.5 rounded transition-colors',
                          user.isActive
                            ? 'text-[#64748B] hover:text-[#F87171] hover:bg-[#DC2626]/20'
                            : 'text-[#64748B] hover:text-[#4ADE80] hover:bg-[#16A34A]/20'
                        )}
                      >
                        {user.isActive ? <ShieldOff size={14} /> : <Shield size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* Obuna berish modali */}
      <Modal
        open={!!grantModal}
        onClose={() => setGrantModal(null)}
        title="Obuna berish"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setGrantModal(null)}>
              Bekor
            </Button>
            <Button
              size="sm"
              loading={grantMut.isPending}
              leftIcon={<Gift size={14} />}
              onClick={() => grantModal && grantMut.mutate(grantModal)}
            >
              Berish
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          <Select
            label="Reja"
            options={[
              { value: 'STANDARD', label: 'Standart' },
              { value: 'PRO',      label: 'Pro' },
              { value: 'DEMO',     label: 'Demo (7 kun)' },
            ]}
            value={grantPlan}
            onChange={e => setGrantPlan(e.target.value)}
          />
          <Select
            label="Muddat"
            options={[
              { value: '1',  label: '1 oy' },
              { value: '3',  label: '3 oy' },
              { value: '12', label: '1 yil' },
            ]}
            value={grantMonths}
            onChange={e => setGrantMonths(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  )
}
