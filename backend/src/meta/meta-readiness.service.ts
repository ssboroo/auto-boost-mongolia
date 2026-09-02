import { BadGatewayException, Injectable } from '@nestjs/common'
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

  async getReadiness(req: any) {
    const { metaToken, context } = await this.tenant.requireMetaToken(req)
    const baseFields = 'id,account_id,name,currency,timezone_name,account_status,disable_reason,business'
    let result: any
    let billingVisibility = true

    try {
      result = await this.graph('me/adaccounts', metaToken, `${baseFields},funding_source_details`)
    } catch {
      billingVisibility = false
      result = await this.graph('me/adaccounts', metaToken, baseFields)
    }

    const accounts = (result?.data || []).map((account: any) => {
      const status = Number(account.account_status || 0)
      const active = status === 1
      const funding = account.funding_source_details || null
      const hasFundingSource = Boolean(funding && (funding.id || funding.display_string || funding.type || funding.coupon_cents))
      const billingState = billingVisibility ? (hasFundingSource ? 'READY' : 'MISSING') : 'UNKNOWN'
      const ready = active && billingState === 'READY'
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
        ready,
      }
    })

    return {
      workspaceId: context.workspaceId,
      connected: true,
      hasAdAccount: accounts.length > 0,
      billingVisibility,
      ready: accounts.some((account: any) => account.ready),
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
