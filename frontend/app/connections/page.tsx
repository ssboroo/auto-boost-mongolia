'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { CheckCircle2, ExternalLink, Facebook, Globe2, Instagram, Linkedin, Link2, Music2, Youtube } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import { apiFetch } from '../../lib/api'
import styles from './page.module.css'

type MetaSession={connected:boolean;profile?:{name?:string}}
type Provider={configured:boolean;liveWritesEnabled:boolean;mode:'preview'|'live'}
type ChannelItem={id:string;name:string;group:string;icon:ReactNode;mode:'direct'|'shown'}

export default function ConnectionsPage(){
 const {text}=useUi()
 const [meta,setMeta]=useState<MetaSession>({connected:false}),[provider,setProvider]=useState<Provider|null>(null)
 useEffect(()=>{apiFetch<MetaSession>('/meta/session').then(setMeta).catch(()=>undefined);apiFetch<any>('/ads/providers').then(r=>setProvider(r?.providers?.[0]||null)).catch(()=>undefined)},[])
 const channels:ChannelItem[]=[
  {id:'facebook',name:'Facebook',group:'Meta',icon:<Facebook size={21}/>,mode:'direct'},
  {id:'instagram',name:'Instagram',group:'Meta',icon:<Instagram size={21}/>,mode:'direct'},
  {id:'google',name:'Google Ads',group:'Google',icon:<Globe2 size={21}/>,mode:'shown'},
  {id:'youtube',name:'YouTube Ads',group:'Google',icon:<Youtube size={21}/>,mode:'shown'},
  {id:'tiktok',name:'TikTok Ads',group:'TikTok',icon:<Music2 size={21}/>,mode:'shown'},
  {id:'x',name:'X Ads',group:'X / Twitter',icon:<b style={{fontSize:18}}>X</b>,mode:'shown'},
  {id:'linkedin',name:'LinkedIn Ads',group:'LinkedIn',icon:<Linkedin size={21}/>,mode:'shown'},
  {id:'microsoft',name:'Microsoft Ads',group:'Bing / Microsoft',icon:<Globe2 size={21}/>,mode:'shown'},
 ]
 return <AppShell title={text('Сувгийн холболтууд','Channel connections')} subtitle={text('Сурталчилгааны account, OAuth болон provider readiness-ийг нэг дор хяна.','Manage advertising accounts, OAuth and provider readiness from one place.')}>
  <section className={styles.hero}><div><span><Link2 size={16}/>{text('8 СУВАГ','8 CHANNELS')}</span><h2>{text('Account-уудаа нэг дор холбоно.','Connect your ad accounts in one place.')}</h2><p>{text('Meta direct integration одоо ажиллана. Бусад сувгууд Shown partner credential ирмэгц энэ UI-аас идэвхжинэ.','Meta direct integration works now. Other channels activate from this screen once Shown partner credentials are available.')}</p></div><div className={styles.summary}><b>{meta.connected?'2':'0'} / 8</b><small>{text('шууд бэлэн суваг','channels directly ready')}</small></div></section>
  <div className={styles.grid}>{channels.map(c=>{const ready=c.mode==='direct'?meta.connected:Boolean(provider?.liveWritesEnabled);const pending=c.mode==='shown'&&!provider?.liveWritesEnabled;return <article className={styles.card} key={c.id}><div className={styles.icon}>{c.icon}</div><div className={styles.cardTitle}><div><b>{c.name}</b><small>{c.group}</small></div><span data-ready={ready}>{ready?text('Холбогдсон','Connected'):pending?text('API хүлээгдэж байна','API pending'):text('Холбоогүй','Not connected')}</span></div><p>{c.mode==='direct'?text('Meta OAuth, Ad Account, billing readiness болон spend guard.','Meta OAuth, Ad Account, billing readiness and spend guard.'):text('Shown white-label provider adapter-аар OAuth / campaign routing хийнэ.','OAuth and campaign routing through the Shown white-label provider adapter.')}</p>{c.mode==='direct'?<a href="/facebook">{meta.connected?text('Meta тохиргоо','Meta settings'):text('Meta холбох','Connect Meta')} <ExternalLink size={13}/></a>:<button disabled><CheckCircle2 size={13}/>{text('Provider credential шаардлагатай','Provider credential required')}</button>}</article>})}</div>
  <div className={styles.note}><b>{text('Shown-оос хариу хүлээхгүйгээр бэлэн болсон зүйл','Ready without waiting for Shown')}</b><p>{text('UI, channel model, provider abstraction, budget quote, campaign preview, billing, Meta direct OAuth, account readiness, language/theme preferences, admin checks болон security guard бүгд ажиллана.','UI, channel model, provider abstraction, budget quotes, campaign preview, billing, direct Meta OAuth, account readiness, language/theme preferences, admin checks and safety guards are ready.')}</p></div>
 </AppShell>
}
