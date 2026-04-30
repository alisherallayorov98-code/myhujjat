'use client'

import { useState, useEffect } from 'react'
import Link                    from 'next/link'
import {
  CheckCircle2, Circle, Building2, Users,
  FileText, Download, X, Sparkles, ArrowRight,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import api          from '@/lib/api'
import { cn }       from '@/lib/cn'
import { Card }     from '@/components/ui/Card'
import { Button }   from '@/components/ui/Button'

const DISMISS_KEY    = 'onboarding_dismissed'
const DOWNLOADED_KEY = 'onboarding_downloaded'

type Step = {
  id:    string
  icon:  any
  label: string
  desc:  string
  done:  boolean
  href?: string
  cta?:  string
}

export function OnboardingChecklist() {
  const { user, currentOrg, organizations } = useAuth()
  const [dismissed,  setDismissed]  = useState(true)
  const [downloaded, setDownloaded] = useState(false)
  const [collapsed,  setCollapsed]  = useState(false)

  // localStorage state
  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === '1')
    setDownloaded(localStorage.getItem(DOWNLOADED_KEY) === '1')
  }, [])

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const { data: contractsStats } = useQuery<{ total: number }>({
    queryKey: ['contracts-stats', currentOrg?.id],
    queryFn:  () => api.get(`/contracts/stats/${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const steps: Step[] = [
    {
      id:    'org',
      icon:  Building2,
      label: 'Tashkilotingizni qo\'shing',
      desc:  'STIR orqali avtomatik to\'ldiring',
      done:  organizations.length > 0,
      href:  '/dashboard/tashkilotlar',
      cta:   "Tashkilot qo'shish",
    },
    {
      id:    'cp',
      icon:  Users,
      label: 'Birinchi kontragentni qo\'shing',
      desc:  "Hamkor yoki mijoz ma'lumotlari",
      done:  cps.length > 0,
      href:  '/dashboard/kontragentlar',
      cta:   "Kontragent qo'shish",
    },
    {
      id:    'contract',
      icon:  FileText,
      label: 'Birinchi shartnomani yarating',
      desc:  '12 ta shartnoma turidan birini tanlang',
      done:  (contractsStats?.total ?? 0) > 0,
      href:  '/dashboard/shartnomalar/yangi',
      cta:   'Shartnoma yaratish',
    },
    {
      id:    'download',
      icon:  Download,
      label: 'Hujjatni yuklab oling',
      desc:  "PDF yoki Word formatida",
      done:  downloaded,
      href:  '/dashboard/shartnomalar',
      cta:   'Hujjatni ochish',
    },
  ]

  const doneCount = steps.filter(s => s.done).length
  const allDone   = doneCount === steps.length
  const progress  = Math.round((doneCount / steps.length) * 100)

  // Auto-detect download (when user navigates to detail page and downloads)
  useEffect(() => {
    function onDownload() {
      localStorage.setItem(DOWNLOADED_KEY, '1')
      setDownloaded(true)
    }
    window.addEventListener('contract-downloaded', onDownload)
    return () => window.removeEventListener('contract-downloaded', onDownload)
  }, [])

  if (dismissed) return null
  if (!user)     return null
  if (allDone) {
    // Auto-mark as dismissed after completion
    return (
      <Card className="mb-6 bg-gradient-to-br from-[#DCFCE7] to-[#F0FDF4] border-[#BBF7D0]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#16A34A] flex items-center justify-center shrink-0">
            <Sparkles size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-bold text-[#15803D] text-base">Tabriklaymiz! 🎉</h3>
            <p className="text-sm text-[#166534] mt-0.5">
              Siz boshlash uchun barcha qadamlarni bajardingiz. Endi MyHujjat.uz dan to'liq foydalaning.
            </p>
          </div>
          <button
            onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) }}
            className="p-2 rounded-lg text-[#15803D] hover:bg-[#BBF7D0] transition shrink-0"
            aria-label="Yopish"
          >
            <X size={16} />
          </button>
        </div>
      </Card>
    )
  }

  return (
    <Card padding="none" className="mb-6 overflow-hidden border-[#DBEAFE]">
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-[#DBEAFE] to-[#EDE9FE] border-b border-[#BFDBFE]">
        <button
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-3 flex-1 text-left"
        >
          <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0">
            <Sparkles size={16} className="text-[#2563EB]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-[#0F172A] text-sm">Boshlash bo'yicha yo'l-yo'riq</h3>
            <p className="text-xs text-[#475569] mt-0.5">{doneCount}/{steps.length} qadam bajarildi</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-24 h-1.5 bg-white/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#2563EB] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-[#2563EB] w-9 text-right">{progress}%</span>
          </div>
        </button>
        <button
          onClick={() => { localStorage.setItem(DISMISS_KEY, '1'); setDismissed(true) }}
          className="ml-3 p-1.5 rounded-lg text-[#475569] hover:bg-white/60 transition shrink-0"
          aria-label="Yopish"
          title="Bekor qilish"
        >
          <X size={14} />
        </button>
      </div>

      {!collapsed && (
        <div className="divide-y divide-[#F1F5F9]">
          {steps.map((s, i) => {
            const isNext = !s.done && steps.slice(0, i).every(x => x.done)
            return (
              <div
                key={s.id}
                className={cn(
                  'flex items-center gap-3 px-5 py-3.5 transition',
                  s.done && 'bg-[#F0FDF4]/40',
                  isNext && 'bg-[#FFFBEB]/40',
                )}
              >
                <div className="shrink-0">
                  {s.done
                    ? <CheckCircle2 size={20} className="text-[#16A34A]" />
                    : <Circle       size={20} className={isNext ? 'text-[#2563EB]' : 'text-[#CBD5E1]'} />
                  }
                </div>
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                  s.done  ? 'bg-[#DCFCE7]' :
                  isNext  ? 'bg-[#DBEAFE]' : 'bg-[#F1F5F9]',
                )}>
                  <s.icon size={14} className={cn(
                    s.done  ? 'text-[#16A34A]' :
                    isNext  ? 'text-[#2563EB]' : 'text-[#94A3B8]',
                  )} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    'text-sm font-medium',
                    s.done ? 'text-[#15803D] line-through decoration-[#86EFAC]' : 'text-[#0F172A]'
                  )}>
                    {s.label}
                  </p>
                  <p className="text-xs text-[#94A3B8] mt-0.5">{s.desc}</p>
                </div>
                {!s.done && s.href && (
                  <Link href={s.href} className="shrink-0">
                    <Button
                      size="sm"
                      variant={isNext ? 'primary' : 'outline'}
                      rightIcon={<ArrowRight size={12} />}
                    >
                      {s.cta}
                    </Button>
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
