'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  LayoutDashboard, FileText,
  Archive, Sparkles, Menu
} from 'lucide-react'
import { cn } from '@/lib/cn'

export function BottomNav() {
  const t        = useTranslations('mobileNav')
  const pathname = usePathname()

  const items = [
    { icon: LayoutDashboard, label: t('home'),      path: '/dashboard',              exact: true  },
    { icon: FileText,        label: t('contracts'), path: '/dashboard/shartnomalar', exact: false },
    { icon: Sparkles,        label: t('ai'),        path: '/dashboard/seif/ai',      exact: false },
    { icon: Archive,         label: t('safe'),      path: '/dashboard/seif',         exact: true  },
    { icon: Menu,            label: t('menu'),      path: '/dashboard/menu',         exact: false },
  ]

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] safe-bottom">
      <div className="flex">
        {items.map(item => {
          const isActive = item.exact
            ? pathname === item.path
            : pathname === item.path || pathname.startsWith(item.path + '/')
          return (
            <Link key={item.path} href={item.path} className="flex-1">
              <div className={cn(
                'flex flex-col items-center py-2.5 gap-0.5 transition-colors',
                isActive ? 'text-[#2563EB]' : 'text-[#94A3B8]'
              )}>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
