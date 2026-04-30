'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api  from '@/lib/api'
import { cn } from '@/lib/cn'

export function SupportChat() {
  const [open,    setOpen]    = useState(false)
  const [message, setMessage] = useState('')
  const qc        = useQueryClient()
  const bottomRef = useRef<HTMLDivElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['support-messages'],
    queryFn:  async () => {
      const { data } = await api.get('/support/my')
      return data
    },
    enabled:         open,
    refetchInterval: open ? 5000 : false,
  })

  const sendMutation = useMutation({
    mutationFn: (content: string) => api.post('/support/my/send', { content }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['support-messages'] })
      setMessage('')
    },
  })

  useEffect(() => {
    if (open) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }
  }, [data?.messages, open])

  const messages = data?.messages || []

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed || sendMutation.isPending) return
    sendMutation.mutate(trimmed)
  }

  return (
    <>
      {/* Trigger tugma */}
      <button
        onClick={() => setOpen(o => !o)}
        className={cn(
          'fixed bottom-20 md:bottom-6 right-4 md:right-6 z-40 w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all',
          open ? 'bg-[#475569] hover:bg-[#334155]' : 'bg-[#2563EB] hover:bg-[#1D4ED8]'
        )}
        aria-label="Qo'llab-quvvatlash"
      >
        {open
          ? <X size={20} className="text-white" />
          : <MessageCircle size={20} className="text-white" />
        }
      </button>

      {/* Chat oynasi */}
      {open && (
        <div
          className="fixed bottom-36 md:bottom-24 right-4 md:right-6 z-40 w-80 bg-white rounded-2xl shadow-2xl border border-[#E2E8F0] overflow-hidden flex flex-col"
          style={{ height: '420px' }}
        >
          {/* Header */}
          <div className="bg-[#2563EB] px-4 py-3 shrink-0">
            <p className="text-white font-semibold text-sm">Qo'llab-quvvatlash</p>
            <p className="text-blue-100 text-xs">Odatda 1–2 soat ichida javob</p>
          </div>

          {/* Xabarlar */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scroll-touch">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 size={18} className="animate-spin text-[#94A3B8]" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageCircle size={28} className="text-[#CBD5E1] mb-2" />
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  Savolingizni yozing, tez orada javob beramiz!
                </p>
              </div>
            ) : (
              messages.map((msg: any) => (
                <div
                  key={msg.id}
                  className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                >
                  <div className={cn(
                    'max-w-[78%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-[#2563EB] text-white rounded-br-sm'
                      : 'bg-[#F1F5F9] text-[#0F172A] rounded-bl-sm'
                  )}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-[#E2E8F0] flex gap-2 shrink-0">
            <input
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Xabar yozing..."
              className="flex-1 text-sm border border-[#E2E8F0] rounded-lg px-3 py-2 outline-none focus:border-[#2563EB] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
              className="w-9 h-9 rounded-lg bg-[#2563EB] disabled:opacity-40 flex items-center justify-center shrink-0 hover:bg-[#1D4ED8] transition-colors"
            >
              {sendMutation.isPending
                ? <Loader2 size={14} className="animate-spin text-white" />
                : <Send size={14} className="text-white" />
              }
            </button>
          </div>
        </div>
      )}
    </>
  )
}
