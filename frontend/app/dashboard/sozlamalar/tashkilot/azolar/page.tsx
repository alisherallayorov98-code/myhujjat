'use client'

import { useState }                              from 'react'
import { Link2, UserMinus, Copy, Check, Users, Shield }  from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card }                                  from '@/components/ui/Card'
import { Button }                                from '@/components/ui/Button'
import { Badge }                                 from '@/components/ui/Badge'
import { Select }                                from '@/components/ui/Select'
import { useAuth }                               from '@/hooks/useAuth'
import api                                       from '@/lib/api'
import toast                                     from 'react-hot-toast'

const ROLE_LABELS: Record<string, { label: string; variant: any; desc: string }> = {
  OWNER:      { label: 'Egasi',     variant: 'primary', desc: 'To\'liq nazorat' },
  ACCOUNTANT: { label: 'Buxgalter', variant: 'warning', desc: 'Faktura, hisobotlar' },
  MEMBER:     { label: "A'zo",      variant: 'default', desc: 'Ko\'rish va yaratish' },
}

export default function AzolarPage() {
  const { currentOrg, user: me } = useAuth()
  const qc             = useQueryClient()
  const [copied,     setCopied]     = useState(false)
  const [inviteUrl,  setInviteUrl]  = useState('')
  const [inviteRole, setInviteRole] = useState('MEMBER')

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['org-members', currentOrg?.id],
    queryFn:  async () => {
      if (!currentOrg?.id) return []
      const { data } = await api.get(`/orgs/${currentOrg.id}/members`)
      return data
    },
    enabled: !!currentOrg?.id,
  })

  const inviteMutation = useMutation({
    mutationFn: (role: string) =>
      api.post(`/orgs/${currentOrg?.id}/members/invite`, { role }),
    onSuccess: (res: any) => {
      setInviteUrl(res.data.url)
      toast.success('Invite link yaratildi')
    },
    onError: () => toast.error('Xatolik'),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/orgs/${currentOrg?.id}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast.success("A'zo o'chirildi")
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/orgs/${currentOrg?.id}/members/${memberId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast.success('Rol yangilandi')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Xatolik'),
  })

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Joriy foydalanuvchi OWNER mi? (faqat OWNER rol va o'chirish qila oladi)
  const myMember = members.find((m: any) => m.user?.id === me?.id)
  const isOwner  = myMember?.role === 'OWNER'

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-[#0F172A]">Tashkilot a'zolari</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {members.length} ta a'zo
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <Select
              options={[
                { value: 'MEMBER',     label: "A'zo" },
                { value: 'ACCOUNTANT', label: 'Buxgalter' },
              ]}
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value)}
              className="!min-w-[120px]"
            />
            <Button
              size="sm"
              leftIcon={<Link2 size={14} />}
              loading={inviteMutation.isPending}
              onClick={() => inviteMutation.mutate(inviteRole)}
            >
              Invite link
            </Button>
          </div>
        )}
      </div>

      {inviteUrl && (
        <Card className="bg-[#F0F9FF] border-[#BFDBFE]">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
              <Link2 size={16} className="text-[#2563EB]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-[#1E40AF]">
                Invite link tayyor — 7 kun amal qiladi
              </p>
              <p className="text-xs text-[#3B82F6] mt-0.5 mb-2">
                Bu havolani siz taklif qilmoqchi bo'lgan odamga yuboring
              </p>
              <div className="flex items-center gap-2">
                <input
                  value={inviteUrl}
                  readOnly
                  className="flex-1 text-xs text-[#475569] bg-white border border-[#BFDBFE] rounded-lg px-3 py-2 outline-none"
                />
                <button
                  onClick={copyInvite}
                  className="p-2 rounded-lg bg-white border border-[#BFDBFE] hover:bg-[#DBEAFE] transition-colors"
                >
                  {copied
                    ? <Check size={14} className="text-[#16A34A]" />
                    : <Copy  size={14} className="text-[#2563EB]" />
                  }
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Rol haqida qisqa ma'lumot */}
      <Card>
        <div className="flex items-start gap-3 mb-3">
          <Shield size={16} className="text-[#94A3B8] mt-0.5" />
          <div className="text-xs text-[#475569] leading-relaxed">
            <strong className="text-[#0F172A]">Rollar:</strong> {' '}
            <span className="text-[#2563EB]">Egasi</span> — to'liq nazorat;{' '}
            <span className="text-[#D97706]">Buxgalter</span> — faktura va hisobotlar;{' '}
            <span className="text-[#475569]">A'zo</span> — ko'rish va yaratish.
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="divide-y divide-[#F1F5F9]">
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#94A3B8]">Yuklanmoqda...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Users size={28} className="text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#0F172A]">A'zolar yo'q</p>
              <p className="text-xs text-[#94A3B8] mt-1">Invite link orqali a'zo qo'shing</p>
            </div>
          ) : members.map((member: any) => {
            const isMe = member.user?.id === me?.id
            return (
              <div key={member.id} className="flex items-center gap-3 px-4 py-3 group">
                <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                  <span className="text-[#2563EB] text-sm font-bold">
                    {member.user?.firstName?.[0] || member.user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-[#0F172A] truncate">
                      {member.user
                        ? `${member.user.firstName || ''} ${member.user.lastName || ''}`.trim() || member.user.email
                        : member.invitedEmail || "Kutilmoqda"}
                    </p>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-medium">
                        Siz
                      </span>
                    )}
                    {member.status === 'PENDING' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] font-medium">
                        Kutilmoqda
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#94A3B8] truncate">
                    {member.user?.email || member.invitedEmail}
                  </p>
                </div>

                {isOwner && member.role !== 'OWNER' ? (
                  <select
                    value={member.role}
                    onChange={e => roleMutation.mutate({ memberId: member.id, role: e.target.value })}
                    className="text-xs h-8 px-2 rounded-lg border border-[#E2E8F0] bg-white text-[#475569] outline-none focus:border-[#2563EB]"
                  >
                    <option value="MEMBER">A'zo</option>
                    <option value="ACCOUNTANT">Buxgalter</option>
                  </select>
                ) : (
                  <Badge variant={ROLE_LABELS[member.role]?.variant || 'default'} size="sm">
                    {ROLE_LABELS[member.role]?.label || member.role}
                  </Badge>
                )}

                {isOwner && member.role !== 'OWNER' && !isMe && (
                  <button
                    onClick={() => {
                      if (confirm("A'zoni o'chirilsinmi?")) removeMutation.mutate(member.id)
                    }}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                    title="O'chirish"
                  >
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
