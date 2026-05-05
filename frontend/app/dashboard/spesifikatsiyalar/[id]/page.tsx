'use client'

import { useTranslations }     from 'next-intl'
import { useParams, useRouter } from 'next/navigation'
import Link           from 'next/link'
import { ArrowLeft, Download, FileText, FileType2 } from 'lucide-react'
import { useQuery }   from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button }     from '@/components/ui/Button'
import { Card }       from '@/components/ui/Card'
import { useAuth }    from '@/hooks/useAuth'
import api            from '@/lib/api'
import { formatAmountWords, formatDate, formatNumber } from '@/lib/formatters'
import { calcSpecTotals } from '@/lib/qqs'
import { exportSpecExcel } from '@/lib/export/specExport'
import { exportSpecDocx }  from '@/lib/export/specDocx'
import toast          from 'react-hot-toast'

export default function SpecDetailPage() {
  const t              = useTranslations('specifications')
  const params         = useParams()
  const router         = useRouter()
  const { currentOrg } = useAuth()
  const id             = params.id as string

  const { data: spec, isLoading } = useQuery({
    queryKey: ['spec', id],
    queryFn:  async () => {
      const { data } = await api.get(`/specifications/${id}?orgId=${currentOrg?.id}`)
      return data
    },
    enabled: !!currentOrg?.id && !!id,
  })

  if (isLoading) {
    return <div className="h-64 bg-[#F1F5F9] rounded-xl animate-pulse" />
  }
  if (!spec) {
    return <p className="text-center text-[#94A3B8] py-16">{t('notFound')}</p>
  }

  const items  = spec.items || []
  const totals = calcSpecTotals(items)

  const handleExcel = async () => {
    await exportSpecExcel({
      specNumber:  spec.specNumber,
      orgName:     currentOrg?.name || '',
      cpName:      spec.counterparty?.name,
      contractNum: spec.contract?.contractNumber,
      items,
      notes:       spec.notes,
    })
    toast.success(t('toast.excelDownloaded'))
  }

  const handleWord = async () => {
    await exportSpecDocx({
      specNumber:   spec.specNumber,
      specDate:     spec.createdAt,
      city:         currentOrg?.address?.split(',')[0] || 'Toshkent',
      contractNum:  spec.contract?.contractNumber,
      contractDate: spec.contract?.contractDate,
      org:          currentOrg as any,
      cp:           spec.counterparty,
      items,
      notes:        spec.notes,
    })
    toast.success(t('toast.wordDownloaded'))
  }

  return (
    <div>
      <PageHeader
        title={`${t('specNumber')} ${spec.specNumber}`}
        description={formatDate(spec.createdAt, 'long')}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: t('title'),      path: '/dashboard/spesifikatsiyalar' },
          { label: spec.specNumber },
        ]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => router.back()}>
              {t('back')}
            </Button>
            <Button variant="outline" size="sm" leftIcon={<FileType2 size={14} />} onClick={handleWord}>
              Word
            </Button>
            <Button variant="secondary" size="sm" leftIcon={<Download size={14} />} onClick={handleExcel}>
              Excel
            </Button>
          </div>
        }
      />

      {spec.contract && (
        <div className="mb-4 p-3 bg-[#DBEAFE]/50 border border-[#BFDBFE] rounded-xl flex items-center gap-2">
          <FileText size={16} className="text-[#2563EB]" />
          <p className="text-sm text-[#1D4ED8]">
            {t('contractLink')}{' '}
            <Link href={`/dashboard/shartnomalar/${spec.contract.id}`} className="font-semibold hover:underline">
              № {spec.contract.contractNumber}
            </Link>
          </p>
        </div>
      )}

      <Card padding="none" className="mb-4">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                {[t('table.num'), t('table.name'), t('table.unit'), t('table.qty'), t('table.price'), t('table.qqsPercent'), t('table.qqsAmount'), t('table.total')].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-[#94A3B8] uppercase tracking-wider text-left last:text-right">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((item: any, i: number) => (
                <tr key={i} className={`border-b border-[#F1F5F9] ${i % 2 !== 0 ? 'bg-[#FAFAFA]' : ''}`}>
                  <td className="px-4 py-3 text-sm text-[#94A3B8]">{i + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium text-[#0F172A]">{item.nomi}</td>
                  <td className="px-4 py-3 text-sm text-[#475569]">{item.birlik}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right text-[#475569]">{item.miqdori}</td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right text-[#475569]">
                    {formatNumber(item.narxi)}
                  </td>
                  <td className="px-4 py-3 text-sm text-center">
                    {item.qqsFoiz === 'siz'
                      ? <span className="text-[#94A3B8]">{t('qqsLess')}</span>
                      : <span className="text-[#D97706] font-medium">{item.qqsFoiz}%</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right text-[#D97706]">
                    {item.qqsSumma > 0 ? formatNumber(item.qqsSumma) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm tabular-nums text-right font-semibold text-[#0F172A]">
                    {formatNumber(item.summa)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex justify-end">
        <Card className="w-full max-w-sm">
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm">
              <span className="text-[#475569]">{t('withoutQqs')}</span>
              <span className="tabular-nums font-medium">{formatNumber(totals.jami)} so'm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#475569]">{t('totalQqs')}</span>
              <span className="tabular-nums text-[#D97706] font-medium">{formatNumber(totals.jamiQqs)} so'm</span>
            </div>
            <div className="border-t border-[#E2E8F0] pt-2.5 flex justify-between">
              <span className="font-bold text-[#0F172A]">{t('grandTotal')}</span>
              <span className="tabular-nums font-black text-[#0F172A] text-lg">{formatNumber(totals.umumiy)} so'm</span>
            </div>
            <p className="text-xs text-[#94A3B8] italic">{formatAmountWords(totals.umumiy)}</p>
          </div>
        </Card>
      </div>
    </div>
  )
}
