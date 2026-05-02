import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import toast from 'react-hot-toast'

// Past internet uchun timeout — 60s yetarli, cheksiz emas
const REQUEST_TIMEOUT = 60_000
const MAX_RETRY_NETWORK = 2  // tarmoq xatolari uchun max 2 retry

const api = axios.create({
  baseURL:         process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1',
  withCredentials: true,
  timeout:         REQUEST_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// ─── Request: tokenni qo'shish ──────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// ─── Response: 401 refresh + tarmoq xatolari uchun retry ────
type RetryConfig = InternalAxiosRequestConfig & {
  _retry?:      boolean
  _retryCount?: number
}

function isRetryableNetworkError(err: AxiosError): boolean {
  if (!err.response)               return true   // tarmoq uzildi
  if (err.code === 'ECONNABORTED') return true   // timeout
  if (err.code === 'ERR_NETWORK')  return true
  const s = err.response?.status
  if (s === 502 || s === 503 || s === 504) return true
  return false
}

// Exponential backoff: 0.5s → 1s → 2s
const backoffDelay = (attempt: number) =>
  Math.min(500 * Math.pow(2, attempt), 4000)

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined
    if (!original) return Promise.reject(error)

    // 401 → access token yangilash
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const { data } = await api.post('/auth/refresh')
        if (typeof window !== 'undefined') {
          localStorage.setItem('access_token', data.accessToken)
        }
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token')
          window.location.href = '/login'
        }
        return Promise.reject(error)
      }
    }

    // Tarmoq xatolari uchun retry (past signalda ham ishlash uchun)
    if (isRetryableNetworkError(error)) {
      original._retryCount = (original._retryCount || 0) + 1
      if (original._retryCount <= MAX_RETRY_NETWORK) {
        await new Promise(r => setTimeout(r, backoffDelay(original._retryCount - 1)))
        return api(original)
      }
      // Retry tugagandan keyin foydalanuvchini bir marta ogohlantiramiz
      // (har komponent o'z toast.error'ini chaqirishidan saqlanadi).
      // id orqali dedup — ko'p so'rov bir vaqtda fail bo'lsa bitta toast chiqadi.
      if (typeof window !== 'undefined') {
        toast.error('Internet aloqasi yo\'q yoki server javob bermadi', {
          id: 'network-error',
          duration: 4000,
        })
      }
    }

    return Promise.reject(error)
  }
)

export default api
