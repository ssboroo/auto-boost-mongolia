import { BadRequestException, Injectable } from '@nestjs/common'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { MetaService } from '../meta/meta.service'
import { TenantService } from '../meta/tenant.service'
import {
  AssistantRequest,
  BusinessScanRequest,
  CreativeRequest,
  MarketingLocale,
  OptimizationRequest,
  StrategyRequest,
  WebsiteScan,
  WebsiteScanRequest,
} from './marketing.types'

const CATEGORY_RULES = [
  { id: 'ecommerce', words: ['shop','store','buy','product','cart','sale','худалдаа','дэлгүүр','бараа','захиалга'] },
  { id: 'restaurant', words: ['restaurant','menu','food','coffee','cafe','хоол','ресторан','кафе','меню'] },
  { id: 'real_estate', words: ['real estate','property','apartment','house','орон сууц','үл хөдлөх','байр'] },
  { id: 'education', words: ['course','school','academy','training','сургалт','сургууль','хичээл'] },
  { id: 'beauty', words: ['beauty','salon','spa','cosmetic','гоо сайхан','салон','үсчин'] },
  { id: 'automotive', words: ['car','auto','vehicle','garage','машин','авто','засвар'] },
  { id: 'software', words: ['software','saas','ai','license','digital','api','програм','лиценз','дижитал'] },
  { id: 'professional_services', words: ['consulting','agency','service','law','accounting','үйлчилгээ','зөвлөх'] },
]

@Injectable()
export class MarketingService {
  constructor(
    private readonly tenant: TenantService,
    private readonly meta: MetaService,
  ) {}

  async metaSources(req: any) {
    const { metaToken } = await this.tenant.requireMetaToken(req)
    const pages = await this.meta.getPages(metaToken)
    return {
      pages: (pages?.data || []).map((page: any) => ({
        id: page.id,
        name: page.name,
        category: page.category,
        picture: page.picture?.data?.url || page.picture?.url || null,
        instagram: page.connected_instagram_account
          ? {
              id: page.connected_instagram_account.id,
              username: page.connected_instagram_account.username,
              profilePicture: page.connected_instagram_account.profile_picture_url || null,
            }
          : null,
      })),
    }
  }

  async scanWebsite(req: any, input: WebsiteScanRequest) {
    const context = await this.tenant.requireContext(req)
    const result = await this.scanWebsiteCore(input)
    await this.tenant.writeAudit(
      context.appToken,
      context.workspaceId,
      context.user.id,
      'marketing.website_scanned',
      'website',
      null,
      { url: result.finalUrl, category: result.category },
    )
    return result
  }

  async scanBusiness(req: any, input: BusinessScanRequest) {
    const context = await this.tenant.requireContext(req)
    const locale = this.locale(input.locale)
    const sources: any = { website: null, facebook: null, instagram: null }
    const textParts: string[] = []
    const highlights: string[] = []
    const brandNames: string[] = []

    if (!input.websiteUrl && !input.facebookPageId && !input.instagramId) {
      throw new BadRequestException('Website, Facebook Page эсвэл Instagram source-оос дор хаяж нэгийг сонгоно уу.')
    }

    if (input.websiteUrl) {
      const website = await this.scanWebsiteCore({ url: input.websiteUrl, locale })
      sources.website = website
      textParts.push(website.title, website.description, ...website.highlights, ...website.keywords)
      highlights.push(...website.highlights)
      brandNames.push(website.title)
    }

    let metaToken = ''
    if (input.facebookPageId || input.instagramId) {
      const tokenResult = await this.tenant.requireMetaToken(req)
      metaToken = tokenResult.metaToken
    }

    let linkedInstagramId = input.instagramId || ''
    let socialToken = metaToken

    if (input.facebookPageId || input.instagramId) {
      const managedPages = await this.meta.getManagedPages(metaToken)
      const pageForScan = input.facebookPageId
        ? (managedPages?.data || []).find((page: any) => String(page.id) === String(input.facebookPageId))
        : (managedPages?.data || []).find((page: any) => String(page.connected_instagram_account?.id || '') === String(input.instagramId || ''))
      if (pageForScan?.access_token) socialToken = pageForScan.access_token
      if (!linkedInstagramId && pageForScan?.connected_instagram_account?.id) linkedInstagramId = pageForScan.connected_instagram_account.id
    }

    if (input.facebookPageId) {
      const [profile, posts, identity] = await Promise.all([
        this.meta.getPageProfile(input.facebookPageId, socialToken),
        this.meta.getPagePosts(input.facebookPageId, socialToken),
        this.meta.getInstagramIdentity(input.facebookPageId, socialToken),
      ])
      linkedInstagramId = linkedInstagramId || identity?.connected_instagram_account?.id || ''
      const postRows = (posts?.data || []).slice(0, 30)
      sources.facebook = {
        id: profile?.id || input.facebookPageId,
        name: profile?.name || '',
        category: profile?.category || '',
        about: profile?.about || '',
        description: profile?.description || '',
        website: profile?.website || '',
        followers: Number(profile?.followers_count || profile?.fan_count || 0),
        link: profile?.link || '',
        picture: profile?.picture?.data?.url || null,
        recentPosts: postRows.map((p: any) => ({
          id: p.id,
          message: String(p.message || '').slice(0, 1000),
          createdTime: p.created_time,
          permalink: p.permalink_url,
          picture: p.full_picture || null,
        })),
      }
      brandNames.push(profile?.name || '')
      textParts.push(
        profile?.name || '',
        profile?.category || '',
        profile?.about || '',
        profile?.description || '',
        ...postRows.map((p: any) => String(p.message || '')),
      )
      highlights.push(
        ...postRows.map((p: any) => String(p.message || '').trim()).filter((v: string) => v.length >= 8).slice(0, 5),
      )
    }

    if (linkedInstagramId) {
      const [profile, media] = await Promise.all([
        this.meta.getInstagramProfile(linkedInstagramId, socialToken),
        this.meta.getInstagramMedia(linkedInstagramId, socialToken),
      ])
      const mediaRows = (media?.data || []).slice(0, 30)
      sources.instagram = {
        id: profile?.id || linkedInstagramId,
        username: profile?.username || '',
        name: profile?.name || '',
        biography: profile?.biography || '',
        website: profile?.website || '',
        followers: Number(profile?.followers_count || 0),
        follows: Number(profile?.follows_count || 0),
        mediaCount: Number(profile?.media_count || 0),
        profilePicture: profile?.profile_picture_urlture_url || null,
        recentMedia: mediaRows.map((m: any) => ({
          id: m.id,
          caption: String(m.caption || '').slice(0, 1000),
          mediaType: m.media_type,
          permalink: m.permalink,
          timestamp: m.timestamp,
          thumbnail: m.thumbnail_url || (m.media_type === 'IMAGE' ? m.media_url : null),
        })),
      }
      brandNames.push(profile?.name || profile?.username || '')
      textParts.push(
        profile?.name || '',
        profile?.username || '',
        profile?.biography || '',
        ...mediaRows.map((m: any) => String(m.caption || '')),
      )
      highlights.push(
        ...mediaRows.map((m: any) => String(m.caption || '').trim()).filter((v: string) => v.length >= 8).slice(0, 5),
      )
    }

    const combined = textParts.join(' ').replace(/\s+/g, ' ').trim()
    const category = this.detectCategory(combined.toLowerCase())
    const keywords = this.extractKeywords(combined, category)
    const tone = this.detectTone(combined)
    const contentPillars = this.contentPillars(category, keywords, locale)
    const suggestedObjective = this.objectiveFor(category)
    const suggestedChannels = this.mergeChannels(category, sources)
    const brandName = brandNames.map(v => String(v || '').trim()).find(Boolean) || 'Business'
    const cleanHighlights = Array.from(new Set(highlights.map(v => this.cleanText(v)).filter(Boolean))).slice(0, 8)
    const audience = {
      country: 'MN',
      ageMin: 18,
      ageMax: category === 'real_estate' || category === 'professional_services' ? 55 : 45,
      interests: this.interestsFor(category, keywords),
    }
    const campaignSeed = this.seedFor(locale, brandName, category, cleanHighlights[0] || combined.slice(0, 180))

    const result = {
      businessName: brandName,
      category,
      tone,
      keywords,
      highlights: cleanHighlights,
      contentPillars,
      suggestedObjective,
      suggestedChannels,
      audience,
      campaignSeed,
      sources,
      sourceCount: Object.values(sources).filter(Boolean).length,
      scannedAt: new Date().toISOString(),
      engine: 'BOOST Business AI Scanner v1',
    }

    await this.tenant.writeAudit(
      context.appToken,
      context.workspaceId,
      context.user.id,
      'marketing.business_scanned',
      'business_scan',
      null,
      {
        category,
        tone,
        sources: Object.entries(sources).filter(([,v]) => Boolean(v)).map(([key]) => key),
        channels: suggestedChannels,
      },
    )
    return result
  }

  async strategy(req: any, input: StrategyRequest) {
    const context = await this.tenant.requireContext(req)
    const locale = this.locale(input.locale)
    const scan = input.businessScan || {}
    const category = input.category || scan.category || 'professional_services'
    const name = String(input.businessName || scan.businessName || 'Your business').slice(0, 100)
    const budget = Math.max(10000, Math.round(Number(input.budgetMnt || 300000)))
    const duration = Math.max(1, Math.min(90, Math.round(Number(input.durationDays || 7))))
    const objective = this.normalizeGoal(input.goal || scan.suggestedObjective || this.objectiveFor(category))
    const channels = scan.suggestedChannels?.length ? scan.suggestedChannels : this.channelsFor(category)
    const dailyBudget = Math.round(budget / duration)
    const summary = locale === 'mn'
      ? name + '-д зориулсан ' + duration + ' хоногийн multi-channel өсөлтийн төлөвлөгөө.'
      : duration + '-day multi-channel growth plan for ' + name + '.'
    const actions = locale === 'mn'
      ? [
          'Эхний 72 цагт 3-аас доошгүй creative хувилбар зэрэг тестэл.',
          'CTR, CPC болон нэг үр дүнгийн үнийг сувгаар тусад нь хяна.',
          'Өндөр intent-тэй сувгийг төсвөөр аажмаар өсгө.',
          'Website visitor болон social engagement audience дээр retargeting үүсгэ.',
        ]
      : [
          'Test at least three creative variants during the first 72 hours.',
          'Track CTR, CPC and cost per result separately by channel.',
          'Gradually increase budget on higher-intent channels.',
          'Create retargeting for website visitors and social engagement audiences.',
        ]

    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'marketing.strategy_generated', 'marketing_strategy', null, { category, objective, channels })
    return {
      businessName: name,
      category,
      objective,
      channels,
      budgetMnt: budget,
      durationDays: duration,
      dailyBudgetMnt: dailyBudget,
      audience: scan.audience || { country: 'MN', ageMin: 18, ageMax: 45, interests: this.interestsFor(category, []) },
      summary,
      funnel: locale === 'mn'
        ? ['Анхаарал татах creative','Website / message action','Retargeting','Conversion optimization']
        : ['Attention creative','Website / message action','Retargeting','Conversion optimization'],
      actions,
      generatedAt: new Date().toISOString(),
      engine: 'BOOST Strategy Engine v1',
    }
  }

  async assistant(req: any, input: AssistantRequest) {
    const context = await this.tenant.requireContext(req)
    const locale = this.locale(input.locale)
    const message = String(input.message || '').trim()
    if (!message) throw new BadRequestException('Message шаардлагатай.')
    const scan = input.businessScan || {}
    const category = scan.category || 'business'
    const channels = scan.suggestedChannels || this.channelsFor(category)
    const lower = message.toLowerCase()
    let answer = ''

    if (/budget|төсөв|мөнгө/.test(lower)) {
      answer = locale === 'mn'
        ? 'Эхний тестийг 7 хоногоор явуулж, нийт төсвийн 50%-ийг өндөр intent-тэй сувагт, 30%-ийг social discovery, 20%-ийг retargeting-д эхлүүлээрэй. Өдөр бүр биш 48–72 цагийн датагаар шийдвэр гаргах нь дээр.'
        : 'Start with a 7-day test: roughly 50% for high-intent channels, 30% for social discovery and 20% for retargeting. Make decisions from 48–72 hours of data rather than daily noise.'
    } else if (/creative|зураг|video|видео|content|контент/.test(lower)) {
      answer = locale === 'mn'
        ? '3 creative angle тестэл: 1) шууд benefit, 2) social proof / бодит хэрэглээ, 3) offer + urgency. TikTok/Instagram-д vertical 9:16, Meta feed-д 4:5, Google-д headline/description variation бэлд.'
        : 'Test three creative angles: 1) direct benefit, 2) social proof or real usage, and 3) offer plus urgency. Prepare vertical 9:16 for TikTok/Instagram, 4:5 for Meta feeds, and headline/description variants for Google.'
    } else if (/audience|target|хэнд|нас|сонирхол/.test(lower)) {
      answer = locale === 'mn'
        ? 'Эхний тест дээр audience-аа хэт нарийсгахгүй. Монгол + үндсэн насны хүрээ + 3–5 interest-аар эхэлж, engagement/website visitor data цугларсны дараа retargeting салга.'
        : 'Avoid over-narrowing the first test. Start with Mongolia, a sensible age range and 3–5 interests, then split retargeting once engagement and website-visitor data accumulate.'
    } else if (/channel|суваг|facebook|instagram|google|tiktok|youtube|linkedin|x/.test(lower)) {
      answer = locale === 'mn'
        ? 'Одоогийн scan-аар эхлэх сувгууд: ' + channels.join(', ') + '. Эхний зорилго нь ' + (scan.suggestedObjective || this.objectiveFor(category)) + '. Бүх сувгийг зэрэг асаахаас илүү 2–4 үндсэн сувгийг эхэлж шалгаад дараа нь өргөжүүлэх нь зөв.'
        : 'Based on the current scan, start with: ' + channels.join(', ') + '. Initial objective: ' + (scan.suggestedObjective || this.objectiveFor(category)) + '. It is usually better to validate 2–4 core channels before expanding everywhere.'
    } else {
      answer = locale === 'mn'
        ? (scan.businessName || 'Таны бизнес') + '-ийн scan дээр үндэслээд эхний priority бол ' + (scan.suggestedObjective || this.objectiveFor(category)) + ' зорилготой campaign. ' + channels.slice(0,4).join(', ') + ' сувгийг эхэлж тестлээд creative, CTR, CPC, conversion data-аар дараагийн төсвөө шилжүүл.'
        : 'Based on the scan for ' + (scan.businessName || 'your business') + ', the first priority is a ' + (scan.suggestedObjective || this.objectiveFor(category)) + ' campaign. Start with ' + channels.slice(0,4).join(', ') + ' and reallocate budget using creative, CTR, CPC and conversion data.'
    }

    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'marketing.assistant_used', 'marketing_assistant', null, { category })
    return { answer, generatedAt: new Date().toISOString(), engine: 'BOOST Marketing Assistant v1' }
  }

  async creative(req: any, input: CreativeRequest) {
    const context = await this.tenant.requireContext(req)
    const locale = this.locale(input.locale)
    const scan = input.businessScan || {}
    const category = input.category || scan.category || 'professional_services'
    const business = String(input.businessName || scan.businessName || 'BOOST.MN business').slice(0, 100)
    const offer = String(input.offer || scan.highlights?.[0] || input.description || '').slice(0, 180)
    const tone = input.tone || scan.tone || 'professional'
    const channels = input.channels?.length ? input.channels : scan.suggestedChannels || this.channelsFor(category)
    const variants = this.creativeVariants(locale, business, category, offer, tone)

    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'marketing.creative_generated', 'creative_set', null, { category, tone, channels })
    return {
      business,
      category,
      tone,
      channels,
      variants,
      visualPrompts: this.visualPrompts(locale, business, category, offer),
      generatedAt: new Date().toISOString(),
      engine: 'BOOST Creative Engine v1',
    }
  }

  async optimize(req: any, input: OptimizationRequest) {
    const context = await this.tenant.requireContext(req)
    const locale = this.locale(input.locale)
    const spend = this.num(input.spend)
    const impressions = this.num(input.impressions)
    const clicks = this.num(input.clicks)
    const conversions = this.num(input.conversions)
    const leads = this.num(input.leads)
    const revenue = this.num(input.revenue)
    const ctr = impressions > 0 ? clicks / impressions * 100 : 0
    const cpc = clicks > 0 ? spend / clicks : 0
    const cvr = clicks > 0 ? (conversions || leads) / clicks * 100 : 0
    const roas = spend > 0 ? revenue / spend : 0
    const suggestions: Array<{ priority: 'high' | 'medium' | 'low'; title: string; detail: string; action: string }> = []

    if (impressions > 1000 && ctr < 0.8) suggestions.push(this.tip(locale, 'high', 'CTR', 'creative'))
    if (clicks > 30 && cvr < 1) suggestions.push(this.tip(locale, 'high', 'CVR', 'landing'))
    if (clicks > 0 && cpc > 3000) suggestions.push(this.tip(locale, 'medium', 'CPC', 'targeting'))
    if (spend > 0 && revenue > 0 && roas < 1.5) suggestions.push(this.tip(locale, 'high', 'ROAS', 'budget'))
    if (ctr >= 1.5 && (cvr >= 2 || roas >= 2)) suggestions.push(this.tip(locale, 'low', 'SCALE', 'scale'))
    if (!suggestions.length) suggestions.push(this.tip(locale, 'low', 'LEARN', 'learning'))

    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'marketing.optimization_analyzed', 'optimization', null, { channel: input.channel || null, ctr, cpc, cvr, roas })
    return {
      metrics: { spend, impressions, clicks, conversions, leads, revenue, ctr: Number(ctr.toFixed(2)), cpc: Number(cpc.toFixed(2)), conversionRate: Number(cvr.toFixed(2)), roas: Number(roas.toFixed(2)) },
      suggestions,
      mode: 'suggestion_only',
      note: locale === 'mn'
        ? 'Зөвлөмж нь campaign-ийг автоматаар өөрчлөхгүй. Live optimization provider API ирсний дараа тусдаа баталгаажуулалттай ажиллана.'
        : 'Recommendations do not modify campaigns automatically. Live optimization remains gated behind provider API access and confirmation.',
      generatedAt: new Date().toISOString(),
    }
  }

  async tracking(req: any) {
    const context = await this.tenant.requireContext(req)
    const pixelId = 'boost_' + context.workspaceId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24)
    return {
      pixelId,
      status: 'preview',
      events: ['PageView','ViewContent','Lead','Purchase'],
      snippet: [
        '<script>',
        "window.BOOST_PIXEL_ID='" + pixelId + "';",
        "window.boostTrack=function(event,data){window.dispatchEvent(new CustomEvent('boost:track',{detail:{event:event,data:data||{},pixelId:window.BOOST_PIXEL_ID}}));};",
        "window.boostTrack('PageView',{url:location.href,title:document.title});",
        '</script>',
      ].join('\n'),
      note: 'Front-end event model is ready. Server-side collection remains disabled until durable analytics storage is active.',
    }
  }

  private async scanWebsiteCore(input: WebsiteScanRequest): Promise<WebsiteScan> {
    const locale = this.locale(input.locale)
    const url = await this.validatePublicUrl(input.url)
    const { finalUrl, html } = await this.fetchHtml(url)
    const title = this.extractTitle(html) || new URL(finalUrl).hostname
    const description = this.extractDescription(html)
    const text = this.toText(html)
    const combined = (title + ' ' + description + ' ' + text.slice(0, 12000)).toLowerCase()
    const category = this.detectCategory(combined)
    const keywords = this.extractKeywords(combined, category)
    const highlights = this.extractHighlights(html, description, locale)
    const suggestedObjective = this.objectiveFor(category)
    const suggestedChannels = this.channelsFor(category)
    return {
      url: url.toString(),
      finalUrl,
      title: title.slice(0, 140),
      description: description.slice(0, 500),
      category,
      language: locale,
      keywords,
      highlights,
      suggestedObjective,
      suggestedChannels,
      audience: { country: 'MN', ageMin: 18, ageMax: category === 'professional_services' || category === 'real_estate' ? 55 : 45, interests: this.interestsFor(category, keywords) },
      campaignSeed: this.seedFor(locale, title, category, highlights[0] || description),
      source: 'website',
      scannedAt: new Date().toISOString(),
    }
  }

  private locale(value?: string): MarketingLocale { return value === 'en' ? 'en' : 'mn' }

  private async validatePublicUrl(raw: string) {
    const value = String(raw || '').trim()
    if (!value || value.length > 500) throw new BadRequestException('Website URL буруу байна.')
    let url: URL
    try { url = new URL(/^https?:\/\//i.test(value) ? value : 'https://' + value) } catch { throw new BadRequestException('Website URL буруу байна.') }
    if (!['http:','https:'].includes(url.protocol) || url.username || url.password) throw new BadRequestException('Зөвхөн public HTTP/HTTPS website зөвшөөрнө.')
    await this.assertPublicHost(url.hostname)
    return url
  }

  private async assertPublicHost(hostname: string) {
    const host = hostname.toLowerCase().replace(/\.$/, '')
    if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) throw new BadRequestException('Private/internal host scan хийх боломжгүй.')
    if (isIP(host)) {
      if (this.privateIp(host)) throw new BadRequestException('Private IP scan хийх боломжгүй.')
      return
    }
    let rows: Array<{ address: string; family: number }>
    try { rows = await lookup(host, { all: true, verbatim: true }) } catch { throw new BadRequestException('Website hostname resolve хийж чадсангүй.') }
    if (!rows.length || rows.some(row => this.privateIp(row.address))) throw new BadRequestException('Private/internal network руу scan хийх боломжгүй.')
  }

  private privateIp(ip: string) {
    const v = ip.toLowerCase()
    if (v === '::1' || v === '::' || v.startsWith('fe80:') || v.startsWith('fc') || v.startsWith('fd')) return true
    if (v.startsWith('::ffff:')) return this.privateIp(v.slice(7))
    const parts = v.split('.').map(Number)
    if (parts.length !== 4 || parts.some(n => Number.isNaN(n))) return false
    const [a,b] = parts
    return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224
  }

  private async fetchHtml(start: URL) {
    let current = start
    for (let i = 0; i < 4; i++) {
      await this.assertPublicHost(current.hostname)
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 8000)
      let response: Response
      try {
        response = await fetch(current, { redirect: 'manual', signal: controller.signal, headers: { 'User-Agent': 'BOOSTMN-WebsiteScanner/1.0', Accept: 'text/html,application/xhtml+xml' } })
      } catch {
        throw new BadRequestException('Website content татаж чадсангүй.')
      } finally { clearTimeout(timer) }
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location')
        if (!location) throw new BadRequestException('Website redirect буруу байна.')
        current = new URL(location, current)
        if (!['http:','https:'].includes(current.protocol)) throw new BadRequestException('Website redirect зөвшөөрөгдөөгүй protocol руу зааж байна.')
        continue
      }
      if (!response.ok) throw new BadRequestException('Website HTTP ' + response.status + ' буцаалаа.')
      const type = response.headers.get('content-type') || ''
      if (!type.includes('text/html') && !type.includes('application/xhtml')) throw new BadRequestException('HTML website URL оруулна уу.')
      const size = Number(response.headers.get('content-length') || 0)
      if (size > 2_000_000) throw new BadRequestException('Website response хэт том байна.')
      return { finalUrl: current.toString(), html: (await response.text()).slice(0, 300_000) }
    }
    throw new BadRequestException('Website redirect хэт олон байна.')
  }

  private extractTitle(html: string) { return this.decode(this.match(html, /<title[^>]*>([\s\S]*?)<\/title>/i) || this.meta(html,'property','og:title')) }
  private extractDescription(html: string) { return this.decode(this.meta(html,'name','description') || this.meta(html,'property','og:description') || '') }
  private meta(html: string, attr: string, value: string) {
    const a = new RegExp('<meta[^>]*' + attr + '=["\\\']' + value + '["\\\'][^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*>','i')
    const b = new RegExp('<meta[^>]*content=["\\\']([^"\\\']*)["\\\'][^>]*' + attr + '=["\\\']' + value + '["\\\'][^>]*>','i')
    return this.match(html,a) || this.match(html,b)
  }
  private match(value: string, re: RegExp) { return value.match(re)?.[1]?.trim() || '' }
  private decode(value: string) { return value.replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/\s+/g,' ').trim() }
  private toText(html: string) { return this.decode(html.replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<noscript[\s\S]*?<\/noscript>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ')) }
  private cleanText(value: string) { return String(value || '').replace(/https?:\/\/\S+/g,' ').replace(/[#@][\w.-]+/g,' ').replace(/\s+/g,' ').trim().slice(0,280) }

  private detectCategory(text: string) {
    let best = { id:'professional_services', score:0 }
    for (const rule of CATEGORY_RULES) {
      const score = rule.words.reduce((sum,word)=>sum+(text.includes(word)?1:0),0)
      if (score > best.score) best = { id:rule.id, score }
    }
    return best.id
  }

  private detectTone(text: string) {
    const premium = ['premium','luxury','exclusive','high-end','дээд зэрэглэл','тансаг']
    const friendly = ['welcome','family','together','community','тавтай морил','хамтдаа','гэр бүл']
    const bold = ['sale','now','limited','hurry','discount','хямдрал','яг одоо','дуусахаас өмнө']
    if (premium.some(v=>text.toLowerCase().includes(v))) return 'premium'
    if (bold.some(v=>text.toLowerCase().includes(v))) return 'bold'
    if (friendly.some(v=>text.toLowerCase().includes(v))) return 'friendly'
    return 'professional'
  }

  private extractKeywords(text: string, category: string) {
    const stop = new Set(['this','that','with','from','your','have','will','more','about','the','and','for','are','our','you','болон','байна','гэсэн','манай','таны','энэ','дээр'])
    const words = text.toLowerCase().match(/[a-zA-Zа-яА-ЯөӨүҮёЁ0-9][a-zA-Zа-яА-ЯөӨүҮёЁ0-9+.-]{2,}/g) || []
    const counts = new Map<string,number>()
    for (const word of words) if (!stop.has(word) && !/^\d+$/.test(word)) counts.set(word,(counts.get(word)||0)+1)
    const ranked = [...counts.entries()].sort((a,b)=>b[1]-a[1]).map(([word])=>word).slice(0,10)
    return Array.from(new Set([category.replace('_',' '),...ranked])).slice(0,10)
  }

  private extractHighlights(html: string, description: string, locale: MarketingLocale) {
    const matches = [...html.matchAll(/<(h1|h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi)].map(m=>this.toText(m[2])).filter(v=>v.length>=4&&v.length<=160).slice(0,4)
    if (description && !matches.includes(description)) matches.push(description)
    if (!matches.length) matches.push(locale==='mn'?'Бизнесийн гол санал':'Primary business offer')
    return matches.slice(0,5)
  }

  private objectiveFor(category: string) {
    if (category === 'ecommerce' || category === 'software') return 'sales' as const
    if (category === 'real_estate' || category === 'education' || category === 'professional_services') return 'leads' as const
    if (category === 'restaurant' || category === 'beauty' || category === 'automotive') return 'messages' as const
    return 'traffic' as const
  }

  private channelsFor(category: string) {
    if (category === 'ecommerce') return ['facebook','instagram','google','tiktok']
    if (category === 'software') return ['google','youtube','facebook','linkedin']
    if (category === 'professional_services') return ['google','facebook','linkedin']
    if (category === 'restaurant' || category === 'beauty') return ['facebook','instagram','tiktok']
    if (category === 'real_estate') return ['facebook','instagram','google','youtube']
    return ['facebook','instagram','google']
  }

  private mergeChannels(category: string, sources: any) {
    const channels = new Set(this.channelsFor(category))
    if (sources.facebook) channels.add('facebook')
    if (sources.instagram) { channels.add('instagram'); channels.add('tiktok') }
    if (sources.website) channels.add('google')
    return [...channels].slice(0,6)
  }

  private interestsFor(category: string, keywords: string[]) {
    const defaults: Record<string,string[]> = {
      ecommerce:['online shopping','deals','retail'],restaurant:['food','restaurants','coffee'],real_estate:['real estate','property','home'],
      education:['education','online learning','career'],beauty:['beauty','skincare','fashion'],automotive:['cars','automotive','vehicle'],
      software:['technology','software','artificial intelligence'],professional_services:['business','entrepreneurship','professional services'],
    }
    return Array.from(new Set([...(defaults[category]||['business']),...keywords.slice(0,3)])).slice(0,6)
  }

  private contentPillars(category: string, keywords: string[], locale: MarketingLocale) {
    const key = keywords.slice(0,2).join(' / ')
    return locale === 'mn'
      ? ['Бүтээгдэхүүн / үйлчилгээний benefit','Бодит хэрэглээ ба social proof','Зөвлөгөө / education','Offer, шинэчлэлт, promotion',key || category]
      : ['Product / service benefits','Real use and social proof','Education / tips','Offers, launches and promotions',key || category]
  }

  private seedFor(locale: MarketingLocale, title: string, category: string, highlight: string) {
    if (locale === 'en') return { headline:(title+' — made simple').slice(0,80), primaryText:(highlight||'Discover a better way to get results with '+title+'.').slice(0,220), callToAction:this.objectiveFor(category)==='messages'?'Send Message':this.objectiveFor(category)==='sales'?'Shop Now':'Learn More' }
    return { headline:(title+' — илүү хялбар').slice(0,80), primaryText:(highlight||title+'-ийн саналтай танилцаад яг одоо эхлээрэй.').slice(0,220), callToAction:this.objectiveFor(category)==='messages'?'Мессеж бичих':this.objectiveFor(category)==='sales'?'Худалдаж авах':'Дэлгэрэнгүй' }
  }

  private normalizeGoal(goal: string) {
    const value = String(goal||'').toLowerCase()
    if (value.includes('message')) return 'messages'
    if (value.includes('lead')) return 'leads'
    if (value.includes('video')) return 'video_views'
    if (value.includes('sale') || value.includes('conversion')) return 'sales'
    return 'traffic'
  }

  private creativeVariants(locale: MarketingLocale, business: string, category: string, offer: string, tone: string) {
    const core = offer || (locale==='mn'?'Танд зориулсан илүү хялбар шийдэл.':'A simpler solution built for you.')
    if (locale === 'en') return [
      { name:'Benefit', headline:(business+': a smarter way forward').slice(0,90), primaryText:(core+' See what makes the difference and get started today.').slice(0,260), cta:'Learn More' },
      { name:'Social', headline:('Why people choose '+business).slice(0,90), primaryText:('Real value, clear experience, and a simple next step. '+core).slice(0,260), cta:'Learn More' },
      { name:'Offer', headline:('Discover '+business+' today').slice(0,90), primaryText:(core+' Take the next step while this offer is available.').slice(0,260), cta:category==='ecommerce'?'Shop Now':'Get Started' },
    ]
    return [
      { name:'Benefit', headline:(business+': илүү ухаалаг сонголт').slice(0,90), primaryText:(core+' Ялгааг нь мэдрээд яг одоо эхлээрэй.').slice(0,260), cta:'Дэлгэрэнгүй' },
      { name:'Social', headline:(business+'-ийг яагаад сонгодог вэ?').slice(0,90), primaryText:('Бодит үнэ цэнэ, ойлгомжтой үйлчилгээ, хялбар дараагийн алхам. '+core).slice(0,260), cta:'Дэлгэрэнгүй' },
      { name:'Offer', headline:(business+'-тай өнөөдөр танилц').slice(0,90), primaryText:(core+' Боломжтой үед нь дараагийн алхмаа хийгээрэй.').slice(0,260), cta:category==='ecommerce'?'Худалдаж авах':'Эхлэх' },
    ]
  }

  private visualPrompts(locale: MarketingLocale, business: string, category: string, offer: string) {
    const subject = business + ' ' + category.replace('_',' ') + ' ' + offer
    if (locale === 'en') return [
      'Premium commercial advertising image for '+subject+', clean blue-white brand system, strong focal subject, realistic lighting, modern social media ad, 4:5.',
      'Vertical 9:16 short-video key visual for '+subject+', energetic composition, mobile-first framing, authentic people or product context, premium advertising quality.',
      'Minimal Google Display banner concept for '+subject+', simple value proposition area, clear CTA space, high readability, clean professional design.',
    ]
    return [
      subject+' зориулсан premium рекламын зураг, цагаан цэнхэр цэвэр брэнд стиль, гол объект тод, бодит гэрэлтүүлэг, modern social ad, 4:5.',
      subject+' зориулсан 9:16 vertical short-video key visual, mobile-first кадр, эрч хүчтэй composition, бодит бүтээгдэхүүн/хэрэглээ, premium advertising quality.',
      subject+' зориулсан minimal Google Display banner, value proposition болон CTA зай тод, маш уншигдахуйц, цэвэр professional дизайн.',
    ]
  }

  private tip(locale: MarketingLocale, priority:'high'|'medium'|'low', code:string, kind:string) {
    const mn: Record<string,[string,string,string]> = {
      creative:['Creative шинэчил','CTR бага байна. Hook, thumbnail, headline эсвэл эхний 2 секундын санааг сольж A/B test хий.','3 шинэ creative variation үүсгэх'],
      landing:['Landing / offer шалга','Клик байгаа ч conversion сул байна. Message-match, хурд, CTA болон offer-оо шалга.','Landing page + offer audit хийх'],
      targeting:['Audience өргөсгө','CPC өндөр байна. Хэт нарийн targeting болон overlap-ийг багасга.','Broad болон interest test салгах'],
      budget:['Төсөв хамгаал','ROAS сул байна. Шинэ creative/offer батлагдтал budget scale хийхгүй.','Сул ad set-ийг pause санал болгох'],
      scale:['Ялагчийг аажмаар өсгө','CTR/conversion сайн байна. Budget-ийг огцом биш 15–25%-ийн алхмаар өсгө.','Winning campaign scale plan'],
      learning:['Илүү дата цуглуул','Одоогийн датагаар хүчтэй өөрчлөлт хийх шалтгаан бага байна.','48–72 цагийн дараа дахин үнэлэх'],
    }
    const en: Record<string,[string,string,string]> = {
      creative:['Refresh creative','CTR is low. Test a new hook, thumbnail, headline or first two seconds.','Generate three new creative variations'],
      landing:['Audit landing page','Clicks are coming but conversion is weak. Check message match, speed, CTA and offer.','Run landing page + offer audit'],
      targeting:['Broaden audience','CPC is high. Reduce over-narrow targeting and audience overlap.','Split broad vs interest test'],
      budget:['Protect budget','ROAS is weak. Avoid scaling until a better creative or offer proves itself.','Recommend pausing weak ad sets'],
      scale:['Scale the winner carefully','CTR/conversion is healthy. Increase budget gradually in 15–25% steps.','Build winning campaign scale plan'],
      learning:['Collect more data','There is not enough evidence for a major change yet.','Review again after 48–72 hours'],
    }
    const [title,detail,action] = (locale==='mn'?mn:en)[kind]
    return { priority, title:code+' · '+title, detail, action }
  }

  private num(value: unknown) { const n=Number(value||0); return Number.isFinite(n)?Math.max(0,n):0 }
}
