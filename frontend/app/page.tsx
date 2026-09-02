'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BadgeCheck,
  Facebook,
  Headphones,
  LockKeyhole,
  Moon,
  ShieldCheck,
  Sparkles,
  WalletCards,
  Zap,
} from 'lucide-react'
import styles from './page.module.css'
import { apiFetch } from '../lib/api'
import { supabase } from '../lib/supabase'

type Fx = { rate: number; source: string; rateDate: string; fetchedAt: string }
type Quote = {
  metaBudgetUsd: number
  fx: Fx
  adBudgetMnt: number
  serviceFeePercent: number
  serviceFeeMnt: number
  totalDisplayMnt: number
}

type MetaSession = { connected: boolean; profile?: { name?: string } }

const money = (value: number) => `${Math.round(value).toLocaleString('mn-MN')}₮`
const usd = (value: number) => `$${value.toFixed(2)}`
const presets = [5, 20, 50, 100, 200]

export default function HomePage() {
  const [budgetUsd, setBudgetUsd] = useState(20)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [session, setSession] = useState<MetaSession>({ connected: false })
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const feeUsd = useMemo(() => {
    if (!quote || !quote.fx.rate) return budgetUsd * 0.1
    return quote.serviceFeeMnt / quote.fx.rate
  }, [quote, budgetUsd])

  const totalUsd = budgetUsd + feeUsd

  async function refreshQuote(value = budgetUsd) {
    try {
      const next = await apiFetch<Quote>(`/billing/quote?usd=${encodeURIComponent(value.toFixed(2))}`)
      setQuote(next)
      setError('')
    } catch (err: any) {
      setError(err?.message || 'Ханшийн мэдээлэл авч чадсангүй.')
    }
  }

  useEffect(() => {
    refreshQuote(budgetUsd)
    apiFetch<MetaSession>('/meta/session').then(setSession).catch(() => setSession({ connected: false }))

    const params = new URLSearchParams(window.location.search)
    const paymentIntent = params.get('payment_intent')
    if (params.get('payment') === 'success' && paymentIntent) {
      setMessage('Wire төлбөрийг шалгаж байна…')
      apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(paymentIntent)}`)
        .then((payment) => {
          setMessage(payment?.wire_status === 'succeeded'
            ? 'Үйлчилгээний шимтгэл амжилттай төлөгдлөө.'
            : 'Төлбөр хүлээн авсан. Wire баталгаажуулалт түр хүлээгдэж байна.')
        })
        .catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => refreshQuote(budgetUsd), 220)
    return () => window.clearTimeout(timer)
  }, [budgetUsd])

  async function payFee() {
    setPaying(true)
    setMessage('')
    setError('')
    try {
      const result = await apiFetch<{ checkoutUrl: string }>('/billing/fee-checkout', {
        method: 'POST',
        body: JSON.stringify({ metaBudgetUsd: budgetUsd }),
      })
      if (!result?.checkoutUrl) throw new Error('Wire checkout URL олдсонгүй.')
      window.location.assign(result.checkoutUrl)
    } catch (err: any) {
      setError(err?.message || 'Wire төлбөр эхлүүлж чадсангүй.')
      setPaying(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  const rate = quote?.fx.rate || 0
  const rateLabel = quote ? `1 USD = ${quote.fx.rate.toLocaleString('mn-MN')}₮` : 'Ханш ачаалж байна…'

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a href="#top" className={styles.brand} aria-label="Auto Boost Mongolia">
          <span className={styles.logoMark}><Zap size={20} fill="currentColor" /></span>
          <span><b>AUTO BOOST</b><small>MONGOLIA</small></span>
        </a>
        <nav className={styles.nav}>
          <a className={styles.active} href="#boost">Boost Studio</a>
          <a href="#">Миний Boost</a>
          <a href="#payment">Төлбөрүүд</a>
          <a href="#help">Тусламж</a>
        </nav>
        <div className={styles.headerRight}>
          <button className={styles.iconButton} aria-label="Theme"><Moon size={17} /></button>
          <div className={styles.userBox}>
            <span className={styles.avatar}>AB</span>
            <span className={styles.userCopy}>
              <b>{session.connected ? session.profile?.name || 'Facebook хэрэглэгч' : 'Auto Boost'}</b>
              <small>{session.connected ? 'Facebook холбогдсон' : 'user@email.com'}</small>
            </span>
          </div>
          <button className={styles.signOut} onClick={signOut}>Гарах</button>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}><Sparkles size={14} /> PREMIUM BOOST STUDIO</span>
            <h1>Meta зараа<br /><em>мэргэжлийн</em> түвшинд<br />хүргэ</h1>
            <p>Таны Meta зарын төсөв, төгрөгийн бодит хөрвүүлэлт, Auto Boost үйлчилгээний шимтгэлийг нэг дэлгэц дээр ойлгомжтой удирдана.</p>
            <div className={styles.featureRow}>
              <div className={styles.feature}><span><BadgeCheck size={20} /></span><div><b>Бодит үр дүн</b><small>Performance суурилсан</small></div></div>
              <div className={styles.feature}><span><ShieldCheck size={20} /></span><div><b>100% Аюулгүй</b><small>Meta албан ёсны API</small></div></div>
              <div className={styles.feature}><span><Zap size={20} /></span><div><b>Хурдан & Автомат</b><small>24/7 автомат удирдлага</small></div></div>
            </div>
          </div>

          <div className={styles.adCard}>
            <div className={styles.adTop}>
              <div className={styles.adIdentity}>
                <span className={styles.adLogo}><Zap size={18} fill="currentColor" /></span>
                <span><b>Premium Boost Studio</b><small>Sponsored · 🌐</small></span>
              </div>
              <b className={styles.dots}>•••</b>
            </div>
            <p className={styles.adCaption}>Таны бизнесийг дараагийн түвшинд гаргахад бид тусална. 🚀</p>
            <div className={styles.adVisual}>
              <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1200&q=90" alt="Сурталчилгааны бүтээгдэхүүний жишээ" />
            </div>
            <div className={styles.adStats}>
              <div><b>125K</b><small>Хүрсэн хүмүүс</small></div>
              <div><b>3.2K</b><small>Харилцсан</small></div>
              <div><b>8.7%</b><small>Engagement</small></div>
              <button>Дэлгэрэнгүй</button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.studio} id="boost">
        <div className={styles.cardsRow}>
          <section className={styles.card}>
            <h2>1. Meta зарын төсөв (USD)</h2>
            <div className={styles.inputShell}>
              <span>$</span>
              <input type="number" min="1" step="1" value={budgetUsd} onChange={(e) => setBudgetUsd(Math.max(1, Number(e.target.value) || 1))} />
              <em>USD</em>
            </div>
            <div className={styles.presetRow}>
              {presets.map((value) => (
                <button key={value} className={budgetUsd === value ? styles.selectedPreset : ''} onClick={() => setBudgetUsd(value)}>${value}</button>
              ))}
              <button onClick={() => setBudgetUsd(Math.max(250, budgetUsd))}>Бусад</button>
            </div>
            <div className={styles.convertBox}>
              <span>Хөрвүүлэлт ({rateLabel})</span>
              <div><b>{quote ? money(quote.adBudgetMnt) : '—'}</b><em>MNT</em></div>
            </div>
            <p className={styles.infoNote}>ⓘ Таны зарын төсөв Meta-д шууд зарцуулагдана.</p>
          </section>

          <section className={styles.card}>
            <h2>2. Auto Boost шимтгэл</h2>
            <div className={styles.inputShell}>
              <span>$</span>
              <input readOnly value={feeUsd.toFixed(2)} />
              <em>USD</em>
            </div>
            <div className={`${styles.convertBox} ${styles.feeConvert}`}>
              <span>Хөрвүүлэлт ({rateLabel})</span>
              <div><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b><em>MNT</em></div>
            </div>
            <div className={styles.feeNote}>
              <span>🏆</span>
              <p><b>{quote?.serviceFeePercent ?? 10}% үйлчилгээний шимтгэл</b><br />Бид таны амжилтыг өсгөхөд төвлөрнө.</p>
            </div>
          </section>

          <section className={styles.totalCard}>
            <h2>Төлбөрийн хураангуй</h2>
            <div className={styles.totalRows}>
              <div><span>Meta зарын төсөв</span><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
              <div><span>Auto Boost шимтгэл ({quote?.serviceFeePercent ?? 10}%)</span><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b></div>
            </div>
            <div className={styles.totalDivider} />
            <div className={styles.grandTotal}>
              <span>Нийт төлөх дүн</span>
              <b>{quote ? money(quote.totalDisplayMnt) : '—'}</b>
            </div>
            <div className={styles.totalUsd}><span>Нийт дүн (USD)</span><b>{usd(totalUsd)}</b></div>
          </section>
        </div>

        <section className={styles.paymentPanel} id="payment">
          <div className={styles.paymentIntro}>
            <h2>3. Төлбөрөө хийнэ үү</h2>
            <p>Wire-аар аюулгүй төлбөр хийгээрэй.</p>
          </div>
          <button className={styles.wireButton} onClick={payFee} disabled={paying || !quote}>
            <span className={styles.wireLogo}>W</span>
            <span><b>{paying ? 'Wire checkout нээж байна…' : 'Wire-аар төлөх'}</b><small>Аюулгүй, хурдан, найдвартай</small></span>
            <strong>›</strong>
          </button>
          <div className={styles.trustRow} id="help">
            <div><span><LockKeyhole size={17} /></span><p><b>SSL шифрлэгдсэн</b><small>256-bit хамгаалалт</small></p></div>
            <div><span><ShieldCheck size={17} /></span><p><b>PCI DSS стандарт</b><small>Төлбөрийн аюулгүй байдал</small></p></div>
            <div><span><Headphones size={17} /></span><p><b>24/7 дэмжлэг</b><small>Асуудал гарвал бидэнтэй холбогдоно уу</small></p></div>
          </div>
          {message && <div className={styles.success}>{message}</div>}
          {error && <div className={styles.error}>{error}</div>}
        </section>

        <p className={styles.footerNote}>Үйлчилгээний шимтгэл Wire-аар төлөгдөнө. Meta зарын төсөв таны Meta Ad Account-ийн өөрийн payment method-оор Meta-д төлөгдөнө.</p>
        <p className={styles.rateFoot}>FX эх сурвалж: {quote?.fx.source === 'bank_of_mongolia' ? 'Монголбанк' : quote?.fx.source || '—'} · {quote?.fx.rateDate || '—'} · {rate ? rateLabel : ''}</p>
      </section>
    </main>
  )
}
