'use client'

import { useState, useEffect } from 'react'
import { useTranslations }      from 'next-intl'
import { useQuery } from '@tanstack/react-query'
import { WifiOff, Activity } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/cn'

interface HealthData {
  status:    'healthy' | 'degraded' | 'unhealthy'
  uptime:    number
  components: any
}

export function HealthIndicator() {
  const t = useTranslations('healthIndicator')
  const [online, setOnline] = useState(true)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    function handleOnline()  { setOnline(true)  }
    function handleOffline() { setOnline(false) }

    setOnline(navigator.onLine)
    window.addEventListener('online',  handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online',  handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const { data: health } = useQuery<HealthData>({
    queryKey: ['health'],
    queryFn:  () => api.get('/health').then(r => r.data),
    refetchInterval: 60_000,
    retry: 0,
    staleTime: 30_000,
    enabled: online,
  })

  if (!online) {
    return (
      <button
        onClick={() => setShowDetails(s => !s)}
        className="relative p-2 rounded-lg bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA] transition"
        title={t('offline')}
      >
        <WifiOff size={16} />
      </button>
    )
  }

  const status = health?.status
  if (status === 'healthy' || !health) return null

  const cfg = status === 'unhealthy'
    ? { color: 'bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]', label: t('serverIssues'), dot: 'bg-[#DC2626]' }
    : { color: 'bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A]', label: t('serverSlow'),   dot: 'bg-[#D97706]' }

  return (
    <div className="relative">
      <button
        onClick={() => setShowDetails(s => !s)}
        className={cn('relative p-2 rounded-lg transition', cfg.color)}
        title={cfg.label}
      >
        <Activity size={16} />
        <span className={cn('absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse', cfg.dot)} />
      </button>

      {showDetails && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowDetails(false)} />
          <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-20 p-4 animate-scale-in">
            <p className="text-sm font-semibold text-[#0F172A] mb-3">{cfg.label}</p>

            <div className="space-y-2 text-xs">
              {Object.entries(health.components).map(([key, comp]: any) => (
                <div key={key} className="flex items-center gap-2">
                  <div className={cn(
                    'w-2 h-2 rounded-full shrink-0',
                    comp.status === 'up'       ? 'bg-[#16A34A]' :
                    comp.status === 'degraded' ? 'bg-[#D97706]' :
                                                 'bg-[#DC2626]'
                  )} />
                  <span className="font-medium text-[#475569] capitalize">
                    {key === 'database' ? t('componentDatabase') :
                     key === 'memory'   ? t('componentMemory')   :
                     key === 'breakers' ? t('componentBreakers') : key}
                  </span>
                  <span className="text-[#94A3B8] ml-auto">
                    {comp.status === 'up' ? '✓' : comp.message || '—'}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-[#94A3B8] mt-3 pt-3 border-t border-[#F1F5F9]">
              {t('footerBefore')}
              <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] ml-1 hover:underline">
                {t('footerLink')}
              </a>
              {t('footerAfter')}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
