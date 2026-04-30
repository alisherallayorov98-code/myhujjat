import {
  LayoutDashboard, FileText, ClipboardList,
  Briefcase, Calculator, Users, Scale,
  Archive, LayoutTemplate, Building2,
  UserCircle, Settings, ChevronRight,
  Users2, Sparkles,
  type LucideIcon
} from 'lucide-react'

export interface NavItem {
  id:       string
  label:    string
  labelRu?: string
  icon:     LucideIcon
  path:     string
  badge?:   string | number
  children?: NavItem[]
  proOnly?: boolean
}

export const MAIN_NAV: NavItem[] = [
  // ─── 1. Bosh sahifa ──────────────────────────────────
  {
    id:    'dashboard',
    label: 'Bosh sahifa',
    icon:  LayoutDashboard,
    path:  '/dashboard',
  },

  // ─── 2. Asosiy ish (kunlik) ──────────────────────────
  {
    id:    'shartnomalar',
    label: 'Shartnomalar',
    icon:  FileText,
    path:  '/dashboard/shartnomalar',
    children: [
      { id: 'sh-list', label: "Ro'yxat",       icon: ChevronRight, path: '/dashboard/shartnomalar' },
      { id: 'sh-new',  label: 'Yangi shartnoma', icon: ChevronRight, path: '/dashboard/shartnomalar/yangi' },
    ]
  },
  {
    id:    'kontragentlar',
    label: 'Kontragentlar',
    icon:  Users2,
    path:  '/dashboard/kontragentlar',
  },
  {
    id:    'spesifikatsiya',
    label: 'Spesifikatsiya',
    icon:  ClipboardList,
    path:  '/dashboard/spesifikatsiyalar',
  },
  {
    id:    'tashkilotlar',
    label: 'Tashkilotlar',
    icon:  Building2,
    path:  '/dashboard/tashkilotlar',
  },

  // ─── 3. Bo'limlar (rolga xos) ────────────────────────
  {
    id:    'kotib',
    label: 'Kotib',
    icon:  Briefcase,
    path:  '/dashboard/kotib',
    children: [
      { id: 'buyruq',    label: 'Buyruqlar',   icon: ChevronRight, path: '/dashboard/kotib/buyruq' },
      { id: 'bayonnoma', label: 'Bayonnomalar', icon: ChevronRight, path: '/dashboard/kotib/bayonnoma' },
    ]
  },
  {
    id:    'buxgalter',
    label: 'Buxgalter',
    icon:  Calculator,
    path:  '/dashboard/buxgalter',
    children: [
      { id: 'faktura',       label: 'Faktura',         icon: ChevronRight, path: '/dashboard/buxgalter/faktura' },
      { id: 'akt-sverki',    label: 'Akt sverki',       icon: ChevronRight, path: '/dashboard/buxgalter/akt-sverki' },
      { id: 'tolov-grafigi', label: "To'lov grafigi",   icon: ChevronRight, path: '/dashboard/buxgalter/tolov-grafigi' },
    ]
  },
  {
    id:    'kadrlar',
    label: 'Kadrlar (HR)',
    icon:  Users,
    path:  '/dashboard/kadrlar',
    children: [
      { id: 'xodimlar',    label: 'Xodimlar',    icon: ChevronRight, path: '/dashboard/kadrlar' },
      { id: 'ishga-qabul', label: 'Ishga qabul', icon: ChevronRight, path: '/dashboard/kadrlar/ishga-qabul' },
    ]
  },
  {
    id:      'yurist',
    label:   'Yurist',
    icon:    Scale,
    path:    '/dashboard/yurist',
    proOnly: true,
  },

  // ─── 4. Yordamchi vositalar ──────────────────────────
  {
    id:      'ai',
    label:   'AI Yordamchi',
    icon:    Sparkles,
    path:    '/dashboard/seif/ai',
    proOnly: true,
  },
  {
    id:    'shablonlar',
    label: 'Shablonlar',
    icon:  LayoutTemplate,
    path:  '/dashboard/shablonlar',
  },
  {
    id:    'seif',
    label: 'Seif (arxiv)',
    icon:  Archive,
    path:  '/dashboard/seif',
  },
]

export const BOTTOM_NAV: NavItem[] = [
  {
    id:    'sozlamalar',
    label: 'Sozlamalar',
    icon:  Settings,
    path:  '/dashboard/sozlamalar',
  },
]
