'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, CreditCard, ExternalLink, Facebook, Loader2, RefreshCw, ShieldCheck, Unplug, WalletCards, Zap } from 'lucide-react'
import styles from './page.module.css'
import { API_BASE, apiFetch } from '../../lib/api'

type Status = { configured:boolean; sessionConfigured:boolean; productionReady:boolean; graphVersion:string; redirectUri:string; tenantStorageConfigured?:boolean }
type Session = { connected:boolean; profile?:{name?:string} }
type Account = { id:string; accountId:string; name:string; currency:string; timezoneName:string; accountStatus:number; accountStatusLabel:string; disableReason:number; billingState:'READY'|'MISSING'|'UNKNOWN'; ready:boolean }
type Readiness = { connected:boolean; hasAdAccount:boolean; billingVisibility:boolean; ready:boolean; accounts:Account[]; setup:{createAdAccountUrl:string; adsManagerUrl:string; billingUrl:string}; note:string }

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
      if(ss.connected){
        const r=await apiFetch<Readiness>('/meta/readiness')
        setReadiness(r)
      }else setReadiness(null)
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
  const activeAccount=readiness?.accounts.find(a=>a.ready) || readiness?.accounts.find(a=>a.accountStatus===1) || readiness?.accounts[0]

  return <main className={styles.page}>
    <div className={styles.glowA}/><div className={styles.glowB}/>
    <div className={styles.wrap}>
      <header className={styles.topbar}>
        <a className={styles.back} href="/"><ArrowLeft size={17}/> Хяналтын самбар</a>
        <div className={styles.apiPill}><i className={error?styles.redDot:styles.greenDot}/>{error?'API асуудалтай':'Meta Direct API · 2026.09'}</div>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>META ADS READINESS</span>
          <h1>Facebook → Ad Account →<br/><em>Payment → Boost</em></h1>
          <p>Систем Facebook холболтын дараа зарын аккаунт, account status болон Meta billing readiness-ийг дарааллаар шалгана. Бэлэн биш бол яг хийх setup алхмыг гаргана.</p>
          <div className={styles.securityLine}><ShieldCheck size={17}/><span>Картын дугаар Auto Boost дээр хадгалагдахгүй. Meta зарын мөнгийг хэрэглэгч өөрийн Meta Ad Account payment method-оор Meta-д төлнө.</span></div>
        </div>
        <div className={styles.connectionVisual}><div className={styles.metaNode}><Facebook size={30}/><span>META</span></div><div className={styles.connectionBeam}><i/></div><div className={styles.boostNode}><Zap size={28}/><span>AUTO BOOST</span></div></div>
      </section>

      {error&&<div className={styles.error}><Unplug size={18}/><div><b>Шалгалтын алдаа</b><p>{error}</p></div><button onClick={refresh}><RefreshCw size={15}/> Дахин шалгах</button></div>}

      <section style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:12,margin:'18px 0'}}>
        <FlowStep n="01" title="Facebook" ok={session.connected} text={session.connected?'Холбогдсон':'OAuth холбоно'}/>
        <FlowStep n="02" title="Ad Account" ok={Boolean(readiness?.hasAdAccount)} text={readiness?.hasAdAccount?`${readiness.accounts.length} аккаунт`:'Шаардлагатай'}/>
        <FlowStep n="03" title="Payment" ok={Boolean(activeAccount?.billingState==='READY')} text={activeAccount?.billingState==='READY'?'Бэлэн':activeAccount?.billingState==='UNKNOWN'?'Meta дээр шалгана':'Payment method алга'}/>
        <FlowStep n="04" title="Boost" ok={Boolean(readiness?.ready)} text={readiness?.ready?'Бэлэн':'Хүлээгдэж байна'}/>
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
            <div style={{display:'grid',gap:10}}>{readiness.accounts.map(a=><div key={a.id} style={{border:'1px solid rgba(255,255,255,.1)',borderRadius:16,padding:14,background:'rgba(255,255,255,.035)'}}><div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center'}}><div><b style={{display:'block'}}>{a.name||`Ad Account ${a.accountId}`}</b><small style={{opacity:.65}}>{a.accountId} · {a.currency} · {a.timezoneName}</small></div><span style={{fontSize:11,fontWeight:800,color:a.ready?'#60d394':a.accountStatus===1?'#ffd166':'#ff7b7b'}}>{a.ready?'BOOST READY':a.accountStatusLabel}</span></div><div style={{marginTop:10,fontSize:12,opacity:.8}}>Payment: <b>{a.billingState==='READY'?'Бэлэн':a.billingState==='MISSING'?'Payment method шаардлагатай':'Meta Billing дээр баталгаажуулна'}</b></div></div>)}</div>
            {activeAccount&&activeAccount.accountStatus!==1&&<SetupBox icon={<ShieldCheck size={20}/>} title={`Ad Account ${activeAccount.accountStatusLabel}`} text="Энэ Ad Account одоогоор ACTIVE биш байна. Ads Manager дээр account issue, restriction эсвэл outstanding balance-аа шийднэ үү." href={readiness.setup.adsManagerUrl} button="Ads Manager нээх"/>}
            {activeAccount&&activeAccount.accountStatus===1&&activeAccount.billingState!=='READY'&&<SetupBox icon={<CreditCard size={20}/>} title="Payment method тохируулах" text={readiness.note} href={readiness.setup.billingUrl} button="Meta Billing нээх"/>}
            {readiness.ready&&<div className={styles.connectedBox}><div className={styles.profileCircle}><Check size={18}/></div><div><span>Бүх шалгалт амжилттай</span><b>Boost хийхэд бэлэн</b><small>Campaign/Ad Set/Ad эхлээд PAUSED төлөвөөр үүснэ.</small></div><a href="/" style={{marginLeft:'auto',fontWeight:800}}>Boost →</a></div>}
          </>}
          {session.connected&&<button className={styles.primary} onClick={refresh} disabled={loading}><RefreshCw size={16}/> {loading?'Шалгаж байна…':'Дахин шалгах'}</button>}
        </section>
      </div>

      <section className={styles.capabilitySection}>
        <div className={styles.capabilityHead}><span>2026.09 SETUP GUIDE</span><h3>Хэрэглэгчид юу харагдах вэ?</h3></div>
        <div className={styles.capabilityGrid}>
          <Capability num="01" title="Ad Account байхгүй" text="Meta Business Settings рүү шууд setup товч гарна."/>
          <Capability num="02" title="Payment method байхгүй" text="Meta Billing & payments руу оруулж картаа Meta дээр холбоно."/>
          <Capability num="03" title="Account disabled" text="Boost блоклогдоно; Ads Manager дээр account issue шийдэх заавар гарна."/>
          <Capability num="04" title="Ready" text="Account ACTIVE + billing ready болсон үед л Boost үргэлжилнэ."/>
        </div>
      </section>
    </div>
  </main>
}

function FlowStep({n,title,ok,text}:{n:string;title:string;ok:boolean;text:string}){return <div style={{padding:14,borderRadius:16,border:'1px solid rgba(255,255,255,.1)',background:'rgba(255,255,255,.04)'}}><small style={{opacity:.5}}>{n}</small><b style={{display:'block',margin:'5px 0'}}>{title}</b><span style={{fontSize:12,color:ok?'#60d394':'#ffd166'}}>{ok?'✓ ':''}{text}</span></div>}
function SetupBox({icon,title,text,href,button}:{icon:any;title:string;text:string;href:string;button:string}){return <div style={{marginTop:14,padding:16,borderRadius:16,border:'1px solid rgba(255,209,102,.25)',background:'rgba(255,209,102,.06)'}}><div style={{display:'flex',gap:10}}>{icon}<div><b>{title}</b><p style={{margin:'6px 0 12px',fontSize:12,lineHeight:1.6,opacity:.75}}>{text}</p><a href={href} target="_blank" rel="noreferrer" style={{display:'inline-flex',alignItems:'center',gap:7,fontWeight:800}}>{button}<ExternalLink size={14}/></a></div></div></div>}
function Capability({num,title,text}:{num:string;title:string;text:string}){return <article className={styles.capability}><span>{num}</span><b>{title}</b><p>{text}</p></article>}
