'use client'

import { useEffect, useState } from 'react'
import { BarChart3, CircleDollarSign, CreditCard, Facebook, Gauge, Layers3, PlusCircle, ShieldCheck, WalletCards } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import DashboardHero from '../components/dashboard/DashboardHero'
import StatCard from '../components/dashboard/StatCard'
import { apiFetch } from '../lib/api'
import styles from './page.module.css'

type Fx={rate:number;source:string;rateDate:string;fetchedAt:string}
type Quote={metaBudgetUsd:number;fx:Fx;adBudgetMnt:number;serviceFeePercent:number;serviceFeeMnt:number;totalDisplayMnt:number}
type MetaSession={connected:boolean;profile?:{name?:string}}
const presets=[5,20,50,100,200]
const money=(value:number)=>`${Math.round(value||0).toLocaleString('mn-MN')}₮`

export default function HomePage(){
 const [budgetUsd,setBudgetUsd]=useState(20);const [quote,setQuote]=useState<Quote|null>(null);const [session,setSession]=useState<MetaSession>({connected:false});const [paying,setPaying]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('')
 async function refreshQuote(value=budgetUsd){try{setQuote(await apiFetch<Quote>(`/billing/quote?usd=${encodeURIComponent(value.toFixed(2))}`));setError('')}catch(err:any){setError(err?.message||'Ханшийн мэдээлэл авч чадсангүй.')}}
 useEffect(()=>{refreshQuote(budgetUsd);apiFetch<MetaSession>('/meta/session').then(setSession).catch(()=>setSession({connected:false}));const p=new URLSearchParams(window.location.search);const pi=p.get('payment_intent');if(p.get('payment')==='success'&&pi){setMessage('Төлбөрийг баталгаажуулж байна…');apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(pi)}`).then(x=>setMessage(x?.wire_status==='succeeded'?'Үйлчилгээний шимтгэл амжилттай төлөгдлөө.':'Төлбөр хүлээн авсан. Баталгаажуулалт хүлээгдэж байна.')).catch(()=>undefined)}},[])
 useEffect(()=>{const t=window.setTimeout(()=>refreshQuote(budgetUsd),220);return()=>window.clearTimeout(t)},[budgetUsd])
 async function payFee(){setPaying(true);setMessage('');setError('');try{const r=await apiFetch<{checkoutUrl:string}>('/billing/fee-checkout',{method:'POST',body:JSON.stringify({metaBudgetUsd:budgetUsd})});if(!r?.checkoutUrl)throw new Error('QPay төлбөрийн холбоос олдсонгүй.');window.location.assign(r.checkoutUrl)}catch(err:any){setError(err?.message||'QPay төлбөр эхлүүлж чадсангүй.');setPaying(false)}}
 const rateLabel=quote?`1 USD = ${quote.fx.rate.toLocaleString('mn-MN')}₮`:'Ханш ачаалж байна…'
 return <AppShell>
   <DashboardHero connected={session.connected}/>
   <section className={styles.kpis}>
     <StatCard icon={<Facebook size={22}/>} value={session.connected?'Холбогдсон':'Холбоогүй'} label="Facebook" trend={session.connected?'Meta OAuth бэлэн':'Setup шаардлагатай'}/>
     <StatCard icon={<WalletCards size={22}/>} value={`$${budgetUsd.toFixed(0)}`} label="Meta зарын төсөв" trend={quote?money(quote.adBudgetMnt):'Тооцож байна'}/>
     <StatCard icon={<CircleDollarSign size={22}/>} value={quote?money(quote.serviceFeeMnt):'—'} label="RAINY шимтгэл" trend={`${quote?.serviceFeePercent??10}% үйлчилгээ`}/>
     <StatCard icon={<Gauge size={22}/>} value={quote?money(quote.totalDisplayMnt):'—'} label="Нийт үнэлгээ" trend={rateLabel}/>
   </section>

   <section className={styles.workGrid}>
    <article className={styles.boostCard}>
      <div className={styles.sectionHead}><div><span>QUICK BUDGET</span><h2>Meta төсөв + RAINY шимтгэл</h2></div><div className={styles.live}><i/> LIVE FX</div></div>
      <div className={styles.budgetGrid}>
       <label className={styles.amount}><span>$</span><input type="number" min="1" value={budgetUsd} onChange={e=>setBudgetUsd(Math.max(1,Number(e.target.value)||1))}/><em>USD</em></label>
       <div className={styles.presets}>{presets.map(v=><button key={v} onClick={()=>setBudgetUsd(v)} className={budgetUsd===v?styles.selected:''}>${v}</button>)}</div>
      </div>
      <div className={styles.summary}><div><small>Meta төсөв</small><b>{quote?money(quote.adBudgetMnt):'—'}</b></div><div><small>RAINY шимтгэл</small><b>{quote?money(quote.serviceFeeMnt):'—'}</b></div><div><small>Нийт үнэлгээ</small><b>{quote?money(quote.totalDisplayMnt):'—'}</b></div></div>
      <div className={styles.payment}><div><ShieldCheck size={20}/><p><b>Аюулгүй төлбөр</b><small>Meta зарын төсөв Meta дээр, RAINY шимтгэл QPay-аар төлөгдөнө.</small></p></div><button onClick={payFee} disabled={paying||!quote}>{paying?'QPay нээж байна…':'QPay-аар шимтгэл төлөх'} →</button></div>
      {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}<button onClick={()=>refreshQuote()}>Дахин оролдох</button></div>}
    </article>
    <aside className={styles.insight}><div className={styles.insightIcon}>↗</div><h3>RAINY Ads Manager</h3><p>Page → Post → Objective → Audience → Budget → Schedule → PAUSED Ad гэсэн бүрэн workflow.</p><a href="/boost/create">Boost wizard нээх →</a></aside>
   </section>

   <section className={styles.campaigns}><div className={styles.sectionHead}><div><span>ADS MANAGER</span><h2>Үндсэн удирдлага</h2></div><a href="/campaigns">Кампанит ажлууд →</a></div><div className={styles.tableWrap}><table><thead><tr><th>Хэсэг</th><th>Төлөв</th><th>Дэлгэрэнгүй</th><th>Үйлдэл</th></tr></thead><tbody>
     <StatusRow icon={<PlusCircle size={16}/>} title="Boost үүсгэх" good={session.connected} status={session.connected?'Бэлэн':'Facebook шаардлагатай'} detail="Post, objective, audience, placement, budget, хугацаа" href="/boost/create"/>
     <StatusRow icon={<Layers3 size={16}/>} title="Кампанит ажил" good={session.connected} status={session.connected?'Live Meta data':'Холболт шаардлагатай'} detail="Campaign list, pause, activate, Payment Guard" href="/campaigns"/>
     <StatusRow icon={<BarChart3 size={16}/>} title="Аналитик" good={session.connected} status={session.connected?'Live Insights':'Холболт шаардлагатай'} detail="Spend, reach, clicks, CTR, CPC, purchase, ROAS" href="/analytics"/>
     <StatusRow icon={<Facebook size={16}/>} title="Facebook readiness" good={session.connected} status={session.connected?'Холбогдсон':'Шаардлагатай'} detail="Ad Account, payment method, Payment Failed Guard" href="/facebook"/>
     <StatusRow icon={<CreditCard size={16}/>} title="Төлбөр" good={Boolean(quote)} status={quote?'Бэлэн':'Хүлээгдэж байна'} detail="RAINY fee checkout, receipt, transaction history" href="/payments"/>
     <StatusRow icon={<ShieldCheck size={16}/>} title="Production Check" good status="Admin" detail="Meta, Supabase, webhook, FX, production URL" href="/admin"/>
   </tbody></table></div></section>

   <footer className={styles.footer}>RAINY · Технологийн Хязгааргүй Боломж · <a href="/privacy">Нууцлал</a> · <a href="/terms">Нөхцөл</a> · <a href="/data-deletion">Мэдээлэл устгах</a></footer>
 </AppShell>
}
function StatusRow({icon,title,status,good,detail,href}:{icon:any;title:string;status:string;good:boolean;detail:string;href:string}){return <tr><td><span className={styles.rowIcon}>{icon}</span><b>{title}</b></td><td><span className={`${styles.badge} ${good?styles.good:styles.warn}`}><i/>{status}</span></td><td>{detail}</td><td><a href={href}>Нээх →</a></td></tr>}
