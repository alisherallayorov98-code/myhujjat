'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useTranslations }       from 'next-intl'
import {
  CheckCircle2, FileText, Building2, Calendar, AlertCircle,
  Sparkles, ArrowRight, Loader2, Shield,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import api                       from '@/lib/api'
import { renderContractHtml }    from '@/lib/export/contractHtml'
import { formatDate }            from '@/lib/formatters'
import { Button }                from '@/components/ui/Button'
import { Input }                 from '@/components/ui/Input'
import { Card }                  from '@/components/ui/Card'
import toast                     from 'react-hot-toast'

interface ShareLinkView {
  contract:  any
  recipient: { name?: string; email?: string; phone?: string }
  signedAt:  string | null
  signerName: string | null
  isExpired: boolean
  expiresAt: string
}

export default function PublicSignPage({ params }: { params: Promise<{ token: string }> }) {
  const t = useTranslations('sign')
  const { token } = use(params)
  const [signerName,  setSignerName]  = useState('')
  const [signerEmail, setSignerEmail] = useState('')
  const [signed,      setSigned]      = useState(false)

  const { data, isLoading, error, refetch } = useQuery<ShareLinkView>({
    queryKey: ['share-link', token],
    queryFn:  () => api.get(`/share-links/public/${token}`).then(r => r.data),
    retry:    false,
  })

  const signMut = useMutation({
    mutationFn: () => api.post(`/share-links/public/${token}/sign`, { signerName: signerName.trim(), signerEmail: signerEmail.trim() || undefined }),
    onSuccess: () => {
      setSigned(true)
      toast.success(t('toastSuccess'))
      refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('toastError')),
  })

  useEffect(() => {
    if (data?.recipient?.name && !signerName) setSignerName(data.recipient.name)
    if (data?.recipient?.email && !signerEmail) setSignerEmail(data.recipient.email)
  }, [data])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <Loader2 size={28} className="animate-spin text-[#2563EB]" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] p-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={26} className="text-[#DC2626]" />
          </div>
          <h2 className="font-display font-bold text-[#0F172A] text-lg mb-2">{t('errorTitle')}</h2>
          <p className="text-sm text-[#475569] mb-6">
            {t('errorMessage')}
          </p>
          <Link href="/">
            <Button>{t('backToHome')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { contract } = data
  const isSigned = signed || !!data.signedAt

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Top bar */}
      <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#E2E8F0]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
              <span className="text-white font-black text-xs">M</span>
            </div>
            <span className="font-display font-black text-[#0F172A] text-sm">MyHujjat.uz</span>
          </Link>
          <div className="flex items-center gap-2 text-xs text-[#475569]">
            <Shield size={13} className="text-[#16A34A]" />
            <span className="hidden sm:inline">{t('secureLink')}</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Hero */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <FileText size={14} className="text-[#94A3B8]" />
            <p className="text-xs text-[#94A3B8] uppercase tracking-wider font-semibold">
              {t('heroLabel')}
            </p>
          </div>
          <h1 className="font-display font-black text-[#0F172A] text-xl sm:text-2xl">
            {contract.contractNumber || t('fallbackContractTitle')}
          </h1>
          <p className="text-sm text-[#475569] mt-1">
            {t.rich('sentBy', { name: contract.organization?.name || '', strong: (chunks) => <strong>{chunks}</strong> })}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Contract preview */}
          <div className="lg:col-span-2">
            <Card padding="none" className="overflow-hidden">
              <div className="px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">
                  {t('previewLabel')}
                </p>
                <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(contract.contractDate, 'long')}
                  </span>
                </div>
              </div>
              <div className="bg-[#F1F5F9] py-6 px-4">
                <div
                  className="bg-white shadow-md mx-auto"
                  style={{ maxWidth: 794, minHeight: 1100 }}
                  dangerouslySetInnerHTML={{ __html: renderContractHtml(contract) }}
                />
              </div>
            </Card>
          </div>

          {/* Sign panel — sticky uzun shartnomalarda ham doim ko'rinadi */}
          <div className="space-y-5 lg:sticky lg:top-4 lg:self-start">
            {isSigned ? (
              <Card className="bg-gradient-to-br from-[#DCFCE7] to-[#F0FDF4] border-[#BBF7D0]">
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-[#16A34A] flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={28} className="text-white" />
                  </div>
                  <h3 className="font-display font-bold text-[#15803D] text-base mb-1">
                    {t('signedTitle')}
                  </h3>
                  <p className="text-sm text-[#166534]">
                    {data.signerName || signerName
                      ? t('signedBy', { name: data.signerName || signerName })
                      : t('signedByYou')}
                    {data.signedAt && ` ${formatDate(data.signedAt, 'long')}`}
                  </p>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-[#2563EB]" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-[#0F172A] text-base">{t('signTitle')}</h3>
                    <p className="text-xs text-[#94A3B8] mt-0.5">
                      {t('signSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Input
                    label={t('nameLabel')}
                    placeholder={t('namePlaceholder')}
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    required
                  />
                  <Input
                    label={t('emailLabel')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={signerEmail}
                    onChange={e => setSignerEmail(e.target.value)}
                  />

                  <Button
                    fullWidth size="lg"
                    loading={signMut.isPending}
                    disabled={!signerName.trim()}
                    onClick={() => signMut.mutate()}
                    leftIcon={<CheckCircle2 size={16} />}
                  >
                    {t('signButton')}
                  </Button>

                  <p className="text-[11px] text-[#94A3B8] text-center leading-relaxed">
                    {t('signFooter')}
                  </p>
                </div>
              </Card>
            )}

            {/* Yuboruvchi haqida */}
            <Card padding="sm">
              <p className="text-[10px] font-semibold text-[#94A3B8] uppercase tracking-wider mb-2">
                {t('senderLabel')}
              </p>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] flex items-center justify-center shrink-0">
                  <Building2 size={15} className="text-[#475569]" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#0F172A] truncate">{contract.organization?.name}</p>
                  {contract.organization?.inn && (
                    <p className="text-xs text-[#94A3B8]">{t('innLabel')} {contract.organization.inn}</p>
                  )}
                </div>
              </div>
            </Card>

            {/* MyHujjat reklama */}
            <Card className="bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white border-0">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm">{t('promoTitle')}</p>
                  <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                    {t('promoSubtitle')}
                  </p>
                  <Link href="/register" className="inline-flex items-center gap-1 mt-3 text-xs font-semibold bg-white text-[#2563EB] px-3 py-1.5 rounded-lg">
                    {t('promoButton')} <ArrowRight size={12} />
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <footer className="text-center py-6 text-xs text-[#94A3B8]">
        <p>
          {t('footerText')} ·{' '}
          <Link href="/" className="text-[#2563EB] hover:underline">{t('footerLink')}</Link>
        </p>
      </footer>
    </div>
  )
}
