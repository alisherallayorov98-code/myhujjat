'use client'

import Link            from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Lock, Building2, CreditCard, Bell, Activity, Users, UserCheck, Link2 } from 'lucide-react'
import { cn }          from '@/lib/cn'

const SETTINGS_NAV = [
  { id: 'profil',      label: 'Profil',           icon: User,        path: '/dashboard/sozlamalar/profil'                  },
  { id: 'xavfsizlik',  label: 'Xavfsizlik',        icon: Lock,        path: '/dashboard/sozlamalar/xavfsizlik'              },
  { id: 'tashkilot',   label: 'Tashkilot',          icon: Building2,   path: '/dashboard/sozlamalar/tashkilot'               },
  { id: 'tasischilar', label: "Ta'sischilar",       icon: UserCheck,   path: '/dashboard/sozlamalar/tashkilot/tasischilar'   },
  { id: 'azolar',      label: "A'zolar",            icon: Users,       path: '/dashboard/sozlamalar/tashkilot/azolar'        },
  { id: 'didox',       label: 'Didox integratsiya', icon: Link2,       path: '/dashboard/sozlamalar/didox'                   },
  { id: 'obuna',       label: "Obuna va to'lov",    icon: CreditCard,  path: '/dashboard/sozlamalar/obuna'                   },
  { id: 'xabarnoma',   label: 'Bildirishnomalar',   icon: Bell,        path: '/dashboard/sozlamalar/xabarnoma'               },
  { id: 'audit',       label: 'Faoliyat tarixi',    icon: Activity,    path: '/dashboard/sozlamalar/audit'                   },
]

export default function SozlamalarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-bold text-[#0F172A] text-2xl">Sozlamalar</h1>
        <p className="text-sm text-[#94A3B8] mt-1">Hisob va tashkilot sozlamalarini boshqaring</p>
      </div>

      <div className="flex gap-6">
        <aside className="w-52 shrink-0">
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
