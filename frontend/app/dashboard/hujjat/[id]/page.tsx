'use client'

import { use, useState }                           from 'react'
import { useTranslations }                         from 'next-intl'
import { useRouter }                               from 'next/navigation'
import Link                                        from 'next/link'
import {
  ArrowLeft, Download, Trash2, FileText,
  Calendar, Hash, DollarSign, Tag,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient }   from '@tanstack/react-query'
import { PageHeader }                              from '@/components/layout/PageHeader'
import { Card }                                    from '@/components/ui/Card'
import { Button }                                  from '@/components/ui/Button'
import { Badge }                                   from '@/components/ui/Badge'
import { Modal }                                   from '@/components/ui/Modal'
import { useAuth }                                 from '@/hooks/useAuth'
import api                                         from '@/lib/api'
import { exportContractPdf }                       from '@/lib/export/contractPdf'
import { exportContractDocx }                      from '@/lib/export/contractDocx'
import { formatCurrency, formatDate }              from '@/lib/formatters'
import toast                                       from 'react-hot-toast'

export default function HujjatDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('hujjat')
  const { id } = use(params)
  const { currentOrg } = useAuth()
  const router         = useRouter()
  const qc             = useQueryClient()
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: doc, isLoading } = useQuery<any>({
    queryKey: ['document', id, currentOrg?.id],
    queryFn:  () => api.get(`/documents/${id}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id && !!id,
  })

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/documents/${id}?orgId=${currentOrg!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
      qc.invalidateQueries({ queryKey: ['fakturalar'] })
      qc.invalidateQueries({ queryKey: ['akt-sverki'] })
      qc.invalidateQueries({ queryKey: ['tolov-grafik'] })
      toast.success(t('deleted'))
      // Tipiga qarab tegishli ro'yxatga qaytaramiz
      const backHref = backUrlFor(doc?.type)
      router.push(backHref)
    },
  })

  function backUrlFor(type?: string): string {
    switch (type) {
      case 'FAKTURA':       return '/dashboard/buxgalter/faktura'
      case 'AKT_SVERKI':    return '/dashboard/buxgalter/akt-sverki'
      case 'TOLOV_GRAFIGI': return '/dashboard/buxgalter/tolov-grafigi'
      case 'BUYRUQ':        return '/dashboard/kotib/buyruq'
      case 'BAYONNOMA':     return '/dashboard/kotib/bayonnoma'
      default:              return '/dashboard'
    }
  }

  async function handleExport(format: 'pdf' | 'docx') {
    const text = doc?.content?.text
    if (!text) { toast.error(t('exportError')); return }
    const opts = {
      title:   doc.title || (doc.type ? t(`type.${doc.type}` as any) : 'Hujjat'),
      content: text,
      orgName: currentOrg?.name,
    }
    try {
      if (format === 'pdf') await exportContractPdf(opts)
      else                  await exportContractDocx(opts)
      toast.success(t('downloaded', { type: format === 'pdf' ? 'PDF' : 'Word' }))
    } catch {
      toast.error(t('exportError'))
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <FileText size={40} className="text-[#CBD5E1]" />
        <p className="text-[#94A3B8]">{t('notFound')}</p>
        <Link href="/dashboard">
          <Button variant="outline" size="sm">{t('back')}</Button>
        </Link>
      </div>
    )
  }

  const typeName = (() => {
    try { return t(`type.${doc.type}` as any) } catch { return doc.type }
  })()
  const statusName = (() => {
    if (!doc.status) return null
    try { return t(`status.${doc.status}` as any) } catch { return doc.status }
  })()
  const totalAmount = doc.content?.totalAmount
  const items       = doc.content?.items
  const text        = doc.content?.text

  return (
    <div>
      <PageHeader
        title={doc.title || typeName}
        description={typeName}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: typeName,    path: backUrlFor(doc.type) },
          { label: doc.number || doc.title || '#' },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={backUrlFor(doc.type)}>
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={13} />}>
                {t('back')}
              </Button>
            </Link>
            {text && (
              <>
                <Button
                  variant="outline" size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={() => handleExport('pdf')}
                >
                  {t('pdf')}
                </Button>
                <Button
                  variant="outline" size="sm"
                  leftIcon={<Download size={13} />}
                  onClick={() => handleExport('docx')}
                >
                  {t('word')}
                </Button>
              </>
            )}
            <Button
              variant="outline" size="sm"
              className="text-red-500 hover:bg-red-50 hover:border-red-200"
              onClick={() => setDeleteOpen(true)}
              leftIcon={<Trash2 size={13} />}
            >
              {t('delete')}
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Asosiy: matn */}
        <div className="lg:col-span-2">
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                {typeName}
              </p>
            </div>
            <div className="p-3 bg-[#F1F5F9] max-h-[80vh] overflow-y-auto">
              {text ? (
                <div
                  className="bg-white shadow-sm mx-auto p-8 text-[#0F172A]"
                  style={{
                    fontFamily: '"Times New Roman", serif',
                    fontSize: 14,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    maxWidth: 794,
                  }}
                >
                  {text}
                </div>
              ) : (
                <div className="bg-white p-12 text-center text-[#94A3B8]">
                  {t('noContent')}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* O'ng panel: ma'lumotlar */}
        <div className="space-y-5">
          <Card>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              {t('info.type')}
            </p>
            <div className="space-y-2.5">
              <InfoRow icon={Tag}        label={t('info.type')}      value={typeName} />
              <InfoRow icon={Hash}       label={t('info.number')}    value={doc.number} />
              <InfoRow icon={Calendar}   label={t('info.date')}      value={doc.docDate ? formatDate(doc.docDate, 'long') : null} />
              <InfoRow icon={Calendar}   label={t('info.createdAt')} value={formatDate(doc.createdAt, 'short')} />
              {totalAmount > 0 && (
                <InfoRow icon={DollarSign} label={t('info.amount')} value={formatCurrency(totalAmount)} />
              )}
              {statusName && (
                <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                  <span className="text-xs text-[#94A3B8]">{t('info.status')}</span>
                  <Badge size="sm" variant={
                    doc.status === 'FINAL' ? 'success' :
                    doc.status === 'SENT'  ? 'primary' : 'default'
                  }>
                    {statusName}
                  </Badge>
                </div>
              )}
            </div>
          </Card>

          {Array.isArray(items) && items.length > 0 && (
            <Card>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                {t('specRows')}
              </p>
              <p className="text-sm text-[#475569]">
                {t('rowsSummary', {
                  count: items.length,
                  total: formatCurrency(totalAmount || items.reduce((s: number, i: any) => s + (Number(i.summa) || 0), 0)),
                })}
              </p>
            </Card>
          )}
        </div>
      </div>

      {deleteOpen && (
        <Modal
          open={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={t('delete')}
          size="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDeleteOpen(false)}>
                {t('back')}
              </Button>
              <Button
                variant="danger" size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
              >
                {t('delete')}
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#475569]">
            <strong>{doc.title || doc.number || '#'}</strong> — {t('deleteConfirm')}
          </p>
        </Modal>
      )}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: any; label: string; value?: string | null
}) {
  if (!value) return null
  return (
    <div className="flex items-start gap-2.5">
      <Icon size={13} className="text-[#94A3B8] shrink-0 mt-1" />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{label}</p>
        <p className="text-sm font-medium text-[#0F172A]">{value}</p>
      </div>
    </div>
  )
}
