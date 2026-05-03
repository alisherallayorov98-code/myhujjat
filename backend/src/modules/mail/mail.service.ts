import { Injectable, Logger } from '@nestjs/common'
import { Resend }              from 'resend'
import { mailTexts, type Lang } from './mail.i18n'

const FROM     = process.env.MAIL_FROM     || 'MyHujjat.uz <noreply@myhujjat.uz>'
const BASE_URL = process.env.FRONTEND_URL  || 'https://myhujjat.uz'

const COMMON_STYLE = `body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}.c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}.h{padding:32px;text-align:center}.logo{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}.b{padding:32px}h1{color:#0F172A;font-size:20px;margin:0 0 12px}p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px}.btn{display:inline-block;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}.f{padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center}.f p{color:#94A3B8;font-size:12px;margin:0}`

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend = new Resend(process.env.RESEND_API_KEY)

  private async send(to: string, subject: string, html: string) {
    if (process.env.NODE_ENV !== 'production') {
      this.logger.debug(`[MAIL DEV] To: ${to} | Subject: ${subject}`)
      return { id: 'dev-mock' }
    }
    try {
      const result = await this.resend.emails.send({ from: FROM, to, subject, html })
      this.logger.log(`Email yuborildi: ${to}`)
      return result
    } catch (err: any) {
      this.logger.error(`Email xatosi: ${err?.message}`)
      throw err
    }
  }

  // ─── Email tasdiqlash ────────────────────────────────────────────────────
  async sendVerification(to: string, firstName: string, token: string, lang: Lang = 'uz') {
    const t   = mailTexts[lang].verify
    const url = `${BASE_URL}/auth/verify-email?token=${token}`
    return this.send(to, t.subject, `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:#2563EB}.btn{background:#2563EB}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>${t.title}</h1>
    <p>${t.greeting.replace('{name}', firstName || to)}</p>
    <a href="${url}" class="btn">${t.cta}</a>
    <p style="margin-top:20px;font-size:12px;color:#94A3B8">${t.expiry}</p>
  </div>
  <div class="f"><p>&copy; ${new Date().getFullYear()} MyHujjat.uz — ${t.footer}</p></div>
</div>
</body></html>`)
  }

  // ─── Parol tiklash ───────────────────────────────────────────────────────
  async sendPasswordReset(to: string, firstName: string, token: string, lang: Lang = 'uz') {
    const t   = mailTexts[lang].reset
    const url = `${BASE_URL}/auth/reset-password?token=${token}`
    return this.send(to, t.subject, `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:#DC2626}.btn{background:#DC2626}.warn{background:#FEF3C7;border-left:3px solid #D97706;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#92400E}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>${t.title}</h1>
    <p>${t.greeting.replace('{name}', firstName || to)}</p>
    <a href="${url}" class="btn">${t.cta}</a>
    <p style="margin-top:20px"></p>
    <div class="warn">⚠️ ${t.warning}</div>
  </div>
</div>
</body></html>`)
  }

  // ─── Xush kelibsiz ───────────────────────────────────────────────────────
  async sendWelcome(to: string, firstName: string, lang: Lang = 'uz') {
    const t = mailTexts[lang].welcome
    return this.send(to, t.subject.replace('{name}', firstName || ''), `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:linear-gradient(135deg,#2563EB,#7C3AED);padding:40px 32px}.logo{font-size:28px}.tag{color:rgba(255,255,255,.8);font-size:13px;margin-top:4px}.btn{background:#2563EB}.feat{display:flex;gap:12px;margin-bottom:12px;align-items:flex-start}.fi{font-size:20px}.ft strong{display:block;font-size:13px;color:#0F172A}.ft span{color:#94A3B8;font-size:12px}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div><div class="tag">${t.tagline}</div></div>
  <div class="b">
    <h1>${t.title.replace('{name}', firstName || '')}</h1>
    <p>${t.intro}</p>
    <div class="feat"><div class="fi">📄</div><div class="ft"><strong>${t.feat1Title}</strong><span>${t.feat1Desc}</span></div></div>
    <div class="feat"><div class="fi">🤖</div><div class="ft"><strong>${t.feat2Title}</strong><span>${t.feat2Desc}</span></div></div>
    <div class="feat"><div class="fi">✍️</div><div class="ft"><strong>${t.feat3Title}</strong><span>${t.feat3Desc}</span></div></div>
    <br>
    <a href="${BASE_URL}/dashboard" class="btn">${t.cta}</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Obuna faollashtirildi ────────────────────────────────────────────────
  async sendSubscriptionActivated(to: string, firstName: string, plan: string, expiresAt: Date, lang: Lang = 'uz') {
    const t         = mailTexts[lang].subActivated
    const planLabel = (t.plans as any)[plan] || plan
    const dateStr   = expiresAt.toLocaleDateString(lang === 'ru' ? 'ru-RU' : lang === 'oz' ? 'uz-Cyrl-UZ' : 'uz-UZ')
    return this.send(to, t.subject.replace('{plan}', planLabel), `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:#16A34A}.btn{background:#16A34A}.badge{display:inline-block;background:#DCFCE7;color:#16A34A;padding:6px 16px;border-radius:100px;font-weight:700;font-size:16px;margin-bottom:16px}.info{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;font-size:13px;color:#15803D}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>${t.title}</h1>
    <p>${t.greeting.replace('{name}', firstName)}</p>
    <div class="badge">${planLabel}</div>
    <p>${t.body}</p>
    <div class="info">📅 ${t.expires}: <strong>${dateStr}</strong></div>
    <br><a href="${BASE_URL}/dashboard" class="btn">${t.cta}</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Obuna tugash eslatmasi ───────────────────────────────────────────────
  async sendSubscriptionExpiring(to: string, firstName: string, daysLeft: number, lang: Lang = 'uz') {
    const t = mailTexts[lang].subExpiring
    return this.send(to, t.subject.replace('{days}', String(daysLeft)), `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:#D97706}.btn{background:#2563EB}.warn{background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px;font-size:14px;color:#92400E;margin-bottom:20px}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>${t.title}</h1>
    <p>${t.greeting.replace('{name}', firstName)}</p>
    <div class="warn">⚠️ ${t.warning.replace('{days}', String(daysLeft))}</div>
    <p>${t.body}</p>
    <a href="${BASE_URL}/dashboard/sozlamalar/obuna" class="btn">${t.cta}</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Shartnoma limit ogohlantirish ───────────────────────────────────────
  async sendContractLimitWarning(to: string, firstName: string, used: number, total: number, lang: Lang = 'uz') {
    const t   = mailTexts[lang].contractLimit
    const pct = Math.min(100, Math.round((used / total) * 100))
    return this.send(to, t.subject, `
<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${COMMON_STYLE}.h{background:#0F172A}.btn{background:#2563EB}.pw{background:#E2E8F0;border-radius:100px;height:10px;overflow:hidden;margin:12px 0}.pb{height:100%;background:#DC2626;border-radius:100px;width:${pct}%}.stats{display:flex;justify-content:space-between;font-size:12px;color:#94A3B8}</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>${t.title}</h1>
    <p>${t.greeting.replace('{name}', firstName)}</p>
    <div class="pw"><div class="pb"></div></div>
    <div class="stats"><span>${t.used.replace('{n}', String(used))}</span><span>${t.total.replace('{n}', String(total))}</span></div>
    <br>
    <p>${t.body}</p>
    <a href="${BASE_URL}/dashboard/sozlamalar/obuna" class="btn">${t.cta}</a>
  </div>
</div>
</body></html>`)
  }
}
