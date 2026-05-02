'use client'

import { useState, useEffect, useRef }      from 'react'
import { useTranslations }                  from 'next-intl'
import { Save, Camera, Trash2, Loader2 }    from 'lucide-react'
import { useMutation }                      from '@tanstack/react-query'
import { Card }                             from '@/components/ui/Card'
import { Button }                           from '@/components/ui/Button'
import { Input }                            from '@/components/ui/Input'
import { useAuth }                          from '@/hooks/useAuth'
import api                                  from '@/lib/api'
import toast                                from 'react-hot-toast'
import { cn }                               from '@/lib/cn'

const MAX_AVATAR_BYTES = 500_000 // 500KB

// Brauzerda rasmni 256x256 ga siqish
async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const maxSize = 256
        const canvas  = document.createElement('canvas')
        const ratio   = Math.min(maxSize / img.width, maxSize / img.height, 1)
        canvas.width  = Math.round(img.width  * ratio)
        canvas.height = Math.round(img.height * ratio)
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.onerror = reject
      img.src     = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function ProfilPage() {
  const t = useTranslations('profile')
  const { user, loadUser } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [avatarUrl,    setAvatarUrl]    = useState<string | null>(null)
  const [uploading,    setUploading]    = useState(false)

  const LANGUAGES = [
    { value: 'uz', label: t('langUz') },
    { value: 'oz', label: t('langOz') },
    { value: 'ru', label: t('langRu') },
  ]

  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    phone:     '',
    language:  'uz' as string,
  })

  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName:  user.lastName  || '',
        phone:     user.phone     || '',
        language:  user.language  || 'uz',
      })
      setAvatarUrl((user as any).avatarUrl || null)
    }
  }, [user])

  const mutation = useMutation({
    mutationFn: (extra?: { avatarUrl?: string | null }) =>
      api.put('/users/profile', { ...form, ...(extra ?? {}) }),
    onSuccess: () => {
      loadUser()
      toast.success(t('saved'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const upd = (key: string, val: string) =>
    setForm(f => ({ ...f, [key]: val }))

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error(t('onlyImages'))
      return
    }
    setUploading(true)
    try {
      const dataUrl = await compressImage(file)
      if (dataUrl.length > MAX_AVATAR_BYTES) {
        toast.error(t('imageTooLarge'))
        return
      }
      setAvatarUrl(dataUrl)
      mutation.mutate({ avatarUrl: dataUrl })
    } catch {
      toast.error(t('uploadError'))
    } finally {
      setUploading(false)
    }
  }

  function handleAvatarRemove() {
    setAvatarUrl(null)
    mutation.mutate({ avatarUrl: null })
  }

  const initials =
    form.firstName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    '?'

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <h2 className="font-bold text-[#0F172A] mb-4">{t('personalInfo')}</h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#2563EB] to-[#7C3AED] flex items-center justify-center">
                <span className="text-white font-black text-2xl">{initials}</span>
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#2563EB] hover:bg-[#1D4ED8] rounded-full flex items-center justify-center border-2 border-white transition disabled:opacity-60"
              title={t('changeAvatar')}
            >
              {uploading
                ? <Loader2 size={12} className="text-white animate-spin" />
                : <Camera  size={12} className="text-white" />
              }
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#0F172A] truncate">
              {form.firstName || form.lastName
                ? `${form.firstName} ${form.lastName}`.trim()
                : user?.email}
            </p>
            <p className="text-sm text-[#94A3B8] truncate">{user?.email}</p>
            {avatarUrl && (
              <button
                onClick={handleAvatarRemove}
                className="text-xs text-[#DC2626] hover:underline mt-1 flex items-center gap-1"
              >
                <Trash2 size={11} /> {t('removeAvatar')}
              </button>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label={t('firstName')}
              value={form.firstName}
              onChange={e => upd('firstName', e.target.value)}
              placeholder={t('firstNamePlace')}
            />
            <Input
              label={t('lastName')}
              value={form.lastName}
              onChange={e => upd('lastName', e.target.value)}
              placeholder={t('lastNamePlace')}
            />
          </div>

          <Input
            label={t('email')}
            value={user?.email || ''}
            disabled
            hint={t('emailHint')}
          />

          <Input
            label={t('phone')}
            value={form.phone}
            onChange={e => upd('phone', e.target.value)}
            placeholder={t('phonePlace')}
          />

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#374151]">{t('interfaceLanguage')}</label>
            <div className="flex gap-2 flex-wrap">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.value}
                  onClick={() => upd('language', lang.value)}
                  className={cn(
                    'flex-1 min-w-[100px] py-2 px-3 rounded-lg text-xs border-2 transition-all',
                    form.language === lang.value
                      ? 'border-[#2563EB] bg-[#DBEAFE]/30 text-[#2563EB] font-medium'
                      : 'border-[#E2E8F0] text-[#475569] hover:border-[#CBD5E1]'
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            leftIcon={<Save size={14} />}
            loading={mutation.isPending}
            onClick={() => mutation.mutate(undefined)}
          >
            {t('save')}
          </Button>
        </div>
      </Card>
    </div>
  )
}
