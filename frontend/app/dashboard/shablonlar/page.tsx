'use client'

import { useState }                                        from 'react'
import Link                                                from 'next/link'
import { useRouter }                                       from 'next/navigation'
import { FileText, Lock, Plus, Edit2, Trash2, Copy, Eye } from 'lucide-react'
import { useQuery, useMutation, useQueryClient }           from '@tanstack/react-query'
import { PageHeader }                                      from '@/components/layout/PageHeader'
import { Card }                                            from '@/components/ui/Card'
import { Button }                                          from '@/components/ui/Button'
import { Badge }                                           from '@/components/ui/Badge'
import { EmptyState }                                      from '@/components/ui/Skeleton'
import { useAuth }                                         from '@/hooks/useAuth'
import api                                                 from '@/lib/api'
import { CONTRACT_TYPE_CONFIG }                            from '@/lib/contractTemplates'
import { INDUSTRY_TEMPLATES, INDUSTRIES }                  from '@/lib/industryTemplates'
import { cn }                                              from '@/lib/cn'

interface Template {
  id:             string
  contractType:   string
  name:           string
  isSystem:       boolean
  isPublic:       boolean
  organizationId: string | null
  createdAt:      string
}

function ConfirmDialog({
  open, onConfirm, onCancel, loading,
}: { open: boolean; onConfirm: () => void; onCancel: () => void; loading: boolean }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h3 className="text-base font-semibold text-[#0F172A] mb-2">Shablonni o'chirish</h3>
        <p className="text-sm text-[#475569] mb-5">
          Ushbu shablonni o'chirishni tasdiqlaysizmi? Bu amalni qaytarib bo'lmaydi.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>Bekor qilish</Button>
          <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>O'chirish</Button>
        </div>
      </div>
    </div>
  )
}

export default function ShablonlarPage() {
  const { currentOrg, isPro } = useAuth()
  const router                = useRouter()
  const qc                    = useQueryClient()

  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates', currentOrg?.id],
    queryFn:  () => api.get(`/templates?orgId=${currentOrg!.id}`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) =>
      api.delete(`/templates/${id}?orgId=${currentOrg!.id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] })
      setDeleteId(null)
    },
  })

  const systemTemplates = templates.filter(t => t.isSystem)
  const customTemplates = templates.filter(t => !t.isSystem)

  const cfg = (type: string) =>
    CONTRACT_TYPE_CONFIG[type as keyof typeof CONTRACT_TYPE_CONFIG]

  if (!isPro) {
    return (
      <div>
        <PageHeader
          title="📝 Shablonlar"
          description="Shartnoma shablonlarini boshqaring"
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Shablonlar' },
          ]}
        />
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center">
            <Lock size={28} className="text-[#D97706]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">Pro rejaga o'ting</h3>
          <p className="text-sm text-[#94A3B8] text-center max-w-xs">
            Shablonlar muharriri faqat Pro rejada mavjud. O'z shablonlaringizni yarating va saqlang.
          </p>
          <Link href="/dashboard/sozlamalar/obuna">
            <Button>Pro rejaga o'tish</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="📝 Shablonlar"
        description="Shartnoma shablonlarini boshqaring"
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Shablonlar' },
        ]}
        actions={
          <Link href="/dashboard/shablonlar/yangi">
            <Button leftIcon={<Plus size={15} />}>Yangi shablon</Button>
          </Link>
        }
      />

      {/* Soha bo'yicha shablonlar */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Soha bo'yicha shablonlar</h2>
          <Badge variant="success" size="sm">{INDUSTRY_TEMPLATES.length}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRY_TEMPLATES.map(t => {
            const ind = INDUSTRIES.find(i => i.key === t.industry)
            return (
              <Card key={t.id} className="group flex flex-col">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', ind?.color ?? 'bg-[#F1F5F9]')}>
                    {t.industryIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0F172A]">{t.name}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{t.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {t.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                  <Link
                    href={`/dashboard/shartnomalar/yangi?industryTpl=${t.id}`}
                    className="flex-1"
                  >
                    <Button variant="outline" size="sm" className="w-full" leftIcon={<Copy size={13} />}>
                      Foydalanish
                    </Button>
                  </Link>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      {/* Tizim shablonlari */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Tizim shablonlari</h2>
          <Badge variant="info" size="sm">{systemTemplates.length}</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : systemTemplates.length === 0 ? (
          <EmptyState icon={<FileText size={24} />} title="Tizim shablonlari yo'q" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTemplates.map(t => {
              const c = cfg(t.contractType)
              return (
                <Card key={t.id} className="relative group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', c?.bg ?? 'bg-[#F1F5F9]')}>
                      {c?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{t.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{c?.name ?? t.contractType}</p>
                    </div>
                    <Badge variant="default" size="sm" className="shrink-0">
                      <Lock size={10} className="mr-1" />Tizim
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/shablonlar/${t.id}/edit?view=true`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Eye size={13} />}>
                        Ko'rish
                      </Button>
                    </Link>
                    <Link href={`/dashboard/shablonlar/yangi?from=${t.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Copy size={13} />}>
                        Nusxa
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Mening shablonlarim */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">Mening shablonlarim</h2>
          <Badge variant="success" size="sm">{customTemplates.length}</Badge>
        </div>

        {customTemplates.length === 0 ? (
          <Card className="flex flex-col items-center py-12 gap-3">
            <FileText size={32} className="text-[#CBD5E1]" />
            <p className="text-sm text-[#94A3B8]">Hali shablon yaratilmagan</p>
            <Link href="/dashboard/shablonlar/yangi">
              <Button size="sm" leftIcon={<Plus size={13} />}>Shablon yaratish</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map(t => {
              const c = cfg(t.contractType)
              return (
                <Card key={t.id} className="group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', c?.bg ?? 'bg-[#F1F5F9]')}>
                      {c?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{t.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{c?.name ?? t.contractType}</p>
                    </div>
                    <Badge variant="success" size="sm">Mening</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/shablonlar/${t.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit2 size={13} />}>
                        Tahrirlash
                      </Button>
                    </Link>
                    <Button
                      variant="outline" size="sm"
                      className="text-red-500 hover:bg-red-50 hover:border-red-200"
                      onClick={() => setDeleteId(t.id)}
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMut.isPending}
      />
    </div>
  )
}
