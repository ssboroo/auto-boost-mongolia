'use client'

import type { FormEvent, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Facebook, Globe2, Instagram, Linkedin, Music2, ShieldCheck, Sparkles, Youtube } from 'lucide-react'
import AppShell from '../../../components/layout/AppShell'
import { useUi } from '../../../components/ui/UiProvider'
import { apiFetch } from '../../../lib/api'
import styles from './page.module.css'

type Channel='facebook'|'instagram'|'google'|'youtube'|'tiktok'|'x'|'linkedin'|'microsoft'
type Objective='messages'|'traffic'|'leads'|'video_views'|'sales'
type ProviderStatus={id:string;label:string;configured:boolean;liveWritesEnabled:boolean;mode:'preview'|'live';note:string}
type Quote={adBudgetMnt:number;serviceFeePercent:number;serviceFeeMnt:number;totalPayableMnt:number;dailyBudgetMnt:number;perChannelBudgetMnt:number;channels:Channel[];durationDays:number;provider:ProviderStatus}
type Preview={campaign:any;quote:Quote;providerPayload:any;submitReady:boolean}
const money=(v:number)=>Math.round(v||0).toLocaleString('mn-MN')+'₮'

export default function NewCampaignPage(){
 const {text}=useUi()
 const objectives:Array<{id:Objective;title:string;desc:string}>=[
  {id:'messages',title:text('Message авах','Get messages'),desc:text('Messenger / DM харилцаа нэмэгдүүлэх','Drive Messenger / DM conversations')},
  {id:'traffic',title:text('Website хандалт','Website traffic'),desc:text('Сайт руу илүү олон хүн оруулах','Send more people to your website')},
  {id:'leads',title:text('Lead авах','Generate leads'),desc:text('Сонирхсон хэрэглэгчийн мэдээлэл авах','Collect potential customer information')},
  {id:'video_views',title:text('Видео үзэлт','Video views'),desc:text('Видео reach болон view нэмэгдүүлэх','Grow video reach and views')},
  {id:'sales',title:text('Борлуулалт','Sales'),desc:text('Conversion болон худалдан авалтад чиглүүлэх','Optimize toward conversions and purchases')},
 ]
 const [channels,setChannels]=useState<Channel[]>(['facebook','instagram','google','youtube','tiktok','x'])
 const [objective,setObjective]=useState<Objective>('traffic'),[budget,setBudget]=useState(300000),[duration,setDuration]=useState(7),[websiteUrl,setWebsiteUrl]=useState(''),[headline,setHeadline]=useState(''),[primaryText,setPrimaryText]=useState(''),[city,setCity]=useState('Улаанбаатар'),[ageMin,setAgeMin]=useState(18),[ageMax,setAgeMax]=useState(55),[interests,setInterests]=useState(''),[quote,setQuote]=useState<Quote|null>(null),[provider,setProvider]=useState<ProviderStatus|null>(null),[preview,setPreview]=useState<Preview|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const requestBody=useMemo(()=>({name:headline||'BOOST.MN campaign',channels,objective,totalBudgetMnt:budget,durationDays:duration,websiteUrl:websiteUrl||undefined,headline:headline||undefined,primaryText:primaryText||undefined,callToAction:objective==='messages'?'Send Message':objective==='sales'?'Shop Now':'Learn More',audience:{country:'MN',city:city||undefined,ageMin,ageMax,interests:interests.split(',').map(x=>x.trim()).filter(Boolean)}}),[channels,objective,budget,duration,websiteUrl,headline,primaryText,city,ageMin,ageMax,interests])
 useEffect(()=>{apiFetch<any>('/ads/providers').then(r=>setProvider(r?.providers?.[0]||null)).catch(()=>undefined)},[])
 useEffect(()=>{if(!channels.length){setQuote(null);return}const timer=window.setTimeout(()=>{apiFetch<Quote>('/ads/quote',{method:'POST',body:JSON.stringify(requestBody)}).then(r=>{setQuote(r);setError('')}).catch((e:any)=>setError(e?.message||text('Төсөв тооцоолж чадсангүй.','Could not calculate the budget.')))},250);return()=>window.clearTimeout(timer)},[requestBody,channels.length,text])
 function toggleChannel(channel:Channel){setPreview(null);setChannels(current=>current.includes(channel)?current.filter(x=>x!==channel):[...current,channel])}
 async function createPreview(e:FormEvent){e.preventDefault();setLoading(true);setPreview(null);setError('');try{const r=await apiFetch<Preview>('/ads/campaign-preview',{method:'POST',body:JSON.stringify(requestBody)});setPreview(r);localStorage.setItem('boost_last_campaign_preview',JSON.stringify({...r,createdAt:new Date().toISOString()}))}catch(err:any){setError(err?.message||text('Campaign preview үүсгэж чадсангүй.','Could not create campaign preview.'))}finally{setLoading(false)}}
 return <AppShell title={text('Шинэ сурталчилгаа','Create campaign')} subtitle={text('Нэг тохиргоогоор 8 хүртэл рекламын сувагт campaign бэлтгэнэ.','Prepare a campaign for up to 8 advertising channels from one workflow.')}>
  <form className={styles.layout} onSubmit={createPreview}><div className={styles.main}>
   <Section n="01" title={text('Суваг сонгох','Choose channels')} desc={text('Олон сувгийг зэрэг сонгож болно.','Select one or multiple channels.')}>
    <div className={styles.channels}>
     <ChannelButton title="Facebook" subtitle="Meta" active={channels.includes('facebook')} onClick={()=>toggleChannel('facebook')} icon={<Facebook size={22}/>}/>
     <ChannelButton title="Instagram" subtitle="Meta" active={channels.includes('instagram')} onClick={()=>toggleChannel('instagram')} icon={<Instagram size={22}/>}/>
     <ChannelButton title="Google" subtitle="Search / Display" active={channels.includes('google')} onClick={()=>toggleChannel('google')} icon={<Globe2 size={22}/>}/>
     <ChannelButton title="YouTube" subtitle="Video Ads" active={channels.includes('youtube')} onClick={()=>toggleChannel('youtube')} icon={<Youtube size={22}/>}/>
     <ChannelButton title="TikTok" subtitle="Short-video" active={channels.includes('tiktok')} onClick={()=>toggleChannel('tiktok')} icon={<Music2 size={22}/>}/>
     <ChannelButton title="X" subtitle="X / Twitter" active={channels.includes('x')} onClick={()=>toggleChannel('x')} icon={<b style={{fontSize:18}}>X</b>}/>
     <ChannelButton title="LinkedIn" subtitle="B2B Ads" active={channels.includes('linkedin')} onClick={()=>toggleChannel('linkedin')} icon={<Linkedin size={22}/>}/>
     <ChannelButton title="Microsoft" subtitle="Bing Ads" active={channels.includes('microsoft')} onClick={()=>toggleChannel('microsoft')} icon={<Globe2 size={22}/>}/>
    </div>
   </Section>
   <Section n="02" title={text('Зорилго','Objective')} desc={text('Платформ бүрийн campaign төрлийг зорилгод тааруулна.','Each network is mapped to the closest matching campaign objective.')}>
    <div className={styles.objectives}>{objectives.map(item=><button type="button" key={item.id} className={objective===item.id?styles.selected:''} onClick={()=>{setObjective(item.id);setPreview(null)}}><b>{item.title}</b><small>{item.desc}</small></button>)}</div>
   </Section>
   <Section n="03" title={text('Төсөв ба хугацаа','Budget & duration')} desc={text('Нийт төсөв Монгол төгрөгөөр.','Enter your total budget in MNT.')}>
    <div className={styles.twoCols}><label><span>{text('Нийт рекламын төсөв','Total ad budget')}</span><div className={styles.inputWithSuffix}><input type="number" min="10000" step="10000" value={budget} onChange={e=>{setBudget(Math.max(10000,Number(e.target.value)||10000));setPreview(null)}}/><b>₮</b></div></label><label><span>{text('Хугацаа','Duration')}</span><select value={duration} onChange={e=>{setDuration(Number(e.target.value));setPreview(null)}}>{[3,5,7,14,30].map(d=><option value={d} key={d}>{d} {text('хоног','days')}</option>)}</select></label></div>
   </Section>
   <Section n="04" title={text('Creative ба холбоос','Creative & destination')} desc={text('Платформ бүрт тохируулах үндсэн контент.','Core content used to adapt creative for each channel.')}>
    <div className={styles.fields}><label><span>Website / landing page</span><input value={websiteUrl} onChange={e=>{setWebsiteUrl(e.target.value);setPreview(null)}} placeholder="https://example.mn"/></label><label><span>{text('Гарчиг','Headline')}</span><input value={headline} onChange={e=>{setHeadline(e.target.value);setPreview(null)}} placeholder={text('Таны бүтээгдэхүүний гол санал','Your main offer')}/></label><label><span>{text('Зарын текст','Primary text')}</span><textarea value={primaryText} onChange={e=>{setPrimaryText(e.target.value);setPreview(null)}} placeholder={text('Хэрэглэгчид харагдах үндсэн рекламын текст...','Main advertising message...')} rows={4}/></label></div>
   </Section>
   <Section n="05" title={text('Аудитори','Audience')} desc={text('Монгол зах зээлд зориулсан энгийн targeting.','Simple targeting for the Mongolian market.')}>
    <div className={styles.twoCols}><label><span>{text('Хот','City')}</span><input value={city} onChange={e=>{setCity(e.target.value);setPreview(null)}}/></label><label><span>{text('Сонирхол','Interests')}</span><input value={interests} onChange={e=>{setInterests(e.target.value);setPreview(null)}} placeholder="technology, fashion, restaurant"/></label><label><span>{text('Насны доод хязгаар','Minimum age')}</span><input type="number" min="18" max="65" value={ageMin} onChange={e=>setAgeMin(Number(e.target.value))}/></label><label><span>{text('Насны дээд хязгаар','Maximum age')}</span><input type="number" min="18" max="65" value={ageMax} onChange={e=>setAgeMax(Number(e.target.value))}/></label></div>
   </Section>
  </div><aside className={styles.side}>
   <div className={styles.summaryCard}><div className={styles.provider}><Sparkles size={18}/><div><b>{provider?.label||'Shown'}</b><small>{provider?.mode==='live'?'LIVE provider':'SAFE PREVIEW'}</small></div></div><div className={styles.line}><span>{text('Сонгосон суваг','Selected channels')}</span><b>{channels.length} / 8</b></div><div className={styles.line}><span>{text('Өдрийн дундаж','Daily average')}</span><b>{quote?money(quote.dailyBudgetMnt):'—'}</b></div><div className={styles.line}><span>{text('1 сувагт дундаж','Average per channel')}</span><b>{quote?money(quote.perChannelBudgetMnt):'—'}</b></div><div className={styles.line}><span>{text('Үйлчилгээний шимтгэл','Service fee')}</span><b>{quote?money(quote.serviceFeeMnt):'—'}</b></div><div className={styles.total}><span>{text('Нийт төлбөр','Total payable')}</span><b>{quote?money(quote.totalPayableMnt):'—'}</b></div><button type="submit" disabled={loading||!channels.length}>{loading?text('Бэлтгэж байна…','Preparing…'):text('Preview үүсгэх','Create preview')}</button><div className={styles.guard}><ShieldCheck size={16}/><p><b>{text('Зардлын хамгаалалт','Spend protection')}</b><small>{text('Preview нь мөнгө зарцуулахгүй. Live submit зөвхөн provider API болон хэрэглэгчийн баталгаажуулалт бэлэн үед нээгдэнэ.','Preview never spends money. Live submit only unlocks after provider credentials and explicit confirmation.')}</small></p></div>{error&&<div className={styles.error}>{error}</div>}</div>
   {preview&&<div className={styles.previewCard}><span>PREVIEW READY</span><h3>{preview.campaign.name}</h3><p>{preview.campaign.channels.join(' · ')}</p><dl><div><dt>{text('Зорилго','Objective')}</dt><dd>{preview.campaign.objective}</dd></div><div><dt>{text('Хугацаа','Duration')}</dt><dd>{preview.campaign.durationDays} {text('хоног','days')}</dd></div><div><dt>Provider</dt><dd>{preview.quote.provider.label}</dd></div><div><dt>Submit</dt><dd>{preview.submitReady?'API ready':'Preview only'}</dd></div></dl></div>}
  </aside></form>
 </AppShell>
}
function Section({n,title,desc,children}:{n:string;title:string;desc:string;children:ReactNode}){return <section className={styles.card}><div className={styles.heading}><span>{n}</span><div><h2>{title}</h2><p>{desc}</p></div></div>{children}</section>}
function ChannelButton({title,subtitle,active,onClick,icon}:{title:string;subtitle:string;active:boolean;onClick:()=>void;icon:ReactNode}){return <button type="button" onClick={onClick} className={active?styles.activeChannel:''}><span>{icon}</span><b>{title}</b><small>{active?'✓ ':''}{subtitle}</small></button>}
