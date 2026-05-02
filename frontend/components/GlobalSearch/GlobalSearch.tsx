'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTranslations }                          from 'next-intl'
import { useRouter }   from 'next/navigation'
import {
  Search, Building2, Plus, Zap,
  ArrowRight, Clock, X
} from 'lucide-react'
import { useQuery }    from '@tanstack/react-query'
import { useAuth }     from '@/hooks/useAuth'
import api             from '@/lib/api'
import { cn }          from '@/lib/cn'

type ResultItem = {
  id:       string
  type:     string
  title:    string
  subtitle: string
  url:      string
  icon:     string
}

type SearchResults = {
  contracts:      ResultItem[]
  counterparties: ResultItem[]
  employees:      ResultItem[]
  total:          number
}

export function GlobalSearch() {
  const t = useTranslations('globalSearch')
  const router         = useRouter()
  const { currentOrg } = useAuth()
  const [open,    setOpen]    = useState(false)
  const [query,   setQuery]   = useState('')
  const [focused, setFocused] = useState(0)
  const inputRef   = useRef<HTMLInputElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const QUICK_ACTIONS = [
    { id: 'new-contract', label: t('actionNewContract'),     icon: Plus,      url: '/dashboard/shartnomalar/yangi',   shortcut: 'N' },
    { id: 'new-cp',       label: t('actionNewCounterparty'), icon: Building2, url: '/dashboard/kontragentlar?new=1',  shortcut: 'K' },
    { id: 'ai-doc',       label: t('actionAiDoc'),           icon: Zap,       url: '/dashboard/ai',                   shortcut: 'A' },
  ]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        setQuery('')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    } else {
      setQuery('')
      setFocused(0)
    }
  }, [open])

  const { data: results, isFetching } = useQuery<SearchResults | null>({
    queryKey: ['global-search', currentOrg?.id, query],
    queryFn:  async () => {
      if (!query || query.length < 2 || !currentOrg?.id) return null
      const { data } = await api.get(
        `/search?orgId=${currentOrg.id}&q=${encodeURIComponent(query)}`
      )
      return data
    },
    enabled:       open && query.length >= 2,
    staleTime:     10_000,
  })

  const [recent, setRecent] = useState<string[]>([])
  useEffect(() => {
    if (!open) return
    try {
      const saved = localStorage.getItem('myhujjat_recent_searches')
      if (saved) setRecent(JSON.parse(saved).slice(0, 5))
    } catch {}
  }, [open])

  const saveRecent = (title: string) => {
    if (!title.trim()) return
    const updated = [title, ...recent.filter(r => r !== title)].slice(0, 5)
    setRecent(updated)
    localStorage.setItem('myhujjat_recent_searches', JSON.stringify(updated))
  }

  const allItems: ResultItem[] = [
    ...(results?.contracts      || []),
    ...(results?.counterparties || []),
    ...(results?.employees      || []),
  ]

  const showQuickActions = query.length === 0
  const showResults      = query.length >= 2 && !!results

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const max = showQuickActions ? QUICK_ACTIONS.length - 1 : Math.max(0, allItems.length - 1)
        setFocused(f => Math.min(f + 1, max))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocused(f => Math.max(f - 1, 0))
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        const item = showQuickActions ? QUICK_ACTIONS[focused] : allItems[focused]
        if (item) handleSelect(item)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, focused, showQuickActions, allItems])

  const handleSelect = useCallback((item: { url: string; title?: string; label?: string }) => {
    const title = item.title || item.label || ''
    if (title) saveRecent(title)
    router.push(item.url)
    setOpen(false)
  }, [router, recent])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg bg-[#F1F5F9] border border-[#E2E8F0] hover:border-[#CBD5E1] transition-all text-sm text-[#94A3B8] min-w-[200px]"
      >
        <Search size={14} />
        <span className="flex-1 text-left">{t('triggerPlaceholder')}</span>
        <kbd className="text-[10px] bg-white border border-[#E2E8F0] rounded px-1.5 py-0.5">
          Ctrl K
        </kbd>
      </button>
    )
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 px-4"
      onClick={e => { if (e.target === overlayRef.current) setOpen(false) }}
    >
      <div className="absolute inset-0 bg-[#0F172A]/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#E2E8F0]">
          {isFetching
            ? <div className="w-4 h-4 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin shrink-0" />
            : <Search size={16} className="text-[#94A3B8] shrink-0" />
          }
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setFocused(0) }}
            placeholder={t('inputPlaceholder')}
            className="flex-1 outline-none text-sm text-[#0F172A] placeholder:text-[#94A3B8]"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#94A3B8] hover:text-[#475569]">
              <X size={14} />
            </button>
          )}
          <kbd className="text-[10px] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[#94A3B8]">
            ESC
          </kbd>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {showQuickActions && (
            <div className="py-2">
              {recent.length > 0 && (
                <div className="mb-2">
                  <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                    {t('recentSearches')}
                  </p>
                  {recent.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => setQuery(r)}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-[#F8FAFC] text-left"
                    >
                      <Clock size={14} className="text-[#94A3B8] shrink-0" />
                      <span className="text-sm text-[#475569]">{r}</span>
                    </button>
                  ))}
                </div>
              )}

              <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                {t('quickActions')}
              </p>
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={action.id}
                  onClick={() => handleSelect(action)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                    focused === i ? 'bg-[#DBEAFE]/50' : 'hover:bg-[#F8FAFC]'
                  )}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
                    <action.icon size={15} className="text-[#475569]" />
                  </div>
                  <span className="flex-1 text-sm text-[#0F172A]">{action.label}</span>
                  <kbd className="text-[10px] bg-[#F1F5F9] border border-[#E2E8F0] rounded px-1.5 py-0.5 text-[#94A3B8]">
                    {action.shortcut}
                  </kbd>
                </button>
              ))}
            </div>
          )}

          {showResults && (
            <div className="py-2">
              {results!.total === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-sm text-[#94A3B8]">{t('noResults', { query })}</p>
                </div>
              ) : (
                <>
                  {results!.contracts.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        {t('groupContracts')}
                      </p>
                      {results!.contracts.map((item, i) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          focused={focused === i}
                          onSelect={() => handleSelect(item)}
                        />
                      ))}
                    </div>
                  )}

                  {results!.counterparties.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        {t('groupCounterparties')}
                      </p>
                      {results!.counterparties.map((item, i) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          focused={focused === results!.contracts.length + i}
                          onSelect={() => handleSelect(item)}
                        />
                      ))}
                    </div>
                  )}

                  {results!.employees.length > 0 && (
                    <div>
                      <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                        {t('groupEmployees')}
                      </p>
                      {results!.employees.map((item, i) => (
                        <ResultRow
                          key={item.id}
                          item={item}
                          focused={focused === results!.contracts.length + results!.counterparties.length + i}
                          onSelect={() => handleSelect(item)}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {query.length === 1 && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm text-[#94A3B8]">{t('minChars')}</p>
            </div>
          )}
        </div>

        <div className="px-4 py-2.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-4 text-[10px] text-[#94A3B8]">
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-[#E2E8F0] rounded px-1">↑↓</kbd> {t('footerNav')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-[#E2E8F0] rounded px-1">Enter</kbd> {t('footerSelect')}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="bg-white border border-[#E2E8F0] rounded px-1">Esc</kbd> {t('footerClose')}
          </span>
        </div>
      </div>
    </div>
  )
}

function ResultRow({
  item, focused, onSelect,
}: {
  item:     ResultItem
  focused:  boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors group',
        focused ? 'bg-[#DBEAFE]/50' : 'hover:bg-[#F8FAFC]'
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0 text-base">
        {item.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#0F172A] truncate">{item.title}</p>
        {item.subtitle && (
          <p className="text-xs text-[#94A3B8] truncate">{item.subtitle}</p>
        )}
      </div>
      <ArrowRight size={13} className="text-[#94A3B8] opacity-0 group-hover:opacity-100 shrink-0" />
    </button>
  )
}
