import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { Bot, Context, GrammyError, HttpError } from 'grammy'
import { PrismaService }       from '../prisma/prisma.service'
import { ContractsService }    from '../contracts/contracts.service'
import { StirService }         from '../stir/stir.service'
import { CounterpartiesService } from '../counterparties/cp.service'
import { randomBytes }         from 'crypto'

const TELEGRAM_TOKEN = process.env.TELEGRAM_BOT_TOKEN

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name)
  private bot: Bot | null = null

  constructor(
    private prisma: PrismaService,
    private contracts: ContractsService,
    private stir: StirService,
    private cps: CounterpartiesService,
  ) {}

  onModuleInit() {
    if (!TELEGRAM_TOKEN) {
      this.logger.warn('TELEGRAM_BOT_TOKEN topilmadi — bot ishlamaydi (tayyor, kalit kutyapti)')
      return
    }
    this.bot = new Bot(TELEGRAM_TOKEN)
    this.registerCommands()
    this.bot.start({ onStart: () => this.logger.log('🤖 Telegram bot ishga tushdi') })
      .catch(err => this.logger.error(`Bot xato: ${err?.message}`))
  }

  // ─── PRIVATE: account uchun link kod yaratish ─────────────
  async generateLinkCode(userId: string): Promise<string> {
    const code = randomBytes(3).toString('hex').toUpperCase() // masalan "AB12CD"
    await this.prisma.user.update({
      where: { id: userId },
      data:  { telegramLinkCode: code },
    })
    return code
  }

  async getStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where:  { id: userId },
      select: { telegramId: true, telegramLinkCode: true },
    })
    return {
      linked:    !!user?.telegramId,
      linkCode:  user?.telegramLinkCode || null,
    }
  }

  async unlink(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data:  { telegramId: null, telegramLinkCode: null },
    })
    return { success: true }
  }

  // ─── Bot komandalari ──────────────────────────────────────
  private registerCommands() {
    if (!this.bot) return

    // /start — salom
    this.bot.command('start', async ctx => {
      await ctx.reply(
        `👋 Salom! Men <b>MyHujjat AI</b> botiman.\n\n` +
        `Sizning hisobingizni ulash uchun:\n` +
        `1. Saytga kiring → Sozlamalar → Telegram\n` +
        `2. Ulash kodini oling (masalan AB12CD)\n` +
        `3. Bu yerga yuboring: <code>/link AB12CD</code>\n\n` +
        `Buyruqlar ro'yxati: /yordam`,
        { parse_mode: 'HTML' }
      )
    })

    // /link CODE — accountni ulash
    this.bot.command('link', async ctx => {
      const tgId = ctx.from?.id?.toString()
      const code = ctx.match?.toString().trim().toUpperCase()
      if (!tgId) return
      if (!code) {
        await ctx.reply("Ulash kodini kiriting: <code>/link AB12CD</code>", { parse_mode: 'HTML' })
        return
      }

      const user = await this.prisma.user.findFirst({
        where: { telegramLinkCode: code },
      })
      if (!user) {
        await ctx.reply("❌ Kod topilmadi. Saytdan yangi kod oling.")
        return
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data:  { telegramId: tgId, telegramLinkCode: null },
      })
      await ctx.reply(
        `✅ Hisob ulandi!\n\n` +
        `Salom, <b>${user.firstName || user.email}</b>! Endi siz Telegram orqali shartnomalar yarata olasiz.\n\n` +
        `/yordam — buyruqlar`,
        { parse_mode: 'HTML' }
      )
    })

    // /unlink — uzish
    this.bot.command('unlink', async ctx => {
      const tgId = ctx.from?.id?.toString()
      if (!tgId) return
      await this.prisma.user.updateMany({
        where: { telegramId: tgId },
        data:  { telegramId: null },
      })
      await ctx.reply("✅ Telegram hisob uzildi.")
    })

    // /yordam — komandalar ro'yxati
    this.bot.command('yordam', async ctx => {
      await ctx.reply(
        `<b>📋 MyHujjat bot komandalari:</b>\n\n` +
        `/start — boshlash\n` +
        `/link AB12CD — hisobni ulash\n` +
        `/statistika — bu oygi raqamlar\n` +
        `/royxat — so'nggi 5 ta shartnoma\n` +
        `/stir 302756789 — STIR qidirish\n` +
        `/yangi — yangi shartnoma yaratish\n` +
        `/unlink — Telegram'ni uzish\n\n` +
        `🌐 Sayt: https://myhujjat.uz`,
        { parse_mode: 'HTML' }
      )
    })

    // /statistika — bu oy statistikasi
    this.bot.command('statistika', async ctx => {
      const user = await this.findUserByCtx(ctx)
      if (!user) return
      const org = await this.getDefaultOrg(user.id)
      if (!org) {
        await ctx.reply("❌ Avval saytda tashkilot qo'shing.")
        return
      }
      const stats = await this.contracts.getStats(org.id)
      const cpCount = await this.prisma.counterparty.count({
        where: { organizationId: org.id, isActive: true },
      })
      await ctx.reply(
        `📊 <b>${org.name}</b> — statistika\n\n` +
        `📄 Shartnomalar: <b>${stats.total}</b>\n` +
        `   ✓ Faol: ${stats.active}\n` +
        `   📝 Qoralama: ${stats.draft}\n` +
        `   ✅ Tugagan: ${stats.completed}\n\n` +
        `🤝 Kontragentlar: <b>${cpCount}</b>`,
        { parse_mode: 'HTML' }
      )
    })

    // /royxat — so'nggi shartnomalar
    this.bot.command('royxat', async ctx => {
      const user = await this.findUserByCtx(ctx)
      if (!user) return
      const org = await this.getDefaultOrg(user.id)
      if (!org) {
        await ctx.reply("❌ Avval saytda tashkilot qo'shing.")
        return
      }
      const result = await this.contracts.findAll(org.id, { limit: 5 })
      if (result.data.length === 0) {
        await ctx.reply("📭 Shartnomalar yo'q.\n\nYaratish: <code>/yangi</code>", { parse_mode: 'HTML' })
        return
      }
      const lines = result.data.map((c: any, i: number) =>
        `${i + 1}. <b>${c.contractNumber}</b>\n   ${c.counterparty?.name || 'Kontragent yo\'q'} · ${Number(c.amount).toLocaleString('uz-UZ')} so'm`
      )
      await ctx.reply(`📋 <b>So'nggi ${result.data.length} ta shartnoma:</b>\n\n${lines.join('\n\n')}`, { parse_mode: 'HTML' })
    })

    // /stir 302756789 — STIR qidirish
    this.bot.command('stir', async ctx => {
      const user = await this.findUserByCtx(ctx)
      if (!user) return
      const inn = ctx.match?.toString().trim().replace(/\D/g, '').slice(0, 9)
      if (!inn || inn.length !== 9) {
        await ctx.reply("STIR formati: <code>/stir 302756789</code> (9 raqam)", { parse_mode: 'HTML' })
        return
      }
      try {
        const data = await this.stir.getCompanyByInn(inn, user.id)
        await ctx.reply(
          `🏢 <b>${data.name}</b>\n\n` +
          `STIR: <code>${inn}</code>\n` +
          `${data.directorName ? `👤 Rahbar: ${data.directorName}\n` : ''}` +
          `${data.address ? `📍 ${data.address}\n` : ''}` +
          `📊 Holat: ${data.status === 'active' ? '✅ Faol' : '⚠️ ' + (data.statusText || 'Faol emas')}`,
          { parse_mode: 'HTML' }
        )
      } catch (err: any) {
        await ctx.reply(`❌ ${err?.message || 'STIR topilmadi'}`)
      }
    })

    // /yangi — saytga yo'naltirish (mini app uchun keyinroq)
    this.bot.command('yangi', async ctx => {
      const user = await this.findUserByCtx(ctx)
      if (!user) return
      await ctx.reply(
        `📝 Yangi shartnoma yaratish:\n\n` +
        `🌐 Sayt orqali: https://myhujjat.uz/dashboard/shartnomalar/yangi\n\n` +
        `Yoki ovozli AI Mira'dan foydalaning — saytda gradient sehr tugmasini bosing.`
      )
    })

    // Xato tutish
    this.bot.catch(err => {
      const ctx = err.ctx
      this.logger.error(`Update ${ctx.update.update_id} bilan xato:`, err.error)
      const e = err.error
      if (e instanceof GrammyError) {
        this.logger.error('Telegram API xato:', e.description)
      } else if (e instanceof HttpError) {
        this.logger.error('Telegram bilan aloqa xato:', e)
      }
    })
  }

  // ─── Helper'lar ───────────────────────────────────────────
  private async findUserByCtx(ctx: Context) {
    const tgId = ctx.from?.id?.toString()
    if (!tgId) return null
    const user = await this.prisma.user.findUnique({
      where: { telegramId: tgId },
    })
    if (!user) {
      await ctx.reply(
        "❌ Hisobingiz Telegram'ga ulanmagan.\n\n" +
        "1. Saytga kiring: https://myhujjat.uz\n" +
        "2. Sozlamalar → Telegram → Kod oling\n" +
        "3. Bu yerga: <code>/link KOD</code>",
        { parse_mode: 'HTML' }
      )
      return null
    }
    return user
  }

  private async getDefaultOrg(userId: string) {
    const def = await this.prisma.organization.findFirst({
      where: { userId, isDefault: true },
    })
    if (def) return def
    return this.prisma.organization.findFirst({ where: { userId } })
  }
}
