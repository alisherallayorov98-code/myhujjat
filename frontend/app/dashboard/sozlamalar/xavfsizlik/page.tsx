'use client'

import { useState }           from 'react'
import { Lock, Eye, EyeOff, ShieldCheck, ShieldOff, Monitor, Smartphone, Trash2, Copy, RefreshCw, Check, Download, AlertTriangle } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card }               from '@/components/ui/Card'
import { Button }             from '@/components/ui/Button'
import { Input }              from '@/components/ui/Input'
import api                    from '@/lib/api'
import { formatDate }         from '@/lib/formatters'
import toast                  from 'react-hot-toast'
import { cn }                 from '@/lib/cn'

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ belgi',   ok: password.length >= 8 },
    { label: 'Raqam',      ok: /\d/.test(password) },
    { label: 'Katta harf', ok: /[A-Z]/.test(password) },
  ]
  const strength = checks.filter(c => c.ok).length
  const barColor =
    strength === 3 ? 'bg-[#16A34A]' :
    strength === 2 ? 'bg-[#D97706]' :
                     'bg-[#DC2626]'

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={cn('h-1 flex-1 rounded-full transition-colors', i <= strength ? barColor : 'bg-[#E2E8F0]')}
          />
        ))}
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map(c => (
          <span key={c.label} className={cn('text-xs', c.ok ? 'text-[#16A34A]' : 'text-[#94A3B8]')}>
            {c.ok ? '✓' : '○'} {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export default function XavfsizlikPage() {
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirm:     '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.put('/users/change-password', {
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      }),
    onSuccess: () => {
      toast.success("Parol o'zgartirildi ✓")
      setForm({ oldPassword: '', newPassword: '', confirm: '' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const canSubmit =
    !!form.oldPassword &&
    form.newPassword.length >= 6 &&
    form.newPassword === form.confirm

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <h2 className="font-bold text-[#0F172A] mb-4">Parolni o'zgartirish</h2>
        <div className="space-y-4">
          <Input
            label="Joriy parol"
            type={showOld ? 'text' : 'password'}
            value={form.oldPassword}
            onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
            rightElement={
              <button
                type="button"
                onClick={() => setShowOld(!showOld)}
                className="text-[#94A3B8] hover:text-[#475569]"
              >
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
          />

          <div className="space-y-2">
            <Input
              label="Yangi parol"
              type={showNew ? 'text' : 'password'}
              value={form.newPassword}
              onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="text-[#94A3B8] hover:text-[#475569]"
                >
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />
            {form.newPassword && <PasswordStrength password={form.newPassword} />}
          </div>

          <Input
            label="Yangi parolni tasdiqlang"
            type="password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            error={
              form.confirm && form.confirm !== form.newPassword
                ? 'Parollar mos emas'
                : undefined
            }
          />

          <Button
            leftIcon={<Lock size={14} />}
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            Parolni o'zgartirish
          </Button>
        </div>
      </Card>

      <TwoFactor />

      <ActiveSessions />

      <DataPrivacy />
    </div>
  )
}

// ─── ACTIVE SESSIONS ─────────────────────────────────────
interface Session {
  id:        string
  ipAddress: string | null
  device:    string
  browser:   string
  isCurrent: boolean
  createdAt: string
  expiresAt: string
}

function ActiveSessions() {
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn:  () => api.get('/sessions').then(r => r.data),
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success('Sessiya bekor qilindi')
    },
  })

  const revokeAllMut = useMutation({
    mutationFn: () => api.delete('/sessions/all/except-current'),
    onSuccess:  (res: any) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success(`${res.data?.revoked || 0} ta sessiya bekor qilindi`)
    },
  })

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[#0F172A]">Faol sessiyalar</h2>
        {otherSessions.length > 0 && (
          <Button size="xs" variant="outline" onClick={() => {
            if (confirm("Boshqa barcha qurilmalardan chiqilsinmi?")) revokeAllMut.mutate()
          }}>
            Hammasidan chiqish
          </Button>
        )}
      </div>
      <p className="text-xs text-[#94A3B8] mb-4">
        Hisobingizga kirilgan barcha qurilmalar. Notanish qurilma ko'rinsa darhol bekor qiling.
      </p>

      {isLoading ? (
        <div className="text-sm text-[#94A3B8] text-center py-4">Yuklanmoqda...</div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-[#94A3B8] text-center py-4">Faol sessiya yo'q</div>
      ) : (
        <div className="space-y-2">
          {sessions.map(s => {
            const isMobile = s.device !== 'Desktop'
            return (
              <div key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border ${s.isCurrent ? 'bg-[#F0F9FF] border-[#BFDBFE]' : 'bg-[#F8FAFC] border-[#E2E8F0]'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.isCurrent ? 'bg-[#DBEAFE] text-[#2563EB]' : 'bg-white text-[#94A3B8]'}`}>
                  {isMobile ? <Smartphone size={16} /> : <Monitor size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#0F172A]">
                      {s.browser} • {s.device}
                    </p>
                    {s.isCurrent && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#16A34A] text-white">
                        Joriy
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {s.ipAddress || 'IP noma\'lum'} · {formatDate(s.createdAt, 'short')}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => {
                      if (confirm("Bu qurilmadan chiqilsinmi?")) revokeMut.mutate(s.id)
                    }}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}

// ─── 2FA (Ikki bosqichli tasdiqlash) ──────────────────────
function TwoFactor() {
  const qc = useQueryClient()
  const [setupData, setSetupData] = useState<{ secret: string; qrCode: string } | null>(null)
  const [code, setCode]           = useState('')
  const [disableCode, setDisableCode] = useState('')
  const [showDisable, setShowDisable] = useState(false)
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)
  const [copiedSecret, setCopiedSecret] = useState(false)

  const { data: status } = useQuery<{ enabled: boolean }>({
    queryKey: ['2fa-status'],
    queryFn:  () => api.get('/auth/2fa/status').then(r => r.data),
  })

  const setupMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/setup').then(r => r.data),
    onSuccess:  d => setSetupData(d),
    onError:    (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const enableMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/enable', { code }).then(r => r.data),
    onSuccess:  d => {
      toast.success('2FA yoqildi ✓')
      setBackupCodes(d.backupCodes)
      setSetupData(null)
      setCode('')
      qc.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Kod noto'g'ri"),
  })

  const disableMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/disable', { code: disableCode }).then(r => r.data),
    onSuccess:  () => {
      toast.success("2FA o'chirildi")
      setShowDisable(false)
      setDisableCode('')
      qc.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || "Kod noto'g'ri"),
  })

  const regenerateMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/regenerate-codes').then(r => r.data),
    onSuccess:  d => {
      toast.success('Yangi backup kodlar yaratildi')
      setBackupCodes(d.backupCodes)
    },
  })

  const copySecret = async () => {
    if (!setupData) return
    await navigator.clipboard.writeText(setupData.secret)
    setCopiedSecret(true)
    toast.success('Sekret nusxalandi')
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const copyBackupCodes = async () => {
    if (!backupCodes) return
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success('Backup kodlar nusxalandi')
  }

  // ─── Backup codes ko'rsatish (yangi yaratilgandan keyin) ───
  if (backupCodes) {
    return (
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-[#D97706]" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F172A]">Backup kodlarni saqlang</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
              Telefoningizni yo'qotsangiz, ushbu kodlardan foydalaning. Har bir kod faqat bir marta ishlaydi.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 p-4 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] font-mono text-sm">
          {backupCodes.map((c, i) => (
            <div key={i} className="text-center text-[#0F172A] py-1">{c}</div>
          ))}
        </div>

        <div className="flex gap-2 mt-4">
          <Button size="sm" variant="outline" leftIcon={<Copy size={14} />} onClick={copyBackupCodes}>
            Nusxalash
          </Button>
          <Button size="sm" onClick={() => setBackupCodes(null)}>
            Saqladim, davom etish
          </Button>
        </div>
      </Card>
    )
  }

  // ─── Setup jarayoni (QR + kod kiritish) ─────────────────────
  if (setupData) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="font-bold text-[#0F172A] mb-1">2FA sozlash</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Google Authenticator yoki shunga o'xshash ilovada QR-kodni skaner qiling
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] shrink-0 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCode} alt="QR" className="w-40 h-40" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-[#475569] font-medium mb-1">Yoki qo'lda kiriting:</p>
              <div className="flex items-center gap-2 p-2 bg-[#F8FAFC] rounded border border-[#E2E8F0]">
                <code className="text-xs text-[#0F172A] font-mono break-all flex-1">{setupData.secret}</code>
                <button
                  onClick={copySecret}
                  className="p-1 rounded text-[#94A3B8] hover:text-[#2563EB] shrink-0"
                  type="button"
                >
                  {copiedSecret ? <Check size={14} className="text-[#16A34A]" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <Input
              label="Ilovadagi 6 raqamli kod"
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="123456"
              inputMode="numeric"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => enableMut.mutate()}
            loading={enableMut.isPending}
            disabled={code.replace(/\s/g, '').length < 6}
          >
            Yoqish
          </Button>
          <Button variant="outline" onClick={() => { setSetupData(null); setCode('') }}>
            Bekor qilish
          </Button>
        </div>
      </Card>
    )
  }

  // ─── 2FA yoqilgan holat ────────────────────────────────────
  if (status?.enabled) {
    return (
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-[#16A34A]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#0F172A] text-sm">Ikki bosqichli tasdiqlash</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#16A34A] text-white">
                Yoqilgan
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
              Hisobingiz qo'shimcha xavfsizlik qatlami bilan himoyalangan
            </p>
          </div>
        </div>

        {showDisable ? (
          <div className="space-y-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
            <p className="text-xs text-[#991B1B]">
              2FA ni o'chirish uchun authenticator yoki backup kodni kiriting:
            </p>
            <Input
              value={disableCode}
              onChange={e => setDisableCode(e.target.value)}
              placeholder="Kod"
              inputMode="numeric"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="danger"
                onClick={() => disableMut.mutate()}
                loading={disableMut.isPending}
                disabled={disableCode.length < 4}
              >
                O'chirish
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowDisable(false); setDisableCode('') }}>
                Bekor qilish
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={13} />}
              onClick={() => regenerateMut.mutate()}
              loading={regenerateMut.isPending}
            >
              Yangi backup kodlar
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ShieldOff size={13} />}
              onClick={() => setShowDisable(true)}
            >
              O'chirish
            </Button>
          </div>
        )}
      </Card>
    )
  }

  // ─── 2FA o'chirilgan holat ─────────────────────────────────
  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-[#16A34A]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#0F172A] text-sm">Ikki bosqichli tasdiqlash</p>
          <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed mb-3">
            Hisobingizni himoya qilish uchun Google Authenticator orqali qo'shimcha himoya qatlamini yoqing.
          </p>
          <Button
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => setupMut.mutate()}
            loading={setupMut.isPending}
          >
            Yoqish
          </Button>
        </div>
      </div>
    </Card>
  )
}

// ─── Data Privacy (GDPR) ──────────────────────────────────
function DataPrivacy() {
  const [exporting, setExporting] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const exportData = async () => {
    setExporting(true)
    try {
      const res = await api.get('/users/export-data', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }))
      const a   = document.createElement('a')
      a.href     = url
      a.download = `myhujjat-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('Ma\'lumotlar yuklab olindi')
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Xatolik')
    } finally {
      setExporting(false)
    }
  }

  const deleteAccountMut = useMutation({
    mutationFn: () => api.post('/users/delete-account', { password }),
    onSuccess:  () => {
      toast.success("Hisob o'chirildi")
      localStorage.clear()
      window.location.href = '/'
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  return (
    <Card>
      <h2 className="font-bold text-[#0F172A] mb-4">Ma'lumot va maxfiylik</h2>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
            <Download size={18} className="text-[#2563EB]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#0F172A] text-sm">Ma'lumotlarimni yuklab olish</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed mb-2">
              Profil, tashkilotlar, shartnomalar va barcha boshqa ma'lumotlaringizni JSON formatida olib oling.
            </p>
            <Button
              size="xs"
              variant="outline"
              leftIcon={<Download size={13} />}
              loading={exporting}
              onClick={exportData}
            >
              JSON yuklab olish
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-[#DC2626]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#991B1B] text-sm">Hisobni o'chirish</p>
            <p className="text-xs text-[#7F1D1D] mt-0.5 leading-relaxed mb-2">
              Bu amal qaytarib bo'lmaydi. Barcha tashkilotlar, shartnomalar va ma'lumotlar butunlay o'chiriladi.
            </p>

            {!showDelete ? (
              <Button
                size="xs"
                variant="outline"
                leftIcon={<Trash2 size={13} />}
                onClick={() => setShowDelete(true)}
              >
                O'chirishni boshlash
              </Button>
            ) : (
              <div className="space-y-2 mt-2">
                <Input
                  label="Parolingiz"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Joriy parol"
                />
                <Input
                  label='Tasdiqlash uchun "OCHIRISH" deb yozing'
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder="OCHIRISH"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 size={13} />}
                    disabled={!password || confirmText !== 'OCHIRISH'}
                    loading={deleteAccountMut.isPending}
                    onClick={() => {
                      if (confirm("Hisobingiz va barcha ma'lumotlar butunlay o'chiriladi. Davom etamizmi?")) {
                        deleteAccountMut.mutate()
                      }
                    }}
                  >
                    Hisobni o'chirish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowDelete(false)
                    setPassword('')
                    setConfirmText('')
                  }}>
                    Bekor qilish
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}
