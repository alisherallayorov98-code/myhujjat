'use client'

import { useState } from 'react'
import { Scale, Maximize2, ChevronLeft, Download, Printer } from 'lucide-react'
import { Card }        from '@/components/ui/Card'
import { Button }      from '@/components/ui/Button'
import { printText }   from '@/lib/printDocument'

interface Props {
  preview:  string
  loading:  boolean
  onExport: (type: 'pdf' | 'docx') => void
}

export function PreviewPanel({ preview, loading, onExport }: Props) {
  const [fullscreen, setFullscreen] = useState(false)

  return (
    <>
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-[#0F172A]">Ko'rib chiqish</p>
        <div className="flex gap-2">
          {preview && (
            <button
              onClick={() => setFullscreen(true)}
              className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-[#2563EB] border border-[#E2E8F0] hover:border-[#BFDBFE] px-2.5 py-1.5 rounded-lg transition-colors"
            >
              <Maximize2 size={12} /> To'liq ekran
            </button>
          )}
          {preview && (
            <>
              <Button size="xs" variant="outline" loading={loading} onClick={() => onExport('pdf')}>
                PDF
              </Button>
              <Button size="xs" variant="outline" loading={loading} onClick={() => onExport('docx')}>
                Word
              </Button>
            </>
          )}
        </div>
      </div>
      {preview ? (
        <div className="bg-[#F1F5F9] py-8 px-4 sm:px-8">
          <div
            className="bg-white shadow-md mx-auto p-10 sm:p-14 text-[#0F172A] rounded-sm whitespace-pre-wrap"
            style={{
              fontFamily: '"Times New Roman", serif',
              fontSize: 14,
              lineHeight: 1.8,
              maxWidth: 794,
              minHeight: 1100,
            }}
          >
            {preview}
          </div>
        </div>
      ) : (
        <div className="p-6 min-h-96 flex items-center justify-center text-[#94A3B8]">
          <div className="text-center">
            <Scale size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Hujjat ko'rinishi bu yerda chiqadi</p>
          </div>
        </div>
      )}
    </Card>

    {fullscreen && preview && (
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
          <p className="text-sm font-semibold">Hujjat ko'rinishi</p>
          <div className="flex-1" />
          <button onClick={() => printText(preview)} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
            <Printer size={14} /><span className="hidden sm:inline">Pechat</span>
          </button>
          <button onClick={() => onExport('pdf')} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
            <Download size={14} /><span className="hidden sm:inline">PDF</span>
          </button>
          <button onClick={() => onExport('docx')} className="p-2 rounded-lg hover:bg-white/10 transition text-sm flex items-center gap-1.5">
            <Download size={14} /><span className="hidden sm:inline">Word</span>
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <div className="min-h-full flex justify-center p-4 sm:p-8 lg:p-12">
            <div
              className="bg-white shadow-2xl p-12 whitespace-pre-wrap"
              style={{
                width: '794px',
                minHeight: '1123px',
                fontFamily: '"Times New Roman", serif',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              {preview}
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
