'use client'

import { useEffect }        from 'react'
import dynamic              from 'next/dynamic'
import { usePathname }      from 'next/navigation'
import { ProtectedRoute }   from '@/components/auth/ProtectedRoute'
import { Sidebar }          from '@/components/layout/Sidebar'
import { Header }           from '@/components/layout/Header'
import { BottomNav }        from '@/components/layout/BottomNav'
import { SidebarOffset }    from '@/components/layout/SidebarOffset'

// Floating elementlarni lazy load (boshlang'ich page load tezligi uchun)
const SupportChat      = dynamic(() => import('@/components/SupportChat/SupportChat').then(m => ({ default: m.SupportChat })),         { ssr: false })
const VoiceAssistant   = dynamic(() => import('@/components/VoiceAssistant/VoiceAssistant').then(m => ({ default: m.VoiceAssistant })), { ssr: false })
const PWAInstallPrompt = dynamic(() => import('@/components/PWAInstallPrompt/PWAInstallPrompt').then(m => ({ default: m.PWAInstallPrompt })), { ssr: false })
const OnboardingTour   = dynamic(() => import('@/components/OnboardingTour/OnboardingTour').then(m => ({ default: m.OnboardingTour })), { ssr: false })
import { useUIStore }       from '@/store/ui.store'
import { cn }               from '@/lib/cn'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, closeMobileSidebar } = useUIStore()
  const pathname = usePathname()

  useEffect(() => {
    closeMobileSidebar()
  }, [pathname, closeMobileSidebar])

  return (
    <ProtectedRoute>
      <a href="#main-content" className="skip-link">
        Asosiy mazmunga o'tish
      </a>
      <div className="min-h-screen bg-[#F8FAFC]">
        <SidebarOffset />
        <Sidebar />

        <div className={cn(
          'flex flex-col min-h-screen transition-all duration-300',
          'lg:pl-[280px]',
          sidebarCollapsed && 'lg:pl-16',
        )}>
          <Header />

          <main id="main-content" className="flex-1 pt-16 pb-16 lg:pb-0" tabIndex={-1}>
            <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] 2xl:max-w-[1800px] mx-auto animate-fade-in">
              {children}
            </div>
          </main>
        </div>

        <BottomNav />
        <SupportChat />
        <VoiceAssistant />
        <PWAInstallPrompt />
        <OnboardingTour />
      </div>
    </ProtectedRoute>
  )
}
