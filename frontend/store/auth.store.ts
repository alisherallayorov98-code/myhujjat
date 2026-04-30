import { create }   from 'zustand'
import { persist }  from 'zustand/middleware'
import type { User, Organization } from '@/lib/types'

interface AuthState {
  user:             User | null
  accessToken:      string | null
  currentOrg:       Organization | null
  organizations:    Organization[]
  isLoading:        boolean

  setUser:          (user: User | null) => void
  setToken:         (token: string | null) => void
  setCurrentOrg:    (org: Organization | null) => void
  setOrganizations: (orgs: Organization[]) => void
  setLoading:       (loading: boolean) => void
  logout:           () => void

  isPro:      () => boolean
  isStandard: () => boolean
  isFree:     () => boolean
  canCreate:  () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user:          null,
      accessToken:   null,
      currentOrg:    null,
      organizations: [],
      isLoading:     true,

      setUser:          (user)    => set({ user }),
      setToken:         (token)   => set({ accessToken: token }),
      setCurrentOrg:    (org)     => set({ currentOrg: org }),
      setOrganizations: (orgs)    => set({ organizations: orgs }),
      setLoading:       (loading) => set({ isLoading: loading }),

      logout: () => {
        localStorage.removeItem('access_token')
        set({
          user: null, accessToken: null,
          currentOrg: null, organizations: [],
        })
        window.location.href = '/login'
      },

      isPro: () => {
        const plan = get().user?.subscription?.plan
        return plan === 'PRO' || plan === 'DEMO'
      },

      isStandard: () => {
        const plan = get().user?.subscription?.plan
        return plan === 'STANDARD' || plan === 'PRO' || plan === 'DEMO'
      },

      isFree: () => {
        const plan = get().user?.subscription?.plan
        return !plan || plan === 'FREE'
      },

      canCreate: () => {
        const sub = get().user?.subscription
        if (!sub || sub.plan === 'FREE') {
          return (sub?.contractCount || 0) < 3
        }
        if (sub.plan === 'STANDARD') {
          return (sub.contractCount || 0) < 50
        }
        return true
      },
    }),
    {
      name:       'myhujjat-auth',
      partialize: (s) => ({
        user:          s.user,
        accessToken:   s.accessToken,
        currentOrg:    s.currentOrg,
        organizations: s.organizations,
      }),
    }
  )
)
