'use client'

import { useState }                           from 'react'
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
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  async function handleSend() {
    if (!specId) {
      toast.error('Avval spesifikatsiya qo\'shing')
      return
    }
    setLoading(true)
    try {
      await api.post(`/didox/send/${contractId}?orgId=${orgId}`, { specId })
      toast.success('Didox ga yuborildi!')
      setConfirm(false)
      onSent()
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Didox xatolik')
    } finally {
      setLoading(false)
    }
  }

  if (didoxSent) {
    return (
      <Badge variant="success" size="sm">
        <CheckCircle size={12} className="mr-1" />
        Didox da yuborilgan
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
        Didox ga yuborish
      </Button>

      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Didox ga yuborish"
        size="sm"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setConfirm(false)}>
              Bekor
            </Button>
            <Button
              size="sm"
              loading={loading}
              leftIcon={<Send size={14} />}
              onClick={handleSend}
            >
              Yuborish
            </Button>
          </>
        }
      >
        <div className="py-2 space-y-3">
          <p className="text-sm text-[#475569]">
            Ushbu shartnoma bo'yicha faktura Didox elektron hisob-faktura tizimiga yuboriladi.
          </p>
          <div className="p-3 bg-[#FEF3C7] border border-[#FDE68A] rounded-lg">
            <p className="text-xs text-[#92400E]">
              Diqqat: Yuborilgan hisob-fakturani qaytarib olish mumkin emas.
              Kontragent uni Didox tizimida ko'radi.
            </p>
          </div>
        </div>
      </Modal>
    </>
  )
}
