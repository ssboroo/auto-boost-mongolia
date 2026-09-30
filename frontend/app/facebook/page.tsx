'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Check, CreditCard, ExternalLink, Facebook, Loader2, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react'
import { API_BASE, apiFetch } from '../../lib/api'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import styles from './page.module.css'

type Status={configured:boolean;sessionConfigured:boolean;productionReady:boolean;graphVersion:string;redirectUri:string;tenantStorageConfigured?:boolean}
type Session={connected:boolean;profile?:{name?:string}}
type Account={id:string;accountId:string;name:string;currency:string;timezoneName:string;accountStatus:number;accountStatusLabel:string;disableReason:number;billingState:'READY'|'MISSING'|'UNKNOWN';paymentGuard:'READY'|'PAYMENT_FAILED'|'ACCOUNT_BLOCKED'|'PAYMENT_METHOD_MISSING'|'BILLING_CHECK_REQUIRED';paymentFailed:boolean;ready:boolean;userMessage:string}
type Readiness={connected:boolean;hasAdAccount:boolean;billingVisibility:boolean;ready:boolean;paymentFailed:boolean;accounts:Account[];setup:{createAdAccountUrl:string;adsManagerUrl:string;billingUrl:string};note:string}

export default function FacebookConnectionPage(){
 const {text}=useUi()
 const [status,setStatus]=useState<Status|null>(null),[session,setSession]=useState<Session>({connected:false}),[readiness,setReadiness]=useState<Readiness|null>(null),[loading,setLoading]=useState(true),[connecting,setConnecting]=useState(false),[error,setError]=useState('')
 async function refresh(){setLoading(true);setError('');try{const [s,ss]=await Promise.all([apiFetch<Status>('/meta/status'),apiFetch<Session>('/meta/session').catch(()=>({connected:false}))]);setStatus(s);setSession(ss);if(ss.connected)setReadiness(await apiFetch<Readiness>('/meta/readiness'));else setReadiness(null)}catch(err:any){setError(err?.message||text('Backend API-тай холбогдож чадсангүй: ','Could not connect to backend API: ')+API_BASE)}finally{setLoading(false)}}
 useEffect(()=>{const p=new URLSearchParams(window.location.search);const e=p.get('error');if(e)setError(e);refresh()},[])
 async function connectFacebook(){setConnecting(true);setError('');try{const data=await apiFetch<{url:string}>('/meta/auth/url');if(!data?.url)throw new Error(text('Facebook Login URL олдсонгүй.','Facebook Login URL was not returned.'));window.location.assign(data.url)}catch(err:any){setError(err?.message||text('Facebook холболтыг эхлүүлж чадсангүй.','Could not start Facebook connection.'));setConnecting(false)}}
 async function disconnectFacebook(){await apiFetch('/meta/logout',{method:'POST'});setSession({connected:false});setReadiness(null)}
 const appReady=Boolean(status?.productionReady)
 const active=readiness?.accounts.find(a=>a.ready)||readiness?.accounts.find(a=>a.paymentFailed)||readiness?.accounts.find(a=>a.accountStatus===1)||readiness?.accounts[0]
 const paymentFailed=Boolean(active?.paymentFailed)

 return <AppShell title={text('Meta / Facebook','Meta / Facebook')} subtitle={text('OAuth → Ad Account → Billing → Campaign readiness дарааллаар автоматаар шалгана.','Automatically checks OAuth → Ad Account → Billing → Campaign readiness.')}>
  <section className={styles.hero}><div><span>META ADS CONNECTION</span><h2>{text('Facebook бизнес аккаунтаа','Connect your Facebook business account')}<br/><em>BOOST.MN</em></h2><p>{text('Нууц үг BOOST.MN дээр хадгалагдахгүй. Meta-ийн албан ёсны OAuth урсгалаар Page, Ad Account болон шаардлагатай permission-үүдийг холбоно.','BOOST.MN never stores your Facebook password. Pages, Ad Accounts and required permissions are connected through Meta’s official OAuth flow.')}</p><div className={styles.security}><ShieldCheck size={16}/>{text('Campaign ACTIVE болохын өмнө billing readiness дахин шалгагдана.','Billing readiness is rechecked before a campaign can become ACTIVE.')}</div></div><div className={styles.metaVisual}><Facebook size={44}/><b>{session.connected?text('Холбогдсон','Connected'):'Meta OAuth'}</b><small>{status?.graphVersion||'v25.0'}</small></div></section>

  {error&&<div className={styles.error}><b>{text('Мэдээлэл ачаалж чадсангүй.','Could not load data.')}</b><span>{error}</span><button onClick={refresh}>{text('Дахин оролдох','Try again')}</button></div>}

  {paymentFailed&&readiness&&<section className={styles.paymentFailed}><CreditCard size={22}/><div><b>{text('Төлбөрийн асуудал — Campaign блоклогдсон','Billing issue — Campaign blocked')}</b><p>{active?.userMessage}</p></div><a href={readiness.setup.billingUrl} target="_blank" rel="noreferrer">{text('Meta Billing нээх','Open Meta Billing')} <ExternalLink size={14}/></a><button onClick={refresh}><RefreshCw size={14}/>{text('Дахин шалгах','Check again')}</button></section>}

  <div className={styles.steps}>
   <Step n="01" title="Facebook" ok={session.connected} text={session.connected?text('Холбогдсон','Connected'):text('Холбох шаардлагатай','Connection required')}/>
   <Step n="02" title="Ad Account" ok={Boolean(readiness?.hasAdAccount)} text={readiness?.hasAdAccount?String(readiness.accounts.length)+' '+text('аккаунт','accounts'):text('Шаардлагатай','Required')}/>
   <Step n="03" title={text('Төлбөр','Billing')} ok={active?.paymentGuard==='READY'} text={paymentFailed?text('Төлбөрийн асуудал','Billing issue'):active?.paymentGuard==='READY'?text('Бэлэн','Ready'):text('Шалгах шаардлагатай','Needs review')}/>
   <Step n="04" title="Campaign" ok={Boolean(readiness?.ready)} text={paymentFailed?text('Блоклогдсон','Blocked'):readiness?.ready?text('Бэлэн','Ready'):text('Хүлээгдэж байна','Pending')}/>
  </div>

  <div className={styles.grid}>
   <section className={styles.card}><div className={styles.cardHead}><span><Facebook size={20}/></span><div><small>{text('АЛХАМ 01','STEP 01')}</small><h3>{text('Facebook холболт','Facebook connection')}</h3></div></div>{session.connected?<><div className={styles.connected}><div>{session.profile?.name?.slice(0,1).toUpperCase()||'F'}</div><p><span>{text('Холбогдсон','Connected')}</span><b>{session.profile?.name||text('Facebook хэрэглэгч','Facebook user')}</b><small>{text('OAuth token хамгаалагдсан','OAuth token protected')}</small></p><Check size={19}/></div><button className={styles.secondary} onClick={disconnectFacebook}>{text('Холболтыг салгах','Disconnect')}</button></>:<><p className={styles.muted}>{text('Meta-ийн албан ёсны нэвтрэх цонхоор Facebook бизнес аккаунтаа холбоно.','Connect your Facebook business account through Meta’s official login window.')}</p><button className={styles.primary} onClick={connectFacebook} disabled={!appReady||loading||connecting}>{connecting?<Loader2 className={styles.spin} size={17}/>:<Facebook size={17}/>} {connecting?text('Facebook руу шилжиж байна…','Opening Facebook…'):text('Facebook-тэй холбох','Connect Facebook')}<ArrowRight size={16}/></button></>}</section>

   <section className={styles.card}><div className={styles.cardHead}><span className={styles.green}><ShieldCheck size={20}/></span><div><small>{text('АЛХАМ 02–04','STEP 02–04')}</small><h3>Ad Account readiness</h3></div></div>
   {!session.connected?<Empty text={text('Эхлээд Facebook холбоно уу.','Connect Facebook first.')}/>:loading?<Empty text={text('Meta Ad Account шалгаж байна…','Checking Meta Ad Accounts…')}/>:!readiness?.hasAdAccount?<Setup icon={<WalletCards size={19}/>} title={text('Ad Account олдсонгүй','No Ad Account found')} body={text('Meta Business Settings дээр Ad Account үүсгээд дахин шалгана уу.','Create an Ad Account in Meta Business Settings, then check again.')} href={readiness?.setup.createAdAccountUrl||'https://business.facebook.com/settings/ad-accounts'} button={text('Ad Account үүсгэх','Create Ad Account')}/>:<div className={styles.accounts}>{readiness.accounts.map(a=><article key={a.id} className={a.paymentFailed?styles.accountError:''}><div><b>{a.name||'Ad Account '+a.accountId}</b><small>{a.accountId} · {a.currency} · {a.timezoneName}</small></div><span data-ready={a.ready}>{a.ready?'CAMPAIGN READY':a.paymentFailed?'PAYMENT FAILED':a.accountStatusLabel}</span><p>{text('Төлбөр:','Billing:')} <b>{a.paymentFailed?text('Асуудалтай','Issue'):a.billingState==='READY'?text('Бэлэн','Ready'):a.billingState==='MISSING'?text('Payment method шаардлагатай','Payment method required'):text('Meta дээр баталгаажуулна','Verify in Meta')}</b></p></article>)}</div>}

   {active?.paymentFailed&&readiness&&<Setup icon={<CreditCard size={19}/>} title={text('Төлбөрийн асуудлаа шийднэ үү','Resolve the billing issue')} body={active.userMessage} href={readiness.setup.billingUrl} button={text('Meta Billing нээх','Open Meta Billing')}/>}
   {active&&!active.paymentFailed&&active.accountStatus!==1&&readiness&&<Setup icon={<ShieldCheck size={19}/>} title={'Ad Account '+active.accountStatusLabel} body={text('Ads Manager дээр restriction, account issue эсвэл outstanding balance-аа шийднэ үү.','Resolve restrictions, account issues or outstanding balances in Ads Manager.')} href={readiness.setup.adsManagerUrl} button={text('Ads Manager нээх','Open Ads Manager')}/>}
   {active&&!active.paymentFailed&&active.accountStatus===1&&active.billingState!=='READY'&&readiness&&<Setup icon={<CreditCard size={19}/>} title={text('Payment method тохируулах','Configure payment method')} body={readiness.note} href={readiness.setup.billingUrl} button={text('Meta Billing нээх','Open Meta Billing')}/>}
   {readiness?.ready&&<div className={styles.ready}><Check size={18}/><div><b>{text('Campaign ажиллуулахад бэлэн','Ready to run campaigns')}</b><small>{text('ACTIVE болгохын өмнө guard дахин шалгана.','Guards are checked again before ACTIVE status.')}</small></div><a href="/campaigns/new">{text('Campaign үүсгэх','Create campaign')} →</a></div>}
   {session.connected&&!paymentFailed&&<button className={styles.primary} onClick={refresh} disabled={loading}><RefreshCw size={15}/>{loading?text('Шалгаж байна…','Checking…'):text('Дахин шалгах','Check again')}</button>}
   </section>
  </div>
 </AppShell>
}
function Step({n,title,ok,text}:{n:string;title:string;ok:boolean;text:string}){return <div className={styles.step}><small>{n}</small><b>{title}</b><span data-ok={ok}>{ok?'✓ ':''}{text}</span></div>}
function Empty({text}:{text:string}){return <div className={styles.empty}>{text}</div>}
function Setup({icon,title,body,href,button}:{icon:any;title:string;body:string;href:string;button:string}){return <div className={styles.setup}>{icon}<div><b>{title}</b><p>{body}</p><a href={href} target="_blank" rel="noreferrer">{button}<ExternalLink size={13}/></a></div></div>}
