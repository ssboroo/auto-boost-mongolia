import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class MetaService {
  private readonly appId = process.env.META_APP_ID || ''
  private readonly appSecret = process.env.META_APP_SECRET || ''
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v25.0'
  private readonly redirectUri = process.env.META_REDIRECT_URI || 'http://localhost:4000/meta/auth/callback'
  private readonly graphBase = 'https://graph.facebook.com'

  private requireAppConfig() {
    if (!this.appId || !this.appSecret) throw new BadRequestException('META_APP_ID болон META_APP_SECRET тохируулаагүй байна.')
  }

  private async parseResponse(response: Response) {
    const text = await response.text()
    let data: any = text
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!response.ok || data?.error) {
      const metaMessage = data?.error?.message || data?.message
      throw new BadGatewayException({ message: metaMessage || 'Meta Graph API хүсэлт амжилтгүй боллоо.', status: response.status, code: data?.error?.code, type: data?.error?.type, error_subcode: data?.error?.error_subcode, error_user_title: data?.error?.error_user_title, error_user_msg: data?.error?.error_user_msg })
    }
    return data
  }

  private async get(path: string, accessToken?: string, query: Record<string, string> = {}) {
    if (!accessToken) throw new BadRequestException('Meta access token шаардлагатай.')
    const params = new URLSearchParams(query); params.set('access_token', accessToken)
    return this.parseResponse(await fetch(`${this.graphBase}/${this.graphVersion}/${path}${params.size ? `?${params.toString()}` : ''}`, { headers: { Accept: 'application/json' } }))
  }

  private async post(path: string, accessToken: string, body: Record<string, unknown>) {
    if (!accessToken) throw new BadRequestException('Meta access token шаардлагатай.')
    const params = new URLSearchParams(); params.set('access_token', accessToken)
    Object.entries(body).forEach(([key, value]) => { if (value !== undefined && value !== null && value !== '') params.set(key, typeof value === 'string' ? value : JSON.stringify(value)) })
    return this.parseResponse(await fetch(`${this.graphBase}/${this.graphVersion}/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: params }))
  }

  getStatus() { const configured = Boolean(this.appId && this.appSecret); return { configured, sessionConfigured: Boolean(process.env.SESSION_SECRET), productionReady: Boolean(configured && process.env.SESSION_SECRET && this.redirectUri.startsWith('https://')), graphVersion: this.graphVersion, redirectUri: this.redirectUri, provider: 'meta-direct' } }

  getLoginUrl(state: string) {
    this.requireAppConfig(); if (!state) throw new BadRequestException('OAuth state шаардлагатай.')
    const scopes = ['ads_read','ads_management','business_management','pages_show_list','pages_read_engagement','pages_read_user_content','pages_manage_ads']
    const params = new URLSearchParams({ client_id: this.appId, redirect_uri: this.redirectUri, state, response_type: 'code', scope: scopes.join(',') })
    return { url: `https://www.facebook.com/${this.graphVersion}/dialog/oauth?${params.toString()}` }
  }

  async exchangeCode(code: string) {
    this.requireAppConfig(); if (!code) throw new BadRequestException('OAuth code байхгүй байна.')
    const params = new URLSearchParams({ client_id: this.appId, client_secret: this.appSecret, redirect_uri: this.redirectUri, code })
    const shortLived = await this.parseResponse(await fetch(`${this.graphBase}/${this.graphVersion}/oauth/access_token?${params.toString()}`))
    if (!shortLived?.access_token) throw new BadGatewayException('Meta access token буцаасангүй.')
    const longParams = new URLSearchParams({ grant_type: 'fb_exchange_token', client_id: this.appId, client_secret: this.appSecret, fb_exchange_token: shortLived.access_token })
    try { const longLived = await this.parseResponse(await fetch(`${this.graphBase}/${this.graphVersion}/oauth/access_token?${longParams.toString()}`)); return longLived?.access_token ? longLived : shortLived } catch { return shortLived }
  }

  getMe(accessToken: string) { return this.get('me', accessToken, { fields: 'id,name,picture' }) }
  getPages(accessToken: string) { return this.get('me/accounts', accessToken, { fields: 'id,name,category,tasks,picture,connected_instagram_account{id,username,profile_pic}', limit: '100' }) }
  getAdAccounts(accessToken: string) { return this.get('me/adaccounts', accessToken, { fields: 'id,account_id,name,currency,timezone_name,account_status,business,amount_spent,balance,spend_cap', limit: '100' }) }
  getPagePosts(pageId: string, accessToken: string) { if (!pageId) throw new BadRequestException('Page ID шаардлагатай.'); return this.get(`${pageId}/posts`, accessToken, { fields: 'id,message,created_time,permalink_url,full_picture,attachments{media,type,url}', limit: '50' }) }
  getLeadForms(pageId: string, accessToken: string) { return this.get(`${pageId}/leadgen_forms`, accessToken, { fields: 'id,name,status,created_time,locale', limit: '100' }) }
  getInstagramIdentity(pageId: string, accessToken: string) { return this.get(pageId, accessToken, { fields: 'id,name,connected_instagram_account{id,username,profile_pic}' }) }

  getCampaigns(adAccountId: string, accessToken: string) { return this.get(`${this.normalizeAdAccount(adAccountId)}/campaigns`, accessToken, { fields: 'id,name,objective,status,effective_status,daily_budget,lifetime_budget,bid_strategy,budget_remaining,created_time,updated_time', limit: '200' }) }
  getAdSets(adAccountId: string, accessToken: string) { return this.get(`${this.normalizeAdAccount(adAccountId)}/adsets`, accessToken, { fields: 'id,name,campaign_id,status,effective_status,daily_budget,lifetime_budget,optimization_goal,billing_event,bid_strategy,bid_amount,targeting,promoted_object,start_time,end_time,created_time,updated_time', limit: '300' }) }
  getAds(adAccountId: string, accessToken: string) { return this.get(`${this.normalizeAdAccount(adAccountId)}/ads`, accessToken, { fields: 'id,name,adset_id,campaign_id,status,effective_status,creative{id,name,thumbnail_url},created_time,updated_time', limit: '300' }) }
  getPixels(adAccountId: string, accessToken: string) { return this.get(`${this.normalizeAdAccount(adAccountId)}/adspixels`, accessToken, { fields: 'id,name,creation_time,last_fired_time,is_unavailable', limit: '100' }) }
  getCustomAudiences(adAccountId: string, accessToken: string) { return this.get(`${this.normalizeAdAccount(adAccountId)}/customaudiences`, accessToken, { fields: 'id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status,operation_status', limit: '200' }) }
  searchInterests(accessToken: string, query: string) { if (!query?.trim()) return { data: [] }; return this.get('search', accessToken, { type: 'adinterest', q: query.trim(), limit: '30' }) }

  createCampaign(adAccountId: string, accessToken: string, input: any) {
    if (!input?.name || !input?.objective) throw new BadRequestException('Кампайны нэр болон зорилго шаардлагатай.')
    const body: any = { name: input.name, objective: input.objective, status: 'PAUSED', special_ad_categories: input.specialAdCategories || [], buying_type: input.buyingType || 'AUCTION' }
    if (input.campaignBudgetType === 'DAILY' && input.campaignBudget) body.daily_budget = input.campaignBudget
    if (input.campaignBudgetType === 'LIFETIME' && input.campaignBudget) body.lifetime_budget = input.campaignBudget
    if (input.bidStrategy) body.bid_strategy = input.bidStrategy
    return this.post(`${this.normalizeAdAccount(adAccountId)}/campaigns`, accessToken, body)
  }

  createAdSet(adAccountId: string, accessToken: string, input: any) {
    if (!input?.name || !input?.campaignId || !input?.targeting) throw new BadRequestException('Ad Set нэр, campaignId, targeting шаардлагатай.')
    const body: any = { name: input.name, campaign_id: input.campaignId, daily_budget: input.dailyBudget, lifetime_budget: input.lifetimeBudget, billing_event: input.billingEvent || 'IMPRESSIONS', optimization_goal: input.optimizationGoal, bid_strategy: input.bidStrategy || 'LOWEST_COST_WITHOUT_CAP', targeting: input.targeting, promoted_object: input.promotedObject, start_time: input.startTime, end_time: input.endTime, status: 'PAUSED' }
    if (input.bidAmount) body.bid_amount = input.bidAmount
    if (input.bidConstraints) body.bid_constraints = input.bidConstraints
    if (input.destinationType) body.destination_type = input.destinationType
    return this.post(`${this.normalizeAdAccount(adAccountId)}/adsets`, accessToken, body)
  }

  createExistingPostCreative(adAccountId: string, accessToken: string, input: any) {
    if (!input?.name || !input?.objectStoryId) throw new BadRequestException('Creative нэр болон objectStoryId шаардлагатай.')
    return this.post(`${this.normalizeAdAccount(adAccountId)}/adcreatives`, accessToken, { name: input.name, object_story_id: input.objectStoryId })
  }

  createManualCreative(adAccountId: string, accessToken: string, input: any) {
    if (!input?.name || !input?.pageId) throw new BadRequestException('Creative нэр болон Page шаардлагатай.')
    const cta = input.callToActionType ? { type: input.callToActionType, value: { ...(input.destinationUrl ? { link: input.destinationUrl } : {}), ...(input.leadGenFormId ? { lead_gen_form_id: input.leadGenFormId } : {}) } } : undefined
    const objectStorySpec: any = { page_id: input.pageId }
    if (input.instagramActorId) objectStorySpec.instagram_actor_id = input.instagramActorId
    if (input.format === 'VIDEO') {
      if (!input.videoId) throw new BadRequestException('Video creative-д Meta video ID шаардлагатай.')
      objectStorySpec.video_data = { video_id: input.videoId, message: input.primaryText || '', title: input.headline || '', link_description: input.description || '', ...(input.thumbnailUrl ? { image_url: input.thumbnailUrl } : {}), ...(cta ? { call_to_action: cta } : {}) }
    } else {
      if (!input.destinationUrl) throw new BadRequestException('Image/link creative-д destination URL шаардлагатай.')
      objectStorySpec.link_data = { link: input.destinationUrl, message: input.primaryText || '', name: input.headline || '', description: input.description || '', ...(input.imageUrl ? { picture: input.imageUrl } : {}), ...(input.imageHash ? { image_hash: input.imageHash } : {}), ...(cta ? { call_to_action: cta } : {}) }
    }
    return this.post(`${this.normalizeAdAccount(adAccountId)}/adcreatives`, accessToken, { name: input.name, object_story_spec: objectStorySpec, ...(input.urlTags ? { url_tags: input.urlTags } : {}) })
  }

  createAd(adAccountId: string, accessToken: string, input: any) {
    if (!input?.name || !input?.adSetId || !input?.creativeId) throw new BadRequestException('Ad нэр, adSetId, creativeId шаардлагатай.')
    return this.post(`${this.normalizeAdAccount(adAccountId)}/ads`, accessToken, { name: input.name, adset_id: input.adSetId, creative: { creative_id: input.creativeId }, status: 'PAUSED', ...(input.trackingSpecs ? { tracking_specs: input.trackingSpecs } : {}) })
  }

  updateObject(objectId: string, accessToken: string, input: any) {
    if (!objectId) throw new BadRequestException('Object ID шаардлагатай.')
    const allowed = ['name','daily_budget','lifetime_budget','bid_strategy','bid_amount','optimization_goal','billing_event','targeting','promoted_object','start_time','end_time']
    const body: any = {}; for (const key of allowed) if (input?.[key] !== undefined) body[key] = input[key]
    if (!Object.keys(body).length) throw new BadRequestException('Шинэчлэх талбар алга.')
    return this.post(objectId, accessToken, body)
  }

  updateStatus(objectId: string, accessToken: string, status: 'ACTIVE' | 'PAUSED') { if (!objectId) throw new BadRequestException('Object ID шаардлагатай.'); if (!['ACTIVE','PAUSED'].includes(status)) throw new BadRequestException('Status буруу байна.'); return this.post(objectId, accessToken, { status }) }

  getInsights(adAccountId: string, accessToken: string, datePreset = 'last_7d', level = 'campaign') {
    const allowedLevels = ['account','campaign','adset','ad']; if (!allowedLevels.includes(level)) throw new BadRequestException('Insights level буруу байна.')
    return this.get(`${this.normalizeAdAccount(adAccountId)}/insights`, accessToken, { fields: 'campaign_id,campaign_name,adset_id,adset_name,ad_id,ad_name,spend,impressions,reach,clicks,ctr,cpc,cpm,frequency,actions,action_values,cost_per_action_type,purchase_roas', date_preset: datePreset, level, limit: '500' })
  }

  private normalizeAdAccount(value: string) { if (!value) throw new BadRequestException('Ad Account ID шаардлагатай.'); return value.startsWith('act_') ? value : `act_${value}` }
}
