'use client'

import { useState }                                from 'react'
import { useTranslations }                         from 'next-intl'
import { useQuery }                                from '@tanstack/react-query'
import { ArrowLeft, Sparkles, Download, Copy, Check } from 'lucide-react'
import { Card }                                    from '@/components/ui/Card'
import { Button }                                  from '@/components/ui/Button'
import { Input }                                   from '@/components/ui/Input'
import { useAuth }                                 from '@/hooks/useAuth'
import api                                         from '@/lib/api'
import { exportContractPdf  }                      from '@/lib/export/contractPdf'
import { exportContractDocx }                      from '@/lib/export/contractDocx'
import { fillPrompt, type FeatureConfig }          from '@/lib/dynamicFeatures'
import { cn }                                      from '@/lib/cn'
import toast                                       from 'react-hot-toast'

interface Props {
  features: FeatureConfig[]
}

export function DynamicFeatureRunner({ features }: Props) {
  const t = useTranslations('seifAi')
  const { currentOrg, isPro } = useAuth()
  const [selected, setSelected] = useState<FeatureConfig | null>(null)
  const [values,   setValues]   = useState<Record<string, string>>({})
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)

  // Kontragentlar (isCpField uchun)
  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', currentOrg?.id],
    queryFn:  () => api.get(`/counterparties?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  function pick(feature: FeatureConfig) {
    setSelected(feature)
    setValues({})
    setResult('')
  }

  function back() {
    setSelected(null)
    setValues({})
    setResult('')
  }

  function set(key: string, val: string) {
    setValues(v => ({ ...v, [key]: val }))
  }

  async function generate() {
    if (!selected || !currentOrg?.id) return
    if (!isPro) { toast.error(t('lockTitle')); return }

    // Validate required fields
    const missing = selected.fields.find(f => f.required && !values[f.key]?.trim())
    if (missing) {
      toast.error(`${missing.label} — to'ldirilishi shart`)
      return
    }

    setLoading(true)
    setResult('')
    try {
      const prompt = fillPrompt(selected.promptTemplate, values)
      const orgData: Record<string, string> = {
        Nomi:    currentOrg.name             || '',
        STIR:    (currentOrg as any).inn     || '',
        Rahbar:  (currentOrg as any).directorName || '',
        Bank:    (currentOrg as any).bankName     || '',
        Manzil:  (currentOrg as any).address      || '',
        Telefon: (currentOrg as any).phone        || '',
      }
      const { data } = await api.post('/ai/generate', {
        orgId:   currentOrg.id,
        docType: selected.docType,
        prompt,
        orgData,
      })
      setResult(data.content)
      toast.success(t('docCreated'))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(t('copyToast'))
  }

  // ── PICKER ─────────────────────────────────────────────
  if (!selected) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map(f => (
          <button
            key={f.key}
            onClick={() => pick(f)}
            className="p-5 rounded-xl bg-white border-2 border-[#E2E8F0] hover:border-[#2563EB]/40 hover:shadow-md transition-all text-left group"
          >
            <div className="w-12 h-12 rounded-xl bg-[#F1F5F9] group-hover:bg-[#DBEAFE] flex items-center justify-center text-2xl mb-3 transition-colors">
              {f.icon}
            </div>
            <p className="font-semibold text-[#0F172A] mb-1">{f.title}</p>
            <p className="text-xs text-[#94A3B8] leading-relaxed">{f.description}</p>
          </button>
        ))}
      </div>
    )
  }

  // ── FORM + RESULT ───────────────────────────────────────
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#DBEAFE] flex items-center justify-center text-lg">
              {selected.icon}
            </div>
            <div>
              <h3 className="font-semibold text-[#0F172A]">{selected.title}</h3>
              <p className="text-xs text-[#94A3B8]">{selected.description}</p>
            </div>
          </div>
          <button
            onClick={back}
            className="p-2 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition"
            title="Orqaga"
          >
            <ArrowLeft size={16} />
          </button>
        </div>

        <div className="space-y-3">
          {selected.fields.map(field => {
            const val = values[field.key] || ''

            if (field.isCpField) {
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#374151]">
                    {field.label}{field.required && ' *'}
                  </label>
                  <select
                    value={val}
                    onChange={e => set(field.key, e.target.value)}
                    className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">{field.placeholder || 'Tanlang'}</option>
                    {cps.map(cp => (
                      <option key={cp.id} value={cp.name}>{cp.name}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.type === 'select') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#374151]">
                    {field.label}{field.required && ' *'}
                  </label>
                  <select
                    value={val}
                    onChange={e => set(field.key, e.target.value)}
                    className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="">Tanlang</option>
                    {field.options?.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              )
            }

            if (field.type === 'textarea') {
              return (
                <div key={field.key} className="space-y-1.5">
                  <label className="block text-sm font-medium text-[#374151]">
                    {field.label}{field.required && ' *'}
                  </label>
                  <textarea
                    value={val}
                    onChange={e => set(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                    className="w-full rounded-lg text-sm px-3 py-2 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] resize-none"
                  />
                  {field.hint && <p className="text-xs text-[#94A3B8]">{field.hint}</p>}
                </div>
              )
            }

            return (
              <Input
                key={field.key}
                label={field.label + (field.required ? ' *' : '')}
                placeholder={field.placeholder}
                type={field.type || 'text'}
                value={val}
                onChange={e => set(field.key, e.target.value)}
                hint={field.hint}
                required={field.required}
              />
            )
          })}
        </div>

        <Button
          fullWidth
          loading={loading}
          leftIcon={loading ? undefined : <Sparkles size={15} />}
          onClick={generate}
          className="mt-4"
        >
          {loading ? t('generating') : t('generateBtn')}
        </Button>
      </Card>

      {/* RESULT */}
      <Card padding="none" className="flex flex-col min-h-[500px]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <p className="text-sm font-semibold text-[#0F172A]">
            {result ? selected.title : t('resultPreview')}
          </p>
          {result && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]"
              >
                {copied ? <><Check size={11} className="text-[#16A34A]" /> {t('copied')}</> : <><Copy size={11} /> {t('copy')}</>}
              </button>
              <button
                onClick={() => exportContractPdf({ title: selected.title, content: result, orgName: currentOrg?.name })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-[#2563EB] text-white hover:bg-[#1E40AF]"
              >
                <Download size={11} /> PDF
              </button>
              <button
                onClick={() => exportContractDocx({ title: selected.title, content: result, orgName: currentOrg?.name })}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F1F5F9]"
              >
                <Download size={11} /> Word
              </button>
            </div>
          )}
        </div>
        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2563EB] flex items-center justify-center">
                <Sparkles size={20} className="text-white animate-pulse" />
              </div>
              <p className="text-sm text-[#475569]">{t('loadingTitle')}</p>
              <p className="text-xs text-[#94A3B8]">{t('loadingHint')}</p>
            </div>
          ) : result ? (
            <pre
              className="whitespace-pre-wrap leading-relaxed text-[#0F172A]"
              style={{ fontFamily: '"Times New Roman", serif', fontSize: 13, lineHeight: 1.7 }}
            >
              {result}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-[#94A3B8]">
              <Sparkles size={28} className="opacity-30" />
              <p className="text-sm">{t('emptyHint')}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
