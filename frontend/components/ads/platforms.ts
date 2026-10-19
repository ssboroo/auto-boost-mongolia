export const platforms = [
  { id: 'meta', name: 'Meta', detail: 'Facebook · Instagram', mark: 'M', color: '#1877f2' },
  { id: 'tiktok', name: 'TikTok', detail: 'Short-form video', mark: '♪', color: '#157d83' },
  { id: 'google', name: 'Google Ads', detail: 'Search · Display · YouTube', mark: 'G', color: '#b46708' },
  { id: 'snapchat', name: 'Snapchat', detail: 'Vertical video · Stories', mark: 'S', color: '#8b7100' },
] as const
export type Platform = typeof platforms[number]['id']
export const draftKey = 'boost_adliftr_draft_v1'
export type Draft = { platform: Platform; objective: string; name: string; headline: string; body: string; url: string; format: string; budget: number; days: number; city: string; ageMin: number; ageMax: number }
export const initialDraft: Draft = { platform: 'meta', objective: 'traffic', name: '', headline: '', body: '', url: '', format: 'image', budget: 300000, days: 7, city: 'Улаанбаатар', ageMin: 18, ageMax: 55 }
export function readDraft(raw: string | null): Draft {
  if (!raw) return initialDraft
  try {
    const d = JSON.parse(raw)
    return { ...initialDraft,
      platform: platforms.some(p => p.id === d.platform) ? d.platform : 'meta',
      objective: ['traffic','sales','leads','video_views','messages'].includes(d.objective) ? d.objective : 'traffic',
      format: ['image','video'].includes(d.format) ? d.format : 'image',
      ...Object.fromEntries(['name','headline','body','url','city'].map(k => [k, typeof d[k] === 'string' ? d[k].slice(0, 4000) : initialDraft[k as keyof Draft]])),
      ...Object.fromEntries(['budget','days','ageMin','ageMax'].map(k => [k, typeof d[k] === 'number' && Number.isFinite(d[k]) ? d[k] : initialDraft[k as keyof Draft]])),
    } as Draft
  } catch { return initialDraft }
}
