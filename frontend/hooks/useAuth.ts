'use client'

import { useCallback }  from 'react'
import { useRouter }    from 'next/navigation'
import { useAuthStore } from '@/store/auth.store'
import api              from '@/lib/api'

export function useAuth() {
  const router = useRouter()

  // Individual selectors — stable references, no infinite loop
  const user          = useAuthStore(s => s.user)
  const currentOrg    = useAuthStore(s => s.currentOrg)
  const organizations = useAuthStore(s => s.organizations)
  const isLoading     = useAuthStore(s => s.isLoading)
  const accessToken   = useAuthStore(s => s.accessToken)

  const setUser          = useAuthStore(s => s.setUser)
  const setToken         = useAuthStore(s => s.setToken)
  const setCurrentOrg    = useAuthStore(s => s.setCurrentOrg)
  const setOrganizations = useAuthStore(s => s.setOrganizations)
  const setLoading       = useAuthStore(s => s.setLoading)
  const storeLogout      = useAuthStore(s => s.logout)

  const isPro      = useAuthStore(s => s.isPro())
  const isStandard = useAuthStore(s => s.isStandard())
  const isFree     = useAuthStore(s => s.isFree())
  const canCreate  = useAuthStore(s => s.canCreate())

  const loadOrganizations = useCallback(async () => {
    try {
      const { data } = await api.get('/organizations')
      setOrganizations(data)
      const defaultOrg = data.find((o: any) => o.isDefault) || data[0]
      if (defaultOrg) setCurrentOrg(defaultOrg)
    } catch {}
  }, [setOrganizations, setCurrentOrg])

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setLoading(false)
      return null
    }
    try {
      setToken(token)
      const { data } = await api.get('/auth/me')
      setUser(data)
      await loadOrganizations()
      return data
    } catch {
      storeLogout()
      return null
    } finally {
      setLoading(false)
    }
  }, [setToken, setUser, setLoading, storeLogout, loadOrganizations])

  const login = useCallback(async (email: string, password: string, code?: string) => {
    const { data } = await api.post('/auth/login', { email, password, code })
    localStorage.setItem('access_token', data.accessToken)
    setToken(data.accessToken)
    setUser(data.user)
    await loadOrganizations()
    router.push('/dashboard')
    return data
  }, [router, setToken, setUser, loadOrganizations])

  const register = useCallback(async (payload: {
    email: string; password: string
    firstName?: string; lastName?: string
  }) => {
    const { data } = await api.post('/auth/register', payload)
    return data
  }, [])

  const logout = useCallback(async () => {
    try { await api.post('/auth/logout') } catch {}
    storeLogout()
  }, [storeLogout])

  const forgotPassword = useCallback(async (email: string) => {
    const { data } = await api.post('/auth/forgot-password', { email })
    return data
  }, [])

  const resetPassword = useCallback(async (token: string, password: string) => {
    const { data } = await api.post('/auth/reset-password', { token, password })
    return data
  }, [])

  return {
    user,
    currentOrg,
    organizations,
    isLoading,
    isLoggedIn: !!user,
    isPro,
    isStandard,
    isFree,
    canCreate,
    login,
    register,
    logout,
    loadUser,
    loadOrganizations,
    forgotPassword,
    resetPassword,
    setCurrentOrg,
  }
}
