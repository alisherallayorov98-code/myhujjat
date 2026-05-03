// Vitest setup — har test'dan oldin ishlaydigan global mock'lar
import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup }       from '@testing-library/react'

// Har test'dan keyin DOM tozalash
afterEach(() => {
  cleanup()
})

// Next.js navigation mock — komponentlar useRouter() chaqirsa ishlamaydi
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push:    vi.fn(),
    replace: vi.fn(),
    back:    vi.fn(),
    refresh: vi.fn(),
  }),
  useSearchParams: () => ({
    get: () => null,
  }),
  usePathname: () => '/',
  useParams:   () => ({}),
}))

// next-intl translations mock — t() chaqirilsa kalit'ning o'zini qaytaradi
// Bu bizga test'da real tarjimalarni ishlatmaslik imkonini beradi
vi.mock('next-intl', () => ({
  useTranslations: (namespace?: string) => (key: string, params?: Record<string, any>) => {
    if (params) {
      // Oddiy interpolation: "Hello {name}" → "Hello World" agar params={name: 'World'}
      let str = `${namespace ? namespace + '.' : ''}${key}`
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
      }
      return str
    }
    return `${namespace ? namespace + '.' : ''}${key}`
  },
}))

// react-hot-toast mock
vi.mock('react-hot-toast', () => {
  const toast: any = vi.fn((msg: any) => msg)
  toast.success = vi.fn()
  toast.error   = vi.fn()
  toast.dismiss = vi.fn()
  return { default: toast, toast }
})

// Document/window IntersectionObserver mock (jsdom doesn't provide it)
class IntersectionObserverMock {
  observe   = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
  takeRecords = vi.fn(() => [])
  root: Element | null = null
  rootMargin = ''
  thresholds: number[] = []
}
;(globalThis as any).IntersectionObserver = IntersectionObserverMock
;(globalThis as any).ResizeObserver       = IntersectionObserverMock

// jsdom'da File.arrayBuffer mavjud emas — polyfill (Excel parser test'lari uchun)
if (typeof File !== 'undefined' && !File.prototype.arrayBuffer) {
  File.prototype.arrayBuffer = async function () {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
if (typeof Blob !== 'undefined' && !Blob.prototype.arrayBuffer) {
  Blob.prototype.arrayBuffer = async function () {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload  = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(this)
    })
  }
}
