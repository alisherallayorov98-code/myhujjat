'use client'

import { useState }           from 'react'
import { useTranslations }    from 'next-intl'
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
  const t = useTranslations('security')
  const checks = [
    { label: t('checkLength'), ok: password.length >= 8 },
    { label: t('checkNumber'), ok: /\d/.test(password) },
    { label: t('checkUpper'),  ok: /[A-Z]/.test(password) },
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
  const t = useTranslations('security')
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
      toast.success(t('passwordChanged'))
      setForm({ oldPassword: '', newPassword: '', confirm: '' })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const canSubmit =
    !!form.oldPassword &&
    form.newPassword.length >= 6 &&
    form.newPassword === form.confirm

  return (
    <div className="space-y-5 max-w-lg">
      <Card>
        <h2 className="font-bold text-[#0F172A] mb-4">{t('changePassword')}</h2>
        <div className="space-y-4">
          <Input
            label={t('currentPassword')}
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
              label={t('newPassword')}
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
            label={t('confirmNewPassword')}
            type="password"
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            error={
              form.confirm && form.confirm !== form.newPassword
                ? t('passwordsDontMatch')
                : undefined
            }
          />

          <Button
            leftIcon={<Lock size={14} />}
            loading={mutation.isPending}
            disabled={!canSubmit}
            onClick={() => mutation.mutate()}
          >
            {t('changePasswordBtn')}
          </Button>
        </div>
      </Card>

      <TwoFactor />

      <ActiveSessions />

      <DataPrivacy />
    </div>
  )
}

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
  const t = useTranslations('security')
  const qc = useQueryClient()

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['sessions'],
    queryFn:  () => api.get('/sessions').then(r => r.data),
  })

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/sessions/${id}`),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success(t('sessionRevoked'))
    },
  })

  const revokeAllMut = useMutation({
    mutationFn: () => api.delete('/sessions/all/except-current'),
    onSuccess:  (res: any) => {
      qc.invalidateQueries({ queryKey: ['sessions'] })
      toast.success(t('sessionsRevoked', { count: res.data?.revoked || 0 }))
    },
  })

  const otherSessions = sessions.filter(s => !s.isCurrent)

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-[#0F172A]">{t('activeSessions')}</h2>
        {otherSessions.length > 0 && (
          <Button size="xs" variant="outline" onClick={() => {
            if (confirm(t('logoutFromAllConfirm'))) revokeAllMut.mutate()
          }}>
            {t('logoutFromAll')}
          </Button>
        )}
      </div>
      <p className="text-xs text-[#94A3B8] mb-4">
        {t('sessionsHint')}
      </p>

      {isLoading ? (
        <div className="text-sm text-[#94A3B8] text-center py-4">{t('loading')}</div>
      ) : sessions.length === 0 ? (
        <div className="text-sm text-[#94A3B8] text-center py-4">{t('noActiveSessions')}</div>
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
                        {t('current')}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    {s.ipAddress || t('ipUnknown')} · {formatDate(s.createdAt, 'short')}
                  </p>
                </div>
                {!s.isCurrent && (
                  <button
                    onClick={() => {
                      if (confirm(t('logoutDeviceConfirm'))) revokeMut.mutate(s.id)
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

function TwoFactor() {
  const t = useTranslations('security')
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
    onError:    (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const enableMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/enable', { code }).then(r => r.data),
    onSuccess:  d => {
      toast.success(t('twofaEnabled2'))
      setBackupCodes(d.backupCodes)
      setSetupData(null)
      setCode('')
      qc.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('wrongCode')),
  })

  const disableMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/disable', { code: disableCode }).then(r => r.data),
    onSuccess:  () => {
      toast.success(t('twofaDisabled'))
      setShowDisable(false)
      setDisableCode('')
      qc.invalidateQueries({ queryKey: ['2fa-status'] })
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('wrongCode')),
  })

  const regenerateMut = useMutation({
    mutationFn: () => api.post('/auth/2fa/regenerate-codes').then(r => r.data),
    onSuccess:  d => {
      toast.success(t('newBackupCodesGen'))
      setBackupCodes(d.backupCodes)
    },
  })

  const copySecret = async () => {
    if (!setupData) return
    await navigator.clipboard.writeText(setupData.secret)
    setCopiedSecret(true)
    toast.success(t('secretCopied'))
    setTimeout(() => setCopiedSecret(false), 2000)
  }

  const copyBackupCodes = async () => {
    if (!backupCodes) return
    await navigator.clipboard.writeText(backupCodes.join('\n'))
    toast.success(t('backupCopied'))
  }

  if (backupCodes) {
    return (
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-[#D97706]" />
          </div>
          <div>
            <h2 className="font-bold text-[#0F172A]">{t('saveBackupCodes')}</h2>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
              {t('saveBackupCodesDesc')}
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
            {t('copy')}
          </Button>
          <Button size="sm" onClick={() => setBackupCodes(null)}>
            {t('savedContinue')}
          </Button>
        </div>
      </Card>
    )
  }

  if (setupData) {
    return (
      <Card>
        <div className="mb-4">
          <h2 className="font-bold text-[#0F172A] mb-1">{t('twofaSetupTitle')}</h2>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            {t('twofaSetupDesc')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="bg-white p-2 rounded-lg border border-[#E2E8F0] shrink-0 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={setupData.qrCode} alt="QR" className="w-40 h-40" />
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className="text-xs text-[#475569] font-medium mb-1">{t('orManually')}</p>
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
              label={t('code6digit')}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder={t('code6place')}
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
            {t('enable')}
          </Button>
          <Button variant="outline" onClick={() => { setSetupData(null); setCode('') }}>
            {t('cancel')}
          </Button>
        </div>
      </Card>
    )
  }

  if (status?.enabled) {
    return (
      <Card>
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
            <ShieldCheck size={18} className="text-[#16A34A]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-[#0F172A] text-sm">{t('twofa')}</p>
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#16A34A] text-white">
                {t('twofaEnabled')}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed">
              {t('twofaProtected')}
            </p>
          </div>
        </div>

        {showDisable ? (
          <div className="space-y-3 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-lg">
            <p className="text-xs text-[#991B1B]">
              {t('twofaDisableEnter')}
            </p>
            <Input
              value={disableCode}
              onChange={e => setDisableCode(e.target.value)}
              placeholder={t('code')}
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
                {t('disable')}
              </Button>
              <Button size="sm" variant="outline" onClick={() => { setShowDisable(false); setDisableCode('') }}>
                {t('cancel')}
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
              {t('newBackupCodes')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<ShieldOff size={13} />}
              onClick={() => setShowDisable(true)}
            >
              {t('disable')}
            </Button>
          </div>
        )}
      </Card>
    )
  }

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-[#16A34A]" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-[#0F172A] text-sm">{t('twofa')}</p>
          <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed mb-3">
            {t('twofaProtectAccount')}
          </p>
          <Button
            size="sm"
            leftIcon={<ShieldCheck size={14} />}
            onClick={() => setupMut.mutate()}
            loading={setupMut.isPending}
          >
            {t('enable')}
          </Button>
        </div>
      </div>
    </Card>
  )
}

function DataPrivacy() {
  const t = useTranslations('security')
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
      toast.success(t('dataDownloaded'))
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('error'))
    } finally {
      setExporting(false)
    }
  }

  const deleteAccountMut = useMutation({
    mutationFn: () => api.post('/users/delete-account', { password }),
    onSuccess:  () => {
      toast.success(t('accountDeleted'))
      localStorage.clear()
      window.location.href = '/'
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  return (
    <Card>
      <h2 className="font-bold text-[#0F172A] mb-4">{t('dataPrivacy')}</h2>

      <div className="space-y-3">
        <div className="flex items-start gap-3 p-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
          <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
            <Download size={18} className="text-[#2563EB]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#0F172A] text-sm">{t('downloadData')}</p>
            <p className="text-xs text-[#94A3B8] mt-0.5 leading-relaxed mb-2">
              {t('downloadDataDesc')}
            </p>
            <Button
              size="xs"
              variant="outline"
              leftIcon={<Download size={13} />}
              loading={exporting}
              onClick={exportData}
            >
              {t('downloadJson')}
            </Button>
          </div>
        </div>

        <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] rounded-lg border border-[#FECACA]">
          <div className="w-10 h-10 rounded-xl bg-[#FEE2E2] flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-[#DC2626]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#991B1B] text-sm">{t('deleteAccount')}</p>
            <p className="text-xs text-[#7F1D1D] mt-0.5 leading-relaxed mb-2">
              {t('deleteAccountDesc')}
            </p>

            {!showDelete ? (
              <Button
                size="xs"
                variant="outline"
                leftIcon={<Trash2 size={13} />}
                onClick={() => setShowDelete(true)}
              >
                {t('startDelete')}
              </Button>
            ) : (
              <div className="space-y-2 mt-2">
                <Input
                  label={t('yourPassword')}
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={t('yourPasswordPlace')}
                />
                <Input
                  label={t('typeOchirish')}
                  value={confirmText}
                  onChange={e => setConfirmText(e.target.value)}
                  placeholder={t('typeOchirishPlace')}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    leftIcon={<Trash2 size={13} />}
                    disabled={!password || confirmText !== 'OCHIRISH'}
                    loading={deleteAccountMut.isPending}
                    onClick={() => {
                      if (confirm(t('deleteAccountConfirm'))) {
                        deleteAccountMut.mutate()
                      }
                    }}
                  >
                    {t('deleteAccountBtn')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    setShowDelete(false)
                    setPassword('')
                    setConfirmText('')
                  }}>
                    {t('cancel')}
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
