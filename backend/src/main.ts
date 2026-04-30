import { NestFactory }    from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { AppModule }      from './app.module'
import * as cookieParser  from 'cookie-parser'
import * as bodyParser    from 'body-parser'
import helmet             from 'helmet'
import * as compression   from 'compression'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false })

  // Body parser — voice (audio base64) va avatar (image base64) uchun katta limit
  // rawBody webhook imzolarini tekshirish uchun saqlanadi (Didox, Click, Payme)
  app.use(bodyParser.json({
    limit: '20mb',
    verify: (req: any, _res, buf) => { req.rawBody = buf },
  }))
  app.use(bodyParser.urlencoded({ extended: true, limit: '20mb' }))

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

  app.setGlobalPrefix('api/v1')

  app.useGlobalPipes(new ValidationPipe({
    whitelist:            true,
    forbidNonWhitelisted: true,
    transform:            true,
    transformOptions:     { enableImplicitConversion: true },
  }))

  const port = process.env.PORT || 4000
  await app.listen(port)
  console.log(`🚀 Myhujjat.uz Backend: http://localhost:${port}/api/v1`)
}

bootstrap()
