// Sentry client-side init — brauzerda yuz beradigan xatolarni kuzatish.
// NEXT_PUBLIC_SENTRY_DSN env yo'q bo'lsa — no-op.

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn && typeof window !== 'undefined') {
  // Dinamik import — agar paket o'rnatilmagan bo'lsa, app crashlamaydi
  // @ts-ignore — paket optional, npm install vaqtida o'rnatiladi
  void import('@sentry/nextjs').then((Sentry: any) => {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || 'development',

      // Tracelar 10% — production'da yengil
      tracesSampleRate: 0.1,

      // Replay 1% — kechiktirilgan vizual debug
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,  // xato bo'lsa 100% replay

      // Browser'dan yuborilmaydi:
      ignoreErrors: [
        'ResizeObserver loop limit exceeded',
        'Network request failed',
        'cancelled',
      ],

      // PII tozalash
      beforeSend(event: any) {
        if (event.request?.cookies) delete event.request.cookies
        if (event.request?.headers?.authorization) {
          event.request.headers.authorization = '[REDACTED]'
        }
        return event
      },
    })
  }).catch(() => {
    // Sentry o'rnatilmagan — sukut saqlash
  })
}
