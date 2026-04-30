'use client'

import { useState }                             from 'react'
import { Plus, Trash2 }                         from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Button }                               from '@/components/ui/Button'
import { Input }                                from '@/components/ui/Input'
import api                                      from '@/lib/api'
import { formatDate }                           from '@/lib/formatters'
import toast                                    from 'react-hot-toast'

export default function AdminAnnouncementsPage() {
  const qc              = useQueryClient()
  const [title,   setTitle]   = useState('')
  const [content, setContent] = useState('')

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn:  () => api.get('/admin/announcements').then(r => r.data),
  })

  const createMut = useMutation({
    mutationFn: () => api.post('/admin/announcements', { title, content }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      setTitle('')
      setContent('')
      toast.success("E'lon yaratildi")
    },
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/announcements/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-announcements'] })
      toast.success("O'chirildi")
    },
  })

  return (
    <div className="space-y-6">
      <h2 className="text-white font-bold text-xl">E'lonlar</h2>

      {/* Yaratish formasi */}
      <div className="bg-[#1E293B] rounded-xl p-5 border border-[#334155] space-y-3">
        <h3 className="text-white font-semibold text-sm">Yangi e'lon</h3>
        <Input
          placeholder="Sarlavha..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="bg-[#0F172A] border-[#334155] text-white placeholder:text-[#475569]"
        />
        <textarea
          placeholder="Matn..."
          value={content}
          onChange={e => setContent(e.target.value)}
          rows={4}
          className="w-full rounded-lg px-3 py-2 text-sm bg-[#0F172A] border border-[#334155] text-white placeholder:text-[#475569] outline-none focus:border-[#2563EB] resize-none"
        />
        <Button
          size="sm"
          leftIcon={<Plus size={14} />}
          loading={createMut.isPending}
          disabled={!title || !content}
          onClick={() => createMut.mutate()}
        >
          Yaratish
        </Button>
      </div>

      {/* Ro'yxat */}
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-[#1E293B] rounded-xl h-24 animate-pulse border border-[#334155]" />
          ))
        ) : (announcements as any[]).length === 0 ? (
          <p className="text-[#64748B] text-sm text-center py-8">E'lonlar yo'q</p>
        ) : (
          (announcements as any[]).map((a: any) => (
            <div key={a.id} className="bg-[#1E293B] rounded-xl p-4 border border-[#334155]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold text-sm">{a.title}</p>
                  <p className="text-[#94A3B8] text-xs mt-1 line-clamp-2">{a.content}</p>
                  <p className="text-[#64748B] text-xs mt-2">{formatDate(a.createdAt, 'short')}</p>
                </div>
                <button
                  onClick={() => deleteMut.mutate(a.id)}
                  className="p-1.5 rounded text-[#64748B] hover:text-[#F87171] hover:bg-[#DC2626]/20 transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
