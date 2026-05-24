'use client'

import { useState, useEffect } from 'react'
import Link                from 'next/link'
import {
  FileText, ClipboardList, Calculator,
  Users, Building2, Sparkles, AlertTriangle,
  Plus, ArrowRight, Wallet, X,
} from 'lucide-react'
import { useQuery }    from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import { useAuth }     from '@/hooks/useAuth'
import api             from '@/lib/api'
import { OnboardingChecklist } from '@/components/Onboarding/OnboardingChecklist'
import { MonthlyChart }       from '@/components/Dashboard/MonthlyChart'
import { TypeDistribution }   from '@/components/Dashboard/TypeDistribution'
import { UpcomingDeadlines }  from '@/components/Dashboard/UpcomingDeadlines'
import { ContractAlerts }     from '@/components/Dashboard/ContractAlerts'
import { ErrorBoundary } from '@/components/ErrorBoundary/ErrorBoundary'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { cn }          from '@/lib/cn'

function WidgetError() {
  return (
    <div className="flex items-center gap-2 p-5 bg-white border border-[#E2E8F0] rounded-xl text-sm text-[#94A3B8]">
      <AlertTriangle size={15} className="text-[#FCA5A5] shrink-0" />
      Yuklashda xatolik yuz berdi
    </div>
  )
}

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
  const t   = useTranslations('dashboard')
  const tc  = useTranslations('contracts')

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    DRAFT:     { label: t('status.draft'),     cls: 'bg-[#F1F5F9] text-[#475569]' },
    ACTIVE:    { label: t('status.active'),    cls: 'bg-[#DBEAFE] text-[#1D4ED8]' },
    COMPLETED: { label: t('status.completed'), cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    CANCELLED: { label: t('status.cancelled'), cls: 'bg-[#FEE2E2] text-[#DC2626]' },
  }

  const QUICK_ACTIONS = [
    {
      icon:  FileText,
      label: t('quickAction.newContract'),
      desc:  t('quickAction.newContractDesc'),
      href:  '/dashboard/shartnomalar/yangi',
      color: 'bg-[#DBEAFE] text-[#2563EB]',
    },
    {
      icon:  ClipboardList,
      label: t('quickAction.specification'),
      desc:  t('quickAction.specificationDesc'),
      href:  '/dashboard/spesifikatsiyalar/yangi',
      color: 'bg-[#DCFCE7] text-[#16A34A]',
    },
    {
      icon:  Calculator,
      label: t('quickAction.invoice'),
      desc:  t('quickAction.invoiceDesc'),
      href:  '/dashboard/buxgalter/faktura',
      color: 'bg-[#FEF3C7] text-[#D97706]',
    },
    {
      icon:  Users,
      label: t('quickAction.order'),
      desc:  t('quickAction.orderDesc'),
      href:  '/dashboard/kotib/buyruq',
      color: 'bg-[#EDE9FE] text-[#7C3AED]',
    },
  ]

  // ─── Statistika ─────────────────────────────────────────
  const { data: contractsStats } = useQuery<ContractsStats>({
    queryKey: ['contracts-stats', currentOrg?.id],
    queryFn:  () => api.get(`/contracts/stats/${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}&limit=100`).then(r => r.data.data || []),
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
    hour < 6  ? t('greetings.night')   :
    hour < 12 ? t('greetings.morning') :
    hour < 17 ? t('greetings.day')     : t('greetings.evening')

  const contractsLeft = isPro
    ? null
    : 10 - (user?.subscription?.contractCount || 0)

  // Limit ogohlantirish — bir oy davomida bir marta yopiladi (kalit: oy + qoldiq)
  const currentLimitKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${contractsLeft}`
  const [limitDismissed, setLimitDismissed] = useState<string>('')
  useEffect(() => {
    const saved = localStorage.getItem('limit_warning_dismissed') || ''
    setLimitDismissed(saved)
  }, [])

  return (
    <div>
      <PageHeader
        title={`${greeting}, ${user?.firstName || t('user')}!`}
        description={currentOrg
          ? `${currentOrg.name} — ${t('orgManageDesc')}`
          : t('addOrgPrompt')
        }
      />

      {/* Onboarding checklist (faqat yangi foydalanuvchilarga) */}
      <ErrorBoundary fallback={<></>}>
        <OnboardingChecklist />
      </ErrorBoundary>

      {/* Limit ogohlantirish — dismissable */}
      {contractsLeft !== null && contractsLeft <= 1 && limitDismissed !== currentLimitKey && (
        <div className="mb-6 p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-[#92400E]">
              {contractsLeft === 0
                ? t('limitWarning.limitReached')
                : t('limitWarning.fewLeft', { count: contractsLeft })
              }
            </p>
            <p className="text-xs text-[#B45309] mt-0.5">
              {t('limitWarning.upgradeText')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/sozlamalar/obuna">
              <Button size="sm" variant="warning" className="shrink-0">{t('limitWarning.upgrade')}</Button>
            </Link>
            <button
              onClick={() => {
                localStorage.setItem('limit_warning_dismissed', currentLimitKey)
                setLimitDismissed(currentLimitKey)
              }}
              className="p-1.5 rounded text-[#B45309] hover:bg-[#FDE68A] transition-colors shrink-0"
              aria-label="Yopish"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Tashkilot yo'q */}
      {!currentOrg && (
        <div className="mb-6 p-6 bg-white border-2 border-dashed border-[#E2E8F0] rounded-xl text-center">
          <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] flex items-center justify-center mx-auto mb-3">
            <Plus size={20} className="text-[#94A3B8]" />
          </div>
          <h3 className="font-display font-bold text-[#0F172A] mb-1">{t('addOrgCard.title')}</h3>
          <p className="text-sm text-[#94A3B8] mb-4">
            {t('addOrgCard.description')}
          </p>
          <Link href="/dashboard/tashkilotlar">
            <Button leftIcon={<Plus size={14} />}>{t('addOrgCard.button')}</Button>
          </Link>
        </div>
      )}

      {/* Statistika kartochkalari */}
      {currentOrg && (
        <div className="grid grid-cols-2 lg:grid-cols-4 2xl:grid-cols-6 gap-3 mb-8">
          <StatCard
            icon={FileText}
            label={t('stat.totalContracts')}
            value={contractsStats?.total ?? 0}
            color="text-[#2563EB]"
            bg="bg-[#DBEAFE]"
            hint={contractsStats?.active ? t('stat.activeCount', { count: contractsStats.active }) : t('stat.noneYet')}
          />
          <StatCard
            icon={Building2}
            label={t('stat.counterparties')}
            value={cps.length}
            color="text-[#7C3AED]"
            bg="bg-[#EDE9FE]"
            hint={t('stat.partners')}
          />
          <StatCard
            icon={Users}
            label={t('stat.employees')}
            value={empStats?.total ?? 0}
            color="text-[#0891B2]"
            bg="bg-[#CFFAFE]"
            hint={t('stat.activeEmployees')}
          />
          <StatCard
            icon={Wallet}
            label={t('stat.thisMonth')}
            value={monthAmount > 0 ? formatCurrency(monthAmount) : "0 so'm"}
            color="text-[#16A34A]"
            bg="bg-[#DCFCE7]"
            hint={t('stat.contractAmount')}
          />
        </div>
      )}

      {/* Faktura nazorat alertlari — faqat ogohlantirishlar bo'lganda ko'rinadi */}
      {currentOrg && (
        <div className="mb-6">
          <ErrorBoundary fallback={<></>}>
            <ContractAlerts />
          </ErrorBoundary>
        </div>
      )}

      {/* Chartlar va muddatlar — joriy oy aktivligi */}
      {currentOrg && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          {allRecent.length > 0 ? (
            <>
              <ErrorBoundary fallback={<WidgetError />}>
                <MonthlyChart contracts={allRecent} />
              </ErrorBoundary>
              <ErrorBoundary fallback={<WidgetError />}>
                <TypeDistribution contracts={allRecent} />
              </ErrorBoundary>
            </>
          ) : (
            <>
              <div className="lg:col-span-2" />
            </>
          )}
          <ErrorBoundary fallback={<WidgetError />}>
            <UpcomingDeadlines />
          </ErrorBoundary>
        </div>
      )}

      {/* Tezkor amallar */}
      <div className="mb-8">
        <h2 className="font-display font-bold text-[#0F172A] text-base mb-3">{t('quickCreate')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(action => {
            const disabled = !currentOrg || (contractsLeft !== null && contractsLeft <= 0)
            const reason   = !currentOrg
              ? t('addOrgPrompt')
              : (contractsLeft !== null && contractsLeft <= 0)
                ? t('limitWarning.limitReached')
                : ''
            const Wrapper = disabled ? 'div' : Link
            const wrapperProps: any = disabled ? {} : { href: action.href }
            return (
              <Wrapper key={action.label} {...wrapperProps}>
                <div
                  title={reason}
                  className={cn(
                    'p-4 rounded-xl bg-white border border-[#E2E8F0]',
                    'transition-all duration-200',
                    'flex flex-col gap-2.5',
                    disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:border-[#2563EB]/30 hover:shadow-md cursor-pointer',
                  )}
                >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', action.color)}>
                  <action.icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{action.label}</p>
                  <p className="text-xs text-[#94A3B8]">{action.desc}</p>
                </div>
                </div>
              </Wrapper>
            )
          })}
        </div>
      </div>

      {/* So'nggi shartnomalar — to'liq kenglikda */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-[#0F172A] text-base">{t('recent.title')}</h2>
          <Link href="/dashboard/shartnomalar" className="text-xs text-[#2563EB] hover:underline flex items-center gap-1">
            {t('recent.all')} <ArrowRight size={12} />
          </Link>
        </div>
        <Card padding="none" className="overflow-hidden">
          {recent.length === 0 ? (
            <div className="p-10 text-center">
              <FileText size={32} className="mx-auto text-[#CBD5E1] mb-2" />
              <p className="text-sm text-[#94A3B8] mb-3">{t('recent.noContracts')}</p>
              <Link href="/dashboard/shartnomalar/yangi">
                <Button size="sm" leftIcon={<Plus size={13} />}>{t('recent.firstContract')}</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#F1F5F9]">
              {recent.map(c => {
                const cfg = (CONTRACT_TYPE_CONFIG as any)[c.contractType]
                const st  = STATUS_LABEL[c.status] ?? STATUS_LABEL.DRAFT
                const typeName = (() => {
                  try { return tc(`types.${c.contractType}` as any) } catch { return cfg?.name ?? c.contractType }
                })()
                return (
                  <Link key={c.id} href={`/dashboard/shartnomalar/${c.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-[#F8FAFC] transition group">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0', cfg?.bg ?? 'bg-[#F1F5F9]')}>
                      {cfg?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[#0F172A] truncate" title={c.contractNumber}>{c.contractNumber}</p>
                        <span className={cn('text-[10px] font-medium px-1.5 py-0.5 rounded-full', st.cls)}>{st.label}</span>
                      </div>
                      <p
                        className="text-xs text-[#94A3B8] truncate mt-0.5"
                        title={c.counterparty?.name || t('recent.noCp')}
                      >
                        {c.counterparty?.name || t('recent.noCp')} · {formatDate(c.contractDate, 'short')}
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
              <h3 className="font-display font-bold text-lg mb-1">{t('ai.title')}</h3>
              <p className="text-[#BFDBFE] text-sm mb-4">
                {t('ai.description')}
              </p>
              <Link href="/dashboard/seif/ai">
                <Button variant="secondary" size="sm" rightIcon={<ArrowRight size={14} />}>
                  {t('ai.createWithAi')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
