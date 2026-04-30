'use client'

import { useState }                          from 'react'
import Link                                  from 'next/link'
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react'
import { useAuth }                           from '@/hooks/useAuth'
import { Button }                            from '@/components/ui/Button'
import { Input }                             from '@/components/ui/Input'
import { Logo }                              from '@/components/shared/Logo'
import toast                                 from 'react-hot-toast'

export default function LoginPage() {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [showPwd,  setShowPwd]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState<Record<string, string>>({})
  const [needs2FA, setNeeds2FA] = useState(false)
  const [code,     setCode]     = useState('')
  const { login } = useAuth()

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!email.trim())       errs.email    = 'Email kiriting'
    if (password.length < 6) errs.password = 'Parol juda qisqa'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!needs2FA && !validate()) return
    setLoading(true)
    try {
      await login(email, password, needs2FA ? code : undefined)
      toast.success('Xush kelibsiz!')
    } catch (err: any) {
      const data = err?.response?.data
      if (data?.requires2FA) {
        setNeeds2FA(true)
        setErrors({})
        if (code) toast.error("Kod noto'g'ri")
        setCode('')
      } else {
        const msg = data?.message || 'Xatolik yuz berdi'
        toast.error(typeof msg === 'string' ? msg : 'Xatolik yuz berdi')
        if (typeof msg === 'string' && (msg.includes('parol') || msg.includes('Email'))) {
          setErrors({ password: "Email yoki parol noto'g'ri" })
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
            Hujjatlaringiz<br />
            <span className="text-blue-200">xavfsiz qo'lda</span>
          </h1>
          <p className="text-blue-100 text-lg leading-relaxed max-w-sm">
            Shartnomalar, faktiralar, buyruqlar va boshqa rasmiy hujjatlarni
            AI yordamida tez va to'g'ri yarating.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-4">
            {[
              { label: 'Foydalanuvchi',   value: '5,000+' },
              { label: 'Hujjat yaratildi', value: '120K+' },
              { label: 'Shablon',          value: '50+'   },
            ].map(stat => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-3 text-center">
                <p className="font-display font-black text-white text-xl">{stat.value}</p>
                <p className="text-blue-200 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-blue-300 text-sm">© 2025 MyHujjat.uz — O'zbekiston hujjat platformasi</p>
      </div>

      {/* O'ng tomon — Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-8">
            <Logo size="lg" href="/" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">
            <div className="mb-8">
              <h2 className="font-display font-black text-[#0F172A] text-2xl mb-1.5">Kirish</h2>
              <p className="text-[#94A3B8] text-sm">Hisobingizga kiring</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {!needs2FA ? (
                <>
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@company.uz"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    error={errors.email}
                    required
                    autoFocus
                    autoComplete="email"
                  />

                  <Input
                    label="Parol"
                    type={showPwd ? 'text' : 'password'}
                    placeholder="••••••••"
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
                      Parolni unutdingizmi?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    fullWidth
                    size="lg"
                    loading={loading}
                    rightIcon={<ArrowRight size={18} />}
                  >
                    Kirish
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-3 p-3 bg-[#DBEAFE] border border-[#BFDBFE] rounded-xl">
                    <ShieldCheck size={20} className="text-[#2563EB] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-[#1E40AF]">Ikki bosqichli tasdiqlash</p>
                      <p className="text-xs text-[#3B82F6] mt-0.5">
                        Authenticator ilovasidan 6 raqamli kod yoki backup kodni kiriting
                      </p>
                    </div>
                  </div>

                  <Input
                    label="Kod"
                    placeholder="123 456"
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
                    Tasdiqlash
                  </Button>

                  <button
                    type="button"
                    onClick={() => { setNeeds2FA(false); setCode('') }}
                    className="block w-full text-center text-xs text-[#94A3B8] hover:text-[#475569]"
                  >
                    ← Boshqa hisob bilan kirish
                  </button>
                </>
              )}
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E2E8F0]" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-3 text-xs text-[#94A3B8]">yoki</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#475569]">
              Hisob yo'qmi?{' '}
              <Link href="/register" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold transition-colors">
                Ro'yxatdan o'ting
              </Link>
            </p>
          </div>

          {/* Demo kirish */}
          <div className="mt-4 p-4 bg-[#DBEAFE] rounded-xl border border-[#BFDBFE]">
            <p className="text-sm text-[#1D4ED8] font-medium mb-2">Demo kirish</p>
            <p className="text-xs text-[#3B82F6] mb-3">
              Tizimni sinab ko'rish uchun demo hisobdan foydalaning
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
              Demo ma'lumotlarni to'ldirish
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
