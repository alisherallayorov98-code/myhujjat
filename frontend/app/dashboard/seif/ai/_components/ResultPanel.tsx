'use client'

import { useState }       from 'react'
import { useTranslations } from 'next-intl'
import Link                from 'next/link'
import { Sparkles, Copy, Check, Download, FileText, Maximize2, ChevronLeft, Printer, ExternalLink } from 'lucide-react'
import { Card }  from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { exportContractPdf  } from '@/lib/export/contractPdf'
import { exportContractDocx } from '@/lib/export/contractDocx'
import { printHtml }          from '@/lib/printDocument'
import { renderKotibHtml }    from '@/lib/renderKotibHtml'
import toast from 'react-hot-toast'

interface Props {
  loading:    boolean
  streaming?: boolean
  result:     string
  docType:    string
  orgName?:   string
  savedId?:   string | null
}

export function ResultPanel({ loading, streaming, result, docType, orgName, savedId }: Props) {
  const t = useTranslations('seifAi')
  const [copied, setCopied] = useState(false)
  const [fullscreen, setFullscreen] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('copyToast'))
  }

  return (
    <Card padding="none" className="h-full flex flex-col min-h-[600px]">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-[#7C3AED]" />
          <span className="text-sm font-semibold text-[#0F172A]">
            {result ? docType : t('resultPreview')}
          </span>
          {streaming ? (
            <span className="flex items-center gap-1 text-xs text-[#7C3AED]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED] animate-pulse" />
              {t('generating')}
            </span>
          ) : result ? (
            <Badge variant="success" size="sm">{t('ready')}</Badge>
          ) : null}
        </div>

        {result && !streaming && (
          <div className="flex gap-2">
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              title="To'liq ekranda ko'rish"
            >
              <Maximize2 size={12} />
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              {copied
                ? <><Check size={12} className="text-[#16A34A]" /> {t('copied')}</>
                : <><Copy size={12} /> {t('copy')}</>
              }
            </button>
            <button
              onClick={() => exportContractPdf({ title: docType, content: result, orgName }).catch(() => toast.error('PDF yuklab olishda xatolik'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors"
            >
              <Download size={12} /> PDF
            </button>
            <button
              onClick={() => exportContractDocx({ title: docType, content: result, orgName }).catch(() => toast.error('Word yuklab olishda xatolik'))}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              <FileText size={12} /> Word
            </button>
            {savedId && (
              <Link
                href={`/dashboard/seif/ai/${savedId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#F0FDF4] border border-[#BBF7D0] text-[#15803D] hover:bg-[#DCFCE7] transition-colors"
              >
                <ExternalLink size={12} /> Ko'rish
              </Link>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-auto bg-[#F1F5F9] p-4">
        {loading    ? <LoadingState /> :
         result     ? <ResultView content={result} /> :
                      <EmptyState />}
      </div>

      {fullscreen && result && (
        <div className="fixed inset-0 z-50 bg-[#1E293B] flex flex-col">
          <div className="bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0">
            <button
              onClick={() => setFullscreen(false)}
              className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Orqaga</span>
            </button>
            <div className="h-6 w-px bg-white/10 mx-1" />
            <Sparkles size={14} className="text-[#A78BFA]" />
            <p className="text-sm font-semibold">{docType}</p>
            <div className="flex-1" />
            <button onClick={() => printHtml(renderKotibHtml(result))} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Printer size={14} /><span className="hidden sm:inline">Pechat</span>
            </button>
            <button onClick={() => exportContractPdf({ title: docType, content: result, orgName }).catch(() => toast.error('PDF yuklab olishda xatolik'))} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <Download size={14} /><span className="hidden sm:inline">PDF</span>
            </button>
            <button onClick={() => exportContractDocx({ title: docType, content: result, orgName }).catch(() => toast.error('Word yuklab olishda xatolik'))} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
              <FileText size={14} /><span className="hidden sm:inline">Word</span>
            </button>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
              <div
                className="bg-white shadow-2xl"
                style={{ width: '794px', minHeight: '1123px' }}
                dangerouslySetInnerHTML={{ __html: renderKotibHtml(result) }}
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

function LoadingState() {
  const t = useTranslations('seifAi')
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center">
          <Sparkles size={28} className="text-white" />
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] animate-ping opacity-20" />
      </div>
      <div className="text-center">
        <p className="font-bold text-[#0F172A] mb-1">{t('loadingTitle')}</p>
        <p className="text-sm text-[#94A3B8]">{t('loadingHint')}</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

function ResultView({ content }: { content: string }) {
  return (
    <div
      className="bg-white shadow-md mx-auto rounded-sm select-text"
      style={{ maxWidth: 794, minHeight: 600 }}
      dangerouslySetInnerHTML={{ __html: renderKotibHtml(content) }}
    />
  )
}

function EmptyState() {
  const t = useTranslations('seifAi')
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl bg-[#F3E8FF] flex items-center justify-center">
        <Sparkles size={24} className="text-[#7C3AED]" />
      </div>
      <div>
        <p className="font-bold text-[#0F172A] mb-1">{t('emptyTitle')}</p>
        <p className="text-sm text-[#94A3B8] max-w-xs">
          {t('emptyHint')}
        </p>
      </div>
    </div>
  )
}
