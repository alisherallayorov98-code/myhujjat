'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Default: ro'yxatlar — 2 daq stale, 5 daq gc
        staleTime:            2 * 60 * 1000,
        gcTime:               5 * 60 * 1000,
        // Tarmoq xatolari uchun retry, lekin ko'p emas (axios o'zi 2 marta retry qiladi)
        retry: (count, error: any) => {
          if ([401, 403, 404].includes(error?.response?.status)) return false
          return count < 1
        },
        // Past internetda window'ga qaytsa qayta yuklamaslik
        refetchOnWindowFocus: false,
        // Tarmoq qaytsa avtomatik refetch (offline → online)
        refetchOnReconnect:   true,
        // Network idle bo'lsa refetch qilmaslik
        networkMode:          'online',
      },
      mutations: {
        retry: 0,
        networkMode: 'online',
      },
    },
  }))

  // Tab background'da bo'lganda eski cache'ni tozalash (xotira tejash)
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        // 5 daqiqadan eski cache'ni tozalash
        queryClient.getQueryCache().getAll().forEach(query => {
          const lastUpdated = query.state.dataUpdatedAt
          if (lastUpdated && Date.now() - lastUpdated > 5 * 60 * 1000) {
            queryClient.removeQueries({ queryKey: query.queryKey, exact: true })
          }
        })
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [queryClient])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
