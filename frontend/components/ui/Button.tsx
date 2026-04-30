'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline'
  size?:      'xs' | 'sm' | 'md' | 'lg'
  loading?:   boolean
  fullWidth?: boolean
  leftIcon?:  React.ReactNode
  rightIcon?: React.ReactNode
}

const variants = {
  primary:   'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-sm',
  secondary: 'bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#E2E8F0]',
  success:   'bg-[#16A34A] text-white hover:bg-[#15803D] shadow-sm',
  danger:    'bg-[#DC2626] text-white hover:bg-[#B91C1C] shadow-sm',
  warning:   'bg-[#D97706] text-white hover:bg-[#B45309] shadow-sm',
  ghost:     'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A]',
  outline:   'border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] bg-white',
}

const sizes = {
  xs: 'h-7  px-2.5 text-xs  gap-1.5 rounded-md',
  sm: 'h-8  px-3   text-sm  gap-2   rounded-lg',
  md: 'h-10 px-4   text-sm  gap-2   rounded-lg',
  lg: 'h-12 px-6   text-base gap-2.5 rounded-xl',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant   = 'primary',
  size      = 'md',
  loading   = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className,
  ...props
}, ref) => {
  const isDisabled = disabled || loading

  return (
    <button
      ref={ref}
      disabled={isDisabled}
      className={cn(
        'inline-flex items-center justify-center font-medium',
        'transition-all duration-150 cursor-pointer select-none',
        'focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'active:scale-[0.98]',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2
          size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16}
          className="animate-spin shrink-0"
        />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}

      {children && <span>{children}</span>}

      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  )
})

Button.displayName = 'Button'
