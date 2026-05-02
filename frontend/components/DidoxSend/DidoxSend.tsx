'use client'

import { useState }                           from 'react'
import { useTranslations }                    from 'next-intl'
import { Send, CheckCircle }                  from 'lucide-react'
import { Button }                             from '@/components/ui/Button'
import { Badge }                              from '@/components/ui/Badge'
import { Modal }                              from '@/components/ui/Modal'
import api                                    from '@/lib/api'
import toast                                  from 'react-hot-toast'

interface DidoxSendProps {
  contractId: string
  orgId:      string
  specId?:    string
  didoxSent?: boolean
  onSent:     () => void
}

export function DidoxSend({ contractId, orgId, specId, didoxSent, onSent }: DidoxSendProps) {
  const t = useTranslations('didoxSend')
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleSend() {
    if (!specId) {
      toast.error(t('needSpec'))
      return
    }
    setLoading(true)
    try {
      await api.post(`/didox/send/${contractId}?orgId=${orgId}`, { specId })
      toast.success(t('sent'))
      setConfirm(false)
      onSent()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('error'))
    } finally {
      setLoading(false)
    }
  }

  if (didoxSent) {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle size={12} className="mr-1" />
        {t('alreadySent')}
      </Badge>
    )
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        leftIcon={<Send size={14} />}
        onClick={() => setConfirm(true)}
      >
        {t('sendBtn')}
      </Button>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={t('modalTitle')}
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
              {t('cancel')}
            </Button>
            <Button
              size="sm"
              loading={loading}
              leftIcon={<Send size={14} />}
              onClick={handleSend}
            >
              {t('submit')}
            </Button>
          </>
        }
      >
        <div className="py-2 space-y-3">
          <p className="text-sm text-[#475569]">
            {t('info')}
          </p>
          <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
            <p className="text-xs text-[#92400E]">
              {t('warning')}
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
