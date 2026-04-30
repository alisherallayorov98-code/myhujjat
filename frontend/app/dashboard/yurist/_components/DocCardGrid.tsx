'use client'

import { AlertTriangle, Gavel, FileCheck, Handshake, ArrowRight, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface YuristDoc {
  id:    string
  name:  string
  icon:  LucideIcon
  color: string
  bg:    string
  desc:  string
}

export const YURIST_DOCS: YuristDoc[] = [
  {
    id:    'pretenziya',
    name:  'Pretenziya',
    icon:  AlertTriangle,
    color: 'text-[#D97706]',
    bg:    'bg-[#FEF3C7]',
    desc:  'Qarz yoki majburiyat bajarilmaganligi haqida rasmiy xat',
  },
  {
    id:    'davo_ariza',
    name:  "Da'vo arizasi",
    icon:  Gavel,
    color: 'text-[#DC2626]',
    bg:    'bg-[#FEE2E2]',
    desc:  "Iqtisodiy sudga da'vo arizasi",
  },
  {
    id:    'ishonch_qogoz',
    name:  "Ishonch qog'ozi",
    icon:  FileCheck,
    color: 'text-[#2563EB]',
    bg:    'bg-[#DBEAFE]',
    desc:  'Vakil orqali vakolat berish hujjati',
  },
  {
    id:    'kelishuv',
    name:  'Kelishuv bitimi',
    icon:  Handshake,
    color: 'text-[#16A34A]',
    bg:    'bg-[#DCFCE7]',
    desc:  "Nizo hal qilish uchun ikki tomon kelishuvi",
  },
]

export function DocCardGrid({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {YURIST_DOCS.map(doc => (
        <button
          key={doc.id}
          onClick={() => onSelect(doc.id)}
          className="p-5 rounded-xl bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all text-left group"
        >
          <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center mb-3', doc.bg)}>
            <doc.icon size={22} className={doc.color} />
          </div>
          <p className="font-semibold text-[#0F172A] mb-1">{doc.name}</p>
          <p className="text-xs text-[#94A3B8] leading-relaxed">{doc.desc}</p>
          <div className="flex items-center gap-1 mt-3 text-xs text-[#2563EB] opacity-0 group-hover:opacity-100 transition-opacity">
            <span>Yaratish</span>
            <ArrowRight size={12} />
          </div>
        </button>
      ))}
    </div>
  )
}
