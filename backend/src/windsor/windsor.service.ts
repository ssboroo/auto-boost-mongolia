import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class WindsorService {
  private readonly baseUrl = process.env.WINDSOR_BASE_URL || 'https://connectors.windsor.ai'
  private readonly onboardUrl = process.env.WINDSOR_ONBOARD_URL || 'https://onboard.windsor.ai'
  private readonly apiKey = process.env.WINDSOR_API_KEY || ''
  private readonly account = process.env.WINDSOR_FACEBOOK_ACCOUNT || ''

  private ensureConfigured() {
    if (!this.apiKey) throw new BadRequestException('WINDSOR_API_KEY тохируулаагүй байна.')
  }

  private async parseResponse(response: Response) {
    const text = await response.text()
    let data: any = text
    try { data = text ? JSON.parse(text) : null } catch {}
    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Windsor.ai хүсэлт амжилтгүй боллоо.',
        status: response.status,
        details: data,
      })
    }
    return data
  }

  private async request(path: string, init?: RequestInit) {
    this.ensureConfigured()
    const joiner = path.includes('?') ? '&' : '?'
    const url = `${this.baseUrl}${path}${joiner}api_key=${encodeURIComponent(this.apiKey)}`
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
    return this.parseResponse(response)
  }

  getStatus() {
    return {
      configured: Boolean(this.apiKey),
      accountConfigured: Boolean(this.account),
      connector: 'facebook',
    }
  }

  async getConnectInfo() {
    this.ensureConfigured()
    const url = `${this.onboardUrl}/api/mcp/connectors/facebook/connect-info?api_key=${encodeURIComponent(this.apiKey)}`
    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    const data = await this.parseResponse(response)
    return {
      connector: data?.connector,
      authType: data?.auth_type,
      connectUrl: data?.connect_url,
    }
  }

  listActions() {
    return this.request('/facebook/actions')
  }

  executeAction(action: string, params: Record<string, unknown>, account?: string) {
    const targetAccount = account || this.account
    if (!targetAccount) throw new BadRequestException('Facebook connected account ID тохируулаагүй байна.')
    if (!action) throw new BadRequestException('Action шаардлагатай.')
    return this.request('/facebook/actions', {
      method: 'POST',
      body: JSON.stringify({ account: targetAccount, action, params: params || {} }),
    })
  }

  queryFacebook(fields: string[], extra: Record<string, string> = {}) {
    if (!fields?.length) throw new BadRequestException('fields хоосон байна.')
    const params = new URLSearchParams({ fields: fields.join(','), ...extra })
    return this.request(`/facebook?${params.toString()}`)
  }

  async listAccounts() {
    const result = await this.queryFacebook(['account_id', 'account_name'], { date_preset: 'last_30d' })
    const rows = Array.isArray(result?.data) ? result.data : []
    const unique = new Map<string, { id: string; name: string }>()
    for (const row of rows) {
      if (row?.account_id) unique.set(String(row.account_id), { id: String(row.account_id), name: String(row.account_name || row.account_id) })
    }
    return [...unique.values()]
  }
}
