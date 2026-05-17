'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations }              from 'next-intl'
import { Search, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input }  from '@/components/ui/Input'
import api        from '@/lib/api'
import { cn }     from '@/lib/cn'
import toast      from 'react-hot-toast'
import { getBankByMfo } from '@/lib/bankMfo'
import type { Counterparty } from '@/lib/types'

interface CpDropdownProps {
  cps:          Counterparty[]
  value:        string
  onChange:     (id: string, name: string) => void
  orgId:        string
  onCpCreated?: (cp: Counterparty) => void
}

export function CpDropdown({ cps, value, onChange, orgId, onCpCreated }: CpDropdownProps) {
  const t = useTranslations('cpDropdown')
  const [search,    setSearch]    = useState('')
  const [open,      setOpen]      = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [quickAdd,  setQuickAdd]  = useState(false)
  const [notFoundStir, setNotFoundStir] = useState<string | null>(null)
  const [newCp,     setNewCp]     = useState({ name: '', inn: '', directorName: '', address: '', phone: '', bankName: '', bankAccount: '', mfo: '' })
  const [savingCp,  setSavingCp]  = useState(false)
  const dropRef     = useRef<HTMLDivElement>(null)
  const prevStir    = useRef('')
  const prevQuickStir = useRef('')
  const isMounted   = useRef(true)

  // Component unmount bo'lganda — async setState'larni to'xtatish
  useEffect(() => {
    return () => { isMounted.current = false }
  }, [])

  const selectedCp = cps.find(c => c.id === value)

  useEffect(() => {
    if (selectedCp) setSearch(selectedCp.name)
  }, [selectedCp])

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const digs = search.replace(/\D/g, '')
    if (digs.length < 9) { prevStir.current = ''; return }
    if (digs.length !== 9 || digs === prevStir.current || loading || value) return
    prevStir.current = digs
    void lookupAndCreate(digs)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (!quickAdd) return
    const inn = newCp.inn
    if (inn.length < 9) { prevQuickStir.current = ''; return }
    if (inn.length !== 9 || inn === prevQuickStir.current || loading) return
    prevQuickStir.current = inn
    void handleStirLookup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCp.inn, quickAdd])

  async function lookupAndCreate(digs: string) {
    const existing = cps.find(c => (c.inn || '').replace(/\D/g, '') === digs)
    if (existing) {
      if (!isMounted.current) return
      onChange(existing.id, existing.name)
      setSearch(existing.name)
      setOpen(false)
      return
    }
    setLoading(true)
    try {
      const { data } = await api.get(`/stir/${digs}`)
      if (!isMounted.current) return
      const saved = await api.post('/counterparties', {
        organizationId: orgId,
        name: data.name, inn: digs,
        directorName: data.directorName || '',
        address: data.address || '',
        phone: data.phone || '',
      })
      if (!isMounted.current) return
      const cp = saved.data as Counterparty
      onCpCreated?.(cp)
      onChange(cp.id, cp.name)
      setSearch(cp.name)
      setOpen(false)
      toast.success(t('found', { name: cp.name }))
    } catch {
      if (!isMounted.current) return
      // Inline tasdiqlash — toast emas, balki dropdown ichida aniq xabar
      setNotFoundStir(digs)
      setOpen(true)
    } finally {
      if (isMounted.current) setLoading(false)
    }
  }

  const handleNotFoundYes = () => {
    if (!notFoundStir) return
    setNewCp(p => ({ ...p, inn: notFoundStir }))
    setQuickAdd(true)
    setNotFoundStir(null)
    setOpen(false)
  }

  const handleNotFoundNo = () => {
    setNotFoundStir(null)
    prevStir.current = ''  // qayta urinish uchun
    setSearch('')
  }

  const filtered = (() => {
    const q = search.toLowerCase().trim()
    if (!q) return cps.slice(0, 12)
    const digs = q.replace(/\D/g, '')
    return cps
      .map(cp => {
        const inn  = (cp.inn || '').replace(/\D/g, '')
        const name = cp.name.toLowerCase()
        let score = 0
        if (digs && inn.startsWith(digs))  score = 4
        else if (digs && inn.includes(digs)) score = 3
        else if (name.startsWith(q))       score = 2
        else if (name.includes(q))         score = 1
        return { cp, score }
      })
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(x => x.cp)
  })()

  async function handleEnter() {
    const digs = search.replace(/\D/g, '')
    if (digs.length === 9) { prevStir.current = digs; await lookupAndCreate(digs); return }
    if (filtered.length > 0) {
      onChange(filtered[0].id, filtered[0].name)
      setSearch(filtered[0].name)
      setOpen(false)
    }
  }

  async function handleStirLookup() {
    const inn = newCp.inn.trim()
    if (!/^\d{9}$/.test(inn)) { toast.error(t('stir9Required')); return }
    setLoading(true)
    try {
      const { data } = await api.get(`/stir/${inn}`)
      setNewCp(p => ({ ...p, name: data.name || p.name, directorName: data.directorName || p.directorName, address: data.address || p.address, phone: data.phone || p.phone }))
      toast.success(t('dataAutofilled'))
    } catch { toast.error(t('stirNotFoundShort')) }
    finally { setLoading(false) }
  }

  async function handleQuickAddSave() {
    if (!newCp.name.trim()) { toast.error(t('nameRequired')); return }
    setSavingCp(true)
    try {
      const { data } = await api.post('/counterparties', { organizationId: orgId, ...newCp })
      const cp = data as Counterparty
      onCpCreated?.(cp)
      onChange(cp.id, cp.name)
      setSearch(cp.name)
      setQuickAdd(false)
      setNewCp({ name: '', inn: '', directorName: '', address: '', phone: '', bankName: '', bankAccount: '', mfo: '' })
      toast.success(t('cpAdded'))
    } catch (e: any) { toast.error(e?.response?.data?.message || t('error')) }
    finally { setSavingCp(false) }
  }

  if (quickAdd) {
    return (
      <div className="border border-[#E2E8F0] rounded-xl p-4 space-y-3 bg-[#F8FAFC]">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-semibold text-[#0F172A]">{t('newCp')}</p>
          <button onClick={() => setQuickAdd(false)} className="text-[#94A3B8] hover:text-[#475569]"><X size={16} /></button>
        </div>
        <div className="flex gap-2">
          <Input label={t('stir')} placeholder={t('stirPlace')} value={newCp.inn}
            onChange={e => setNewCp(p => ({ ...p, inn: e.target.value.replace(/\D/g, '').slice(0, 9) }))}
            hint={t('stirHint')} />
          <div className="flex items-end pb-0.5">
            <Button size="sm" variant="secondary" loading={loading} onClick={handleStirLookup} disabled={newCp.inn.length !== 9}>
              <Search size={14} />
            </Button>
          </div>
        </div>
        <Input label={t('name')} value={newCp.name} onChange={e => setNewCp(p => ({ ...p, name: e.target.value }))} placeholder={t('namePlace')} />
        <Input label={t('director')} value={newCp.directorName} onChange={e => setNewCp(p => ({ ...p, directorName: e.target.value }))} placeholder={t('directorPlace')} />
        <Input label={t('address')} value={newCp.address} onChange={e => setNewCp(p => ({ ...p, address: e.target.value }))} />
        <div className="grid grid-cols-2 gap-3">
          <Input label={t('bank')} value={newCp.bankName} onChange={e => setNewCp(p => ({ ...p, bankName: e.target.value }))} />
          <Input label={t('mfo')} value={newCp.mfo} onChange={e => {
            const mfo = e.target.value.replace(/\D/g, '').slice(0, 5)
            const bank = mfo.length === 5 ? getBankByMfo(mfo) : null
            setNewCp(p => ({ ...p, mfo, ...(bank ? { bankName: bank } : {}) }))
          }} />
          <div className="col-span-2">
            <Input label={t('bankAccount')} value={newCp.bankAccount} onChange={e => setNewCp(p => ({ ...p, bankAccount: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2 pt-1">
          <Button size="sm" variant="outline" onClick={() => setQuickAdd(false)}>{t('cancel')}</Button>
          <Button size="sm" loading={savingCp} onClick={handleQuickAddSave} disabled={!newCp.name.trim()}>
            {t('save')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative" ref={dropRef}>
      <div className="relative">
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setOpen(!!e.target.value.trim() || true); if (e.target.value === '') onChange('', '') }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleEnter() } if (e.key === 'Escape') setOpen(false) }}
          placeholder={t('searchPlace')}
          disabled={loading}
          className={cn(
            'w-full h-10 rounded-lg text-sm pl-9 pr-3 border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 bg-white transition',
            loading && 'opacity-60 cursor-wait'
          )}
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]">
          {loading ? <Loader2 size={14} className="animate-spin text-[#2563EB]" /> : <Search size={14} />}
        </div>
        {value && (
          <button onClick={() => { onChange('', ''); setSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]">
            <X size={14} />
          </button>
        )}
      </div>
      {open && notFoundStir && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#FECACA] rounded-xl shadow-xl p-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-1">
            {t('notFoundTitle', { stir: notFoundStir })}
          </p>
          <p className="text-xs text-[#94A3B8] mb-3">
            {t('notFoundDesc')}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleNotFoundYes}
              className="flex-1 h-9 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1D4ED8] transition"
            >
              {t('notFoundYes')}
            </button>
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={handleNotFoundNo}
              className="flex-1 h-9 rounded-lg border border-[#E2E8F0] text-[#475569] text-sm font-medium hover:bg-[#F8FAFC] transition"
            >
              {t('notFoundNo')}
            </button>
          </div>
        </div>
      )}
      {open && !value && !notFoundStir && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-[#E2E8F0] rounded-xl shadow-xl max-h-56 overflow-y-auto">
          {filtered.map(cp => (
            <button key={cp.id} type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => { onChange(cp.id, cp.name); setSearch(cp.name); setOpen(false) }}
              className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#F8FAFC] transition border-b border-[#F1F5F9] last:border-0"
            >
              <p className="font-medium text-[#0F172A]">{cp.name}</p>
              {cp.inn && <p className="text-xs text-[#94A3B8]">{t('stirLabel')} {cp.inn}</p>}
            </button>
          ))}
          {filtered.length === 0 && search.trim() && (
            <div className="px-3 py-3 text-sm text-[#94A3B8]">
              {t('notFound')}{' '}
              <button className="text-[#2563EB] hover:underline" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); setQuickAdd(true); if (/^\d+$/.test(search.trim())) setNewCp(p => ({ ...p, inn: search.trim() })) }}>
                {t('addNew')}
              </button>
            </div>
          )}
          {filtered.length === 0 && !search.trim() && (
            <div className="px-3 py-3 text-sm text-[#94A3B8] text-center">
              <button className="text-[#2563EB] hover:underline" onMouseDown={e => e.preventDefault()} onClick={() => { setOpen(false); setQuickAdd(true) }}>
                {t('addNewCp')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
