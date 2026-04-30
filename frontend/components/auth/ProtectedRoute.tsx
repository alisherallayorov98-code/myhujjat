'use client'

import { useEffect }    from 'react'
import { useRouter }    from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router              = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-black font-display text-lg">M</span>
          </div>
          <div className="flex gap-1 justify-center">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[#2563EB]"
                style={{ animation: `pulse 1.2s ease infinite ${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}
