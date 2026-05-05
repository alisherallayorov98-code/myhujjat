'use client'

import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import {
  calcSpecItem, newSpecItem,
  BIRLIKLAR, QQS_OPTIONS,
  type SpecItem, type QqsFoiz,
} from '@/lib/qqs'
import { formatNumber } from '@/lib/formatters'

interface Props {
  items:    SpecItem[]
  onChange: (items: SpecItem[]) => void
}

export function SpecTable({ items, onChange }: Props) {
  const t = useTranslations('specifications')

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
  function remove(i: number) {
    const removed = items[i]
    const next    = items.filter((_, idx) => idx !== i)
    onChange(next)
    toast((tt) => (
      <span className="flex items-center gap-2">
        <span className="text-sm">Qator o&apos;chirildi</span>
        <button
          onClick={() => {
            const restored = [...next.slice(0, i), removed, ...next.slice(i)]
            onChange(restored)
            toast.dismiss(tt.id)
          }}
          className="text-[#2563EB] font-medium text-sm hover:underline"
        >
          Bekor qilish
        </button>
      </span>
    ), { duration: 5000 })
  }

  // "Barchasi uchun QQS" — bir bosish bilan barcha qatorlarga tegishli foiz qo'llaniladi
  function setAllQqs(foiz: QqsFoiz) {
    if (items.length === 0) return
    const updated = items.map(item => {
      const calc = calcSpecItem(item.miqdori, item.narxi, foiz)
      return { ...item, qqsFoiz: foiz, qqsSumma: calc.qqsSumma, summa: calc.summa }
    })
    onChange(updated)
    toast.success(t('toast.qqsApplied', { rate: foiz === 'siz' ? '0%' : foiz + '%' }))
  }

  const jami    = items.reduce((s, i) => s + i.miqdori * i.narxi, 0)
  const jamiQqs = items.reduce((s, i) => s + i.qqsSumma, 0)
  const umumiy  = items.reduce((s, i) => s + i.summa, 0)

  const fmt = (n: number) => n > 0 ? formatNumber(n) : '—'

  return (
    <div className="rounded-xl border border-[#E2E8F0] overflow-hidden">
      {/* Toolbar — "Barchasi uchun QQS" tezkor tugmalar + qatorlar soni */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
            {t('itemsTitle')}
          </p>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#E2E8F0] text-[#475569] tabular-nums">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-[#94A3B8]">{t('allQqs')}:</span>
          {(['siz', '0', '12', '15'] as QqsFoiz[]).map(foiz => (
            <button
              key={foiz}
              type="button"
              onClick={() => setAllQqs(foiz)}
              disabled={items.length === 0}
              className="text-xs px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#DBEAFE] hover:text-[#1D4ED8] hover:border-[#BFDBFE] transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {foiz === 'siz' ? t('qqsLess') : foiz + '%'}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-white border-b border-[#E2E8F0]">
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-8">#</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold min-w-[180px]">{t('table.nameRequired')}</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-32">MXIK</th>
              <th className="px-3 py-2.5 text-left text-[#94A3B8] font-semibold w-20">{t('table.unit')}</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-20">{t('table.qty')}</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-28">{t('table.price')}</th>
              <th className="px-3 py-2.5 text-center text-[#94A3B8] font-semibold w-20">{t('table.qqs')}</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-28">{t('table.qqsAmount')}</th>
              <th className="px-3 py-2.5 text-right text-[#94A3B8] font-semibold w-28">{t('table.summa')}</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {items.map((item, i) => (
              <tr key={i} className="hover:bg-[#F8FAFC] group">
                <td className="px-3 py-2 text-[#94A3B8]">{i + 1}</td>
                <td className="px-3 py-2">
                  <input
                    value={item.nomi}
                    onChange={e => update(i, 'nomi', e.target.value)}
                    placeholder={t('form.namePlaceholder')}
                    className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none px-0.5 text-[#0F172A] transition"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={item.mxikKodi || ''}
                    onChange={e => update(i, 'mxikKodi', e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="ixtiyoriy"
                    className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none px-0.5 text-[#0F172A] font-mono tabular-nums placeholder:text-[#CBD5E1] placeholder:italic transition"
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
                    className="w-full text-right bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#0F172A] tabular-nums transition"
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" min="0"
                    value={item.narxi || ''}
                    onChange={e => update(i, 'narxi', parseFloat(e.target.value) || 0)}
                    className="w-full text-right bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#2563EB] focus:outline-none text-[#0F172A] tabular-nums transition"
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
                <td className="px-3 py-2 text-right tabular-nums text-[#D97706]">
                  {item.qqsSumma > 0 ? formatNumber(item.qqsSumma) : '—'}
                </td>
                <td className="px-3 py-2 text-right font-medium text-[#0F172A] tabular-nums">
                  {fmt(item.summa)}
                </td>
                <td className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    aria-label="Qatorni o'chirish"
                    className="md:opacity-0 md:group-hover:opacity-100 p-2 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          {items.length > 0 && (
            <tfoot className="bg-[#F8FAFC] border-t border-[#E2E8F0]">
              <tr>
                <td colSpan={10} className="px-3 py-2.5">
                  <div className="flex justify-end items-center gap-5 text-xs flex-wrap">
                    <span className="text-[#94A3B8]">{t('withoutQqs')} <strong className="text-[#0F172A] ml-1 tabular-nums">{fmt(jami)}</strong></span>
                    <span className="text-[#94A3B8]">{t('totalQqs')} <strong className="text-[#D97706] ml-1 tabular-nums">{fmt(jamiQqs)}</strong></span>
                    <span className="text-[#475569]">{t('grandTotal')} <strong className="text-[#2563EB] ml-1 text-sm tabular-nums">{fmt(umumiy)}</strong></span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <button
        type="button"
        onClick={add}
        className="w-full py-3 text-sm text-[#2563EB] hover:bg-[#DBEAFE]/30 transition-colors flex items-center justify-center gap-2 border-t border-[#E2E8F0]"
      >
        <Plus size={15} /> {t('addRow')}
      </button>
    </div>
  )
}
