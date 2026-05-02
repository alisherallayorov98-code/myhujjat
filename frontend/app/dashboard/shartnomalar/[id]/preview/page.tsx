'use client'

import { useState, use } from 'react'
import { useTranslations } from 'next-intl'
import Link              from 'next/link'
import {
  ArrowLeft, Download, Printer, Share2,
  ZoomIn, ZoomOut, Maximize2, Minimize2,
  Loader2, FileText,
} from 'lucide-react'
import { useQuery }      from '@tanstack/react-query'
import { useAuth }       from '@/hooks/useAuth'
import api               from '@/lib/api'
import { renderContractHtml } from '@/lib/export/contractHtml'
import { CONTRACT_TYPE_CONFIG } from '@/lib/contractTemplates'
import { exportContractPdf, exportContractDocx } from '@/lib/exports'
import { Button }        from '@/components/ui/Button'
import { ShareLinkModal } from '@/components/ShareLinkModal/ShareLinkModal'
import { cn }            from '@/lib/cn'

const ZOOM_LEVELS = [50, 75, 90, 100, 125, 150]

export default function ContractPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const t = useTranslations('contracts')
  const { id } = use(params)
  const { currentOrg } = useAuth()
  const [zoom,       setZoom]       = useState(100)
  const [fullscreen, setFullscreen] = useState(false)
  const [shareOpen,  setShareOpen]  = useState(false)

  const { data: contract, isLoading } = useQuery<any>({
    queryKey: ['contract', id],
    queryFn:  () => api.get(`/contracts/${id}?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const typeCfg = contract ? CONTRACT_TYPE_CONFIG[contract.contractType as keyof typeof CONTRACT_TYPE_CONFIG] : null
  const typeName = contract ? t(`types.${contract.contractType}` as any) : ''

  function handlePrint() {
    window.print()
  }

  function handleZoom(delta: number) {
    const idx = ZOOM_LEVELS.indexOf(zoom)
    const next = ZOOM_LEVELS[Math.max(0, Math.min(ZOOM_LEVELS.length - 1, idx + delta))]
    setZoom(next)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().then(() => setFullscreen(true)).catch(() => {})
    } else {
      document.exitFullscreen?.().then(() => setFullscreen(false)).catch(() => {})
    }
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#1E293B] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    )
  }

  if (!contract) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F8FAFC] flex flex-col items-center justify-center gap-3">
        <FileText size={40} className="text-[#CBD5E1]" />
        <p className="text-[#94A3B8]">{t('preview.notFound')}</p>
        <Link href="/dashboard/shartnomalar">
          <Button variant="outline" size="sm">{t('preview.back')}</Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <style jsx global>{`
        body > nav, body > header, aside, .lg\\:pl-\\[260px\\] > header,
        .fixed.bottom-20, .fixed.bottom-36, .fixed.bottom-24, .fixed.bottom-6 {
        }
        @media print {
          body { background: white !important; }
          .preview-toolbar, header, aside, nav, .pwa-prompt,
          [aria-label*="Mira"], [aria-label*="yordamchi"],
          .fixed.bottom-20, .fixed.bottom-36, .fixed.bottom-24, .fixed.bottom-6 {
            display: none !important;
          }
          .preview-paper {
            box-shadow: none !important;
            margin: 0 !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="fixed inset-0 z-40 bg-[#1E293B] flex flex-col">
        <div className="preview-toolbar bg-[#0F172A] text-white border-b border-[#1E293B] flex items-center px-3 sm:px-4 h-14 gap-2 shrink-0">
          <Link href={`/dashboard/shartnomalar/${id}`}>
            <button className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm">
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">{t('preview.back')}</span>
            </button>
          </Link>

          <div className="h-6 w-px bg-white/10 mx-1" />

          <div className="flex items-center gap-2 min-w-0">
            <div className="text-lg shrink-0">{typeCfg?.icon ?? '📄'}</div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{contract.contractNumber}</p>
              <p className="text-[11px] text-white/50 leading-none truncate hidden sm:block">{typeName}</p>
            </div>
          </div>

          <div className="flex-1" />

          <div className="hidden md:flex items-center bg-white/5 rounded-lg">
            <button
              onClick={() => handleZoom(-1)}
              disabled={zoom <= ZOOM_LEVELS[0]}
              className="p-2 hover:bg-white/10 rounded-l-lg transition disabled:opacity-30"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-medium px-2 min-w-[50px] text-center">{zoom}%</span>
            <button
              onClick={() => handleZoom(1)}
              disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="p-2 hover:bg-white/10 rounded-r-lg transition disabled:opacity-30"
            >
              <ZoomIn size={14} />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="hidden md:block p-2 rounded-lg hover:bg-white/10 transition"
            title={fullscreen ? t('preview.fullscreenExit') : t('preview.fullscreen')}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          <div className="h-6 w-px bg-white/10 mx-1 hidden sm:block" />

          <button
            onClick={handlePrint}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            title={t('preview.print')}
          >
            <Printer size={14} />
            <span className="hidden lg:inline">{t('preview.print')}</span>
          </button>

          <button
            onClick={() => exportContractPdf(contract)}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            title={t('preview.pdf')}
          >
            <Download size={14} />
            <span className="hidden lg:inline">{t('preview.pdf')}</span>
          </button>

          <button
            onClick={() => exportContractDocx(contract)}
            className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1.5 text-sm"
            title={t('preview.word')}
          >
            <Download size={14} />
            <span className="hidden lg:inline">{t('preview.word')}</span>
          </button>

          <button
            onClick={() => setShareOpen(true)}
            className="ml-1 px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] transition flex items-center gap-1.5 text-sm font-medium"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">{t('preview.send')}</span>
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
            <div
              className="preview-paper bg-white shadow-2xl transition-transform origin-top"
              style={{
                width:     '794px',
                minHeight: '1123px',
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
                marginBottom: zoom !== 100 ? `${(zoom - 100) * 11}px` : 0,
              }}
              dangerouslySetInnerHTML={{ __html: renderContractHtml(contract) }}
            />
          </div>
        </div>
      </div>

      <ShareLinkModal
        contractId={id}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </>
  )
}
