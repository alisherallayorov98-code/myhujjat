'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon }           from 'lucide-react'
import { useTheme }            from 'next-themes'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Hydration mismatch'ni oldini olish
    return <div className="w-9 h-9" />
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="w-9 h-9 flex items-center justify-center rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A] transition-colors"
      title={isDark ? 'Yorqin rejim' : "Qorong'i rejim"}
      aria-label={isDark ? 'Yorqin rejim' : "Qorong'i rejim"}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  )
}
