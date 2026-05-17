'use client'

import { useState }                                         from 'react'
import { useTranslations }                                   from 'next-intl'
import { useParams, useRouter }                              from 'next/navigation'
import {
  User, Phone, MapPin, Calendar, Briefcase, Building2,
  FileText, Umbrella, Zap, ArrowLeft, Plus, Trash2,
  UserCheck, UserX, Award, ChevronRight,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient }             from '@tanstack/react-query'
import { PageHeader }                                        from '@/components/layout/PageHeader'
import { Button }                                            from '@/components/ui/Button'
import { Card }                                              from '@/components/ui/Card'
import { Badge }                                             from '@/components/ui/Badge'
import { Modal, ConfirmDialog }                              from '@/components/ui/Modal'
import { TableRowSkeleton }                                  from '@/components/ui/Skeleton'
import { Input }                                             from '@/components/ui/Input'
import { useAuth }                                           from '@/hooks/useAuth'
import api                                                   from '@/lib/api'
import { formatDate, formatNumber }                          from '@/lib/formatters'
import toast                                                 from 'react-hot-toast'
import Link                                                  from 'next/link'
import { cn }                                                from '@/lib/cn'

// ─── Types ───────────────────────────────────────────────────────────────────

interface LeaveBalance {
  yearly:    number
  used:      number
  remaining: number
}

interface Employee {
  id:            string
  ism:           string
  jshshir?:      string
  passport?:     string
  lavozim?:      string
  bolim?:        string
  maosh?:        string
  ishBoshi?:     string
  tel?:          string
  tugilganSana?: string
  manzil?:       string
  isActive:      boolean
  docsCount:     number
  leaveBalance:  LeaveBalance
}

interface EmployeeDoc {
  id:        string
  type:      string
  title:     string
  number?:   string
  docDate?:  string
  status:    string
  createdAt: string
}

interface EmployeeLeave {
  id:        string
  type:      string
  startDate: string
  endDate:   string
  days:      number
  reason?:   string
  orderNum?: string
  status:    string
}

// ─── Leave type badge ────────────────────────────────────────────────────────

const LEAVE_COLORS: Record<string, string> = {
  YILLIK:    'bg-[#DBEAFE] text-[#1D4ED8]',
  KASAL:     'bg-[#FEE2E2] text-[#DC2626]',
  TUGILISH:  'bg-[#FCE7F3] text-[#BE185D]',
  BEPUL:     'bg-[#FEF3C7] text-[#D97706]',
  IJTIMOIY:  'bg-[#D1FAE5] text-[#059669]',
  HARBIY:    'bg-[#E0E7FF] text-[#4338CA]',
}

function LeaveTypeBadge({ type }: { type: string }) {
  const t = useTranslations('hr')
  const cls = LEAVE_COLORS[type] ?? 'bg-[#F1F5F9] text-gray-600'
  return (
    <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', cls)}>
      {(() => { try { return t(`leaveType_${type}` as any) } catch { return type } })()}
    </span>
  )
}

// ─── Add leave modal ─────────────────────────────────────────────────────────

function AddLeaveModal({
  open, onClose, employeeId, orgId,
}: {
  open: boolean; onClose: () => void; employeeId: string; orgId: string
}) {
  const t  = useTranslations('hr')
  const qc = useQueryClient()
  const [form, setForm] = useState({
    type:      'YILLIK',
    startDate: new Date().toISOString().split('T')[0],
    endDate:   new Date().toISOString().split('T')[0],
    reason:    '',
    orderNum:  '',
  })

  const mutation = useMutation({
    mutationFn: () =>
      api.post(`/employees/${employeeId}/leaves?orgId=${orgId}`, form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employeeId] })
      qc.invalidateQueries({ queryKey: ['employee-leaves', employeeId] })
      toast.success(t('leaveAdded'))
      onClose()
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  const LEAVE_TYPES = ['YILLIK', 'KASAL', 'TUGILISH', 'BEPUL', 'IJTIMOIY', 'HARBIY']

  return (
    <Modal open={open} onClose={onClose} title={t('addLeave')}>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('leaveTypeLabel')}</label>
          <select
            value={form.type}
            onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          >
            {LEAVE_TYPES.map(lt => (
              <option key={lt} value={lt}>{(() => { try { return t(`leaveType_${lt}` as any) } catch { return lt } })()}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">{t('leaveStart')}</label>
            <Input
              type="date"
              value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">{t('leaveEnd')}</label>
            <Input
              type="date"
              value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('leaveOrderNum')}</label>
          <Input
            placeholder="BUY-2026-001"
            value={form.orderNum}
            onChange={e => setForm(f => ({ ...f, orderNum: e.target.value }))}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('leaveReason')}</label>
          <textarea
            rows={2}
            value={form.reason}
            onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#2563EB]"
          />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>{t('cancel')}</Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending ? '...' : t('add')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab = 'docs' | 'leaves' | 'actions'

export default function EmployeeProfilePage() {
  const t             = useTranslations('hr')
  const { id }        = useParams<{ id: string }>()
  const router        = useRouter()
  const { currentOrg } = useAuth()
  const qc            = useQueryClient()
  const orgId         = currentOrg?.id ?? ''

  const [tab, setTab]             = useState<Tab>('docs')
  const [addLeaveOpen, setAddLeaveOpen] = useState(false)
  const [deleteLeaveId, setDeleteLeaveId] = useState<string | null>(null)

  // ── Employee data ──────────────────────────────────────────────────────────
  const { data: emp, isLoading } = useQuery<Employee>({
    queryKey: ['employee', id, orgId],
    queryFn:  () => api.get(`/employees/${id}?orgId=${orgId}`).then(r => r.data),
    enabled:  !!orgId && !!id,
  })

  // ── Documents ──────────────────────────────────────────────────────────────
  const { data: docsData, isLoading: docsLoading } = useQuery<{ data: EmployeeDoc[] }>({
    queryKey: ['employee-docs', id, orgId],
    queryFn:  () => api.get(`/documents?orgId=${orgId}&employeeId=${id}&limit=50`).then(r => r.data),
    enabled:  !!orgId && !!id && tab === 'docs',
  })

  // ── Leaves ─────────────────────────────────────────────────────────────────
  const { data: leavesData, isLoading: leavesLoading } = useQuery<{
    leaves: EmployeeLeave[]
    balance: { yearly: number; used: number; remaining: number; year: number }
  }>({
    queryKey: ['employee-leaves', id, orgId],
    queryFn:  () => api.get(`/employees/${id}/leaves?orgId=${orgId}`).then(r => r.data),
    enabled:  !!orgId && !!id && tab === 'leaves',
  })

  // ── Delete leave ───────────────────────────────────────────────────────────
  const deleteLeaveMutation = useMutation({
    mutationFn: (leaveId: string) =>
      api.delete(`/employees/${id}/leaves/${leaveId}?orgId=${orgId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', id] })
      qc.invalidateQueries({ queryKey: ['employee-leaves', id] })
      toast.success(t('leaveDeleted'))
      setDeleteLeaveId(null)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('error')),
  })

  // ── Avatar initials ────────────────────────────────────────────────────────
  function initials(name: string) {
    return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-[#E2E8F0] rounded w-48" />
          <div className="h-32 bg-[#E2E8F0] rounded" />
        </div>
      </div>
    )
  }

  if (!emp) return null

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'docs',    label: t('docsTab'),    icon: <FileText className="w-4 h-4" /> },
    { key: 'leaves',  label: t('leavesTab'),  icon: <Umbrella className="w-4 h-4" /> },
    { key: 'actions', label: t('actionsTab'), icon: <Zap className="w-4 h-4" /> },
  ]

  const usedPct = Math.min(100, Math.round((emp.leaveBalance.used / emp.leaveBalance.yearly) * 100))

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl mx-auto">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[#0F172A]">{emp.ism}</h1>
          <p className="text-sm text-[#64748B]">{emp.lavozim || t('noLavozim')}</p>
        </div>
        <div className="ml-auto">
          <Badge variant={emp.isActive ? 'success' : 'danger'}>
            {emp.isActive ? t('filterActive') : t('filterInactive')}
          </Badge>
        </div>
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────── */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 flex items-start justify-center sm:justify-start">
            <div className="w-20 h-20 rounded-full bg-[#2563EB] flex items-center justify-center text-white text-2xl font-bold">
              {initials(emp.ism)}
            </div>
          </div>

          {/* Info grid */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {emp.bolim && (
              <InfoRow icon={<Building2 className="w-4 h-4" />} label={t('bolim')} value={emp.bolim} />
            )}
            {emp.tel && (
              <InfoRow icon={<Phone className="w-4 h-4" />} label={t('phone')} value={emp.tel} />
            )}
            {emp.ishBoshi && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label={t('ishBoshi')} value={formatDate(emp.ishBoshi)} />
            )}
            {emp.tugilganSana && (
              <InfoRow icon={<Calendar className="w-4 h-4" />} label={t('birthDate')} value={formatDate(emp.tugilganSana)} />
            )}
            {emp.maosh && (
              <InfoRow icon={<Briefcase className="w-4 h-4" />} label={t('monthlySalary')} value={`${formatNumber(Number(emp.maosh))} ${t('som')}`} />
            )}
            {emp.jshshir && (
              <InfoRow icon={<User className="w-4 h-4" />} label={t('jshshir')} value={emp.jshshir} />
            )}
            {emp.manzil && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label={t('address')} value={emp.manzil} />
            )}
          </div>
        </div>

        {/* Leave balance bar */}
        <div className="mt-4 pt-4 border-t border-[#F1F5F9]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-[#374151]">{t('leaveBalance')}</span>
            <span className="text-sm text-[#64748B]">
              {emp.leaveBalance.used}/{emp.leaveBalance.yearly} {t('leaveDays')}
            </span>
          </div>
          <div className="w-full bg-[#F1F5F9] rounded-full h-2">
            <div
              className={cn('h-2 rounded-full transition-all', usedPct >= 100 ? 'bg-[#EF4444]' : usedPct >= 75 ? 'bg-[#FBBF24]' : 'bg-[#2563EB]')}
              style={{ width: `${usedPct}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[#64748B]">
            <span>{t('leaveUsed')}: {emp.leaveBalance.used}</span>
            <span>{t('leaveRemaining')}: {emp.leaveBalance.remaining}</span>
          </div>
        </div>
      </Card>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key
                ? 'bg-white text-[#2563EB] shadow-sm'
                : 'text-[#64748B] hover:text-[#374151]',
            )}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* ── Hujjatlar tab ──────────────────────────────────────────────────── */}
      {tab === 'docs' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <span className="text-sm font-medium text-[#374151]">
              {t('docsTab')} ({emp.docsCount})
            </span>
            <Link href={`/dashboard/kadrlar/hujjat`}>
              <Button size="sm" variant="outline">
                <Plus className="w-3.5 h-3.5 mr-1" />{t('createOrder')}
              </Button>
            </Link>
          </div>

          {docsLoading ? (
            <div className="p-4"><TableRowSkeleton rows={3} /></div>
          ) : !docsData?.data?.length ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">{t('noDocs')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B] border-b border-[#F1F5F9] bg-gray-50">
                  <th className="px-4 py-2 font-medium">{t('tableEmployee')}</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">{t('sana')}</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">{t('buyruqRaqam')}</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {docsData.data.map(doc => (
                  <tr key={doc.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F172A]">{doc.title}</div>
                      <div className="text-xs text-[#94A3B8]">{doc.type}</div>
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">
                      {doc.docDate ? formatDate(doc.docDate) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden md:table-cell">
                      {doc.number || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={doc.status === 'ACTIVE' ? 'success' : 'default'}>
                        {doc.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Ta'tillar tab ──────────────────────────────────────────────────── */}
      {tab === 'leaves' && (
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
            <span className="text-sm font-medium text-[#374151]">{t('leavesTab')}</span>
            <Button size="sm" onClick={() => setAddLeaveOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />{t('addLeave')}
            </Button>
          </div>

          {leavesLoading ? (
            <div className="p-4"><TableRowSkeleton rows={3} /></div>
          ) : !leavesData?.leaves?.length ? (
            <div className="py-12 text-center text-[#94A3B8] text-sm">{t('noLeaves')}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-[#64748B] border-b border-[#F1F5F9] bg-gray-50">
                  <th className="px-4 py-2 font-medium">{t('leaveTypeLabel')}</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">{t('leaveStart')}</th>
                  <th className="px-4 py-2 font-medium hidden sm:table-cell">{t('leaveEnd')}</th>
                  <th className="px-4 py-2 font-medium">{t('leaveDays')}</th>
                  <th className="px-4 py-2 font-medium hidden md:table-cell">{t('leaveOrderNum')}</th>
                  <th className="px-4 py-2 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {leavesData.leaves.map(leave => (
                  <tr key={leave.id} className="hover:bg-[#F8FAFC]">
                    <td className="px-4 py-3">
                      <LeaveTypeBadge type={leave.type} />
                      {leave.reason && (
                        <div className="text-xs text-[#94A3B8] mt-0.5 truncate max-w-[140px]" title={leave.reason}>{leave.reason}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{formatDate(leave.startDate)}</td>
                    <td className="px-4 py-3 text-[#64748B] hidden sm:table-cell">{formatDate(leave.endDate)}</td>
                    <td className="px-4 py-3 font-medium text-[#0F172A]">{leave.days}</td>
                    <td className="px-4 py-3 text-[#94A3B8] text-xs hidden md:table-cell">{leave.orderNum || '—'}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteLeaveId(leave.id)}
                        className="p-1 rounded hover:bg-[#FEF2F2] text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}

      {/* ── Tez harakatlar tab ─────────────────────────────────────────────── */}
      {tab === 'actions' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ActionCard
            icon={<UserCheck className="w-5 h-5 text-[#16A34A]" />}
            bg="bg-[#DCFCE7]"
            title={t('ishgaQabulName')}
            desc={t('ishgaQabulDesc')}
            href={`/dashboard/kadrlar/hujjat?doc=ishga_qabul&employeeId=${id}`}
          />
          <ActionCard
            icon={<FileText className="w-5 h-5 text-[#2563EB]" />}
            bg="bg-[#DBEAFE]"
            title={t('mehnatShartnomaName')}
            desc={t('mehnatShartnomaDesc')}
            href={`/dashboard/kadrlar/hujjat?doc=mehnat_shartnoma&employeeId=${id}`}
          />
          <ActionCard
            icon={<Umbrella className="w-5 h-5 text-[#7C3AED]" />}
            bg="bg-[#EDE9FE]"
            title={t('tatilName')}
            desc={t('tatilDesc')}
            href={`/dashboard/kadrlar/hujjat?doc=tatil&employeeId=${id}`}
            onClick={() => setTab('leaves')}
            extra={<Button size="sm" onClick={() => setAddLeaveOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" />{t('addLeave')}</Button>}
          />
          <ActionCard
            icon={<UserX className="w-5 h-5 text-[#DC2626]" />}
            bg="bg-[#FEE2E2]"
            title={t('boshatishName')}
            desc={t('boshatishDesc')}
            href={`/dashboard/kadrlar/hujjat?doc=boshatish&employeeId=${id}`}
          />
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <AddLeaveModal
        open={addLeaveOpen}
        onClose={() => setAddLeaveOpen(false)}
        employeeId={id}
        orgId={orgId}
      />

      <ConfirmDialog
        open={!!deleteLeaveId}
        title={t('leaveDeleteTitle')}
        message={t('leaveDeleteConfirm')}
        confirmLabel={t('delete')}
        onConfirm={() => deleteLeaveId && deleteLeaveMutation.mutate(deleteLeaveId)}
        onCancel={() => setDeleteLeaveId(null)}
      />
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-[#94A3B8]">{icon}</span>
      <div>
        <div className="text-xs text-[#94A3B8]">{label}</div>
        <div className="text-sm font-medium text-[#0F172A]">{value}</div>
      </div>
    </div>
  )
}

function ActionCard({
  icon, bg, title, desc, href, extra, onClick,
}: {
  icon:     React.ReactNode
  bg:       string
  title:    string
  desc:     string
  href:     string
  extra?:   React.ReactNode
  onClick?: () => void
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-xl', bg)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#0F172A] text-sm">{title}</div>
          <div className="text-xs text-[#64748B] mt-0.5 line-clamp-2">{desc}</div>
          <div className="mt-3 flex gap-2 flex-wrap">
            <Link href={href} onClick={onClick}>
              <Button size="sm" variant="outline">
                <FileText className="w-3.5 h-3.5 mr-1" />Yaratish
                <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
              </Button>
            </Link>
            {extra}
          </div>
        </div>
      </div>
    </Card>
  )
}
