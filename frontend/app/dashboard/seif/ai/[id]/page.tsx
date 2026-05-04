'use client'

import { use, useState }                            from 'react'
import { useTranslations }                          from 'next-intl'
import { useRouter }                                from 'next/navigation'
import Link                                         from 'next/link'
import {
  ArrowLeft, Download, Copy, Check, FileText, Sparkles, Calendar, Hash,
} from 'lucide-react'
import { useQuery }                                 from '@tanstack/react-query'
import { PageHeader }                               from '@/components/layout/PageHeader'
import { Card }                                     from '@/components/ui/Card'
import { Button }                                   from '@/components/ui/Button'
import { Badge }                                    from '@/components/ui/Badge'
import { useAuth }                                  from '@/hooks/useAuth'
import api                                          from '@/lib/api'
import { exportContractPdf }                        from '@/lib/export/contractPdf'
import { exportContractDocx }                       from '@/lib/export/contractDocx'
import { formatDate }                               from '@/lib/formatters'
import toast                                        from 'react-hot-toast'

export default function AiDocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('seifAi')
  const { id } = use(params)
  const { currentOrg } = useAuth()
  const router         = useRouter()
  const [copied, setCopied] = useState(false)

  const { data: doc, isLoading } = useQuery<any>({
    queryKey: ['ai-doc', id, currentOrg?.id],
    queryFn:  () => api.get(`/ai/docs/${id}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id && !!id,
  })

  async function handleCopy() {
    if (!doc?.content) return
    await navigator.clipboard.writeText(doc.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('copyToast'))
  }

  async function handleExport(format: 'pdf' | 'docx') {
    if (!doc?.content) return
    const opts = {
      title:   doc.title || doc.docType,
      content: doc.content,
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
        <div className="w-8 h-8 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <FileText size={40} className="text-[#CBD5E1]" />
        <p className="text-[#94A3B8]">{t('notFound')}</p>
        <Link href="/dashboard/seif/ai">
          <Button variant="outline" size="sm">{t('back')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={doc.title || doc.docType}
        description={t('aiGenerated')}
        breadcrumbs={[
          { label: 'Dashboard',    path: '/dashboard' },
          { label: 'Seif',         path: '/dashboard/seif' },
          { label: t('breadcrumb'), path: '/dashboard/seif/ai' },
          { label: doc.title || '#' },
        ]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href="/dashboard/seif/ai">
              <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={13} />}>
                {t('back')}
              </Button>
            </Link>
            <Button
              variant="outline" size="sm"
              leftIcon={copied ? <Check size={13} className="text-[#16A34A]" /> : <Copy size={13} />}
              onClick={handleCopy}
            >
              {copied ? t('copied') : t('copy')}
            </Button>
            <Button
              size="sm"
              leftIcon={<Download size={13} />}
              onClick={() => handleExport('pdf')}
            >
              PDF
            </Button>
            <Button
              variant="outline" size="sm"
              leftIcon={<FileText size={13} />}
              onClick={() => handleExport('docx')}
            >
              Word
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Asosiy: matn — kengroq panel */}
        <div className="lg:col-span-3">
          <Card padding="none" className="overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F3E8FF] to-[#DBEAFE] flex items-center gap-2">
              <Sparkles size={15} className="text-[#7C3AED]" />
              <span className="text-sm font-semibold text-[#0F172A]">{doc.docType}</span>
              <Badge variant="success" size="sm">{t('ready')}</Badge>
            </div>
            <div className="p-3 bg-[#F1F5F9] max-h-[80vh] overflow-y-auto">
              {doc.content ? (
                <div
                  className="bg-white shadow-sm mx-auto p-8 sm:p-12 text-[#0F172A]"
                  style={{
                    fontFamily: '"Times New Roman", serif',
                    fontSize: 14,
                    lineHeight: 1.8,
                    whiteSpace: 'pre-wrap',
                    maxWidth: 794,  // A4 width
                  }}
                >
                  {doc.content}
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
              {t('docInfo')}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <Hash size={13} className="text-[#94A3B8] shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{t('docType')}</p>
                  <p className="text-sm font-medium text-[#0F172A]">{doc.docType}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Calendar size={13} className="text-[#94A3B8] shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{t('createdAt')}</p>
                  <p className="text-sm font-medium text-[#0F172A]">{formatDate(doc.createdAt, 'long')}</p>
                </div>
              </div>
              {doc.tokensUsed > 0 && (
                <div className="flex items-start gap-2.5">
                  <Sparkles size={13} className="text-[#7C3AED] shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-[#94A3B8] uppercase tracking-wider">{t('tokensLabel')}</p>
                    <p className="text-sm font-medium text-[#0F172A]">{doc.tokensUsed}</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {doc.prompt && (
            <Card>
              <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
                {t('originalPrompt')}
              </p>
              <p className="text-sm text-[#475569] leading-relaxed whitespace-pre-wrap">
                {doc.prompt}
              </p>
            </Card>
          )}

          <Link href="/dashboard/seif/ai">
            <Button variant="outline" size="sm" fullWidth leftIcon={<Sparkles size={13} />}>
              {t('createAnother')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
