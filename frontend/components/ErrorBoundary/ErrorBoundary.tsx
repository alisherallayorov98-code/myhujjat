'use client'

import React, { Component, type ReactNode } from 'react'
import { useTranslations }                  from 'next-intl'
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
const MAX_AUTO_RELOAD     = 2

interface FallbackProps {
  error:        Error | null
  errorCount:   number
  autoReloadIn: number
  onReload:     () => void
  onHome:       () => void
}

function ErrorFallback({ error, errorCount, autoReloadIn, onReload, onHome }: FallbackProps) {
  const t = useTranslations('errorBoundary')
  const tooManyErrors = errorCount >= MAX_AUTO_RELOAD

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#FEE2E2] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={28} className="text-[#DC2626]" />
        </div>

        <h1 className="font-display font-black text-[#0F172A] text-xl mb-2">
          {tooManyErrors ? t('titleTooMany') : t('titleFixing')}
        </h1>

        <p className="text-sm text-[#475569] mb-6 leading-relaxed">
          {tooManyErrors ? t('descTooMany') : t('descFixing')}
        </p>

        {!tooManyErrors && autoReloadIn > 0 && (
          <div className="mb-6">
            <div className="text-3xl font-bold text-[#2563EB] mb-2">
              {autoReloadIn}
            </div>
            <p className="text-xs text-[#94A3B8]">{t('reloadCountdown')}</p>
          </div>
        )}

        {process.env.NODE_ENV === 'development' && error && (
          <details className="text-left mb-6 bg-[#F1F5F9] rounded-lg p-3">
            <summary className="text-xs font-mono text-[#475569] cursor-pointer">
              {t('devDetails')}
            </summary>
            <pre className="text-[10px] mt-2 overflow-x-auto text-[#DC2626]">
              {error.message}
            </pre>
          </details>
        )}

        <div className="flex gap-2 justify-center">
          <button
            onClick={onReload}
            className="inline-flex items-center gap-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-4 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            <RefreshCw size={14} />
            {t('reload')}
          </button>
          <button
            onClick={onHome}
            className="inline-flex items-center gap-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#475569] px-4 py-2.5 rounded-lg font-semibold text-sm transition"
          >
            <Home size={14} />
            {t('home')}
          </button>
        </div>

        <p className="text-[11px] text-[#94A3B8] mt-6">
          {t('supportPrefix')} <a href="mailto:support@myhujjat.uz" className="text-[#2563EB] hover:underline">support@myhujjat.uz</a>
        </p>
      </div>
    </div>
  )
}

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
    console.error('ErrorBoundary:', error, info)

    const reloadCount = Number(sessionStorage.getItem('eb_reload_count') || '0')
    this.setState({ errorCount: reloadCount + 1 })

    if (reloadCount < MAX_AUTO_RELOAD) {
      this.startAutoReload()
    }

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

    return (
      <ErrorFallback
        error={this.state.error}
        errorCount={this.state.errorCount}
        autoReloadIn={this.state.autoReloadIn}
        onReload={this.handleReload}
        onHome={this.handleHome}
      />
    )
  }
}

export function resetErrorCount() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('eb_reload_count')
  }
}
