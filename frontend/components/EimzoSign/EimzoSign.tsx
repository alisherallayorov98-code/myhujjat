'use client'

import { useState, useEffect }                               from 'react'
import { useTranslations }                                   from 'next-intl'
import { Shield, CheckCircle, AlertCircle, Key, Loader2 }   from 'lucide-react'
import { Button }                                            from '@/components/ui/Button'
import { Modal }                                             from '@/components/ui/Modal'
import api                                                   from '@/lib/api'
import { eimzoClient, EimzoCert, checkEimzoInstalled }        from '@/lib/eimzo-client'
import toast                                                 from 'react-hot-toast'
import { cn }                                                from '@/lib/cn'

interface EimzoSignProps {
  contractId: string
  signerType: 'us' | 'cp'
  onSigned:   () => void
}

export function EimzoSign({ contractId, signerType, onSigned }: EimzoSignProps) {
  const t = useTranslations('eimzoSign')
  const [open,        setOpen]        = useState(false)
  const [installed,   setInstalled]   = useState<boolean | null>(null)
  const [keys,        setKeys]        = useState<EimzoCert[]>([])
  const [selectedKey, setSelectedKey] = useState<EimzoCert | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [status,      setStatus]      = useState<'idle' | 'connecting' | 'signing' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (open) checkConnection()
  }, [open])

  async function checkConnection() {
    setStatus('connecting')
    const isInstalled = await checkEimzoInstalled()
    setInstalled(isInstalled)
    if (isInstalled) {
      try {
        const keyList = await eimzoClient.listCertificates()
        setKeys(keyList)
        if (keyList.length === 1) setSelectedKey(keyList[0])
      } catch {}
    }
    setStatus('idle')
  }

  async function handleSign() {
    if (!selectedKey) return
    setLoading(true)
    setStatus('signing')
    try {
      const { data: { id: challengeId, challenge } } = await api.get('/eimzo/challenge')
      const { signature, certificate } = await eimzoClient.sign(selectedKey.alias, challenge)
      const { data } = await api.post(`/eimzo/verify/${contractId}`, {
        challengeId, signature, certificate, signerType,
      })
      if (data.success) {
        setStatus('success')
        toast.success(t('successToast', { signer: data.signer }))
        setTimeout(() => { setOpen(false); onSigned() }, 1500)
      } else {
        setStatus('error')
        toast.error(t('invalidSignature'))
      }
    } catch (error: any) {
      setStatus('error')
      toast.error(error?.message || t('signError'))
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      setOpen(false)
      setStatus('idle')
      setInstalled(null)
      setKeys([])
      setSelectedKey(null)
    }
  }

  return (
    <>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Shield size={14} />}
        onClick={() => setOpen(true)}
      >
        {t('triggerBtn')}
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        title={t('modalTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              loading={loading}
              disabled={!selectedKey || !installed || status === 'success'}
              onClick={handleSign}
              leftIcon={<Shield size={14} />}
            >
              {t('signBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4 py-2">
          {status === 'connecting' && (
            <div className="flex items-center gap-2 text-sm text-[#475569]">
              <Loader2 size={16} className="animate-spin text-[#2563EB]" />
              {t('connecting')}
            </div>
          )}

          {installed === false && (
            <div className="p-4 bg-[#FEF3C7] border border-[#FDE68A] rounded-xl">
              <div className="flex items-start gap-2">
                <AlertCircle size={18} className="text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-[#92400E]">{t('notInstalledTitle')}</p>
                  <p className="text-xs text-[#B45309] mt-1">
                    {t('notInstalledDesc')}
                  </p>
                  <a
                    href="https://e-imzo.uz"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#2563EB] hover:underline mt-1 block"
                  >
                    {t('downloadLink')}
                  </a>
                </div>
              </div>
            </div>
          )}

          {installed && status !== 'connecting' && (
            <>
              <div>
                <p className="text-sm font-medium text-[#374151] mb-2">{t('selectKey')}</p>
                {keys.length === 0 ? (
                  <p className="text-sm text-[#94A3B8]">{t('noKeys')}</p>
                ) : (
                  <div className="space-y-2">
                    {keys.map(key => {
                      const cn_ = key.subjectDn.split(',').find(s => s.includes('CN='))?.replace('CN=', '').trim() || key.alias
                      return (
                        <button
                          key={key.alias}
                          onClick={() => setSelectedKey(key)}
                          className={cn(
                            'w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-all',
                            selectedKey?.alias === key.alias
                              ? 'border-[#2563EB] bg-[#DBEAFE]/30'
                              : 'border-[#E2E8F0] hover:border-[#CBD5E1]'
                          )}
                        >
                          <Key size={16} className={cn(
                            'shrink-0 mt-0.5',
                            selectedKey?.alias === key.alias ? 'text-[#2563EB]' : 'text-[#94A3B8]'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#0F172A] truncate">{cn_}</p>
                            <p className="text-xs text-[#94A3B8]">{t('keyValidUntil', { type: key.type, date: key.notAfter })}</p>
                          </div>
                          {selectedKey?.alias === key.alias && (
                            <CheckCircle size={16} className="text-[#2563EB] shrink-0" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-2 text-[#16A34A] bg-[#F0FDF4] p-3 rounded-lg">
                  <CheckCircle size={18} />
                  <span className="text-sm font-medium">{t('successMsg')}</span>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
