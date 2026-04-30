'use client'

import { useEffect } from 'react'
import { useAuth }   from '@/hooks/useAuth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { loadUser } = useAuth()

  useEffect(() => {
    loadUser()
  }, [loadUser])

  return <>{children}</>
}
