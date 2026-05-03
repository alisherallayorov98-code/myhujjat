'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { User, Lock, Building2, CreditCard, Bell, Activity, Users, UserCheck, Link2, Bot } from 'lucide-react'
import { cn }          from '@/lib/cn'

export default function SozlamalarLayout({ children }: { children: React.ReactNode }) {
  const t        = useTranslations('settings')
  const pathname = usePathname()

  const SETTINGS_NAV = [
    { id: 'profil',      label: t('navProfil'),      icon: User,        path: '/dashboard/sozlamalar/profil'                  },
    { id: 'xavfsizlik',  label: t('navXavfsizlik'),  icon: Lock,        path: '/dashboard/sozlamalar/xavfsizlik'              },
    { id: 'tashkilot',   label: t('navTashkilot'),   icon: Building2,   path: '/dashboard/sozlamalar/tashkilot'               },
    { id: 'tasischilar', label: t('navTasischilar'), icon: UserCheck,   path: '/dashboard/sozlamalar/tashkilot/tasischilar'   },
    { id: 'azolar',      label: t('navAzolar'),      icon: Users,       path: '/dashboard/sozlamalar/tashkilot/azolar'        },
    { id: 'didox',       label: t('navDidox'),       icon: Link2,       path: '/dashboard/sozlamalar/didox'                   },
    { id: 'mira',        label: t('navMira'),        icon: Bot,         path: '/dashboard/sozlamalar/mira'                    },
    { id: 'obuna',       label: t('navObuna'),       icon: CreditCard,  path: '/dashboard/sozlamalar/obuna'                   },
    { id: 'xabarnoma',   label: t('navXabarnoma'),   icon: Bell,        path: '/dashboard/sozlamalar/xabarnoma'               },
    { id: 'audit',       label: t('navAudit'),       icon: Activity,    path: '/dashboard/sozlamalar/audit'                   },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bold text-[#0F172A] text-2xl">{t('title')}</h1>
        <p className="text-sm text-[#94A3B8] mt-1">{t('description')}</p>
      </div>

      {/* Mobile: gorizontal scroll-tabs (kichik ekranda layout buzilmasligi uchun) */}
      <div className="md:hidden mb-4 -mx-4 px-4 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {SETTINGS_NAV.map(item => {
            const isActive = pathname === item.path
            return (
              <Link key={item.id} href={item.path}>
                <div className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-all',
                  isActive
                    ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                    : 'text-[#475569] hover:bg-[#F1F5F9]'
                )}>
                  <item.icon size={14} className="shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Desktop: yon panel */}
      <div className="md:flex md:gap-6">
        <aside className="hidden md:block md:w-52 md:shrink-0">
          <nav className="space-y-0.5">
            {SETTINGS_NAV.map(item => {
              const isActive = pathname === item.path
              const isSubItem = item.id === 'tasischilar' || item.id === 'azolar'
              return (
                <Link key={item.id} href={item.path}>
                  <div className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                    isSubItem && 'pl-6',
                    isActive
                      ? 'bg-[#DBEAFE] text-[#2563EB] font-medium'
                      : 'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]'
                  )}>
                    <item.icon size={15} className="shrink-0" />
                    {item.label}
                  </div>
                </Link>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
