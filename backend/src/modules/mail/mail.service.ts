import { Injectable, Logger } from '@nestjs/common'
import { Resend }              from 'resend'

const FROM     = process.env.MAIL_FROM     || 'MyHujjat.uz <noreply@myhujjat.uz>'
const BASE_URL = process.env.FRONTEND_URL  || 'https://myhujjat.uz'

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
  async sendVerification(to: string, firstName: string, token: string) {
    const url = `${BASE_URL}/auth/verify-email?token=${token}`
    return this.send(to, 'MyHujjat.uz — Email tasdiqlash', `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.1)}
  .h{background:#2563EB;padding:32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:900;letter-spacing:-.5px}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px}
  .btn{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
  .f{padding:20px 32px;border-top:1px solid #E2E8F0;text-align:center}
  .f p{color:#94A3B8;font-size:12px;margin:0}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>Emailingizni tasdiqlang</h1>
    <p>Salom, <strong>${firstName || to}</strong>! MyHujjat.uz ga ro'yxatdan o'tganingiz uchun rahmat. Hisobingizni faollashtirish uchun quyidagi tugmani bosing.</p>
    <a href="${url}" class="btn">Email tasdiqlash</a>
    <p style="margin-top:20px;font-size:12px;color:#94A3B8">Bu havola 24 soat amal qiladi. Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xatni e'tiborsiz qoldiring.</p>
  </div>
  <div class="f"><p>&copy; ${new Date().getFullYear()} MyHujjat.uz — O'zbekiston uchun hujjat platformasi</p></div>
</div>
</body></html>`)
  }

  // ─── Parol tiklash ───────────────────────────────────────────────────────
  async sendPasswordReset(to: string, firstName: string, token: string) {
    const url = `${BASE_URL}/auth/reset-password?token=${token}`
    return this.send(to, 'MyHujjat.uz — Parol tiklash', `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .h{background:#DC2626;padding:32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:900}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 20px}
  .btn{display:inline-block;background:#DC2626;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
  .warn{background:#FEF3C7;border-left:3px solid #D97706;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#92400E}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>Parolni tiklash</h1>
    <p>Salom, <strong>${firstName || to}</strong>! Parolni tiklash so'rovi qabul qilindi.</p>
    <a href="${url}" class="btn">Parolni tiklash</a>
    <p style="margin-top:20px"></p>
    <div class="warn">⚠️ Bu havola <strong>1 soat</strong> amal qiladi. Agar siz so'rov yubormagan bo'lsangiz, hisobingiz xavfsiz.</div>
  </div>
</div>
</body></html>`)
  }

  // ─── Xush kelibsiz ───────────────────────────────────────────────────────
  async sendWelcome(to: string, firstName: string) {
    return this.send(to, `Xush kelibsiz, ${firstName || ''}! MyHujjat.uz`, `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .h{background:linear-gradient(135deg,#2563EB,#7C3AED);padding:40px 32px;text-align:center}
  .logo{color:#fff;font-size:28px;font-weight:900}
  .tag{color:rgba(255,255,255,.8);font-size:13px;margin-top:4px}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px}
  .feat{display:flex;gap:12px;margin-bottom:12px;align-items:flex-start}
  .fi{font-size:20px}
  .ft strong{display:block;font-size:13px;color:#0F172A}
  .ft span{color:#94A3B8;font-size:12px}
  .btn{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div><div class="tag">O'zbekiston uchun hujjat platformasi</div></div>
  <div class="b">
    <h1>Xush kelibsiz, ${firstName || ''}!</h1>
    <p>MyHujjat.uz da hisobingiz muvaffaqiyatli yaratildi. Biz sizga O'zbekiston qonunchiligiga mos professional hujjatlarni yaratishda yordam beramiz.</p>
    <div class="feat"><div class="fi">📄</div><div class="ft"><strong>12 tur shartnoma shabloni</strong><span>Oldi-sotdi, xizmat, ijara va boshqalar</span></div></div>
    <div class="feat"><div class="fi">🤖</div><div class="ft"><strong>AI hujjat generatsiyasi</strong><span>Claude AI bilan professional hujjatlar</span></div></div>
    <div class="feat"><div class="fi">✍️</div><div class="ft"><strong>E-imzo integratsiyasi</strong><span>Elektron imzo bilan shartnomalarni tasdiqlang</span></div></div>
    <br>
    <a href="${BASE_URL}/dashboard" class="btn">Boshlash →</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Obuna faollashtirildi ────────────────────────────────────────────────
  async sendSubscriptionActivated(to: string, firstName: string, plan: string, expiresAt: Date) {
    const planNames: Record<string, string> = { STANDARD: 'Standart', PRO: 'Pro', DEMO: 'Demo (7 kun)' }
    const planLabel = planNames[plan] || plan
    return this.send(to, `MyHujjat.uz — ${planLabel} obunasi faollashtirildi`, `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .h{background:#16A34A;padding:32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:900}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px}
  .badge{display:inline-block;background:#DCFCE7;color:#16A34A;padding:6px 16px;border-radius:100px;font-weight:700;font-size:16px;margin-bottom:16px}
  .info{background:#F0FDF4;border:1px solid #BBF7D0;border-radius:8px;padding:16px;font-size:13px;color:#15803D}
  .btn{display:inline-block;background:#16A34A;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>Obuna faollashtirildi ✓</h1>
    <p>Salom, <strong>${firstName}</strong>!</p>
    <div class="badge">${planLabel} rejasi</div>
    <p>Obunangiz muvaffaqiyatli faollashtirildi.</p>
    <div class="info">📅 Muddat: <strong>${expiresAt.toLocaleDateString('uz-UZ')}</strong></div>
    <br><a href="${BASE_URL}/dashboard" class="btn">Dashboardga o'tish →</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Obuna tugash eslatmasi ───────────────────────────────────────────────
  async sendSubscriptionExpiring(to: string, firstName: string, daysLeft: number) {
    return this.send(to, `MyHujjat.uz — Obunangiz ${daysLeft} kundan keyin tugaydi`, `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .h{background:#D97706;padding:32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:900}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px}
  .warn{background:#FEF3C7;border:1px solid #FDE68A;border-radius:8px;padding:16px;font-size:14px;color:#92400E;margin-bottom:20px}
  .btn{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>Obuna eslatmasi ⏰</h1>
    <p>Salom, <strong>${firstName}</strong>!</p>
    <div class="warn">⚠️ Obunangiz <strong>${daysLeft} kun</strong> ichida tugaydi. Uzluksiz foydalanish uchun obunangizni yangilang.</div>
    <p>Obuna tugagandan so'ng Pro va Standart imkoniyatlar cheklanadi.</p>
    <a href="${BASE_URL}/dashboard/sozlamalar/obuna" class="btn">Obunani yangilash →</a>
  </div>
</div>
</body></html>`)
  }

  // ─── Shartnoma limit ogohlantirish ───────────────────────────────────────
  async sendContractLimitWarning(to: string, firstName: string, used: number, total: number) {
    const pct = Math.min(100, Math.round((used / total) * 100))
    return this.send(to, 'MyHujjat.uz — Shartnoma limitiga yaqin', `
<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
  body{font-family:-apple-system,sans-serif;background:#F8FAFC;margin:0;padding:40px 16px}
  .c{max-width:500px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden}
  .h{background:#0F172A;padding:32px;text-align:center}
  .logo{color:#fff;font-size:24px;font-weight:900}
  .b{padding:32px}
  h1{color:#0F172A;font-size:20px;margin:0 0 12px}
  p{color:#475569;font-size:14px;line-height:1.6;margin:0 0 16px}
  .pw{background:#E2E8F0;border-radius:100px;height:10px;overflow:hidden;margin:12px 0}
  .pb{height:100%;background:#DC2626;border-radius:100px;width:${pct}%}
  .stats{display:flex;justify-content:space-between;font-size:12px;color:#94A3B8}
  .btn{display:inline-block;background:#2563EB;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px}
</style></head><body>
<div class="c">
  <div class="h"><div class="logo">MyHujjat.uz</div></div>
  <div class="b">
    <h1>Shartnoma limiti</h1>
    <p>Salom, <strong>${firstName}</strong>! Bu oy shartnoma limitingizga yaqin qoldingiz.</p>
    <div class="pw"><div class="pb"></div></div>
    <div class="stats"><span>${used} ta ishlatilgan</span><span>${total} ta jami</span></div>
    <br>
    <p>Limit tugagandan so'ng yangi shartnoma yarata olmaysiz.</p>
    <a href="${BASE_URL}/dashboard/sozlamalar/obuna" class="btn">Obunani yangilash →</a>
  </div>
</div>
</body></html>`)
  }
}
