'use client'

import { Scale } from 'lucide-react'
import { Card }   from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

interface Props {
  preview:  string
  loading:  boolean
  onExport: (type: 'pdf' | 'docx') => void
}

export function PreviewPanel({ preview, loading, onExport }: Props) {
  return (
    <Card padding="none">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <p className="text-sm font-semibold text-[#0F172A]">Ko'rib chiqish</p>
        {preview && (
          <div className="flex gap-2">
            <Button size="xs" variant="outline" loading={loading} onClick={() => onExport('pdf')}>
              PDF
            </Button>
            <Button size="xs" variant="outline" loading={loading} onClick={() => onExport('docx')}>
              Word
            </Button>
          </div>
        )}
      </div>
      <div className="p-6 min-h-96 overflow-auto max-h-[600px]">
        {preview ? (
          <pre
            className="whitespace-pre-wrap leading-relaxed text-[#0F172A]"
            style={{ fontFamily: '"Times New Roman", serif', fontSize: '12px', lineHeight: '1.8' }}
          >
            {preview}
          </pre>
        ) : (
          <div className="flex items-center justify-center h-64 text-[#94A3B8]">
            <div className="text-center">
              <Scale size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Hujjat ko'rinishi bu yerda chiqadi</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
