'use client'

import Link from 'next/link'
import { cn } from '@/lib/cn'

interface LogoProps {
  size?:      'sm' | 'md' | 'lg'
  href?:      string
  white?:     boolean
  className?: string
}

const sizes = {
  sm: { icon: 'w-7 h-7 text-sm',  text: 'text-base' },
  md: { icon: 'w-9 h-9 text-base', text: 'text-lg' },
  lg: { icon: 'w-12 h-12 text-xl', text: 'text-2xl' },
}

export function Logo({ size = 'md', href = '/', white = false, className }: LogoProps) {
  const s = sizes[size]

  const content = (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn(
        s.icon,
        'rounded-xl flex items-center justify-center font-black font-display shrink-0',
        'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]',
        'text-white shadow-sm'
      )}>
        M
      </div>

      <div className="flex flex-col leading-none">
        <span className={cn(
          s.text,
          'font-display font-black tracking-tight',
          white ? 'text-white' : 'text-[#0F172A]'
        )}>
          MyHujjat
        </span>
        <span className={cn(
          'text-[10px] font-medium tracking-wide',
          white ? 'text-white/60' : 'text-[#94A3B8]'
        )}>
          .uz
        </span>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
