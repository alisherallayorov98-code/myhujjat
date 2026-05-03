'use client'

import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { calcSpecItem, newSpecItem, BIRLIKLAR, QQS_OPTIONS, isValidMxik, type SpecItem } from '@/lib/qqs'
import { cn } from '@/lib/cn'

interface Props {
  items:    SpecItem[]
  onChange: (items: SpecItem[]) => void
}

export function SpecTable({ items, onChange }: Props) {
  const t = useTranslations('contracts.spec')

  function update(i: number, key: keyof SpecItem, val: string | number) {
    const updated = items.map((item, idx) => {
      if (idx !== i) return item
      const merged = { ...item, [key]: val }
      const { qqsSumma, summa } = calcSpecItem(
        key === 'miqdori' ? Number(val) : merged.miqdori,
        key === 'narxi'   ? Number(val) : merged.narxi,
        key === 'qqsFoiz' ? (val as any) : merged.qqsFoiz
      )
      return { ...merged, qqsSumma, summa }
    })
    onChange(updated)
  }

  function add() { onChange([...items, newSpecItem()]) }
  function remove(i: number) { onChange(items.filter((_, idx) => idx !== i)) }

  const jami    = items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const jamiQqs = items.reduce((s, i) => s + i.qqsSumma, 0)
  const umumiy  = items.reduce((s, i) => s + i.summa, 0)

  const fmt = (n: number) => n > 0 ? n.toLocaleString('uz-UZ') : '—'
  const missingMxik = items.some(item =>
    item.nomi.trim() && !isValidMxik(item.mxikKodi)
  )

  return (
    <div className="space-y-3">
      {missingMxik && (
        <div className="flex items-start gap-2 p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg text-xs">
          <AlertCircle size={14} className="text-[#D97706] shrink-0 mt-0.5" />
          <p className="text-[#92400E]">
            <strong>MXIK kodi majburiy.</strong> Soliq tizimi talabiga ko'ra har bir tovar/xizmat uchun
            Mahsulot va xizmatlar yagona milliy katalogi (MXIK) kodi kiritilishi kerak.
            Kod 10-15 raqamdan iborat bo'ladi.
          </p>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[#E2E8F0]">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-8">#</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold min-w-[180px]">Nomi *</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-32">MXIK *</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-20">Birlik</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-20">Miqdor</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-28">Narx</th>
              <th className="px-3 py-2.5 text-center text-[#94A3B8] font-semibold w-20">QQS</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-28">Summa</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {items.map((item, i) => {
              const mxikInvalid = item.nomi.trim() && !isValidMxik(item.mxikKodi)
              return (
              <tr key={i} className="hover:bg-[#F8FAFC] group">
                <td className="px-3 py-2 text-[#94A3B8]">{i + 1}</td>
                <td className="px-3 py-2">
                  <input
                    value={item.nomi}
                    onChange={e => update(i, 'nomi', e.target.value)}
                    placeholder="Tovar/xizmat nomi"
                    className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none px-0.5 text-[#0F172A] transition"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={item.mxikKodi || ''}
                    onChange={e => update(i, 'mxikKodi', e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="0252300200123"
                    className={cn(
                      'w-full bg-transparent border-b font-mono tabular-nums focus:outline-none px-0.5 transition',
                      mxikInvalid
                        ? 'border-[#DC2626] text-[#DC2626] placeholder:text-[#DC2626]/50'
                        : 'border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] text-[#0F172A]',
                    )}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.birlik}
                    onChange={e => update(i, 'birlik', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#475569] transition"
                  >
                    {BIRLIKLAR.map(b => <option key={b}>{b}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0"
                    value={item.miqdori || ''}
                    onChange={e => update(i, 'miqdori', parseFloat(e.target.value) || 0)}
                    className="w-full text-right bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#0F172A] transition"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0"
                    value={item.narxi || ''}
                    onChange={e => update(i, 'narxi', parseFloat(e.target.value) || 0)}
                    className="w-full text-right bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#0F172A] transition"
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.qqsFoiz}
                    onChange={e => update(i, 'qqsFoiz', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#475569] transition text-center"
                  >
                    {QQS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2 text-right font-medium text-[#0F172A]">
                  {fmt(item.summa)}
                </td>
                <td className="px-2 py-2">
                  <button onClick={() => remove(i)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all">
                    <Trash2 size={12} />
                  </button>
                </td>
              </tr>
              )
            })}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <tr>
                <td colSpan={9} className="px-3 py-2.5">
                  <div className="flex justify-end items-center gap-5 text-xs flex-wrap">
                    <span className="text-[#94A3B8]">Jami (QQSsiz): <strong className="text-[#0F172A] ml-1">{fmt(jami)}</strong></span>
                    <span className="text-[#94A3B8]">QQS: <strong className="text-[#0F172A] ml-1">{fmt(jamiQqs)}</strong></span>
                    <span className="text-[#475569]">Umumiy: <strong className="text-[#2563EB] ml-1 text-sm">{fmt(umumiy)}</strong></span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      <button
        onClick={add}
        className="flex items-center gap-1.5 text-sm text-[#2563EB] hover:text-[#1D4ED8] transition font-medium"
      >
        <Plus size={15} /> Qator qo'shish
      </button>
    </div>
  )
}
