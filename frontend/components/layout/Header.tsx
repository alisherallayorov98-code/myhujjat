'use client'

import { useState }    from 'react'
import Link            from 'next/link'
import {
  Menu, ChevronDown,
  Building2, Plus, Check, Settings,
  User, LogOut, CreditCard
} from 'lucide-react'
import { useUIStore }      from '@/store/ui.store'
import { useAuth }         from '@/hooks/useAuth'
import { PlanBadge }       from '@/components/ui/Badge'
import { LocaleToggle }    from '@/components/shared/LocaleToggle'
import { ThemeToggle }     from '@/components/shared/ThemeToggle'
import { GlobalSearch }       from '@/components/GlobalSearch/GlobalSearch'
import { NotificationsBell }  from '@/components/Notifications/NotificationsBell'
import { HealthIndicator }    from '@/components/HealthIndicator/HealthIndicator'
import { cn }                 from '@/lib/cn'

export function Header() {
  const { openMobileSidebar, sidebarCollapsed } = useUIStore()
  const { user, currentOrg, organizations, logout, setCurrentOrg } = useAuth()
  const [orgOpen,  setOrgOpen]  = useState(false)
  const [userOpen, setUserOpen] = useState(false)

  return (
    <header className={cn(
      'fixed top-0 right-0 z-20 h-16',
      'bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]',
      'flex items-center px-4 gap-3 transition-all duration-300',
      'left-0 lg:left-[280px]',
      sidebarCollapsed && 'lg:left-16',
    )}>
      {/* Mobile menyu */}
      <button
        onClick={openMobileSidebar}
        className="lg:hidden p-2 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9]"
        aria-label="Menyuni ochish"
      >
        <Menu size={20} />
      </button>

      {/* Global qidiruv */}
      <GlobalSearch />

      <div className="flex-1" />

      {/* Til tanlash */}
      <LocaleToggle />

      {/* Mavzu (yorqin / qorong'i) */}
      <ThemeToggle />

      {/* Tashkilot tanlash */}
      <div className="relative">
        <button
          onClick={() => { setOrgOpen(!orgOpen); setUserOpen(false) }}
          className="flex items-center gap-2 h-9 px-3 rounded-lg border border-[#E2E8F0] bg-white hover:bg-[#F8FAFC] transition-colors max-w-[200px]"
        >
          <Building2 size={14} className="text-[#2563EB] shrink-0" />
          <span className="text-sm font-medium text-[#0F172A] truncate">
            {currentOrg?.name || "Tashkilot yo'q"}
          </span>
          <ChevronDown size={14} className="text-[#94A3B8] shrink-0" />
        </button>

        {orgOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOrgOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-64 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 overflow-hidden animate-scale-in">
              <div className="p-2 space-y-0.5">
                {organizations.length === 0 && (
                  <p className="text-xs text-[#94A3B8] text-center py-3">
                    Tashkilot yo'q
                  </p>
                )}
                {organizations.map(org => (
                  <button
                    key={org.id}
                    onClick={() => { setCurrentOrg(org); setOrgOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-[#F1F5F9] transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#DBEAFE] flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-[#2563EB]">
                        {org.name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{org.name}</p>
                      {org.inn && <p className="text-xs text-[#94A3B8]">STIR: {org.inn}</p>}
                    </div>
                    {currentOrg?.id === org.id && (
                      <Check size={14} className="text-[#2563EB] shrink-0" />
                    )}
                  </button>
                ))}
              </div>

              <div className="border-t border-[#E2E8F0] p-2">
                <Link href="/dashboard/tashkilotlar">
                  <button
                    onClick={() => setOrgOpen(false)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#2563EB] hover:bg-[#DBEAFE] transition-colors"
                  >
                    <Plus size={14} />
                    Tashkilot qo'shish
                  </button>
                </Link>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Health indicator (faqat muammo bo'lsa ko'rinadi) */}
      <HealthIndicator />

      {/* Bildirishnomalar */}
      <NotificationsBell />

      {/* Foydalanuvchi menyu */}
      <div className="relative">
        <button
          onClick={() => { setUserOpen(!userOpen); setOrgOpen(false) }}
          className="flex items-center gap-2 h-9 pl-2 pr-3 rounded-lg hover:bg-[#F1F5F9] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#0F172A] leading-none">
              {user?.firstName || user?.email?.split('@')[0]}
            </p>
            <div className="mt-0.5">
              <PlanBadge plan={user?.subscription?.plan || 'FREE'} />
            </div>
          </div>
          <ChevronDown size={14} className="text-[#94A3B8] hidden sm:block" />
        </button>

        {userOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
            <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 overflow-hidden animate-scale-in">
              <div className="px-4 py-3 border-b border-[#E2E8F0]">
                <p className="text-sm font-semibold text-[#0F172A]">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-[#94A3B8] truncate">{user?.email}</p>
              </div>

              <div className="p-2 space-y-0.5">
                {[
                  { icon: User,       label: 'Profil',     href: '/dashboard/profil' },
                  { icon: CreditCard, label: 'Obuna',      href: '/dashboard/sozlamalar/obuna' },
                  { icon: Settings,   label: 'Sozlamalar', href: '/dashboard/sozlamalar' },
                ].map(item => (
                  <Link key={item.label} href={item.href}>
                    <button
                      onClick={() => setUserOpen(false)}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
                    >
                      <item.icon size={15} />
                      {item.label}
                    </button>
                  </Link>
                ))}

                <div className="border-t border-[#E2E8F0] my-1" />

                <button
                  onClick={() => { logout(); setUserOpen(false) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
                >
                  <LogOut size={15} />
                  Chiqish
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
