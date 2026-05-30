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
import { useAuth }                                           from '@/hooks/useAuth'
import { useRouter }                                         from 'next/navigation'

interface EimzoLoginModalProps {
  open: boolean
  onClose: () => void
}

export function EimzoLoginModal({ open, onClose }: EimzoLoginModalProps) {
  const t = useTranslations('eimzoSign') // Using eimzoSign translations
  const [installed,   setInstalled]   = useState<boolean | null>(null)
  const [keys,        setKeys]        = useState<EimzoCert[]>([])
  const [selectedKey, setSelectedKey] = useState<EimzoCert | null>(null)
  const [loading,     setLoading]     = useState(false)
  const [status,      setStatus]      = useState<'idle' | 'connecting' | 'signing' | 'success' | 'error'>('idle')
  const { loadUser } = useAuth()
  const router = useRouter()

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
      // 1. Get challenge from server
      const res = await api.get('/auth/e-imzo/challenge')
      const { challenge, challengeId } = res.data

      // 2. Load key (E-IMZO parol so'raydi)
      const keyId = await eimzoClient.loadKey(selectedKey)

      // 3. Sign challenge with E-IMZO
      const signature = await eimzoClient.sign(keyId, challenge)
      await eimzoClient.unloadKey(keyId)

      // 3. Send signature to login endpoint
      // 4. Send signature to backend
      const { data } = await api.post('/auth/e-imzo/login', { pkcs7: signature, challengeId })
      
      if (data.accessToken) {
        localStorage.setItem('access_token', data.accessToken)
        await loadUser()
        setStatus('success')
        toast.success("Muvaffaqiyatli kirdingiz")
        setTimeout(() => { onClose(); router.push('/dashboard') }, 1200)
      } else {
        setStatus('error')
        toast.error("Xatolik yuz berdi")
      }
    } catch (error: any) {
      setStatus('error')
      toast.error(error?.response?.data?.message || error?.message || "E-IMZO orqali kirishda xatolik")
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (!loading) {
      onClose()
      setStatus('idle')
      setInstalled(null)
      setKeys([])
      setSelectedKey(null)
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="E-IMZO orqali kirish"
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
            Tizimga kirish
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
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
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
                          <p className="text-xs text-[#94A3B8]">{t('keyValidUntil', { type: key.type || 'STIR/JSHSHIR', date: key.notAfter })}</p>
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
                <span className="text-sm font-medium">Muvaffaqiyatli kirdingiz</span>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  )
}
