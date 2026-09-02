'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || (process.env.NODE_ENV === 'production' ? '/api/backend' : 'http://localhost:4000')

type Status = { configured: boolean; graphVersion: string; redirectUri: string; provider: string }

export default function FacebookConnectionPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}/meta/status`, { cache: 'no-store' })
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setError('Backend-тэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.'))
      .finally(() => setLoading(false))
  }, [])

  async function connectFacebook() {
    setError('')
    try {
      const res = await fetch(`${API}/meta/auth/url`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Facebook Login URL авч чадсангүй.')
      if (!data?.url) throw new Error('Facebook Login URL олдсонгүй.')
      window.location.href = data.url
    } catch (e: any) {
      setError(e?.message || 'Facebook холболтыг эхлүүлж чадсангүй.')
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.wrap}>
        <a className={styles.back} href="/">← Хяналтын самбар руу буцах</a>

        <section className={styles.hero}>
          <div>
            <span className={styles.kicker}>META DIRECT API</span>
            <h1>Facebook Ads аккаунтаа холбоно уу</h1>
            <p>Windsor ашиглахгүй. Auto Boost Mongolia нь Meta Graph / Marketing API-тай шууд холбогдоно.</p>
          </div>
          <div className={styles.badge}>{status?.configured ? 'Meta API бэлэн' : 'App тохиргоо шаардлагатай'}</div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.icon}>f</div>
            <h2>1. Facebook эрх олгох</h2>
            <p>Facebook-ийн албан ёсны OAuth цонхоор нэвтэрнэ. Таны Facebook нууц үгийг Auto Boost Mongolia харахгүй, хадгалахгүй.</p>
            <button className={styles.primary} onClick={connectFacebook} disabled={!status?.configured || loading}>
              Facebook Ads холбох
            </button>
            {!status?.configured && <small>Vercel Environment Variables хэсэгт META_APP_ID болон META_APP_SECRET оруулна уу.</small>}
          </section>

          <section className={styles.card}>
            <div className={styles.iconAlt}>✓</div>
            <h2>2. Эрхийн шалгалт</h2>
            <p>Холболтын дараа Page, Ad Account, Campaign, Post болон Insights мэдээллийг шууд Meta API-аас авна.</p>
            <div className={styles.empty}>
              {status?.configured ? `Graph API ${status.graphVersion} тохируулагдсан` : 'Meta Developer App тохируулаагүй байна.'}
            </div>
          </section>
        </div>

        <section className={styles.info}>
          <h3>Шууд Meta API-аар юу удирдах вэ?</h3>
          <div className={styles.infoGrid}>
            <div><b>Facebook Page</b><span>Хуудас болон existing post сонгох</span></div>
            <div><b>Ad Account</b><span>Зарын аккаунт, валют, timezone сонгох</span></div>
            <div><b>Кампайн / Зарын багц / Зар</b><span>PAUSED төлөвөөр үүсгээд хэрэглэгч баталсны дараа ACTIVE болгох</span></div>
            <div><b>Тайлан</b><span>Spend, impressions, CTR, CPC, CPM, actions, ROAS</span></div>
          </div>
        </section>
      </div>
    </main>
  )
}
