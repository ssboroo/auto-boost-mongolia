import { BadRequestException, Injectable } from '@nestjs/common'
import { TenantService } from '../meta/tenant.service'
import { AdChannel, CampaignRequest } from './ads.types'
import { ShownProvider } from './shown.provider'

const SUPPORTED_CHANNELS: AdChannel[] = [
  'facebook',
  'instagram',
  'google',
  'youtube',
  'tiktok',
  'x',
  'linkedin',
  'microsoft',
]

@Injectable()
export class AdsService {
  constructor(
    private readonly tenant: TenantService,
    private readonly shown: ShownProvider,
  ) {}

  async providers(req: any) {
    await this.tenant.requireContext(req)
    return {
      primary: 'shown',
      providers: [this.shown.status()],
      supportedChannels: SUPPORTED_CHANNELS,
    }
  }

  async quote(req: any, input: CampaignRequest) {
    await this.tenant.requireContext(req)
    const normalized = this.validate(input)
    const feePercent = this.serviceFeePercent()
    const serviceFeeMnt = Math.round(normalized.totalBudgetMnt * feePercent / 100)
    const dailyBudgetMnt = Math.round(normalized.totalBudgetMnt / normalized.durationDays)
    const perChannelBudgetMnt = Math.round(normalized.totalBudgetMnt / normalized.channels.length)

    return {
      currency: 'MNT',
      adBudgetMnt: normalized.totalBudgetMnt,
      serviceFeePercent: feePercent,
      serviceFeeMnt,
      totalPayableMnt: normalized.totalBudgetMnt + serviceFeeMnt,
      dailyBudgetMnt,
      perChannelBudgetMnt,
      channels: normalized.channels,
      durationDays: normalized.durationDays,
      provider: this.shown.status(),
      note: 'Final cross-channel allocation may be optimized by the advertising provider after launch.',
    }
  }

  async preview(req: any, input: CampaignRequest) {
    const context = await this.tenant.requireContext(req)
    const normalized = this.validate(input)
    const quote = await this.quote(req, normalized)

    await this.tenant.writeAudit(
      context.appToken,
      context.workspaceId,
      context.user.id,
      'ads.campaign_previewed',
      'campaign_preview',
      null,
      {
        channels: normalized.channels,
        objective: normalized.objective,
        total_budget_mnt: normalized.totalBudgetMnt,
      },
    )

    return {
      campaign: normalized,
      quote,
      providerPayload: this.shown.buildPayload(normalized),
      submitReady: this.shown.status().liveWritesEnabled,
    }
  }

  async submit(req: any, input: CampaignRequest & { confirm?: boolean }) {
    const context = await this.tenant.requireContext(req)
    if (input.confirm !== true) {
      throw new BadRequestException('Campaign submit хийхийн өмнө confirm=true шаардлагатай.')
    }

    const normalized = this.validate(input)
    const result = await this.shown.createCampaign(normalized)

    await this.tenant.writeAudit(
      context.appToken,
      context.workspaceId,
      context.user.id,
      result.submitted ? 'ads.campaign_submitted' : 'ads.campaign_submit_blocked',
      'campaign',
      null,
      {
        provider: 'shown',
        channels: normalized.channels,
        objective: normalized.objective,
        total_budget_mnt: normalized.totalBudgetMnt,
        mode: result.mode,
      },
    )

    return result
  }

  private validate(input: CampaignRequest): CampaignRequest {
    const supportedChannels = new Set<string>(SUPPORTED_CHANNELS)
    const supportedObjectives = new Set(['messages', 'traffic', 'leads', 'video_views', 'sales'])
    const channels = Array.from(new Set((input?.channels || []).filter((channel) => supportedChannels.has(channel)))) as AdChannel[]

    if (!channels.length) throw new BadRequestException('Доод тал нь нэг сурталчилгааны суваг сонгоно уу.')
    if (!supportedObjectives.has(input?.objective)) throw new BadRequestException('Сурталчилгааны зорилго буруу байна.')

    const totalBudgetMnt = Math.round(Number(input?.totalBudgetMnt || 0))
    const durationDays = Math.round(Number(input?.durationDays || 0))
    if (!Number.isFinite(totalBudgetMnt) || totalBudgetMnt < 10000) throw new BadRequestException('Нийт төсөв хамгийн багадаа 10,000₮ байна.')
    if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 90) throw new BadRequestException('Хугацаа 1-90 хоног байна.')

    const ageMin = Math.max(18, Math.min(65, Math.round(Number(input.audience?.ageMin || 18))))
    const ageMax = Math.max(ageMin, Math.min(65, Math.round(Number(input.audience?.ageMax || 65))))

    return {
      ...input,
      channels,
      totalBudgetMnt,
      durationDays,
      websiteUrl: input.websiteUrl?.trim() || undefined,
      headline: input.headline?.trim() || undefined,
      primaryText: input.primaryText?.trim() || undefined,
      callToAction: input.callToAction?.trim() || undefined,
      audience: {
        country: input.audience?.country?.trim() || 'MN',
        city: input.audience?.city?.trim() || undefined,
        ageMin,
        ageMax,
        interests: (input.audience?.interests || []).map((item) => item.trim()).filter(Boolean).slice(0, 20),
      },
    }
  }

  private serviceFeePercent() {
    const fee = Number(process.env.SERVICE_FEE_PERCENT || 10)
    return Number.isFinite(fee) ? Math.max(0, Math.min(100, fee)) : 10
  }
}
