'use client'

import { useState }       from 'react'
import {
  Link2, CheckCircle2, AlertCircle, Loader2, Info, ExternalLink,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card }           from '@/components/ui/Card'
import { Button }         from '@/components/ui/Button'
import { Input }          from '@/components/ui/Input'
import { useAuth }        from '@/hooks/useAuth'
import api                from '@/lib/api'
import { formatDate }     from '@/lib/formatters'
import toast              from 'react-hot-toast'

interface Status {
  connected: boolean
  lastSync:  string | null
  error:     string | null
}

export default function DidoxIntegrationPage() {
  const { currentOrg } = useAuth()
  const qc = useQueryClient()
  const [apiKey,  setApiKey]  = useState('')
  const [userKey, setUserKey] = useState('')
  const [syncing, setSyncing] = useState(false)

  const { data: status, isLoading } = useQuery<Status>({
    queryKey: ['didox-status'],
    queryFn:  () => api.get('/didox/status').then(r => r.data),
  })

  const connectMut = useMutation({
    mutationFn: () => api.post('/didox/connect', { apiKey, userKey }),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['didox-status'] })
      toast.success('Didox ulandi ✓')
      setApiKey(''); setUserKey('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const disconnectMut = useMutation({
    mutationFn: () => api.delete('/didox/disconnect'),
    onSuccess:  () => {
      qc.invalidateQueries({ queryKey: ['didox-status'] })
      toast.success('Didox uzildi')
    },
  })

  async function handleSync() {
    if (!currentOrg?.id) return
    setSyncing(true)
    try {
      const { data } = await api.post('/invoices/sync/didox', {
        orgId: currentOrg.id,
        fromDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      toast.success(`${data.created} yangi, ${data.updated} yangilandi`)
      qc.invalidateQueries({ queryKey: ['didox-status'] })
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Sinxronlash xatosi')
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Sarlavha */}
      <div>
        <h2 className="font-display text-xl font-black text-[#0F172A]">Didox integratsiyasi</h2>
        <p className="text-sm text-[#475569] mt-1">
          Didox API orqali fakturalarni avtomatik sinxronlash va shartnoma summasini nazorat qilish
        </p>
      </div>

      {/* Status */}
      <Card>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 size={20} className="animate-spin text-[#2563EB]" />
          </div>
        ) : status?.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] flex items-center justify-center">
                <CheckCircle2 size={18} className="text-[#16A34A]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#0F172A]">Didox ulangan</p>
                <p className="text-xs text-[#94A3B8]">
                  Oxirgi sinxronlash:{' '}
                  {status.lastSync ? formatDate(status.lastSync, 'long') : 'hali yo\'q'}
                </p>
              </div>
              <Button size="sm" variant="danger" onClick={() => disconnectMut.mutate()}
                loading={disconnectMut.isPending}>
                Uzish
              </Button>
            </div>

            {status.error && (
              <div className="p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-lg flex items-start gap-2">
                <AlertCircle size={14} className="text-[#DC2626] shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#991B1B]">Sinxronlash xatosi:</p>
                  <p className="text-xs text-[#7F1D1D] mt-0.5">{status.error}</p>
                </div>
              </div>
            )}

            <Button fullWidth onClick={handleSync} loading={syncing}
              leftIcon={<Link2 size={14} />}>
              Hozir sinxronlash (oxirgi 30 kun)
            </Button>

            <div className="text-xs text-[#94A3B8] flex items-center gap-1.5">
              <Info size={12} />
              Avtomatik sinxronlash har 30 daqiqada amalga oshiriladi
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center">
                <Link2 size={18} className="text-[#94A3B8]" />
              </div>
              <div>
                <p className="font-semibold text-[#0F172A]">Didox ulanmagan</p>
                <p className="text-xs text-[#94A3B8]">Ulash uchun API kalitlarini kiriting</p>
              </div>
            </div>

            <Input
              label="api-key (partner-token)"
              placeholder="01890b96-a513-4557-..."
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              hint="Didox dan oling: Sozlamalar → API integratsiya"
            />
            <Input
              label="user-key (yuridik shaxs identifikatori)"
              placeholder="01890b96-a513-4557-..."
              value={userKey}
              onChange={e => setUserKey(e.target.value)}
            />

            <Button
              fullWidth
              loading={connectMut.isPending}
              disabled={!apiKey.trim() || !userKey.trim()}
              onClick={() => connectMut.mutate()}
              leftIcon={<Link2 size={14} />}
            >
              Ulash
            </Button>
          </div>
        )}
      </Card>

      {/* Yo'riqnoma */}
      <Card>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          API kalit qanday olish?
        </p>
        <ol className="space-y-2 text-sm text-[#475569]">
          <li className="flex gap-2">
            <span className="font-bold text-[#2563EB]">1.</span>
            <span><a href="https://didox.uz" target="_blank" rel="noopener noreferrer"
              className="text-[#2563EB] hover:underline inline-flex items-center gap-1">
              didox.uz <ExternalLink size={11} />
            </a> ga kirib hisob oching (yoki E-imzo bilan kiring)</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#2563EB]">2.</span>
            <span>Sozlamalar → API integratsiya bo'limini tanlang</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#2563EB]">3.</span>
            <span>"Yangi token yaratish" tugmasini bosing</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#2563EB]">4.</span>
            <span><strong>api-key</strong> va <strong>user-key</strong> ni nusxalab, yuqoridagi maydonlarga joylang</span>
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-[#2563EB]">5.</span>
            <span>"Ulash" tugmasini bosing — tayyor!</span>
          </li>
        </ol>

        <div className="mt-4 p-3 bg-[#F0F9FF] border border-[#BFDBFE] rounded-lg flex items-start gap-2">
          <Info size={14} className="text-[#2563EB] shrink-0 mt-0.5" />
          <div className="text-xs text-[#1E40AF]">
            <strong>API access</strong> Didox tomonidan alohida so'rov asosida beriladi. Agar "API integratsiya"
            bo'limi sizda ko'rinmasa, <a href="mailto:support@didox.uz" className="underline">support@didox.uz</a>
            yoki Telegram <a href="https://t.me/didox_uz" target="_blank" rel="noopener noreferrer" className="underline">@didox_uz</a> ga yozing.
          </div>
        </div>
      </Card>

      {/* Funksional bo'limlar */}
      <Card>
        <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          Bu integratsiya nima beradi?
        </p>
        <div className="space-y-3 text-sm">
          {[
            { icon: '📥', title: 'Avtomatik faktura sinxronlash',
              desc: "Didox dagi barcha fakturalar har 30 daqiqada bizning saytga yuklanadi" },
            { icon: '🎯', title: 'Shartnoma bo\'yicha avtomatik bog\'lash',
              desc: "Faktura ichidagi shartnoma raqami bo'yicha avtomatik bog'lanadi" },
            { icon: '🚨', title: 'Summa nazorati va ogohlantirish',
              desc: "Faktura summasi shartnoma summasidan oshib ketsa darhol xabar olasiz" },
            { icon: '📊', title: 'Hisobot va tahlil',
              desc: "Har bir shartnoma bo'yicha qancha foiz ishlatilgani ko'rinadi" },
          ].map(item => (
            <div key={item.title} className="flex items-start gap-3">
              <div className="text-2xl shrink-0">{item.icon}</div>
              <div>
                <p className="text-sm font-semibold text-[#0F172A]">{item.title}</p>
                <p className="text-xs text-[#94A3B8] mt-0.5">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
