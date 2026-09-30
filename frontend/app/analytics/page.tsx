'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import { apiFetch } from '../../lib/api'
import styles from '../manager.module.css'

type Account={id:string;account_id:string;name:string;currency:string}
type Insight={campaign_id?:string;campaign_name?:string;spend?:string;impressions?:string;reach?:string;clicks?:string;ctr?:string;cpc?:string;frequency?:string;actions?:Array<{action_type:string;value:string}>;purchase_roas?:Array<{value:string}>}
const n=(v:any)=>Number(v||0)
const sum=(rows:Insight[],k:keyof Insight)=>rows.reduce((a,r)=>a+n(r[k]),0)
function actionTotal(rows:Insight[],names:string[]){return rows.reduce((a,r)=>a+(r.actions||[]).filter(x=>names.includes(x.action_type)).reduce((s,x)=>s+n(x.value),0),0)}

export default function AnalyticsPage(){
 const {text}=useUi()
 const [accounts,setAccounts]=useState<Account[]>([]),[accountId,setAccountId]=useState(''),[rows,setRows]=useState<Insight[]>([]),[preset,setPreset]=useState('last_7d'),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function init(){try{const r=await apiFetch<any>('/meta/ad-accounts');const a=r?.data||[];setAccounts(a);const q=new URLSearchParams(window.location.search).get('account');setAccountId(q||a[0]?.account_id||a[0]?.id||'');if(!a.length)setLoading(false)}catch(e:any){setError(e?.message||text('Ad Account авч чадсангүй.','Could not load Ad Account.'));setLoading(false)}}
 async function load(){if(!accountId)return;setLoading(true);setError('');try{const r=await apiFetch<any>('/meta/ad-accounts/'+encodeURIComponent(accountId)+'/insights?date_preset='+encodeURIComponent(preset)+'&level=campaign');setRows(r?.data||[])}catch(e:any){setError(e?.message||text('Insights авч чадсангүй.','Could not load insights.'))}finally{setLoading(false)}}
 useEffect(()=>{init()},[])
 useEffect(()=>{if(accountId)load()},[accountId,preset])
 const account=accounts.find(a=>(a.account_id||a.id)===accountId)
 const totals=useMemo(()=>{const spend=sum(rows,'spend'),impressions=sum(rows,'impressions'),reach=sum(rows,'reach'),clicks=sum(rows,'clicks'),purchases=actionTotal(rows,['purchase','omni_purchase','offsite_conversion.fb_pixel_purchase']),ctr=impressions?clicks/impressions*100:0,roas=rows.reduce((a,r)=>a+(r.purchase_roas||[]).reduce((s,x)=>s+n(x.value),0),0);return{spend,impressions,reach,clicks,purchases,ctr,roas}},[rows])
 const maxSpend=Math.max(1,...rows.map(r=>n(r.spend)))
 return <AppShell title={text('Үр дүн ба аналитик','Analytics')} subtitle={text('Одоогоор Meta direct live data. Provider reporting идэвхжихэд бүх сувгийг нэг schema-д нэгтгэнэ.','Currently showing live Meta direct data. Provider reporting will normalize all channels into this same view.')}>
  <div className={styles.notice} style={{marginBottom:14}}>{text('Multi-channel normalized metrics: spend, impressions, reach, clicks, CTR, CPC, leads, conversions, revenue, ROAS, video views.','Normalized multi-channel metrics: spend, impressions, reach, clicks, CTR, CPC, leads, conversions, revenue, ROAS and video views.')}</div>
  <div className={styles.card}>
   <div className={styles.toolbar}><div className={styles.actions}><label className={styles.field} style={{minWidth:260}}><span>Meta Ad Account</span><select value={accountId} onChange={e=>setAccountId(e.target.value)}><option value="">{text('Account сонгох','Select account')}</option>{accounts.map(a=><option key={a.id} value={a.account_id||a.id}>{a.name} · {a.currency}</option>)}</select></label><div className={styles.tabs}>{[['today',text('Өнөөдөр','Today')],['last_7d',text('7 хоног','7 days')],['last_30d',text('30 хоног','30 days')],['this_month',text('Энэ сар','This month')]].map(([v,l])=><button key={v} className={preset===v?styles.tabActive:''} onClick={()=>setPreset(v)}>{l}</button>)}</div></div><button className={styles.secondary} onClick={load} disabled={!accountId}><RefreshCw size={15}/>{text('Шинэчлэх','Refresh')}</button></div>
   {error&&<div className={styles.error}>{error}</div>}
   <div className={styles.metricGrid} style={{marginTop:14}}><Metric l={text('Зарцуулалт','Spend')} v={totals.spend.toLocaleString(undefined,{maximumFractionDigits:2})+' '+(account?.currency||'')}/><Metric l={text('Хүрэлт','Reach')} v={Math.round(totals.reach).toLocaleString()}/><Metric l={text('Клик','Clicks')} v={Math.round(totals.clicks).toLocaleString()}/><Metric l="CTR" v={totals.ctr.toFixed(2)+'%'}/><Metric l={text('Худалдан авалт','Purchases')} v={Math.round(totals.purchases).toLocaleString()}/><Metric l="ROAS" v={totals.roas?totals.roas.toFixed(2):'—'}/></div>
   {!accountId?<div className={styles.empty}>{text('Live data харахын тулд Meta account холбоно уу. Preview campaign-ууд Shownгүйгээр ажиллана.','Connect a Meta account to see live data. Preview campaigns work without Shown.')}</div>:loading?<div className={styles.empty}><div className={styles.spinner} style={{margin:'0 auto 10px'}}/>{text('Insights ачаалж байна…','Loading insights…')}</div>:rows.length?<div className={styles.grid2} style={{marginTop:16}}><section className={styles.card}><h3>{text('Campaign зарцуулалт','Spend by campaign')}</h3><div className={styles.chart}>{rows.slice(0,20).map((r,i)=><div key={r.campaign_id||i} className={styles.bar} data-label={(r.campaign_name||'Campaign')+' · '+n(r.spend).toFixed(2)} style={{height:Math.max(5,n(r.spend)/maxSpend*100)+'%'}}/>)}</div></section><section className={styles.card}><h3>{text('Үр дүнгийн тойм','Performance summary')}</h3><div className={styles.summary}><div><span>Impressions</span><b>{Math.round(totals.impressions).toLocaleString()}</b></div><div><span>Frequency</span><b>{rows.length?(rows.reduce((a,r)=>a+n(r.frequency),0)/rows.length).toFixed(2):'—'}</b></div><div><span>Avg. CPC</span><b>{totals.clicks?(totals.spend/totals.clicks).toFixed(2):'—'} {account?.currency}</b></div><div><span>Campaigns</span><b>{rows.length}</b></div></div></section></div>:<div className={styles.empty}>{text('Энэ хугацаанд insight data алга.','No insight data for this period.')}</div>}
  </div>
 </AppShell>
}
function Metric({l,v}:{l:string;v:string}){return <div className={styles.metric}><span>{l}</span><b>{v}</b></div>}
