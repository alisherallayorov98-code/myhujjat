'use client'

import Link          from 'next/link'
import { useAuth }   from '@/hooks/useAuth'
import { PlanBadge } from '@/components/ui/Badge'
import {
  Building2, Users, Calculator, Scale,
  LayoutTemplate, Settings, CreditCard,
  LogOut, ChevronRight, FileText, ClipboardList,
} from 'lucide-react'

const MENU_SECTIONS = [
  {
    title: 'Asosiy',
    items: [
      { icon: FileText,       label: 'Shartnomalar',  path: '/dashboard/shartnomalar'  },
      { icon: ClipboardList,  label: 'Kontragentlar', path: '/dashboard/kontragentlar' },
    ],
  },
  {
    title: 'Bo\'limlar',
    items: [
      { icon: Users,          label: 'Kadrlar (HR)',   path: '/dashboard/kadrlar'    },
      { icon: Calculator,     label: 'Buxgalter',      path: '/dashboard/buxgalter'  },
      { icon: Scale,          label: 'Yurist',         path: '/dashboard/yurist'     },
      { icon: Building2,      label: 'Kotib',          path: '/dashboard/kotib'      },
    ],
  },
  {
    title: 'Sozlamalar',
    items: [
      { icon: LayoutTemplate, label: 'Shablonlar',     path: '/dashboard/shablonlar'         },
      { icon: CreditCard,     label: 'Obuna',          path: '/dashboard/sozlamalar/obuna'   },
      { icon: Settings,       label: 'Sozlamalar',     path: '/dashboard/sozlamalar'         },
    ],
  },
]

export default function MobileMenuPage() {
  const { user, logout } = useAuth()

  return (
    <div className="pb-24 max-w-lg">
      {/* Profil */}
      <div className="flex items-center gap-3 mb-5 p-1">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center shrink-0">
          <span className="text-white font-black text-lg">
            {user?.firstName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#0F172A] truncate">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.email}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-xs text-[#94A3B8] truncate">{user?.email}</p>
            <PlanBadge plan={user?.subscription?.plan || 'FREE'} />
          </div>
        </div>
      </div>

      {/* Menyu bo'limlari */}
      {MENU_SECTIONS.map(section => (
        <div key={section.title} className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] mb-1.5 px-1">
            {section.title}
          </p>
          <div className="bg-white rounded-xl overflow-hidden border border-[#E2E8F0]">
            {section.items.map((item, i) => (
              <Link key={item.path} href={item.path}>
                <div className={`flex items-center gap-3 px-4 py-3.5 active:bg-[#F1F5F9] transition-colors ${
                  i < section.items.length - 1 ? 'border-b border-[#F1F5F9]' : ''
                }`}>
                  <item.icon size={17} className="text-[#475569] shrink-0" />
                  <span className="flex-1 text-sm text-[#0F172A]">{item.label}</span>
                  <ChevronRight size={14} className="text-[#CBD5E1]" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}

      {/* Chiqish */}
      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[#DC2626] active:bg-[#FEE2E2] transition-colors"
      >
        <LogOut size={17} className="shrink-0" />
        <span className="text-sm font-medium">Chiqish</span>
      </button>
    </div>
  )
}
