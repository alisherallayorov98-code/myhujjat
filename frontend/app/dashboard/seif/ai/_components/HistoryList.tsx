'use client'

import { Clock, FileText } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import api      from '@/lib/api'

interface Props {
  history:    any[]
  orgId?:     string
  onSelect:   (content: string, id: string) => void
}

export function HistoryList({ history, orgId, onSelect }: Props) {
  if (history.length === 0) return null

  return (
    <Card>
      <p className="text-sm font-semibold text-[#0F172A] mb-3 flex items-center gap-2">
        <Clock size={14} className="text-[#94A3B8]" />
        Oxirgi generatsiyalar
      </p>
      <div className="space-y-1">
        {history.slice(0, 5).map((h: any) => (
          <button
            key={h.id}
            onClick={async () => {
              const { data } = await api.get(`/ai/docs/${h.id}?orgId=${orgId}`)
              onSelect(data.content, data.id)
            }}
            className="w-full flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-[#F8FAFC] text-left transition-colors"
          >
            <FileText size={13} className="text-[#94A3B8] mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#475569] truncate">{h.title}</p>
              <p className="text-[10px] text-[#94A3B8]">{h.tokensUsed} token</p>
            </div>
          </button>
        ))}
      </div>
    </Card>
  )
}
