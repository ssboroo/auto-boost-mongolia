'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '../../lib/api'
import styles from './page.module.css'

type Tx = {
  id: string
  receipt_number?: string | null
  meta_budget_usd: number
  ad_budget_mnt: number
  service_fee_mnt: number
  total_display_mnt: number
  wire_status: string
  failure_reason?: string | null
  paid_at?: string | null
  created_at: string
}

type Receipt = {
  id: string
  receiptNumber?: string | null
  status: string
  issuedAt: string
  metaBudgetUsd: number
  fxRate: number
  adBudgetMnt: number
  serviceFeePercent: number
  serviceFeeMnt: number
  totalDisplayMnt: number
  providerLabel: string
}

const mnt = (v: number) => `${Math.round(Number(v || 0)).toLocaleString('mn-MN')}₮`

export default function TransactionsPage() {
  const [rows, setRows] = useState<Tx[]>([])
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      setRows(await apiFetch<Tx[]>('/billing/history?limit=100'))
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Гүйлгээний түүх ачаалж чадсангүй.')
    }
  }

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    const paymentIntent = params.get('payment_intent')
    if (params.get('payment') === 'success' && paymentIntent) {
      setMessage('Төлбөрийн буцаалт ирлээ. Webhook баталгаажуулалтыг шалгаж байна…')
      apiFetch<any>(`/billing/payment?payment_intent=${encodeURIComponent(paymentIntent)}`)
        .then((payment) => setMessage(payment?.wire_status === 'succeeded' ? 'Төлбөр амжилттай баталгаажлаа.' : 'Төлбөр provider талд боловсруулагдаж байна.'))
        .finally(load)
    }
  }, [])

  async function openReceipt(id: string) {
    try { setReceipt(await apiFetch<Receipt>(`/billing/receipt?id=${encodeURIComponent(id)}`)) }
    catch (e: any) { setError(e?.message || 'Баримт нээж чадсангүй.') }
  }

  function statusClass(status: string) {
    if (status === 'succeeded') return `${styles.status} ${styles.success}`
    if (['failed','canceled'].includes(status)) return `${styles.status} ${styles.failed}`
    return `${styles.status} ${styles.pending}`
  }

  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><div className={styles.title}><h1>Төлбөрүүд</h1><p>Receipt, төлөв, failed payment болон шимтгэлийн түүх.</p></div><Link href="/">← Boost Studio</Link></div>
    {message && <div className={styles.banner}>{message}</div>}
    {error && <div className={styles.banner}>{error}</div>}
    <section className={styles.card}>
      {rows.length ? <table className={styles.table}><thead><tr><th>Огноо</th><th>Receipt</th><th>Meta budget</th><th>Шимтгэл</th><th>Төлөв</th><th></th></tr></thead><tbody>
        {rows.map((tx) => <tr key={tx.id}><td>{new Date(tx.created_at).toLocaleString('mn-MN')}</td><td>{tx.receipt_number || '—'}</td><td>${Number(tx.meta_budget_usd).toFixed(2)} / {mnt(tx.ad_budget_mnt)}</td><td>{mnt(tx.service_fee_mnt)}</td><td><span className={statusClass(tx.wire_status)}>{tx.wire_status}</span>{tx.failure_reason ? <div title={tx.failure_reason}> ⚠</div> : null}</td><td><button className={styles.button} onClick={() => openReceipt(tx.id)}>Баримт</button></td></tr>)}
      </tbody></table> : <div className={styles.empty}>Одоогоор transaction байхгүй.</div>}
    </section>
  </div>
  {receipt && <div className={styles.receiptOverlay}><section className={styles.receipt}>
    <div className={styles.receiptHead}><div><h2>Auto Boost Mongolia</h2><p>Үйлчилгээний шимтгэлийн баримт</p></div><strong>{receipt.receiptNumber || 'PENDING'}</strong></div>
    <div className={styles.receiptRows}><div><span>Төлөв</span><b>{receipt.status}</b></div><div><span>Огноо</span><b>{new Date(receipt.issuedAt).toLocaleString('mn-MN')}</b></div><div><span>Meta budget</span><b>${receipt.metaBudgetUsd.toFixed(2)} / {mnt(receipt.adBudgetMnt)}</b></div><div><span>USD/MNT ханш</span><b>{receipt.fxRate.toLocaleString('mn-MN')}₮</b></div><div><span>Үйлчилгээний шимтгэл ({receipt.serviceFeePercent}%)</span><b>{mnt(receipt.serviceFeeMnt)}</b></div><div><span>Төлбөрийн суваг</span><b>{receipt.providerLabel}</b></div></div>
    <div className={styles.receiptTotal}><span>Нийт үнэлгээ</span><b>{mnt(receipt.totalDisplayMnt)}</b></div>
    <div className={styles.receiptActions}><button className={styles.print} onClick={() => window.print()}>Хэвлэх / PDF</button><button className={styles.close} onClick={() => setReceipt(null)}>Хаах</button></div>
  </section></div>}
  </main>
}
