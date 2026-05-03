import { NestFactory }    from '@nestjs/core'
import { ValidationPipe, Logger } from '@nestjs/common'
import { AppModule }      from './app.module'
import { validateEnv }    from './common/env.validation'
import { randomUUID }     from 'crypto'
import * as cookieParser  from 'cookie-parser'
import * as bodyParser    from 'body-parser'
import helmet             from 'helmet'
import * as compression   from 'compression'

async function bootstrap() {
  // Application boshlanishidan oldin majburiy env'larni tekshirish
  validateEnv()

  const app = await NestFactory.create(AppModule, { bodyParser: false })

  // Per-route body parser limits — DoS oldini olish uchun
  // - Voice/audio base64 va avatar uchun 10mb (eng katta payload)
  // - Boshqa endpoint'lar uchun 1mb (oddiy JSON)
  // - rawBody webhook imzolarini tekshirish uchun saqlanadi (Didox, Click, Payme)
  const captureRaw = (req: any, _res: any, buf: Buffer) => { req.rawBody = buf }

  // Katta payload — faqat voice va profile avatar
  app.use('/api/v1/voice',           bodyParser.json({ limit: '10mb', verify: captureRaw }))
  app.use('/api/v1/users/avatar',    bodyParser.json({ limit: '10mb', verify: captureRaw }))

  // Webhook'lar — kichik, lekin rawBody kerak
  app.use('/api/v1/payments/click',  bodyParser.json({ limit: '500kb', verify: captureRaw }))
  app.use('/api/v1/payments/payme',  bodyParser.json({ limit: '500kb', verify: captureRaw }))
  app.use('/api/v1/didox/webhook',   bodyParser.json({ limit: '500kb', verify: captureRaw }))

  // Default — barcha boshqa route'lar (1mb yetarli oddiy CRUD uchun)
  app.use(bodyParser.json({ limit: '1mb', verify: captureRaw }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }))

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(o => o.trim())
    : ['http://localhost:3000', 'http://localhost:3001']

  app.enableCors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error(`CORS: ${origin} not allowed`))
      }
    },
    credentials:    true,
    methods:        ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // ─── Security headers (production'ga moslashtirilgan) ──────
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      directives: {
        defaultSrc:  ["'self'"],
        styleSrc:    ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc:     ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc:      ["'self'", 'data:', 'blob:', 'https:'],
        scriptSrc:   ["'self'", "'unsafe-eval'", "'unsafe-inline'"],  // Next.js uchun
        connectSrc:  ["'self'", 'https://api.didox.uz', 'https://my3.soliq.uz', 'https://generativelanguage.googleapis.com'],
        frameAncestors: ["'self'"],
        objectSrc:   ["'none'"],
        baseUri:     ["'self'"],
      },
    } : false,
    hsts: process.env.NODE_ENV === 'production' ? {
      maxAge:            63072000,  // 2 yil
      includeSubDomains: true,
      preload:           true,
    } : false,
    crossOriginEmbedderPolicy: false,  // PWA uchun
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  }))
  app.use(cookieParser())
  app.use(compression())

  // Request correlation ID — debug/tracing uchun (har request'ga unique ID)
  app.use((req: any, res: any, next: any) => {
    req.id = req.headers['x-request-id'] || randomUUID()
    res.setHeader('X-Request-ID', req.id)
    next()
  })

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: true,
    transform:            true,
    transformOptions:     { enableImplicitConversion: true },
  }))

  const port = process.env.PORT || 4000
  await app.listen(port)
  Logger.log(`🚀 Myhujjat.uz Backend: http://localhost:${port}/api/v1`, 'Bootstrap')

  // Graceful shutdown — SIGTERM kelganda in-flight request'larni yakunlash
  const shutdown = async (signal: string) => {
    Logger.log(`${signal} qabul qilindi, yopilmoqda...`, 'Bootstrap')
    await app.close()
    process.exit(0)
  }
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT',  () => shutdown('SIGINT'))
}

bootstrap()
