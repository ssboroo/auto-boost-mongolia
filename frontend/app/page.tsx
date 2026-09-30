'use client'

import { useEffect, useState } from 'react'
import { Facebook, Globe2, Instagram, Linkedin, Music2, ShieldCheck, Youtube } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import DashboardHero from '../components/dashboard/DashboardHero'
import StatCard from '../components/dashboard/StatCard'
import { useUi } from '../components/ui/UiProvider'
import { apiFetch } from '../lib/api'
import styles from './page.module.css'

type ProviderStatus={id:string;label:string;configured:boolean;liveWritesEnabled:boolean;mode:'preview'|'live';note:string}
type ProvidersResponse={primary:string;providers:ProviderStatus[];supportedChannels:string[]}
type Quote={adBudgetMnt:number;serviceFeePercent:number;serviceFeeMnt:number;totalPayableMnt:number;dailyBudgetMnt:number;channels:string[];durationDays:number}
type MetaSession={connected:boolean}
const money=(value:number)=>Math.round(value||0).toLocaleString('mn-MN')+'₮'
const defaultChannels=['facebook','instagram','google','youtube','tiktok','x','linkedin','microsoft']

export default function HomePage(){
 const {text}=useUi()
 const [providers,setProviders]=useState<ProvidersResponse|null>(null),[meta,setMeta]=useState<MetaSession>({connected:false}),[budget,setBudget]=useState(300000),[duration,setDuration]=useState(7),[quote,setQuote]=useState<Quote|null>(null),[error,setError]=useState('')
 useEffect(()=>{apiFetch<ProvidersResponse>('/ads/providers').then(setProviders).catch(()=>undefined);apiFetch<MetaSession>('/meta/session').then(setMeta).catch(()=>setMeta({connected:false}))},[])
 useEffect(()=>{const timer=window.setTimeout(()=>{apiFetch<Quote>('/ads/quote',{method:'POST',body:JSON.stringify({channels:defaultChannels,objective:'traffic',totalBudgetMnt:budget,durationDays:duration,audience:{country:'MN',ageMin:18,ageMax:65}})}).then(data=>{setQuote(data);setError('')}).catch((e:any)=>setError(e?.message||text('Төсвийн тооцоо авч чадсангүй.','Could not calculate the budget.')))},250);return()=>window.clearTimeout(timer)},[budget,duration,text])
 const shown=providers?.providers?.find(provider=>provider.id==='shown')
 const shownReady=shown?.configured?text('Provider тохирсон','Provider configured'):text('API credential хүлээгдэж байна','Waiting for API credentials')
 return <AppShell>
  <DashboardHero connected={meta.connected}/>
  <section className={styles.kpis}>
   <StatCard icon={<Facebook size={22}/>} value="Facebook" label="Meta Ads" trend={meta.connected?text('Account холбогдсон','Account connected'):text('Холболт шаардлагатай','Connection required')}/>
   <StatCard icon={<Instagram size={22}/>} value="Instagram" label="Meta Ads" trend={meta.connected?text('Meta-аар бэлэн','Ready via Meta'):text('Холболт шаардлагатай','Connection required')}/>
   <StatCard icon={<Globe2 size={22}/>} value="Google" label="Search / Display" trend={shownReady}/>
   <StatCard icon={<Youtube size={22}/>} value="YouTube" label="Video Ads" trend={shownReady}/>
   <StatCard icon={<Music2 size={22}/>} value="TikTok" label="Short-video Ads" trend={shownReady}/>
   <StatCard icon={<span style={{fontSize:18,fontWeight:900}}>X</span>} value="X Ads" label="X / Twitter" trend={shownReady}/>
   <StatCard icon={<Linkedin size={22}/>} value="LinkedIn" label="B2B Ads" trend={shownReady}/>
   <StatCard icon={<Globe2 size={22}/>} value="Microsoft" label="Bing / Microsoft" trend={shownReady}/>
  </section>

  <section className={styles.workGrid}>
   <article className={styles.boostCard}>
    <div className={styles.sectionHead}><div><span>{text('CAMPAIGN ТӨСӨВ','CAMPAIGN BUDGET')}</span><h2>{text('8 сувгийн нэгдсэн төсөв','Unified budget across 8 channels')}</h2></div><div className={styles.live}><i/>{shown?.mode==='live'?'LIVE API':'SAFE PREVIEW'}</div></div>
    <div className={styles.budgetGrid}><label className={styles.amount}><span>₮</span><input type="number" min="10000" step="10000" value={budget} onChange={e=>setBudget(Math.max(10000,Number(e.target.value)||10000))}/><em>MNT</em></label><div className={styles.presets}>{[3,5,7,14,30].map(days=><button key={days} onClick={()=>setDuration(days)} className={duration===days?styles.selected:''}>{days} {text('хоног','days')}</button>)}</div></div>
    <div className={styles.summary}><div><small>{text('Рекламын төсөв','Ad budget')}</small><b>{quote?money(quote.adBudgetMnt):'—'}</b></div><div><small>{text('Үйлчилгээний шимтгэл','Service fee')}</small><b>{quote?money(quote.serviceFeeMnt):'—'}</b></div><div><small>{text('Нийт','Total')}</small><b>{quote?money(quote.totalPayableMnt):'—'}</b></div></div>
    <div className={styles.payment}><div><ShieldCheck size={20}/><p><b>{text('Зардлын хамгаалалт','Spend protection')}</b><small>{text('Provider API бүрэн баталгаажаагүй үед campaign зөвхөн preview байдлаар бэлтгэгдэнэ.','Campaigns remain preview-only until provider credentials and write permissions are verified.')}</small></p></div><button onClick={()=>window.location.assign('/campaigns/new')}>{text('Campaign үүсгэх','Create campaign')} →</button></div>
    {error&&<div className={styles.error}>{error}</div>}
   </article>
   <aside className={styles.insight}><div className={styles.insightIcon}>✦</div><h3>{shown?.label||'Shown'} provider</h3><p>{text('White-label multi-channel API integration-д бэлэн архитектур. Live write нь зөвхөн credential баталгаажсаны дараа асна.','White-label multi-channel architecture ready. Live writes stay disabled until credentials are verified.')}</p><a href="/connections">{text('Холболтууд харах','View connections')} →</a></aside>
  </section>

  <section className={styles.campaigns}><div className={styles.sectionHead}><div><span>{text('ҮЙЛ АЖИЛЛАГААНЫ УРСГАЛ','PLATFORM FLOW')}</span><h2>{text('Нэг захиалга → 8 рекламын суваг','One order → 8 advertising channels')}</h2></div><a href="/campaigns/new">{text('Шинээр эхлэх','Start new')} →</a></div><div className={styles.tableWrap}><table><thead><tr><th>{text('Алхам','Step')}</th><th>{text('Төлөв','Status')}</th><th>{text('Тайлбар','Details')}</th><th>{text('Үйлдэл','Action')}</th></tr></thead><tbody>
   <StatusRow title={text('1. Суваг сонгох','1. Choose channels')} status={text('8 суваг','8 channels')} detail="Meta, Google, YouTube, TikTok, X, LinkedIn, Microsoft" href="/campaigns/new"/>
   <StatusRow title={text('2. Зорилго сонгох','2. Choose objective')} status={text('Бэлэн','Ready')} detail="Messages, traffic, leads, video views, sales" href="/campaigns/new"/>
   <StatusRow title={text('3. Account холбох','3. Connect accounts')} status={meta.connected?text('Meta бэлэн','Meta ready'):text('Setup','Setup')} detail={text('Provider OAuth / рекламын account холболт','Provider OAuth / advertising account connections')} href="/connections"/>
   <StatusRow title={text('4. Төлбөр','4. Billing')} status="MNT" detail={text('Ad budget + үйлчилгээний шимтгэл','Ad budget + service fee')} href="/payments"/>
   <StatusRow title={text('5. Provider submit','5. Provider submit')} status={shown?.liveWritesEnabled?'LIVE':'PREVIEW'} detail={text('Shown primary provider; direct API fallback боломжтой','Shown primary provider with direct API fallback architecture')} href="/admin"/>
  </tbody></table></div></section>
  <footer className={styles.footer}>BOOST.MN · Multi-channel Ads Automation · <a href="/privacy">{text('Нууцлал','Privacy')}</a> · <a href="/terms">{text('Нөхцөл','Terms')}</a> · <a href="/data-deletion">{text('Мэдээлэл устгах','Data deletion')}</a></footer>
 </AppShell>
}
function StatusRow({title,status,detail,href}:{title:string;status:string;detail:string;href:string}){return <tr><td><span className={styles.rowIcon}><Globe2 size={16}/></span><b>{title}</b></td><td><span className={styles.badge+' '+styles.good}><i/>{status}</span></td><td>{detail}</td><td><a href={href}>Open →</a></td></tr>}
