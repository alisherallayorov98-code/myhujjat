'use client'

import { useQuery }                               from '@tanstack/react-query'
import { Users, CreditCard, FileText, TrendingUp } from 'lucide-react'
import api                                         from '@/lib/api'
import { formatCurrency }                          from '@/lib/formatters'
import { cn }                                      from '@/lib/cn'

function StatCard({
  title, value, sub, icon: Icon, color,
}: {
  title: string; value: string | number; sub?: string; icon: any; color: string
}) {
  return (
    <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-[#94A3B8]">{title}</p>
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', color)}>
          <Icon size={18} className="text-white" />
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-[#64748B] mt-1">{sub}</p>}
    </div>
  )
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn:  () => api.get('/admin/stats').then(r => r.data),
    refetchInterval: 60_000,
  })

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-[#1E293B] rounded-xl h-28 animate-pulse border border-[#334155]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-xl">Umumiy statistika</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Jami foydalanuvchilar"
          value={stats?.users?.total ?? 0}
          sub={`+${stats?.users?.thisMonth ?? 0} bu oy`}
          icon={Users}
          color="bg-[#2563EB]"
        />
        <StatCard
          title="Faol obunalar"
          value={stats?.subscriptions?.active ?? 0}
          sub={`Pro: ${stats?.subscriptions?.pro ?? 0}, Standart: ${stats?.subscriptions?.standard ?? 0}`}
          icon={CreditCard}
          color="bg-[#7C3AED]"
        />
        <StatCard
          title="Shartnomalar"
          value={stats?.contracts?.total ?? 0}
          sub={`+${stats?.contracts?.thisMonth ?? 0} bu oy`}
          icon={FileText}
          color="bg-[#16A34A]"
        />
        <StatCard
          title="Bu oy daromad"
          value={formatCurrency(stats?.revenue?.thisMonth ?? 0)}
          sub={`Jami: ${formatCurrency(stats?.revenue?.total ?? 0)}`}
          icon={TrendingUp}
          color="bg-[#D97706]"
        />
      </div>

      {/* O'sish ko'rsatkichi */}
      <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155]">
        <h3 className="text-white font-semibold mb-4">Foydalanuvchilar o'sishi</h3>
        <div className="flex items-center gap-4 mb-2">
          <div className="flex-1 h-2 bg-[#334155] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-700"
              style={{ width: `${Math.min(100, Math.abs(stats?.users?.growth ?? 0))}%` }}
            />
          </div>
          <span className={cn(
            'text-sm font-bold min-w-[3rem] text-right',
            (stats?.users?.growth ?? 0) >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'
          )}>
            {(stats?.users?.growth ?? 0) >= 0 ? '+' : ''}{stats?.users?.growth ?? 0}%
          </span>
        </div>
        <p className="text-xs text-[#64748B]">O'tgan oyga nisbatan</p>
      </div>

      {/* Obuna taqsimoti */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Pro', value: stats?.subscriptions?.pro ?? 0,      color: 'bg-[#7C3AED]/20 text-[#A78BFA]' },
          { label: 'Standart', value: stats?.subscriptions?.standard ?? 0, color: 'bg-[#2563EB]/20 text-[#60A5FA]' },
          { label: "Bepul (hisoblash)", value: (stats?.users?.total ?? 0) - (stats?.subscriptions?.active ?? 0), color: 'bg-[#334155] text-[#94A3B8]' },
        ].map(item => (
          <div key={item.label} className="bg-[#1E293B] rounded-xl p-4 border border-[#334155]">
            <p className="text-xs text-[#64748B] mb-1">{item.label}</p>
            <p className="text-xl font-bold text-white">{item.value}</p>
            <span className={cn('text-xs px-2 py-0.5 rounded-full mt-2 inline-block', item.color)}>
              ta foydalanuvchi
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
