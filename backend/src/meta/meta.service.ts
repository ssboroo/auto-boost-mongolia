import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class MetaService {
  private readonly appId = process.env.META_APP_ID || ''
  private readonly appSecret = process.env.META_APP_SECRET || ''
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v25.0'
  private readonly redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:4000/meta/auth/callback'
  private readonly graphBase = 'https://graph.facebook.com'

  private requireAppConfig() {
    if (!this.appId || !this.appSecret) {
      throw new BadRequestException('META_APP_ID болон META_APP_SECRET тохируулаагүй байна.')
    }
  }

  private async parseResponse(response: Response) {
    const text = await response.text()
    let data: any = text
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!response.ok || data?.error) {
      throw new BadGatewayException({
        message: 'Meta Graph API хүсэлт амжилтгүй боллоо.',
        status: response.status,
        details: data,
      })
    }
    return data
  }

  private async get(path: string, accessToken?: string, query: Record<string, string> = {}) {
    const params = new URLSearchParams(query)
    if (accessToken) params.set('access_token', accessToken)
    const url = `${this.graphBase}/${this.graphVersion}/${path}${params.size ? `?${params.toString()}` : ''}`
    return this.parseResponse(await fetch(url))
  }

  private async post(path: string, accessToken: string, body: Record<string, unknown>) {
    if (!accessToken) throw new BadRequestException('Meta access token шаардлагатай.')
    const params = new URLSearchParams()
    params.set('access_token', accessToken)
    Object.entries(body).forEach(([key, value]) => {
      if (value === undefined || value === null) return
      params.set(key, typeof value === 'string' ? value : JSON.stringify(value))
    })
    const url = `${this.graphBase}/${this.graphVersion}/${path}`
    return this.parseResponse(await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    }))
  }

  getStatus() {
    return {
      configured: Boolean(this.appId && this.appSecret),
      graphVersion: this.graphVersion,
      redirectUri: this.redirectUri,
      provider: 'meta-direct',
    }
  }

  getLoginUrl(state = 'auto-boost-mongolia') {
    if (!this.appId) throw new BadRequestException('META_APP_ID тохируулаагүй байна.')
    const scopes = [
      'ads_read',
      'ads_management',
      'business_management',
      'pages_show_list',
      'pages_read_engagement',
    ]
    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: this.redirectUri,
      state,
      response_type: 'code',
      scope: scopes.join(','),
    })
    return { url: `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}` }
  }

  async exchangeCode(code: string) {
    this.requireAppConfig()
    if (!code) throw new BadRequestException('OAuth code байхгүй байна.')
    const params = new URLSearchParams({
      client_id: this.appId,
      client_secret: this.appSecret,
      redirect_uri: this.redirectUri,
      code,
    })
    const response = await fetch(`${this.graphBase}/${this.graphVersion}/oauth/access_token?${params.toString()}`)
    return this.parseResponse(response)
  }

  getMe(accessToken: string) {
    return this.get('me', accessToken, { fields: 'id,name' })
  }

  getPages(accessToken: string) {
    return this.get('me/accounts', accessToken, {
      fields: 'id,name,category,tasks,access_token,picture',
      limit: '100',
    })
  }

  getAdAccounts(accessToken: string) {
    return this.get('me/adaccounts', accessToken, {
      fields: 'id,account_id,name,currency,timezone_name,account_status,business',
      limit: '100',
    })
  }

  getPagePosts(pageId: string, pageAccessToken: string) {
    if (!pageId) throw new BadRequestException('Page ID шаардлагатай.')
    return this.get(`${pageId}/posts`, pageAccessToken, {
      fields: 'id,message,created_time,permalink_url,full_picture,attachments{media,type,url}',
      limit: '50',
    })
  }

  getCampaigns(adAccountId: string, accessToken: string) {
    return this.get(`${this.normalizeAdAccount(adAccountId)}/campaigns`, accessToken, {
      fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,created_time,updated_time',
      limit: '100',
    })
  }

  createCampaign(adAccountId: string, accessToken: string, input: any) {
    return this.post(`${this.normalizeAdAccount(adAccountId)}/campaigns`, accessToken, {
      name: input.name,
      objective: input.objective,
      status: input.status || 'PAUSED',
      special_ad_categories: input.specialAdCategories || [],
      buying_type: input.buyingType || 'AUCTION',
    })
  }

  createAdSet(adAccountId: string, accessToken: string, input: any) {
    return this.post(`${this.normalizeAdAccount(adAccountId)}/adsets`, accessToken, {
      name: input.name,
      campaign_id: input.campaignId,
      daily_budget: input.dailyBudget,
      lifetime_budget: input.lifetimeBudget,
      billing_event: input.billingEvent || 'IMPRESSIONS',
      optimization_goal: input.optimizationGoal,
      bid_strategy: input.bidStrategy || 'LOWEST_COST_WITHOUT_CAP',
      targeting: input.targeting,
      promoted_object: input.promotedObject,
      start_time: input.startTime,
      end_time: input.endTime,
      status: input.status || 'PAUSED',
    })
  }

  createExistingPostCreative(adAccountId: string, accessToken: string, input: any) {
    return this.post(`${this.normalizeAdAccount(adAccountId)}/adcreatives`, accessToken, {
      name: input.name,
      object_story_id: input.objectStoryId,
    })
  }

  createAd(adAccountId: string, accessToken: string, input: any) {
    return this.post(`${this.normalizeAdAccount(adAccountId)}/ads`, accessToken, {
      name: input.name,
      adset_id: input.adSetId,
      creative: { creative_id: input.creativeId },
      status: input.status || 'PAUSED',
    })
  }

  updateStatus(objectId: string, accessToken: string, status: 'ACTIVE' | 'PAUSED') {
    if (!['ACTIVE', 'PAUSED'].includes(status)) throw new BadRequestException('Status буруу байна.')
    return this.post(objectId, accessToken, { status })
  }

  getInsights(adAccountId: string, accessToken: string, datePreset = 'last_7d', level = 'campaign') {
    return this.get(`${this.normalizeAdAccount(adAccountId)}/insights`, accessToken, {
      fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,action_values,cost_per_action_type,purchase_roas',
      date_preset: datePreset,
      level,
      limit: '500',
    })
  }

  private normalizeAdAccount(value: string) {
    if (!value) throw new BadRequestException('Ad Account ID шаардлагатай.')
    return value.startsWith('act_') ? value : `act_${value}`
  }
}
