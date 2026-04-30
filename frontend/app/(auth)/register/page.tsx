'use client'

import { useState }                            from 'react'
import Link                                    from 'next/link'
import { useRouter }                           from 'next/navigation'
import { Eye, EyeOff, ArrowRight, CheckCircle, Circle } from 'lucide-react'
import { useAuth }                             from '@/hooks/useAuth'
import { Button }                              from '@/components/ui/Button'
import { Input }                               from '@/components/ui/Input'
import { Logo }                                from '@/components/shared/Logo'
import { cn }                                  from '@/lib/cn'
import toast                                   from 'react-hot-toast'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'Kamida 8 ta belgi', ok: password.length >= 8     },
    { label: 'Katta harf',        ok: /[A-Z]/.test(password)   },
    { label: 'Raqam',             ok: /[0-9]/.test(password)   },
  ]
  const score  = checks.filter(c => c.ok).length
  const colors = ['', 'bg-[#DC2626]', 'bg-[#D97706]', 'bg-[#16A34A]']
  const labels = ['', 'Zaif', "O'rtacha", 'Kuchli']

  if (!password) return null

  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-all',
              i <= score ? colors[score] : 'bg-[#E2E8F0]'
            )}
          />
        ))}
      </div>
      <p className={cn(
        'text-xs font-medium',
        score === 1 ? 'text-[#DC2626]' : score === 2 ? 'text-[#D97706]' : 'text-[#16A34A]'
      )}>
        {labels[score]}
      </p>
      <div className="space-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1.5">
            {c.ok
              ? <CheckCircle size={12} className="text-[#16A34A]" />
              : <Circle      size={12} className="text-[#CBD5E1]" />
            }
            <span className={cn('text-xs', c.ok ? 'text-[#15803D]' : 'text-[#94A3B8]')}>
              {c.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  const router     = useRouter()
  const { register } = useAuth()

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', confirm: '', agree: false,
  })
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!form.firstName.trim())      errs.firstName = 'Ismingizni kiriting'
    if (!form.email.trim())          errs.email     = 'Email kiriting'
    if (form.password.length < 8)    errs.password  = 'Kamida 8 ta belgi'
    if (form.password !== form.confirm) errs.confirm = 'Parollar mos emas'
    if (!form.agree)                 errs.agree     = 'Shartlarga rozilik kerak'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await register({
        email:     form.email,
        password:  form.password,
        firstName: form.firstName,
        lastName:  form.lastName,
      })
      setSuccess(true)
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Xatolik yuz berdi'
      toast.error(msg)
      if (msg.includes('email')) setErrors({ email: "Bu email allaqachon ro'yxatda" })
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-[#16A34A]" />
          </div>
          <h2 className="font-display font-black text-[#0F172A] text-xl mb-2">
            Ro'yxatdan o'tdingiz!
          </h2>
          <p className="text-[#475569] text-sm mb-6 leading-relaxed">
            <strong>{form.email}</strong> manziliga tasdiqlash xabari yuborildi.
          </p>
          <Button fullWidth onClick={() => router.push('/login')} rightIcon={<ArrowRight size={16} />}>
            Kirishga o'tish
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo size="lg" href="/" />
        </div>

        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-8">
          <div className="mb-6">
            <h2 className="font-display font-black text-[#0F172A] text-2xl mb-1">
              Ro'yxatdan o'tish
            </h2>
            <p className="text-[#94A3B8] text-sm">Bepul hisob yarating</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Ism"
                placeholder="Alisher"
                value={form.firstName}
                onChange={e => set('firstName', e.target.value)}
                error={errors.firstName}
                required
                autoFocus
              />
              <Input
                label="Familiya"
                placeholder="Toshmatov"
                value={form.lastName}
                onChange={e => set('lastName', e.target.value)}
              />
            </div>

            <Input
              label="Email"
              type="email"
              placeholder="email@company.uz"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <div>
              <Input
                label="Parol"
                type={showPwd ? 'text' : 'password'}
                placeholder="Kamida 8 ta belgi"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                error={errors.password}
                required
                autoComplete="new-password"
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="h-10 px-3 text-[#94A3B8] hover:text-[#475569]"
                  >
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
              <PasswordStrength password={form.password} />
            </div>

            <Input
              label="Parolni tasdiqlang"
              type="password"
              placeholder="••••••••"
              value={form.confirm}
              onChange={e => set('confirm', e.target.value)}
              error={errors.confirm}
              required
              autoComplete="new-password"
            />

            <div>
              <label className="flex items-start gap-2.5 cursor-pointer">
                <div
                  onClick={() => set('agree', !form.agree)}
                  className={cn(
                    'mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-all',
                    form.agree ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#CBD5E1]'
                  )}
                >
                  {form.agree && (
                    <svg viewBox="0 0 10 8" fill="none" className="w-2.5 h-2">
                      <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <span className="text-sm text-[#475569]">
                  <Link href="/terms" className="text-[#2563EB] hover:underline">Foydalanish shartlari</Link>
                  {' '}va{' '}
                  <Link href="/privacy" className="text-[#2563EB] hover:underline">Maxfiylik siyosati</Link>
                  ga roziman
                </span>
              </label>
              {errors.agree && <p className="text-xs text-[#DC2626] mt-1">⚠ {errors.agree}</p>}
            </div>

            <Button type="submit" fullWidth size="lg" loading={loading} rightIcon={<ArrowRight size={18} />}>
              Ro'yxatdan o'tish
            </Button>
          </form>

          <p className="text-center text-sm text-[#475569] mt-6">
            Hisob bormi?{' '}
            <Link href="/login" className="text-[#2563EB] hover:text-[#1D4ED8] font-semibold">
              Kirish
            </Link>
          </p>
        </div>

        <div className="mt-4 p-4 bg-[#F0FDF4] rounded-xl border border-[#BBF7D0]">
          <p className="text-sm text-[#15803D] font-medium">Bepul plan bilan boshlang</p>
          <p className="text-xs text-[#16A34A] mt-1">
            Oyiga 3 ta shartnoma • Asosiy shablonlar • PDF eksport
          </p>
        </div>
      </div>
    </div>
  )
}
