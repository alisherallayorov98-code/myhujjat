'use client'

import { HTMLAttributes } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/cn'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?:    'sm' | 'md'
  dot?:     boolean
}

const variants = {
  default: 'bg-[#F1F5F9] text-[#475569]',
  primary: 'bg-[#DBEAFE] text-[#1D4ED8]',
  success: 'bg-[#DCFCE7] text-[#15803D]',
  warning: 'bg-[#FEF3C7] text-[#B45309]',
  danger:  'bg-[#FEE2E2] text-[#B91C1C]',
  info:    'bg-[#CFFAFE] text-[#0E7490]',
  outline: 'bg-white border border-[#E2E8F0] text-[#475569]',
}

const dotColors = {
  default: 'bg-[#94A3B8]',
  primary: 'bg-[#2563EB]',
  success: 'bg-[#16A34A]',
  warning: 'bg-[#D97706]',
  danger:  'bg-[#DC2626]',
  info:    'bg-[#0891B2]',
  outline: 'bg-[#94A3B8]',
}

export function Badge({
  variant = 'default',
  size    = 'sm',
  dot     = false,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium rounded-full',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1',
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />
      )}
      {children}
    </span>
  )
}

export function ContractStatusBadge({ status }: { status: string }) {
  const t = useTranslations('contracts.statusOptions')
  const variants: Record<string, BadgeProps['variant']> = {
    DRAFT:     'default',
    ACTIVE:    'success',
    COMPLETED: 'primary',
    CANCELLED: 'danger',
  }
  const variant = variants[status] || 'default'
  let label = status
  try { label = t(status as any) } catch { /* fallback */ }
  return <Badge variant={variant} dot>{label}</Badge>
}

export function PlanBadge({ plan }: { plan: string }) {
  const config: Record<string, { label: string; variant: BadgeProps['variant'] }> = {
    FREE:     { label: 'Bepul',    variant: 'default'  },
    STANDARD: { label: 'Standart', variant: 'primary'  },
    PRO:      { label: 'Pro',      variant: 'warning'  },
    DEMO:     { label: 'Demo',     variant: 'info'     },
  }
  const cfg = config[plan] || { label: plan, variant: 'default' }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}
