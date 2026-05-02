'use client'

import Link               from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuth }        from '@/hooks/useAuth'
import { PlanBadge }      from '@/components/ui/Badge'
import {
  Building2, Users, Calculator, Scale,
  LayoutTemplate, Settings, CreditCard,
  LogOut, ChevronRight, FileText, ClipboardList,
} from 'lucide-react'

export default function MobileMenuPage() {
  const t = useTranslations('mobileNav')
  const { user, logout } = useAuth()

  const MENU_SECTIONS = [
    {
      title: t('section.main'),
      items: [
        { icon: FileText,      label: t('item.contracts'),      path: '/dashboard/shartnomalar'  },
        { icon: ClipboardList, label: t('item.counterparties'), path: '/dashboard/kontragentlar' },
      ],
    },
    {
      title: t('section.depts'),
      items: [
        { icon: Users,         label: t('item.hr'),         path: '/dashboard/kadrlar'    },
        { icon: Calculator,    label: t('item.accountant'), path: '/dashboard/buxgalter'  },
        { icon: Scale,         label: t('item.lawyer'),     path: '/dashboard/yurist'     },
        { icon: Building2,     label: t('item.secretary'),  path: '/dashboard/kotib'      },
      ],
    },
    {
      title: t('section.settings'),
      items: [
        { icon: LayoutTemplate, label: t('item.templates'),    path: '/dashboard/shablonlar'         },
        { icon: CreditCard,     label: t('item.subscription'), path: '/dashboard/sozlamalar/obuna'   },
        { icon: Settings,       label: t('item.settings'),     path: '/dashboard/sozlamalar'         },
      ],
    },
  ]

  return (
    <div className="pb-24 max-w-lg">
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

      <button
        onClick={logout}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-white rounded-xl border border-[#E2E8F0] text-[#DC2626] active:bg-[#FEE2E2] transition-colors"
      >
        <LogOut size={17} className="shrink-0" />
        <span className="text-sm font-medium">{t('logout')}</span>
      </button>
    </div>
  )
}
