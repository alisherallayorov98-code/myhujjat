'use client'

import { useState }                          from 'react'
import Link                                  from 'next/link'
import { useTranslations }                   from 'next-intl'
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth }                           from '@/hooks/useAuth'
import { Button }                            from '@/components/ui/Button'
import { Input }                             from '@/components/ui/Input'
import { Logo }                              from '@/components/shared/Logo'
import { EimzoLoginModal }                   from '@/components/auth/EimzoLoginModal'
import toast                                 from 'react-hot-toast'

export default function LoginPage() {
  const t   = useTranslations('auth')
  const tv  = useTranslations('validation')

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [needs2FA, setNeeds2FA] = useState(false)
  const [code,     setCode]     = useState('')
  const [eimzoOpen, setEimzoOpen] = useState(false)
  const { login } = useAuth()

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!email.trim())       errs.email    = tv('emailRequired')
    if (password.length < 6) errs.password = tv('passwordTooShort')
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!needs2FA && !validate()) return
    setLoading(true)
    try {
      await login(email, password, needs2FA ? code : undefined)
      toast.success(t('loginWelcome'))
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.requires2FA) {
        setNeeds2FA(true)
        setErrors({})
        if (code) toast.error(t('twoFactorWrongCode'))
        setCode('')
      } else {
        const msg = data?.message || t('genericError')
        toast.error(typeof msg === 'string' ? msg : t('genericError'))
        if (typeof msg === 'string' && (msg.includes('parol') || msg.includes('Email') || msg.includes('password'))) {
          setErrors({ password: t('invalidCredentials') })
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Chap tomon — Brend */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex-col justify-between p-12">
        <Logo white size="lg" href="/" />

        <div className="space-y-6">
          <h1 className="font-display font-black text-white text-4xl leading-tight">
            {t('loginSidebarTitle')}<br />
            <span className="text-blue-200">{t('loginSidebarTitleHighlight')}</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            {t('loginSidebarDescription')}
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: t('statUsers'),     value: '5,000+' },
              { label: t('statDocuments'), value: '120K+' },
              { label: t('statTemplates'), value: '50+'   },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="font-display font-black text-white text-xl">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">{t('copyright')}</p>
      </div>

      {/* O'ng tomon — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="lg" href="/" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">
            <div className="mb-8">
              <h2 className="font-display font-black text-[#0F172A] text-2xl mb-1.5">{t('login')}</h2>
              <p className="text-[#94A3B8] text-sm">{t('loginSubtitle')}</p>
            </div>

            <Button
              type="button"
              fullWidth
              size="lg"
              variant="outline"
              onClick={() => setEimzoOpen(true)}
              leftIcon={<ShieldCheck size={18} />}
              className="mb-6 text-[#2563EB] border-[#2563EB] hover:bg-[#DBEAFE]"
            >
              E-IMZO orqali kirish
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#94A3B8]">{t('or')} email orqali</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!needs2FA ? (
                <>
                  <Input
                    label={t('email')}
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    error={errors.email}
                    required
                    autoFocus
                    autoComplete="email"
                  />

                  <Input
                    label={t('password')}
                    type={showPwd ? 'text' : 'password'}
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    error={errors.password}
                    required
                    autoComplete="current-password"
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="h-10 px-3 text-[#94A3B8] hover:text-[#475569] transition-colors"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <div className="flex justify-end">
                    <Link
                      href="/forgot-password"
                      className="text-sm text-[#2563EB] hover:text-[#1D4ED8] font-medium transition-colors"
                    >
                      {t('forgotPassword')}
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    rightIcon={<ArrowRight size={18} />}
                  >
                    {t('loginButton')}
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl">
                    <ShieldCheck size={20} className="text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1E40AF]">{t('twoFactorTitle')}</p>
                      <p className="text-xs text-[#3B82F6] mt-0.5">
                        {t('twoFactorDesc')}
                      </p>
                    </div>
                  </div>

                  <Input
                    label={t('twoFactorCode')}
                    placeholder={t('twoFactorPlaceholder')}
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    autoFocus
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                  />

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    rightIcon={<ArrowRight size={18} />}
                  >
                    {t('twoFactorVerify')}
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setNeeds2FA(false); setCode('') }}
                    className="block w-full text-center text-xs text-[#94A3B8] hover:text-[#475569]"
                  >
                    {t('twoFactorBackToLogin')}
                  </button>
                </>
              )}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#94A3B8]">{t('or')}</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#475569]">
              {t('noAccountQuestion')}{' '}
              <Link href="/register" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors">
                {t('registerLink')}
              </Link>
            </p>
          </div>

          {/* Demo kirish */}
          <div className="mt-4 p-4 bg-[#DBEAFE] rounded-xl border border-[#BFDBFE]">
            <p className="text-sm text-[#1D4ED8] font-medium mb-2">{t('demoTitle')}</p>
            <p className="text-xs text-[#3B82F6] mb-3">
              {t('demoDescription')}
            </p>
            <Button
              variant="outline"
              size="sm"
              fullWidth
              onClick={() => {
                setEmail('demo@myhujjat.uz')
                setPassword('demo12345')
              }}
            >
              {t('demoCredentials')}
            </Button>
          </div>
        </div>
      </div>
      
      <EimzoLoginModal open={eimzoOpen} onClose={() => setEimzoOpen(false)} />
    </div>
  )
}
