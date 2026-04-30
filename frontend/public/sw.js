// MyHujjat.uz Service Worker
// Past internetda ishlash + offline rejim uchun

const VERSION = 'v1.3.0'
const STATIC_CACHE  = `myhujjat-static-${VERSION}`
const RUNTIME_CACHE = `myhujjat-runtime-${VERSION}`
const MAX_RUNTIME_ENTRIES = 60   // xotirani cheklab qo'yish uchun

// Boshlang'ich keshlash uchun fayllar
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json',
]

// ─── Install ────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(PRECACHE_URLS).catch(() => {}))
      .then(() => self.skipWaiting())
  )
})

// ─── Activate — eski cache'larni tozalash ──────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith('myhujjat-') && key !== STATIC_CACHE && key !== RUNTIME_CACHE)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// ─── Cache size cheklash ──────────────────────────────────
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName)
  const keys  = await cache.keys()
  if (keys.length > maxItems) {
    // Eski yozuvlarni o'chirish (FIFO)
    const toDelete = keys.length - maxItems
    for (let i = 0; i < toDelete; i++) {
      await cache.delete(keys[i])
    }
  }
}

// Dev mode tekshiruvi — localhost'da SW keshlamaydi, har doim tarmoqdan oladi
const IS_DEV = self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1'

// ─── Fetch strategiya ──────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const req = event.request
  const url = new URL(req.url)

  // Faqat GET so'rovlar uchun cache
  if (req.method !== 'GET') return

  // Dev mode — hech narsa keshlamaymiz (Next.js HMR / chunk hashlari uchun)
  if (IS_DEV) return

  // POST/PUT/PATCH/DELETE — har doim tarmoq orqali
  // (avtorizatsiya talab qilinadigan API'lar)

  // Bizning origin'dan tashqari so'rovlar — bypass
  if (url.origin !== self.location.origin && !url.hostname.includes('myhujjat')) {
    return
  }

  // Next.js chunk'lari (production'da ham hash bilan) — har doim tarmoq, har biriga unique URL
  if (url.pathname.startsWith('/_next/')) {
    event.respondWith(networkFirst(req))
    return
  }

  // API so'rovlar — Network First (yangi ma'lumot, fallback cache)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(req))
    return
  }

  // Statik fayllar — Cache First (tezroq)
  if (url.pathname.startsWith('/icons/') ||
      url.pathname.endsWith('.woff2')) {
    event.respondWith(cacheFirst(req))
    return
  }

  // HTML sahifalar — Network First (oxirgi versiya, fallback offline)
  event.respondWith(networkFirst(req, '/offline'))
})

// ─── Strategiyalar ─────────────────────────────────────────
async function networkFirst(req, fallbackUrl) {
  try {
    const fresh = await fetch(req)
    if (fresh.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(req, fresh.clone()).then(() => trimCache(RUNTIME_CACHE, MAX_RUNTIME_ENTRIES))
    }
    return fresh
  } catch {
    const cached = await caches.match(req)
    if (cached) return cached
    if (fallbackUrl) {
      const fb = await caches.match(fallbackUrl)
      if (fb) return fb
    }
    return new Response(JSON.stringify({ error: 'Tarmoq yo\'q' }), {
      status:  503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

async function cacheFirst(req) {
  const cached = await caches.match(req)
  if (cached) return cached
  try {
    const fresh = await fetch(req)
    if (fresh.ok) {
      const cache = await caches.open(STATIC_CACHE)
      cache.put(req, fresh.clone())
    }
    return fresh
  } catch {
    return new Response('Offline', { status: 503 })
  }
}

// ─── Push notifikatsiya ────────────────────────────────────
self.addEventListener('push', (event) => {
  if (!event.data) return
  try {
    const data = event.data.json()
    event.waitUntil(
      self.registration.showNotification(data.title || 'MyHujjat.uz', {
        body:  data.body || '',
        icon:  data.icon || '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag:   data.tag  || 'myhujjat',
        data:  { url: data.url || '/dashboard' },
      })
    )
  } catch {}
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
      // Mavjud yoritilgan oynani topib focus qilish
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus()
      }
      return self.clients.openWindow(url)
    })
  )
})
