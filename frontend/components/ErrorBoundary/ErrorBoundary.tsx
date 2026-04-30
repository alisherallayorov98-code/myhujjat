'use client'

import React, { Component, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children:  ReactNode
  fallback?: ReactNode
}

interface State {
  hasError:    boolean
  error:       Error | null
  errorCount:  number
  autoReloadIn: number
}

const AUTO_RELOAD_SECONDS = 5
const MAX_AUTO_RELOAD     = 2  // 2 marta avto-reload, keyin manual

export class ErrorBoundary extends Component<Props, State> {
  private timer: NodeJS.Timeout | null = null

  state: State = {
    hasError:     false,
    error:        null,
    errorCount:   0,
    autoReloadIn: 0,
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Console'ga log
    console.error('ErrorBoundary:', error, info)

    // localStorage'da takror qancha bo'lganini saqlash
    const reloadCount = Number(sessionStorage.getItem('eb_reload_count') || '0')
    this.setState({ errorCount: reloadCount + 1 })

    // Avto-reload (faqat birinchi 2 marta)
    if (reloadCount < MAX_AUTO_RELOAD) {
      this.startAutoReload()
    }

    // Backend'ga yuborish (kelajakda Sentry yoki o'zimizning incident endpoint)
    this.reportError(error, info).catch(() => {})
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  startAutoReload() {
    this.setState({ autoReloadIn: AUTO_RELOAD_SECONDS })
    this.timer = setInterval(() => {
      this.setState(prev => {
        const next = prev.autoReloadIn - 1
        if (next <= 0) {
          if (this.timer) clearInterval(this.timer)
          this.handleReload()
          return prev
        }
        return { ...prev, autoReloadIn: next }
      })
    }, 1000)
  }

  handleReload = () => {
    const count = Number(sessionStorage.getItem('eb_reload_count') || '0')
    sessionStorage.setItem('eb_reload_count', String(count + 1))
    window.location.reload()
  }

  handleHome = () => {
    sessionStorage.removeItem('eb_reload_count')
    window.location.href = '/dashboard'
  }

  async reportError(error: Error, info: React.ErrorInfo) {
    // Faqat production'da yuboramiz
    if (process.env.NODE_ENV !== 'production') return
    try {
      await fetch('/api/v1/health/client-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:   error.message,
          stack:     error.stack?.slice(0, 2000),
          component: info.componentStack?.slice(0, 1000),
          url:       window.location.href,
          userAgent: navigator.userAgent,
        }),
      })
    } catch {}
  }

  render() {
    if (!this.state.hasError) return this.props.children
    if (this.props.fallback)  return this.props.fallback

    const tooManyErrors = this.state.errorCount >= MAX_AUTO_RELOAD

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-[#DC2626]" />
          </div>

          <h1 className="font-display font-black text-[#0F172A] text-xl mb-2">
            {tooManyErrors ? 'Kutilmagan muammo' : 'Tuzatilmoqda...'}
          </h1>

          <p className="text-sm text-[#475569] mb-6 leading-relaxed">
            {tooManyErrors
              ? "Sahifada bir nechta xato yuz berdi. Iltimos, bosh sahifaga qaytib, qaytadan urinib ko'ring."
              : "Sayt o'zini avtomatik tuzatmoqda. Bir necha soniyadan so'ng qayta yuklanadi."}
          </p>

          {!tooManyErrors && this.state.autoReloadIn > 0 && (
            <div className="mb-6">
              <div className="text-3xl font-bold text-[#2563EB] mb-2">
                {this.state.autoReloadIn}
              </div>
              <p className="text-xs text-[#94A3B8]">soniyadan so'ng qayta yuklanadi</p>
            </div>
          )}

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="text-left mb-6 bg-[#F1F5F9] rounded-lg p-3">
              <summary className="text-xs font-mono text-[#475569] cursor-pointer">
                Texnik tafsilot (faqat dev rejimda)
              </summary>
              <pre className="text-[10px] mt-2 overflow-x-auto text-[#DC2626]">
                {this.state.error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-2 justify-center">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              <RefreshCw size={14} />
              Qaytadan yuklash
            </button>
            <button
              onClick={this.handleHome}
              className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] px-4 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              <Home size={14} />
              Bosh sahifa
            </button>
          </div>

          <p className="text-[11px] text-[#94A3B8] mt-6">
            Agar muammo davom etsa: <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] hover:underline">support@myhujjat.uz</a>
          </p>
        </div>
      </div>
    )
  }
}

// Muvaffaqiyatli sahifa yuklanganda counter'ni reset qilish
export function resetErrorCount() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('eb_reload_count')
  }
}
