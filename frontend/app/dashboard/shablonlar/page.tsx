'use client'

import { useState }                                        from 'react'
import { useTranslations }                                 from 'next-intl'
import Link                                                from 'next/link'
import { useRouter }                                       from 'next/navigation'
import { FileText, Lock, Plus, Edit2, Trash2, Copy, Eye, FileUp } from 'lucide-react'
import { useQuery, useMutation, useQueryClient }           from '@tanstack/react-query'
import { PageHeader }                                      from '@/components/layout/PageHeader'
import { Card }                                            from '@/components/ui/Card'
import { Button }                                          from '@/components/ui/Button'
import { Badge }                                           from '@/components/ui/Badge'
import { EmptyState }                                      from '@/components/ui/Skeleton'
import { DisclaimerModal }                                 from '@/components/DisclaimerModal/DisclaimerModal'
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
  const t = useTranslations('shablonlar')
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
        <h3 className="text-base font-semibold text-[#0F172A] mb-2">{t('deleteTitle')}</h3>
        <p className="text-sm text-[#475569] mb-5">
          {t('deleteConfirm')}
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" size="sm" onClick={onCancel}>{t('cancel')}</Button>
          <Button variant="danger" size="sm" loading={loading} onClick={onConfirm}>{t('deleteBtn')}</Button>
        </div>
      </div>
    </div>
  )
}

export default function ShablonlarPage() {
  const t = useTranslations('shablonlar')
  const tc = useTranslations('contracts')
  const { currentOrg, isPro } = useAuth()
  const router                = useRouter()
  const qc                    = useQueryClient()

  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Disclaimer (yuridik javobgarlik) — shablonni ishlatishdan oldin tasdiqlash kerak
  const [pendingAction, setPendingAction] = useState<{ templateRef: string; targetHref: string } | null>(null)

  async function startTemplateUse(templateRef: string, targetHref: string) {
    try {
      const res = await api.get('/acknowledgements/check', { params: { templateRef } })
      if (res.data?.accepted) {
        router.push(targetHref)
        return
      }
    } catch { /* check muvaffaqiyatsiz bo'lsa, xavfsiz tomondan modal ko'rsatamiz */ }
    setPendingAction({ templateRef, targetHref })
  }

  const { data: templatesData, isLoading } = useQuery<{ data: Template[]; meta: any }>({
    queryKey: ['templates', currentOrg?.id],
    queryFn:  () => api.get(`/templates?orgId=${currentOrg!.id}&limit=100`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })
  const templates = templatesData?.data || []

  // Foydalanuvchining shaxsiy shablonlari (Word import yoki paste'dan)
  const { data: userTplData } = useQuery<{ data: any[] }>({
    queryKey: ['user-templates', currentOrg?.id],
    queryFn:  () => api.get(`/user-templates?orgId=${currentOrg!.id}&limit=100`).then(r => r.data),
    enabled:  !!currentOrg?.id,
  })
  const userTemplates = userTplData?.data || []

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
          title={t('title')}
          description={t('description')}
          breadcrumbs={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: t('breadcrumb') },
          ]}
        />
        <Card className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center">
            <Lock size={28} className="text-[#D97706]" />
          </div>
          <h3 className="text-lg font-semibold text-[#0F172A]">{t('lockTitle')}</h3>
          <p className="text-sm text-[#94A3B8] text-center max-w-xs">
            {t('lockDesc')}
          </p>
          <Link href="/dashboard/sozlamalar/obuna">
            <Button>{t('goPro')}</Button>
          </Link>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={t('title')}
        description={t('description')}
        breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb') },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/shablonlar/import">
              <Button variant="outline" leftIcon={<FileUp size={15} />}>{t('importBtn')}</Button>
            </Link>
            <Link href="/dashboard/shablonlar/yangi">
              <Button leftIcon={<Plus size={15} />}>{t('newTpl')}</Button>
            </Link>
          </div>
        }
      />

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">{t('industryTpls')}</h2>
          <Badge variant="success" size="sm">{INDUSTRY_TEMPLATES.length}</Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INDUSTRY_TEMPLATES.map(tpl => {
            const ind = INDUSTRIES.find(i => i.key === tpl.industry)
            return (
              <Card key={tpl.id} className="group flex flex-col">
                <div className="flex items-start gap-3 flex-1">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', ind?.color ?? 'bg-[#F1F5F9]')}>
                    {tpl.industryIcon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0F172A]">{tpl.name}</p>
                    <p className="text-xs text-[#94A3B8] mt-0.5">{tpl.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {tpl.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#F1F5F9]">
                  <Button
                    variant="outline" size="sm" className="w-full flex-1"
                    leftIcon={<Copy size={13} />}
                    onClick={() => startTemplateUse(
                      `industry_${tpl.id}`,
                      `/dashboard/shartnomalar/yangi?industryTpl=${tpl.id}`,
                    )}
                  >
                    {t('use')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">{t('systemTpls')}</h2>
          <Badge variant="info" size="sm">{systemTemplates.length}</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-[#F1F5F9] animate-pulse" />
            ))}
          </div>
        ) : systemTemplates.length === 0 ? (
          <EmptyState icon={<FileText size={24} />} title={t('noSystemTpls')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {systemTemplates.map(tpl => {
              const c = cfg(tpl.contractType)
              const typeName = tc(`types.${tpl.contractType}` as any)
              return (
                <Card key={tpl.id} className="relative group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', c?.bg ?? 'bg-[#F1F5F9]')}>
                      {c?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{tpl.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{c ? typeName : tpl.contractType}</p>
                    </div>
                    <Badge variant="default" size="sm" className="shrink-0">
                      <Lock size={10} className="mr-1" />{t('system')}
                    </Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/shablonlar/${tpl.id}/edit?view=true`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Eye size={13} />}>
                        {t('view')}
                      </Button>
                    </Link>
                    <Button
                      variant="outline" size="sm" className="w-full flex-1"
                      leftIcon={<Copy size={13} />}
                      onClick={() => startTemplateUse(
                        `system_${tpl.contractType}`,
                        `/dashboard/shablonlar/yangi?from=${tpl.id}`,
                      )}
                    >
                      {t('copy')}
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-sm font-semibold text-[#0F172A]">{t('myTpls')}</h2>
          <Badge variant="success" size="sm">{customTemplates.length}</Badge>
        </div>

        {customTemplates.length === 0 ? (
          <Card className="flex flex-col items-center py-12 gap-3">
            <FileText size={32} className="text-[#CBD5E1]" />
            <p className="text-sm text-[#94A3B8]">{t('noTpls')}</p>
            <Link href="/dashboard/shablonlar/yangi">
              <Button size="sm" leftIcon={<Plus size={13} />}>{t('createTpl')}</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {customTemplates.map(tpl => {
              const c = cfg(tpl.contractType)
              const typeName = tc(`types.${tpl.contractType}` as any)
              return (
                <Card key={tpl.id} className="group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', c?.bg ?? 'bg-[#F1F5F9]')}>
                      {c?.icon ?? '📄'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{tpl.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{c ? typeName : tpl.contractType}</p>
                    </div>
                    <Badge variant="success" size="sm">{t('mine')}</Badge>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/shablonlar/${tpl.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit2 size={13} />}>
                        {t('edit')}
                      </Button>
                    </Link>
                    <Button
                      variant="outline" size="sm"
                      className="text-red-500 hover:bg-red-50 hover:border-red-200"
                      onClick={() => setDeleteId(tpl.id)}
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

      {userTemplates.length > 0 && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold text-[#0F172A]">{t('myImportedTpls')}</h2>
            <Badge variant="warning" size="sm">{userTemplates.length}</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {userTemplates.map((tpl: any) => {
              const c = cfg(tpl.contractType)
              return (
                <Card key={tpl.id} className="group">
                  <div className="flex items-start gap-3">
                    <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0', c?.bg ?? 'bg-[#FEF3C7]')}>
                      {c?.icon ?? '📥'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#0F172A] truncate">{tpl.name}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{tpl.source}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/dashboard/shablonlar/mine/${tpl.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full" leftIcon={<Edit2 size={13} />}>
                        {t('edit')}
                      </Button>
                    </Link>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        onConfirm={() => deleteId && deleteMut.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        loading={deleteMut.isPending}
      />

      <DisclaimerModal
        open={!!pendingAction}
        templateRef={pendingAction?.templateRef ?? ''}
        onClose={() => setPendingAction(null)}
        onAccepted={() => {
          if (pendingAction) {
            const href = pendingAction.targetHref
            setPendingAction(null)
            router.push(href)
          }
        }}
      />
    </div>
  )
}
