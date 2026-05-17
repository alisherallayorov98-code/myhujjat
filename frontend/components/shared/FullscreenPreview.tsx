'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { ChevronLeft, Printer, X, ZoomIn, ZoomOut } from 'lucide-react'

interface Props {
  open:       boolean
  onClose:    () => void
  title?:     string
  /** Oddiy matn ko'rinishi (whitespace-pre-wrap, Times New Roman) */
  content?:   string
  /** HTML ko'rinishi (dangerouslySetInnerHTML) — agar berilsa, content e'tiborsiz qoldiriladi */
  html?:      string
  /** Yuklanish holati — A4 joyida skeleton ko'rsatiladi */
  isLoading?: boolean
  /** Print tugmasini ko'rsatish (default: true) */
  showPrint?: boolean
  /** Print tugmasi yonida qo'shimcha tugmalar (PDF, Word, Save, ...) */
  toolbar?:   React.ReactNode
  /** Bo'sh holatda ko'rsatiladigan matn */
  emptyText?: string
}

const ZOOM_STEPS = [0.5, 0.67, 0.75, 1, 1.25, 1.5, 2]

export function FullscreenPreview({
  open, onClose, title, content, html,
  isLoading = false, showPrint = true, toolbar, emptyText,
}: Props) {
  const [zoom, setZoom] = useState(1)
  const pageRef         = useRef<HTMLDivElement>(null)
  const [pageCount, setPageCount] = useState<number | null>(null)

  const zoomIn  = useCallback(() => setZoom(z => ZOOM_STEPS[Math.min(ZOOM_STEPS.indexOf(z) + 1, ZOOM_STEPS.length - 1)]), [])
  const zoomOut = useCallback(() => setZoom(z => ZOOM_STEPS[Math.max(ZOOM_STEPS.indexOf(z) - 1, 0)]), [])
  const zoomReset = useCallback(() => setZoom(1), [])

  // Esc + Ctrl+/-/0 klaviatura boshqaruvi + scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomIn() }
        if (e.key === '-')                  { e.preventDefault(); zoomOut() }
        if (e.key === '0')                  { e.preventDefault(); zoomReset() }
      }
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose, zoomIn, zoomOut, zoomReset])

  // Mobil: zoom ni ekran kengligiga moslashtirish
  useEffect(() => {
    if (!open) return
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      const fit = Math.max((window.innerWidth - 32) / 794, 0.5)
      const closest = ZOOM_STEPS.reduce((a, b) => Math.abs(b - fit) < Math.abs(a - fit) ? b : a)
      setZoom(closest)
    } else {
      setZoom(1)
    }
  }, [open])

  // Sahifa soni hisoblash (A4 = 1123px)
  useEffect(() => {
    if (!open || isLoading) return
    const timeout = setTimeout(() => {
      if (pageRef.current) {
        const h = pageRef.current.scrollHeight
        setPageCount(Math.ceil(h / 1123))
      }
    }, 300)
    return () => clearTimeout(timeout)
  }, [open, html, content, isLoading])

  if (!open) return null

  const isEmpty = !isLoading && !html && (!content || content.trim().length === 0)

  return (
    <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col print-fullscreen">

      {/* Toolbar — print paytida yashiriladi */}
      <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0 no-print">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm shrink-0"
          title="Orqaga (Esc)"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Orqaga</span>
        </button>

        <div className="h-6 w-px bg-white/10 mx-1 shrink-0" />

        {title && (
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate">{title}</p>
          </div>
        )}

        {/* Zoom boshqaruvi */}
        <div className="flex items-center gap-0.5 bg-white/10 rounded-lg px-1 shrink-0">
          <button
            onClick={zoomOut}
            disabled={zoom === ZOOM_STEPS[0]}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition"
            title="Kichraytirish (Ctrl–)"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={zoomReset}
            className="px-2 py-1 text-xs font-mono hover:bg-white/10 rounded transition min-w-[44px] text-center"
            title="Asl o'lcham (Ctrl+0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={zoomIn}
            disabled={zoom === ZOOM_STEPS[ZOOM_STEPS.length - 1]}
            className="p-1.5 rounded hover:bg-white/10 disabled:opacity-30 transition"
            title="Kattalashtirish (Ctrl+)"
          >
            <ZoomIn size={14} />
          </button>
        </div>

        {pageCount && pageCount > 1 && (
          <span className="text-xs text-white/50 hidden sm:inline shrink-0">
            {pageCount} sahifa
          </span>
        )}

        <div className="flex-1" />

        {toolbar}

        {showPrint && (
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm shrink-0"
            title="Chop etish"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Pechat</span>
          </button>
        )}

        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition shrink-0"
          title="Yopish"
        >
          <X size={16} />
        </button>
      </div>

      {/* A4 hujjat ko'rinishi */}
      <div className="flex-1 overflow-auto">
        <div
          className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12"
          style={{ paddingBottom: zoom > 1 ? `${zoom * 100}px` : undefined }}
        >
          {isLoading ? (
            <div
              className="bg-white shadow-2xl animate-pulse print-document"
              style={{ width: 794, minHeight: 1123, padding: '60px 70px' }}
            >
              <div className="space-y-4">
                <div className="h-6 bg-[#E2E8F0] rounded w-1/2 mx-auto" />
                <div className="h-4 bg-[#E2E8F0] rounded w-1/4 mx-auto" />
                <div className="mt-10 space-y-3">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-3 bg-[#E2E8F0] rounded"
                      style={{ width: `${65 + (i % 4) * 9}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          ) : isEmpty ? (
            <div
              className="bg-white shadow-2xl flex items-center justify-center text-[#94A3B8] text-sm print-document"
              style={{ width: 794, minHeight: 1123 }}
            >
              {emptyText || "Ma'lumotlarni to'ldiring..."}
            </div>
          ) : html ? (
            <div
              ref={pageRef}
              className="bg-white shadow-2xl print-document origin-top"
              style={{
                width:           794,
                minHeight:       1123,
                transform:       `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom:    zoom < 1
                  ? `${(zoom - 1) * 1123}px`
                  : `${(zoom - 1) * 1123}px`,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div
              ref={pageRef}
              className="bg-white shadow-2xl whitespace-pre-wrap print-document origin-top"
              style={{
                width:           794,
                minHeight:       1123,
                fontFamily:      '"Times New Roman", serif',
                fontSize:        14,
                lineHeight:      1.8,
                padding:         '60px 70px',
                transform:       `scale(${zoom})`,
                transformOrigin: 'top center',
                marginBottom:    zoom < 1
                  ? `${(zoom - 1) * 1123}px`
                  : `${(zoom - 1) * 1123}px`,
              }}
            >
              {content}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
