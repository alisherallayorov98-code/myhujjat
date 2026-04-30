import { Injectable, Logger } from '@nestjs/common'
import { Resend } from 'resend'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'support@myhujjat.uz'
const FROM_EMAIL  = process.env.MAIL_FROM    || 'MyHujjat.uz <noreply@myhujjat.uz>'

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

export interface Incident {
  severity:  Severity
  category:  string  // 'database' | 'memory' | 'external_api' | 'crash' | ...
  title:     string
  message:   string
  details?:  Record<string, any>
}

@Injectable()
export class IncidentReporterService {
  private readonly logger  = new Logger(IncidentReporterService.name)
  private readonly resend  = new Resend(process.env.RESEND_API_KEY)

  // Bir xil incident takror yuborilmasligi uchun kechikma
  private readonly recentIncidents = new Map<string, number>()
  private readonly DEDUP_WINDOW_MS = 30 * 60 * 1000  // 30 daqiqa

  async report(incident: Incident) {
    const key = `${incident.category}:${incident.title}`
    const last = this.recentIncidents.get(key)
    if (last && Date.now() - last < this.DEDUP_WINDOW_MS) {
      return // dedup — 30 daq ichida bir xil incident'ni qayta yubormaymiz
    }
    this.recentIncidents.set(key, Date.now())

    // Console log (har doim)
    const logFn = incident.severity === 'CRITICAL' || incident.severity === 'ERROR'
      ? 'error' : 'warn'
    this.logger[logFn](`[${incident.severity}] ${incident.category}: ${incident.title} — ${incident.message}`)

    // Faqat ERROR va CRITICAL email yuboriladi
    if (incident.severity === 'ERROR' || incident.severity === 'CRITICAL') {
      await this.sendEmail(incident).catch(err =>
        this.logger.warn(`Email yuborishda xato: ${err?.message}`)
      )
    }
  }

  private async sendEmail(incident: Incident) {
    if (process.env.NODE_ENV !== 'production' || !process.env.RESEND_API_KEY) {
      return // Dev'da email yubormaymiz
    }

    const sevConfig = {
      INFO:     { color: '#2563EB', icon: 'ℹ️',  label: 'Info' },
      WARNING:  { color: '#D97706', icon: '⚠️',  label: 'Ogohlantirish' },
      ERROR:    { color: '#DC2626', icon: '❌',  label: 'Xato' },
      CRITICAL: { color: '#991B1B', icon: '🔥',  label: 'KRITIK' },
    }[incident.severity]

    const detailsHtml = incident.details
      ? `<pre style="background:#F1F5F9;padding:12px;border-radius:8px;font-size:12px;overflow-x:auto">${
          this.escapeHtml(JSON.stringify(incident.details, null, 2))
        }</pre>`
      : ''

    await this.resend.emails.send({
      from:    FROM_EMAIL,
      to:      ADMIN_EMAIL,
      subject: `${sevConfig.icon} [${sevConfig.label}] ${incident.title}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,sans-serif;background:#F8FAFC;padding:30px 16px">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:${sevConfig.color};color:#fff;padding:20px 24px">
      <div style="font-size:20px;font-weight:bold">${sevConfig.icon} ${sevConfig.label}</div>
      <div style="font-size:13px;opacity:.9;margin-top:4px">${incident.category.toUpperCase()}</div>
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;color:#0F172A">${this.escapeHtml(incident.title)}</h2>
      <p style="color:#475569;line-height:1.6;margin:0 0 16px">${this.escapeHtml(incident.message)}</p>
      ${detailsHtml}
      <p style="font-size:12px;color:#94A3B8;margin-top:20px">
        Vaqt: ${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })} (Toshkent)<br/>
        Server: ${process.env.NODE_ENV || 'unknown'}<br/>
        Hostname: ${process.env.HOSTNAME || 'localhost'}
      </p>
    </div>
  </div>
</body></html>`,
    })
  }

  private escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]!))
  }

  // Eski incidentlarni tozalash — har soatda
  cleanup() {
    const now = Date.now()
    for (const [key, ts] of this.recentIncidents.entries()) {
      if (now - ts > this.DEDUP_WINDOW_MS) this.recentIncidents.delete(key)
    }
  }
}
