'use client'

import { useState }    from 'react'
import {
  Plus, Building2, Star, Edit2, Trash2,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader }   from '@/components/layout/PageHeader'
import { Button }       from '@/components/ui/Button'
import { Card }         from '@/components/ui/Card'
import { Badge }        from '@/components/ui/Badge'
import { Modal }        from '@/components/ui/Modal'
import { EmptyState }   from '@/components/ui/Skeleton'
import { useAuth }      from '@/hooks/useAuth'
import api              from '@/lib/api'
import toast            from 'react-hot-toast'
import { cn }           from '@/lib/cn'
import type { Organization } from '@/lib/types'

import { OrgFormModal } from './_components/OrgFormModal'

export default function TashkilotlarPage() {
  const { setCurrentOrg, currentOrg } = useAuth()
  const qc = useQueryClient()

  const [addModal,  setAddModal]  = useState(false)
  const [editOrg,   setEditOrg]   = useState<Organization | null>(null)
  const [deleteOrg, setDeleteOrg] = useState<Organization | null>(null)

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn:  async () => {
      const { data } = await api.get('/organizations')
      return data as Organization[]
    }
  })

  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => api.put(`/organizations/${id}/set-default`),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['organizations'] })
      const org = orgs.find(o => o.id === id)
      if (org) setCurrentOrg(org)
      toast.success("Default tashkilot o'rnatildi")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/organizations/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organizations'] })
      toast.success("Tashkilot o'chirildi")
      setDeleteOrg(null)
    }
  })

  return (
    <div>
      <PageHeader
        title="Tashkilotlar"
        description="Tashkilotlaringizni boshqaring"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Tashkilotlar' }
        ]}
        actions={
          <Button leftIcon={<Plus size={14} />} size="sm" onClick={() => setAddModal(true)}>
            Qo'shish
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => (
            <div key={i} className="h-40 bg-white rounded-xl border border-[#E2E8F0] animate-pulse" />
          ))}
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={<Building2 size={28} />}
          title="Tashkilot yo'q"
          description="Hujjat yaratish uchun avval tashkilotingizni qo'shing"
          action={{ label: "Tashkilot qo'shish", onClick: () => setAddModal(true) }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orgs.map(org => (
            <OrgCard
              key={org.id}
              org={org}
              isCurrent={org.id === currentOrg?.id}
              onSetDefault={() => setDefaultMutation.mutate(org.id)}
              onEdit={() => setEditOrg(org)}
              onDelete={() => setDeleteOrg(org)}
            />
          ))}

          <button
            onClick={() => setAddModal(true)}
            className="min-h-[160px] rounded-xl border-2 border-dashed border-[#E2E8F0] hover:border-[#2563EB]/40 hover:bg-[#DBEAFE]/10 transition-all flex flex-col items-center justify-center gap-2 text-[#94A3B8] hover:text-[#2563EB]"
          >
            <Plus size={24} />
            <span className="text-sm font-medium">Tashkilot qo'shish</span>
          </button>
        </div>
      )}

      <OrgFormModal
        open={addModal || !!editOrg}
        org={editOrg}
        onClose={() => { setAddModal(false); setEditOrg(null) }}
      />

      {deleteOrg && (
        <Modal
          open={!!deleteOrg}
          onClose={() => setDeleteOrg(null)}
          title="Tashkilotni o'chirish"
          size="sm"
          footer={
            <>
              <Button variant="outline" size="sm" onClick={() => setDeleteOrg(null)}>
                Bekor qilish
              </Button>
              <Button variant="danger" size="sm"
                loading={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteOrg.id)}>
                O'chirish
              </Button>
            </>
          }
        >
          <p className="text-sm text-[#475569]">
            <strong>{deleteOrg.name}</strong> tashkilotini o'chirmoqchimisiz?
            Bu amal orqali barcha shartnomalar va hujjatlar ham o'chiriladi.
          </p>
        </Modal>
      )}
    </div>
  )
}

interface OrgCardProps {
  org:           Organization
  isCurrent:     boolean
  onSetDefault: () => void
  onEdit:       () => void
  onDelete:     () => void
}

function OrgCard({ org, isCurrent, onSetDefault, onEdit, onDelete }: OrgCardProps) {
  return (
    <Card className={cn('relative', isCurrent && 'border-[#2563EB]/40 bg-[#DBEAFE]/10')}>
      {org.isDefault && (
        <div className="absolute top-3 right-3">
          <Badge variant="primary" size="sm">
            <Star size={10} className="mr-1 fill-current" />
            Asosiy
          </Badge>
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] flex items-center justify-center shrink-0">
          <span className="font-bold text-[#2563EB] text-base">
            {org.name?.[0]?.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <p className="font-display font-bold text-[#0F172A] truncate">{org.name}</p>
          {org.inn && <p className="text-xs text-[#94A3B8]">STIR: {org.inn}</p>}
        </div>
      </div>

      <div className="space-y-1 mb-4">
        {org.directorName && <p className="text-xs text-[#475569]">👤 {org.directorName}</p>}
        {org.address      && <p className="text-xs text-[#94A3B8] truncate">📍 {org.address}</p>}
        {org.bankName     && <p className="text-xs text-[#94A3B8]">🏦 {org.bankName}</p>}
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-[#E2E8F0]">
        {!org.isDefault && (
          <button
            onClick={onSetDefault}
            className="flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#2563EB] transition-colors"
          >
            <Star size={13} />
            Asosiy qilish
          </button>
        )}
        <div className="flex-1" />
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#475569] hover:bg-[#F1F5F9] transition-colors"
        >
          <Edit2 size={14} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </Card>
  )
}
