import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://myhujjat.uz'
  return {
    rules: [
      {
        userAgent: '*',
        allow:    ['/', '/haqida', '/narxlar', '/login', '/register', '/terms', '/privacy'],
        disallow: ['/dashboard/', '/admin/', '/api/', '/sign/', '/join/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host:    base,
  }
}
