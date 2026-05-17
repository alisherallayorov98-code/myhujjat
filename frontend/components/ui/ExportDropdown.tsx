'use client'

import { useState, useRef, useEffect } from 'react'
import { Download, ChevronDown } from 'lucide-react'
import { Button } from './Button'

export interface ExportOption {
  label:    string
  icon:     React.ReactNode
  onClick:  () => void | Promise<void>
  disabled?: boolean
}

interface Props {
  options:  ExportOption[]
  loading?: boolean
  size?:    'sm' | 'md'
}

export function ExportDropdown({ options, loading = false, size = 'sm' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <Button
        variant="outline"
        size={size}
        loading={loading}
        leftIcon={<Download size={14} />}
        rightIcon={!loading ? <ChevronDown size={12} /> : undefined}
        onClick={() => !loading && setOpen(o => !o)}
      >
        Eksport
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden min-w-[168px]">
          {options.map((opt, i) => (
            <button
              key={i}
              disabled={opt.disabled}
              onClick={async () => {
                setOpen(false)
                await opt.onClick()
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#374151] hover:bg-[#F8FAFC] disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-left"
            >
              <span className="text-[#94A3B8] shrink-0">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
