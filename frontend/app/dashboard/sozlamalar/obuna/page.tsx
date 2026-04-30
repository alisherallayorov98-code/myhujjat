'use client'

import { useState }           from 'react'
import { useSearchParams }    from 'next/navigation'
import { Check, Zap, CreditCard, CheckCircle } from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { PageHeader }         from '@/components/layout/PageHeader'
import { Card }               from '@/components/ui/Card'
import { Button }             from '@/components/ui/Button'
import { Badge }              from '@/components/ui/Badge'
import { useAuth }            from '@/hooks/useAuth'
import api                    from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/formatters'
import toast                  from 'react-hot-toast'
import { cn }                 from '@/lib/cn'

// ============================================
// TARIF REJALARI
// ============================================
const PLANS_CONFIG = [
  {
    key:   'FREE',
    name:  'Bepul',
    price: { '1m': 0, '3m': 0, '12m': 0 },
    color: 'border-[#E2E8F0]',
    badge: null as string | null,
    features: [
      { text: 'Oyiga 3 ta shartnoma',  ok: true  },
      { text: 'Asosiy shablonlar',      ok: true  },
      { text: 'PDF eksport',            ok: true  },
      { text: 'STIR tekshirish',        ok: true  },
      { text: 'AI hujjat generatsiya',  ok: false },
      { text: 'E-imzo (ERI)',           ok: false },
      { text: 'Didox integratsiya',     ok: false },
      { text: 'Shablon muharriri',      ok: false },
    ],
  },
  {
    key:   'STANDARD',
    name:  'Standart',
    price: { '1m': 149_000, '3m': 399_000, '12m': 1_490_000 },
    color: 'border-[#2563EB]/40',
    badge: 'Mashhur',
    features: [
      { text: 'Oyiga 50 ta shartnoma',  ok: true  },
      { text: 'Barcha shablonlar',       ok: true  },
      { text: 'PDF + DOCX eksport',      ok: true  },
      { text: 'STIR tekshirish',         ok: true  },
      { text: "QQS hisoblash",           ok: true  },
      { text: "Ko'p tashkilot",          ok: true  },
      { text: 'AI hujjat generatsiya',   ok: false },
      { text: 'E-imzo (ERI)',            ok: false },
    ],
  },
  {
    key:   'PRO',
    name:  'Pro',
    price: { '1m': 299_000, '3m': 799_000, '12m': 2_990_000 },
    color: 'border-[#7C3AED]/40',
    badge: 'Eng yaxshi',
    features: [
      { text: 'Cheksiz shartnomalar',        ok: true },
      { text: 'AI hujjat generatsiya',       ok: true },
      { text: 'E-imzo (ERI)',                ok: true },
      { text: 'Didox integratsiya',          ok: true },
      { text: 'Shablon muharriri',           ok: true },
      { text: "Yurist bo'limi",              ok: true },
      { text: "Ustuvor qo'llab-quvvatlash",  ok: true },
      { text: 'API kirish',                  ok: true },
    ],
  },
]

// ============================================
// TO'LOV MODAL
// ============================================
function PaymentModal({
  planKey, period, open, onClose,
}: {
  planKey: string
  period:  '1m' | '3m' | '12m'
  open:    boolean
  onClose: () => void
}) {
  const [loading, setLoading] = useState<string | null>(null)

  const plan        = PLANS_CONFIG.find(p => p.key === planKey)
  const price       = plan?.price[period] || 0
  const periodLabel = period === '1m' ? '1 oy' : period === '3m' ? '3 oy' : '1 yil'

  const handlePay = async (provider: 'click' | 'payme') => {
    const pKey = `${planKey.toLowerCase()}_${period}`
    setLoading(provider)
    try {
      const { data } = await api.get(`/payments/url/${provider}/${pKey}`)
      if (data.url) window.location.href = data.url
    } catch {
      toast.error("To'lov URL olishda xatolik")
    } finally {
      setLoading(null)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-scale-in">
        <h3 className="font-bold text-[#0F172A] text-lg mb-1">
          To'lov tizimini tanlang
        </h3>
        <p className="text-sm text-[#94A3B8] mb-4">
          {plan?.name} reja — {periodLabel} — {formatCurrency(price)}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => handlePay('click')}
            disabled={!!loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#F97316]/40 hover:bg-[#FFF7ED] transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-[#F97316] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">Click</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-[#0F172A]">Click</p>
              <p className="text-xs text-[#94A3B8]">Visa, Mastercard, Uzcard, Humo</p>
            </div>
            {loading === 'click' && (
              <div className="w-5 h-5 border-2 border-[#F97316] border-t-transparent rounded-full animate-spin" />
            )}
          </button>

          <button
            onClick={() => handlePay('payme')}
            disabled={!!loading}
            className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-[#E2E8F0] hover:border-[#00C5B0]/40 hover:bg-[#F0FDFA] transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 rounded-lg bg-[#00C5B0] flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-xs">Payme</span>
            </div>
            <div className="text-left flex-1">
              <p className="font-semibold text-[#0F172A]">Payme</p>
              <p className="text-xs text-[#94A3B8]">Uzcard, Humo, Visa</p>
            </div>
            {loading === 'payme' && (
              <div className="w-5 h-5 border-2 border-[#00C5B0] border-t-transparent rounded-full animate-spin" />
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-3 py-2 text-sm text-[#94A3B8] hover:text-[#475569] transition-colors"
        >
          Bekor qilish
        </button>
      </div>
    </div>
  )
}

// ============================================
// ASOSIY SAHIFA
// ============================================
export default function ObunaPage() {
  const searchParams = useSearchParams()
  const { user }     = useAuth()
  const [period,   setPeriod]   = useState<'1m' | '3m' | '12m'>('1m')
  const [payModal, setPayModal] = useState<{ planKey: string } | null>(null)

  const paymentStatus = searchParams.get('status')

  const { data: subStats, refetch } = useQuery({
    queryKey: ['subscription'],
    queryFn:  async () => {
      const { data } = await api.get('/payments/subscription')
      return data
    },
  })

  const demoMutation = useMutation({
    mutationFn: () => api.post('/payments/demo'),
    onSuccess: () => {
      toast.success('7 kunlik Pro demo faollashtirildi!')
      refetch()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const periodSavings: Record<string, string> = {
    '1m': '', '3m': '11% tejash', '12m': '17% tejash',
  }

  return (
    <div>
      <PageHeader
        title="Obuna va to'lov"
        description="Reja va narxlar"
        breadcrumbs={[
          { label: 'Dashboard',  path: '/dashboard' },
          { label: 'Sozlamalar', path: '/dashboard/sozlamalar' },
          { label: 'Obuna' },
        ]}
      />

      {/* To'lov muvaffaqiyatli */}
      {paymentStatus === 'success' && (
        <div className="mb-6 p-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl flex items-center gap-3">
          <CheckCircle size={20} className="text-[#16A34A]" />
          <div>
            <p className="font-semibold text-[#15803D]">To'lov muvaffaqiyatli!</p>
            <p className="text-sm text-[#16A34A]">Obunangiz faollashtirildi.</p>
          </div>
        </div>
      )}

      {/* Joriy obuna holati */}
      {subStats && (
        <div className="mb-8 p-5 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-bold text-[#0F172A] text-lg">Joriy reja:</p>
                <Badge
                  variant={
                    subStats.plan === 'PRO'  ? 'warning' :
                    subStats.plan === 'DEMO' ? 'info'    : 'default'
                  }
                >
                  {subStats.plan}
                </Badge>
              </div>
              {subStats.expiresAt && (
                <p className="text-sm text-[#94A3B8]">
                  Muddati: {formatDate(subStats.expiresAt, 'long')}
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-2xl font-black text-[#0F172A]">
                {subStats.limit === -1 ? '∞' : `${subStats.contractCount}/${subStats.limit}`}
              </p>
              <p className="text-xs text-[#94A3B8]">shartnoma (bu oy)</p>
              {subStats.limit !== -1 && (
                <div className="w-32 h-1.5 bg-[#E2E8F0] rounded-full mt-1 ml-auto overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      subStats.contractCount / subStats.limit > 0.8
                        ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
                    )}
                    style={{
                      width: `${Math.min(100, (subStats.contractCount / subStats.limit) * 100)}%`,
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {subStats.plan === 'FREE' && (
            <div className="mt-4 pt-4 border-t border-[#E2E8F0] flex items-center justify-between flex-wrap gap-3">
              <div>
                <p className="text-sm font-medium text-[#0F172A]">7 kun bepul Pro sinab ko'ring</p>
                <p className="text-xs text-[#94A3B8]">Karta ma'lumotlari talab qilinmaydi</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Zap size={14} />}
                loading={demoMutation.isPending}
                onClick={() => demoMutation.mutate()}
              >
                Demo boshlash
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Davr tanlash */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {(['1m', '3m', '12m'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all',
              period === p
                ? 'border-[#2563EB] bg-[#DBEAFE] text-[#1D4ED8]'
                : 'border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC]'
            )}
          >
            {p === '1m' ? '1 oy' : p === '3m' ? '3 oy' : '1 yil'}
            {periodSavings[p] && (
              <Badge variant="success" size="sm">{periodSavings[p]}</Badge>
            )}
          </button>
        ))}
      </div>

      {/* Reja kartalar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS_CONFIG.map(plan => {
          const price      = plan.price[period]
          const isCurrent  = subStats?.plan === plan.key
          const isPro      = plan.key === 'PRO'

          return (
            <Card
              key={plan.key}
              className={cn(
                'relative flex flex-col border-2 transition-all',
                plan.color,
                isCurrent && 'ring-2 ring-[#2563EB]/30',
                isPro && 'bg-gradient-to-b from-[#EDE9FE]/20'
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge variant={isPro ? 'warning' : 'primary'} size="sm">
                    {plan.badge}
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="success" size="sm">
                    <Check size={10} className="mr-1" />
                    Joriy
                  </Badge>
                </div>
              )}

              <div className="mb-6">
                <p className="font-bold text-[#0F172A] text-lg mb-2">{plan.name}</p>
                <div className="flex items-baseline gap-1">
                  <span className="font-black text-3xl text-[#0F172A]">
                    {price === 0 ? 'Bepul' : formatCurrency(price)}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-[#94A3B8]">
                      /{period === '1m' ? 'oy' : period === '3m' ? '3 oy' : 'yil'}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f.text} className="flex items-center gap-2.5 text-sm">
                    {f.ok ? (
                      <Check size={15} className="text-[#16A34A] shrink-0" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-[#E2E8F0] shrink-0" />
                    )}
                    <span className={f.ok ? 'text-[#374151]' : 'text-[#CBD5E1]'}>{f.text}</span>
                  </li>
                ))}
              </ul>

              <div>
                {plan.key === 'FREE' ? (
                  <Button variant="secondary" fullWidth disabled={isCurrent}>
                    {isCurrent ? 'Joriy reja' : 'Bepul'}
                  </Button>
                ) : (
                  <Button
                    variant={isPro ? 'primary' : 'outline'}
                    fullWidth
                    disabled={isCurrent}
                    leftIcon={<CreditCard size={14} />}
                    onClick={() => setPayModal({ planKey: plan.key })}
                    className={isPro ? 'bg-[#7C3AED] hover:bg-[#6D28D9] border-[#7C3AED]' : ''}
                  >
                    {isCurrent ? 'Joriy reja' : 'Sotib olish'}
                  </Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6">
        <h3 className="font-bold text-[#0F172A] mb-4">Ko'p so'raladigan savollar</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: 'Shartnoma limiti qanday ishlaydi?',
              a: "Har oy 1-sanada hisoblagich sifirlanadi. Masalan, Fevral oyida 3 ta shartnoma yaratsangiz, Mart oyida yana 3 ta yarata olasiz.",
            },
            {
              q: "To'lov xavfsizmi?",
              a: "Ha. Click va Payme O'zbekistonning eng ishonchli to'lov tizimlari. Karta ma'lumotlari to'g'ridan to'lov tizimiga kiritiladi.",
            },
            {
              q: 'Obunani bekor qila olamanmi?',
              a: "Obuna muddati tugaganda avtomatik uziladi. Qayta to'lov talab qilinmaydi.",
            },
            {
              q: 'Demo rejada nima bor?',
              a: '7 kun davomida Pro rejaning barcha imkoniyatlaridan bepul foydalanasiz: AI, E-imzo, Didox va boshqalar.',
            },
          ].map(item => (
            <div key={item.q} className="p-4 rounded-xl bg-[#F8FAFC]">
              <p className="font-medium text-[#0F172A] text-sm mb-1.5">{item.q}</p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>

      {payModal && (
        <PaymentModal
          planKey={payModal.planKey}
          period={period}
          open={!!payModal}
          onClose={() => setPayModal(null)}
        />
      )}
    </div>
  )
}
