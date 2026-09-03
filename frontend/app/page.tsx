'use client'

import { useEffect, useState } from 'react'
import { CircleDollarSign, CreditCard, Facebook, Gauge, ShieldCheck, WalletCards } from 'lucide-react'
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
   <section className={styles.kpis} id="analytics">
     <StatCard icon={<Facebook size={22}/>} value={session.connected?'Холбогдсон':'Холбоогүй'} label="Facebook" trend={session.connected?'Meta OAuth бэлэн':'Setup шаардлагатай'}/>
     <StatCard icon={<WalletCards size={22}/>} value={`$${budgetUsd.toFixed(0)}`} label="Meta зарын төсөв" trend={quote?money(quote.adBudgetMnt):'Тооцож байна'}/>
     <StatCard icon={<CircleDollarSign size={22}/>} value={quote?money(quote.serviceFeeMnt):'—'} label="RAINY шимтгэл" trend={`${quote?.serviceFeePercent??10}% үйлчилгээ`}/>
     <StatCard icon={<Gauge size={22}/>} value={quote?money(quote.totalDisplayMnt):'—'} label="Нийт үнэлгээ" trend={rateLabel}/>
   </section>

   <section className={styles.workGrid} id="boost">
    <article className={styles.boostCard}>
      <div className={styles.sectionHead}><div><span>BOOST STUDIO</span><h2>Meta зарын төсөв тохируулах</h2></div><div className={styles.live}><i/> LIVE FX</div></div>
      <div className={styles.budgetGrid}>
       <label className={styles.amount}><span>$</span><input type="number" min="1" value={budgetUsd} onChange={e=>setBudgetUsd(Math.max(1,Number(e.target.value)||1))}/><em>USD</em></label>
       <div className={styles.presets}>{presets.map(v=><button key={v} onClick={()=>setBudgetUsd(v)} className={budgetUsd===v?styles.selected:''}>${v}</button>)}</div>
      </div>
      <div className={styles.summary}><div><small>Meta төсөв</small><b>{quote?money(quote.adBudgetMnt):'—'}</b></div><div><small>RAINY шимтгэл</small><b>{quote?money(quote.serviceFeeMnt):'—'}</b></div><div><small>Нийт үнэлгээ</small><b>{quote?money(quote.totalDisplayMnt):'—'}</b></div></div>
      <div className={styles.payment} id="payment"><div><ShieldCheck size={20}/><p><b>Аюулгүй төлбөр</b><small>Meta зарын төсөв Meta дээр, RAINY шимтгэл QPay-аар төлөгдөнө.</small></p></div><button onClick={payFee} disabled={paying||!quote}>{paying?'QPay нээж байна…':'QPay-аар шимтгэл төлөх'} →</button></div>
      {message&&<div className={styles.success}>{message}</div>}{error&&<div className={styles.error}>{error}<button onClick={()=>refreshQuote()}>Дахин оролдох</button></div>}
    </article>
    <aside className={styles.insight}><div className={styles.insightIcon}>↗</div><h3>Өдөр бүр бага зэрэг оновчлол,<br/>маргааш том өсөлт.</h3><p>RAINY таны зарын workflow-г ойлгомжтой, аюулгүй удирдана.</p><a href="/facebook">Facebook readiness →</a></aside>
   </section>

   <section className={styles.campaigns} id="campaigns"><div className={styles.sectionHead}><div><span>WORKFLOW STATUS</span><h2>Сүүлийн кампанит ажлын бэлэн байдал</h2></div><a href="/facebook">Бүгдийг шалгах</a></div><div className={styles.tableWrap}><table><thead><tr><th>Алхам</th><th>Төлөв</th><th>Дэлгэрэнгүй</th><th>Үйлдэл</th></tr></thead><tbody>
     <StatusRow icon={<Facebook size={16}/>} title="Facebook холболт" good={session.connected} status={session.connected?'Бэлэн':'Шаардлагатай'} detail={session.connected?'Meta OAuth холбогдсон':'Facebook account холбоно'} href="/facebook"/>
     <StatusRow icon={<CreditCard size={16}/>} title="Meta зарын төсөв" good status="Тохируулсан" detail={`$${budgetUsd.toFixed(2)} · ${quote?money(quote.adBudgetMnt):'—'}`} href="#boost"/>
     <StatusRow icon={<CircleDollarSign size={16}/>} title="RAINY шимтгэл" good={Boolean(quote)} status={quote?'Тооцоолсон':'Хүлээгдэж байна'} detail={quote?`${quote.serviceFeePercent}% · ${money(quote.serviceFeeMnt)}`:'Quote ачаалж байна'} href="#payment"/>
     <StatusRow icon={<ShieldCheck size={16}/>} title="Pre-Launch System Check" good status="Админ шалгалт" detail="Meta, Supabase, webhook, FX, production URL" href="/admin"/>
   </tbody></table></div></section>

   <footer className={styles.footer}>RAINY · Технологийн Хязгааргүй Боломж · <a href="/privacy">Нууцлал</a> · <a href="/terms">Нөхцөл</a> · <a href="/data-deletion">Мэдээлэл устгах</a></footer>
 </AppShell>
}
function StatusRow({icon,title,status,good,detail,href}:{icon:any;title:string;status:string;good:boolean;detail:string;href:string}){return <tr><td><span className={styles.rowIcon}>{icon}</span><b>{title}</b></td><td><span className={`${styles.badge} ${good?styles.good:styles.warn}`}><i/>{status}</span></td><td>{detail}</td><td><a href={href}>Нээх →</a></td></tr>}
