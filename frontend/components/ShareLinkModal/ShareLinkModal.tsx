'use client'

import { useState, useEffect } from 'react'
import { useTranslations }      from 'next-intl'
import {
  Share2, Copy, Check, ExternalLink, Trash2,
  Loader2, Calendar, Eye, CheckCircle2, X,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal }   from '@/components/ui/Modal'
import { Button }  from '@/components/ui/Button'
import { Input }   from '@/components/ui/Input'
import api         from '@/lib/api'
import { formatDate } from '@/lib/formatters'
import { cn }      from '@/lib/cn'
import toast       from 'react-hot-toast'

interface ShareLink {
  id:             string
  token:          string
  recipientName:  string | null
  recipientEmail: string | null
  recipientPhone: string | null
  viewedAt:       string | null
  viewCount:      number
  signedAt:       string | null
  signerName:     string | null
  expiresAt:      string
  createdAt:      string
}

interface Props {
  contractId: string
  open:       boolean
  onClose:    () => void
}

export function ShareLinkModal({ contractId, open, onClose }: Props) {
  const t = useTranslations('shareLinkModal')
  const qc = useQueryClient()
  const [name,    setName]    = useState('')
  const [email,   setEmail]   = useState('')
  const [phone,   setPhone]   = useState('')
  const [days,    setDays]    = useState(30)
  const [copied,  setCopied]  = useState<string | null>(null)

  const { data: links = [], isLoading } = useQuery<ShareLink[]>({
    queryKey: ['share-links', contractId],
    queryFn:  () => api.get(`/share-links/contract/${contractId}`).then(r => r.data),
    enabled:  open,
  })

  const createMut = useMutation({
    mutationFn: () => api.post('/share-links', {
      contractId,
      recipientName:  name.trim()  || undefined,
      recipientEmail: email.trim() || undefined,
      recipientPhone: phone.trim() || undefined,
      expiresInDays:  days,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links', contractId] })
      toast.success(t('linkCreated'))
      setName(''); setEmail(''); setPhone('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/share-links/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['share-links', contractId] })
      toast.success(t('linkRevoked'))
    },
  })

  function makeUrl(token: string): string {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/sign/${token}`
  }

  async function copyLink(token: string) {
    const url = makeUrl(token)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(token)
      toast.success(t('linkCopied'))
      setTimeout(() => setCopied(null), 1500)
    } catch {
      toast.error(t('copyFailed'))
    }
  }

  function shareTelegram(token: string, recipName?: string | null) {
    const url  = makeUrl(token)
    const text = t('telegramText', { name: recipName ? `, ${recipName}` : '', url })
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Modal
      open={open} onClose={onClose}
      title={t('title')}
      size="lg"
    >
      <div className="space-y-5">
        <div className="bg-[#F0F9FF] border border-[#BFDBFE] rounded-xl p-3.5 text-xs text-[#1E40AF]">
          {t('info')}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#0F172A]">{t('newLink')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('recipientName')}
              placeholder={t('recipientNamePlace')}
              value={name}
              onChange={e => setName(e.target.value)}
            />
            <Input
              label={t('email')}
              type="email"
              placeholder={t('emailPlace')}
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              label={t('phone')}
              placeholder={t('phonePlace')}
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-[#374151]">{t('duration')}</label>
              <select
                value={days}
                onChange={e => setDays(Number(e.target.value))}
                className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              >
                <option value={7}>{t('days7')}</option>
                <option value={30}>{t('days30')}</option>
                <option value={60}>{t('days60')}</option>
                <option value={90}>{t('days90')}</option>
              </select>
            </div>
          </div>
          <Button
            leftIcon={<Share2 size={14} />}
            loading={createMut.isPending}
            onClick={() => createMut.mutate()}
          >
            {t('createLink')}
          </Button>
        </div>

        <div className="border-t border-[#E2E8F0] pt-4">
          <p className="text-sm font-semibold text-[#0F172A] mb-3">
            {t('existingLinks', { count: links.length })}
          </p>

          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 size={20} className="animate-spin text-[#2563EB]" />
            </div>
          ) : links.length === 0 ? (
            <p className="text-sm text-[#94A3B8] text-center py-4">
              {t('noLinks')}
            </p>
          ) : (
            <div className="space-y-2">
              {links.map(link => {
                const url = makeUrl(link.token)
                const isExpired = new Date(link.expiresAt) < new Date()
                const isSigned = !!link.signedAt
                return (
                  <div
                    key={link.id}
                    className={cn(
                      'p-3 rounded-xl border',
                      isSigned   ? 'bg-[#F0FDF4] border-[#BBF7D0]' :
                      isExpired  ? 'bg-[#FEF2F2] border-[#FECACA] opacity-70' :
                                   'bg-white border-[#E2E8F0]'
                    )}
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-[#0F172A]">
                            {link.recipientName || t('defaultRecipient')}
                          </p>
                          {isSigned && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#16A34A] text-white">
                              <CheckCircle2 size={10} className="inline mr-0.5" />
                              {t('signed')}
                            </span>
                          )}
                          {isExpired && !isSigned && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#DC2626] text-white">
                              {t('expired')}
                            </span>
                          )}
                          {link.viewedAt && !isSigned && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#1D4ED8]">
                              <Eye size={10} className="inline mr-0.5" />
                              {t('viewedCount', { count: link.viewCount })}
                            </span>
                          )}
                        </div>
                        {link.recipientEmail && (
                          <p className="text-xs text-[#94A3B8] mt-0.5">{link.recipientEmail}</p>
                        )}
                        {isSigned && link.signerName && (
                          <p className="text-xs text-[#15803D] mt-0.5">
                            {t('signedBy', { name: link.signerName, date: formatDate(link.signedAt!, 'short') })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => revokeMut.mutate(link.id)}
                        className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition shrink-0"
                        title={t('revokeBtn')}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <input
                        readOnly
                        value={url}
                        className="flex-1 text-xs bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2 py-1.5 font-mono"
                      />
                      <button
                        onClick={() => copyLink(link.token)}
                        className="p-1.5 rounded-lg bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE] transition shrink-0"
                        title={t('copyBtn')}
                      >
                        {copied === link.token ? <Check size={13} /> : <Copy size={13} />}
                      </button>
                      <button
                        onClick={() => shareTelegram(link.token, link.recipientName)}
                        className="p-1.5 rounded-lg bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition shrink-0"
                        title={t('telegramBtn')}
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>
                      </button>
                      <a
                        href={url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] transition shrink-0"
                        title={t('openBtn')}
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>

                    <p className="text-[10px] text-[#94A3B8] mt-2 flex items-center gap-1">
                      <Calendar size={10} />
                      {isExpired ? t('expiredLabel') : t('expiresLabel')}: {formatDate(link.expiresAt, 'short')}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
