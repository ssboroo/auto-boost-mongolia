import { Body, Controller, Get, Headers, Param, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'crypto'
import { MetaService } from './meta.service'

@Controller('meta')
export class MetaController {
  private readonly tokenCookie = 'ab_meta_session'
  private readonly stateCookie = 'ab_meta_oauth_state'

  constructor(private readonly meta: MetaService) {}

  private getCookie(req: any, name: string) {
    const header = String(req?.headers?.cookie || '')
    const part = header.split(';').map((value) => value.trim()).find((value) => value.startsWith(`${name}=`))
    return part ? decodeURIComponent(part.slice(name.length + 1)) : ''
  }

  private cookieOptions(maxAge?: number) {
    const production = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL)
    return {
      httpOnly: true,
      secure: production,
      sameSite: 'lax' as const,
      path: '/',
      ...(maxAge ? { maxAge } : {}),
    }
  }

  private key() {
    const secret = process.env.SESSION_SECRET || ''
    if (!secret) throw new UnauthorizedException('SESSION_SECRET тохируулаагүй байна.')
    return createHash('sha256').update(secret).digest()
  }

  private encrypt(value: string) {
    const iv = randomBytes(12)
    const cipher = createCipheriv('aes-256-gcm', this.key(), iv)
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    return Buffer.concat([iv, tag, encrypted]).toString('base64url')
  }

  private decrypt(value: string) {
    if (!value) return ''
    try {
      const payload = Buffer.from(value, 'base64url')
      const iv = payload.subarray(0, 12)
      const tag = payload.subarray(12, 28)
      const encrypted = payload.subarray(28)
      const decipher = createDecipheriv('aes-256-gcm', this.key(), iv)
      decipher.setAuthTag(tag)
      return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
    } catch {
      return ''
    }
  }

  private bearer(authorization?: string) {
    if (!authorization) return ''
    return authorization.replace(/^Bearer\s+/i, '').trim()
  }

  private accessToken(req: any, authorization?: string) {
    const bearer = this.bearer(authorization)
    if (bearer) return bearer
    const token = this.decrypt(this.getCookie(req, this.tokenCookie))
    if (!token) throw new UnauthorizedException('Facebook холболт хийгдээгүй эсвэл session дууссан байна.')
    return token
  }

  @Get('status')
  status() {
    return this.meta.getStatus()
  }

  @Get('session')
  async session(@Req() req: any) {
    const encrypted = this.getCookie(req, this.tokenCookie)
    const token = this.decrypt(encrypted)
    if (!token) return { connected: false }
    try {
      const profile = await this.meta.getMe(token)
      return { connected: true, profile }
    } catch {
      return { connected: false }
    }
  }

  @Get('auth/url')
  authUrl(@Res({ passthrough: true }) res: any) {
    const state = randomBytes(24).toString('base64url')
    res.cookie(this.stateCookie, state, this.cookieOptions(10 * 60 * 1000))
    return this.meta.getLoginUrl(state)
  }

  @Get('auth/callback')
  async callback(
    @Req() req: any,
    @Res() res: any,
    @Query('code') code?: string,
    @Query('state') state?: string,
    @Query('error') error?: string,
    @Query('error_description') errorDescription?: string,
  ) {
    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'

    if (error) {
      return res.redirect(`${frontend}/facebook?error=${encodeURIComponent(errorDescription || error)}`)
    }

    const expected = this.getCookie(req, this.stateCookie)
    const validState = Boolean(
      expected && state && expected.length === state.length && timingSafeEqual(Buffer.from(expected), Buffer.from(state)),
    )
    if (!validState) {
      return res.redirect(`${frontend}/facebook?error=${encodeURIComponent('OAuth state шалгалт амжилтгүй боллоо.')}`)
    }

    const tokenResult = await this.meta.exchangeCode(code || '')
    const token = tokenResult?.access_token
    if (!token) return res.redirect(`${frontend}/facebook?error=${encodeURIComponent('Meta access token олдсонгүй.')}`)

    res.cookie(this.tokenCookie, this.encrypt(token), this.cookieOptions(50 * 24 * 60 * 60 * 1000))
    res.clearCookie(this.stateCookie, this.cookieOptions())
    return res.redirect(`${frontend}/facebook?connected=1`)
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: any) {
    res.clearCookie(this.tokenCookie, this.cookieOptions())
    res.clearCookie(this.stateCookie, this.cookieOptions())
    return { ok: true }
  }

  @Get('me')
  me(@Req() req: any, @Headers('authorization') auth?: string) {
    return this.meta.getMe(this.accessToken(req, auth))
  }

  @Get('pages')
  pages(@Req() req: any, @Headers('authorization') auth?: string) {
    return this.meta.getPages(this.accessToken(req, auth))
  }

  @Get('ad-accounts')
  adAccounts(@Req() req: any, @Headers('authorization') auth?: string) {
    return this.meta.getAdAccounts(this.accessToken(req, auth))
  }

  @Get('pages/:pageId/posts')
  posts(@Req() req: any, @Param('pageId') pageId: string, @Headers('authorization') auth?: string) {
    return this.meta.getPagePosts(pageId, this.accessToken(req, auth))
  }

  @Get('ad-accounts/:adAccountId/campaigns')
  campaigns(@Req() req: any, @Param('adAccountId') adAccountId: string, @Headers('authorization') auth?: string) {
    return this.meta.getCampaigns(adAccountId, this.accessToken(req, auth))
  }

  @Post('ad-accounts/:adAccountId/campaigns')
  createCampaign(@Req() req: any, @Param('adAccountId') adAccountId: string, @Headers('authorization') auth: string, @Body() body: any) {
    return this.meta.createCampaign(adAccountId, this.accessToken(req, auth), body)
  }

  @Post('ad-accounts/:adAccountId/adsets')
  createAdSet(@Req() req: any, @Param('adAccountId') adAccountId: string, @Headers('authorization') auth: string, @Body() body: any) {
    return this.meta.createAdSet(adAccountId, this.accessToken(req, auth), body)
  }

  @Post('ad-accounts/:adAccountId/creatives/existing-post')
  createCreative(@Req() req: any, @Param('adAccountId') adAccountId: string, @Headers('authorization') auth: string, @Body() body: any) {
    return this.meta.createExistingPostCreative(adAccountId, this.accessToken(req, auth), body)
  }

  @Post('ad-accounts/:adAccountId/ads')
  createAd(@Req() req: any, @Param('adAccountId') adAccountId: string, @Headers('authorization') auth: string, @Body() body: any) {
    return this.meta.createAd(adAccountId, this.accessToken(req, auth), body)
  }

  @Post('objects/:objectId/status')
  updateStatus(@Req() req: any, @Param('objectId') objectId: string, @Headers('authorization') auth: string, @Body() body: { status: 'ACTIVE' | 'PAUSED' }) {
    return this.meta.updateStatus(objectId, this.accessToken(req, auth), body.status)
  }

  @Get('ad-accounts/:adAccountId/insights')
  insights(
    @Req() req: any,
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Query('date_preset') datePreset = 'last_7d',
    @Query('level') level = 'campaign',
  ) {
    return this.meta.getInsights(adAccountId, this.accessToken(req, auth), datePreset, level)
  }
}
