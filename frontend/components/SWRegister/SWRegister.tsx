'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // SW registration
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      const onLoad = () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('SW register error:', err)
        })
      }
      if (document.readyState === 'complete') onLoad()
      else window.addEventListener('load', onLoad, { once: true })
    }

    // Global unhandled promise rejection — log so errors are visible in prod
    const handler = (e: PromiseRejectionEvent) => {
      const reason = e.reason
      // Ignore benign AbortError and network errors from cancelled requests
      if (reason?.name === 'AbortError') return
      console.error('[unhandledrejection]', reason)
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/v1/health/client-error', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: String(reason?.message || reason),
            stack:   String(reason?.stack || '').slice(0, 2000),
            url:     window.location.href,
            type:    'unhandledrejection',
          }),
        }).catch(() => {})
      }
    }

    window.addEventListener('unhandledrejection', handler)
    return () => window.removeEventListener('unhandledrejection', handler)
  }, [])

  return null
}
