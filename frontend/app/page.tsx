'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3, Bot, Check, ChevronRight, CircleDollarSign, Facebook, ImagePlus,
  LayoutDashboard, Megaphone, Settings, ShieldCheck, Sparkles, Target, Users,
  WandSparkles, WalletCards, Zap,
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
type MetaStatus = { productionReady: boolean; configured: boolean }
type MetaSession = { connected: boolean; profile?: { name?: string } }

const money = (value: number) => `${Math.round(value).toLocaleString('mn-MN')}₮`
const usd = (value: number) => `$${value.toFixed(2)}`

export default function HomePage() {
  const [dailyUsd, setDailyUsd] = useState(5)
  const [days, setDays] = useState(7)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [meta, setMeta] = useState<MetaStatus | null>(null)
  const [session, setSession] = useState<MetaSession>({ connected: false })
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const totalUsd = useMemo(() => Math.max(.5, dailyUsd) * Math.max(1, days), [dailyUsd, days])

  async function refreshQuote(value = totalUsd) {
    try {
      const next = await apiFetch<Quote>(`/billing/quote?usd=${encodeURIComponent(value.toFixed(2))}`)
      setQuote(next)
    } catch (err: any) {
      setError(err?.message || 'Ханшийн мэдээлэл авч чадсангүй.')
    }
  }

  useEffect(() => {
    Promise.all([
      refreshQuote(totalUsd),
      apiFetch<MetaStatus>('/meta/status').then(setMeta).catch(() => setMeta(null)),
      apiFetch<MetaSession>('/meta/session').then(setSession).catch(() => setSession({ connected: false })),
    ]).finally(() => setLoading(false))

    const params = new URLSearchParams(window.location.search)
    const paymentIntent = params.get('payment_intent')
    if (params.get('payment') === 'success' && paymentIntent) {
      setMessage('Wire төлбөрийн буцаалт ирлээ. Webhook баталгаажуулалт шалгаж байна…')
      apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(paymentIntent)}`)
        .then((payment) => {
          if (payment?.wire_status === 'succeeded') setMessage('Үйлчилгээний шимтгэл амжилттай төлөгдлөө.')
          else setMessage('Төлбөр хүлээн авсан. Wire webhook баталгаажуулалт түр хүлээгдэж байна.')
        })
        .catch(() => undefined)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => refreshQuote(totalUsd), 250)
    return () => window.clearTimeout(timer)
  }, [totalUsd])

  async function payFee() {
    setPaying(true)
    setError('')
    setMessage('')
    try {
      const result = await apiFetch<{ checkoutUrl: string }>('/billing/fee-checkout', {
        method: 'POST',
        body: JSON.stringify({ metaBudgetUsd: totalUsd }),
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

  const rateLabel = quote ? `1 USD = ${quote.fx.rate.toLocaleString('mn-MN')}₮` : 'Ханш ачаалж байна…'

  return (
    <main className={styles.page}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <div className={styles.mark}><WandSparkles size={20}/></div>
          <div><b>AUTO BOOST</b><span>MONGOLIA</span></div>
        </div>
        <div className={styles.workspace}><small>WORKSPACE</small><b>Үндсэн аккаунт</b></div>
        <nav className={styles.nav}>
          <a className={styles.active} href="#studio"><LayoutDashboard size={18}/><span>Хяналтын самбар</span></a>
          <a href="#boost"><Megaphone size={18}/><span>Шинэ boost</span></a>
          <a href="#money"><CircleDollarSign size={18}/><span>Төлбөр</span></a>
          <a href="/facebook"><Facebook size={18}/><span>Facebook холболт</span></a>
          <a href="#"><BarChart3 size={18}/><span>Тайлан</span></a>
          <a href="#"><Bot size={18}/><span>AI зөвлөмж</span></a>
          <a href="#"><Settings size={18}/><span>Тохиргоо</span></a>
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.miniCard}><span>SPEND PROTECTION</span><b>PAUSED-first</b><p>Зар хэрэглэгчийн баталгаагүйгээр автоматаар ACTIVE болохгүй.</p></div>
        </div>
      </aside>

      <section className={styles.main} id="studio">
        <header className={styles.topbar}>
          <div className={styles.crumb}>Auto Boost / <b>Boost Studio</b></div>
          <div className={styles.statusGroup}>
            <div className={styles.status}><i className={styles.dot}/><span>{loading ? 'Шалгаж байна' : 'Систем online'}</span></div>
            <button className={styles.profile} onClick={signOut} title="Гарах">AB</button>
          </div>
        </header>

        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}><Sparkles size={14}/> MONGOLIAN META ADS STUDIO</span>
            <h1>Boost төсвөө <em>₮-өөр ойлгомжтой</em> удирд.</h1>
            <p>Meta-ийн долларын төсөв, Монголбанкны USD/MNT ханш, Auto Boost үйлчилгээний шимтгэл гурвыг нэг дэлгэц дээр бодитоор салгаж харуулна.</p>
            <div className={styles.heroActions}>
              <a className={styles.primary} href="#boost"><Zap size={17}/> Boost тохируулах</a>
              <a className={styles.secondary} href="/facebook"><Facebook size={17}/> Facebook холбох</a>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.floatingAd}>
              <div className={styles.adHead}><div className={styles.adAvatar}>AB</div><div><b>Auto Boost Mongolia</b><span>Sponsored · Meta</span></div></div>
              <p className={styles.adText}>Монгол хэлтэй AI Ads Manager — төсөв, audience, creative бүгд нэг дор.</p>
              <div className={styles.adCreative}>BOOST SMARTER.</div>
              <div className={styles.adCta}><small>auto-boost-mongolia.vercel.app</small><button>Дэлгэрэнгүй</button></div>
            </div>
          </div>
        </section>

        <div className={styles.grid} id="boost">
          <section className={`${styles.card} ${styles.builder}`}>
            <div className={styles.cardHead}>
              <div><span className={styles.eyebrow}>NEW BOOST</span><h2>Зарын үндсэн тохиргоо</h2></div>
              <span className={styles.stepPill}>01 / 03 · Төсөв</span>
            </div>

            <div className={styles.fields}>
              <label className={`${styles.field} ${styles.full}`}><span>Кампайны нэр</span><input defaultValue="2026 · Facebook Boost"/></label>
              <label className={styles.field}><span>Зорилго</span><select defaultValue="messages"><option value="messages">Мессеж авах</option><option value="engagement">Оролцоо нэмэх</option><option value="traffic">Веб хандалт</option><option value="sales">Борлуулалт</option></select></label>
              <label className={styles.field}><span>Хугацаа</span><select value={days} onChange={e=>setDays(Number(e.target.value))}>{[3,5,7,10,14,30].map(x=><option key={x} value={x}>{x} хоног</option>)}</select></label>

              <div className={styles.budgetBlock}>
                <div className={styles.budgetTop}>
                  <div><span>ӨДРИЙН META BUDGET</span><b>{usd(dailyUsd)}</b></div>
                  <em>≈ {quote ? money(quote.adBudgetMnt / days) : '—'} / өдөр</em>
                </div>
                <input className={styles.slider} type="range" min="1" max="100" step="1" value={dailyUsd} onChange={e=>setDailyUsd(Number(e.target.value))}/>
                <div className={styles.budgetMeta}>
                  <div><small>Нийт Meta budget</small><b>{usd(totalUsd)}</b></div>
                  <div><small>Монгол төгрөгөөр</small><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
                  <div><small>Ханш</small><b>{rateLabel}</b></div>
                </div>
              </div>

              <label className={`${styles.field} ${styles.full}`}><span>Audience</span><input defaultValue="Улаанбаатар · 23–45 нас · Бүгд"/><small>Дараагийн шатанд Meta targeting-ийг нарийвчилна.</small></label>
              <div className={`${styles.field} ${styles.full}`}><span>Creative</span><div className={styles.upload}><div><ImagePlus size={23}/><strong>Пост эсвэл зураг / видео сонгох</strong><small>Facebook existing post, 1:1, 4:5, 9:16 creative</small></div></div></div>
            </div>
          </section>

          <aside className={styles.side} id="money">
            <section className={`${styles.card} ${styles.moneyCard}`}>
              <div className={styles.moneyTitle}><div><span className={styles.moneyIcon}><WalletCards size={18}/></span><b>Төсвийн тооцоо</b></div><span className={styles.live}>LIVE MNT</span></div>
              <div className={styles.rateBox}><span>Монголбанк USD/MNT</span><div><b>{rateLabel}</b><small>{quote?.fx.rateDate || '—'} · official reference</small></div></div>

              <div className={styles.breakdown}>
                <div className={styles.row}><span>Meta-д зарцуулах төсөв</span><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
                <div className={`${styles.row} ${styles.rowFee}`}><span>Auto Boost үйлчилгээний шимтгэл ({quote?.serviceFeePercent ?? 10}%)</span><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b></div>
              </div>

              <div className={styles.grand}><span>НИЙТ ҮНЭЛГЭЭ</span><b>{quote ? money(quote.totalDisplayMnt) : '—'}</b><small>Meta spend + Auto Boost fee</small></div>

              <button className={styles.payButton} onClick={payFee} disabled={paying || !quote}><WalletCards size={17}/>{paying ? 'Wire checkout нээж байна…' : `Шимтгэл ${quote ? money(quote.serviceFeeMnt) : ''} төлөх`}</button>
              <div className={styles.wireNote}><ShieldCheck size={14}/><span>Wire.mn-аар зөвхөн Auto Boost үйлчилгээний шимтгэл төлөгдөнө. Meta зарын төсөв таны Meta Ad Account-ийн өөрийн payment method-оор Meta руу төлөгдөнө.</span></div>
              {message && <div className={styles.toast}>{message}</div>}
              {error && <div className={styles.error}>{error}</div>}
            </section>

            <section className={`${styles.card} ${styles.statusCard}`}>
              <h3>Нийтлэхийн өмнөх шалгалт</h3>
              <div className={styles.check}><i>✓</i><span>USD → MNT ханш ачаалсан</span></div>
              <div className={session.connected ? styles.check : `${styles.check} ${styles.warn}`}><i>{session.connected ? '✓' : '!'}</i><span>{session.connected ? `${session.profile?.name || 'Facebook'} холбогдсон` : 'Facebook Ads холбоно уу'}</span></div>
              <div className={meta?.productionReady ? styles.check : `${styles.check} ${styles.warn}`}><i>{meta?.productionReady ? '✓' : '!'}</i><span>{meta?.productionReady ? 'Meta API production ready' : 'Meta App тохиргоо шалгана уу'}</span></div>
              <div className={styles.check}><i>✓</i><span>Шинэ зар PAUSED төлөвөөр үүснэ</span></div>
              <div className={styles.footerLine}><span>FX source</span><b>{quote?.fx.source === 'bank_of_mongolia' ? 'Монголбанк' : quote?.fx.source || '—'}</b></div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  )
}
