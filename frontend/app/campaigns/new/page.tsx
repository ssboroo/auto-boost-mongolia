'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Facebook, Globe2, Instagram, Linkedin, Music2, ShieldCheck, Sparkles, Youtube } from 'lucide-react'
import AppShell from '../../../components/layout/AppShell'
import { apiFetch } from '../../../lib/api'
import styles from './page.module.css'

type Channel = 'facebook' | 'instagram' | 'google' | 'youtube' | 'tiktok' | 'x' | 'linkedin' | 'microsoft'
type Objective = 'messages' | 'traffic' | 'leads' | 'video_views' | 'sales'

type ProviderStatus = {
  id: string
  label: string
  configured: boolean
  liveWritesEnabled: boolean
  mode: 'preview' | 'live'
  note: string
}

type Quote = {
  adBudgetMnt: number
  serviceFeePercent: number
  serviceFeeMnt: number
  totalPayableMnt: number
  dailyBudgetMnt: number
  perChannelBudgetMnt: number
  channels: Channel[]
  durationDays: number
  provider: ProviderStatus
}

type Preview = {
  campaign: any
  quote: Quote
  providerPayload: any
  submitReady: boolean
}

const objectives: Array<{ id: Objective; title: string; text: string }> = [
  { id: 'messages', title: 'Message авах', text: 'Messenger / DM харилцаа нэмэгдүүлэх' },
  { id: 'traffic', title: 'Website хандалт', text: 'Сайт руу илүү олон хүн оруулах' },
  { id: 'leads', title: 'Lead авах', text: 'Сонирхсон хэрэглэгчийн мэдээлэл цуглуулах' },
  { id: 'video_views', title: 'Видео үзэлт', text: 'Video reach болон view нэмэгдүүлэх' },
  { id: 'sales', title: 'Борлуулалт', text: 'Conversion болон худалдан авалтад чиглүүлэх' },
]

const money = (value: number) => Math.round(value || 0).toLocaleString('mn-MN') + '₮'

export default function NewCampaignPage() {
  const [channels, setChannels] = useState<Channel[]>(['facebook', 'instagram', 'google', 'youtube', 'tiktok', 'x'])
  const [objective, setObjective] = useState<Objective>('traffic')
  const [budget, setBudget] = useState(300000)
  const [duration, setDuration] = useState(7)
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [headline, setHeadline] = useState('')
  const [primaryText, setPrimaryText] = useState('')
  const [city, setCity] = useState('Улаанбаатар')
  const [ageMin, setAgeMin] = useState(18)
  const [ageMax, setAgeMax] = useState(55)
  const [interests, setInterests] = useState('')
  const [quote, setQuote] = useState<Quote | null>(null)
  const [provider, setProvider] = useState<ProviderStatus | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestBody = useMemo(() => ({
    name: headline || 'BOOST.MN campaign',
    channels,
    objective,
    totalBudgetMnt: budget,
    durationDays: duration,
    websiteUrl: websiteUrl || undefined,
    headline: headline || undefined,
    primaryText: primaryText || undefined,
    callToAction: objective === 'messages' ? 'Send Message' : objective === 'sales' ? 'Shop Now' : 'Learn More',
    audience: {
      country: 'MN',
      city: city || undefined,
      ageMin,
      ageMax,
      interests: interests.split(',').map((item) => item.trim()).filter(Boolean),
    },
  }), [channels, objective, budget, duration, websiteUrl, headline, primaryText, city, ageMin, ageMax, interests])

  useEffect(() => {
    apiFetch<any>('/ads/providers')
      .then((result) => setProvider(result?.providers?.[0] || null))
      .catch(() => undefined)
  }, [])

  useEffect(() => {
    if (!channels.length) {
      setQuote(null)
      return
    }

    const timer = window.setTimeout(() => {
      apiFetch<Quote>('/ads/quote', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
        .then((result) => {
          setQuote(result)
          setError('')
        })
        .catch((e: any) => setError(e?.message || 'Төсөв тооцоолж чадсангүй.'))
    }, 250)

    return () => window.clearTimeout(timer)
  }, [requestBody, channels.length])

  function toggleChannel(channel: Channel) {
    setPreview(null)
    setChannels((current) => current.includes(channel)
      ? current.filter((item) => item !== channel)
      : [...current, channel])
  }

  async function createPreview(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setPreview(null)
    setError('')
    try {
      const result = await apiFetch<Preview>('/ads/campaign-preview', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
      setPreview(result)
    } catch (e: any) {
      setError(e?.message || 'Campaign preview үүсгэж чадсангүй.')
    } finally {
      setLoading(false)
    }
  }

  return <AppShell title="Шинэ сурталчилгаа" subtitle="Нэг тохиргоогоор 8 хүртэл рекламын сувагт зориулсан campaign бэлтгэнэ.">
    <form className={styles.layout} onSubmit={createPreview}>
      <div className={styles.main}>
        <section className={styles.card}>
          <div className={styles.heading}><span>01</span><div><h2>Суваг сонгох</h2><p>Олон сувгийг зэрэг сонгож болно. Эхлээд түгээмэл 6 сувгийг сонгосон.</p></div></div>
          <div className={styles.channels}>
            <ChannelButton title="Facebook" subtitle="Meta" active={channels.includes('facebook')} onClick={() => toggleChannel('facebook')} icon={<Facebook size={22}/>}/>
            <ChannelButton title="Instagram" subtitle="Meta" active={channels.includes('instagram')} onClick={() => toggleChannel('instagram')} icon={<Instagram size={22}/>}/>
            <ChannelButton title="Google" subtitle="Search / Display" active={channels.includes('google')} onClick={() => toggleChannel('google')} icon={<Globe2 size={22}/>}/>
            <ChannelButton title="YouTube" subtitle="Video Ads" active={channels.includes('youtube')} onClick={() => toggleChannel('youtube')} icon={<Youtube size={22}/>}/>
            <ChannelButton title="TikTok" subtitle="Short-video Ads" active={channels.includes('tiktok')} onClick={() => toggleChannel('tiktok')} icon={<Music2 size={22}/>}/>
            <ChannelButton title="X" subtitle="X / Twitter Ads" active={channels.includes('x')} onClick={() => toggleChannel('x')} icon={<span style={{fontSize:18,fontWeight:900}}>X</span>}/>
            <ChannelButton title="LinkedIn" subtitle="B2B Ads" active={channels.includes('linkedin')} onClick={() => toggleChannel('linkedin')} icon={<Linkedin size={22}/>}/>
            <ChannelButton title="Microsoft" subtitle="Bing / Microsoft Ads" active={channels.includes('microsoft')} onClick={() => toggleChannel('microsoft')} icon={<Globe2 size={22}/>}/>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.heading}><span>02</span><div><h2>Зорилго</h2><p>Provider платформ тус бүрийн campaign төрлийг энэ зорилгод тааруулна.</p></div></div>
          <div className={styles.objectives}>
            {objectives.map((item) => <button type="button" key={item.id} className={objective === item.id ? styles.selected : ''} onClick={() => { setObjective(item.id); setPreview(null) }}>
              <b>{item.title}</b><small>{item.text}</small>
            </button>)}
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.heading}><span>03</span><div><h2>Төсөв ба хугацаа</h2><p>Монгол төгрөгөөр нийт төсөв оруулна.</p></div></div>
          <div className={styles.twoCols}>
            <label><span>Нийт рекламын төсөв</span><div className={styles.inputWithSuffix}><input type="number" min="10000" step="10000" value={budget} onChange={(e) => { setBudget(Math.max(10000, Number(e.target.value) || 10000)); setPreview(null) }}/><b>₮</b></div></label>
            <label><span>Хугацаа</span><select value={duration} onChange={(e) => { setDuration(Number(e.target.value)); setPreview(null) }}><option value={3}>3 хоног</option><option value={5}>5 хоног</option><option value={7}>7 хоног</option><option value={14}>14 хоног</option><option value={30}>30 хоног</option></select></label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.heading}><span>04</span><div><h2>Creative ба холбоос</h2><p>Provider платформ бүрийн format-д тохируулж ашиглах үндсэн мэдээлэл.</p></div></div>
          <div className={styles.fields}>
            <label><span>Website / landing page</span><input value={websiteUrl} onChange={(e) => { setWebsiteUrl(e.target.value); setPreview(null) }} placeholder="https://example.mn"/></label>
            <label><span>Гарчиг</span><input value={headline} onChange={(e) => { setHeadline(e.target.value); setPreview(null) }} placeholder="Таны бүтээгдэхүүний гол санал"/></label>
            <label><span>Зарын текст</span><textarea value={primaryText} onChange={(e) => { setPrimaryText(e.target.value); setPreview(null) }} placeholder="Хэрэглэгчид харагдах үндсэн рекламын текст..." rows={4}/></label>
          </div>
        </section>

        <section className={styles.card}>
          <div className={styles.heading}><span>05</span><div><h2>Аудитори</h2><p>Эхний MVP-д Монгол зах зээлд зориулсан энгийн targeting.</p></div></div>
          <div className={styles.twoCols}>
            <label><span>Хот</span><input value={city} onChange={(e) => { setCity(e.target.value); setPreview(null) }} placeholder="Улаанбаатар"/></label>
            <label><span>Сонирхол</span><input value={interests} onChange={(e) => { setInterests(e.target.value); setPreview(null) }} placeholder="technology, fashion, restaurant"/></label>
            <label><span>Насны доод хязгаар</span><input type="number" min="18" max="65" value={ageMin} onChange={(e) => { setAgeMin(Number(e.target.value)); setPreview(null) }}/></label>
            <label><span>Насны дээд хязгаар</span><input type="number" min="18" max="65" value={ageMax} onChange={(e) => { setAgeMax(Number(e.target.value)); setPreview(null) }}/></label>
          </div>
        </section>
      </div>

      <aside className={styles.side}>
        <div className={styles.summaryCard}>
          <div className={styles.provider}><Sparkles size={18}/><div><b>{provider?.label || 'Shown'}</b><small>{provider?.mode === 'live' ? 'LIVE provider' : 'SAFE PREVIEW mode'}</small></div></div>
          <div className={styles.line}><span>Сонгосон суваг</span><b>{channels.length} / 8</b></div>
          <div className={styles.line}><span>Өдрийн дундаж төсөв</span><b>{quote ? money(quote.dailyBudgetMnt) : '—'}</b></div>
          <div className={styles.line}><span>1 сувагт дундаж</span><b>{quote ? money(quote.perChannelBudgetMnt) : '—'}</b></div>
          <div className={styles.line}><span>Рекламын төсөв</span><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
          <div className={styles.line}><span>Үйлчилгээний шимтгэл</span><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b></div>
          <div className={styles.total}><span>Нийт төлбөр</span><b>{quote ? money(quote.totalPayableMnt) : '—'}</b></div>
          <button type="submit" disabled={loading || !channels.length}>{loading ? 'Бэлтгэж байна…' : 'Campaign preview үүсгэх'}</button>
          <div className={styles.guard}><ShieldCheck size={16}/><p><b>Spend protection</b><small>Preview нь мөнгө зарцуулахгүй. Live submit зөвхөн provider API, billing болон хэрэглэгчийн баталгаажуулалт бүрэн бэлэн үед нээгдэнэ.</small></p></div>
          {error && <div className={styles.error}>{error}</div>}
        </div>

        {preview && <div className={styles.previewCard}>
          <span>PREVIEW READY</span>
          <h3>{preview.campaign.name || 'Campaign'}</h3>
          <p>{preview.campaign.channels.join(' · ')}</p>
          <dl>
            <div><dt>Зорилго</dt><dd>{preview.campaign.objective}</dd></div>
            <div><dt>Хугацаа</dt><dd>{preview.campaign.durationDays} хоног</dd></div>
            <div><dt>Provider</dt><dd>{preview.quote.provider.label}</dd></div>
            <div><dt>Submit</dt><dd>{preview.submitReady ? 'API ready' : 'Preview only'}</dd></div>
          </dl>
        </div>}
      </aside>
    </form>
  </AppShell>
}

function ChannelButton({ title, subtitle, active, onClick, icon }: { title: string; subtitle: string; active: boolean; onClick: () => void; icon: ReactNode }) {
  return <button type="button" onClick={onClick} className={active ? styles.activeChannel : ''}>
    <span>{icon}</span>
    <b>{title}</b>
    <small>{active ? '✓ ' : ''}{subtitle}</small>
  </button>
}
