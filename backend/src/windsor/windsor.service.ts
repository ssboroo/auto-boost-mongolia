import { BadGatewayException, BadRequestException, Injectable } from '@nestjs/common'

@Injectable()
export class WindsorService {
  private readonly baseUrl = process.env.WINDSOR_BASE_URL || 'https://connectors.windsor.ai'
  private readonly apiKey = process.env.WINDSOR_API_KEY || ''
  private readonly account = process.env.WINDSOR_FACEBOOK_ACCOUNT || ''

  private ensureConfigured() {
    if (!this.apiKey) throw new BadRequestException('WINDSOR_API_KEY тохируулаагүй байна.')
  }

  private async request(path: string, init?: RequestInit) {
    this.ensureConfigured()
    const joiner = path.includes('?') ? '&' : '?'
    const url = `${this.baseUrl}${path}${joiner}api_key=${encodeURIComponent(this.apiKey)}`
    const response = await fetch(url, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    })
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

  getStatus() {
    return {
      configured: Boolean(this.apiKey),
      accountConfigured: Boolean(this.account),
      connector: 'facebook',
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
}
