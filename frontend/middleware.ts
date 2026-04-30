import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PATHS = [
  '/', '/login', '/register', '/forgot-password',
  '/narxlar', '/haqida', '/join',
  '/_next', '/api', '/favicon', '/icons', '/images', '/manifest',
]

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Static assets o'tkazib yuborish
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/images') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some(p =>
    pathname === p || pathname.startsWith(p + '/')
  )

  // Auth client-side tomonidan boshqariladi (localStorage token)

  const response = NextResponse.next()
  response.headers.set('X-Frame-Options',       'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy',         'strict-origin-when-cross-origin')
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
