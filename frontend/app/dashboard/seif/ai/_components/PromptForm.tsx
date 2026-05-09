'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import { Card }    from '@/components/ui/Card'
import { Button }  from '@/components/ui/Button'
import { EXAMPLE_PROMPTS } from './constants'

interface Props {
  docType:    string
  prompt:     string
  setPrompt:  (v: string) => void
  loading:    boolean
  streaming?: boolean
  onGenerate: () => void
}

export function PromptForm({ docType, prompt, setPrompt, loading, streaming, onGenerate }: Props) {
  const t = useTranslations('seifAi')
  const examples = EXAMPLE_PROMPTS[docType] || []

  return (
    <Card>
      <p className="text-sm font-semibold text-[#0F172A] mb-1">{t('promptTitle')}</p>
      <p className="text-xs text-[#94A3B8] mb-3">
        {t('promptHint')}
      </p>

      {examples.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {examples.map((ex, i) => (
            <button
              key={i}
              onClick={() => setPrompt(ex)}
              className="w-full text-left px-3 py-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-xs text-[#475569] hover:bg-[#DBEAFE]/30 hover:border-[#2563EB]/30 transition-all"
            >
              💡 {ex}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        placeholder={t('promptPlace', { type: docType })}
        className="w-full h-32 rounded-lg text-sm px-3 py-2.5 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 resize-none text-[#0F172A] placeholder:text-[#CBD5E1]"
      />

      <Button
        fullWidth size="md"
        loading={loading}
        disabled={streaming}
        leftIcon={(loading || streaming) ? undefined : <Sparkles size={16} />}
        onClick={onGenerate}
        className="mt-3"
      >
        {(loading || streaming) ? t('generating') : t('generateBtn')}
      </Button>
    </Card>
  )
}
