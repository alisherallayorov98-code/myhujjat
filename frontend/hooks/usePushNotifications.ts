'use client'

import { useEffect, useState, useCallback } from 'react'
import api from '@/lib/api'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  const arr     = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
  return arr
}

export function usePushNotifications() {
  const [supported,  setSupported]  = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ok = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setSupported(ok)
    if (ok) {
      setPermission(Notification.permission)
      navigator.serviceWorker.ready
        .then(reg => reg.pushManager.getSubscription())
        .then(s => setSubscribed(!!s))
        .catch(() => {})
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return { ok: false, error: 'Brauzeringiz qo\'llab-quvvatlamaydi' }

    // Permission so'rash
    let perm = Notification.permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
      setPermission(perm)
    }
    if (perm !== 'granted') return { ok: false, error: 'Ruxsat berilmadi' }

    // VAPID public key olish
    const { data } = await api.get('/push/public-key')
    if (!data.key) return { ok: false, error: 'Server sozlanmagan' }

    const reg = await navigator.serviceWorker.ready

    // Eski sub'ni tozalash (har ehtimolga)
    const existing = await reg.pushManager.getSubscription()
    if (existing) await existing.unsubscribe()

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly:      true,
      applicationServerKey: urlBase64ToUint8Array(data.key) as BufferSource,
    })

    const subJson = sub.toJSON()
    await api.post('/push/subscribe', {
      endpoint: subJson.endpoint,
      keys:     subJson.keys,
    })

    setSubscribed(true)
    return { ok: true }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    if (sub) {
      await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
      await sub.unsubscribe()
    }
    setSubscribed(false)
  }, [supported])

  const sendTest = useCallback(async () => {
    await api.post('/push/test')
  }, [])

  return { supported, permission, subscribed, subscribe, unsubscribe, sendTest }
}
