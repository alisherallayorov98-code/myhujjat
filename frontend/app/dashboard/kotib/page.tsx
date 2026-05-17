'use client'

import { useQuery }         from '@tanstack/react-query'
import { useTranslations }  from 'next-intl'
import { useAuth }          from '@/hooks/useAuth'
import api from '@/lib/api'
import Link                 from 'next/link'
import { useRouter }        from 'next/navigation'
import { FileText, Users, ChevronRight, Plus, Sparkles } from 'lucide-react'
import { format }           from 'date-fns'
import { DynamicFeatureRunner } from '@/components/DynamicFeatureRunner/DynamicFeatureRunner'
import { KOTIB_FEATURES }   from '@/lib/dynamicFeatures'

interface DocRow {
  id:        string
  type:      string
  title:     string
  number:    string
  docDate:   string
  status:    string
  createdAt: string
}

export default function KotibPage() {
  const t = useTranslations('secretary')
  const router = useRouter()
  const { currentOrg: activeOrg } = useAuth()

  const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
    DRAFT: { label: t('statusDraft'), cls: 'bg-[#F1F5F9] text-[#475569]' },
    FINAL: { label: t('statusFinal'), cls: 'bg-[#DCFCE7] text-[#16A34A]' },
    SENT:  { label: t('statusSent'), cls: 'bg-[#DBEAFE] text-[#1D4ED8]' },
  }

  const { data: recent = [] } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&limit=20`).then(r => r.data.data || []),
    enabled:  !!activeOrg,
  })

  const { data: buyruqCount = 0 } = useQuery<number>({
    queryKey: ['documents-count', activeOrg?.id, 'BUYRUQ'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BUYRUQ&limit=1`).then(r => r.data.meta?.total ?? 0),
    enabled:  !!activeOrg,
  })

  const { data: bayonnomCount = 0 } = useQuery<number>({
    queryKey: ['documents-count', activeOrg?.id, 'BAYONNOMA'],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}&type=BAYONNOMA&limit=1`).then(r => r.data.meta?.total ?? 0),
    enabled:  !!activeOrg,
  })

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">{t('title')}</h1>
        <p className="text-[#64748B] mt-1">{t('description')}</p>
      </div>

      {/* Asosiy 2 ta — to'liq form bilan */}
      <div>
        <h2 className="text-sm font-semibold text-[#374151] mb-3 uppercase tracking-wider">{t('mainDocs')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/kotib/buyruq" className="group bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#93C5FD] transition-all">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 bg-[#EFF6FF] rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#2563EB]" />
              </div>
              <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors mt-1" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-[#0F172A]">{t('buyruqlar')}</h3>
              <p className="text-xs text-[#64748B] mt-1">{t('buyruqlarDesc')}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <span className="text-xl font-bold text-[#2563EB]">{buyruqCount}</span>
              <span className="text-xs text-[#94A3B8] ml-1">{t('tHujjat')}</span>
            </div>
          </Link>

          <Link href="/dashboard/kotib/bayonnoma" className="group bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:shadow-md hover:border-[#C4B5FD] transition-all">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 bg-[#F3E8FF] rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-[#7C3AED]" />
              </div>
              <ChevronRight className="w-5 h-5 text-[#CBD5E1] group-hover:text-[#7C3AED] transition-colors mt-1" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-[#0F172A]">{t('bayonnomalar')}</h3>
              <p className="text-xs text-[#64748B] mt-1">{t('bayonnomalarDesc')}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-[#F1F5F9]">
              <span className="text-xl font-bold text-[#7C3AED]">{bayonnomCount}</span>
              <span className="text-xs text-[#94A3B8] ml-1">{t('tHujjat')}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* AI orqali — 13 ta qo'shimcha hujjat */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-[#374151] uppercase tracking-wider">
            {t('aiCreate')}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED]">Pro</span>
        </div>
        <DynamicFeatureRunner features={KOTIB_FEATURES} />
      </div>

      {/* So'nggi hujjatlar */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0]">
        <div className="flex items-center justify-between p-5 border-b border-[#F1F5F9]">
          <h2 className="font-semibold text-[#0F172A]">{t('oxirgiHujjatlar')}</h2>
          <div className="flex gap-2">
            <Link href="/dashboard/kotib/buyruq" className="flex items-center gap-1 text-sm text-[#2563EB] hover:underline">
              <Plus className="w-4 h-4" /> {t('buyruq')}
            </Link>
            <span className="text-[#CBD5E1]">|</span>
            <Link href="/dashboard/kotib/bayonnoma" className="flex items-center gap-1 text-sm text-[#7C3AED] hover:underline">
              <Plus className="w-4 h-4" /> {t('bayonnoma')}
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center text-[#94A3B8]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('haliHujjatYoq')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F8FAFC]">
            {recent.slice(0, 10).map(doc => {
              const s = STATUS_LABEL[doc.status] ?? STATUS_LABEL.DRAFT
              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/hujjat/${doc.id}`)}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-[#F8FAFC] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.type === 'BUYRUQ' ? 'bg-[#EFF6FF]' : 'bg-[#F3E8FF]'}`}>
                      {doc.type === 'BUYRUQ'
                        ? <FileText className="w-4 h-4 text-[#2563EB]" />
                        : <Users    className="w-4 h-4 text-[#7C3AED]" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">{doc.title}</p>
                      <p className="text-xs text-[#94A3B8]">{doc.number} · {doc.docDate || format(new Date(doc.createdAt), 'dd.MM.yyyy')}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ml-4 ${s.cls}`}>
                    {s.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
