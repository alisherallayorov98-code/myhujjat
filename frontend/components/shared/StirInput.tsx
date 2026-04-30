'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, CheckCircle2, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import { Input }   from '@/components/ui/Input'
import { Button }  from '@/components/ui/Button'
import { Badge }   from '@/components/ui/Badge'
import { cn }      from '@/lib/cn'
import api         from '@/lib/api'

export interface StirData {
  name:              string
  fullName:          string
  inn:               string
  directorName:      string
  directorPinfl:     string
  accountantName:    string
  address:           string
  postcode:          string
  phone:             string
  qqsreg:            string
  status:            'active' | 'inactive' | 'unknown' | ''
  statusText:        string
  oked:              string
  okedName:          string
  opfName:           string
  taxMode:           string
  ustavCapital:      number | null
  businessStructure: string
  regDate:           string
}

interface StirInputProps {
  value:       string
  onChange:    (val: string) => void
  onData?:     (data: StirData) => void
  label?:      string
  placeholder?: string
  className?:  string
  autoSearch?: boolean   // 9 raqam kirishida avtomatik qidirish
}

export function StirInput({
  value, onChange, onData,
  label = 'STIR',
  placeholder = '123456789',
  className,
  autoSearch = true,
}: StirInputProps) {
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState<StirData | null>(null)
  const [error,    setError]    = useState('')
  const [expanded, setExpanded] = useState(false)
  const prevVal = useRef('')

  // 9 raqam bo'lganda avtomatik qidirish
  useEffect(() => {
    const clean = value.replace(/\D/g, '')
    if (autoSearch && clean.length === 9 && clean !== prevVal.current) {
      prevVal.current = clean
      doSearch(clean)
    }
    if (clean.length < 9) {
      setResult(null)
      setError('')
      prevVal.current = ''
    }
  }, [value, autoSearch])

  const doSearch = async (inn: string) => {
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const { data } = await api.get(`/stir/${inn}`)
      setResult(data)
      setExpanded(false)
      onData?.(data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || "STIR bo'yicha ma'lumot topilmadi"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleInput = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 9)
    onChange(clean)
  }

  const handleManualSearch = () => {
    const clean = value.replace(/\D/g, '')
    if (clean.length === 9) {
      prevVal.current = clean
      doSearch(clean)
    }
  }

  const isReady = value.replace(/\D/g, '').length === 9

  return (
    <div className={cn('space-y-2', className)}>
      {/* Input + tugma */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input
            label={label}
            placeholder={placeholder}
            value={value}
            onChange={e => handleInput(e.target.value)}
            hint={autoSearch ? '9 raqam kiritilganda avtomatik qidiradi' : undefined}
            error={error}
            leftIcon={
              loading
                ? <Loader2 size={14} className="animate-spin text-[#2563EB]" />
                : <Search size={14} className="text-[#94A3B8]" />
            }
            rightElement={result ? (
              <div className="h-10 px-2 flex items-center">
                {result.status === 'active'
                  ? <CheckCircle2 size={16} className="text-[#16A34A]" />
                  : <XCircle size={16} className="text-[#DC2626]" />
                }
              </div>
            ) : undefined}
          />
        </div>
        {!autoSearch && (
          <Button
            size="sm"
            variant="secondary"
            loading={loading}
            disabled={!isReady}
            onClick={handleManualSearch}
            className="mb-0.5 shrink-0"
          >
            Tekshirish
          </Button>
        )}
        {autoSearch && isReady && !loading && (
          <Button
            size="sm"
            variant="secondary"
            onClick={handleManualSearch}
            className="mb-0.5 shrink-0"
            title="Qayta qidirish"
          >
            ↺
          </Button>
        )}
      </div>

      {/* Natija kartochkasi */}
      {result && (
        <div className={cn(
          'rounded-xl border p-3 text-sm transition-all',
          result.status === 'active'
            ? 'bg-[#F0FDF4] border-[#BBF7D0]'
            : 'bg-[#FFF7ED] border-[#FED7AA]'
        )}>
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#0F172A] leading-tight truncate">{result.name}</p>
              {result.opfName && (
                <p className="text-xs text-[#94A3B8] mt-0.5">{result.opfName}</p>
              )}
            </div>
            <Badge
              variant={result.status === 'active' ? 'success' : 'warning'}
              dot size="sm"
            >
              {result.status === 'active' ? 'Faol' : result.statusText || 'Nofaol'}
            </Badge>
          </div>

          {/* Asosiy ma'lumotlar */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#475569] mb-2">
            {result.directorName && (
              <p>Rahbar: <span className="font-medium text-[#0F172A]">{result.directorName}</span></p>
            )}
            {result.taxMode && (
              <p>Soliq: <span className="font-medium text-[#0F172A] capitalize">{result.taxMode}</span></p>
            )}
            {result.address && (
              <p className="col-span-2">Manzil: <span className="font-medium text-[#0F172A]">{result.address}</span></p>
            )}
          </div>

          {/* Kengaytirilgan ma'lumotlar */}
          {expanded && (
            <div className="border-t border-[#E2E8F0] pt-2 mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#475569]">
              {result.accountantName && (
                <p>Hisobchi: <span className="font-medium text-[#0F172A]">{result.accountantName}</span></p>
              )}
              {result.qqsreg && (
                <p>QQS raqami: <span className="font-medium text-[#0F172A]">{result.qqsreg}</span></p>
              )}
              {result.okedName && (
                <p className="col-span-2">Faoliyat: <span className="font-medium text-[#0F172A]">{result.okedName}</span></p>
              )}
              {result.regDate && (
                <p>Ro'yxat sanasi: <span className="font-medium text-[#0F172A]">{result.regDate}</span></p>
              )}
              {result.ustavCapital != null && (
                <p>Ustav kapitali: <span className="font-medium text-[#0F172A]">
                  {Number(result.ustavCapital).toLocaleString()} so'm
                </span></p>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {expanded ? "Kamroq" : "Ko'proq"}
            </button>
            {onData && (
              <Button
                size="xs"
                variant="success"
                onClick={() => onData(result)}
                className="ml-auto"
              >
                ✓ Qabul qilish
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ============================================================
   JSHSHIR (PINFL) INPUT
   ============================================================ */
export interface JshshirData {
  fullName: string
  pinfl:    string
  address:  string
  status:   string
}

interface JshshirInputProps {
  value:    string
  onChange: (val: string) => void
  onData?:  (data: JshshirData) => void
  label?:   string
  className?: string
}

export function JshshirInput({
  value, onChange, onData,
  label = 'JSHSHIR',
  className,
}: JshshirInputProps) {
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState<JshshirData | null>(null)
  const [error,   setError]   = useState('')
  const prevVal = useRef('')

  useEffect(() => {
    const clean = value.replace(/\D/g, '')
    if (clean.length === 14 && clean !== prevVal.current) {
      prevVal.current = clean
      doSearch(clean)
    }
    if (clean.length < 14) {
      setResult(null)
      setError('')
      prevVal.current = ''
    }
  }, [value])

  const doSearch = async (pinfl: string) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get(`/stir/pinfl/${pinfl}`)
      setResult(data)
      onData?.(data)
    } catch (err: any) {
      const msg = err?.response?.data?.message || "JSHSHIR bo'yicha ma'lumot topilmadi"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        label={label}
        placeholder="12345678901234"
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, '').slice(0, 14))}
        hint="14 ta raqam — avtomatik qidiradi"
        error={error}
        leftIcon={
          loading
            ? <Loader2 size={14} className="animate-spin text-[#2563EB]" />
            : <Search size={14} className="text-[#94A3B8]" />
        }
      />
      {result && (
        <div className="p-2.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg text-xs text-[#475569]">
          <p className="font-bold text-[#0F172A] mb-0.5">{result.fullName}</p>
          {result.address && <p>Manzil: {result.address}</p>}
        </div>
      )}
    </div>
  )
}
