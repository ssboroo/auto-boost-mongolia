'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, ExternalLink, Facebook, Loader2, RefreshCw, ShieldCheck, Unplug, WalletCards, Zap } from 'lucide-react'
import styles from './page.module.css'
import { API_BASE, apiFetch } from '../../lib/api'

type Status = { configured:boolean; sessionConfigured:boolean; productionReady:boolean; graphVersion:string; redirectUri:string; tenantStorageConfigured?:boolean }
type Session = { connected:boolean; profile?:{name?:string} }
type Account = {
  id:string; accountId:string; name:string; currency:string; timezoneName:string; accountStatus:number; accountStatusLabel:string;
  disableReason:number; billingState:'READY'|'MISSING'|'UNKNOWN'; paymentGuard:'READY'|'PAYMENT_FAILED'|'ACCOUNT_BLOCKED'|'PAYMENT_METHOD_MISSING'|'BILLING_CHECK_REQUIRED';
  paymentFailed:boolean; ready:boolean; userMessage:string
}
type Readiness = { connected:boolean; hasAdAccount:boolean; billingVisibility:boolean; ready:boolean; paymentFailed:boolean; accounts:Account[]; setup:{createAdAccountUrl:string; adsManagerUrl:string; billingUrl:string}; note:string }

export default function FacebookConnectionPage() {
  const [status,setStatus]=useState<Status|null>(null)
  const [session,setSession]=useState<Session>({connected:false})
  const [readiness,setReadiness]=useState<Readiness|null>(null)
  const [loading,setLoading]=useState(true)
  const [connecting,setConnecting]=useState(false)
  const [error,setError]=useState('')

  async function refresh(){
    setLoading(true); setError('')
    try{
      const [s,ss]=await Promise.all([apiFetch<Status>('/meta/status'),apiFetch<Session>('/meta/session').catch(()=>({connected:false}))])
      setStatus(s); setSession(ss)
      if(ss.connected){ setReadiness(await apiFetch<Readiness>('/meta/readiness')) }
      else setReadiness(null)
    }catch(err:any){ setError(err?.message||`Backend API (${API_BASE})-тай холбогдож чадсангүй.`) }
    finally{ setLoading(false) }
  }

  useEffect(()=>{ const p=new URLSearchParams(window.location.search); const e=p.get('error'); if(e)setError(e); refresh() },[])

  async function connectFacebook(){
    setConnecting(true); setError('')
    try{ const data=await apiFetch<{url:string}>('/meta/auth/url'); if(!data?.url)throw new Error('Facebook Login URL олдсонгүй.'); window.location.assign(data.url) }
    catch(err:any){ setError(err?.message||'Facebook холболтыг эхлүүлж чадсангүй.'); setConnecting(false) }
  }

  async function disconnectFacebook(){ await apiFetch('/meta/logout',{method:'POST'}); setSession({connected:false}); setReadiness(null) }

  const appReady=Boolean(status?.productionReady)
  const activeAccount=readiness?.accounts.find(a=>a.ready) || readiness?.accounts.find(a=>a.paymentFailed) || readiness?.accounts.find(a=>a.accountStatus===1) || readiness?.accounts[0]
  const paymentFailed=Boolean(activeAccount?.paymentFailed)

  return <main className={styles.page}>
    <div className={styles.glowA}/><div className={styles.glowB}/>
    <div className={styles.wrap}>
      <header className={styles.topbar}>
        <a className={styles.back} href="/"><ArrowLeft size={17}/> Хяналтын самбар</a>
        <div className={styles.apiPill}><i className={error?styles.redDot:styles.greenDot}/>{error?'API асуудалтай':'Meta Direct API · Payment Guard'}</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>META ADS READINESS</span>
          <h1>Facebook → Ad Account →<br/><em>Payment → Boost</em></h1>
          <p>Систем boost эхлэхээс өмнө болон ACTIVE болгохын яг өмнө Meta billing readiness-ийг дахин шалгана. Төлбөрийн асуудалтай бол зар идэвхжихгүй.</p>
          <div className={styles.securityLine}><ShieldCheck size={17}/><span>Картын үлдэгдэл Auto Boost-д харагдахгүй. Харин Meta account UNSETTLED / settlement issue төлөвт орвол Payment Failed Guard boost-ийг блоклоно.</span></div>
        </div>
        <div className={styles.connectionVisual}><div className={styles.metaNode}><Facebook size={30}/><span>META</span></div><div className={styles.connectionBeam}><i/></div><div className={styles.boostNode}><Zap size={28}/><span>AUTO BOOST</span></div></div>
      </section>

      {error&&<div className={styles.error}><Unplug size={18}/><div><b>Шалгалтын алдаа</b><p>{error}</p></div><button onClick={refresh}><RefreshCw size={15}/> Дахин шалгах</button></div>}

      {paymentFailed&&readiness&&<div style={{margin:'18px 0',padding:18,borderRadius:18,border:'1px solid rgba(255,100,100,.35)',background:'rgba(255,70,70,.08)',display:'flex',gap:14,alignItems:'center',flexWrap:'wrap'}}>
        <CreditCard size={24}/><div style={{flex:1,minWidth:240}}><b style={{display:'block',fontSize:16}}>Төлбөр амжилтгүй — Boost блоклогдсон</b><p style={{margin:'6px 0 0',fontSize:13,lineHeight:1.6,opacity:.8}}>{activeAccount?.userMessage}</p></div>
        <a href={readiness.setup.billingUrl} target="_blank" rel="noreferrer" style={{fontWeight:850}}>Картаа цэнэглэх / Billing нээх ↗</a>
        <button className={styles.primary} onClick={refresh} disabled={loading}><RefreshCw size={16}/>{loading?'Шалгаж байна…':'Дахин шалгах'}</button>
      </div>}

      <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,margin:'18px 0'}}>
        <FlowStep n="01" title="Facebook" ok={session.connected} text={session.connected?'Холбогдсон':'OAuth холбоно'}/>
        <FlowStep n="02" title="Ad Account" ok={Boolean(readiness?.hasAdAccount)} text={readiness?.hasAdAccount?`${readiness.accounts.length} аккаунт`:'Шаардлагатай'}/>
        <FlowStep n="03" title="Payment" ok={Boolean(activeAccount?.paymentGuard==='READY')} text={paymentFailed?'PAYMENT FAILED':activeAccount?.paymentGuard==='READY'?'Бэлэн':activeAccount?.billingState==='UNKNOWN'?'Meta дээр шалгана':'Payment method шаардлагатай'}/>
        <FlowStep n="04" title="Boost" ok={Boolean(readiness?.ready)} text={paymentFailed?'Блоклогдсон':readiness?.ready?'Бэлэн':'Хүлээгдэж байна'}/>
      </section>

      <div className={styles.contentGrid}>
        <section className={styles.card}>
          <div className={styles.cardTop}><div className={styles.facebookIcon}><Facebook size={23}/></div><div><span>STEP 01</span><h2>Facebook холбох</h2></div></div>
          {session.connected?<div className={styles.connectedBox}><div className={styles.profileCircle}>{session.profile?.name?.slice(0,1).toUpperCase()||'F'}</div><div><span>Холбогдсон</span><b>{session.profile?.name||'Facebook account'}</b><small>OAuth token хамгаалагдсан</small></div><Check size={20}/></div>:<><p className={styles.cardText}>Meta-ийн албан ёсны OAuth цонхоор нэвтэрнэ. Facebook нууц үгийг Auto Boost харахгүй.</p><button className={styles.primary} onClick={connectFacebook} disabled={!appReady||loading||connecting}>{connecting?<Loader2 className={styles.spin} size={18}/>:<Facebook size={18}/>} {connecting?'Facebook руу шилжиж байна…':'Facebook Ads холбох'} {!connecting&&<ArrowRight size={17}/>}</button></>}
          {session.connected&&<button className={styles.disconnect} onClick={disconnectFacebook}>Facebook холболтыг салгах</button>}
        </section>

        <section className={styles.card}>
          <div className={styles.cardTop}><div className={styles.checkIcon}><ShieldCheck size={22}/></div><div><span>STEP 02–04</span><h2>Ad Account readiness</h2></div></div>
          {!session.connected?<p className={styles.cardText}>Эхлээд Facebook холбоно уу.</p>:loading?<p className={styles.cardText}>Meta Ad Account шалгаж байна…</p>:!readiness?.hasAdAccount?<SetupBox icon={<WalletCards size={20}/>} title="Ad Account олдсонгүй" text="Meta Business Settings дээр шинэ Ad Account үүсгээд энэ хуудсанд буцаж ирж ‘Дахин шалгах’ дарна." href={readiness?.setup.createAdAccountUrl||'https://business.facebook.com/settings/ad-accounts'} button="Ad Account үүсгэх"/>:<>
            <div style={{display:'grid',gap:10}}>{readiness.accounts.map(a=><div key={a.id} style={{border:`1px solid ${a.paymentFailed?'rgba(255,100,100,.35)':'rgba(255,255,255,.1)'}`,borderRadius:16,padding:14,background:a.paymentFailed?'rgba(255,70,70,.06)':'rgba(255,255,255,.035)'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><b style={{display:'block'}}>{a.name||`Ad Account ${a.accountId}`}</b><small style={{opacity:.65}}>{a.accountId} · {a.currency} · {a.timezoneName}</small></div><span style={{fontSize:11,fontWeight:800,color:a.ready?'#60d394':a.paymentFailed?'#ff7b7b':'#ffd166'}}>{a.ready?'BOOST READY':a.paymentFailed?'PAYMENT FAILED':a.accountStatusLabel}</span></div><div style={{marginTop:10,fontSize:12,opacity:.8}}>Payment: <b>{a.paymentFailed?'Төлбөрийн асуудалтай':a.billingState==='READY'?'Бэлэн':a.billingState==='MISSING'?'Payment method шаардлагатай':'Meta Billing дээр баталгаажуулна'}</b></div></div>)}</div>
            {activeAccount&&activeAccount.paymentFailed&&<SetupBox icon={<CreditCard size={20}/>} title="Карт / төлбөрийн асуудлаа шийднэ үү" text={activeAccount.userMessage} href={readiness.setup.billingUrl} button="Meta Billing нээх"/>}
            {activeAccount&&!activeAccount.paymentFailed&&activeAccount.accountStatus!==1&&<SetupBox icon={<ShieldCheck size={20}/>} title={`Ad Account ${activeAccount.accountStatusLabel}`} text="Энэ Ad Account одоогоор ACTIVE биш байна. Ads Manager дээр account issue, restriction эсвэл outstanding balance-аа шийднэ үү." href={readiness.setup.adsManagerUrl} button="Ads Manager нээх"/>}
            {activeAccount&&!activeAccount.paymentFailed&&activeAccount.accountStatus===1&&activeAccount.billingState!=='READY'&&<SetupBox icon={<CreditCard size={20}/>} title="Payment method тохируулах" text={readiness.note} href={readiness.setup.billingUrl} button="Meta Billing нээх"/>}
            {readiness.ready&&<div className={styles.connectedBox}><div className={styles.profileCircle}><Check size={18}/></div><div><span>Бүх шалгалт амжилттай</span><b>Boost хийхэд бэлэн</b><small>ACTIVE болгохын өмнө Payment Failed Guard дахин шалгана.</small></div><a href="/" style={{marginLeft:'auto',fontWeight:800}}>Boost →</a></div>}
          </>}
          {session.connected&&!paymentFailed&&<button className={styles.primary} onClick={refresh} disabled={loading}><RefreshCw size={16}/> {loading?'Шалгаж байна…':'Дахин шалгах'}</button>}
        </section>
      </div>

      <section className={styles.capabilitySection}>
        <div className={styles.capabilityHead}><span>PAYMENT FAILED GUARD</span><h3>Төлбөр хүрэлцэхгүй үед юу болох вэ?</h3></div>
        <div className={styles.capabilityGrid}>
          <Capability num="01" title="Meta billing issue" text="UNSETTLED / settlement issue илэрвэл payment failed гэж тэмдэглэнэ."/>
          <Capability num="02" title="Boost блок" text="Campaign/Ad-г ACTIVE болгохын өмнө backend дахин readiness шалгана."/>
          <Capability num="03" title="Картаа цэнэглэх" text="Хэрэглэгч Meta Billing дээр картаа цэнэглэж эсвэл outstanding balance-аа шийднэ."/>
          <Capability num="04" title="Дахин шалгах" text="Meta ACTIVE + billing ready болсны дараа л Boost дахин зөвшөөрөгдөнө."/>
        </div>
      </section>
    </div>
  </main>
}

function FlowStep({n,title,ok,text}:{n:string;title:string;ok:boolean;text:string}){return <div style={{padding:14,borderRadius:16,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)'}}><small style={{opacity:.5}}>{n}</small><b style={{display:'block',margin:'5px 0'}}>{title}</b><span style={{fontSize:12,color:ok?'#60d394':'#ffd166'}}>{ok?'✓ ':''}{text}</span></div>}
function SetupBox({icon,title,text,href,button}:{icon:any;title:string;text:string;href:string;button:string}){return <div style={{marginTop:14,padding:16,borderRadius:16,border:'1px solid rgba(255,209,102,.25)',background:'rgba(255,209,102,.06)'}}><div style={{display:'flex',gap:10}}>{icon}<div><b>{title}</b><p style={{margin:'6px 0 12px',fontSize:12,lineHeight:1.6,opacity:.75}}>{text}</p><a href={href} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:7,fontWeight:800}}>{button}<ExternalLink size={14}/></a></div></div></div>}
function Capability({num,title,text}:{num:string;title:string;text:string}){return <article className={styles.capability}><span>{num}</span><b>{title}</b><p>{text}</p></article>}
