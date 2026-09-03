'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { BarChart3, Bell, CirclePlus, CreditCard, Facebook, Home, Layers3, Menu, ReceiptText, Search, Settings, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import styles from './app-shell.module.css'

const nav = [
  ['/', 'Нүүр', Home],
  ['/#boost', 'Boost үүсгэх', CirclePlus],
  ['/#campaigns', 'Кампанит ажил', Layers3],
  ['/#analytics', 'Аналитик', BarChart3],
  ['/facebook', 'Facebook холбох', Facebook],
  ['/#payment', 'Төлбөр', CreditCard],
  ['/transactions', 'Гүйлгээ', ReceiptText],
  ['/admin', 'Тохиргоо', Settings],
] as const

export default function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  return <div className={styles.shell}>
    <aside className={`${styles.sidebar} ${open ? styles.open : ''}`}>
      <div className={styles.logo}><b>RAINY</b><small>Технологийн Хязгааргүй Боломж</small></div>
      <nav className={styles.nav}>{nav.map(([href,label,Icon]) => {
        const active = href === '/' ? pathname === '/' : href.startsWith('/#') ? false : pathname.startsWith(href)
        return <a key={label} href={href} className={active ? styles.active : ''} onClick={()=>setOpen(false)}><Icon size={18}/><span>{label}</span></a>
      })}</nav>
      <div className={styles.upgrade}><div className={styles.crown}>♛</div><b>Илүү их боломж</b><p>AI-powered ads<br/>бизнесийн өсөлтөд</p><a href="/#payment">Upgrade</a></div>
      <div className={styles.copy}>© 2026 RAINY.<br/>Бүх эрх хуулиар хамгаалагдсан.</div>
    </aside>
    {open && <button aria-label="Цэс хаах" className={styles.backdrop} onClick={()=>setOpen(false)}/>} 
    <section className={styles.main}>
      <header className={styles.header}>
        <button className={styles.menu} aria-label="Цэс" onClick={()=>setOpen(v=>!v)}>{open?<X size={20}/>:<Menu size={20}/>}</button>
        <label className={styles.search}><Search size={17}/><input placeholder="Кампанит ажил, тайлан, тохиргоо хайх..." aria-label="Хайх"/></label>
        <div className={styles.user}><button aria-label="Мэдэгдэл"><Bell size={18}/><i/></button><span>U</span><b>Хэрэглэгч</b></div>
      </header>
      <main className={styles.content}>
        {(title || subtitle) && <div className={styles.pageHead}><div><h1>{title}</h1>{subtitle&&<p>{subtitle}</p>}</div><div className={styles.secure}><ShieldCheck size={16}/> RAINY Secure</div></div>}
        {children}
      </main>
    </section>
  </div>
}
