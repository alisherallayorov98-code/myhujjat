'use client'

import { useEffect } from 'react'

/**
 * Keyboard shortcut hook (power users uchun).
 *
 * Foydalanish:
 *   useKeyboardShortcut('mod+n', () => router.push('/dashboard/shartnomalar/yangi'))
 *   useKeyboardShortcut('mod+f', () => searchInputRef.current?.focus())
 *   useKeyboardShortcut('escape', () => setModalOpen(false))
 *
 * "mod" — Mac'da Cmd, Windows/Linux'da Ctrl.
 *
 * Shortcut input/textarea'da yozayotganda IGNORE qilinadi (foydalanuvchining
 * yozishini buzmaslik uchun), faqat Escape istisno.
 */

type Modifier = 'mod' | 'ctrl' | 'meta' | 'alt' | 'shift'
type Key = string

interface ParsedShortcut {
  key:    Key
  ctrl:   boolean
  meta:   boolean
  alt:    boolean
  shift:  boolean
  useMod: boolean
}

function parse(shortcut: string): ParsedShortcut {
  const parts = shortcut.toLowerCase().split('+').map(s => s.trim())
  const key   = parts.pop() || ''
  return {
    key,
    ctrl:   parts.includes('ctrl'),
    meta:   parts.includes('meta'),
    alt:    parts.includes('alt'),
    shift:  parts.includes('shift'),
    useMod: parts.includes('mod'),
  }
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false
  const tag = target.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

export function useKeyboardShortcut(shortcut: string, handler: (e: KeyboardEvent) => void) {
  useEffect(() => {
    const parsed = parse(shortcut)
    const isMac  = typeof navigator !== 'undefined' && /mac/i.test(navigator.platform)

    function onKey(e: KeyboardEvent) {
      const k = e.key.toLowerCase()
      // Escape — input ichida ham ishlasin
      if (parsed.key === 'escape' && k === 'escape') {
        e.preventDefault()
        handler(e)
        return
      }
      // Form'da yozayotgan bo'lsa — chetlash
      if (isTypingTarget(e.target)) return

      // Modifier tekshirish
      if (parsed.useMod) {
        const wantMod = isMac ? e.metaKey : e.ctrlKey
        if (!wantMod) return
      } else {
        if (parsed.ctrl  !== e.ctrlKey)  return
        if (parsed.meta  !== e.metaKey)  return
      }
      if (parsed.alt   !== e.altKey)   return
      if (parsed.shift !== e.shiftKey) return

      if (k === parsed.key) {
        e.preventDefault()
        handler(e)
      }
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [shortcut, handler])
}
