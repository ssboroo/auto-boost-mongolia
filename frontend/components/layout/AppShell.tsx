'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  CirclePlus,
  CreditCard,
  Facebook,
  Home,
  Layers3,
  LogOut,
  Menu,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import styles from './app-shell.module.css'

const nav = [
  ['/', 'Нүүр', Home],
  ['/campaigns/new', 'Шинэ сурталчилгаа', CirclePlus],
  ['/campaigns', 'Кампанит ажил', Layers3],
  ['/analytics', 'Үр дүн', BarChart3],
  ['/facebook', 'Meta / Facebook', Facebook],
  ['/payments', 'Төлбөр', CreditCard],
  ['/transactions', 'Гүйлгээ', ReceiptText],
  ['/settings', 'Тохиргоо', Settings],
] as const

export default function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState(false)

  async function signOut() {
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  function submitSearch(e: any) {
    e.preventDefault()
    const q = search.trim()
    window.location.assign(q ? '/campaigns?q=' + encodeURIComponent(q) : '/campaigns')
  }

  return <div className={styles.shell}>
    <aside className={styles.sidebar + ' ' + (open ? styles.open : '')}>
      <a href="/" className={styles.logo}>
        <b>BOOST.MN</b>
        <small>MULTI-CHANNEL ADS PLATFORM</small>
      </a>
      <nav className={styles.nav}>
        {nav.map(([href, label, Icon]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return <a key={label} href={href} className={active ? styles.active : ''} onClick={() => setOpen(false)}>
            <Icon size={18}/>
            <span>{label}</span>
          </a>
        })}
      </nav>
      <div className={styles.upgrade}>
        <div className={styles.crown}>✦</div>
        <b>8 суваг · 1 dashboard</b>
        <p>Meta · Google · YouTube · TikTok<br/>X · LinkedIn · Microsoft</p>
        <a href="/campaigns/new">Шинэ сурталчилгаа</a>
      </div>
      <div className={styles.copy}>© 2026 BOOST.MN<br/>Монгол рекламын автоматжуулалт</div>
    </aside>

    {open && <button aria-label="Цэс хаах" className={styles.backdrop} onClick={() => setOpen(false)}/>}

    <section className={styles.main}>
      <header className={styles.header}>
        <button className={styles.menu} aria-label="Цэс" onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20}/> : <Menu size={20}/>}
        </button>
        <form className={styles.search} onSubmit={submitSearch}>
          <Search size={17}/>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Кампанит ажил хайх..." aria-label="Кампанит ажил хайх"/>
        </form>
        <div className={styles.user}>
          <div className={styles.notificationWrap}>
            <button aria-label="Мэдэгдэл" onClick={() => setNotifications((v) => !v)}><Bell size={18}/><i/></button>
            {notifications && <div className={styles.notifications}>
              <b>Систем</b>
              <a href="/campaigns/new">Шинэ multi-channel campaign</a>
              <a href="/facebook">Meta account connection</a>
              <a href="/transactions">Төлбөрийн түүх</a>
              <a href="/admin">Production readiness</a>
            </div>}
          </div>
          <span>U</span>
          <b>Хэрэглэгч</b>
          <button className={styles.logout} aria-label="Гарах" title="Гарах" onClick={signOut}><LogOut size={16}/></button>
        </div>
      </header>

      <main className={styles.content}>
        {(title || subtitle) && <div className={styles.pageHead}>
          <div>
            <h1>{title}</h1>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <div className={styles.secure}><ShieldCheck size={16}/> Secure workspace</div>
        </div>}
        {children}
      </main>
    </section>
  </div>
}
