import { create }  from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarCollapsed:  boolean
  sidebarMobileOpen: boolean
  theme:             'light' | 'dark'

  setSidebarCollapsed: (v: boolean) => void
  openMobileSidebar:   () => void
  closeMobileSidebar:  () => void
  toggleSidebar:       () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed:  false,
      sidebarMobileOpen: false,
      theme:             'light',

      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      openMobileSidebar:   ()  => set({ sidebarMobileOpen: true }),
      closeMobileSidebar:  ()  => set({ sidebarMobileOpen: false }),
      toggleSidebar:       ()  => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    {
      name:       'myhujjat-ui',
      partialize: s => ({ sidebarCollapsed: s.sidebarCollapsed }),
    }
  )
)
