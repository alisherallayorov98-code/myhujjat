'use client'

import { useState }                             from 'react'
import { MessageSquare, Send, X }               from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button }                               from '@/components/ui/Button'
import api                                      from '@/lib/api'
import { formatDate }                           from '@/lib/formatters'
import toast                                    from 'react-hot-toast'
import { cn }                                   from '@/lib/cn'

export default function AdminSupportPage() {
  const qc                        = useQueryClient()
  const [selectedId, setSelected] = useState<string | null>(null)
  const [reply,      setReply]    = useState('')

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['admin-support'],
    queryFn:  () => api.get('/admin/support').then(r => r.data),
    refetchInterval: 15_000,
  })

  const replyMut = useMutation({
    mutationFn: () => api.post(`/admin/support/${selectedId}/reply`, { content: reply }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-support'] })
      setReply('')
      toast.success('Yuborildi')
    },
  })

  const closeMut = useMutation({
    mutationFn: (id: string) => api.put(`/admin/support/${id}/close`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-support'] })
      setSelected(null)
      toast.success('Yopildi')
    },
  })

  const selectedSession = (sessions as any[]).find((s: any) => s.id === selectedId)

  return (
    <div className="space-y-4">
      <h2 className="text-white font-bold text-xl">Support</h2>

      <div className="flex gap-4 h-[calc(100vh-200px)]">
        {/* Sessiyalar ro'yxati */}
        <div className="w-72 shrink-0 bg-[#1E293B] rounded-xl border border-[#334155] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-[#334155] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (sessions as any[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-2 p-4">
              <MessageSquare size={24} className="text-[#475569]" />
              <p className="text-[#64748B] text-sm text-center">Ochiq murojaat yo'q</p>
            </div>
          ) : (
            <div className="divide-y divide-[#334155]">
              {(sessions as any[]).map((s: any) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  className={cn(
                    'w-full text-left px-4 py-3 hover:bg-[#334155]/50 transition-colors',
                    selectedId === s.id && 'bg-[#334155]'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm text-white font-medium truncate">
                      {s.userId?.slice(0, 8)}...
                    </p>
                    <span className="text-xs text-[#64748B]">
                      {s._count?.messages ?? 0} xabar
                    </span>
                  </div>
                  <p className="text-xs text-[#94A3B8] truncate">
                    {s.messages?.[0]?.content || 'Xabar yo\'q'}
                  </p>
                  <p className="text-xs text-[#475569] mt-1">
                    {formatDate(s.updatedAt, 'short')}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat paneli */}
        <div className="flex-1 bg-[#1E293B] rounded-xl border border-[#334155] flex flex-col">
          {!selectedSession ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-[#64748B] text-sm">Sessiyani tanlang</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#334155]">
                <p className="text-white text-sm font-medium">
                  Sessiya: {selectedSession.id.slice(0, 12)}...
                </p>
                <Button
                  variant="outline" size="sm"
                  className="border-[#334155] text-[#94A3B8] hover:text-[#F87171]"
                  leftIcon={<X size={13} />}
                  onClick={() => closeMut.mutate(selectedSession.id)}
                  loading={closeMut.isPending}
                >
                  Yopish
                </Button>
              </div>

              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {(selectedSession.messages ?? []).map((m: any) => (
                  <div
                    key={m.id}
                    className={cn(
                      'max-w-[80%] px-3 py-2 rounded-xl text-sm',
                      m.role === 'admin'
                        ? 'ml-auto bg-[#2563EB] text-white'
                        : 'bg-[#334155] text-[#E2E8F0]'
                    )}
                  >
                    {m.content}
                  </div>
                ))}
              </div>

              <div className="flex gap-2 p-4 border-t border-[#334155]">
                <input
                  value={reply}
                  onChange={e => setReply(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && reply && replyMut.mutate()}
                  placeholder="Javob yozing..."
                  className="flex-1 h-9 rounded-lg px-3 text-sm bg-[#0F172A] border border-[#334155] text-white placeholder:text-[#475569] outline-none focus:border-[#2563EB]"
                />
                <Button
                  size="sm"
                  disabled={!reply}
                  loading={replyMut.isPending}
                  onClick={() => replyMut.mutate()}
                  leftIcon={<Send size={13} />}
                >
                  Yuborish
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
