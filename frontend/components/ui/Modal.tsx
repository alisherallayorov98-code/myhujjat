'use client'

import { useEffect, useCallback } from 'react'
import { useTranslations }        from 'next-intl'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

interface ModalProps {
  open:         boolean
  onClose:      () => void
  title?:       string
  description?: string
  size?:        'sm' | 'md' | 'lg' | 'xl' | 'full'
  children:     React.ReactNode
  footer?:      React.ReactNode
  closable?:    boolean
}

const sizes = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[95vw]',
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size     = 'md',
  children,
  footer,
  closable = true,
}: ModalProps) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closable) onClose()
  }, [onClose, closable])

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={closable ? onClose : undefined}
      />

      <div className={cn(
        'relative z-10 w-full bg-white rounded-2xl',
        'shadow-[0_20px_60px_rgba(0,0,0,0.15)]',
        'animate-scale-in overflow-hidden',
        sizes[size]
      )}>
        {(title || closable) && (
          <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-[#E2E8F0]">
            <div>
              {title && (
                <h2 className="font-display font-bold text-[#0F172A] text-lg">{title}</h2>
              )}
              {description && (
                <p className="text-sm text-[#94A3B8] mt-0.5">{description}</p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors ml-4 shrink-0"
              >
                <X size={18} />
              </button>
            )}
          </div>
        )}

        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC]">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// TASDIQLASH DIALOGI
// ============================================
interface ConfirmDialogProps {
  open:         boolean
  onClose:      () => void
  onConfirm:    () => void
  title:        string
  description?: string
  confirmText?: string
  cancelText?:  string
  variant?:     'danger' | 'warning' | 'primary'
  loading?:     boolean
}

export function ConfirmDialog({
  open, onClose, onConfirm,
  title, description,
  confirmText,
  cancelText,
  variant     = 'danger',
  loading     = false,
}: ConfirmDialogProps) {
  const t = useTranslations('ui')
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            {cancelText ?? t('cancel')}
          </Button>
          <Button variant={variant} size="sm" loading={loading} onClick={onConfirm}>
            {confirmText ?? t('confirm')}
          </Button>
        </>
      }
    >
      <div className="py-2">
        <h3 className="font-display font-bold text-[#0F172A] text-base mb-2">{title}</h3>
        {description && (
          <p className="text-sm text-[#475569] leading-relaxed">{description}</p>
        )}
      </div>
    </Modal>
  )
}
