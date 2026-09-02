'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Facebook, Loader2, RefreshCw, ShieldCheck, Unplug, Zap } from 'lucide-react'
import styles from './page.module.css'
import { API_BASE, apiFetch } from '../../lib/api'

type Status = {
  configured: boolean
  sessionConfigured: boolean
  productionReady: boolean
  graphVersion: string
  redirectUri: string
  provider: string
}

type Session = {
  connected: boolean
  profile?: { id?: string; name?: string; picture?: { data?: { url?: string } } }
}

export default function FacebookConnectionPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [session, setSession] = useState<Session>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')

  async function refresh() {
    setLoading(true)
    setError('')
    try {
      const [nextStatus, nextSession] = await Promise.all([
        apiFetch<Status>('/meta/status'),
        apiFetch<Session>('/meta/session').catch(() => ({ connected: false })),
      ])
      setStatus(nextStatus)
      setSession(nextSession)
    } catch (err: any) {
      setError(err?.message || `Backend API (${API_BASE})-тай холбогдож чадсангүй.`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oauthError = params.get('error')
    if (oauthError) setError(oauthError)
    refresh()
  }, [])

  async function connectFacebook() {
    setError('')
    setConnecting(true)
    try {
      const data = await apiFetch<{ url: string }>('/meta/auth/url')
      if (!data?.url) throw new Error('Facebook Login URL олдсонгүй.')
      window.location.assign(data.url)
    } catch (err: any) {
      setError(err?.message || 'Facebook холболтыг эхлүүлж чадсангүй.')
      setConnecting(false)
    }
  }

  async function disconnectFacebook() {
    setError('')
    try {
      await apiFetch('/meta/logout', { method: 'POST' })
      setSession({ connected: false })
    } catch (err: any) {
      setError(err?.message || 'Facebook session салгаж чадсангүй.')
    }
  }

  const ready = Boolean(status?.productionReady)

  return (
    <main className={styles.page}>
      <div className={styles.glowA} />
      <div className={styles.glowB} />
      <div className={styles.wrap}>
        <header className={styles.topbar}>
          <a className={styles.back} href="/"><ArrowLeft size={17} /> Хяналтын самбар</a>
          <div className={styles.apiPill}><i className={error ? styles.redDot : styles.greenDot} /> {error ? 'API асуудалтай' : 'Meta Direct API'}</div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>SECURE META CONNECTION</span>
            <h1>Facebook Ads-аа<br /><em>аюулгүй холбо.</em></h1>
            <p>Auto Boost Mongolia нь Windsor болон гуравдагч талын connector ашиглахгүй. Meta Graph / Marketing API-тай шууд OAuth холболт үүсгэнэ.</p>
            <div className={styles.securityLine}><ShieldCheck size={17} /><span>Facebook нууц үгийг бид харахгүй · Access token нь HttpOnly шифрлэгдсэн session-д хадгалагдана</span></div>
          </div>
          <div className={styles.connectionVisual}>
            <div className={styles.metaNode}><Facebook size={30} /><span>META</span></div>
            <div className={styles.connectionBeam}><i /></div>
            <div className={styles.boostNode}><Zap size={28} /><span>AUTO BOOST</span></div>
          </div>
        </section>

        {error && <div className={styles.error}><Unplug size={18} /><div><b>Холболтын алдаа</b><p>{error}</p></div><button onClick={refresh}><RefreshCw size={15} /> Дахин шалгах</button></div>}

        <section className={styles.statusGrid}>
          <StatusCard title="Backend API" value={loading ? 'Шалгаж байна' : error ? 'Алдаа' : 'Online'} ok={!loading && !error} />
          <StatusCard title="Meta App" value={loading ? 'Шалгаж байна' : status?.configured ? 'Configured' : 'Setup required'} ok={Boolean(status?.configured)} />
          <StatusCard title="Secure session" value={loading ? 'Шалгаж байна' : status?.sessionConfigured ? 'Ready' : 'SESSION_SECRET дутуу'} ok={Boolean(status?.sessionConfigured)} />
          <StatusCard title="Facebook account" value={loading ? 'Шалгаж байна' : session.connected ? 'Connected' : 'Not connected'} ok={session.connected} />
        </section>

        <div className={styles.contentGrid}>
          <section className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.facebookIcon}><Facebook size={23} /></div>
              <div><span>STEP 01</span><h2>Facebook эрх олгох</h2></div>
            </div>

            {session.connected ? (
              <div className={styles.connectedBox}>
                <div className={styles.profileCircle}>{session.profile?.name?.slice(0, 1).toUpperCase() || 'F'}</div>
                <div><span>Холбогдсон аккаунт</span><b>{session.profile?.name || 'Facebook account'}</b><small>Session идэвхтэй · token browser JavaScript-д харагдахгүй</small></div>
                <Check size={20} />
              </div>
            ) : (
              <>
                <p className={styles.cardText}>Facebook-ийн албан ёсны OAuth цонхоор нэвтэрч, Page болон Ad Account-д хэрэгтэй зөвшөөрлүүдээ сонгоно.</p>
                <button className={styles.primary} onClick={connectFacebook} disabled={!ready || loading || connecting}>
                  {connecting ? <Loader2 className={styles.spin} size={18} /> : <Facebook size={18} />}
                  {connecting ? 'Facebook руу шилжиж байна…' : 'Facebook Ads холбох'}
                  {!connecting && <ArrowRight size={17} />}
                </button>
              </>
            )}

            {!ready && !loading && (
              <div className={styles.setupHint}><b>Production тохиргоо дутуу байна</b><span>Backend Vercel environment дээр META_APP_ID, META_APP_SECRET, SESSION_SECRET, META_REDIRECT_URI-г бүрэн тохируулна уу.</span></div>
            )}

            {session.connected && <button className={styles.disconnect} onClick={disconnectFacebook}>Facebook session салгах</button>}
          </section>

          <section className={styles.card}>
            <div className={styles.cardTop}>
              <div className={styles.checkIcon}><ShieldCheck size={22} /></div>
              <div><span>STEP 02</span><h2>Production checklist</h2></div>
            </div>
            <div className={styles.checklist}>
              <CheckRow label="Backend API online" ok={!error && !loading} />
              <CheckRow label="Meta App ID + Secret" ok={Boolean(status?.configured)} />
              <CheckRow label="Encrypted session secret" ok={Boolean(status?.sessionConfigured)} />
              <CheckRow label="HTTPS OAuth redirect" ok={Boolean(status?.redirectUri?.startsWith('https://'))} />
              <CheckRow label="Facebook user session" ok={session.connected} />
            </div>
            <div className={styles.endpoint}><span>API endpoint</span><code>{API_BASE}</code></div>
          </section>
        </div>

        <section className={styles.capabilitySection}>
          <div className={styles.capabilityHead}><span>AFTER CONNECTION</span><h3>Нэг холболтоор юу удирдах вэ?</h3></div>
          <div className={styles.capabilityGrid}>
            <Capability num="01" title="Facebook Page" text="Page болон existing post-оо сонгож зар болгоно." />
            <Capability num="02" title="Ad Account" text="Account, currency, timezone болон delivery status." />
            <Capability num="03" title="Campaign Builder" text="Campaign → Ad Set → Creative → Ad бүгд PAUSED төлөвөөр." />
            <Capability num="04" title="Insights" text="Spend, reach, CTR, CPC, CPM, actions болон ROAS." />
          </div>
        </section>
      </div>
    </main>
  )
}

function StatusCard({ title, value, ok }: { title: string; value: string; ok: boolean }) {
  return <article className={styles.statusCard}><span>{title}</span><div><i className={ok ? styles.statusGood : styles.statusWarn} /><b>{value}</b></div></article>
}

function CheckRow({ label, ok }: { label: string; ok: boolean }) {
  return <div className={styles.checkRow}><span className={ok ? styles.checkGood : styles.checkPending}>{ok ? <Check size={13} /> : '!'}</span><b>{label}</b><small>{ok ? 'Бэлэн' : 'Шаардлагатай'}</small></div>
}

function Capability({ num, title, text }: { num: string; title: string; text: string }) {
  return <article className={styles.capability}><span>{num}</span><b>{title}</b><p>{text}</p></article>
}
