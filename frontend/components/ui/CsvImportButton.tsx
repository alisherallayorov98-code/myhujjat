'use client'

import { useRef, useState } from 'react'
import { Upload, X, CheckCircle } from 'lucide-react'
import { Button } from './Button'
import { parseCsvText, type ParsedRow } from '@/lib/import/csvImport'

interface ImportResult { ok: number; fail: number }

interface Props {
  /** Barcha satrlarni qabul qilib import qiladi, natija qaytaradi */
  onImport:  (rows: ParsedRow[]) => Promise<ImportResult>
  disabled?: boolean
  label?:    string
}

export function CsvImportButton({ onImport, disabled, label = 'CSV import' }: Props) {
  const fileRef                       = useRef<HTMLInputElement>(null)
  const [modalOpen,  setModal]        = useState(false)
  const [allRows,    setAllRows]      = useState<ParsedRow[]>([])
  const [preview,    setPreview]      = useState<ParsedRow[]>([])
  const [state,      setState]        = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [result,     setResult]       = useState<ImportResult | null>(null)

  function closeModal() {
    setModal(false)
    setState('idle')
    setResult(null)
    setAllRows([])
    setPreview([])
    if (fileRef.current) fileRef.current.value = ''
  }

  async function handleFile(file: File) {
    const text = await file.text()
    const rows = parseCsvText(text)
    if (rows.length === 0) {
      alert("CSV bo'sh yoki noto'g'ri format. Ustun nomlari birinchi qatorda bo'lishi kerak.")
      return
    }
    setAllRows(rows)
    setPreview(rows.slice(0, 5))
    setState('idle')
    setResult(null)
    setModal(true)
  }

  async function confirmImport() {
    setState('loading')
    try {
      const res = await onImport(allRows)
      setResult(res)
      setState('done')
    } catch {
      setState('error')
    }
  }

  const cols = Object.keys(preview[0] || {})

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv,.txt"
        className="hidden"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
        }}
      />

      <Button
        variant="outline"
        size="sm"
        leftIcon={<Upload size={14} />}
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      >
        {label}
      </Button>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2E8F0] shrink-0">
              <div>
                <h3 className="font-bold text-[#0F172A]">
                  {state === 'done' ? 'Import tugadi' : `${allRows.length} ta yozuv topildi`}
                </h3>
                {state !== 'done' && (
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Dastlabki 5 ta ko'rsatilmoqda — barchasi import qilinadi
                  </p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto px-5 py-4">
              {state === 'done' && result ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CheckCircle size={44} className="text-[#16A34A]" />
                  <p className="text-lg font-bold text-[#0F172A]">
                    {result.ok} ta muvaffaqiyatli import qilindi
                  </p>
                  {result.fail > 0 && (
                    <p className="text-sm text-[#DC2626]">
                      {result.fail} ta yozuv xatolik bilan o'tkazib yuborildi
                    </p>
                  )}
                  <Button size="sm" onClick={closeModal} className="mt-2">
                    Yopish
                  </Button>
                </div>
              ) : state === 'error' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-[#DC2626] font-medium">Import paytida xatolik yuz berdi</p>
                  <Button variant="outline" size="sm" onClick={() => setState('idle')}>
                    Qayta urinish
                  </Button>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
                  <table className="w-full text-xs">
                    <thead className="bg-[#F8FAFC]">
                      <tr>
                        {cols.map(k => (
                          <th key={k} className="px-3 py-2.5 text-left font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((row, i) => (
                        <tr key={i} className="border-t border-[#E2E8F0] hover:bg-[#F8FAFC]">
                          {cols.map(k => (
                            <td key={k} className="px-3 py-2 text-[#374151] max-w-[160px] truncate">
                              {row[k] || <span className="text-[#CBD5E1]">—</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer */}
            {state !== 'done' && state !== 'error' && (
              <div className="flex gap-2 justify-end px-5 py-4 border-t border-[#E2E8F0] bg-[#F8FAFC] rounded-b-2xl shrink-0">
                <Button variant="outline" size="sm" onClick={closeModal}>
                  Bekor
                </Button>
                <Button size="sm" loading={state === 'loading'} onClick={confirmImport}>
                  Import boshlash ({allRows.length} ta)
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
