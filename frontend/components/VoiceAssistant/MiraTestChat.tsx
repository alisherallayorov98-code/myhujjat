'use client'

import { useState, useRef, useEffect } from 'react'
import { Bot, Send, Trash2, Loader2, Sparkles } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useAuth } from '@/hooks/useAuth'
import { currentLocale } from '@/lib/formatters'
import api from '@/lib/api'
import { cn } from '@/lib/cn'

interface TestMessage {
  role: 'user' | 'assistant'
  text: string
}

const MAX_MESSAGES = 10

export function MiraTestChat() {
  const t = useTranslations('mira')
  const { currentOrg } = useAuth()

  const [messages,  setMessages]  = useState<TestMessage[]>([])
  const [input,     setInput]     = useState('')
  const [loading,   setLoading]   = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function send() {
    const txt = input.trim()
    if (!txt || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text: txt }])
    setLoading(true)
    try {
      const { data } = await api.post('/voice/command', {
        text:       txt,
        orgId:      currentOrg?.id,
        targetLang: currentLocale(),
        testMode:   true,
      })
      setMessages(m => [...m, { role: 'assistant', text: data.response || t('testFallback') }])
    } catch (err: any) {
      const msg = err?.response?.data?.message || t('testError')
      setMessages(m => [...m, { role: 'assistant', text: `❌ ${msg}` }])
    } finally {
      setLoading(false)
    }
  }

  const isAtLimit = messages.length >= MAX_MESSAGES

  return (
    <div className="border border-[#E2E8F0] rounded-xl overflow-hidden bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-[#EDE9FE] to-[#DBEAFE] border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#7C3AED]" />
          <p className="text-xs font-semibold text-[#4C1D95]">{t('testTitle')}</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="flex items-center gap-1 text-[10px] text-[#94A3B8] hover:text-[#DC2626] transition"
          >
            <Trash2 size={11} />
            {t('testClear')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="h-48 overflow-y-auto p-3 space-y-2 bg-[#F8FAFC]">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <Bot size={24} className="text-[#CBD5E1]" />
            <p className="text-xs text-[#94A3B8] text-center">{t('testEmpty')}</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed',
              m.role === 'user'
                ? 'bg-[#2563EB] text-white rounded-br-sm'
                : 'bg-white border border-[#E2E8F0] text-[#0F172A] rounded-bl-sm'
            )}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-[#E2E8F0] rounded-xl rounded-bl-sm px-3 py-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-[#E2E8F0] bg-white">
        {isAtLimit ? (
          <p className="flex-1 text-xs text-[#94A3B8] text-center">{t('testLimitReached')}</p>
        ) : (
          <>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send() }}
              placeholder={t('testPlaceholder')}
              disabled={loading}
              className="flex-1 text-xs px-3 h-8 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED]/20 disabled:opacity-60"
            />
            <button
              onClick={send}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-lg bg-[#7C3AED] text-white flex items-center justify-center hover:bg-[#6D28D9] disabled:opacity-40 disabled:cursor-not-allowed transition shrink-0"
            >
              {loading
                ? <Loader2 size={13} className="animate-spin" />
                : <Send size={13} />
              }
            </button>
          </>
        )}
      </div>
    </div>
  )
}
