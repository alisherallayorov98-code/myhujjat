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
    DRAFT: { label: t('statusDraft'), cls: 'bg-gray-100 text-gray-600' },
    FINAL: { label: t('statusFinal'), cls: 'bg-green-100 text-green-700' },
    SENT:  { label: t('statusSent'), cls: 'bg-blue-100 text-blue-700' },
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
        <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
        <p className="text-gray-500 mt-1">{t('description')}</p>
      </div>

      {/* Asosiy 2 ta — to'liq form bilan */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wider">{t('mainDocs')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/dashboard/kotib/buyruq" className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-blue-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">{t('buyruqlar')}</h3>
              <p className="text-xs text-gray-500 mt-1">{t('buyruqlarDesc')}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xl font-bold text-blue-600">{buyruqCount}</span>
              <span className="text-xs text-gray-400 ml-1">{t('tHujjat')}</span>
            </div>
          </Link>

          <Link href="/dashboard/kotib/bayonnoma" className="group bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-purple-300 transition-all">
            <div className="flex items-start justify-between">
              <div className="w-11 h-11 bg-purple-50 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors mt-1" />
            </div>
            <div className="mt-3">
              <h3 className="font-semibold text-gray-900">{t('bayonnomalar')}</h3>
              <p className="text-xs text-gray-500 mt-1">{t('bayonnomalarDesc')}</p>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <span className="text-xl font-bold text-purple-600">{bayonnomCount}</span>
              <span className="text-xs text-gray-400 ml-1">{t('tHujjat')}</span>
            </div>
          </Link>
        </div>
      </div>

      {/* AI orqali — 13 ta qo'shimcha hujjat */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-[#7C3AED]" />
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
            {t('aiCreate')}
          </h2>
          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#EDE9FE] text-[#7C3AED]">Pro</span>
        </div>
        <DynamicFeatureRunner features={KOTIB_FEATURES} />
      </div>

      {/* So'nggi hujjatlar */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">{t('oxirgiHujjatlar')}</h2>
          <div className="flex gap-2">
            <Link href="/dashboard/kotib/buyruq" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> {t('buyruq')}
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/dashboard/kotib/bayonnoma" className="flex items-center gap-1 text-sm text-purple-600 hover:underline">
              <Plus className="w-4 h-4" /> {t('bayonnoma')}
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{t('haliHujjatYoq')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.slice(0, 10).map(doc => {
              const s = STATUS_LABEL[doc.status] ?? STATUS_LABEL.DRAFT
              return (
                <div
                  key={doc.id}
                  onClick={() => router.push(`/dashboard/hujjat/${doc.id}`)}
                  className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${doc.type === 'BUYRUQ' ? 'bg-blue-50' : 'bg-purple-50'}`}>
                      {doc.type === 'BUYRUQ'
                        ? <FileText className="w-4 h-4 text-blue-600" />
                        : <Users    className="w-4 h-4 text-purple-600" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{doc.title}</p>
                      <p className="text-xs text-gray-400">{doc.number} · {doc.docDate || format(new Date(doc.createdAt), 'dd.MM.yyyy')}</p>
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
