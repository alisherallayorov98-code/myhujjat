'use client'

import { useState }     from 'react'
import { useTranslations } from 'next-intl'
import { useQuery }     from '@tanstack/react-query'
import { Activity }     from 'lucide-react'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { useAuth }      from '@/hooks/useAuth'
import api              from '@/lib/api'
import { formatDate }   from '@/lib/formatters'

export default function AuditLogPage() {
  const t = useTranslations('settings')
  const { currentOrg } = useAuth()
  const [page, setPage] = useState(1)

  const ACTION_LABELS: Record<string, { label: string; variant: 'success' | 'default' | 'warning' | 'danger' | 'info' }> = {
    CONTRACT_CREATED:       { label: t('actionContractCreated'), variant: 'success' },
    CONTRACT_UPDATED:       { label: t('actionContractUpdated'), variant: 'info'    },
    CONTRACT_DELETED:       { label: t('actionContractDeleted'), variant: 'danger'  },
    CONTRACT_SIGNED:        { label: t('actionContractSigned'),  variant: 'success' },
    USER_LOGIN:             { label: t('actionUserLogin'),       variant: 'default' },
    USER_LOGOUT:            { label: t('actionUserLogout'),      variant: 'default' },
    PASSWORD_CHANGED:       { label: t('actionPasswordChanged'), variant: 'warning' },
    ORG_UPDATED:            { label: t('actionOrgUpdated'),      variant: 'info'    },
    SUBSCRIPTION_ACTIVATED: { label: t('actionSubActivated'),    variant: 'success' },
    EMPLOYEE_CREATED:       { label: t('actionEmployeeCreated'), variant: 'success' },
    EMPLOYEE_DELETED:       { label: t('actionEmployeeDeleted'), variant: 'danger'  },
    DOCUMENT_EXPORTED:      { label: t('actionDocExported'),     variant: 'default' },
  }

  const { data, isLoading } = useQuery({
    queryKey: ['audit', currentOrg?.id, page],
    queryFn:  async () => {
      if (!currentOrg?.id) return null
      const { data } = await api.get(
        `/audit?orgId=${currentOrg.id}&page=${page}&limit=50`
      )
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const logs       = data?.data       || []
  const totalPages = data?.meta?.totalPages || 1

  const parseDetails = (raw: any): string => {
    if (!raw) return ''
    try {
      const obj = typeof raw === 'string' ? JSON.parse(raw) : raw
      return Object.entries(obj).map(([k, v]) => `${k}: ${v}`).join(' · ')
    } catch {
      return String(raw)
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 mb-5">
        <Activity size={18} className="text-[#2563EB]" />
        <h2 className="font-display font-bold text-[#0F172A]">{t('auditTitle')}</h2>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-8 text-center text-[#94A3B8] text-sm">{t('auditLoading')}</div>
        ) : logs.length === 0 ? (
          <div className="p-10 text-center">
            <Activity size={28} className="mx-auto text-[#CBD5E1] mb-2" />
            <p className="text-sm text-[#94A3B8]">{t('auditEmpty')}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#F1F5F9]">
            {logs.map((log: any) => {
              const meta = ACTION_LABELS[log.action] || { label: log.action, variant: 'default' as const }
              const details = parseDetails(log.newData)
              return (
                <div key={log.id} className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={meta.variant} size="sm">{meta.label}</Badge>
                      <span className="text-xs text-[#94A3B8]">
                        {log.user?.firstName || log.user?.email || t('auditSystem')}
                      </span>
                    </div>
                    {details && (
                      <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{details}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#94A3B8] shrink-0 mt-0.5">
                    {formatDate(log.createdAt, 'short')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                page === i + 1
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#475569] hover:bg-[#F1F5F9]'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
