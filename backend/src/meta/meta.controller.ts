import { Body, Controller, Get, Param, Post, Query, Req, Res, UnauthorizedException } from '@nestjs/common'
import { randomBytes, timingSafeEqual } from 'crypto'
import { MetaService } from './meta.service'
import { TenantService } from './tenant.service'

@Controller('meta')
export class MetaController {
  private readonly stateCookie = 'ab_meta_oauth_state'

  constructor(
    private readonly meta: MetaService,
    private readonly tenant: TenantService,
  ) {}

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

  @Get('status')
  status() {
    return {
      ...this.meta.getStatus(),
      tenantStorageConfigured: true,
      authProvider: 'supabase',
    }
  }

  @Get('session')
  async session(@Req() req: any) {
    try {
      const { context, connection, metaToken } = await this.tenant.getConnection(req)
      if (!connection || !metaToken) return { connected: false, workspaceId: context.workspaceId }
      return {
        connected: true,
        workspaceId: context.workspaceId,
        profile: {
          id: connection.meta_user_id,
          name: connection.meta_user_name,
        },
        tokenExpiresAt: connection.token_expires_at,
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) return { connected: false }
      throw error
    }
  }

  @Get('auth/url')
  async authUrl(@Req() req: any, @Res({ passthrough: true }) res: any) {
    const appToken = this.tenant.getAppToken(req)
    const user = await this.tenant.requireUserByToken(appToken)
    const state = randomBytes(24).toString('base64url')
    const payload = this.tenant.encrypt(JSON.stringify({ state, appToken, userId: user.id, createdAt: Date.now() }))
    res.cookie(this.stateCookie, payload, this.cookieOptions(10 * 60 * 1000))
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

    const encryptedState = this.getCookie(req, this.stateCookie)
    let stored: any = null
    try { stored = JSON.parse(this.tenant.decrypt(encryptedState)) } catch {}

    const expected = String(stored?.state || '')
    const actual = String(state || '')
    const fresh = Number(stored?.createdAt || 0) > Date.now() - 10 * 60 * 1000
    const validState = Boolean(
      fresh && expected && actual && expected.length === actual.length && timingSafeEqual(Buffer.from(expected), Buffer.from(actual)),
    )

    if (!validState || !stored?.appToken || !stored?.userId) {
      res.clearCookie(this.stateCookie, this.cookieOptions())
      return res.redirect(`${frontend}/facebook?error=${encodeURIComponent('OAuth state шалгалт амжилтгүй боллоо. Дахин холбоно уу.')}`)
    }

    try {
      const user = await this.tenant.requireUserByToken(stored.appToken)
      if (user.id !== stored.userId) throw new UnauthorizedException('Хэрэглэгчийн session өөрчлөгдсөн байна.')

      const tokenResult = await this.meta.exchangeCode(code || '')
      const metaToken = tokenResult?.access_token
      if (!metaToken) throw new UnauthorizedException('Meta access token олдсонгүй.')

      const profile = await this.meta.getMe(metaToken)
      await this.tenant.saveConnection(stored.appToken, user, metaToken, profile, tokenResult?.expires_in)
      res.clearCookie(this.stateCookie, this.cookieOptions())
      return res.redirect(`${frontend}/facebook?connected=1`)
    } catch (callbackError: any) {
      res.clearCookie(this.stateCookie, this.cookieOptions())
      return res.redirect(`${frontend}/facebook?error=${encodeURIComponent(callbackError?.message || 'Facebook OAuth холболт амжилтгүй боллоо.')}`)
    }
  }

  @Post('logout')
  async logout(@Req() req: any, @Res({ passthrough: true }) res: any) {
    res.clearCookie(this.stateCookie, this.cookieOptions())
    return this.tenant.disconnect(req)
  }

  @Get('me')
  async me(@Req() req: any) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getMe(metaToken)
  }

  @Get('pages')
  async pages(@Req() req: any) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getPages(metaToken)
  }

  @Get('ad-accounts')
  async adAccounts(@Req() req: any) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getAdAccounts(metaToken)
  }

  @Get('pages/:pageId/posts')
  async posts(@Req() req: any, @Param('pageId') pageId: string) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getPagePosts(pageId, metaToken)
  }

  @Get('ad-accounts/:adAccountId/campaigns')
  async campaigns(@Req() req: any, @Param('adAccountId') adAccountId: string) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getCampaigns(adAccountId, metaToken)
  }

  @Post('ad-accounts/:adAccountId/campaigns')
  async createCampaign(@Req() req: any, @Param('adAccountId') adAccountId: string, @Body() body: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const result = await this.meta.createCampaign(adAccountId, metaToken, body)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.campaign.created', 'campaign', result?.id || null, { adAccountId, name: body?.name, status: 'PAUSED' })
    return result
  }

  @Post('ad-accounts/:adAccountId/adsets')
  async createAdSet(@Req() req: any, @Param('adAccountId') adAccountId: string, @Body() body: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const result = await this.meta.createAdSet(adAccountId, metaToken, body)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.adset.created', 'adset', result?.id || null, { adAccountId, campaignId: body?.campaignId, status: 'PAUSED' })
    return result
  }

  @Post('ad-accounts/:adAccountId/creatives/existing-post')
  async createCreative(@Req() req: any, @Param('adAccountId') adAccountId: string, @Body() body: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const result = await this.meta.createExistingPostCreative(adAccountId, metaToken, body)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.creative.created', 'creative', result?.id || null, { adAccountId, objectStoryId: body?.objectStoryId })
    return result
  }

  @Post('ad-accounts/:adAccountId/ads')
  async createAd(@Req() req: any, @Param('adAccountId') adAccountId: string, @Body() body: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const result = await this.meta.createAd(adAccountId, metaToken, body)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.ad.created', 'ad', result?.id || null, { adAccountId, adSetId: body?.adSetId, status: 'PAUSED' })
    return result
  }

  @Post('objects/:objectId/status')
  async updateStatus(@Req() req: any, @Param('objectId') objectId: string, @Body() body: { status: 'ACTIVE' | 'PAUSED' }) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const result = await this.meta.updateStatus(objectId, metaToken, body.status)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'meta.status.updated', 'meta_object', objectId, { status: body.status })
    return result
  }

  @Get('ad-accounts/:adAccountId/insights')
  async insights(
    @Req() req: any,
    @Param('adAccountId') adAccountId: string,
    @Query('date_preset') datePreset = 'last_7d',
    @Query('level') level = 'campaign',
  ) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    return this.meta.getInsights(adAccountId, metaToken, datePreset, level)
  }
}
