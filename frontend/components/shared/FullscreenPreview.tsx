'use client'

// Hujjat ko'rinishini A4 o'lchamida to'liq ekranda ko'rsatadigan komponent.
// Kabinetim.uz uslubidagi shartnoma yaratish sahifasidagi ko'rinish — bu yerda
// umumlashtirildi va loyiha bo'yicha qayta foydalaniladi.
//
// Foydalanish:
//   {open && (
//     <FullscreenPreview
//       open={open}
//       onClose={() => setOpen(false)}
//       title="Faktura ko'rinishi"
//       content={previewText}    // pre-wrap matn
//       // yoki
//       html={previewHtml}        // HTML string (sanitized)
//       toolbar={<>...qo'shimcha tugmalar...</>}
//     />
//   )

import { useEffect } from 'react'
import { ChevronLeft, Printer, X } from 'lucide-react'

interface Props {
  open:     boolean
  onClose:  () => void
  title?:   string
  /** Oddiy matn ko'rinishi (whitespace-pre-wrap, Times New Roman) */
  content?: string
  /** HTML ko'rinishi (dangerouslySetInnerHTML) — agar berilsa, content e'tiborsiz qoldiriladi */
  html?:    string
  /** Print tugmasini ko'rsatish (default: true) */
  showPrint?: boolean
  /** Print tugmasi yonida qo'shimcha tugmalar (PDF, Word, Save, ...) */
  toolbar?: React.ReactNode
  /** Bo'sh holatda ko'rsatiladigan matn */
  emptyText?: string
}

export function FullscreenPreview({
  open, onClose, title, content, html,
  showPrint = true, toolbar, emptyText,
}: Props) {

  // Esc tugmasi orqali yopish + scroll lock
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  if (!open) return null

  const isEmpty = !html && (!content || content.trim().length === 0)

  return (
    <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col print-fullscreen">
      {/* Toolbar — print qilinganda yashiriladi */}
      <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0 no-print">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
          title="Orqaga (Esc)"
        >
          <ChevronLeft size={16} />
          <span className="hidden sm:inline">Orqaga</span>
        </button>
        <div className="h-6 w-px bg-white/10 mx-1" />
        {title && (
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{title}</p>
          </div>
        )}
        <div className="flex-1" />
        {toolbar}
        {showPrint && (
          <button
            onClick={() => window.print()}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
          >
            <Printer size={14} />
            <span className="hidden sm:inline">Pechat</span>
          </button>
        )}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-white/10 transition"
          title="Yopish"
        >
          <X size={16} />
        </button>
      </div>

      {/* A4 hujjat ko'rinishi */}
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
          {isEmpty ? (
            <div
              className="bg-white shadow-2xl flex items-center justify-center text-[#94A3B8] text-sm print-document"
              style={{ width: '794px', minHeight: '1123px' }}
            >
              {emptyText || "Ma'lumotlarni to'ldiring..."}
            </div>
          ) : html ? (
            <div
              className="bg-white shadow-2xl print-document"
              style={{ width: '794px', minHeight: '1123px' }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div
              className="bg-white shadow-2xl whitespace-pre-wrap print-document"
              style={{
                width:      '794px',
                minHeight:  '1123px',
                fontFamily: '"Times New Roman", serif',
                fontSize:   14,
                lineHeight: 1.8,
                padding:    '60px 70px',
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
