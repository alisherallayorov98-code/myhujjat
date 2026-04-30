'use client'

import Link                from 'next/link'
import {
  FileText, ClipboardList, Calculator,
  Users, Sparkles,
  Plus, ArrowRight, Wallet,
} from 'lucide-react'
import { useQuery }    from '@tanstack/react-query'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import { useAuth }     from '@/hooks/useAuth'
import api             from '@/lib/api'
import { OnboardingChecklist } from '@/components/Onboarding/OnboardingChecklist'
import { MonthlyChart }       from '@/components/Dashboard/MonthlyChart'
import { TypeDistribution }   from '@/components/Dashboard/TypeDistribution'
import { UpcomingDeadlines }  from '@/components/Dashboard/UpcomingDeadlines'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn }          from '@/lib/cn'

const QUICK_ACTIONS = [
  {
    icon:  FileText,
    label: 'Yangi shartnoma',
    desc:  'Tez yarating',
    href:  '/dashboard/shartnomalar/yangi',
    color: 'bg-[#DBEAFE] text-[#2563EB]',
  },
  {
    icon:  ClipboardList,
    label: 'Spesifikatsiya',
    desc:  'QQS bilan',
    href:  '/dashboard/spesifikatsiyalar/yangi',
    color: 'bg-[#DCFCE7] text-[#16A34A]',
  },
  {
    icon:  Calculator,
    label: 'Faktura',
    desc:  'Hisob-faktura',
    href:  '/dashboard/buxgalter/faktura',
    color: 'bg-[#FEF3C7] text-[#D97706]',
  },
  {
    icon:  Users,
    label: 'Buyruq',
    desc:  'HR hujjati',
    href:  '/dashboard/kotib/buyruq',
    color: 'bg-[#EDE9FE] text-[#7C3AED]',
  },
]

interface ContractsStats {
  total: number
  active: number
  draft: number
  completed: number
}

interface ContractRow {
  id:             string
  contractNumber: string
  contractType:   string
  contractDate:   string
  amount:         number
  status:         string
  counterparty?:  { name: string }
  createdAt:      string
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT:     { label: 'Qoralama', cls: 'bg-[#F1F5F9] text-[#475569]' },
  ACTIVE:    { label: 'Faol',     cls: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  COMPLETED: { label: 'Tugagan',  cls: 'bg-[#DCFCE7] text-[#16A34A]' },
  CANCELLED: { label: 'Bekor',    cls: 'bg-[#FEE2E2] text-[#DC2626]' },
}

function StatCard({ icon: Icon, label, value, color, bg, hint }: {
  icon: any
  label: string
  value: string | number
  color: string
  bg: string
  hint?: string
}) {
  return (
    <Card className="flex items-start gap-3">
      <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#94A3B8]">{label}</p>
        <p className="text-xl font-bold text-[#0F172A] mt-0.5">{value}</p>
        {hint && <p className="text-xs text-[#94A3B8] mt-0.5">{hint}</p>}
      </div>
    </Card>
  )
}

export default function DashboardPage() {
  const { user, currentOrg, isPro } = useAuth()

  // ─── Statistika ─────────────────────────────────────────
  const { data: contractsStats } = useQuery<ContractsStats>({
    queryKey: ['contracts-stats', currentOrg?.id],
    queryFn:  () => api.get(`/contracts/stats/${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: empStats } = useQuery<{ total: number }>({
    queryKey: ['employees-stats', currentOrg?.id],
    queryFn:  () => api.get(`/employees/stats?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  // So'nggi 5 ta shartnoma + chart uchun keyingi 50 ta
  const { data: contractsData } = useQuery<{ data: ContractRow[] }>({
    queryKey: ['recent-contracts', currentOrg?.id],
    queryFn:  () => api.get(`/contracts?orgId=${currentOrg!.id}&limit=50`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const allRecent = contractsData?.data || []
  const recent    = allRecent.slice(0, 5)

  // Joriy oyda yaratilgan shartnomalar summasi
  const monthAmount = allRecent
    .filter(c => {
      const d = new Date(c.createdAt)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    .reduce((s, c) => s + (Number(c.amount) || 0), 0)

  const hour = new Date().getHours()
  const greeting =
    hour < 6  ? 'Xayrli tun'  :
    hour < 12 ? 'Xayrli tong' :
    hour < 17 ? 'Xayrli kun'  : 'Xayrli kech'

  const contractsLeft = isPro
    ? null
    : 3 - (user?.subscription?.contractCount || 0)

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName || 'Foydalanuvchi'}!`}
        description={currentOrg
          ? `${currentOrg.name} — hujjatlaringizni boshqaring`
          : "Boshlash uchun tashkilot qo'shing"
        }
      />

      {/* Onboarding checklist (faqat yangi foydalanuvchilarga) */}
      <OnboardingChecklist />

      {/* Limit ogohlantirish */}
      {contractsLeft !== null && contractsLeft <= 1 && (
        <div className="mb-6 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#92400E]">
              {contractsLeft === 0
                ? 'Bu oy shartnoma limiti tugadi'
                : `Faqat ${contractsLeft} ta shartnoma qoldi`
              }
            </p>
            <p className="text-xs text-[#B45309] mt-0.5">
              Cheksiz shartnoma uchun Standart yoki Pro rejaga o'ting
            </p>
          </div>
          <Link href="/dashboard/sozlamalar/obuna">
            <Button size="sm" variant="warning" className="shrink-0">Upgrade</Button>
          </Link>
        </div>
      )}

      {/* Tashkilot yo'q */}
      {!currentOrg && (
        <div className="mb-6 p-6 bg-white border-2 border-dashed border-[#E2E8F0] rounded-xl text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-[#94A3B8]" />
          </div>
          <h3 className="font-display font-bold text-[#0F172A] mb-1">Tashkilot qo'shing</h3>
          <p className="text-sm text-[#94A3B8] mb-4">
            Hujjat yaratish uchun avval tashkilot ma'lumotlarini kiriting
          </p>
          <Link href="/dashboard/tashkilotlar">
            <Button leftIcon={<Plus size={14} />}>Tashkilot qo'shish</Button>
          </Link>
        </div>
      )}

      {/* Statistika kartochkalari */}
      {currentOrg && (
        <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-3 mb-8">
          <StatCard
            icon={FileText}
            label="Jami shartnomalar"
            value={contractsStats?.total ?? 0}
            color="text-[#2563EB]"
            bg="bg-[#DBEAFE]"
            hint={contractsStats?.active ? `${contractsStats.active} ta faol` : 'Hali yo\'q'}
          />
          <StatCard
            icon={Users}
            label="Kontragentlar"
            value={cps.length}
            color="text-[#7C3AED]"
            bg="bg-[#EDE9FE]"
            hint="Hamkorlar"
          />
          <StatCard
            icon={Users}
            label="Xodimlar"
            value={empStats?.total ?? 0}
            color="text-[#0891B2]"
            bg="bg-[#CFFAFE]"
            hint="Faol xodimlar"
          />
          <StatCard
            icon={Wallet}
            label="Bu oy"
            value={monthAmount > 0 ? formatCurrency(monthAmount) : "0 so'm"}
            color="text-[#16A34A]"
            bg="bg-[#DCFCE7]"
            hint="Shartnoma summasi"
          />
        </div>
      )}

      {/* Chartlar va muddatlar — joriy oy aktivligi */}
      {currentOrg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {allRecent.length > 0 ? (
            <>
              <MonthlyChart contracts={allRecent} />
              <TypeDistribution contracts={allRecent} />
            </>
          ) : (
            <>
              <div className="lg:col-span-2" />
            </>
          )}
          <UpcomingDeadlines />
        </div>
      )}

      {/* Tezkor amallar */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-[#0F172A] text-base mb-3">Tez yaratish</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(action => (
            <Link key={action.label} href={action.href}>
              <div className={cn(
                'p-4 rounded-xl bg-white border border-[#E2E8F0]',
                'hover:border-[#2563EB]/30 hover:shadow-md',
                'transition-all duration-200 cursor-pointer',
                'flex flex-col gap-2.5'
              )}>
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', action.color)}>
                  <action.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{action.label}</p>
                  <p className="text-xs text-[#94A3B8]">{action.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* So'nggi shartnomalar — to'liq kenglikda */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-[#0F172A] text-base">So'nggi shartnomalar</h2>
          <Link href="/dashboard/shartnomalar" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
            Hammasi <ArrowRight size={12} />
          </Link>
        </div>
        <Card padding="none" className="overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-10 text-center">
              <FileText size={32} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-sm text-[#94A3B8] mb-3">Hali shartnoma yo'q</p>
              <Link href="/dashboard/shartnomalar/yangi">
                <Button size="sm" leftIcon={<Plus size={13} />}>Birinchi shartnoma</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recent.map(c => {
                const cfg = (CONTRACT_TYPE_CONFIG as any)[c.contractType]
                const st  = STATUS_LABEL[c.status] ?? STATUS_LABEL.DRAFT
                return (
                  <Link key={c.id} href={`/dashboard/shartnomalar/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition group">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0', cfg?.bg ?? 'bg-[#F1F5F9]')}>
                      {cfg?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0F172A] truncate">{c.contractNumber}</p>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                      </div>
                      <p className="text-xs text-[#94A3B8] truncate mt-0.5">
                        {c.counterparty?.name || 'Kontragent yo\'q'} · {formatDate(c.contractDate, 'short')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-[#0F172A]">{c.amount > 0 ? formatCurrency(c.amount) : '—'}</p>
                    </div>
                    <ArrowRight size={14} className="text-[#CBD5E1] group-hover:text-[#2563EB] shrink-0" />
                  </Link>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* AI banner — faqat Pro */}
      {isPro && (
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
              <Sparkles size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-display font-bold text-lg mb-1">AI Yordamchi</h3>
              <p className="text-blue-100 text-sm mb-4">
                Hujjat mazmunini AI yordamida avtomatik to'ldiring.
                Faqat asosiy ma'lumotlarni kiriting, qolganini AI qiladi.
              </p>
              <Link href="/dashboard/seif/ai">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                  AI bilan yaratish
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
