'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

interface Props {
  page:         number
  totalPages:   number
  onPageChange: (p: number) => void
  className?:   string
}

/**
 * Compact pagination: 1 ... 4 5 6 ... 10
 * 7 yoki kam sahifa bo'lsa — barchasi ko'rsatiladi.
 */
export function Pagination({ page, totalPages, onPageChange, className }: Props) {
  if (totalPages <= 1) return null

  function getPages(): (number | '...')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const out: (number | '...')[] = [1]
    if (page > 3) out.push('...')
    const start = Math.max(2, page - 1)
    const end   = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) out.push(i)
    if (page < totalPages - 2) out.push('...')
    out.push(totalPages)
    return out
  }

  const pages = getPages()

  return (
    <div className={cn('flex justify-center items-center gap-1 p-3', className)}>
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 transition"
        aria-label="Previous page"
      >
        <ChevronLeft size={14} />
      </button>
      {pages.map((p, i) => p === '...' ? (
        <span key={`dot-${i}`} className="w-8 h-8 flex items-center justify-center text-[#94A3B8] text-xs">...</span>
      ) : (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'w-8 h-8 rounded-lg text-sm font-medium transition-all',
            page === p ? 'bg-[#2563EB] text-white' : 'text-[#475569] hover:bg-[#F1F5F9]'
          )}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] disabled:opacity-30 transition"
        aria-label="Next page"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
