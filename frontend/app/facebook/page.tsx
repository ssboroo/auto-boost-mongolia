'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

type Status = { configured: boolean; accountConfigured: boolean; connector: string }
type Account = { id: string; name: string }

export default function FacebookConnectionPage() {
  const [status, setStatus] = useState<Status | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const statusRes = await fetch(`${API}/meta/status`, { cache: 'no-store' })
      const statusData = await statusRes.json()
      setStatus(statusData)

      if (statusData.configured) {
        const accountsRes = await fetch(`${API}/meta/accounts`, { cache: 'no-store' })
        if (accountsRes.ok) setAccounts(await accountsRes.json())
      }
    } catch {
      setError('Backend-тэй холбогдож чадсангүй. Сервер ажиллаж байгаа эсэхийг шалгана уу.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  async function connectFacebook() {
    setError('')
    try {
      const res = await fetch(`${API}/meta/connect-info`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.message || 'Холболтын URL авч чадсангүй.')
      if (!data?.connectUrl) throw new Error('Facebook холболтын URL олдсонгүй.')
      window.location.href = data.connectUrl
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
            <span className={styles.kicker}>META ХОЛБОЛТ</span>
            <h1>Facebook Ads аккаунтаа холбоно уу</h1>
            <p>Зарын аккаунт, кампайн, зарын багц, зар болон тайлангаа Auto Boost Mongolia-аас Монгол хэлээр удирдана.</p>
          </div>
          <div className={styles.badge}>{status?.configured ? 'Windsor бэлэн' : 'Тохиргоо шаардлагатай'}</div>
        </section>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.grid}>
          <section className={styles.card}>
            <div className={styles.icon}>f</div>
            <h2>1. Facebook эрх олгох</h2>
            <p>Meta-ийн аюулгүй OAuth цонхоор нэвтэрнэ. Facebook нууц үг Auto Boost Mongolia-д хадгалагдахгүй.</p>
            <button className={styles.primary} onClick={connectFacebook} disabled={!status?.configured || loading}>
              Facebook Ads холбох
            </button>
            {!status?.configured && <small>Эхлээд backend/.env дотор WINDSOR_API_KEY оруулна уу.</small>}
          </section>

          <section className={styles.card}>
            <div className={styles.iconAlt}>₮</div>
            <h2>2. Зарын аккаунт сонгох</h2>
            <p>Facebook холбосны дараа ашиглах боломжтой зарын аккаунтууд энд гарна.</p>
            {loading ? <div className={styles.empty}>Шалгаж байна...</div> : accounts.length ? (
              <div className={styles.accounts}>
                {accounts.map(account => (
                  <label className={styles.account} key={account.id}>
                    <input type="radio" name="account" />
                    <span><b>{account.name}</b><small>{account.id}</small></span>
                  </label>
                ))}
              </div>
            ) : <div className={styles.empty}>Одоогоор зарын аккаунт олдсонгүй.</div>}
          </section>
        </div>

        <section className={styles.info}>
          <h3>Холбосны дараа юу хийх боломжтой вэ?</h3>
          <div className={styles.infoGrid}>
            <div><b>Кампайн</b><span>Үүсгэх, идэвхжүүлэх, зогсоох, төсөв өөрчлөх</span></div>
            <div><b>Зарын багц</b><span>Audience, budget, хугацаа, bid тохируулах</span></div>
            <div><b>Зар</b><span>Шинэ зар үүсгэх, existing post boost хийх</span></div>
            <div><b>Тайлан</b><span>Spend, clicks, CTR, CPC, CPA, ROAS хянах</span></div>
          </div>
        </section>
      </div>
    </main>
  )
}
