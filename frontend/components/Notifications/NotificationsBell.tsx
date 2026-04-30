'use client'

import { useState, useEffect, useRef } from 'react'
import Link                            from 'next/link'
import {
  Bell, Check, X, FileText, Clock,
  CreditCard, Sparkles, AlertCircle,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { cn } from '@/lib/cn'

interface Notification {
  id:             string
  type:           string
  title:          string
  message:        string
  link?:          string
  read:           boolean
  createdAt:      string
  organizationId?: string
}

interface NotificationsResponse {
  items:       Notification[]
  unreadCount: number
}

const TYPE_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  CONTRACT_CREATED:       { icon: FileText,    color: 'text-[#2563EB]', bg: 'bg-[#DBEAFE]' },
  CONTRACT_EXPIRING:      { icon: Clock,       color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' },
  CONTRACT_SIGNED:        { icon: Check,       color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]' },
  SUBSCRIPTION_EXPIRING:  { icon: Clock,       color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' },
  SUBSCRIPTION_ACTIVATED: { icon: CreditCard,  color: 'text-[#16A34A]', bg: 'bg-[#DCFCE7]' },
  CONTRACT_LIMIT:         { icon: AlertCircle, color: 'text-[#DC2626]', bg: 'bg-[#FEE2E2]' },
  SYSTEM:                 { icon: Bell,        color: 'text-[#475569]', bg: 'bg-[#F1F5F9]' },
  WELCOME:                { icon: Sparkles,    color: 'text-[#7C3AED]', bg: 'bg-[#EDE9FE]' },
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const min  = Math.floor(diff / 60000)
  const hr   = Math.floor(min / 60)
  const day  = Math.floor(hr / 24)
  if (min < 1)   return 'hozir'
  if (min < 60)  return `${min} daqiqa`
  if (hr < 24)   return `${hr} soat`
  if (day < 7)   return `${day} kun`
  return new Date(iso).toLocaleDateString('uz-UZ')
}

export function NotificationsBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const qc  = useQueryClient()

  const { data } = useQuery<NotificationsResponse>({
    queryKey: ['notifications'],
    queryFn:  () => api.get('/notifications?limit=10').then(r => r.data),
    refetchInterval: 60_000, // har 1 daqiqada yangilab turish
  })

  const markRead = useMutation({
    mutationFn: (id: string) => api.put(`/notifications/${id}/read`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const removeNotif = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const items       = data?.items ?? []
  const unreadCount = data?.unreadCount ?? 0

  function handleClick(n: Notification) {
    if (!n.read) markRead.mutate(n.id)
    if (n.link) setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-lg text-[#94A3B8] hover:bg-[#F1F5F9] transition-colors"
        aria-label="Bildirishnomalar"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-96 max-w-[calc(100vw-2rem)] bg-white border border-[#E2E8F0] rounded-xl shadow-xl z-30 overflow-hidden animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
            <div>
              <p className="text-sm font-semibold text-[#0F172A]">Bildirishnomalar</p>
              {unreadCount > 0 && (
                <p className="text-xs text-[#94A3B8]">{unreadCount} ta o'qilmagan</p>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllRead.mutate()}
                disabled={markAllRead.isPending}
                className="text-xs text-[#2563EB] hover:underline font-medium"
              >
                Hammasini o'qildi
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={28} className="mx-auto text-[#CBD5E1] mb-2" />
                <p className="text-sm text-[#94A3B8]">Bildirishnoma yo'q</p>
              </div>
            ) : (
              <div className="divide-y divide-[#F1F5F9]">
                {items.map(n => {
                  const cfg = TYPE_CONFIG[n.type] ?? TYPE_CONFIG.SYSTEM
                  const Inner = (
                    <div className={cn(
                      'flex items-start gap-3 px-4 py-3 transition group',
                      !n.read && 'bg-[#F0F9FF]',
                      'hover:bg-[#F8FAFC]',
                    )}>
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', cfg.bg)}>
                        <cfg.icon size={14} className={cfg.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <p className={cn('text-sm', !n.read ? 'font-semibold text-[#0F172A]' : 'text-[#475569]')}>
                            {n.title}
                          </p>
                          {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-[#94A3B8] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[11px] text-[#CBD5E1] mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeNotif.mutate(n.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#CBD5E1] hover:text-[#DC2626] transition shrink-0"
                        aria-label="O'chirish"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )
                  return n.link ? (
                    <Link key={n.id} href={n.link} onClick={() => handleClick(n)} className="block">
                      {Inner}
                    </Link>
                  ) : (
                    <div key={n.id} onClick={() => handleClick(n)} className="cursor-pointer">
                      {Inner}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
