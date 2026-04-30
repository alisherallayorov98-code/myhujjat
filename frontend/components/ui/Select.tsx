'use client'

import { SelectHTMLAttributes, forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?:       string
  error?:       string
  hint?:        string
  required?:    boolean
  options:      { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, hint, required, options,
  placeholder, className, ...props
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
        <select
          ref={ref}
          className={cn(
            'w-full h-10 rounded-lg text-sm px-3 pr-9',
            'bg-white border text-[#0F172A] appearance-none',
            'transition-all duration-150 cursor-pointer',
            'focus:outline-none focus:ring-2',
            !error
              ? 'border-[#E2E8F0] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
              : 'border-[#DC2626] focus:ring-[#DC2626]/20',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>{placeholder}</option>
          )}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none"
        />
      </div>
      {hint  && !error && <p className="text-xs text-[#94A3B8]">{hint}</p>}
      {error && <p className="text-xs text-[#DC2626]">⚠ {error}</p>}
    </div>
  )
})

Select.displayName = 'Select'

// ============================================
// CHECKBOX
// ============================================
interface CheckboxProps {
  label?:    string
  checked:   boolean
  onChange:  (checked: boolean) => void
  disabled?: boolean
  size?:     'sm' | 'md'
}

export function Checkbox({ label, checked, onChange, disabled, size = 'md' }: CheckboxProps) {
  return (
    <label className={cn(
      'flex items-center gap-2 cursor-pointer',
      disabled && 'opacity-50 cursor-not-allowed'
    )}>
      <div
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'border-2 rounded flex items-center justify-center transition-all',
          size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
          checked
            ? 'bg-[#2563EB] border-[#2563EB]'
            : 'bg-white border-[#CBD5E1] hover:border-[#2563EB]'
        )}
      >
        {checked && (
          <svg
            viewBox="0 0 10 8"
            fill="none"
            className={size === 'sm' ? 'w-2.5 h-2' : 'w-3 h-2.5'}
          >
            <path
              d="M1 4L3.5 6.5L9 1"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
      {label && (
        <span className={cn('text-[#374151]', size === 'sm' ? 'text-xs' : 'text-sm')}>
          {label}
        </span>
      )}
    </label>
  )
}
