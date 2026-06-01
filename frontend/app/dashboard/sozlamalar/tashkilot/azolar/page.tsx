'use client'

import { useState }                              from 'react'
import { useTranslations }                       from 'next-intl'
import { Link2, UserMinus, Copy, Check, Users, Shield, ArrowLeftRight, AlertTriangle }  from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card }                                  from '@/components/ui/Card'
import { Button }                                from '@/components/ui/Button'
import { Badge }                                 from '@/components/ui/Badge'
import { Select }                                from '@/components/ui/Select'
import { Modal, ConfirmDialog }                  from '@/components/ui/Modal'
import { useAuth }                               from '@/hooks/useAuth'
import api                                       from '@/lib/api'
import toast                                     from 'react-hot-toast'

export default function AzolarPage() {
  const t = useTranslations('settings')
  const { currentOrg, user: me } = useAuth()
  const qc             = useQueryClient()
  const [copied,       setCopied]       = useState(false)
  const [inviteUrl,    setInviteUrl]    = useState('')
  const [inviteRole,   setInviteRole]   = useState('MEMBER')
  const [removeId,     setRemoveId]     = useState<string | null>(null)
  const [transferOpen, setTransferOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [confirmTransfer, setConfirmTransfer] = useState(false)

  const ROLE_LABELS: Record<string, { label: string; variant: any; desc: string }> = {
    OWNER:      { label: t('roleOwner'),      variant: 'primary', desc: t('roleOwnerDesc') },
    ACCOUNTANT: { label: t('roleAccountant'), variant: 'warning', desc: t('roleAccountantDesc') },
    MEMBER:     { label: t('roleMember'),     variant: 'default', desc: t('roleMemberDesc') },
  }

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
      toast.success(t('inviteCreated'))
    },
    onError: () => toast.error(t('error')),
  })

  const removeMutation = useMutation({
    mutationFn: (memberId: string) =>
      api.delete(`/orgs/${currentOrg?.id}/members/${memberId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast.success(t('memberRemoved'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const roleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      api.put(`/orgs/${currentOrg?.id}/members/${memberId}/role`, { role }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast.success(t('roleUpdated'))
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const transferMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post(`/orgs/${currentOrg?.id}/members/transfer-owner`, { userId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-members'] })
      toast.success(t('transferOwnerSuccess'))
      setTransferOpen(false)
      setConfirmTransfer(false)
      setSelectedUserId('')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myMember = members.find((m: any) => m.user?.id === me?.id)
  const isOwner  = myMember?.role === 'OWNER'

  const transferableMembers = members.filter(
    (m: any) => m.role !== 'OWNER' && m.status === 'ACTIVE' && m.user,
  )

  const selectedMember = transferableMembers.find((m: any) => m.user?.id === selectedUserId)

  const memberDisplayName = (m: any) =>
    `${m.user?.firstName || ''} ${m.user?.lastName || ''}`.trim() || m.user?.email || ''

  return (
    <div className="max-w-2xl space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-[#0F172A]">{t('azolarTitle')}</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {t('azolarCount', { count: members.length })}
          </p>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => { setTransferOpen(true); setSelectedUserId(''); setConfirmTransfer(false) }}
              className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#DC2626] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#FEE2E2]"
            >
              <ArrowLeftRight size={13} />
              {t('transferOwnerBtn')}
            </button>
            <Select
              options={[
                { value: 'MEMBER',     label: t('roleMember') },
                { value: 'ACCOUNTANT', label: t('roleAccountant') },
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
              {t('inviteLink')}
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
                {t('inviteLinkReady')}
              </p>
              <p className="text-xs text-[#3B82F6] mt-0.5 mb-2">
                {t('inviteLinkDesc')}
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

      <Card>
        <div className="flex items-start gap-3 mb-3">
          <Shield size={16} className="text-[#94A3B8] mt-0.5" />
          <div className="text-xs text-[#475569] leading-relaxed">
            <strong className="text-[#0F172A]">{t('rolesInfoLabel')}</strong> {' '}
            <span className="text-[#2563EB]">{t('roleOwner')}</span> — {t('roleOwnerDesc').toLowerCase()};{' '}
            <span className="text-[#D97706]">{t('roleAccountant')}</span> — {t('roleAccountantDesc').toLowerCase()};{' '}
            <span className="text-[#475569]">{t('roleMember')}</span> — {t('roleMemberDesc').toLowerCase()}.
          </div>
        </div>
      </Card>

      <Card padding="none">
        <div className="divide-y divide-[#F1F5F9]">
          {isLoading ? (
            <div className="py-8 text-center">
              <p className="text-sm text-[#94A3B8]">{t('azolarLoading')}</p>
            </div>
          ) : members.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <Users size={28} className="text-[#CBD5E1] mx-auto mb-3" />
              <p className="text-sm font-semibold text-[#0F172A]">{t('azolarEmpty')}</p>
              <p className="text-xs text-[#94A3B8] mt-1">{t('azolarEmptyDesc')}</p>
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
                        : member.invitedEmail || t('pending')}
                    </p>
                    {isMe && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#475569] font-medium">
                        {t('you')}
                      </span>
                    )}
                    {member.status === 'PENDING' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#FEF3C7] text-[#D97706] font-medium">
                        {t('pending')}
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
                    <option value="MEMBER">{t('roleMember')}</option>
                    <option value="ACCOUNTANT">{t('roleAccountant')}</option>
                  </select>
                ) : (
                  <Badge variant={ROLE_LABELS[member.role]?.variant || 'default'} size="sm">
                    {ROLE_LABELS[member.role]?.label || member.role}
                  </Badge>
                )}

                {isOwner && member.role !== 'OWNER' && !isMe && (
                  <button
                    onClick={() => setRemoveId(member.id)}
                    className="p-1.5 rounded text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-all"
                    title={t('deleteRm')}
                  >
                    <UserMinus size={13} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </Card>

      {/* Transfer Ownership Modal */}
      <Modal
        open={transferOpen}
        onClose={() => { setTransferOpen(false); setConfirmTransfer(false); setSelectedUserId('') }}
        title={t('transferOwnerTitle')}
        size="sm"
        footer={
          confirmTransfer ? (
            <>
              <Button variant="outline" size="sm" onClick={() => setConfirmTransfer(false)}>
                {'←'} Orqaga
              </Button>
              <Button
                size="sm"
                variant="danger"
                loading={transferMutation.isPending}
                onClick={() => transferMutation.mutate(selectedUserId)}
              >
                {t('transferOwnerConfirm')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => { setTransferOpen(false); setSelectedUserId('') }}>
                Bekor qilish
              </Button>
              <Button
                size="sm"
                disabled={!selectedUserId}
                onClick={() => setConfirmTransfer(true)}
              >
                Davom etish
              </Button>
            </>
          )
        }
      >
        {!confirmTransfer ? (
          <div className="space-y-4">
            <p className="text-sm text-[#475569]">{t('transferOwnerSelect')}:</p>

            {transferableMembers.length === 0 ? (
              <div className="py-6 text-center">
                <Users size={24} className="text-[#CBD5E1] mx-auto mb-2" />
                <p className="text-sm text-[#94A3B8]">{t('transferOwnerNoMembers')}</p>
              </div>
            ) : (
              <div className="space-y-2">
                {transferableMembers.map((member: any) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedUserId(member.user.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                      selectedUserId === member.user.id
                        ? 'border-[#2563EB] bg-[#DBEAFE]/30'
                        : 'border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-[#F8FAFC]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                      <span className="text-[#2563EB] text-sm font-bold">
                        {member.user?.firstName?.[0] || member.user?.email?.[0]?.toUpperCase() || '?'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#0F172A] truncate">
                        {memberDisplayName(member)}
                      </p>
                      <p className="text-xs text-[#94A3B8] truncate">{member.user?.email}</p>
                    </div>
                    <Badge variant={ROLE_LABELS[member.role]?.variant || 'default'} size="sm">
                      {ROLE_LABELS[member.role]?.label || member.role}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A]">
              <AlertTriangle size={16} className="text-[#D97706] shrink-0 mt-0.5" />
              <p className="text-sm text-[#92400E]">{t('transferOwnerDesc')}</p>
            </div>

            {selectedMember && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                  <span className="text-[#2563EB] font-bold">
                    {selectedMember.user?.firstName?.[0] || selectedMember.user?.email?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0F172A]">{memberDisplayName(selectedMember)}</p>
                  <p className="text-xs text-[#94A3B8]">{selectedMember.user?.email}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!removeId}
        onClose={() => setRemoveId(null)}
        onConfirm={() => { if (removeId) { removeMutation.mutate(removeId); setRemoveId(null) } }}
        title={t('deleteRm')}
        description={t('removeMember')}
        variant="danger"
        loading={removeMutation.isPending}
      />
    </div>
  )
}
