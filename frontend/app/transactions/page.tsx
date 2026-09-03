'use client'

import { useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import AppShell from '../../components/layout/AppShell'
import styles from './page.module.css'

type Tx = { id:string; receipt_number?:string|null; meta_budget_usd:number; ad_budget_mnt:number; service_fee_mnt:number; total_display_mnt:number; wire_status:string; failure_reason?:string|null; paid_at?:string|null; created_at:string }
type Receipt = { id:string; receiptNumber?:string|null; status:string; issuedAt:string; metaBudgetUsd:number; fxRate:number; adBudgetMnt:number; serviceFeePercent:number; serviceFeeMnt:number; totalDisplayMnt:number; providerLabel:string }
const mnt=(v:number)=>`${Math.round(Number(v||0)).toLocaleString('mn-MN')}₮`
const label=(s:string)=>s==='succeeded'?'Амжилттай':s==='failed'?'Амжилтгүй':s==='canceled'?'Цуцлагдсан':'Хүлээгдэж буй'

export default function TransactionsPage(){
 const [rows,setRows]=useState<Tx[]>([]); const [receipt,setReceipt]=useState<Receipt|null>(null); const [message,setMessage]=useState(''); const [error,setError]=useState(''); const [loading,setLoading]=useState(true)
 async function load(){ setLoading(true); try{setRows(await apiFetch<Tx[]>('/billing/history?limit=100'));setError('')}catch(e:any){setError(e?.message||'Гүйлгээний түүх ачаалж чадсангүй.')}finally{setLoading(false)} }
 useEffect(()=>{load();const p=new URLSearchParams(window.location.search);const pi=p.get('payment_intent');if(p.get('payment')==='success'&&pi){setMessage('Төлбөрийн баталгаажуулалтыг шалгаж байна…');apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(pi)}`).then(x=>setMessage(x?.wire_status==='succeeded'?'Төлбөр амжилттай баталгаажлаа.':'Төлбөр боловсруулагдаж байна.')).finally(load)}},[])
 async function openReceipt(id:string){try{setReceipt(await apiFetch<Receipt>(`/billing/receipt?id=${encodeURIComponent(id)}`))}catch(e:any){setError(e?.message||'Баримт нээж чадсангүй.')}}
 function statusClass(s:string){return `${styles.status} ${s==='succeeded'?styles.success:['failed','canceled'].includes(s)?styles.failed:styles.pending}`}
 return <AppShell title="Гүйлгээ" subtitle="Төлбөр, шимтгэл, баримт болон төлөвийн түүх.">
   <div className={styles.filters}><button className={styles.active}>Бүгд</button><button>Орлого</button><button>Зарлага</button><button>Төлбөр</button><button>Буцаалт</button></div>
   {message&&<div className={styles.banner}>{message}</div>}{error&&<div className={`${styles.banner} ${styles.error}`}>{error}<button onClick={load}>Дахин оролдох</button></div>}
   <section className={styles.card}>
    {loading?<div className={styles.empty}>Уншиж байна...</div>:rows.length?<div className={styles.tableWrap}><table className={styles.table}><thead><tr><th>Огноо</th><th>Баримт</th><th>Meta төсөв</th><th>Шимтгэл</th><th>Төлөв</th><th></th></tr></thead><tbody>{rows.map(tx=><tr key={tx.id}><td>{new Date(tx.created_at).toLocaleString('mn-MN')}</td><td>{tx.receipt_number||'—'}</td><td>${Number(tx.meta_budget_usd).toFixed(2)} / {mnt(tx.ad_budget_mnt)}</td><td>{mnt(tx.service_fee_mnt)}</td><td><span className={statusClass(tx.wire_status)}>{label(tx.wire_status)}</span>{tx.failure_reason?<small title={tx.failure_reason}>Анхааруулга</small>:null}</td><td><button className={styles.button} onClick={()=>openReceipt(tx.id)}>Баримт</button></td></tr>)}</tbody></table></div>:<div className={styles.empty}><b>Одоогоор гүйлгээ алга.</b><span>Төлбөр хийсний дараа энд автоматаар харагдана.</span></div>}
   </section>
   {receipt&&<div className={styles.receiptOverlay}><section className={styles.receipt}><div className={styles.receiptHead}><div><h2>RAINY</h2><p>Үйлчилгээний шимтгэлийн баримт</p></div><strong>{receipt.receiptNumber||'ХҮЛЭЭГДЭЖ БУЙ'}</strong></div><div className={styles.receiptRows}><div><span>Төлөв</span><b>{label(receipt.status)}</b></div><div><span>Огноо</span><b>{new Date(receipt.issuedAt).toLocaleString('mn-MN')}</b></div><div><span>Meta төсөв</span><b>${receipt.metaBudgetUsd.toFixed(2)} / {mnt(receipt.adBudgetMnt)}</b></div><div><span>USD/MNT ханш</span><b>{receipt.fxRate.toLocaleString('mn-MN')}₮</b></div><div><span>Үйлчилгээний шимтгэл ({receipt.serviceFeePercent}%)</span><b>{mnt(receipt.serviceFeeMnt)}</b></div><div><span>Төлбөрийн суваг</span><b>{receipt.providerLabel}</b></div></div><div className={styles.receiptTotal}><span>Нийт үнэлгээ</span><b>{mnt(receipt.totalDisplayMnt)}</b></div><div className={styles.receiptActions}><button className={styles.print} onClick={()=>window.print()}>Хэвлэх / PDF</button><button className={styles.close} onClick={()=>setReceipt(null)}>Хаах</button></div></section></div>}
 </AppShell>
}
