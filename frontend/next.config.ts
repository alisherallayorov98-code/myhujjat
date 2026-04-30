import type { NextConfig } from 'next'

const config: NextConfig = {
  output: 'standalone',  // Docker uchun — ozgina image hajmi (~120MB vs ~1GB)
  images: {
    formats:         ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@tanstack/react-query'],
  },
}

export default config
