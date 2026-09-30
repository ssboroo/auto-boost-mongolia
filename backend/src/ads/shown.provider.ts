import { BadGatewayException, Injectable } from '@nestjs/common'
import { CampaignRequest, ProviderStatus } from './ads.types'

@Injectable()
export class ShownProvider {
  private readonly apiBase = (process.env.SHOWN_API_BASE_URL || 'https://api.shown.io').replace(/\/$/, '')
  private readonly apiKey = process.env.SHOWN_API_KEY || ''
  private readonly createPath = process.env.SHOWN_CAMPAIGN_CREATE_PATH || ''
  private readonly liveWrites = process.env.SHOWN_LIVE_WRITES === 'true'

  status(): ProviderStatus {
    const configured = Boolean(this.apiKey)
    const liveWritesEnabled = configured && this.liveWrites && Boolean(this.createPath)

    return {
      id: 'shown',
      label: 'Shown',
      configured,
      liveWritesEnabled,
      channels: [
        'facebook',
        'instagram',
        'google',
        'youtube',
        'tiktok',
        'x',
        'linkedin',
        'microsoft',
      ],
      mode: liveWritesEnabled ? 'live' : 'preview',
      note: liveWritesEnabled
        ? 'Shown live multi-channel campaign writes enabled.'
        : 'Shown integration is in safe preview mode until partner credentials and approved write endpoints are configured.',
    }
  }

  buildPayload(input: CampaignRequest) {
    return {
      external_reference: input.name || 'BOOST.MN campaign',
      channels: input.channels,
      objective: input.objective,
      budget: {
        currency: 'MNT',
        total: Math.round(input.totalBudgetMnt),
        duration_days: input.durationDays,
      },
      destination: input.websiteUrl || null,
      creative: {
        headline: input.headline || null,
        primary_text: input.primaryText || null,
        call_to_action: input.callToAction || null,
      },
      audience: {
        country: input.audience?.country || 'MN',
        city: input.audience?.city || null,
        age_min: input.audience?.ageMin || 18,
        age_max: input.audience?.ageMax || 65,
        interests: input.audience?.interests || [],
      },
    }
  }

  async createCampaign(input: CampaignRequest) {
    const status = this.status()
    const payload = this.buildPayload(input)

    if (!status.liveWritesEnabled) {
      return {
        submitted: false,
        provider: 'shown',
        mode: 'preview',
        payload,
        message: 'Shown live write is disabled. Campaign was prepared but not submitted.',
      }
    }

    const response = await fetch(this.apiBase + this.createPath, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + this.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const text = await response.text()
    let data: any = null
    try { data = text ? JSON.parse(text) : null } catch { data = text }

    if (!response.ok) {
      throw new BadGatewayException({
        message: 'Shown campaign request failed.',
        status: response.status,
        detail: data,
      })
    }

    return {
      submitted: true,
      provider: 'shown',
      mode: 'live',
      data,
    }
  }
}
