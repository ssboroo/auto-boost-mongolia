import { BadGatewayException, BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common'
import { createHash, createHmac, timingSafeEqual } from 'crypto'
import { TenantService, type WorkspaceContext } from '../meta/tenant.service'

type FxQuote = {
  base: 'USD'
  quote: 'MNT'
  rate: number
  source: 'bank_of_mongolia' | 'fallback' | 'override'
  rateDate: string
  fetchedAt: string
}

type BillingSettings = {
  serviceFeePercent: number
  fallbackUsdMntRate: number
  fallbackRateDate: string
}

@Injectable()
export class BillingService {
  private readonly supabaseUrl = process.env.SUPABASE_URL || 'https://rnujhqmtusuddxygarto.supabase.co'
  private readonly supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || ''
  private readonly serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  private readonly wireBase = 'https://api.wire.mn/v1'
  private readonly wireWebhookIp = process.env.WIRE_WEBHOOK_IP || '65.109.117.186'
  private fxCache = new Map<string, { value: FxQuote; expiresAt: number }>()

  constructor(private readonly tenant: TenantService) {}

  private defaults(): BillingSettings {
    return {
      serviceFeePercent: this.safeNumber(process.env.SERVICE_FEE_PERCENT, 10),
      fallbackUsdMntRate: this.safeNumber(process.env.USD_MNT_FALLBACK_RATE, 3595.21),
      fallbackRateDate: process.env.USD_MNT_FALLBACK_RATE_DATE || new Date().toISOString().slice(0, 10),
    }
  }

  private safeNumber(value: unknown, fallback: number) {
    const n = Number(value)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  private async contextSettings(context: WorkspaceContext): Promise<BillingSettings> {
    const rows = await this.userRest<any[]>(context.appToken, `/rest/v1/billing_settings?select=service_fee_percent,fallback_usd_mnt_rate,fallback_rate_date&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&limit=1`)
    const row = rows?.[0]
    const d = this.defaults()
    return row ? {
      serviceFeePercent: this.safeNumber(row.service_fee_percent, d.serviceFeePercent),
      fallbackUsdMntRate: this.safeNumber(row.fallback_usd_mnt_rate, d.fallbackUsdMntRate),
      fallbackRateDate: row.fallback_rate_date || d.fallbackRateDate,
    } : d
  }

  async getUsdMntRate(req?: any): Promise<FxQuote> {
    let settings = this.defaults()
    let cacheKey = 'default'
    if (req) {
      try {
        const context = await this.tenant.requireContext(req)
        settings = await this.contextSettings(context)
        cacheKey = context.workspaceId
      } catch {
        // Public/health callers can still receive the environment-backed reference rate.
      }
    }

    const override = Number(process.env.USD_MNT_RATE_OVERRIDE || '')
    if (Number.isFinite(override) && override > 0) {
      return { base: 'USD', quote: 'MNT', rate: override, source: 'override', rateDate: new Date().toISOString().slice(0, 10), fetchedAt: new Date().toISOString() }
    }

    const cached = this.fxCache.get(cacheKey)
    if (cached && cached.expiresAt > Date.now()) return cached.value

    try {
      const response = await fetch('https://www.mongolbank.mn/en/', { headers: { 'User-Agent': 'AutoBoostMongolia/1.0 (+https://auto-boost-mongolia.vercel.app)' } })
      const html = await response.text()
      const normalized = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
      const match = normalized.match(/1\s*USD\s*([0-9,]+(?:\.[0-9]+)?)\s*(20\d{2}-\d{2}-\d{2})/i)
      if (!response.ok || !match) throw new Error('USD rate not found')
      const rate = Number(match[1].replace(/,/g, ''))
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid USD rate')
      const value: FxQuote = { base: 'USD', quote: 'MNT', rate, source: 'bank_of_mongolia', rateDate: match[2], fetchedAt: new Date().toISOString() }
      this.fxCache.set(cacheKey, { value, expiresAt: Date.now() + 15 * 60 * 1000 })
      return value
    } catch {
      const value: FxQuote = { base: 'USD', quote: 'MNT', rate: settings.fallbackUsdMntRate, source: 'fallback', rateDate: settings.fallbackRateDate, fetchedAt: new Date().toISOString() }
      this.fxCache.set(cacheKey, { value, expiresAt: Date.now() + 5 * 60 * 1000 })
      return value
    }
  }

  async quote(req: any, metaBudgetUsd: number) {
    const context = await this.tenant.requireContext(req)
    return this.quoteForContext(context, metaBudgetUsd)
  }

  private async quoteForContext(context: WorkspaceContext, metaBudgetUsd: number) {
    const usd = Number(metaBudgetUsd)
    if (!Number.isFinite(usd) || usd <= 0) throw new BadRequestException('Meta boost төсөв USD дүнгээр 0-ээс их байна.')
    const settings = await this.contextSettings(context)
    const fx = await this.getUsdMntRate({ headers: { 'x-app-access-token': context.appToken } })
    const adBudgetMnt = Math.round(usd * fx.rate)
    const serviceFeeMnt = Math.round(adBudgetMnt * settings.serviceFeePercent / 100)
    return {
      metaBudgetUsd: Math.round(usd * 100) / 100,
      fx,
      adBudgetMnt,
      serviceFeePercent: settings.serviceFeePercent,
      serviceFeeMnt,
      totalDisplayMnt: adBudgetMnt + serviceFeeMnt,
      currency: 'MNT',
      note: 'Meta зарын төсөв ба Auto Boost үйлчилгээний шимтгэл тусдаа тооцогдоно.',
    }
  }

  async createFeeCheckout(req: any, input: { metaBudgetUsd: number; adDraftId?: string }) {
    const wireKey = process.env.WIRE_API_KEY || ''
    if (!wireKey) throw new BadRequestException('WIRE_API_KEY тохируулаагүй байна.')
    const context = await this.tenant.requireContext(req)
    const pricing = await this.quoteForContext(context, input.metaBudgetUsd)
    if (pricing.serviceFeeMnt <= 0) throw new BadRequestException('Үйлчилгээний шимтгэл 0 байна.')

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString()
    const pending = await this.userRest<any[]>(context.appToken,
      `/rest/v1/service_fee_payments?select=*&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&user_id=eq.${encodeURIComponent(context.user.id)}&meta_budget_usd=eq.${encodeURIComponent(String(pricing.metaBudgetUsd))}&wire_status=in.(requires_payment_method,pending,processing)&created_at=gte.${encodeURIComponent(tenMinutesAgo)}&order=created_at.desc&limit=1`)
    if (pending?.[0]?.wire_checkout_url) {
      return { ...pricing, paymentIntentId: pending[0].wire_payment_intent_id, checkoutSessionId: pending[0].wire_checkout_session_id, checkoutUrl: pending[0].wire_checkout_url, reused: true }
    }

    const bucket = Math.floor(Date.now() / 600000)
    const stableKey = createHash('sha256').update(`${context.workspaceId}:${context.user.id}:${pricing.metaBudgetUsd}:${bucket}`).digest('hex').slice(0, 32)
    const reference = `ABF-${bucket}-${context.workspaceId.slice(0, 8)}`
    const intent = await this.wirePost('/payment_intents', wireKey, `intent-${stableKey}`, {
      amount: String(Math.round(pricing.serviceFeeMnt * 100)), currency: 'MNT',
      description: `Auto Boost үйлчилгээний шимтгэл · $${pricing.metaBudgetUsd}`, reference,
    })
    if (!intent?.id) throw new BadGatewayException('Төлбөрийн PaymentIntent ID буцаасангүй.')

    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
    const checkout = await this.wirePost('/checkout/sessions', wireKey, `checkout-${stableKey}`, {
      payment_intent: intent.id,
      success_url: `${frontend}/transactions?payment=success&payment_intent=${encodeURIComponent(intent.id)}`,
    })
    if (!checkout?.url) throw new BadGatewayException('Төлбөрийн checkout URL буцаасангүй.')

    const record = {
      workspace_id: context.workspaceId, user_id: context.user.id, ad_draft_id: input.adDraftId || null,
      meta_budget_usd: pricing.metaBudgetUsd, fx_rate_mnt_per_usd: pricing.fx.rate,
      ad_budget_mnt: pricing.adBudgetMnt, service_fee_percent: pricing.serviceFeePercent,
      service_fee_mnt: pricing.serviceFeeMnt, total_display_mnt: pricing.totalDisplayMnt,
      fx_source: pricing.fx.source, fx_rate_date: pricing.fx.rateDate,
      wire_payment_intent_id: intent.id, wire_checkout_session_id: checkout.id || null,
      wire_status: intent.status || 'requires_payment_method', wire_checkout_url: checkout.url,
      updated_at: new Date().toISOString(),
    }
    await this.userRest(context.appToken, '/rest/v1/service_fee_payments', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record) })
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'billing.fee_checkout_created', 'service_fee_payment', intent.id, { service_fee_mnt: pricing.serviceFeeMnt, meta_budget_usd: pricing.metaBudgetUsd, fx_rate: pricing.fx.rate })
    return { ...pricing, paymentIntentId: intent.id, checkoutSessionId: checkout.id || null, checkoutUrl: checkout.url, reused: false }
  }

  async getPayment(req: any, paymentIntentId: string) {
    if (!paymentIntentId) throw new BadRequestException('payment_intent шаардлагатай.')
    const context = await this.tenant.requireContext(req)
    const rows = await this.userRest<any[]>(context.appToken, `/rest/v1/service_fee_payments?select=*&wire_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&limit=1`)
    return rows?.[0] || null
  }

  async getHistory(req: any, limit = 50) {
    const context = await this.tenant.requireContext(req)
    const safeLimit = Math.min(100, Math.max(1, Number.isFinite(limit) ? limit : 50))
    return this.userRest<any[]>(context.appToken, `/rest/v1/service_fee_payments?select=id,receipt_number,meta_budget_usd,fx_rate_mnt_per_usd,ad_budget_mnt,service_fee_percent,service_fee_mnt,total_display_mnt,wire_status,failure_reason,paid_at,created_at&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&order=created_at.desc&limit=${safeLimit}`)
  }

  async getReceipt(req: any, id: string) {
    if (!id) throw new BadRequestException('receipt id шаардлагатай.')
    const context = await this.tenant.requireContext(req)
    const rows = await this.userRest<any[]>(context.appToken, `/rest/v1/service_fee_payments?select=*&id=eq.${encodeURIComponent(id)}&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&limit=1`)
    const payment = rows?.[0]
    if (!payment) throw new BadRequestException('Баримт олдсонгүй.')
    return {
      id: payment.id,
      receiptNumber: payment.receipt_number,
      status: payment.wire_status,
      issuedAt: payment.paid_at || payment.created_at,
      metaBudgetUsd: Number(payment.meta_budget_usd),
      fxRate: Number(payment.fx_rate_mnt_per_usd),
      adBudgetMnt: Number(payment.ad_budget_mnt),
      serviceFeePercent: Number(payment.service_fee_percent),
      serviceFeeMnt: Number(payment.service_fee_mnt),
      totalDisplayMnt: Number(payment.total_display_mnt),
      providerLabel: 'QPay',
    }
  }

  async getAdminSettings(req: any) {
    const context = await this.requireAdmin(req)
    return { workspaceId: context.workspaceId, ...(await this.contextSettings(context)) }
  }

  async updateAdminSettings(req: any, input: { serviceFeePercent?: number; fallbackUsdMntRate?: number; fallbackRateDate?: string }) {
    const context = await this.requireAdmin(req)
    const current = await this.contextSettings(context)
    const serviceFeePercent = input.serviceFeePercent === undefined ? current.serviceFeePercent : Number(input.serviceFeePercent)
    const fallbackUsdMntRate = input.fallbackUsdMntRate === undefined ? current.fallbackUsdMntRate : Number(input.fallbackUsdMntRate)
    if (!Number.isFinite(serviceFeePercent) || serviceFeePercent < 0 || serviceFeePercent > 100) throw new BadRequestException('Шимтгэлийн хувь 0–100 байна.')
    if (!Number.isFinite(fallbackUsdMntRate) || fallbackUsdMntRate <= 0) throw new BadRequestException('Fallback ханш 0-ээс их байна.')
    const body = {
      workspace_id: context.workspaceId,
      service_fee_percent: serviceFeePercent,
      fallback_usd_mnt_rate: fallbackUsdMntRate,
      fallback_rate_date: input.fallbackRateDate || current.fallbackRateDate,
      updated_by: context.user.id,
      updated_at: new Date().toISOString(),
    }
    const rows = await this.userRest<any[]>(context.appToken, '/rest/v1/billing_settings?on_conflict=workspace_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify(body) })
    this.fxCache.delete(context.workspaceId)
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'billing.settings_updated', 'billing_settings', context.workspaceId, { service_fee_percent: serviceFeePercent, fallback_usd_mnt_rate: fallbackUsdMntRate })
    return rows?.[0] || body
  }

  async getAdminOverview(req: any) {
    const context = await this.requireAdmin(req)
    const [payments, audits, webhookErrors] = await Promise.all([
      this.userRest<any[]>(context.appToken, `/rest/v1/service_fee_payments?select=id,receipt_number,wire_status,service_fee_mnt,meta_budget_usd,failure_reason,retry_count,created_at,paid_at&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&order=created_at.desc&limit=100`),
      this.userRest<any[]>(context.appToken, `/rest/v1/audit_logs?select=action,entity_type,entity_id,metadata,created_at&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&order=created_at.desc&limit=50`),
      this.serviceRest<any[]>('/rest/v1/payment_webhook_events?select=event_id,event_type,payment_intent_id,status,attempt_count,last_error,received_at,processed_at&status=eq.error&order=updated_at.desc&limit=25'),
    ])
    const succeeded = payments.filter((p) => p.wire_status === 'succeeded')
    const failed = payments.filter((p) => ['failed','canceled'].includes(p.wire_status))
    return {
      summary: {
        transactions: payments.length,
        succeeded: succeeded.length,
        failed: failed.length,
        serviceFeesMnt: succeeded.reduce((sum, p) => sum + Number(p.service_fee_mnt || 0), 0),
        webhookErrors: webhookErrors.length,
      },
      payments,
      auditLogs: audits,
      webhookErrors,
      checkedAt: new Date().toISOString(),
    }
  }

  async handleWireWebhook(rawBody: Buffer, signature: string, clientIp: string) {
    const normalizedIp = String(clientIp || '').replace(/^::ffff:/, '')
    if (normalizedIp !== this.wireWebhookIp) throw new UnauthorizedException('Төлбөрийн webhook source IP зөвшөөрөгдөөгүй байна.')
    const secret = process.env.WIRE_WEBHOOK_SECRET || ''
    if (!secret) throw new UnauthorizedException('WIRE_WEBHOOK_SECRET тохируулаагүй байна.')
    if (!rawBody?.length || !signature) throw new UnauthorizedException('Webhook signature байхгүй байна.')

    const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')))
    const timestamp = Number(parts.t)
    const supplied = String(parts.v1 || '')
    if (!timestamp || !supplied || Math.abs(Date.now() / 1000 - timestamp) >= 300) throw new UnauthorizedException('Webhook хугацаа/гарын үсэг хүчингүй.')
    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex')
    const a = Buffer.from(expected, 'hex'); const b = Buffer.from(supplied, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Webhook гарын үсэг таарахгүй байна.')

    let event: any
    try { event = JSON.parse(rawBody.toString('utf8')) } catch { throw new BadRequestException('Webhook JSON буруу байна.') }
    const eventId = String(event?.id || '')
    const eventType = String(event?.type || '')
    if (!eventType) return { ok: true, ignored: true }
    if (eventType === 'endpoint.verification') return { ok: true, verified: true }

    const object = event?.data?.object || event?.data || {}
    const paymentIntentId = String(object?.id || object?.payment_intent || event?.payment_intent || '')
    const existing = eventId ? await this.serviceRest<any[]>(`/rest/v1/payment_webhook_events?select=*&provider=eq.wire&event_id=eq.${encodeURIComponent(eventId)}&limit=1`) : []
    if (existing?.[0]?.status === 'processed') return { ok: true, duplicate: true }

    const inboxBody = { provider: 'wire', event_id: eventId || createHash('sha256').update(rawBody).digest('hex'), event_type: eventType, payment_intent_id: paymentIntentId || null, status: 'processing', attempt_count: Number(existing?.[0]?.attempt_count || 0) + 1, updated_at: new Date().toISOString() }
    if (existing?.[0]?.id) {
      await this.serviceRest(`/rest/v1/payment_webhook_events?id=eq.${existing[0].id}`, { method: 'PATCH', body: JSON.stringify(inboxBody) })
    } else {
      await this.serviceRest('/rest/v1/payment_webhook_events', { method: 'POST', body: JSON.stringify(inboxBody) })
    }

    try {
      if (eventType === 'payment_intent.succeeded' && paymentIntentId) {
        const receiptNumber = this.receiptNumber(paymentIntentId)
        await this.serviceRest(`/rest/v1/service_fee_payments?wire_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ wire_status: 'succeeded', wire_event_id: eventId || null, receipt_number: receiptNumber, failure_reason: null, paid_at: new Date().toISOString(), last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        })
      } else if (['payment_intent.failed','payment_intent.payment_failed','payment_intent.canceled'].includes(eventType) && paymentIntentId) {
        const status = eventType.endsWith('canceled') ? 'canceled' : 'failed'
        const reason = String(object?.last_payment_error?.message || object?.failure_message || event?.message || 'Төлбөр амжилтгүй.')
        await this.serviceRest(`/rest/v1/service_fee_payments?wire_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, {
          method: 'PATCH', headers: { Prefer: 'return=minimal' },
          body: JSON.stringify({ wire_status: status, wire_event_id: eventId || null, failure_reason: reason, last_event_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
        })
      }
      await this.serviceRest(`/rest/v1/payment_webhook_events?provider=eq.wire&event_id=eq.${encodeURIComponent(inboxBody.event_id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'processed', last_error: null, processed_at: new Date().toISOString(), updated_at: new Date().toISOString() }) })
      return { ok: true }
    } catch (error: any) {
      await this.serviceRest(`/rest/v1/payment_webhook_events?provider=eq.wire&event_id=eq.${encodeURIComponent(inboxBody.event_id)}`, { method: 'PATCH', body: JSON.stringify({ status: 'error', last_error: String(error?.message || error), updated_at: new Date().toISOString() }) }).catch(() => undefined)
      throw error
    }
  }

  private receiptNumber(paymentIntentId: string) {
    const day = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const suffix = createHash('sha256').update(paymentIntentId).digest('hex').slice(0, 10).toUpperCase()
    return `AB-${day}-${suffix}`
  }

  private async requireAdmin(req: any) {
    const context = await this.tenant.requireContext(req)
    if (!['owner','admin'].includes(context.role)) throw new ForbiddenException('Admin эрх шаардлагатай.')
    return context
  }

  private async wirePost(path: string, apiKey: string, idempotencyKey: string, data: Record<string, string>) {
    const body = new URLSearchParams(data)
    const response = await fetch(`${this.wireBase}${path}`, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Idempotency-Key': idempotencyKey, 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body })
    const text = await response.text(); let result: any = null
    try { result = text ? JSON.parse(text) : null } catch { result = text }
    if (!response.ok) throw new BadGatewayException({ message: 'Төлбөрийн хүсэлт амжилтгүй.', status: response.status, detail: result?.message || result })
    return result
  }

  private async userRest<T = any>(appToken: string, path: string, init: RequestInit = {}): Promise<T> {
    return this.supabaseRest<T>(this.supabaseKey, appToken, path, init)
  }

  private async serviceRest<T = any>(path: string, init: RequestInit = {}): Promise<T> {
    if (!this.serviceRoleKey) throw new UnauthorizedException('SUPABASE_SERVICE_ROLE_KEY тохируулаагүй байна.')
    return this.supabaseRest<T>(this.serviceRoleKey, this.serviceRoleKey, path, init)
  }

  private async supabaseRest<T>(apiKey: string, bearer: string, path: string, init: RequestInit): Promise<T> {
    const response = await fetch(`${this.supabaseUrl}${path}`, { ...init, headers: { apikey: apiKey, Authorization: `Bearer ${bearer}`, Accept: 'application/json', ...(init.body ? { 'Content-Type': 'application/json' } : {}), ...(init.headers || {}) } })
    const text = await response.text(); let data: any = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!response.ok) throw new BadGatewayException({ message: 'Billing data хүсэлт амжилтгүй.', status: response.status, detail: data?.message || data })
    return data as T
  }
}
