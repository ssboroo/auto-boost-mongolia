export type AdChannel =
  | 'facebook'
  | 'instagram'
  | 'google'
  | 'youtube'
  | 'tiktok'
  | 'x'
  | 'linkedin'
  | 'microsoft'

export type CampaignObjective =
  | 'messages'
  | 'traffic'
  | 'leads'
  | 'video_views'
  | 'sales'

export type CampaignRequest = {
  name?: string
  channels: AdChannel[]
  objective: CampaignObjective
  totalBudgetMnt: number
  durationDays: number
  websiteUrl?: string
  headline?: string
  primaryText?: string
  callToAction?: string
  audience?: {
    country?: string
    city?: string
    ageMin?: number
    ageMax?: number
    interests?: string[]
  }
}

export type ProviderStatus = {
  id: string
  label: string
  configured: boolean
  liveWritesEnabled: boolean
  channels: AdChannel[]
  mode: 'preview' | 'live'
  note: string
}
