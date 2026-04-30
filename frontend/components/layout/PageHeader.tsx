'use client'

import Link             from 'next/link'
import { ChevronRight } from 'lucide-react'
import { cn }           from '@/lib/cn'

interface Breadcrumb {
  label: string
  path?: string
}

interface PageHeaderProps {
  title:        string
  description?: string
  breadcrumbs?: Breadcrumb[]
  actions?:     React.ReactNode
  className?:   string
}

export function PageHeader({
  title, description, breadcrumbs, actions, className
}: PageHeaderProps) {
  return (
    <div className={cn('mb-6', className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-1 mb-2">
          {breadcrumbs.map((bc, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <ChevronRight size={12} className="text-[#CBD5E1]" />}
              {bc.path ? (
                <Link
                  href={bc.path}
                  className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
                >
                  {bc.label}
                </Link>
              ) : (
                <span className="text-xs text-[#475569] font-medium">{bc.label}</span>
              )}
            </div>
          ))}
        </nav>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display font-black text-[#0F172A] text-xl lg:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#94A3B8] mt-1">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
