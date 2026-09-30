'use client'

import { useEffect, useState } from 'react'
import { Facebook, Globe2, Instagram, Linkedin, Music2, ShieldCheck, Youtube } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import DashboardHero from '../components/dashboard/DashboardHero'
import StatCard from '../components/dashboard/StatCard'
import { apiFetch } from '../lib/api'
import styles from './page.module.css'

type ProviderStatus = {
  id: string
  label: string
  configured: boolean
  liveWritesEnabled: boolean
  mode: 'preview' | 'live'
  note: string
}

type ProvidersResponse = {
  primary: string
  providers: ProviderStatus[]
  supportedChannels: string[]
}

type Quote = {
  adBudgetMnt: number
  serviceFeePercent: number
  serviceFeeMnt: number
  totalPayableMnt: number
  dailyBudgetMnt: number
  channels: string[]
  durationDays: number
}

type MetaSession = { connected: boolean }

const money = (value: number) => Math.round(value || 0).toLocaleString('mn-MN') + '₮'
const defaultChannels = ['facebook','instagram','google','youtube','tiktok','x','linkedin','microsoft']

export default function HomePage() {
  const [providers, setProviders] = useState<ProvidersResponse | null>(null)
  const [meta, setMeta] = useState<MetaSession>({ connected: false })
  const [budget, setBudget] = useState(300000)
  const [duration, setDuration] = useState(7)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<ProvidersResponse>('/ads/providers').then(setProviders).catch(() => undefined)
    apiFetch<MetaSession>('/meta/session').then(setMeta).catch(() => setMeta({ connected: false }))
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      apiFetch<Quote>('/ads/quote', {
        method: 'POST',
        body: JSON.stringify({
          channels: defaultChannels,
          objective: 'traffic',
          totalBudgetMnt: budget,
          durationDays: duration,
          audience: { country: 'MN', ageMin: 18, ageMax: 65 },
        }),
      }).then((data) => {
        setQuote(data)
        setError('')
      }).catch((e: any) => setError(e?.message || 'Төсвийн тооцоо авч чадсангүй.'))
    }, 250)
    return () => window.clearTimeout(timer)
  }, [budget, duration])

  const shown = providers?.providers?.find((provider) => provider.id === 'shown')
  const shownReady = shown?.configured ? 'Shown provider бэлэн' : 'Shown API хүлээгдэж байна'

  return <AppShell>
    <DashboardHero connected={meta.connected}/>

    <section className={styles.kpis}>
      <StatCard icon={<Facebook size={22}/>} value="Facebook" label="Meta Ads" trend={meta.connected ? 'Account холбогдсон' : 'Connection шаардлагатай'}/>
      <StatCard icon={<Instagram size={22}/>} value="Instagram" label="Meta Ads" trend={meta.connected ? 'Meta-аар бэлэн' : 'Connection шаардлагатай'}/>
      <StatCard icon={<Globe2 size={22}/>} value="Google" label="Search / Display" trend={shownReady}/>
      <StatCard icon={<Youtube size={22}/>} value="YouTube" label="Video Ads" trend={shownReady}/>
      <StatCard icon={<Music2 size={22}/>} value="TikTok" label="Short-video Ads" trend={shownReady}/>
      <StatCard icon={<span style={{fontSize:18,fontWeight:900}}>X</span>} value="X Ads" label="X / Twitter" trend={shownReady}/>
      <StatCard icon={<Linkedin size={22}/>} value="LinkedIn" label="B2B Ads" trend={shownReady}/>
      <StatCard icon={<Globe2 size={22}/>} value="Microsoft" label="Bing / Microsoft Ads" trend={shownReady}/>
    </section>

    <section className={styles.workGrid}>
      <article className={styles.boostCard}>
        <div className={styles.sectionHead}>
          <div><span>CAMPAIGN BUDGET</span><h2>8 сувгийн нэгдсэн төсөв</h2></div>
          <div className={styles.live}><i/>{shown?.mode === 'live' ? 'LIVE API' : 'SAFE PREVIEW'}</div>
        </div>

        <div className={styles.budgetGrid}>
          <label className={styles.amount}><span>₮</span><input type="number" min="10000" step="10000" value={budget} onChange={(e) => setBudget(Math.max(10000, Number(e.target.value) || 10000))}/><em>MNT</em></label>
          <div className={styles.presets}>
            {[3, 5, 7, 14, 30].map((days) => <button key={days} onClick={() => setDuration(days)} className={duration === days ? styles.selected : ''}>{days} хоног</button>)}
          </div>
        </div>

        <div className={styles.summary}>
          <div><small>Рекламын төсөв</small><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
          <div><small>Үйлчилгээний шимтгэл</small><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b></div>
          <div><small>Нийт</small><b>{quote ? money(quote.totalPayableMnt) : '—'}</b></div>
        </div>

        <div className={styles.payment}>
          <div><ShieldCheck size={20}/><p><b>Spend safety</b><small>Provider API бүрэн баталгаажаагүй үед campaign зөвхөн preview байдлаар бэлтгэгдэнэ.</small></p></div>
          <button onClick={() => window.location.assign('/campaigns/new')}>Сурталчилгаа үүсгэх →</button>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </article>

      <aside className={styles.insight}>
        <div className={styles.insightIcon}>✦</div>
        <h3>{shown?.label || 'Shown'} provider</h3>
        <p>{shown?.note || 'White-label multi-channel API integration тохируулж байна.'}</p>
        <a href="/campaigns/new">{shown?.liveWritesEnabled ? 'Live campaign үүсгэх →' : 'Preview campaign үүсгэх →'}</a>
      </aside>
    </section>

    <section className={styles.campaigns}>
      <div className={styles.sectionHead}><div><span>PLATFORM FLOW</span><h2>Нэг захиалга → 8 рекламын суваг</h2></div><a href="/campaigns/new">Шинээр эхлэх →</a></div>
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Алхам</th><th>Төлөв</th><th>Тайлбар</th><th>Үйлдэл</th></tr></thead>
          <tbody>
            <StatusRow title="1. Суваг сонгох" good status="8 суваг" detail="Meta, Google, YouTube, TikTok, X, LinkedIn, Microsoft" href="/campaigns/new"/>
            <StatusRow title="2. Зорилго сонгох" good status="Бэлэн" detail="Message, traffic, lead, video view, sales" href="/campaigns/new"/>
            <StatusRow title="3. Account холбох" good={meta.connected} status={meta.connected ? 'Meta бэлэн' : 'Provider setup'} detail="Provider OAuth / advertising account connection" href="/facebook"/>
            <StatusRow title="4. Төлбөр" good status="MNT" detail="Ad budget + үйлчилгээний шимтгэл" href="/payments"/>
            <StatusRow title="5. Provider submit" good={Boolean(shown?.liveWritesEnabled)} status={shown?.liveWritesEnabled ? 'LIVE' : 'PREVIEW'} detail="Shown primary provider; direct APIs can be fallback" href="/admin"/>
          </tbody>
        </table>
      </div>
    </section>

    <footer className={styles.footer}>BOOST.MN · Multi-channel Ads Automation · <a href="/privacy">Нууцлал</a> · <a href="/terms">Нөхцөл</a> · <a href="/data-deletion">Мэдээлэл устгах</a></footer>
  </AppShell>
}

function StatusRow({ title, status, good, detail, href }: { title: string; status: string; good: boolean; detail: string; href: string }) {
  return <tr>
    <td><span className={styles.rowIcon}><Globe2 size={16}/></span><b>{title}</b></td>
    <td><span className={styles.badge + ' ' + (good ? styles.good : styles.warn)}><i/>{status}</span></td>
    <td>{detail}</td>
    <td><a href={href}>Нээх →</a></td>
  </tr>
}
