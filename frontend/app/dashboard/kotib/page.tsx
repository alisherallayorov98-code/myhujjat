'use client'

import { useQuery }         from '@tanstack/react-query'
import { useAuth }          from '@/hooks/useAuth'
import api from '@/lib/api'
import Link                 from 'next/link'
import { FileText, Users, ChevronRight, Plus } from 'lucide-react'
import { format }           from 'date-fns'

interface DocRow {
  id:        string
  type:      string
  title:     string
  number:    string
  docDate:   string
  status:    string
  createdAt: string
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  DRAFT: { label: 'Qoralama', cls: 'bg-gray-100 text-gray-600' },
  FINAL: { label: 'Tayyor',   cls: 'bg-green-100 text-green-700' },
  SENT:  { label: 'Yuborildi', cls: 'bg-blue-100 text-blue-700' },
}

export default function KotibPage() {
  const { currentOrg: activeOrg } = useAuth()

  const { data: recent = [] } = useQuery<DocRow[]>({
    queryKey: ['documents', activeOrg?.id],
    queryFn:  () => api.get(`/documents?orgId=${activeOrg!.id}`).then(r => r.data),
    enabled:  !!activeOrg,
  })

  const buyruqCount    = recent.filter(d => d.type === 'BUYRUQ').length
  const bayonnomCount  = recent.filter(d => d.type === 'BAYONNOMA').length

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kotib bo'limi</h1>
        <p className="text-gray-500 mt-1">Buyruqlar va bayonnomalarni yarating va boshqaring</p>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Link href="/dashboard/kotib/buyruq" className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors mt-1" />
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-gray-900">Buyruqlar</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ishga qabul, ishdan bo'shatish, lavozim o'zgartirish va boshqa buyruqlar
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-2xl font-bold text-blue-600">{buyruqCount}</span>
            <span className="text-sm text-gray-400 ml-1">ta hujjat</span>
          </div>
        </Link>

        <Link href="/dashboard/kotib/bayonnoma" className="group bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors mt-1" />
          </div>
          <div className="mt-4">
            <h2 className="text-lg font-semibold text-gray-900">Bayonnomalar</h2>
            <p className="text-sm text-gray-500 mt-1">
              Yig'ilish bayonnomasi, qabul-topshirish va boshqa bayonnomalar
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-2xl font-bold text-purple-600">{bayonnomCount}</span>
            <span className="text-sm text-gray-400 ml-1">ta hujjat</span>
          </div>
        </Link>
      </div>

      {/* Recent documents */}
      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Oxirgi hujjatlar</h2>
          <div className="flex gap-2">
            <Link href="/dashboard/kotib/buyruq" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Plus className="w-4 h-4" /> Buyruq
            </Link>
            <span className="text-gray-300">|</span>
            <Link href="/dashboard/kotib/bayonnoma" className="flex items-center gap-1 text-sm text-purple-600 hover:underline">
              <Plus className="w-4 h-4" /> Bayonnoma
            </Link>
          </div>
        </div>

        {recent.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Hali hujjat yo'q</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recent.slice(0, 10).map(doc => {
              const s = STATUS_LABEL[doc.status] ?? STATUS_LABEL.DRAFT
              return (
                <div key={doc.id} className="flex items-center justify-between px-5 py-3.5">
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
