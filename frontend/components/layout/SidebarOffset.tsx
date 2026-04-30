'use client'

import { useEffect }  from 'react'
import { useUIStore } from '@/store/ui.store'

export function SidebarOffset() {
  const { sidebarCollapsed } = useUIStore()

  useEffect(() => {
    const offset = sidebarCollapsed ? '64px' : '260px'
    document.documentElement.style.setProperty('--sidebar-offset', offset)
  }, [sidebarCollapsed])

  return null
}
