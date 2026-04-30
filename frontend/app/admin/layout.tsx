'use client'

import { useEffect }                         from 'react'
import { useRouter, usePathname }            from 'next/navigation'
import Link                                  from 'next/link'
import {
  LayoutDashboard, Users, CreditCard,
  Bell, MessageSquare, LogOut, FileSearch, Building2,
} from 'lucide-react'
import { useAuth }                           from '@/hooks/useAuth'
import { cn }                               from '@/lib/cn'

const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard',         icon: LayoutDashboard, path: '/admin' },
  { id: 'users',     label: 'Foydalanuvchilar',  icon: Users,           path: '/admin/users' },
  { id: 'orgs',      label: 'Tashkilotlar',      icon: Building2,       path: '/admin/organizations' },
  { id: 'payments',  label: "To'lovlar",         icon: CreditCard,      path: '/admin/payments' },
  { id: 'audit',     label: 'Audit log',         icon: FileSearch,      path: '/admin/audit' },
  { id: 'announce',  label: "E'lonlar",           icon: Bell,            path: '/admin/announcements' },
  { id: 'support',   label: 'Support',            icon: MessageSquare,   path: '/admin/support' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const { user, isLoading, logout } = useAuth()

  useEffect(() => {
    if (!isLoading && (!user || !['ADMIN', 'SUPER_ADMIN'].includes(user.role ?? ''))) {
      router.push('/dashboard')
    }
  }, [user, isLoading])

  if (isLoading || !user) return null

  const activeNav = ADMIN_NAV.slice().reverse().find(n => pathname.startsWith(n.path))

  return (
    <div className="min-h-screen bg-[#0F172A] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1E293B] border-r border-[#334155] flex flex-col shrink-0">
        <div className="h-14 px-4 flex items-center border-b border-[#334155]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="text-white font-bold text-sm">Admin Panel</span>
          </div>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {ADMIN_NAV.map(item => {
            const isActive = item.id === 'dashboard'
              ? pathname === item.path
              : pathname.startsWith(item.path)
            return (
              <Link key={item.id} href={item.path}>
                <div className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                  isActive
                    ? 'bg-[#2563EB] text-white'
                    : 'text-[#94A3B8] hover:bg-[#334155] hover:text-white'
                )}>
                  <item.icon size={16} className="shrink-0" />
                  {item.label}
                </div>
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-[#334155]">
          <Link href="/dashboard">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#94A3B8] hover:bg-[#334155] hover:text-white transition-all mb-1">
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </div>
          </Link>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F87171] hover:bg-[#334155] transition-all"
          >
            <LogOut size={15} />
            <span>Chiqish</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        <header className="h-14 bg-[#1E293B] border-b border-[#334155] px-6 flex items-center justify-between shrink-0">
          <h1 className="text-white font-medium text-sm">
            {activeNav?.label || 'Admin'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#2563EB] flex items-center justify-center">
              <span className="text-white text-xs font-bold">
                {user.email?.[0]?.toUpperCase()}
              </span>
            </div>
            <span className="text-[#94A3B8] text-xs">{user.email}</span>
          </div>
        </header>

        <main className="flex-1 p-6 bg-[#0F172A] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
