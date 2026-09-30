'use client'

import { useEffect, useMemo, useState } from 'react'
import { Printer, RefreshCw, X } from 'lucide-react'
import AppShell from '../../components/layout/AppShell'
import { useUi } from '../../components/ui/UiProvider'
import { apiFetch } from '../../lib/api'
import styles from './page.module.css'

type Tx={id:string;receipt_number?:string|null;meta_budget_usd:number;ad_budget_mnt:number;service_fee_mnt:number;total_display_mnt:number;wire_status:string;failure_reason?:string|null;paid_at?:string|null;created_at:string}
type Receipt={id:string;receiptNumber?:string|null;status:string;issuedAt:string;metaBudgetUsd:number;fxRate:number;adBudgetMnt:number;serviceFeePercent:number;serviceFeeMnt:number;totalDisplayMnt:number;providerLabel:string}
type Filter='all'|'succeeded'|'pending'|'failed'
const mnt=(v:number)=>Math.round(Number(v||0)).toLocaleString('mn-MN')+'₮'

export default function TransactionsPage(){
 const {text}=useUi()
 const [rows,setRows]=useState<Tx[]>([]),[receipt,setReceipt]=useState<Receipt|null>(null),[message,setMessage]=useState(''),[error,setError]=useState(''),[loading,setLoading]=useState(true),[filter,setFilter]=useState<Filter>('all')
 async function load(){setLoading(true);try{setRows(await apiFetch<Tx[]>('/billing/history?limit=100'));setError('')}catch(e:any){setError(e?.message||text('Гүйлгээний түүх ачаалж чадсангүй.','Could not load transaction history.'))}finally{setLoading(false)}}
 useEffect(()=>{load();const params=new URLSearchParams(window.location.search);const paymentIntent=params.get('payment_intent');if(params.get('payment')==='success'&&paymentIntent){setMessage(text('Төлбөрийн баталгаажуулалтыг шалгаж байна…','Checking payment confirmation…'));apiFetch<any>('/billing/payment?payment_intent='+encodeURIComponent(paymentIntent)).then(payment=>setMessage(payment?.wire_status==='succeeded'?text('Төлбөр амжилттай баталгаажлаа.','Payment confirmed successfully.'):text('Төлбөр боловсруулагдаж байна.','Payment is processing.'))).finally(load)}},[])
 const visibleRows=useMemo(()=>rows.filter(tx=>{if(filter==='all')return true;if(filter==='failed')return ['failed','canceled'].includes(tx.wire_status);if(filter==='pending')return !['succeeded','failed','canceled'].includes(tx.wire_status);return tx.wire_status==='succeeded'}),[rows,filter])
 async function openReceipt(id:string){try{setReceipt(await apiFetch<Receipt>('/billing/receipt?id='+encodeURIComponent(id)))}catch(e:any){setError(e?.message||text('Баримт нээж чадсангүй.','Could not open receipt.'))}}
 const filters:[Filter,string][]=[['all',text('Бүгд','All')],['succeeded',text('Амжилттай','Succeeded')],['pending',text('Хүлээгдэж буй','Pending')],['failed',text('Амжилтгүй','Failed')]]
 return <AppShell title={text('Гүйлгээ','Transactions')} subtitle={text('Төлбөр, шимтгэл, receipt болон төлөвийн түүх.','Payment, fee, receipt and status history.')}>
  <div className={styles.filters}>{filters.map(([key,label])=><button key={key} className={filter===key?styles.active:''} onClick={()=>setFilter(key)}>{label}</button>)}</div>
  {message&&<div className={styles.banner}>{message}</div>}
  {error&&<div className={styles.banner+' '+styles.error}>{error}<button onClick={load}>{text('Дахин оролдох','Try again')}</button></div>}
  <div className={styles.card}>{loading?<div className={styles.empty}><b>{text('Ачаалж байна…','Loading…')}</b></div>:visibleRows.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>{text('Огноо','Date')}</th><th>Receipt</th><th>{text('Ad budget','Ad budget')}</th><th>{text('Service fee','Service fee')}</th><th>{text('Нийт','Total')}</th><th>{text('Төлөв','Status')}</th><th></th></tr></thead><tbody>{visibleRows.map(tx=><tr key={tx.id}><td>{new Date(tx.created_at).toLocaleString()}</td><td>{tx.receipt_number||'—'}</td><td>{mnt(tx.ad_budget_mnt)}</td><td>{mnt(tx.service_fee_mnt)}</td><td>{mnt(tx.total_display_mnt)}</td><td><span className={styles.status+' '+(tx.wire_status==='succeeded'?styles.success:['failed','canceled'].includes(tx.wire_status)?styles.failed:styles.pending)}>{tx.wire_status}</span>{tx.failure_reason&&<small>{tx.failure_reason}</small>}</td><td>{tx.wire_status==='succeeded'&&<button className={styles.button} onClick={()=>openReceipt(tx.id)}>{text('Баримт','Receipt')}</button>}</td></tr>)}</tbody></table></div>:<div className={styles.empty}><b>{text('Гүйлгээ алга','No transactions')}</b><span>{text('Төлбөр хийсний дараа энд харагдана.','Payments will appear here after checkout.')}</span></div>}</div>
  <button className={styles.button} style={{marginTop:12,display:'inline-flex',gap:6,alignItems:'center'}} onClick={load}><RefreshCw size={13}/>{text('Шинэчлэх','Refresh')}</button>
  {receipt&&<div className={styles.receiptOverlay} role="dialog" aria-modal="true"><div className={styles.receipt}><div className={styles.receiptHead}><div><h2>BOOST.MN</h2><p>{text('Үйлчилгээний төлбөрийн баримт','Service fee receipt')}</p></div><strong>{receipt.status}</strong></div><div className={styles.receiptRows}><Row l="Receipt" v={receipt.receiptNumber||'—'}/><Row l={text('Огноо','Date')} v={new Date(receipt.issuedAt).toLocaleString()}/><Row l={text('Ad budget','Ad budget')} v={mnt(receipt.adBudgetMnt)}/><Row l={'Service fee ('+receipt.serviceFeePercent+'%)'} v={mnt(receipt.serviceFeeMnt)}/><Row l="FX" v={'1 USD = '+Number(receipt.fxRate).toLocaleString('mn-MN')+'₮'}/><Row l="Provider" v={receipt.providerLabel}/></div><div className={styles.receiptTotal}><span>{text('Нийт','Total')}</span><b>{mnt(receipt.totalDisplayMnt)}</b></div><div className={styles.receiptActions}><button className={styles.print} onClick={()=>window.print()}><Printer size={14}/> {text('Хэвлэх','Print')}</button><button className={styles.close} onClick={()=>setReceipt(null)}><X size={14}/> {text('Хаах','Close')}</button></div></div></div>}
 </AppShell>
}
function Row({l,v}:{l:string;v:string}){return <div><span>{l}</span><b>{v}</b></div>}
