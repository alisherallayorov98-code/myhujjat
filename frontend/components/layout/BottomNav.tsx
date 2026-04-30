'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, FileText,
  Archive, Sparkles, Menu
} from 'lucide-react'
import { cn } from '@/lib/cn'

const BOTTOM_NAV = [
  { icon: LayoutDashboard, label: 'Bosh',      path: '/dashboard',              exact: true  },
  { icon: FileText,        label: 'Shartnoma', path: '/dashboard/shartnomalar', exact: false },
  { icon: Sparkles,        label: 'AI',        path: '/dashboard/ai',           exact: false },
  { icon: Archive,         label: 'Seif',      path: '/dashboard/seif',         exact: false },
  { icon: Menu,            label: 'Menu',      path: '/dashboard/menu',         exact: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-[#E2E8F0] safe-bottom">
      <div className="flex">
        {BOTTOM_NAV.map(item => {
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
