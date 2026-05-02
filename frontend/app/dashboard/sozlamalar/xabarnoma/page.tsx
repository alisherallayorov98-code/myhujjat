'use client'

import { useState }                from 'react'
import { useTranslations }         from 'next-intl'
import { Mail, Smartphone, Save, Bell, BellOff, Send } from 'lucide-react'
import { Card }                    from '@/components/ui/Card'
import { Button }                  from '@/components/ui/Button'
import { usePushNotifications }    from '@/hooks/usePushNotifications'
import toast                       from 'react-hot-toast'
import { cn }                      from '@/lib/cn'

interface ToggleProps {
  checked:  boolean
  onChange: (v: boolean) => void
}

function Toggle({ checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'w-10 h-5 rounded-full transition-colors relative shrink-0',
        checked ? 'bg-[#2563EB]' : 'bg-[#E2E8F0]'
      )}
    >
      <span className={cn(
        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all',
        checked ? 'left-5' : 'left-0.5'
      )} />
    </button>
  )
}

export default function XabarnomaSahifasi() {
  const t = useTranslations('notifications')
  const [settings, setSettings] = useState({
    emailObuna:      true,
    emailShartnoma:  false,
    emailXavfsizlik: true,
    pushYangi:       true,
    pushObuna:       true,
  })
  const push = usePushNotifications()
  const [pushBusy, setPushBusy] = useState(false)

  const upd = (key: keyof typeof settings, val: boolean) =>
    setSettings(s => ({ ...s, [key]: val }))

  const togglePush = async () => {
    setPushBusy(true)
    try {
      if (push.subscribed) {
        await push.unsubscribe()
        toast.success(t('browserDisabled'))
      } else {
        const r = await push.subscribe()
        if (r.ok) toast.success(t('browserEnabled'))
        else toast.error(r.error || t('error'))
      }
    } catch (e: any) {
      toast.error(t('errorOccurred'))
    } finally {
      setPushBusy(false)
    }
  }

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Mail size={16} className="text-[#2563EB]" />
          <h2 className="font-bold text-[#0F172A] text-sm">{t('emailNotificationsTitle')}</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'emailObuna',      label: t('emailObunaLabel'),    desc: t('emailObunaDesc')    },
            { key: 'emailShartnoma',  label: t('emailContractLabel'), desc: t('emailContractDesc') },
            { key: 'emailXavfsizlik', label: t('emailSecurityLabel'), desc: t('emailSecurityDesc') },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#0F172A]">{item.label}</p>
                <p className="text-xs text-[#94A3B8]">{item.desc}</p>
              </div>
              <Toggle
                checked={settings[item.key as keyof typeof settings]}
                onChange={v => upd(item.key as keyof typeof settings, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Brauzer push */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Bell size={16} className="text-[#2563EB]" />
          <h2 className="font-bold text-[#0F172A] text-sm">{t('browserNotificationsTitle')}</h2>
        </div>

        {!push.supported ? (
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {t('browserNotSupported')}
          </p>
        ) : push.permission === 'denied' ? (
          <p className="text-xs text-[#DC2626] leading-relaxed">
            {t('browserDenied')}
          </p>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              {t('browserDesc')}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={push.subscribed ? 'outline' : 'primary'}
                leftIcon={push.subscribed ? <BellOff size={13} /> : <Bell size={13} />}
                loading={pushBusy}
                onClick={togglePush}
              >
                {push.subscribed ? t('disable') : t('enable')}
              </Button>
              {push.subscribed && (
                <Button
                  size="sm"
                  variant="outline"
                  leftIcon={<Send size={13} />}
                  onClick={async () => {
                    await push.sendTest()
                    toast.success(t('testSent'))
                  }}
                >
                  {t('test')}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Smartphone size={16} className="text-[#2563EB]" />
          <h2 className="font-bold text-[#0F172A] text-sm">{t('pushTypesTitle')}</h2>
        </div>
        <div className="space-y-4">
          {[
            { key: 'pushYangi', label: t('pushNewLabel'),   desc: t('pushNewDesc') },
            { key: 'pushObuna', label: t('pushObunaLabel'), desc: t('pushObunaDesc') },
          ].map(item => (
            <div key={item.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-[#0F172A]">{item.label}</p>
                <p className="text-xs text-[#94A3B8]">{item.desc}</p>
              </div>
              <Toggle
                checked={settings[item.key as keyof typeof settings]}
                onChange={v => upd(item.key as keyof typeof settings, v)}
              />
            </div>
          ))}
        </div>
      </Card>

      <Button
        leftIcon={<Save size={14} />}
        onClick={() => toast.success(t('saved'))}
      >
        {t('save')}
      </Button>
    </div>
  )
}
