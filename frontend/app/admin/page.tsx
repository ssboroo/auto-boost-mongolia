'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import AppShell from '../../components/layout/AppShell'
import styles from './page.module.css'

type Settings={workspaceId:string;serviceFeePercent:number;fallbackUsdMntRate:number;fallbackRateDate:string}
type Overview={summary:{transactions:number;succeeded:number;failed:number;serviceFeesMnt:number;webhookErrors:number};payments:any[];auditLogs:any[];webhookErrors:any[];checkedAt:string}
type PrelaunchCheck={key:string;label:string;status:'READY'|'WARNING'|'ERROR';detail:string;action?:string}
type Prelaunch={overall:'READY'|'WARNING'|'ERROR';summary:{ready:number;warnings:number;errors:number;total:number};checks:PrelaunchCheck[];checkedAt:string}
const mnt=(v:number)=>`${Math.round(Number(v||0)).toLocaleString('mn-MN')}₮`
const statusText=(s:string)=>s==='READY'?'Бэлэн':s==='WARNING'?'Анхааруулга':'Алдаа'

export default function AdminPage(){
 const [settings,setSettings]=useState<Settings|null>(null);const [overview,setOverview]=useState<Overview|null>(null);const [prelaunch,setPrelaunch]=useState<Prelaunch|null>(null);const [checking,setChecking]=useState(false);const [message,setMessage]=useState('');const [error,setError]=useState('')
 async function load(){try{const [s,o]=await Promise.all([apiFetch<Settings>('/billing/admin/settings'),apiFetch<Overview>('/billing/admin/overview')]);setSettings(s);setOverview(o);setError('')}catch(e:any){setError(e?.message||'Админ мэдээлэл ачаалж чадсангүй.')}}
 useEffect(()=>{load()},[])
 async function save(){if(!settings)return;try{await apiFetch('/billing/admin/settings',{method:'PATCH',body:JSON.stringify({serviceFeePercent:settings.serviceFeePercent,fallbackUsdMntRate:settings.fallbackUsdMntRate,fallbackRateDate:settings.fallbackRateDate})});setMessage('Тохиргоо хадгалагдлаа. Audit log бүртгэгдсэн.');await load()}catch(e:any){setError(e?.message||'Тохиргоо хадгалж чадсангүй.')}}
 async function runPrelaunch(){setChecking(true);setError('');setMessage('');try{const result=await apiFetch<Prelaunch>('/system/prelaunch');setPrelaunch(result);setMessage(result.overall==='READY'?'Production launch-д бүх critical шалгалт бэлэн байна.':result.overall==='WARNING'?'Critical error алга. Анхааруулгуудыг launch-аас өмнө шалгана уу.':'Production launch блоклогдсон. Алдаануудыг засна уу.')}catch(e:any){setError(e?.message||'Pre-Launch System Check ажиллуулж чадсангүй.')}finally{setChecking(false)}}
 return <AppShell title="Тохиргоо" subtitle="Шимтгэл, ханш, төлбөрийн төлөв, webhook, audit log болон production readiness.">
  {error&&<div className={`${styles.notice} ${styles.error}`}>{error}</div>}{message&&<div className={styles.notice}>{message}</div>}
  <section className={`${styles.card} ${styles.prelaunch}`}><div className={styles.cardHead}><div><span>PRODUCTION READINESS</span><h2>Pre-Launch System Check</h2><p>Meta API/OAuth, Supabase, төлбөрийн backend, webhook, FX source болон production URL-уудыг нэг дор шалгана.</p></div><button className={styles.save} onClick={runPrelaunch} disabled={checking}>{checking?'Шалгаж байна…':'Бүх системийг шалгах'}</button></div>
  {prelaunch&&<><div className={styles.preStats}><Metric label="Ерөнхий" value={statusText(prelaunch.overall)} tone={prelaunch.overall}/><Metric label="Бэлэн" value={String(prelaunch.summary.ready)}/><Metric label="Анхааруулга" value={String(prelaunch.summary.warnings)}/><Metric label="Алдаа" value={String(prelaunch.summary.errors)}/></div><div className={styles.checks}>{prelaunch.checks.map(c=><div key={c.key} className={styles.check}><b data-status={c.status}>{statusText(c.status)}</b><strong>{c.label}</strong><div>{c.detail}{c.action&&<small>→ {c.action}</small>}</div></div>)}</div><p className={styles.checked}>Сүүлд шалгасан: {new Date(prelaunch.checkedAt).toLocaleString('mn-MN')} · үр дүн audit log-д бүртгэгдэнэ.</p></>}
  </section>
  <div className={styles.stats}><Metric label="Гүйлгээ" value={String(overview?.summary.transactions??'—')}/><Metric label="Амжилттай" value={String(overview?.summary.succeeded??'—')}/><Metric label="Амжилтгүй" value={String(overview?.summary.failed??'—')}/><Metric label="Авсан шимтгэл" value={overview?mnt(overview.summary.serviceFeesMnt):'—'}/></div>
  <div className={styles.grid}>
   <section className={styles.card}><h2>Төлбөрийн тохиргоо</h2><label className={styles.field}><span>Үйлчилгээний шимтгэл (%)</span><input type="number" min="0" max="100" step="0.1" value={settings?.serviceFeePercent??''} onChange={e=>settings&&setSettings({...settings,serviceFeePercent:Number(e.target.value)})}/></label><label className={styles.field}><span>Fallback USD/MNT ханш</span><input type="number" min="1" step="0.01" value={settings?.fallbackUsdMntRate??''} onChange={e=>settings&&setSettings({...settings,fallbackUsdMntRate:Number(e.target.value)})}/></label><label className={styles.field}><span>Fallback ханшийн огноо</span><input type="date" value={settings?.fallbackRateDate??''} onChange={e=>settings&&setSettings({...settings,fallbackRateDate:e.target.value})}/></label><button className={styles.save} onClick={save}>Хадгалах</button><div className={styles.hint}>Зөвхөн workspace owner/admin эрхтэй хэрэглэгч өөрчилнө.</div></section>
   <DataTable title="Сүүлийн гүйлгээ" headers={['Огноо','USD','Шимтгэл','Төлөв']} rows={(overview?.payments||[]).map(p=>[new Date(p.created_at).toLocaleString('mn-MN'),`$${Number(p.meta_budget_usd).toFixed(2)}`,mnt(p.service_fee_mnt),`${p.wire_status}${p.failure_reason?` · ${p.failure_reason}`:''}`])}/>
   <DataTable title="Webhook monitoring" headers={['Event','Attempt','Error']} rows={(overview?.webhookErrors||[]).map(e=>[`${e.event_type} ${e.payment_intent_id||''}`,String(e.attempt_count),e.last_error||'—'])}/>
   <DataTable title="Audit log" headers={['Огноо','Action','Entity']} rows={(overview?.auditLogs||[]).map(a=>[new Date(a.created_at).toLocaleString('mn-MN'),a.action,`${a.entity_type||'—'} · ${a.entity_id||''}`])}/>
  </div>
 </AppShell>
}
function Metric({label,value,tone}:{label:string;value:string;tone?:string}){return <div className={styles.stat}><span>{label}</span><b data-tone={tone}>{value}</b></div>}
function DataTable({title,headers,rows}:{title:string;headers:string[];rows:string[][]}){return <section className={styles.card}><h2>{title}</h2><div className={styles.scroll}><table className={styles.table}><thead><tr>{headers.map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>{rows.length?rows.map((r,i)=><tr key={i}>{r.map((v,j)=><td key={j}>{v}</td>)}</tr>):<tr><td colSpan={headers.length}>Одоогоор мэдээлэл алга.</td></tr>}</tbody></table></div></section>}
