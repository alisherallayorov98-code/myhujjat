'use client'

import { useEffect } from 'react'

export function SWRegister() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) return

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.warn('SW register error:', err)
      })
    }

    if (document.readyState === 'complete') onLoad()
    else window.addEventListener('load', onLoad, { once: true })
  }, [])

  return null
}
