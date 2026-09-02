'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '../../lib/api'
import styles from './page.module.css'

type Settings = { workspaceId: string; serviceFeePercent: number; fallbackUsdMntRate: number; fallbackRateDate: string }
type Overview = {
  summary: { transactions: number; succeeded: number; failed: number; serviceFeesMnt: number; webhookErrors: number }
  payments: any[]
  auditLogs: any[]
  webhookErrors: any[]
  checkedAt: string
}

const mnt = (v: number) => `${Math.round(Number(v || 0)).toLocaleString('mn-MN')}₮`

export default function AdminPage() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [overview, setOverview] = useState<Overview | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function load() {
    try {
      const [s, o] = await Promise.all([
        apiFetch<Settings>('/billing/admin/settings'),
        apiFetch<Overview>('/billing/admin/overview'),
      ])
      setSettings(s); setOverview(o); setError('')
    } catch (e: any) { setError(e?.message || 'Admin мэдээлэл ачаалж чадсангүй.') }
  }

  useEffect(() => { load() }, [])

  async function save() {
    if (!settings) return
    try {
      await apiFetch('/billing/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          serviceFeePercent: settings.serviceFeePercent,
          fallbackUsdMntRate: settings.fallbackUsdMntRate,
          fallbackRateDate: settings.fallbackRateDate,
        }),
      })
      setMessage('Тохиргоо хадгалагдлаа. Audit log бичигдсэн.')
      await load()
    } catch (e: any) { setError(e?.message || 'Тохиргоо хадгалж чадсангүй.') }
  }

  return <main className={styles.page}><div className={styles.shell}>
    <div className={styles.top}><div><h1>Admin Console</h1><p>Шимтгэл, fallback ханш, transaction, webhook error, audit log.</p></div><Link href="/">← Boost Studio</Link></div>
    {error && <div className={`${styles.notice} ${styles.error}`}>{error}</div>}
    {message && <div className={styles.notice}>{message}</div>}

    <div className={styles.stats}>
      <div className={styles.stat}><span>Transactions</span><b>{overview?.summary.transactions ?? '—'}</b></div>
      <div className={styles.stat}><span>Амжилттай</span><b>{overview?.summary.succeeded ?? '—'}</b></div>
      <div className={styles.stat}><span>Failed</span><b>{overview?.summary.failed ?? '—'}</b></div>
      <div className={styles.stat}><span>Авсан шимтгэл</span><b>{overview ? mnt(overview.summary.serviceFeesMnt) : '—'}</b></div>
    </div>

    <div className={styles.grid}>
      <section className={styles.card}>
        <h2>Billing тохиргоо</h2>
        <label className={styles.field}><span>Үйлчилгээний шимтгэл (%)</span><input type="number" min="0" max="100" step="0.1" value={settings?.serviceFeePercent ?? ''} onChange={(e)=>settings&&setSettings({...settings,serviceFeePercent:Number(e.target.value)})}/></label>
        <label className={styles.field}><span>Fallback USD/MNT ханш</span><input type="number" min="1" step="0.01" value={settings?.fallbackUsdMntRate ?? ''} onChange={(e)=>settings&&setSettings({...settings,fallbackUsdMntRate:Number(e.target.value)})}/></label>
        <label className={styles.field}><span>Fallback ханшийн огноо</span><input type="date" value={settings?.fallbackRateDate ?? ''} onChange={(e)=>settings&&setSettings({...settings,fallbackRateDate:e.target.value})}/></label>
        <button className={styles.save} onClick={save}>Хадгалах</button>
        <div className={styles.notice}>Workspace owner/admin эрхтэй хэрэглэгч л энэ хэсгийг өөрчилнө.</div>
      </section>

      <section className={styles.card}>
        <h2>Сүүлийн transaction</h2><div className={styles.scroll}><table className={styles.table}><thead><tr><th>Огноо</th><th>USD</th><th>Fee</th><th>Status</th></tr></thead><tbody>
          {(overview?.payments || []).map((p)=><tr key={p.id}><td>{new Date(p.created_at).toLocaleString('mn-MN')}</td><td>${Number(p.meta_budget_usd).toFixed(2)}</td><td>{mnt(p.service_fee_mnt)}</td><td>{p.wire_status}{p.failure_reason ? ` · ${p.failure_reason}` : ''}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className={styles.card}>
        <h2>Webhook monitoring</h2><p className={styles.mono}>Error count: {overview?.summary.webhookErrors ?? '—'} · checked {overview?.checkedAt ? new Date(overview.checkedAt).toLocaleString('mn-MN') : '—'}</p><div className={styles.scroll}><table className={styles.table}><thead><tr><th>Event</th><th>Attempt</th><th>Error</th></tr></thead><tbody>
          {(overview?.webhookErrors || []).map((e)=><tr key={e.event_id}><td><span className={styles.mono}>{e.event_type}<br/>{e.payment_intent_id || ''}</span></td><td>{e.attempt_count}</td><td>{e.last_error || '—'}</td></tr>)}
        </tbody></table></div>
      </section>

      <section className={styles.card}>
        <h2>Audit log</h2><div className={styles.scroll}><table className={styles.table}><thead><tr><th>Огноо</th><th>Action</th><th>Entity</th></tr></thead><tbody>
          {(overview?.auditLogs || []).map((a, i)=><tr key={`${a.created_at}-${i}`}><td>{new Date(a.created_at).toLocaleString('mn-MN')}</td><td>{a.action}</td><td><span className={styles.mono}>{a.entity_type || '—'} · {a.entity_id || ''}</span></td></tr>)}
        </tbody></table></div>
      </section>
    </div>
  </div></main>
}
