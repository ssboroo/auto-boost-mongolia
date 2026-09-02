import { Body, Controller, Get, Headers, Param, Post, Query } from '@nestjs/common'
import { MetaService } from './meta.service'

@Controller('meta')
export class MetaController {
  constructor(private readonly meta: MetaService) {}

  private token(authorization?: string) {
    if (!authorization) return ''
    return authorization.replace(/^Bearer\s+/i, '').trim()
  }

  @Get('status')
  status() {
    return this.meta.getStatus()
  }

  @Get('auth/url')
  authUrl(@Query('state') state?: string) {
    return this.meta.getLoginUrl(state)
  }

  @Get('auth/callback')
  callback(@Query('code') code: string) {
    return this.meta.exchangeCode(code)
  }

  @Get('me')
  me(@Headers('authorization') auth?: string) {
    return this.meta.getMe(this.token(auth))
  }

  @Get('pages')
  pages(@Headers('authorization') auth?: string) {
    return this.meta.getPages(this.token(auth))
  }

  @Get('ad-accounts')
  adAccounts(@Headers('authorization') auth?: string) {
    return this.meta.getAdAccounts(this.token(auth))
  }

  @Get('pages/:pageId/posts')
  posts(
    @Param('pageId') pageId: string,
    @Headers('x-page-access-token') pageAccessToken?: string,
  ) {
    return this.meta.getPagePosts(pageId, pageAccessToken || '')
  }

  @Get('ad-accounts/:adAccountId/campaigns')
  campaigns(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth?: string,
  ) {
    return this.meta.getCampaigns(adAccountId, this.token(auth))
  }

  @Post('ad-accounts/:adAccountId/campaigns')
  createCampaign(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    return this.meta.createCampaign(adAccountId, this.token(auth), body)
  }

  @Post('ad-accounts/:adAccountId/adsets')
  createAdSet(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    return this.meta.createAdSet(adAccountId, this.token(auth), body)
  }

  @Post('ad-accounts/:adAccountId/creatives/existing-post')
  createCreative(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    return this.meta.createExistingPostCreative(adAccountId, this.token(auth), body)
  }

  @Post('ad-accounts/:adAccountId/ads')
  createAd(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Body() body: any,
  ) {
    return this.meta.createAd(adAccountId, this.token(auth), body)
  }

  @Post('objects/:objectId/status')
  updateStatus(
    @Param('objectId') objectId: string,
    @Headers('authorization') auth: string,
    @Body() body: { status: 'ACTIVE' | 'PAUSED' },
  ) {
    return this.meta.updateStatus(objectId, this.token(auth), body.status)
  }

  @Get('ad-accounts/:adAccountId/insights')
  insights(
    @Param('adAccountId') adAccountId: string,
    @Headers('authorization') auth: string,
    @Query('date_preset') datePreset = 'last_7d',
    @Query('level') level = 'campaign',
  ) {
    return this.meta.getInsights(adAccountId, this.token(auth), datePreset, level)
  }
}
