import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'
import { TenantService } from './tenant.service'

@Injectable()
export class MetaReadinessService {
  private readonly graphVersion = process.env.META_GRAPH_VERSION || 'v25.0'
  private readonly graphBase = 'https://graph.facebook.com'

  constructor(private readonly tenant: TenantService) {}

  private async graph(path: string, token: string, fields: string) {
    const params = new URLSearchParams({ access_token: token, fields, limit: '100' })
    const response = await fetch(`${this.graphBase}/${this.graphVersion}/${path}?${params.toString()}`, { headers: { Accept: 'application/json' } })
    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }
    if (!response.ok || data?.error) {
      throw new BadGatewayException({ message: data?.error?.message || 'Meta Ad Account шалгалт амжилтгүй.', code: data?.error?.code, status: response.status })
    }
    return data
  }

  private statusLabel(status: number) {
    const labels: Record<number, string> = {
      1: 'ACTIVE', 2: 'DISABLED', 3: 'UNSETTLED', 7: 'PENDING_RISK_REVIEW', 8: 'PENDING_SETTLEMENT',
      9: 'IN_GRACE_PERIOD', 100: 'PENDING_CLOSURE', 101: 'CLOSED', 201: 'ANY_ACTIVE', 202: 'ANY_CLOSED',
    }
    return labels[status] || `STATUS_${status}`
  }

  private guardState(status: number, billingState: 'READY' | 'MISSING' | 'UNKNOWN') {
    if ([3, 8, 9].includes(status)) return 'PAYMENT_FAILED' as const
    if (status !== 1) return 'ACCOUNT_BLOCKED' as const
    if (billingState === 'MISSING') return 'PAYMENT_METHOD_MISSING' as const
    if (billingState === 'UNKNOWN') return 'BILLING_CHECK_REQUIRED' as const
    return 'READY' as const
  }

  private mapAccount(account: any, billingVisibility: boolean) {
    const status = Number(account.account_status || 0)
    const funding = account.funding_source_details || null
    const hasFundingSource = Boolean(funding && (funding.id || funding.display_string || funding.type || funding.coupon_cents))
    const billingState: 'READY' | 'MISSING' | 'UNKNOWN' = billingVisibility ? (hasFundingSource ? 'READY' : 'MISSING') : 'UNKNOWN'
    const paymentGuard = this.guardState(status, billingState)
    const paymentFailed = paymentGuard === 'PAYMENT_FAILED'
    const ready = paymentGuard === 'READY'

    return {
      id: account.id,
      accountId: account.account_id,
      name: account.name,
      currency: account.currency,
      timezoneName: account.timezone_name,
      accountStatus: status,
      accountStatusLabel: this.statusLabel(status),
      disableReason: account.disable_reason || 0,
      business: account.business || null,
      billingState,
      paymentGuard,
      paymentFailed,
      ready,
      userMessage: paymentFailed
        ? 'Meta зарын төлбөр амжилтгүй эсвэл outstanding balance байна. Картаа цэнэглэж/төлбөрөө шийдээд Дахин шалгах дарна уу.'
        : paymentGuard === 'PAYMENT_METHOD_MISSING'
          ? 'Meta Ad Account дээр payment method холбоогүй байна.'
          : paymentGuard === 'BILLING_CHECK_REQUIRED'
            ? 'Meta API payment method-ийн төлөвийг харах боломжгүй байна. Meta Billing дээр шалгана уу.'
            : paymentGuard === 'ACCOUNT_BLOCKED'
              ? 'Ad Account ACTIVE биш байна. Account issue/restriction-ээ Meta дээр шийднэ үү.'
              : 'Boost хийхэд billing бэлэн.',
    }
  }

  private async accountsForToken(metaToken: string) {
    const baseFields = 'id,account_id,name,currency,timezone_name,account_status,disable_reason,business'
    let result: any
    let billingVisibility = true

    try {
      result = await this.graph('me/adaccounts', metaToken, `${baseFields},funding_source_details`)
    } catch {
      billingVisibility = false
      result = await this.graph('me/adaccounts', metaToken, baseFields)
    }

    return {
      billingVisibility,
      accounts: (result?.data || []).map((account: any) => this.mapAccount(account, billingVisibility)),
    }
  }

  async assertCanActivate(metaToken: string, objectId: string) {
    if (!objectId) throw new BadRequestException('Meta object ID шаардлагатай.')
    const object = await this.graph(objectId, metaToken, 'id,account_id')
    const rawAccountId = String(object?.account_id || '')
    if (!rawAccountId) throw new BadRequestException('Meta object-ийн Ad Account тодорхойлж чадсангүй.')

    const { accounts } = await this.accountsForToken(metaToken)
    const account = accounts.find((item: any) => String(item.accountId) === rawAccountId || String(item.id) === `act_${rawAccountId}`)
    if (!account) throw new BadRequestException('Энэ зарын Ad Account readiness жагсаалтаас олдсонгүй.')

    if (!account.ready) {
      throw new BadRequestException({
        message: account.userMessage,
        code: account.paymentGuard,
        adAccountId: account.accountId,
        accountStatus: account.accountStatusLabel,
        billingState: account.billingState,
        billingUrl: 'https://business.facebook.com/billing_hub/',
      })
    }

    return account
  }

  async getReadiness(req: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const { accounts, billingVisibility } = await this.accountsForToken(metaToken)

    return {
      workspaceId: context.workspaceId,
      connected: true,
      hasAdAccount: accounts.length > 0,
      billingVisibility,
      ready: accounts.some((account: any) => account.ready),
      paymentFailed: accounts.some((account: any) => account.paymentFailed),
      accounts,
      setup: {
        createAdAccountUrl: 'https://business.facebook.com/settings/ad-accounts',
        adsManagerUrl: 'https://adsmanager.facebook.com/',
        billingUrl: 'https://business.facebook.com/billing_hub/',
      },
      note: billingVisibility
        ? 'Meta API-гаас Ad Account болон funding source мэдээллийг шалгав.'
        : 'Meta API billing source-г энэ хэрэглэгч/permission дээр харуулахгүй байна. Meta Billing хэсэгт payment method-оо шалгаад дахин шалгана уу.',
    }
  }
}
