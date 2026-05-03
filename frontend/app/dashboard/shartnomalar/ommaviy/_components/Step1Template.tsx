'use client'

import { useTranslations } from 'next-intl'
import { useQuery }        from '@tanstack/react-query'
import { FileText, Edit3 } from 'lucide-react'
import { Card }            from '@/components/ui/Card'
import { Input, Textarea } from '@/components/ui/Input'
import { Select }          from '@/components/ui/Select'
import api                 from '@/lib/api'
import { useAuth }         from '@/hooks/useAuth'
import { cn }              from '@/lib/cn'
import type { BulkDraft }  from './types'

interface Props {
  draft: BulkDraft
  onChange: (patch: Partial<BulkDraft>) => void
}

const CONTRACT_TYPES = [
  'OLDI_SOTDI', 'XIZMAT', 'IJARA', 'PUDRAT', 'QOSHIMCHA', 'MOLIYAVIY',
  'DAVAL', 'XALQARO', 'AGENTLIK', 'TRANSPORT', 'LIZING', 'BOSHQA',
]

export function Step1Template({ draft, onChange }: Props) {
  const t  = useTranslations('bulkSend')
  const tc = useTranslations('contracts')
  const { currentOrg } = useAuth()

  const { data: templates = [] } = useQuery<any[]>({
    queryKey: ['templates', currentOrg?.id, draft.contractType],
    queryFn:  async () => {
      const { data } = await api.get('/templates', {
        params: { orgId: currentOrg?.id, contractType: draft.contractType },
      })
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const sourceMode = draft.customContent !== null ? 'custom' : 'template'

  const setSource = (mode: 'template' | 'custom') => {
    if (mode === 'custom') {
      onChange({ customContent: draft.customContent || '', templateId: null })
    } else {
      onChange({ customContent: null, templateId: draft.templateId })
    }
  }

  return (
    <div className="space-y-5">
      <Card>
        <Select
          label={t('step1ContractType')}
          value={draft.contractType}
          onChange={e => onChange({ contractType: e.target.value, templateId: null })}
          options={CONTRACT_TYPES.map(v => ({ value: v, label: tc(`types.${v}` as any) }))}
        />
      </Card>

      <Card>
        <p className="text-sm font-medium text-[#374151] mb-3">{t('step1Source')}</p>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            type="button"
            onClick={() => setSource('template')}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              sourceMode === 'template'
                ? 'border-[#2563EB] bg-[#EFF6FF]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
            )}
          >
            <FileText size={16} className="mb-1.5 text-[#2563EB]" />
            <p className="text-sm font-medium text-[#0F172A]">{t('step1SourceTemplate')}</p>
          </button>
          <button
            type="button"
            onClick={() => setSource('custom')}
            className={cn(
              'p-3 rounded-lg border text-left transition-all',
              sourceMode === 'custom'
                ? 'border-[#2563EB] bg-[#EFF6FF]'
                : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
            )}
          >
            <Edit3 size={16} className="mb-1.5 text-[#2563EB]" />
            <p className="text-sm font-medium text-[#0F172A]">{t('step1SourceCustom')}</p>
          </button>
        </div>

        {sourceMode === 'template' ? (
          <Select
            label={t('step1Template')}
            value={draft.templateId || ''}
            onChange={e => onChange({ templateId: e.target.value || null })}
            options={[
              { value: '',  label: t('step1TemplateNone') },
              ...templates.map(tpl => ({ value: tpl.id, label: tpl.name })),
            ]}
          />
        ) : (
          <Textarea
            label={t('step1CustomLabel')}
            hint={t('step1CustomHint')}
            value={draft.customContent || ''}
            onChange={e => onChange({ customContent: e.target.value })}
            rows={10}
            placeholder="OLDI-SOTDI SHARTNOMASI&#10;&#10;Toshkent shahri    {{SANA}}&#10;Shartnoma raqami: {{SHARTNOMA_RAQAMI}}&#10;..."
          />
        )}
      </Card>

      <Card>
        <div className="space-y-4">
          <Input
            type="number"
            label={t('step1Amount')}
            value={Number(draft.defaultAmount) || 0}
            onChange={e => onChange({ defaultAmount: Number(e.target.value) || 0 })}
            hint={t('step1AmountHint')}
            min={0}
          />
          <Input
            label={t('step1ProductName')}
            value={draft.defaultProductName || ''}
            onChange={e => onChange({ defaultProductName: e.target.value })}
          />
          <Input
            label={t('step1City')}
            value={draft.city}
            onChange={e => onChange({ city: e.target.value })}
          />
        </div>
      </Card>
    </div>
  )
}
