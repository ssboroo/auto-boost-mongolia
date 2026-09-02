import { BadGatewayException, BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common'
import { createHmac, timingSafeEqual } from 'crypto'
import { TenantService } from '../meta/tenant.service'

type FxQuote = {
  base: 'USD'
  quote: 'MNT'
  rate: number
  source: 'bank_of_mongolia' | 'fallback' | 'override'
  rateDate: string
  fetchedAt: string
}

@Injectable()
export class BillingService {
  private readonly supabaseUrl = process.env.SUPABASE_URL || 'https://rnujhqmtusuddxygarto.supabase.co'
  private readonly supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || ''
  private readonly serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  private readonly wireBase = 'https://api.wire.mn/v1'
  private fxCache: { value: FxQuote; expiresAt: number } | null = null

  constructor(private readonly tenant: TenantService) {}

  getFeePercent() {
    const value = Number(process.env.SERVICE_FEE_PERCENT || '10')
    return Number.isFinite(value) && value >= 0 ? value : 10
  }

  async getUsdMntRate(): Promise<FxQuote> {
    const override = Number(process.env.USD_MNT_RATE_OVERRIDE || '')
    if (Number.isFinite(override) && override > 0) {
      return {
        base: 'USD', quote: 'MNT', rate: override, source: 'override',
        rateDate: new Date().toISOString().slice(0, 10), fetchedAt: new Date().toISOString(),
      }
    }

    if (this.fxCache && this.fxCache.expiresAt > Date.now()) return this.fxCache.value

    try {
      const response = await fetch('https://www.mongolbank.mn/en/', {
        headers: { 'User-Agent': 'AutoBoostMongolia/1.0 (+https://auto-boost-mongolia.vercel.app)' },
      })
      const html = await response.text()
      const normalized = html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ')
      const match = normalized.match(/1\s*USD\s*([0-9,]+(?:\.[0-9]+)?)\s*(20\d{2}-\d{2}-\d{2})/i)
      if (!response.ok || !match) throw new Error('USD rate not found')
      const rate = Number(match[1].replace(/,/g, ''))
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Invalid USD rate')
      const value: FxQuote = {
        base: 'USD', quote: 'MNT', rate, source: 'bank_of_mongolia', rateDate: match[2], fetchedAt: new Date().toISOString(),
      }
      this.fxCache = { value, expiresAt: Date.now() + 15 * 60 * 1000 }
      return value
    } catch {
      const rate = Number(process.env.USD_MNT_FALLBACK_RATE || '3595.21')
      const value: FxQuote = {
        base: 'USD', quote: 'MNT', rate, source: 'fallback',
        rateDate: process.env.USD_MNT_FALLBACK_RATE_DATE || '2026-09-01', fetchedAt: new Date().toISOString(),
      }
      this.fxCache = { value, expiresAt: Date.now() + 5 * 60 * 1000 }
      return value
    }
  }

  async quote(metaBudgetUsd: number) {
    const usd = Number(metaBudgetUsd)
    if (!Number.isFinite(usd) || usd <= 0) throw new BadRequestException('Meta boost төсөв USD дүнгээр 0-ээс их байна.')
    const fx = await this.getUsdMntRate()
    const feePercent = this.getFeePercent()
    const adBudgetMnt = Math.round(usd * fx.rate)
    const serviceFeeMnt = Math.round(adBudgetMnt * feePercent / 100)
    return {
      metaBudgetUsd: Math.round(usd * 100) / 100,
      fx,
      adBudgetMnt,
      serviceFeePercent: feePercent,
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
    const pricing = await this.quote(input.metaBudgetUsd)
    if (pricing.serviceFeeMnt <= 0) throw new BadRequestException('Үйлчилгээний шимтгэл 0 байна.')

    const reference = `ABF-${Date.now()}-${context.workspaceId.slice(0, 8)}`
    const intent = await this.wirePost('/payment_intents', wireKey, `intent-${reference}`, {
      amount: String(Math.round(pricing.serviceFeeMnt * 100)),
      currency: 'MNT',
      description: `Auto Boost үйлчилгээний шимтгэл · $${pricing.metaBudgetUsd}`,
      reference,
    })
    if (!intent?.id) throw new BadGatewayException('Wire PaymentIntent ID буцаасангүй.')

    const frontend = process.env.FRONTEND_ORIGIN || 'http://localhost:3000'
    const checkout = await this.wirePost('/checkout/sessions', wireKey, `checkout-${reference}`, {
      payment_intent: intent.id,
      success_url: `${frontend}/?payment=success&payment_intent=${encodeURIComponent(intent.id)}`,
    })
    if (!checkout?.url) throw new BadGatewayException('Wire checkout URL буцаасангүй.')

    const record = {
      workspace_id: context.workspaceId,
      user_id: context.user.id,
      ad_draft_id: input.adDraftId || null,
      meta_budget_usd: pricing.metaBudgetUsd,
      fx_rate_mnt_per_usd: pricing.fx.rate,
      ad_budget_mnt: pricing.adBudgetMnt,
      service_fee_percent: pricing.serviceFeePercent,
      service_fee_mnt: pricing.serviceFeeMnt,
      total_display_mnt: pricing.totalDisplayMnt,
      fx_source: pricing.fx.source,
      fx_rate_date: pricing.fx.rateDate,
      wire_payment_intent_id: intent.id,
      wire_checkout_session_id: checkout.id || null,
      wire_status: intent.status || 'requires_payment_method',
      wire_checkout_url: checkout.url,
      updated_at: new Date().toISOString(),
    }
    await this.userRest(context.appToken, '/rest/v1/service_fee_payments', {
      method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(record),
    })
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id, 'billing.fee_checkout_created', 'service_fee_payment', intent.id, {
      service_fee_mnt: pricing.serviceFeeMnt, meta_budget_usd: pricing.metaBudgetUsd, fx_rate: pricing.fx.rate,
    })

    return { ...pricing, paymentIntentId: intent.id, checkoutSessionId: checkout.id || null, checkoutUrl: checkout.url }
  }

  async getPayment(req: any, paymentIntentId: string) {
    if (!paymentIntentId) throw new BadRequestException('payment_intent шаардлагатай.')
    const context = await this.tenant.requireContext(req)
    const rows = await this.userRest<any[]>(context.appToken, `/rest/v1/service_fee_payments?select=*&wire_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}&workspace_id=eq.${encodeURIComponent(context.workspaceId)}&limit=1`)
    return rows?.[0] || null
  }

  async handleWireWebhook(rawBody: Buffer, signature: string) {
    const secret = process.env.WIRE_WEBHOOK_SECRET || ''
    if (!secret) throw new UnauthorizedException('WIRE_WEBHOOK_SECRET тохируулаагүй байна.')
    if (!rawBody?.length || !signature) throw new UnauthorizedException('Wire webhook signature байхгүй байна.')

    const parts = Object.fromEntries(signature.split(',').map((part) => part.trim().split('=')))
    const timestamp = Number(parts.t)
    const supplied = String(parts.v1 || '')
    if (!timestamp || !supplied || Math.abs(Date.now() / 1000 - timestamp) > 300) throw new UnauthorizedException('Wire webhook хугацаа/гарын үсэг хүчингүй.')

    const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody.toString('utf8')}`).digest('hex')
    const a = Buffer.from(expected, 'hex')
    const b = Buffer.from(supplied, 'hex')
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new UnauthorizedException('Wire webhook гарын үсэг таарахгүй байна.')

    const event: any = JSON.parse(rawBody.toString('utf8'))
    const eventId = event?.id
    const eventType = event?.type
    const object = event?.data?.object || event?.data || {}
    const paymentIntentId = object?.id || object?.payment_intent || event?.payment_intent
    if (!eventId || !eventType) return { ok: true, ignored: true }

    if (eventType === 'payment_intent.succeeded' && paymentIntentId) {
      await this.serviceRest(`/rest/v1/service_fee_payments?wire_payment_intent_id=eq.${encodeURIComponent(paymentIntentId)}`, {
        method: 'PATCH',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({ wire_status: 'succeeded', wire_event_id: eventId, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() }),
      })
    }
    return { ok: true }
  }

  private async wirePost(path: string, apiKey: string, idempotencyKey: string, data: Record<string, string>) {
    const body = new URLSearchParams(data)
    const response = await fetch(`${this.wireBase}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': idempotencyKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
    const text = await response.text()
    let result: any = null
    try { result = text ? JSON.parse(text) : null } catch { result = text }
    if (!response.ok) throw new BadGatewayException({ message: 'Wire төлбөрийн хүсэлт амжилтгүй.', status: response.status, detail: result?.message || result })
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
    const response = await fetch(`${this.supabaseUrl}${path}`, {
      ...init,
      headers: {
        apikey: apiKey,
        Authorization: `Bearer ${bearer}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    })
    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!response.ok) throw new BadGatewayException({ message: 'Billing data хүсэлт амжилтгүй.', status: response.status, detail: data?.message || data })
    return data as T
  }
}
