'use client'

import { useEffect }                from 'react'
import { useTranslations }          from 'next-intl'
import { useParams, useRouter }     from 'next/navigation'
import { useMutation }              from '@tanstack/react-query'
import { Loader2 }                  from 'lucide-react'
import { useAuth }                  from '@/hooks/useAuth'
import api                          from '@/lib/api'
import toast                        from 'react-hot-toast'

export default function JoinPage() {
  const t = useTranslations('joinPage')
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const token  = params.token as string

  const joinMutation = useMutation({
    mutationFn: () => api.post('/orgs/join', { token }),
    onSuccess:  () => {
      toast.success(t('joined'))
      router.push('/dashboard')
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || t('error'))
      router.push('/dashboard')
    },
  })

  useEffect(() => {
    if (!token) return
    if (user)       joinMutation.mutate()
    else            router.push(`/login?redirect=/join/${token}`)
  }, [user, token]) // eslint-disable-line

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="text-center">
        <Loader2 size={32} className="animate-spin text-[#2563EB] mx-auto mb-3" />
        <p className="text-[#475569]">{t('joining')}</p>
      </div>
    </div>
  )
}
