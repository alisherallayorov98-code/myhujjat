'use client'

import { useState }                                        from 'react'
import Link                                                 from 'next/link'
import { useTranslations }                                  from 'next-intl'
import {
  Lock, Zap, Plus, Briefcase, Clock, CheckCircle, XCircle,
  AlertTriangle, Trash2, FileText, MessageSquare, GitCommit,
  ArrowRight, Bell, FolderOpen,
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient }            from '@tanstack/react-query'
import { PageHeader }                                       from '@/components/layout/PageHeader'
import { Card }                                             from '@/components/ui/Card'
import { Button }                                           from '@/components/ui/Button'
import { Input }                                            from '@/components/ui/Input'
import { Modal, ConfirmDialog }                             from '@/components/ui/Modal'
import { TableRowSkeleton }                                 from '@/components/ui/Skeleton'
import { useAuth }                                          from '@/hooks/useAuth'
import api                                                  from '@/lib/api'
import { formatNumber, formatDate }                         from '@/lib/formatters'
import { exportContractPdf }                                from '@/lib/export/contractPdf'
import { exportContractDocx }                               from '@/lib/export/contractDocx'
import {
  generatePretenziya, generateDavoAriza, generateIshonchQogoz,
  generateKelishuvBitimi, generateOgohlantiruv,
  generateDalolatnoma, generateBekorQilishXati,
  type YuristData,
} from '@/lib/yuristTemplates'
import toast                                                from 'react-hot-toast'
import { cn }                                               from '@/lib/cn'

import { DocCardGrid, useYuristDocs }                       from './_components/DocCardGrid'
import { YuristFormFields, type FormState }                 from './_components/YuristForm'
import { PreviewPanel }                                     from './_components/PreviewPanel'

// ─── Constants ────────────────────────────────────────────────────────────────

const today = () => new Date().toLocaleDateString('uz-UZ')

const INITIAL_FORM: FormState = {
  raqam:            `YUR-${new Date().getFullYear()}-001`,
  sana:             today(),
  cpNomi: '', cpInn: '', cpRahbar: '', cpManzil: '',
  shartnomaRaqam: '', shartnomaSana: '',
  majburiyat: '', qarzSumma: '', penyaFoiz: '0,1', penyaSumma: '',
  jamiTalab: '', javobMuddat: "10 (o'n)",
  sudNomi: 'TOSHKENT SHAHAR IQTISODIY SUDI',
  davoPredmeti: "Pul mablag'larini undirib berish to'g'risida",
  davlatBoji: '', vakilIsm: '', vakilPassport: '', vakilManzil: '',
  vakolatDoirasi: '', amalMuddat: '1 (bir) yil',
  kelishuvPredmeti: '', tomon1Majburiyat: '', tomon2Majburiyat: '',
  tolovSumma: '', tolovMuddat: '',
  ogohSabab: '', bajarishMuddat: "5 (besh) ish kuni", oqibat: '',
  dalolatnomaJoyi: 'Toshkent', komissiya: '', holatTavsifi: '', qiymat: '',
  bekorSabab: '', kuchKirishSana: "30 (o'ttiz) kun", hisobTartib: '',
}

const DOC_GENERATOR_MAP: Record<string, (d: YuristData) => string> = {
  pretenziya:    generatePretenziya,
  davo_ariza:    generateDavoAriza,
  ishonch_qogoz: generateIshonchQogoz,
  kelishuv:      generateKelishuvBitimi,
  ogohlantiruv:  generateOgohlantiruv,
  dalolatnoma:   generateDalolatnoma,
  bekor_qilish:  generateBekorQilishXati,
}

const CASE_TYPE_FROM_DOC: Record<string, string> = {
  pretenziya:    'PRETENZIYA',
  davo_ariza:    'DAVO',
  ishonch_qogoz: 'BOSHQA',
  kelishuv:      'KELISHUV',
  ogohlantiruv:  'OGOHLANTIRUV',
  dalolatnoma:   'DALOLATNOMA',
  bekor_qilish:  'BEKOR_QILISH',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  const map: Record<string, { cls: string; label: string }> = {
    OPEN:        { cls: 'bg-blue-100 text-blue-700',   label: 'Ochiq' },
    IN_PROGRESS: { cls: 'bg-amber-100 text-amber-700', label: 'Jarayonda' },
    RESOLVED:    { cls: 'bg-green-100 text-green-700', label: "Hal bo'ldi" },
    CLOSED:      { cls: 'bg-gray-100 text-gray-600',   label: 'Yopildi' },
  }
  const s = map[status] ?? map.OPEN
  return <span className={cn('inline-flex px-2 py-0.5 rounded text-xs font-medium', s.cls)}>{s.label}</span>
}

function deadlineLabel(deadline: string): { text: string; cls: string } {
  const now   = new Date()
  const d     = new Date(deadline)
  const diff  = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diff < 0)  return { text: `${Math.abs(diff)} kun o'tdi`, cls: 'text-red-600 font-semibold' }
  if (diff === 0) return { text: 'Bugun',                      cls: 'text-red-500 font-semibold' }
  if (diff === 1) return { text: 'Ertaga',                     cls: 'text-amber-600 font-semibold' }
  return              { text: `${diff} kun qoldi`,             cls: 'text-amber-500' }
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color, danger }: {
  label: string; value: number; icon: React.ReactNode; color: string; danger?: boolean
}) {
  return (
    <div className={cn(
      'flex items-center gap-3 bg-white rounded-xl border p-4',
      danger && value > 0 ? 'border-red-200 bg-red-50' : 'border-[#E2E8F0]',
    )}>
      <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center shrink-0', color)}>
        {icon}
      </div>
      <div>
        <div className={cn('text-2xl font-bold', danger && value > 0 ? 'text-red-600' : 'text-[#0F172A]')}>{value}</div>
        <div className="text-xs text-[#94A3B8]">{label}</div>
      </div>
    </div>
  )
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

function ActivityIcon({ action }: { action: string }) {
  const map: Record<string, { icon: React.ReactNode; cls: string }> = {
    CREATED:        { icon: <GitCommit    size={14} />, cls: 'bg-blue-100 text-blue-600' },
    STATUS_CHANGED: { icon: <ArrowRight   size={14} />, cls: 'bg-amber-100 text-amber-600' },
    DOCUMENT_ADDED: { icon: <FileText     size={14} />, cls: 'bg-purple-100 text-purple-600' },
    NOTE_ADDED:     { icon: <MessageSquare size={14} />, cls: 'bg-green-100 text-green-600' },
  }
  const cfg = map[action] ?? map.CREATED
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center shrink-0', cfg.cls)}>
      {cfg.icon}
    </div>
  )
}

function activityText(a: any, t: any): string {
  switch (a.action) {
    case 'CREATED':        return t('activityCreated')
    case 'STATUS_CHANGED': return `${t('activityStatusChanged')}: ${a.oldValue} → ${a.newValue}`
    case 'DOCUMENT_ADDED': return `${t('activityDocAdded')}: "${a.newValue}"`
    case 'NOTE_ADDED':     return a.note || t('activityNoteAdded')
    default:               return a.action
  }
}

// ─── Case Detail Modal ────────────────────────────────────────────────────────

function CaseDetailModal({ open, onClose, caseId, orgId }: {
  open: boolean; onClose: () => void; caseId: string; orgId: string
}) {
  const t  = useTranslations('lawyer')
  const qc = useQueryClient()
  const [innerTab, setInnerTab] = useState<'info' | 'activity'>('info')
  const [noteText, setNoteText] = useState('')

  const { data: lc, isLoading } = useQuery<any>({
    queryKey: ['legal-case', caseId],
    queryFn:  () => api.get(`/legal/${caseId}?orgId=${orgId}`).then(r => r.data),
    enabled:  open && !!caseId,
  })

  const { data: actData, isLoading: actLoading } = useQuery<{ activities: any[] }>({
    queryKey: ['legal-activity', caseId],
    queryFn:  () => api.get(`/legal/${caseId}/activity?orgId=${orgId}`).then(r => r.data),
    enabled:  open && !!caseId && innerTab === 'activity',
  })

  const updateMutation = useMutation({
    mutationFn: (status: string) => api.put(`/legal/${caseId}?orgId=${orgId}`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-case', caseId] })
      qc.invalidateQueries({ queryKey: ['legal-cases', orgId] })
      qc.invalidateQueries({ queryKey: ['legal-stats', orgId] })
      qc.invalidateQueries({ queryKey: ['legal-activity', caseId] })
      toast.success(t('caseUpdated'))
    },
  })

  const noteMutation = useMutation({
    mutationFn: () => api.post(`/legal/${caseId}/notes?orgId=${orgId}`, { note: noteText }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-activity', caseId] })
      toast.success(t('noteAdded'))
      setNoteText('')
      setInnerTab('activity')
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('exportError')),
  })

  const STATUS_FLOW = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

  return (
    <Modal open={open} onClose={onClose} title={lc?.title || '...'}>
      {isLoading ? (
        <TableRowSkeleton rows={4} />
      ) : lc ? (
        <div className="space-y-4">
          {/* Header info */}
          <div className="flex items-center gap-2 flex-wrap">
            {statusBadge(lc.status)}
            {lc.counterparty && (
              <span className="text-sm text-[#475569]">{lc.counterparty.name}</span>
            )}
            {lc.amount && (
              <span className="text-sm font-medium text-[#0F172A]">{formatNumber(lc.amount)} so'm</span>
            )}
            {lc.deadline && (() => {
              const dl = deadlineLabel(lc.deadline)
              return <span className={cn('text-xs', dl.cls)}>{formatDate(lc.deadline)} ({dl.text})</span>
            })()}
          </div>

          {/* Inner tabs */}
          <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl">
            {(['info', 'activity'] as const).map(k => (
              <button
                key={k}
                onClick={() => setInnerTab(k)}
                className={cn(
                  'flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                  innerTab === k ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B]',
                )}
              >
                {k === 'info' ? t('infoTab') : t('activityTab')}
              </button>
            ))}
          </div>

          {/* Info tab */}
          {innerTab === 'info' && (
            <div className="space-y-4">
              {lc.notes && (
                <p className="text-sm text-[#475569] bg-[#F8FAFC] rounded-lg p-3">{lc.notes}</p>
              )}

              {/* Status change */}
              <div>
                <p className="text-xs font-medium text-[#94A3B8] mb-2">{t('caseStatus')}:</p>
                <div className="flex gap-2 flex-wrap">
                  {STATUS_FLOW.map(s => (
                    <button
                      key={s}
                      onClick={() => updateMutation.mutate(s)}
                      disabled={lc.status === s || updateMutation.isPending}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
                        lc.status === s
                          ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB] cursor-default'
                          : 'border-[#E2E8F0] text-[#475569] hover:border-[#2563EB]/40',
                      )}
                    >
                      {statusBadge(s)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documents */}
              {lc.documents?.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-[#94A3B8] mb-2">
                    Hujjatlar ({lc.documents.length})
                  </p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {lc.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center gap-2 text-sm py-1.5 px-3 rounded-lg bg-[#F8FAFC]">
                        <FileText className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                        <span className="flex-1 truncate text-xs">{doc.title}</span>
                        <span className="text-xs text-[#CBD5E1]">{formatDate(doc.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add note */}
              <div className="pt-1 border-t border-[#F1F5F9]">
                <p className="text-xs font-medium text-[#94A3B8] mb-2">{t('noteAdd')}:</p>
                <div className="flex gap-2">
                  <textarea
                    rows={2}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder={t('notePlaceholder')}
                    className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#2563EB]"
                  />
                  <Button
                    size="sm"
                    onClick={() => noteMutation.mutate()}
                    disabled={!noteText.trim() || noteMutation.isPending}
                  >
                    {noteMutation.isPending ? '...' : t('add')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Activity tab */}
          {innerTab === 'activity' && (
            <div className="space-y-1 max-h-72 overflow-y-auto">
              {actLoading ? (
                <TableRowSkeleton rows={3} />
              ) : !actData?.activities?.length ? (
                <div className="py-8 text-center text-[#94A3B8] text-sm">{t('noActivity')}</div>
              ) : (
                actData.activities.map((a: any) => (
                  <div key={a.id} className="flex gap-3 py-2.5 px-1">
                    <ActivityIcon action={a.action} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#0F172A] leading-snug">{activityText(a, t)}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">
                        {new Date(a.createdAt).toLocaleString('uz-UZ', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          <div className="flex justify-end pt-1">
            <Button variant="outline" size="sm" onClick={onClose}>Yopish</Button>
          </div>
        </div>
      ) : null}
    </Modal>
  )
}

// ─── Create Case Modal ────────────────────────────────────────────────────────

interface LegalCaseForm {
  title: string; type: string; counterpartyId: string
  amount: string; deadline: string; notes: string
}

function CreateCaseModal({ open, onClose, orgId, initialType, initialTitle, initialCpId }: {
  open: boolean; onClose: (saved?: any) => void
  orgId: string; initialType?: string; initialTitle?: string; initialCpId?: string
}) {
  const t  = useTranslations('lawyer')
  const qc = useQueryClient()
  const [form, setForm] = useState<LegalCaseForm>({
    title: initialTitle || '', type: initialType || 'PRETENZIYA',
    counterpartyId: initialCpId || '', amount: '', deadline: '', notes: '',
  })

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', orgId],
    queryFn:  () => api.get(`/counterparties?orgId=${orgId}&limit=100`).then(r => r.data.data || []),
    enabled:  !!orgId,
  })

  const mutation = useMutation({
    mutationFn: () => api.post('/legal', {
      organizationId: orgId, title: form.title, type: form.type,
      counterpartyId: form.counterpartyId || undefined,
      amount:   form.amount   ? Number(form.amount) : undefined,
      deadline: form.deadline || undefined,
      notes:    form.notes    || undefined,
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['legal-cases',    orgId] })
      qc.invalidateQueries({ queryKey: ['legal-stats',    orgId] })
      qc.invalidateQueries({ queryKey: ['legal-deadlines', orgId] })
      toast.success(t('caseAdded'))
      onClose(res.data)
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || t('exportError')),
  })

  const CASE_TYPES = ['PRETENZIYA', 'DAVO', 'KELISHUV', 'OGOHLANTIRUV', 'DALOLATNOMA', 'BEKOR_QILISH', 'BOSHQA']

  return (
    <Modal open={open} onClose={() => onClose()} title={t('newCase')}>
      <div className="space-y-4">
        <Input label={t('caseTitle')} value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          placeholder="OOO Romashka — Pretenziya" />

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('caseType')}</label>
          <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
            {CASE_TYPES.map(ct => (
              <option key={ct} value={ct}>{t(`caseType_${ct}` as any, { fallback: ct })}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('ikkinchiTomon')}</label>
          <select value={form.counterpartyId} onChange={e => setForm(f => ({ ...f, counterpartyId: e.target.value }))}
            className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
            <option value="">{t('selectCp')}</option>
            {cps.map((cp: any) => <option key={cp.id} value={cp.id}>{cp.name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input label={t('caseAmount')} type="number" value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">{t('caseDeadline')}</label>
            <Input type="date" value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-1">{t('caseNotes')}</label>
          <textarea rows={2} value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#2563EB]" />
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => onClose()}>Bekor</Button>
          <Button onClick={() => mutation.mutate()} disabled={!form.title || mutation.isPending}>
            {mutation.isPending ? '...' : t('add')}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Save to Case Modal ───────────────────────────────────────────────────────

function SaveToCaseModal({ open, onClose, orgId, docType, docTitle, docContent, preselectedCaseId }: {
  open: boolean; onClose: () => void; orgId: string
  docType: string; docTitle: string; docContent: string
  preselectedCaseId?: string
}) {
  const t  = useTranslations('lawyer')
  const qc = useQueryClient()
  const [mode,     setMode]     = useState<'existing' | 'new' | null>(preselectedCaseId ? 'existing' : null)
  const [caseId,   setCaseId]   = useState(preselectedCaseId || '')
  const [newTitle, setNewTitle] = useState(docTitle)
  const [saving,   setSaving]   = useState(false)

  const { data: cases } = useQuery<{ data: any[] }>({
    queryKey: ['legal-cases', orgId],
    queryFn:  () => api.get(`/legal?orgId=${orgId}&limit=50`).then(r => r.data),
    enabled:  open,
  })

  async function handleSave() {
    setSaving(true)
    try {
      let targetId = caseId
      if (mode === 'new') {
        const res = await api.post('/legal', {
          organizationId: orgId, title: newTitle,
          type: CASE_TYPE_FROM_DOC[docType] || 'BOSHQA',
        })
        targetId = res.data.id
        qc.invalidateQueries({ queryKey: ['legal-cases', orgId] })
        qc.invalidateQueries({ queryKey: ['legal-stats', orgId] })
      }
      await api.post(`/legal/${targetId}/documents?orgId=${orgId}`, {
        type: docType, title: docTitle, content: docContent,
      })
      toast.success(t('docSaved'))
      onClose()
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('exportError'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={t('saveToCaseTitle')}>
      <div className="space-y-4">
        <p className="text-sm text-[#475569]">
          <strong>{docTitle}</strong> hujjatini qanday saqlash?
        </p>

        <div className="grid grid-cols-1 gap-2">
          {([
            { key: 'existing', label: t('saveToExistingCase') },
            { key: 'new',      label: t('saveToNewCase') },
          ] as const).map(opt => (
            <button key={opt.key} onClick={() => setMode(opt.key)}
              className={cn(
                'p-3 rounded-xl border-2 text-left text-sm font-medium transition-all',
                mode === opt.key
                  ? 'border-[#2563EB] bg-[#EFF6FF] text-[#2563EB]'
                  : 'border-[#E2E8F0] text-[#475569] hover:border-[#2563EB]/30',
              )}>
              {opt.label}
            </button>
          ))}
        </div>

        {mode === 'existing' && (
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-1">Ish tanlang</label>
            <select value={caseId} onChange={e => setCaseId(e.target.value)}
              className="w-full h-10 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]">
              <option value="">— Ish tanlang —</option>
              {cases?.data?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        {mode === 'new' && (
          <Input label="Yangi ish sarlavhasi" value={newTitle}
            onChange={e => setNewTitle(e.target.value)} />
        )}

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={onClose}>{t('saveDownloadOnly')}</Button>
          <Button
            onClick={handleSave}
            disabled={saving || !mode || (mode === 'existing' && !caseId) || (mode === 'new' && !newTitle)}
          >
            {saving ? '...' : 'Saqlash'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// ─── Deadline Banner ──────────────────────────────────────────────────────────

function DeadlineBanner({ orgId, onShowCases }: { orgId: string; onShowCases: () => void }) {
  const t = useTranslations('lawyer')
  const { data } = useQuery<{ overdue: any[]; urgent: any[]; approaching: any[] }>({
    queryKey: ['legal-deadlines', orgId],
    queryFn:  () => api.get(`/legal/deadlines?orgId=${orgId}`).then(r => r.data),
    enabled:  !!orgId,
  })

  const overdueCount = data?.overdue?.length  || 0
  const urgentCount  = data?.urgent?.length   || 0
  const total        = overdueCount + urgentCount

  if (!total) return null

  return (
    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
        <Bell size={18} className="text-red-600" />
      </div>
      <div className="flex-1 text-sm">
        <span className="font-semibold text-red-700">
          {overdueCount > 0 && `${overdueCount} ta ish muddati o'tgan`}
          {overdueCount > 0 && urgentCount > 0 && ', '}
          {urgentCount  > 0 && `${urgentCount} ta ish 2 kun ichida tugaydi`}
        </span>
      </div>
      <button
        onClick={onShowCases}
        className="text-xs font-medium text-red-600 hover:text-red-700 underline underline-offset-2 shrink-0"
      >
        Ko'rish →
      </button>
    </div>
  )
}

// ─── Deadline Panel ───────────────────────────────────────────────────────────

function DeadlinePanel({ orgId, onCaseClick }: {
  orgId: string; onCaseClick: (id: string) => void
}) {
  const t = useTranslations('lawyer')
  const { data } = useQuery<{ overdue: any[]; urgent: any[]; approaching: any[] }>({
    queryKey: ['legal-deadlines', orgId],
    queryFn:  () => api.get(`/legal/deadlines?orgId=${orgId}`).then(r => r.data),
    enabled:  !!orgId,
  })

  const urgent = [...(data?.overdue || []), ...(data?.urgent || [])]
  if (!urgent.length) return null

  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-amber-200">
        <AlertTriangle size={14} className="text-amber-600" />
        <span className="text-xs font-semibold text-amber-700">{t('deadlinePanel')}</span>
      </div>
      <div className="divide-y divide-amber-100">
        {urgent.map((c: any) => {
          const dl = deadlineLabel(c.deadline)
          return (
            <button
              key={c.id}
              onClick={() => onCaseClick(c.id)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-amber-100/50 text-left transition-colors"
            >
              <div className={cn('w-2 h-2 rounded-full shrink-0', dl.cls.includes('red') ? 'bg-red-500' : 'bg-amber-500')} />
              <span className="flex-1 text-sm font-medium text-[#0F172A] truncate">{c.title}</span>
              <span className={cn('text-xs shrink-0', dl.cls)}>{dl.text}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Cases Tab ────────────────────────────────────────────────────────────────

function CasesTab({ orgId }: { orgId: string }) {
  const t  = useTranslations('lawyer')
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen,   setCreateOpen]   = useState(false)
  const [detailId,     setDetailId]     = useState('')
  const [deleteId,     setDeleteId]     = useState('')

  const { data, isLoading } = useQuery<{ data: any[] }>({
    queryKey: ['legal-cases', orgId, statusFilter],
    queryFn:  () => api.get(`/legal?orgId=${orgId}&limit=30${statusFilter ? '&status=' + statusFilter : ''}`).then(r => r.data),
    enabled:  !!orgId,
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/legal/${id}?orgId=${orgId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['legal-cases',    orgId] })
      qc.invalidateQueries({ queryKey: ['legal-stats',    orgId] })
      qc.invalidateQueries({ queryKey: ['legal-deadlines', orgId] })
      toast.success(t('caseDeleted'))
      setDeleteId('')
    },
  })

  const STATUSES = [
    { val: '',            label: t('filterAll') },
    { val: 'OPEN',        label: t('statusOpen') },
    { val: 'IN_PROGRESS', label: t('statusInProgress') },
    { val: 'RESOLVED',    label: t('statusResolved') },
    { val: 'CLOSED',      label: t('statusClosed') },
  ]

  return (
    <div className="space-y-4">
      <DeadlinePanel orgId={orgId} onCaseClick={id => setDetailId(id)} />

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl overflow-x-auto">
          {STATUSES.map(s => (
            <button key={s.val} onClick={() => setStatusFilter(s.val)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                statusFilter === s.val ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]',
              )}>
              {s.label}
            </button>
          ))}
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus size={14} className="mr-1" />{t('newCase')}
        </Button>
      </div>

      <Card padding="none">
        {isLoading ? (
          <div className="p-4"><TableRowSkeleton rows={4} /></div>
        ) : !data?.data?.length ? (
          <div className="py-16 text-center text-[#94A3B8] text-sm">{t('noCases')}</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#94A3B8] border-b border-[#F1F5F9] bg-[#F8FAFC]">
                <th className="px-4 py-2.5 font-medium">{t('caseTitle')}</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">{t('ikkinchiTomon')}</th>
                <th className="px-4 py-2.5 font-medium hidden md:table-cell">{t('caseAmount')}</th>
                <th className="px-4 py-2.5 font-medium hidden sm:table-cell">{t('caseDeadline')}</th>
                <th className="px-4 py-2.5 font-medium">{t('caseStatus')}</th>
                <th className="px-4 py-2.5 w-10" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {data.data.map((c: any) => {
                const isOverdue = c.deadline && new Date(c.deadline) < new Date() &&
                  ['OPEN', 'IN_PROGRESS'].includes(c.status)
                return (
                  <tr key={c.id} onClick={() => setDetailId(c.id)}
                    className="hover:bg-[#F8FAFC] cursor-pointer">
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#0F172A]">{c.title}</div>
                      <div className="text-xs text-[#94A3B8]">
                        {c.type}
                        {c._count?.documents > 0 && (
                          <span className="ml-2 text-[#CBD5E1]">
                            <FileText size={10} className="inline mr-0.5" />{c._count.documents}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#475569] hidden sm:table-cell">
                      {c.counterparty?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#475569] hidden md:table-cell">
                      {c.amount ? formatNumber(c.amount) + " so'm" : '—'}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {c.deadline ? (() => {
                        const dl = deadlineLabel(c.deadline)
                        return (
                          <div>
                            <div className="text-xs text-[#94A3B8]">{formatDate(c.deadline)}</div>
                            {isOverdue && <div className={cn('text-xs', dl.cls)}>{dl.text}</div>}
                          </div>
                        )
                      })() : <span className="text-[#94A3B8]">—</span>}
                    </td>
                    <td className="px-4 py-3">{statusBadge(c.status)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={e => { e.stopPropagation(); setDeleteId(c.id) }}
                        className="p-1 rounded hover:bg-red-50 text-[#CBD5E1] hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </Card>

      <CreateCaseModal open={createOpen} onClose={() => setCreateOpen(false)} orgId={orgId} />

      {detailId && (
        <CaseDetailModal
          open={!!detailId} onClose={() => setDetailId('')}
          caseId={detailId} orgId={orgId}
        />
      )}

      <ConfirmDialog
        open={!!deleteId}
        title={t('caseDeleteTitle')}
        message={t('caseDeleteConfirm')}
        confirmLabel={t('delete')}
        onConfirm={() => deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId('')}
      />
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type Tab = 'docs' | 'cases'

export default function YuristPage() {
  const t = useTranslations('lawyer')
  const { currentOrg, isPro } = useAuth()
  const orgId = currentOrg?.id ?? ''

  const [tab,               setTab]               = useState<Tab>('docs')
  const [selectedDoc,       setSelectedDoc]        = useState<string | null>(null)
  const [preview,           setPreview]            = useState('')
  const [previewTitle,      setPreviewTitle]       = useState('')
  const [loading,           setLoading]            = useState(false)
  const [form,              setForm]               = useState<FormState>(INITIAL_FORM)
  const [saveCaseOpen,      setSaveCaseOpen]       = useState(false)
  const [quickFillCaseId,   setQuickFillCaseId]    = useState('')

  const docs = useYuristDocs()

  const { data: cps = [] } = useQuery<any[]>({
    queryKey: ['counterparties', orgId],
    queryFn:  () => api.get(`/counterparties?orgId=${orgId}&limit=100`).then(r => r.data.data || []),
    enabled:  !!orgId,
  })

  const { data: allCases } = useQuery<{ data: any[] }>({
    queryKey: ['legal-cases', orgId],
    queryFn:  () => api.get(`/legal?orgId=${orgId}&limit=50`).then(r => r.data),
    enabled:  !!orgId && isPro && tab === 'docs' && !!selectedDoc,
  })

  const { data: stats } = useQuery<any>({
    queryKey: ['legal-stats', orgId],
    queryFn:  () => api.get(`/legal/stats?orgId=${orgId}`).then(r => r.data),
    enabled:  !!orgId && isPro,
  })

  function fillFromCase(c: any) {
    if (!c) return
    const cp = c.counterparty
    setForm(f => ({
      ...f,
      cpNomi:   cp?.name         || f.cpNomi,
      cpInn:    cp?.inn          || f.cpInn,
      cpRahbar: cp?.directorName || f.cpRahbar,
      cpManzil: cp?.address      || f.cpManzil,
    }))
    toast.success('Form to\'ldirildi ✓')
  }

  function buildData(): YuristData {
    const fmt = (v: string) => v ? formatNumber(Number(v)) + " so'm" : ''
    return {
      orgNomi:   currentOrg?.name         || '',
      orgInn:    currentOrg?.inn           || '',
      orgRahbar: currentOrg?.directorName  || '',
      orgManzil: currentOrg?.address,
      orgBank:   currentOrg?.bankName,
      orgHisob:  currentOrg?.bankAccount,
      orgMfo:    currentOrg?.mfo,
      orgTel:    currentOrg?.phone,
      cpNomi:    form.cpNomi,
      cpInn:     form.cpInn     || undefined,
      cpRahbar:  form.cpRahbar  || undefined,
      cpManzil:  form.cpManzil  || undefined,
      raqam:     form.raqam,
      sana:      form.sana,
      extra: {
        SHARTNOMA_RAQAM:    form.shartnomaRaqam,
        SHARTNOMA_SANA:     form.shartnomaSana,
        MAJBURIYAT:         form.majburiyat,
        QARZ_SUMMA:         fmt(form.qarzSumma),
        PENYA_FOIZ:         form.penyaFoiz,
        PENYA_SUMMA:        fmt(form.penyaSumma),
        JAMI_TALAB:         fmt(form.jamiTalab),
        JAVOB_MUDDAT:       form.javobMuddat,
        SUD_NOMI:           form.sudNomi,
        DAVO_PREDMETI:      form.davoPredmeti,
        DAVLAT_BOJI:        fmt(form.davlatBoji),
        VAKIL_ISM:          form.vakilIsm,
        VAKIL_PASSPORT:     form.vakilPassport,
        VAKIL_MANZIL:       form.vakilManzil,
        VAKOLAT_DOIRASI:    form.vakolatDoirasi,
        AMAL_MUDDAT:        form.amalMuddat,
        KELISHUV_PREDMETI:  form.kelishuvPredmeti,
        TOMON1_MAJBURIYAT:  form.tomon1Majburiyat,
        TOMON2_MAJBURIYAT:  form.tomon2Majburiyat,
        TOLOV_SUMMA:        fmt(form.tolovSumma),
        TOLOV_MUDDAT:       form.tolovMuddat,
        OGOH_SABAB:         form.ogohSabab,
        BAJARISH_MUDDAT:    form.bajarishMuddat,
        OQIBAT:             form.oqibat,
        DALOLATNOMA_JOYI:   form.dalolatnomaJoyi,
        KOMISSIYA:          form.komissiya,
        HOLAT_TAVSIFI:      form.holatTavsifi,
        QIYMAT:             fmt(form.qiymat),
        BEKOR_SABAB:        form.bekorSabab,
        KUCH_KIRISH_SANA:   form.kuchKirishSana,
        HISOB_TARTIB:       form.hisobTartib,
      },
    }
  }

  function handleGenerate() {
    if (!selectedDoc) return
    const generator = DOC_GENERATOR_MAP[selectedDoc]
    if (!generator) return
    const data      = buildData()
    const doc       = docs.find(d => d.id === selectedDoc)
    setPreview(generator(data))
    setPreviewTitle(`${doc?.name || selectedDoc} № ${data.raqam}`)
    setSaveCaseOpen(true)
  }

  async function handleExport(type: 'pdf' | 'docx') {
    if (!preview) return
    setLoading(true)
    try {
      const opts = { title: previewTitle, content: preview, orgName: currentOrg?.name }
      if (type === 'pdf') await exportContractPdf(opts)
      else                await exportContractDocx(opts)
      toast.success(`${type === 'pdf' ? 'PDF' : 'Word'} ✓`)
    } catch {
      toast.error(t('exportError'))
    } finally {
      setLoading(false)
    }
  }

  // ── PRO LOCK ──────────────────────────────────────────────────────────────
  if (!isPro) {
    return (
      <div>
        <PageHeader title={t('title')} breadcrumbs={[
          { label: 'Dashboard', path: '/dashboard' },
          { label: t('breadcrumb') },
        ]} />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-2xl bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center mb-6">
            <Lock size={32} className="text-[#D97706]" />
          </div>
          <h2 className="font-semibold text-[#0F172A] text-2xl mb-3">{t('proLockTitle')}</h2>
          <p className="text-[#475569] text-base max-w-md leading-relaxed mb-6">{t('proLockDesc')}</p>
          <Link href="/dashboard/sozlamalar/obuna">
            <Button leftIcon={<Zap size={15} />}>{t('switchToPro')}</Button>
          </Link>
        </div>
      </div>
    )
  }

  // ── MAIN ──────────────────────────────────────────────────────────────────
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
          <StatCard label={t('statusOpen')}       value={stats.open}         icon={<Briefcase     size={18} className="text-blue-600"  />} color="bg-blue-100" />
          <StatCard label={t('statusInProgress')} value={stats.inProgress}   icon={<Clock         size={18} className="text-amber-600" />} color="bg-amber-100" />
          <StatCard label={t('statusResolved')}   value={stats.resolved}     icon={<CheckCircle   size={18} className="text-green-600" />} color="bg-green-100" />
          <StatCard label={t('statusClosed')}     value={stats.closed}       icon={<XCircle       size={18} className="text-gray-500"  />} color="bg-gray-100" />
          <StatCard label={t('overdue')}          value={stats.overdueCount} icon={<AlertTriangle size={18} className="text-red-600"   />} color="bg-red-100" danger />
        </div>
      )}

      {/* Deadline banner */}
      <DeadlineBanner orgId={orgId} onShowCases={() => { setTab('cases'); setSelectedDoc(null); setPreview('') }} />

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F1F5F9] p-1 rounded-xl mb-6 w-fit">
        {([
          { key: 'docs',  label: t('docsTab') },
          { key: 'cases', label: t('casesTab') },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setTab(key); setSelectedDoc(null); setPreview('') }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-white text-[#2563EB] shadow-sm' : 'text-[#64748B] hover:text-[#0F172A]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Hujjatlar yaratish tab */}
      {tab === 'docs' && (
        !selectedDoc ? (
          <DocCardGrid onSelect={id => { setSelectedDoc(id); setPreview(''); setQuickFillCaseId('') }} />
        ) : (
          <div className={cn('grid gap-6', preview ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
            <Card>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-[#0F172A]">
                  {docs.find(d => d.id === selectedDoc)?.name}
                </h3>
                <button onClick={() => { setSelectedDoc(null); setPreview('') }}
                  className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
                  ← {t('back')}
                </button>
              </div>

              {/* Quick-fill from case */}
              {allCases?.data && allCases.data.length > 0 && (
                <div className="mb-4 p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-center gap-2 mb-2">
                    <FolderOpen size={14} className="text-[#2563EB]" />
                    <span className="text-xs font-medium text-[#374151]">{t('fillFromCase')}</span>
                  </div>
                  <div className="flex gap-2">
                    <select
                      value={quickFillCaseId}
                      onChange={e => {
                        setQuickFillCaseId(e.target.value)
                        const c = allCases.data.find((x: any) => x.id === e.target.value)
                        if (c) fillFromCase(c)
                      }}
                      className="flex-1 h-9 rounded-lg text-sm px-3 bg-white border border-[#E2E8F0] focus:outline-none focus:border-[#2563EB]"
                    >
                      <option value="">{t('selectCase')}</option>
                      {allCases.data.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <YuristFormFields
                selectedDoc={selectedDoc}
                form={form}
                setForm={setForm}
                cps={cps}
              />
              <Button fullWidth onClick={handleGenerate} className="mt-4">
                {t('generateDocument')}
              </Button>
            </Card>

            <PreviewPanel preview={preview} loading={loading} onExport={handleExport} />
          </div>
        )
      )}

      {/* Ishlar tab */}
      {tab === 'cases' && <CasesTab orgId={orgId} />}

      {/* Save to case modal */}
      {saveCaseOpen && preview && (
        <SaveToCaseModal
          open={saveCaseOpen}
          onClose={() => setSaveCaseOpen(false)}
          orgId={orgId}
          docType={selectedDoc || 'boshqa'}
          docTitle={previewTitle}
          docContent={preview}
          preselectedCaseId={quickFillCaseId || undefined}
        />
      )}
    </div>
  )
}
