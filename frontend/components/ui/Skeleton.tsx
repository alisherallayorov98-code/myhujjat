'use client'

import { cn } from '@/lib/cn'

interface SkeletonProps {
  height?:    number | string
  width?:     string
  className?: string
  rounded?:   'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({
  height, width = '100%', className, rounded = 'md'
}: SkeletonProps) {
  const roundeds = {
    sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl', full: 'rounded-full'
  }
  return (
    <div
      className={cn('shimmer', roundeds[rounded], className)}
      style={{ height, width }}
    />
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#E2E8F0]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton
            height={16}
            width={i === 0 ? '60%' : i === cols - 1 ? '40%' : '80%'}
          />
        </td>
      ))}
    </tr>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 space-y-3">
      <Skeleton height={20} width="50%" />
      <Skeleton height={14} width="80%" />
      <Skeleton height={14} width="65%" />
      <div className="flex gap-2 pt-1">
        <Skeleton height={28} width="80px" rounded="lg" />
        <Skeleton height={28} width="60px" rounded="lg" />
      </div>
    </div>
  )
}

// ─── Statistika kartochkasi ────────────────────────────────
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] p-4 flex items-start gap-3">
      <Skeleton height={40} width="40px" rounded="lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height={12} width="60%" />
        <Skeleton height={20} width="50%" />
        <Skeleton height={11} width="70%" />
      </div>
    </div>
  )
}

// ─── List item (faktura, kontragent, shartnoma) ────────────
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#F1F5F9]">
      <Skeleton height={36} width="36px" rounded="lg" />
      <div className="flex-1 space-y-1.5">
        <Skeleton height={14} width="40%" />
        <Skeleton height={12} width="65%" />
      </div>
      <Skeleton height={14} width="80px" />
    </div>
  )
}

// ─── To'liq sahifa loading (dashboard yoki detail) ─────────
export function PageSkeleton({ stats = false }: { stats?: boolean }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height={28} width="240px" />
        <Skeleton height={14} width="320px" />
      </div>

      {/* Stats grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      )}

      {/* Content */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
        <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <Skeleton height={16} width="160px" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)}
      </div>
    </div>
  )
}

// ─── Detail sahifa skeleton ────────────────────────────────
export function DetailSkeleton() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="space-y-2">
        <Skeleton height={14} width="200px" />
        <Skeleton height={28} width="300px" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    </div>
  )
}

// ============================================
// EMPTY STATE
// ============================================
interface EmptyStateProps {
  icon?:        React.ReactNode
  title:        string
  description?: string
  action?:      { label: string; onClick: () => void }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] border border-[#E2E8F0] flex items-center justify-center mb-4 text-[#94A3B8]">
          {icon}
        </div>
      )}
      <h3 className="font-display font-semibold text-[#0F172A] text-base mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-[#94A3B8] max-w-sm leading-relaxed mb-4">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="px-4 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
