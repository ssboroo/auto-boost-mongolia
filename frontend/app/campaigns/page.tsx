'use client'

import { useEffect, useMemo, useState } from 'react'
import { CirclePlus, Pause, Play, RefreshCw } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { apiFetch } from '../../lib/api'
import styles from '../manager.module.css'

type Account={id:string;account_id:string;name:string;currency:string}
type Campaign={id:string;name:string;objective:string;status:string;effective_status:string;daily_budget?:string;lifetime_budget?:string;created_time?:string;updated_time?:string}

export default function CampaignsPage(){
 const [accounts,setAccounts]=useState<Account[]>([]),[accountId,setAccountId]=useState(''),[rows,setRows]=useState<Campaign[]>([])
 const [filter,setFilter]=useState('ALL'),[query,setQuery]=useState(''),[loading,setLoading]=useState(true),[error,setError]=useState(''),[busy,setBusy]=useState('')
 async function loadAccounts(){try{const r=await apiFetch<any>('/meta/ad-accounts');const data=r?.data||[];setAccounts(data);const id=data[0]?.account_id||data[0]?.id||'';setAccountId(x=>x||id)}catch(e:any){setError(e?.message||'Ad Account авч чадсангүй.');setLoading(false)}}
 async function loadCampaigns(id=accountId){if(!id)return;setLoading(true);setError('');try{const r=await apiFetch<any>(`/meta/ad-accounts/${encodeURIComponent(id)}/campaigns`);setRows(r?.data||[])}catch(e:any){setError(e?.message||'Кампанит ажлууд ачаалж чадсангүй.')}finally{setLoading(false)}}
 useEffect(()=>{setQuery(new URLSearchParams(window.location.search).get('q')||'');loadAccounts()},[]);useEffect(()=>{if(accountId)loadCampaigns(accountId)},[accountId])
 async function setStatus(c:Campaign,status:'ACTIVE'|'PAUSED'){setBusy(c.id);setError('');try{await apiFetch(`/meta/objects/${encodeURIComponent(c.id)}/status`,{method:'POST',body:JSON.stringify({status})});await loadCampaigns()}catch(e:any){setError(e?.message||`${status} болгож чадсангүй.`)}finally{setBusy('')}}
 const visible=useMemo(()=>rows.filter(c=>(filter==='ALL'||c.effective_status===filter||c.status===filter)&&(!query||c.name.toLowerCase().includes(query.toLowerCase()))),[rows,filter,query])
 const status=(v:string)=>['ACTIVE'].includes(v)?`${styles.badge} ${styles.good}`:['PAUSED','CAMPAIGN_PAUSED'].includes(v)?`${styles.badge} ${styles.warn}`:`${styles.badge} ${styles.neutral}`
 return <AppShell title="Кампанит ажлууд" subtitle="Meta Ad Account дээрх бодит campaign-уудаа харах, pause/activate хийх.">
  <div className={styles.card}><div className={styles.toolbar}><div className={styles.actions}><label className={styles.field} style={{minWidth:250}}><span>Ad Account</span><select value={accountId} onChange={e=>setAccountId(e.target.value)}>{accounts.map(a=><option key={a.id} value={a.account_id||a.id}>{a.name} · {a.currency}</option>)}</select></label><label className={styles.field} style={{minWidth:220}}><span>Хайх</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Кампайны нэр..."/></label></div><div className={styles.actions}><button className={styles.secondary} onClick={()=>loadCampaigns()}><RefreshCw size={15}/> Шинэчлэх</button><a className={styles.primary} href="/boost/create"><CirclePlus size={15}/> Boost үүсгэх</a></div></div>
  <div className={styles.tabs}>{[['ALL','Бүгд'],['ACTIVE','Идэвхтэй'],['PAUSED','Зогсоосон'],['ARCHIVED','Архив']].map(([v,l])=><button key={v} className={filter===v?styles.tabActive:''} onClick={()=>setFilter(v)}>{l}</button>)}</div>
  {error&&<div className={styles.error} style={{marginTop:12}}>{error}</div>}
  {loading?<div className={styles.empty}><div className={styles.spinner} style={{margin:'0 auto 10px'}}/>Meta campaign ачаалж байна…</div>:visible.length?<div className={styles.tableWrap} style={{marginTop:14}}><table className={styles.table}><thead><tr><th>Кампанит ажил</th><th>Төлөв</th><th>Зорилго</th><th>Төсөв</th><th>Үүссэн</th><th>Үйлдэл</th></tr></thead><tbody>{visible.map(c=><tr key={c.id}><td><b>{c.name}</b><div className={styles.muted}>{c.id}</div></td><td><span className={status(c.effective_status||c.status)}>{c.effective_status||c.status}</span></td><td>{c.objective?.replace('OUTCOME_','')||'—'}</td><td>{c.daily_budget||c.lifetime_budget||'Ad Set түвшинд'}</td><td>{c.created_time?new Date(c.created_time).toLocaleDateString('mn-MN'):'—'}</td><td><div className={styles.actions}>{(c.status==='ACTIVE'||c.effective_status==='ACTIVE')?<button className={styles.secondary} disabled={busy===c.id} onClick={()=>setStatus(c,'PAUSED')}><Pause size={14}/> Pause</button>:<button className={styles.primary} disabled={busy===c.id} onClick={()=>setStatus(c,'ACTIVE')}><Play size={14}/> Идэвхжүүлэх</button>}<a className={styles.ghost} href={`/analytics?account=${encodeURIComponent(accountId)}&campaign=${encodeURIComponent(c.id)}`}>Тайлан</a></div></td></tr>)}</tbody></table></div>:<div className={styles.empty}>Сонгосон шүүлтүүрт кампанит ажил алга.</div>}
  <div className={styles.warning} style={{marginTop:14}}>Идэвхжүүлэх үед backend Payment Failed Guard дахин шалгана. Billing/account readiness асуудалтай бол ACTIVE хүсэлт Meta руу явахгүй.</div></div>
 </AppShell>
}
