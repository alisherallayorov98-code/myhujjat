'use client'

import { useState }            from 'react'
import Link                    from 'next/link'
import { useTranslations }     from 'next-intl'
import { ArrowLeft, Mail }     from 'lucide-react'
import { useAuth }             from '@/hooks/useAuth'
import { Button }              from '@/components/ui/Button'
import { Input }               from '@/components/ui/Input'
import { Logo }                from '@/components/shared/Logo'
import toast                   from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const { forgotPassword } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('genericError'))
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-4">
            <Mail size={28} className="text-[#2563EB]" />
          </div>
          <h2 className="font-display font-black text-[#0F172A] text-xl mb-2">
            {t('forgotSentTitle')}
          </h2>
          <p className="text-[#475569] text-sm mb-6 leading-relaxed">
            {t.rich('forgotSentDescription', {
              email: () => <strong>{email}</strong>,
            })}
          </p>
          <Link href="/login">
            <Button variant="outline" fullWidth leftIcon={<ArrowLeft size={16} />}>
              {t('backToLogin')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-8">
          <div className="mb-6">
            <h2 className="font-display font-black text-[#0F172A] text-2xl mb-1">
              {t('forgotTitle')}
            </h2>
            <p className="text-[#94A3B8] text-sm">
              {t('forgotSubtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('email')}
              type="email"
              placeholder={t('emailPlaceholder')}
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoFocus
            />
            <Button type="submit" fullWidth size="lg" loading={loading}>
              {t('forgotButton')}
            </Button>
          </form>

          <Link
            href="/login"
            className="flex items-center justify-center gap-2 mt-6 text-sm text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <ArrowLeft size={14} />
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    </div>
  )
}
