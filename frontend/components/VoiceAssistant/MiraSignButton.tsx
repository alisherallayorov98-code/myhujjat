'use client'

/**
 * MiraSignButton — Mira chat ichida shartnomani imzolash uchun trigger.
 *
 * E-IMZO kalit BRAUZERDA turadi (xavfsizlik). Server hech qachon kalitni ko'rmaydi,
 * faqat imzolangan PKCS7 ni qabul qiladi va STIR kalit bo'yicha tekshiradi.
 */

import { useState }              from 'react'
import { Shield, CheckCircle2 }  from 'lucide-react'
import { useTranslations }       from 'next-intl'
import { EimzoSign }             from '@/components/EimzoSign/EimzoSign'

interface Props {
  contractId:     string
  contractNumber: string
  onSigned:       () => void
}

export function MiraSignButton({ contractId, contractNumber, onSigned }: Props) {
  const t = useTranslations('eimzoSign')
  const [signed, setSigned] = useState(false)

  if (signed) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[#15803D]">
        <CheckCircle2 size={12} className="shrink-0" />
        <span>{contractNumber} — {t('successMsg')}</span>
      </div>
    )
  }

  return (
    <div className="space-y-1.5">
      <p className="text-xs text-[#475569]">№ {contractNumber}</p>
      <EimzoSign
        contractId={contractId}
        signerType="us"
        onSigned={() => { setSigned(true); onSigned() }}
      />
    </div>
  )
}
