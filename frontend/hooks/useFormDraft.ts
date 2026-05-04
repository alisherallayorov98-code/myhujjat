'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Form ma'lumotlarini localStorage'ga avto-saqlaydi (1 soniya debounce).
 *
 * Foydalanish:
 *   const draft = useFormDraft('contract-new', { form, type, orgEdits })
 *
 *   if (draft.hasDraft) {
 *     // banner ko'rsatamiz
 *     <button onClick={() => {
 *       const saved = draft.restore()
 *       if (saved) {
 *         setForm(saved.form)
 *         setType(saved.type)
 *         setOrgEdits(saved.orgEdits)
 *       }
 *     }}>Tiklash</button>
 *   }
 *
 *   // Form muvaffaqiyatli yuborilganidan keyin:
 *   draft.clear()
 *
 * Hook external state'ga subscribe qiladi — `data` o'zgarganda
 * avtomatik saqlaydi, restore() chaqirilganda saqlangan ma'lumot qaytaradi.
 *
 * MUHIM: hech qachon parol, kart raqami yoki sezgir ma'lumotlarni saqlamang.
 */

const PREFIX      = 'myhujjat:draft:'
const META_PREFIX = 'myhujjat:draft-meta:'
const DEBOUNCE_MS = 1000

interface DraftMeta {
  savedAt: string  // ISO timestamp
}

export interface FormDraft<T> {
  hasDraft:     boolean
  draftSavedAt: string | null
  /** Saqlangan ma'lumotni qaytaradi va banner'ni yashiradi. null bo'lsa, qoralama yo'q. */
  restore:      () => T | null
  /** Qoralamani localStorage'dan o'chiradi (form muvaffaqiyatli yuborilgach). */
  clear:        () => void
  /** Banner'ni yashiradi (foydalanuvchi rad etdi) — qoralama localStorage'da qoladi. */
  dismiss:      () => void
}

export function useFormDraft<T>(key: string, data: T): FormDraft<T> {
  const fullKey  = PREFIX + key
  const metaKey  = META_PREFIX + key

  const [hasDraft, setHasDraft] = useState(false)
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null)
  const timerRef    = useRef<NodeJS.Timeout | null>(null)
  const initialRef  = useRef(true)

  // Mount: tekshirish saqlangan qoralama bor-yo'qligini
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw  = localStorage.getItem(fullKey)
      const meta = localStorage.getItem(metaKey)
      if (raw && meta) {
        setHasDraft(true)
        setDraftSavedAt(JSON.parse(meta).savedAt)
      }
    } catch { /* noop */ }
  }, [fullKey, metaKey])

  // Auto-save: data o'zgarganda debounced saqlash
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Birinchi mount'da saqlamaymiz — boshlang'ich qiymat
    if (initialRef.current) {
      initialRef.current = false
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      try {
        localStorage.setItem(fullKey, JSON.stringify(data))
        const meta: DraftMeta = { savedAt: new Date().toISOString() }
        localStorage.setItem(metaKey, JSON.stringify(meta))
        setDraftSavedAt(meta.savedAt)
      } catch { /* quota exceeded yoki private mode — sukut */ }
    }, DEBOUNCE_MS)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(data)])

  const restore = (): T | null => {
    if (typeof window === 'undefined') return null
    try {
      const raw = localStorage.getItem(fullKey)
      if (!raw) return null
      const restored = JSON.parse(raw) as T
      setHasDraft(false)
      return restored
    } catch {
      return null
    }
  }

  const clear = () => {
    if (typeof window === 'undefined') return
    try {
      localStorage.removeItem(fullKey)
      localStorage.removeItem(metaKey)
      setHasDraft(false)
      setDraftSavedAt(null)
    } catch { /* noop */ }
  }

  const dismiss = () => setHasDraft(false)

  return {
    hasDraft,
    draftSavedAt,
    restore,
    clear,
    dismiss,
  }
}

/** Barcha eski qoralamalarni tozalash (logout vaqtida). */
export function clearAllFormDrafts() {
  if (typeof window === 'undefined') return
  try {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && (k.startsWith(PREFIX) || k.startsWith(META_PREFIX))) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
  } catch { /* noop */ }
}
