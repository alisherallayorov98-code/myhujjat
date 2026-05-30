import {
  Controller, Post, Get, Body, UsePipes,
  Req, Res, HttpCode, HttpStatus,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { Request, Response } from 'express'
import { AuthService }       from './auth.service'
import { EimzoService }      from './e-imzo.service'
import { Public }            from '../../common/decorators/public.decorator'
import { CurrentUser }       from '../../common/decorators/current-user.decorator'
import { ZodValidationPipe } from '../../common/validation/zod.pipe'
import {
  RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema,
} from '../../common/validation/schemas'

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly eimzoService: EimzoService
  ) {}

  @Public()
  @Get('e-imzo/challenge')
  getEimzoChallenge() {
    return this.eimzoService.generateChallenge();
  }

  @Public()
  @Post('e-imzo/login')
  @HttpCode(HttpStatus.OK)
  async eimzoLogin(@Body() body: { pkcs7: string; challengeId: string }, @Req() req: Request, @Res() res: Response) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const data = this.eimzoService.parsePkcs7(body.pkcs7, body.challengeId);
    
    const tokens = await this.authService.eimzoLogin({
      pinfl: data.pinfl,
      inn: data.inn,
      cn: data.cn,
      ip
    });

    res.cookie('refresh_token', tokens.refreshToken, {
      httpOnly: true,
      secure:   process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
      path:     '/api/v1/auth',
    });

    return res.json({ accessToken: tokens.accessToken, user: tokens.user });
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 5 } })
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  register(@Body() body: {
    email: string; password: string
    firstName?: string; lastName?: string
  }) {
    return this.authService.register(body)
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 5 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(
    @Body() body: { email: string; password: string; code?: string },
    @Req()  req:  Request,
    @Res()  res:  Response,
  ) {
    const ip   = req.ip || req.socket.remoteAddress
    const data = await this.authService.login({ ...body, ip })

    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure:   process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
      path:     '/api/v1/auth',
    })

    return res.json({ accessToken: data.accessToken, user: data.user })
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token
    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token topilmadi' })
    }

    const data = await this.authService.refresh(refreshToken)

    res.cookie('refresh_token', data.refreshToken, {
      httpOnly: true,
      secure:   process.env.COOKIE_SECURE !== 'false' && process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge:   7 * 24 * 60 * 60 * 1000,
      path:     '/api/v1/auth',
    })

    return res.json({ accessToken: data.accessToken, user: data.user })
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies?.refresh_token
    await this.authService.logout(refreshToken)
    res.clearCookie('refresh_token', { path: '/api/v1/auth' })
    return res.json({ message: 'Muvaffaqiyatli chiqildi' })
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 3 } })
  @Post('forgot-password')
  @UsePipes(new ZodValidationPipe(ForgotPasswordSchema))
  forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email)
  }

  @Public()
  @Throttle({ medium: { ttl: 60_000, limit: 3 } })
  @Post('reset-password')
  @UsePipes(new ZodValidationPipe(ResetPasswordSchema))
  resetPassword(@Body() body: { token: string; password: string }) {
    return this.authService.resetPassword(body.token, body.password)
  }

  @Public()
  @Get('verify-email')
  verifyEmail(@Req() req: Request) {
    const token = req.query.token as string
    return this.authService.verifyEmail(token)
  }

  @Get('me')
  getMe(@CurrentUser() user: any) {
    return this.authService.getMe(user.sub)
  }
}
