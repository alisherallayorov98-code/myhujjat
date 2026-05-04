'use client'

import { useEffect, useState } from 'react'

/**
 * Qiymat debounced versiyasini qaytaradi.
 * Foydali: search input — har harf yozganda darhol API chaqirilmasin,
 * foydalanuvchi to'xtagandan keyin (default 300ms) bir marta chaqiriladi.
 *
 * Foydalanish:
 *   const [search, setSearch] = useState('')
 *   const debouncedSearch = useDebouncedValue(search, 300)
 *
 *   const { data } = useQuery({
 *     queryKey: ['items', debouncedSearch],
 *     queryFn:  () => api.get(`/items?q=${debouncedSearch}`),
 *   })
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
