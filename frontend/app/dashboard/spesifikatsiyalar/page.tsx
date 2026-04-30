'use client'

import Link           from 'next/link'
import { Plus, ClipboardList, Download } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader }  from '@/components/layout/PageHeader'
import { Button }      from '@/components/ui/Button'
import { Card }        from '@/components/ui/Card'
import { Badge }       from '@/components/ui/Badge'
import { EmptyState }  from '@/components/ui/Skeleton'
import { useAuth }     from '@/hooks/useAuth'
import api             from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/formatters'
import { calcSpecTotals } from '@/lib/qqs'
import { exportSpecExcel } from '@/lib/export/specExport'
import toast           from 'react-hot-toast'

export default function SpesifikatsiyalarPage() {
  const { currentOrg } = useAuth()
  const qc             = useQueryClient()

  const { data: specs = [], isLoading } = useQuery({
    queryKey: ['specifications', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/specifications?orgId=${currentOrg.id}`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/specifications/${id}?orgId=${currentOrg?.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['specifications'] })
      toast.success("O'chirildi")
    },
  })

  const handleExcel = async (spec: any) => {
    await exportSpecExcel({
      specNumber:  spec.specNumber,
      orgName:     currentOrg?.name || '',
      contractNum: spec.contract?.contractNumber,
      items:       spec.items || [],
      notes:       spec.notes,
    })
    toast.success('Excel yuklandi')
  }

  return (
    <div>
      <PageHeader
        title="Spesifikatsiyalar"
        description="Tovar va xizmatlar ro'yxatlari"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Spesifikatsiyalar' },
        ]}
        actions={
          <Link href="/dashboard/spesifikatsiyalar/yangi">
            <Button leftIcon={<Plus size={14} />} size="sm">Yangi</Button>
          </Link>
        }
      />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : specs.length === 0 ? (
        <EmptyState
          icon={<ClipboardList size={28} />}
          title="Spesifikatsiyalar yo'q"
          description="Tovar va xizmatlar ro'yxatini yarating"
          action={{
            label:   'Yangi spesifikatsiya',
            onClick: () => window.location.href = '/dashboard/spesifikatsiyalar/yangi',
          }}
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E2E8F0]">
                  {['Raqam', 'Shartnoma', 'Qatorlar', 'Jami summa', 'Sana', ''].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(specs as any[]).map((spec: any) => {
                  const items  = spec.items || []
                  const totals = calcSpecTotals(items)
                  return (
                    <tr key={spec.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC] group">
                      <td className="px-4 py-3">
                        <Link href={`/dashboard/spesifikatsiyalar/${spec.id}`}>
                          <span className="text-sm font-mono text-[#2563EB] hover:underline">
                            {spec.specNumber}
                          </span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#475569]">
                        {spec.contract
                          ? `№ ${spec.contract.contractNumber}`
                          : <span className="text-[#CBD5E1]">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default" size="sm">{items.length} qator</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold tabular-nums text-[#0F172A]">
                        {formatCurrency(totals.umumiy)}
                      </td>
                      <td className="px-4 py-3 text-sm text-[#94A3B8]">
                        {formatDate(spec.createdAt, 'short')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={() => handleExcel(spec)}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#16A34A] hover:bg-[#DCFCE7] transition-colors"
                            title="Excel yuklash"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
