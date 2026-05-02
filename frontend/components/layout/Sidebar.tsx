'use client'

import { useState, useCallback } from 'react'
import Link                      from 'next/link'
import { usePathname }           from 'next/navigation'
import { useTranslations }       from 'next-intl'
import {
  ChevronDown, PanelLeftClose, PanelLeftOpen,
  Lock, Zap, LogOut, X
} from 'lucide-react'
import { Logo }                         from '@/components/shared/Logo'
import { Badge }                        from '@/components/ui/Badge'
import { useUIStore }                   from '@/store/ui.store'
import { useAuth }                      from '@/hooks/useAuth'
import { MAIN_NAV, BOTTOM_NAV, NavItem } from '@/lib/navigation'
import { cn }                           from '@/lib/cn'

// ============================================
// NAV ITEM KOMPONENTI
// ============================================
function NavItemComponent({
  item,
  collapsed,
}: {
  item:      NavItem
  collapsed: boolean
}) {
  const pathname  = usePathname()
  const tNav      = useTranslations('nav')
  const { isPro } = useAuth()
  const [open, setOpen] = useState(false)

  // Translated label — agar nav.json'da kalit bo'lsa o'sha, yo'q bo'lsa fallback (item.label)
  const translatedLabel = (() => {
    try { return tNav(item.id as any) } catch { return item.label }
  })()

  const isActive    = pathname === item.path || pathname.startsWith(item.path + '/')
  const isLocked    = item.proOnly && !isPro
  const hasChildren = !!item.children?.length

  const hasActiveChild = item.children?.some(
    c => pathname === c.path || pathname.startsWith(c.path + '/')
  )

  const handleClick = useCallback(() => {
    if (hasChildren) setOpen(o => !o)
  }, [hasChildren])

  const content = (
    <div
      onClick={handleClick}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2.5 rounded-lg',
        'cursor-pointer transition-all duration-150',
        'group relative text-sm',
        isActive && !hasChildren
          ? 'bg-[#DBEAFE] text-[#1D4ED8] font-semibold'
          : hasActiveChild
          ? 'text-[#1D4ED8] font-medium'
          : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
        isLocked && 'opacity-60 cursor-not-allowed',
      )}
    >
      <item.icon
        size={18}
        className={cn(
          'shrink-0 transition-colors',
          isActive && !hasChildren ? 'text-[#2563EB]'
            : hasActiveChild       ? 'text-[#2563EB]'
            : 'text-[#94A3B8] group-hover:text-[#475569]'
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{translatedLabel}</span>
          {item.badge && <Badge variant="primary" size="sm">{item.badge}</Badge>}
          {isLocked && <Lock size={12} className="text-[#94A3B8]" />}
          {hasChildren && (
            <ChevronDown
              size={14}
              className={cn(
                'transition-transform text-[#94A3B8]',
                (open || hasActiveChild) && 'rotate-180'
              )}
            />
          )}
        </>
      )}

      {/* Tooltip qo'llanadi collapsed holda */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-[#0F172A] text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          {translatedLabel}
        </div>
      )}
    </div>
  )

  return (
    <div>
      {hasChildren || isLocked ? content : <Link href={item.path}>{content}</Link>}

      {/* Children */}
      {hasChildren && !collapsed && (open || hasActiveChild) && (
        <div className="mt-0.5 space-y-0.5">
          {item.children!.map(child => {
            let childLabel = child.label
            try { childLabel = tNav(child.id as any) } catch {}
            return (
              <Link key={child.id} href={child.path}>
                <div className={cn(
                  'flex items-center gap-2 pl-10 pr-3 py-2 rounded-lg text-xs',
                  'cursor-pointer transition-all',
                  pathname === child.path
                    ? 'bg-[#DBEAFE] text-[#1D4ED8] font-medium'
                    : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                )}>
                  <div className={cn(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    pathname === child.path ? 'bg-[#2563EB]' : 'bg-[#CBD5E1]'
                  )} />
                  {childLabel}
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ============================================
// ASOSIY SIDEBAR
// ============================================
export function Sidebar() {
  const t  = useTranslations('sidebar')
  const {
    sidebarCollapsed, toggleSidebar,
    sidebarMobileOpen, closeMobileSidebar
  } = useUIStore()
  const { isFree, logout } = useAuth()

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo va collapse tugma */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-[#E2E8F0] shrink-0',
        sidebarCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {sidebarCollapsed ? (
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center">
            <span className="text-white font-black text-sm font-display">M</span>
          </div>
        ) : (
          <Logo size="md" href="/dashboard" />
        )}

        <button
          onClick={toggleSidebar}
          className="hidden lg:flex p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          {sidebarCollapsed
            ? <PanelLeftOpen  size={16} />
            : <PanelLeftClose size={16} />
          }
        </button>

        <button
          onClick={closeMobileSidebar}
          className="lg:hidden p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigatsiya */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {MAIN_NAV.map(item => (
          <NavItemComponent
            key={item.id}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Upgrade panel */}
      {!sidebarCollapsed && isFree && (
        <div className="mx-3 mb-3 p-3 bg-gradient-to-br from-[#DBEAFE] to-[#EDE9FE] rounded-xl border border-[#BFDBFE]">
          <div className="flex items-center gap-2 mb-1.5">
            <Zap size={14} className="text-[#2563EB]" />
            <span className="text-xs font-bold text-[#1D4ED8]">{t('upgradeToPro')}</span>
          </div>
          <p className="text-[10px] text-[#3B82F6] mb-2">
            {t('upgradeBenefits')}
          </p>
          <Link href="/dashboard/sozlamalar/obuna">
            <button className="w-full py-1.5 text-xs font-semibold bg-[#2563EB] text-white rounded-lg hover:bg-[#1D4ED8] transition-colors">
              {t('upgradeButton')}
            </button>
          </Link>
        </div>
      )}

      {/* Pastki navigatsiya */}
      <div className="border-t border-[#E2E8F0] px-2 py-3 space-y-0.5">
        {BOTTOM_NAV.map(item => (
          <NavItemComponent
            key={item.id}
            item={item}
            collapsed={sidebarCollapsed}
          />
        ))}

        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm',
            'text-[#DC2626] hover:bg-[#FEE2E2] transition-all',
          )}
        >
          <LogOut size={18} className="shrink-0" />
          {!sidebarCollapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col fixed left-0 top-0 h-screen',
        'bg-white border-r border-[#E2E8F0] z-30',
        'transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-[280px]'
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarMobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/30 z-40"
            onClick={closeMobileSidebar}
          />
          <aside className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-white border-r border-[#E2E8F0] z-50 animate-slide-in">
            {sidebarContent}
          </aside>
        </>
      )}
    </>
  )
}
