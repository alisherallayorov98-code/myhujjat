'use client'

import { forwardRef, InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:        string
  hint?:         string
  error?:        string
  leftIcon?:     React.ReactNode
  rightElement?: React.ReactNode
  required?:     boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  hint,
  error,
  leftIcon,
  rightElement,
  required,
  className,
  disabled,
  ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#374151]">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full h-10 rounded-lg text-sm',
            'bg-white border text-[#0F172A]',
            'placeholder:text-[#94A3B8]',
            'transition-all duration-150',
            'focus:outline-none focus:ring-2',
            !error
              ? 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
              : 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
            disabled && 'bg-[#F8FAFC] cursor-not-allowed opacity-60',
            leftIcon     ? 'pl-10 pr-3' : 'px-3',
            rightElement ? 'pr-10'      : '',
            className
          )}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>

      {hint && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      {error && (
        <p className="text-xs text-[#DC2626] flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

// ============================================
// TEXTAREA
// ============================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:    string
  hint?:     string
  error?:    string
  required?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, hint, error, required, className, ...props
}, ref) => {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-[#374151]">
          {label}
          {required && <span className="text-[#DC2626] ml-1">*</span>}
        </label>
      )}

      <textarea
        ref={ref}
        className={cn(
          'w-full rounded-lg text-sm px-3 py-2.5',
          'bg-white border text-[#0F172A]',
          'placeholder:text-[#94A3B8]',
          'transition-all duration-150 resize-none',
          'focus:outline-none focus:ring-2',
          !error
            ? 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
            : 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
          className
        )}
        {...props}
      />

      {hint  && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      {error && <p className="text-xs text-[#DC2626]">⚠ {error}</p>}
    </div>
  )
})

Textarea.displayName = 'Textarea'
