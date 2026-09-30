export type MarketingLocale = 'mn' | 'en'

export type WebsiteScanRequest = {
  url: string
  locale?: MarketingLocale
}

export type BusinessScanRequest = {
  locale?: MarketingLocale
  websiteUrl?: string
  facebookPageId?: string
  instagramId?: string
}

export type WebsiteScan = {
  url: string
  finalUrl: string
  title: string
  description: string
  category: string
  language: MarketingLocale
  keywords: string[]
  highlights: string[]
  suggestedObjective: 'messages' | 'traffic' | 'leads' | 'video_views' | 'sales'
  suggestedChannels: string[]
  audience: {
    country: string
    ageMin: number
    ageMax: number
    interests: string[]
  }
  campaignSeed: {
    headline: string
    primaryText: string
    callToAction: string
  }
  source: 'website'
  scannedAt: string
}

export type StrategyRequest = {
  locale?: MarketingLocale
  businessName?: string
  category?: string
  description?: string
  businessScan?: any
  goal?: string
  budgetMnt?: number
  durationDays?: number
}

export type CreativeRequest = StrategyRequest & {
  offer?: string
  tone?: 'professional' | 'friendly' | 'bold' | 'premium'
  channels?: string[]
}

export type OptimizationRequest = {
  locale?: MarketingLocale
  channel?: string
  objective?: string
  spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
  leads?: number
  videoViews?: number
  revenue?: number
}

export type AssistantRequest = {
  locale?: MarketingLocale
  message: string
  businessScan?: any
}
