'use client'

import { useEffect, useMemo, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { apiFetch } from '../../lib/api'
import styles from '../manager.module.css'

type Account={id:string;account_id:string;name:string;currency:string}
type Insight={campaign_id?:string;campaign_name?:string;spend?:string;impressions?:string;reach?:string;clicks?:string;ctr?:string;cpc?:string;cpm?:string;frequency?:string;actions?:Array<{action_type:string;value:string}>;purchase_roas?:Array<{action_type:string;value:string}>}
const n=(v:any)=>Number(v||0)
const sum=(rows:Insight[],k:keyof Insight)=>rows.reduce((a,r)=>a+n(r[k]),0)
function actionTotal(rows:Insight[],names:string[]){return rows.reduce((a,r)=>a+(r.actions||[]).filter(x=>names.includes(x.action_type)).reduce((s,x)=>s+n(x.value),0),0)}

export default function AnalyticsPage(){
 const [accounts,setAccounts]=useState<Account[]>([]),[accountId,setAccountId]=useState(''),[rows,setRows]=useState<Insight[]>([]),[preset,setPreset]=useState('last_7d'),[loading,setLoading]=useState(true),[error,setError]=useState('')
 async function init(){try{const r=await apiFetch<any>('/meta/ad-accounts');const a=r?.data||[];setAccounts(a);const q=new URLSearchParams(window.location.search).get('account');setAccountId(q||a[0]?.account_id||a[0]?.id||'')}catch(e:any){setError(e?.message||'Ad Account авч чадсангүй.');setLoading(false)}}
 async function load(){if(!accountId)return;setLoading(true);setError('');try{const r=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(accountId)}/insights?date_preset=${encodeURIComponent(preset)}&level=campaign`);setRows(r?.data||[])}catch(e:any){setError(e?.message||'Meta insights авч чадсангүй.')}finally{setLoading(false)}}
 useEffect(()=>{init()},[]);useEffect(()=>{if(accountId)load()},[accountId,preset])
 const account=accounts.find(a=>(a.account_id||a.id)===accountId)
 const totals=useMemo(()=>{const spend=sum(rows,'spend'), impressions=sum(rows,'impressions'), reach=sum(rows,'reach'), clicks=sum(rows,'clicks');const purchases=actionTotal(rows,['purchase','omni_purchase','offsite_conversion.fb_pixel_purchase']);const ctr=impressions?clicks/impressions*100:0;const roas=rows.reduce((a,r)=>a+(r.purchase_roas||[]).reduce((s,x)=>s+n(x.value),0),0);return{spend,impressions,reach,clicks,purchases,ctr,roas}},[rows])
 const maxSpend=Math.max(1,...rows.map(r=>n(r.spend)))
 return <AppShell title="Аналитик" subtitle="Meta Marketing API-аас бодит campaign performance мэдээлэл.">
  <div className={styles.card}><div className={styles.toolbar}><div className={styles.actions}><label className={styles.field} style={{minWidth:260}}><span>Ad Account</span><select value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.account_id||a.id}>{a.name} · {a.currency}</option>)}</select></label><div className={styles.tabs}>{[['today','Өнөөдөр'],['last_7d','7 хоног'],['last_30d','30 хоног'],['this_month','Энэ сар']].map(([v,l])=><button key={v} className={preset===v?styles.tabActive:''} onClick={()=>setPreset(v)}>{l}</button>)}</div></div><button className={styles.secondary} onClick={load}><RefreshCw size={15}/> Шинэчлэх</button></div>
  {error&&<div className={styles.error}>{error}</div>}
  <div className={styles.metricGrid} style={{marginTop:14}}><Metric l="Зарцуулалт" v={`${totals.spend.toLocaleString('mn-MN',{maximumFractionDigits:2})} ${account?.currency||''}`}/><Metric l="Хүрэлт" v={Math.round(totals.reach).toLocaleString('mn-MN')}/><Metric l="Клик" v={Math.round(totals.clicks).toLocaleString('mn-MN')}/><Metric l="CTR" v={`${totals.ctr.toFixed(2)}%`}/><Metric l="Худалдан авалт" v={Math.round(totals.purchases).toLocaleString('mn-MN')}/><Metric l="ROAS" v={totals.roas?totals.roas.toFixed(2):'—'}/></div>
  {loading?<div className={styles.empty}><div className={styles.spinner} style={{margin:'0 auto 10px'}}/>Insights ачаалж байна…</div>:rows.length?<><div className={styles.grid2} style={{marginTop:16}}><section className={styles.card}><h3>Кампайнаар зарцуулалт</h3><div className={styles.chart}>{rows.slice(0,20).map((r,i)=><div key={r.campaign_id||i} className={styles.bar} data-label={`${r.campaign_name||'Campaign'} · ${n(r.spend).toFixed(2)}`} style={{height:`${Math.max(5,n(r.spend)/maxSpend*100)}%`}}/>)}</div></section><section className={styles.card}><h3>Үр дүнгийн тойм</h3><div className={styles.summary}><div><span>Impressions</span><b>{Math.round(totals.impressions).toLocaleString('mn-MN')}</b></div><div><span>Frequency</span><b>{rows.length?(rows.reduce((a,r)=>a+n(r.frequency),0)/rows.length).toFixed(2):'—'}</b></div><div><span>Avg. CPC</span><b>{totals.clicks?(totals.spend/totals.clicks).toFixed(2):'—'} {account?.currency}</b></div><div><span>Campaign count</span><b>{rows.length}</b></div></div></section></div><div className={styles.tableWrap} style={{marginTop:16}}><table className={styles.table}><thead><tr><th>Кампанит ажил</th><th>Spend</th><th>Reach</th><th>Clicks</th><th>CTR</th><th>CPC</th><th>Frequency</th></tr></thead><tbody>{rows.map((r,i)=><tr key={r.campaign_id||i}><td><b>{r.campaign_name||r.campaign_id||'—'}</b></td><td>{n(r.spend).toLocaleString('mn-MN',{maximumFractionDigits:2})}</td><td>{Math.round(n(r.reach)).toLocaleString('mn-MN')}</td><td>{Math.round(n(r.clicks)).toLocaleString('mn-MN')}</td><td>{n(r.ctr).toFixed(2)}%</td><td>{n(r.cpc).toFixed(2)}</td><td>{n(r.frequency).toFixed(2)}</td></tr>)}</tbody></table></div></>:<div className={styles.empty}>Энэ хугацаанд Meta insight data алга.</div>}
  </div>
 </AppShell>
}
function Metric({l,v}:{l:string;v:string}){return <div className={styles.metric}><span>{l}</span><b>{v}</b></div>}
