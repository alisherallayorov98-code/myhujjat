import { Logger } from '@nestjs/common'

/**
 * Circuit Breaker — tashqi API'lar uchun.
 *
 * Holatlar:
 *   CLOSED      — normal ishlash (so'rovlar o'tkaziladi)
 *   OPEN        — siniq holat (so'rovlar darhol rad etiladi)
 *   HALF_OPEN   — sinov holati (1-2 ta so'rov o'tkaziladi)
 *
 * Mantiq:
 *   - 5 ta ketma-ket xato → OPEN
 *   - 5 daqiqa kutadi → HALF_OPEN
 *   - HALF_OPEN'da muvaffaqiyatli so'rov → CLOSED
 *   - HALF_OPEN'da xato → yana OPEN
 */
type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface BreakerOptions {
  name:                  string
  failureThreshold?:     number  // qancha ketma-ket xato OPEN qilsin
  resetTimeoutMs?:       number  // OPEN holatda qancha kutsin (HALF_OPEN'ga o'tish uchun)
  halfOpenSuccessThreshold?: number  // HALF_OPEN'da nechta muvaffaqiyat → CLOSED
}

export class CircuitBreaker {
  private state: State              = 'CLOSED'
  private failureCount: number      = 0
  private successCount: number      = 0  // HALF_OPEN holatda hisoblanadi
  private nextAttempt: number       = 0
  private lastError:   string | null = null
  private readonly logger:          Logger
  private readonly opts:            Required<BreakerOptions>

  constructor(opts: BreakerOptions) {
    this.opts = {
      failureThreshold:           opts.failureThreshold        ?? 5,
      resetTimeoutMs:             opts.resetTimeoutMs          ?? 5 * 60 * 1000,
      halfOpenSuccessThreshold:   opts.halfOpenSuccessThreshold ?? 2,
      name:                       opts.name,
    }
    this.logger = new Logger(`CB:${opts.name}`)
  }

  // ─── Funksiyani himoyalangan tarzda chaqirish ──────────────
  async exec<T>(fn: () => Promise<T>): Promise<T> {
    // OPEN holatda — kutish vaqti o'tganmi?
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new CircuitOpenError(this.opts.name, this.lastError)
      }
      // Kutish tugadi — HALF_OPEN'ga o'tamiz
      this.state = 'HALF_OPEN'
      this.successCount = 0
      this.logger.warn(`HALF_OPEN — sinov urinishi`)
    }

    try {
      const result = await fn()
      this.onSuccess()
      return result
    } catch (err: any) {
      this.onFailure(err?.message || String(err))
      throw err
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.successCount++
      if (this.successCount >= this.opts.halfOpenSuccessThreshold) {
        this.state = 'CLOSED'
        this.failureCount = 0
        this.successCount = 0
        this.lastError = null
        this.logger.log('CLOSED — qaytadan normal ishlamoqda')
      }
    } else if (this.state === 'CLOSED') {
      this.failureCount = 0  // muvaffaqiyat — counter reset
    }
  }

  private onFailure(message: string) {
    this.lastError = message
    this.failureCount++

    if (this.state === 'HALF_OPEN') {
      // Sinovda yana xato — qaytadan OPEN
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.opts.resetTimeoutMs
      this.logger.error(`OPEN — sinov ham xato berdi: ${message}`)
      return
    }

    if (this.state === 'CLOSED' && this.failureCount >= this.opts.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttempt = Date.now() + this.opts.resetTimeoutMs
      this.logger.error(`OPEN — ${this.failureCount} ta xato. Keyingi urinish: ${new Date(this.nextAttempt).toISOString()}`)
    }
  }

  getStatus() {
    return {
      name:           this.opts.name,
      state:          this.state,
      failureCount:   this.failureCount,
      lastError:      this.lastError,
      nextAttemptAt:  this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null,
    }
  }

  reset() {
    this.state = 'CLOSED'
    this.failureCount = 0
    this.successCount = 0
    this.nextAttempt  = 0
    this.lastError    = null
    this.logger.log('Manual reset — CLOSED')
  }
}

export class CircuitOpenError extends Error {
  constructor(name: string, lastError: string | null) {
    super(`${name} xizmati vaqtincha mavjud emas (oxirgi xato: ${lastError || 'noma\'lum'})`)
    this.name = 'CircuitOpenError'
  }
}

// ─── Global breaker registratsiyasi ───────────────────────
const breakers = new Map<string, CircuitBreaker>()

export function getBreaker(name: string, opts?: Omit<BreakerOptions, 'name'>): CircuitBreaker {
  let b = breakers.get(name)
  if (!b) {
    b = new CircuitBreaker({ name, ...opts })
    breakers.set(name, b)
  }
  return b
}

export function getAllBreakers() {
  return Array.from(breakers.values()).map(b => b.getStatus())
}

export function resetBreaker(name: string) {
  breakers.get(name)?.reset()
}
