'use client'

import { useState, use }                                         from 'react'
import Link                                                      from 'next/link'
import { useRouter }                                             from 'next/navigation'
import {
  ChevronLeft, FileText, Download, Edit2, Trash2,
  CheckCircle, Circle, Building2, Calendar, Hash,
  DollarSign, MapPin, ClipboardList, Share2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient }                 from '@tanstack/react-query'
import { PageHeader }                                            from '@/components/layout/PageHeader'
import { Card }                                                  from '@/components/ui/Card'
import { Button }                                                from '@/components/ui/Button'
import { Badge, ContractStatusBadge }                            from '@/components/ui/Badge'
import { useAuth }                                               from '@/hooks/useAuth'
import { EimzoSign }                                             from '@/components/EimzoSign/EimzoSign'
import { DidoxSend }                                             from '@/components/DidoxSend/DidoxSend'
import api                                                       from '@/lib/api'
import { formatCurrency, formatDate }                            from '@/lib/formatters'
import { CONTRACT_TYPE_CONFIG }                                  from '@/lib/contractTemplates'
import { exportContractPdf, exportContractDocx }                 from '@/lib/exports'
import { renderContractHtml }                                   from '@/lib/export/contractHtml'
import { ShareLinkModal }                                       from '@/components/ShareLinkModal/ShareLinkModal'
import { InvoicesPanel }                                        from './_components/InvoicesPanel'
import { cn }                                                    from '@/lib/cn'

const STATUS_OPTIONS = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const
const STATUS_LABELS: Record<string, string> = {
  DRAFT:     'Qoralama',
  ACTIVE:    'Faol',
  COMPLETED: 'Tugagan',
  CANCELLED: 'Bekor',
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <div className="w-7 h-7 rounded-lg bg-[#F1F5F9] flex items-center justify-center shrink-0">
        <Icon size={13} className="text-[#94A3B8]" />
      </div>
      <div>
        <p className="text-xs text-[#94A3B8]">{label}</p>
        <p className="text-sm font-medium text-[#0F172A]">{value}</p>
      </div>
    </div>
  )
}

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { currentOrg, isPro } = useAuth()
  const router                = useRouter()
  const qc                    = useQueryClient()
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [shareOpen,     setShareOpen]     = useState(false)

  const { data: contract, isLoading } = useQuery<any>({
    queryKey: ['contract', id],
    queryFn:  () => api.get(`/contracts/${id}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const statusMut = useMutation({
    mutationFn: (status: string) =>
      api.patch(`/contracts/${id}/status?orgId=${currentOrg!.id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['contract', id] }),
  })

  const deleteMut = useMutation({
    mutationFn: () =>
      api.delete(`/contracts/${id}?orgId=${currentOrg!.id}`),
    onSuccess: () => router.push('/dashboard/shartnomalar'),
  })

  function refresh() {
    qc.invalidateQueries({ queryKey: ['contract', id] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-[#2563EB] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <FileText size={40} className="text-[#CBD5E1]" />
        <p className="text-[#94A3B8]">Shartnoma topilmadi</p>
        <Link href="/dashboard/shartnomalar">
          <Button variant="outline" size="sm">Orqaga</Button>
        </Link>
      </div>
    )
  }

  const typeCfg  = CONTRACT_TYPE_CONFIG[contract.contractType as keyof typeof CONTRACT_TYPE_CONFIG]
  const firstSpec = contract.specifications?.[0]

  return (
    <div>
      <PageHeader
        title={contract.contractNumber}
        description={typeCfg?.name || contract.contractType}
        breadcrumbs={[
          { label: 'Dashboard',     path: '/dashboard' },
          { label: 'Shartnomalar', path: '/dashboard/shartnomalar' },
          { label: contract.contractNumber },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline" size="sm"
              leftIcon={<Download size={13} />}
              onClick={async () => { await exportContractPdf(contract); window.dispatchEvent(new Event('contract-downloaded')) }}
            >
              PDF
            </Button>
            <Button
              variant="outline" size="sm"
              leftIcon={<Download size={13} />}
              onClick={async () => { await exportContractDocx(contract); window.dispatchEvent(new Event('contract-downloaded')) }}
            >
              Word
            </Button>

            <Button
              size="sm"
              leftIcon={<Share2 size={13} />}
              onClick={() => setShareOpen(true)}
            >
              Yuborish
            </Button>

            {isPro && !contract.signedUs && (
              <EimzoSign
                contractId={id}
                signerType="us"
                onSigned={refresh}
              />
            )}

            {isPro && (
              <DidoxSend
                contractId={id}
                orgId={currentOrg!.id}
                specId={firstSpec?.id}
                didoxSent={contract.didoxSent}
                onSent={refresh}
              />
            )}

            <Button
              variant="outline" size="sm"
              className="text-red-500 hover:bg-red-50 hover:border-red-200"
              onClick={() => setDeleteConfirm(true)}
            >
              <Trash2 size={13} />
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Asosiy ma'lumotlar */}
        <div className="lg:col-span-2 space-y-5">
          {/* Shartnoma kartasi */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0', typeCfg?.bg ?? 'bg-[#F1F5F9]')}>
                {typeCfg?.icon ?? '📄'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-[#0F172A]">{contract.contractNumber}</h2>
                <p className="text-sm text-[#94A3B8]">{typeCfg?.name}</p>
              </div>
              <div className="ml-auto">
                <ContractStatusBadge status={contract.status} />
              </div>
            </div>

            <InfoRow icon={Hash}          label="Raqam"          value={contract.contractNumber} />
            <InfoRow icon={Calendar}      label="Sana"           value={formatDate(contract.contractDate, 'long')} />
            <InfoRow icon={MapPin}        label="Shahar"         value={contract.city} />
            <InfoRow icon={DollarSign}    label="Summa"          value={contract.amount > 0 ? formatCurrency(contract.amount) : null} />
            <InfoRow icon={ClipboardList} label="Mahsulot/xizmat" value={contract.productName} />

            {/* Imzo holati */}
            {(contract.signedUs || contract.signedCp) && (
              <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
                <p className="text-xs font-semibold text-[#475569] uppercase tracking-wider mb-3">
                  Imzo holati
                </p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    {contract.signedUs
                      ? <CheckCircle size={15} className="text-[#16A34A]" />
                      : <Circle     size={15} className="text-[#E2E8F0]"  />
                    }
                    <span className="text-sm text-[#475569]">Bizning imzo</span>
                    {contract.signedUsAt && (
                      <span className="text-xs text-[#94A3B8] ml-auto">
                        {formatDate(contract.signedUsAt, 'short')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {contract.signedCp
                      ? <CheckCircle size={15} className="text-[#16A34A]" />
                      : <Circle     size={15} className="text-[#E2E8F0]"  />
                    }
                    <span className="text-sm text-[#475569]">Kontragent imzosi</span>
                    {contract.signedCpAt && (
                      <span className="text-xs text-[#94A3B8] ml-auto">
                        {formatDate(contract.signedCpAt, 'short')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Shartnoma matni — chiroyli HTML render */}
          {contract.content && (
            <Card padding="none" className="overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  Shartnoma ko'rinishi
                </p>
                <Link href={`/dashboard/shartnomalar/${id}/preview`}>
                  <button className="flex items-center gap-1.5 text-xs text-[#2563EB] hover:text-[#1D4ED8] font-medium transition">
                    🔍 To'liq ekranda ochish
                  </button>
                </Link>
              </div>
              <div
                className="contract-render-host max-h-[700px] overflow-y-auto bg-[#F1F5F9] p-6"
              >
                <div
                  className="bg-white shadow-md mx-auto"
                  style={{ maxWidth: 794 }}
                  dangerouslySetInnerHTML={{ __html: renderContractHtml(contract) }}
                />
              </div>
            </Card>
          )}

          {/* Spesifikatsiyalar */}
          {contract.specifications?.length > 0 && (
            <Card>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                Spesifikatsiyalar ({contract.specifications.length})
              </p>
              <div className="space-y-2">
                {contract.specifications.map((spec: any) => (
                  <Link
                    key={spec.id}
                    href={`/dashboard/shartnomalar/${id}/spesifikatsiya/${spec.id}`}
                    className="flex items-center justify-between p-3 rounded-xl border border-[#E2E8F0] hover:border-[#2563EB] hover:bg-[#F8FAFC] transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <ClipboardList size={15} className="text-[#94A3B8] group-hover:text-[#2563EB]" />
                      <div>
                        <p className="text-sm font-medium text-[#0F172A]">
                          {spec.specNumber || 'Spesifikatsiya'}
                        </p>
                        <p className="text-xs text-[#94A3B8]">
                          {formatDate(spec.createdAt, 'short')}
                          {spec.totalAmount ? ` · ${formatCurrency(spec.totalAmount)}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-[#2563EB] opacity-0 group-hover:opacity-100">Ko'rish →</span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Fakturalar nazorati (Didox/Roaming integratsiyasi) */}
          <InvoicesPanel
            contract={{
              id:             contract.id,
              contractNumber: contract.contractNumber,
              amount:         Number(contract.amount) || 0,
              totalInvoiced:  Number(contract.totalInvoiced) || 0,
              invoiceCount:   contract.invoiceCount || 0,
              alertLevel:     contract.alertLevel,
            }}
            orgId={currentOrg?.id || ''}
          />
        </div>

        {/* O'ng panel */}
        <div className="space-y-5">
          {/* Kontragent */}
          {contract.counterparty && (
            <Card>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                Kontragent
              </p>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
                  <Building2 size={16} className="text-[#94A3B8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{contract.counterparty.name}</p>
                  {contract.counterparty.inn && (
                    <p className="text-xs text-[#94A3B8]">STIR: {contract.counterparty.inn}</p>
                  )}
                </div>
              </div>
              {contract.counterparty.director && (
                <p className="text-xs text-[#475569]">Rahbar: {contract.counterparty.director}</p>
              )}
              {contract.counterparty.address && (
                <p className="text-xs text-[#94A3B8] mt-1">{contract.counterparty.address}</p>
              )}
            </Card>
          )}

          {/* Holat o'zgartirish */}
          <Card>
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
              Holat
            </p>
            <div className="space-y-1.5">
              {STATUS_OPTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => contract.status !== s && statusMut.mutate(s)}
                  disabled={statusMut.isPending}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all',
                    contract.status === s
                      ? 'bg-[#DBEAFE] text-[#1D4ED8] font-medium'
                      : 'text-[#475569] hover:bg-[#F1F5F9]'
                  )}
                >
                  {contract.status === s
                    ? <CheckCircle size={13} className="text-[#2563EB]" />
                    : <Circle     size={13} className="text-[#CBD5E1]"  />
                  }
                  {STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </Card>

          {/* Yaratilgan sana */}
          <Card padding="sm">
            <p className="text-xs text-[#94A3B8]">Yaratilgan</p>
            <p className="text-sm font-medium text-[#0F172A] mt-0.5">
              {formatDate(contract.createdAt, 'long')}
            </p>
            {contract.updatedAt !== contract.createdAt && (
              <>
                <p className="text-xs text-[#94A3B8] mt-2">O'zgartirilgan</p>
                <p className="text-sm font-medium text-[#0F172A] mt-0.5">
                  {formatDate(contract.updatedAt, 'long')}
                </p>
              </>
            )}
          </Card>
        </div>
      </div>

      {/* Yuborish modal */}
      <ShareLinkModal
        contractId={id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />

      {/* O'chirish tasdiqlash */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <h3 className="text-base font-semibold text-[#0F172A] mb-2">Shartnomani o'chirish</h3>
            <p className="text-sm text-[#475569] mb-5">
              {contract.contractNumber} shartnomani o'chirishni tasdiqlaysizmi?
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setDeleteConfirm(false)}>
                Bekor
              </Button>
              <Button
                variant="danger" size="sm"
                loading={deleteMut.isPending}
                onClick={() => deleteMut.mutate()}
              >
                O'chirish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
