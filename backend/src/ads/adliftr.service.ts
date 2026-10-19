import { BadGatewayException, ForbiddenException, Injectable, ServiceUnavailableException } from '@nestjs/common'
import { TenantService } from '../meta/tenant.service'

/** Read-only bootstrap. Never exposes the operator API key or launches ads. */
@Injectable()
export class AdliftrService {
  constructor(private readonly tenant: TenantService) {}

  private async authorize(req: any) {
    const context = await this.tenant.requireContext(req)
    // A workspace owner is not necessarily an operator of the shared provider account.
    const operators = (process.env.ADLIFTR_OPERATOR_USER_IDS || '').split(',').map(id => id.trim()).filter(Boolean)
    if (!operators.includes(context.user.id)) throw new ForbiddenException('AdLiftr операторын эрх шаардлагатай.')
    return context
  }

  async status(req: any) {
    await this.authorize(req)
    return {
      provider: 'adliftr',
      configured: Boolean(process.env.ADLIFTR_API_KEY?.trim()),
      platforms: ['meta', 'tiktok', 'google', 'snapchat'],
      campaignWritesEnabled: false,
      note: 'Зөвхөн холболтын шалгалт. Campaign үүсгэх болон тайлангийн схемийг баталгаажуулаагүй.',
    }
  }

  async workspaces(req: any) {
    const context = await this.authorize(req)
    const key = process.env.ADLIFTR_API_KEY?.trim()
    if (!key) throw new ServiceUnavailableException('Сервер дээр ADLIFTR_API_KEY тохируулна уу.')
    let response: Response
    try {
      response = await fetch('https://api.adliftr.com/api/public/v1/workspaces', {
        headers: { Authorization: `Bearer ${key}`, Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
        redirect: 'error',
      })
    } catch {
      throw new BadGatewayException('AdLiftr холболт амжилтгүй эсвэл хугацаа хэтэрсэн.')
    }
    // Do not echo upstream text, headers or credentials into application errors.
    if (!response.ok) throw new BadGatewayException({ message: 'AdLiftr хүсэлт амжилтгүй.', upstreamStatus: response.status })
    let envelope: any
    try { envelope = await response.json() } catch {
      throw new BadGatewayException('AdLiftr JSON хариу буруу байна.')
    }
    if (envelope?.success !== true || envelope.data == null) {
      throw new BadGatewayException('AdLiftr хариу баталгаажаагүй байна.')
    }
    await this.tenant.writeAudit(context.appToken, context.workspaceId, context.user.id,
      'adliftr.connection_checked', 'provider', null, { provider: 'adliftr' })
    return { provider: 'adliftr', connected: true, data: envelope.data }
  }
}
