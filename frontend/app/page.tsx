'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  Bell,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  CreditCard,
  Facebook,
  FileText,
  Gauge,
  Home,
  LogOut,
  Megaphone,
  PlusCircle,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
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

const money = (value: number) => `${Math.round(value || 0).toLocaleString('mn-MN')}₮`
const presets = [5, 20, 50, 100, 200]

export default function HomePage() {
  const [budgetUsd, setBudgetUsd] = useState(20)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [session, setSession] = useState<MetaSession>({ connected: false })
  const [paying, setPaying] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const feeUsd = useMemo(() => {
    if (!quote?.fx.rate) return budgetUsd * 0.1
    return quote.serviceFeeMnt / quote.fx.rate
  }, [quote, budgetUsd])

  async function refreshQuote(value = budgetUsd) {
    try {
      const result = await apiFetch<Quote>(`/billing/quote?usd=${encodeURIComponent(value.toFixed(2))}`)
      setQuote(result)
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
      setMessage('Төлбөрийг баталгаажуулж байна…')
      apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(paymentIntent)}`)
        .then((payment) => {
          setMessage(payment?.wire_status === 'succeeded'
            ? 'Үйлчилгээний шимтгэл амжилттай төлөгдлөө.'
            : 'Төлбөр хүлээн авсан. Баталгаажуулалт хүлээгдэж байна.')
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
      if (!result?.checkoutUrl) throw new Error('QPay төлбөрийн холбоос олдсонгүй.')
      window.location.assign(result.checkoutUrl)
    } catch (err: any) {
      setError(err?.message || 'QPay төлбөр эхлүүлж чадсангүй.')
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
        <a href="/" className={styles.rainyBrand} aria-label="RAINY home">
          <strong>RAINY</strong>
          <span>— Технологийн Хязгааргүй Боломж —</span>
        </a>

        <nav className={styles.sideNav}>
          <a className={styles.active} href="/"><Home size={18} /> Нүүр</a>
          <a href="#boost"><PlusCircle size={18} /> Boost үүсгэх</a>
          <a href="#campaigns"><Megaphone size={18} /> Кампайн ажил</a>
          <a href="/admin"><BarChart3 size={18} /> Аналитик</a>
          <a href="/facebook"><Facebook size={18} /> Facebook холбох</a>
          <a href="#payment"><CreditCard size={18} /> Төлбөр</a>
          <a href="/transactions"><FileText size={18} /> Гүйлгээнүүд</a>
          <a href="/admin"><Settings size={18} /> Тохиргоо</a>
        </nav>

        <section className={styles.upgradeCard}>
          <div className={styles.crown}>♛</div>
          <b>Илүү их боломж</b>
          <p>AI-powered ads бизнесийн өсөлтөд</p>
          <a href="#boost">Boost үүсгэх</a>
        </section>

        <div className={styles.sidebarFooter}>© 2026 RAINY<br />Технологийн Хязгааргүй Боломж</div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.topbar}>
          <label className={styles.searchBox}>
            <Search size={18} />
            <input placeholder="Кампайн ажил, тайлан, тохиргоо хайх…" />
          </label>
          <div className={styles.topActions}>
            <button className={styles.iconButton} aria-label="Notification"><Bell size={19} /></button>
            <div className={styles.userChip}>
              <span className={styles.avatar}>{session.profile?.name?.slice(0, 1).toUpperCase() || 'R'}</span>
              <div><b>{session.profile?.name || 'RAINY хэрэглэгч'}</b><small>{session.connected ? 'Facebook холбогдсон' : 'Facebook холбоогүй'}</small></div>
              <ChevronDown size={16} />
            </div>
            <button className={styles.logout} onClick={signOut} title="Гарах"><LogOut size={17} /></button>
          </div>
        </header>

        <div className={styles.content}>
          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>AI-POWERED FACEBOOK ADS</span>
              <h1>Бизнесээ<br /><em>AI-той хамт өсгө</em></h1>
              <p>Илүү хүртээмж, илүү борлуулалт, илүү өсөлт — хурдан, хялбар, ухаалгаар.</p>
              <div className={styles.heroActions}>
                <a href="#boost" className={styles.primaryButton}>Boost үүсгэх <span>→</span></a>
                <a href="/facebook" className={styles.secondaryButton}><Facebook size={17} /> Facebook холбох</a>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.reachCard}><small>Reach</small><b>+320%</b><div className={styles.miniBars}><i/><i/><i/><i/><i/></div></div>
              <div className={styles.socialCard}>
                <div className={styles.socialTop}><Facebook size={20} fill="currentColor" /><span>Sponsored</span><b>•••</b></div>
                <img src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=900&q=85" alt="RAINY рекламны жишээ" />
                <div className={styles.socialText}>Таны бизнесийг илүү олон хэрэглэгчид</div>
                <div className={styles.reactions}>● 2.4K <span>◌ 120</span></div>
              </div>
              <div className={styles.benefits}>
                <span><Users size={17}/> Илүү хүртээмж</span>
                <span><TrendingUp size={17}/> Илүү борлуулалт</span>
                <span><Zap size={17}/> Бага ажиллагаа</span>
              </div>
              <div className={styles.handNote}>Монголын Бизнесүүд<br />Илүү Тэргэлтэй Ирээдүй рүү ↗</div>
            </div>
          </section>

          <section className={styles.kpiGrid}>
            <KpiCard icon={<Facebook size={23}/>} value={session.connected ? 'Холбогдсон' : 'Холбоогүй'} label="Facebook" trend={session.connected ? 'Ready' : 'Setup required'} />
            <KpiCard icon={<WalletCards size={23}/>} value={`$${budgetUsd.toFixed(0)}`} label="Meta зарын төсөв" trend={quote ? money(quote.adBudgetMnt) : 'Тооцож байна'} />
            <KpiCard icon={<CircleDollarSign size={23}/>} value={quote ? money(quote.serviceFeeMnt) : '—'} label="RAINY шимтгэл" trend={`${quote?.serviceFeePercent ?? 10}% үйлчилгээ`} />
            <KpiCard icon={<Gauge size={23}/>} value={quote ? money(quote.totalDisplayMnt) : '—'} label="Нийт үнэлгээ" trend={rateLabel} />
          </section>

          <section className={styles.dashboardGrid} id="boost">
            <div className={styles.boostPanel}>
              <div className={styles.panelHeader}>
                <div><span>BOOST STUDIO</span><h2>Meta зарын төсөв тохируулах</h2></div>
                <span className={styles.liveBadge}><i/> LIVE FX</span>
              </div>

              <div className={styles.budgetRow}>
                <label className={styles.budgetInput}><span>$</span><input type="number" min="1" value={budgetUsd} onChange={(e)=>setBudgetUsd(Math.max(1, Number(e.target.value)||1))}/><em>USD</em></label>
                <div className={styles.presets}>{presets.map((v)=><button key={v} onClick={()=>setBudgetUsd(v)} className={budgetUsd===v?styles.presetActive:''}>${v}</button>)}</div>
              </div>

              <div className={styles.summaryStrip}>
                <div><small>Meta төсөв</small><b>{quote ? money(quote.adBudgetMnt) : '—'}</b></div>
                <div><small>Үйлчилгээний шимтгэл</small><b>{quote ? money(quote.serviceFeeMnt) : '—'}</b></div>
                <div><small>Нийт үнэлгээ</small><b>{quote ? money(quote.totalDisplayMnt) : '—'}</b></div>
              </div>

              <div className={styles.paymentRow} id="payment">
                <div><ShieldCheck size={20}/><p><b>Аюулгүй төлбөр</b><small>Meta зарын төсөв Meta дээр, RAINY шимтгэл QPay-аар.</small></p></div>
                <button onClick={payFee} disabled={paying || !quote}>{paying ? 'QPay нээж байна…' : 'QPay-аар шимтгэл төлөх'} →</button>
              </div>
              {message && <div className={styles.success}>{message}</div>}
              {error && <div className={styles.error}>{error}</div>}
            </div>

            <aside className={styles.sideInsight}>
              <Sparkles size={26}/>
              <h3>Өдөр бүр бага зэрэг оновчлол, маргааш том өсөлт.</h3>
              <p>RAINY таны зарын workflow-г ухаалаг, аюулгүй байдлаар удирдана.</p>
              <a href="/facebook">Facebook readiness →</a>
            </aside>
          </section>

          <section className={styles.campaignSection} id="campaigns">
            <div className={styles.panelHeader}>
              <div><span>WORKFLOW STATUS</span><h2>Сүүлийн кампанит ажлын бэлэн байдал</h2></div>
              <a href="/facebook">Бүгдийг шалгах</a>
            </div>
            <div className={styles.tableWrap}>
              <table>
                <thead><tr><th>Алхам</th><th>Төлөв</th><th>Дэлгэрэнгүй</th><th>Үйлдэл</th></tr></thead>
                <tbody>
                  <StatusRow icon={<Facebook size={17}/>} title="Facebook холболт" status={session.connected ? 'Бэлэн' : 'Шаардлагатай'} good={session.connected} detail={session.connected ? 'Meta OAuth холбогдсон' : 'Facebook account холбоно'} href="/facebook" />
                  <StatusRow icon={<CreditCard size={17}/>} title="Meta зарын төсөв" status="Тохируулсан" good detail={`$${budgetUsd.toFixed(2)} · ${quote ? money(quote.adBudgetMnt) : '—'}`} href="#boost" />
                  <StatusRow icon={<CircleDollarSign size={17}/>} title="RAINY шимтгэл" status={quote ? 'Тооцоолсон' : 'Хүлээгдэж байна'} good={Boolean(quote)} detail={quote ? `${quote.serviceFeePercent}% · ${money(quote.serviceFeeMnt)}` : 'Quote ачаалж байна'} href="#payment" />
                  <StatusRow icon={<ShieldCheck size={17}/>} title="Pre-Launch System Check" status="Admin шалгалт" good detail="Meta, Supabase, webhook, secrets, FX" href="/admin" />
                </tbody>
              </table>
            </div>
          </section>

          <footer className={styles.footer}>
            <b>RAINY</b><span>AI · MARKETING · AUTOMATION</span><span>ТЕХНОЛОГИЙН ХЯЗГААРГҮЙ БОЛОМЖ</span>
            <div><a href="/privacy">Нууцлал</a><a href="/terms">Нөхцөл</a><a href="/data-deletion">Мэдээлэл устгах</a></div>
          </footer>
        </div>
      </section>
    </main>
  )
}

function KpiCard({ icon, value, label, trend }: { icon: React.ReactNode; value: string; label: string; trend: string }) {
  return <article className={styles.kpiCard}><span className={styles.kpiIcon}>{icon}</span><div><b>{value}</b><small>{label}</small><em>↑ {trend}</em></div></article>
}

function StatusRow({ icon, title, status, good, detail, href }: { icon: React.ReactNode; title: string; status: string; good: boolean; detail: string; href: string }) {
  return <tr><td><span className={styles.rowTitle}>{icon}{title}</span></td><td><span className={good ? styles.statusGood : styles.statusWarn}>{good ? <CheckCircle2 size={13}/> : <Zap size={13}/>} {status}</span></td><td>{detail}</td><td><a href={href}>Нээх →</a></td></tr>
}
