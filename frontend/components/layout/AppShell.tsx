'use client'

import type { ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Bell,
  CirclePlus,
  CreditCard,
  Home,
  Languages,
  Layers3,
  Link2,
  LogOut,
  Menu,
  Moon,
  ReceiptText,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useUi } from '../ui/UiProvider'
import styles from './app-shell.module.css'

export default function AppShell({ children, title, subtitle }: { children: ReactNode; title?: string; subtitle?: string }) {
  const pathname = usePathname()
  const { locale, theme, toggleLocale, toggleTheme, text } = useUi()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [notifications, setNotifications] = useState(false)

  const nav = [
    ['/', text('Нүүр', 'Overview'), Home],
    ['/campaigns/new', text('Шинэ сурталчилгаа', 'Create campaign'), CirclePlus],
    ['/campaigns', text('Кампанит ажил', 'Campaigns'), Layers3],
    ['/ai', text('AI Studio', 'AI Studio'), Sparkles],
    ['/analytics', text('Үр дүн', 'Analytics'), BarChart3],
    ['/connections', text('Холболтууд', 'Connections'), Link2],
    ['/payments', text('Төлбөр', 'Billing'), CreditCard],
    ['/transactions', text('Гүйлгээ', 'Transactions'), ReceiptText],
    ['/settings', text('Тохиргоо', 'Settings'), Settings],
  ] as const

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
      <a href="/" className={styles.logo} onClick={() => setOpen(false)}>
        <span className={styles.logoMark}>B</span>
        <span><b>BOOST.MN</b><small>{text('РЕКЛАМЫН НЭГДСЭН ПЛАТФОРМ', 'MULTI-CHANNEL ADS PLATFORM')}</small></span>
      </a>

      <div className={styles.workspace}>
        <small>{text('АЖЛЫН ОРЧИН', 'WORKSPACE')}</small>
        <b>{text('Миний бизнес', 'My business')}</b>
        <span><i/> {text('Систем онлайн', 'System online')}</span>
      </div>

      <nav className={styles.nav}>
        {nav.map(([href, label, Icon]) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
          return <a key={href} href={href} className={active ? styles.active : ''} onClick={() => setOpen(false)}>
            <Icon size={18}/><span>{label}</span>
          </a>
        })}
      </nav>

      <div className={styles.providerCard}>
        <div><span>8</span><small>{text('сурталчилгааны суваг', 'ad channels')}</small></div>
        <p>Meta · Google · YouTube<br/>TikTok · X · LinkedIn · Microsoft</p>
        <a href="/campaigns/new">{text('Шинэ campaign', 'New campaign')} →</a>
      </div>

      <div className={styles.sidebarBottom}>
        <span>© 2026 BOOST.MN</span>
        <small>v2 · Preview-safe</small>
      </div>
    </aside>

    {open && <button aria-label="Close menu" className={styles.backdrop} onClick={() => setOpen(false)}/>}

    <section className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.menu} aria-label="Menu" onClick={() => setOpen((v) => !v)}>
            {open ? <X size={20}/> : <Menu size={20}/>}
          </button>
          <form className={styles.search} onSubmit={submitSearch}>
            <Search size={17}/>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={text('Кампанит ажил хайх...', 'Search campaigns...')} aria-label="Search"/>
          </form>
        </div>

        <div className={styles.headerActions}>
          <button className={styles.utility} onClick={toggleLocale} title="Language"><Languages size={17}/><span>{locale === 'mn' ? 'MN' : 'EN'}</span></button>
          <button className={styles.utilityIcon} onClick={toggleTheme} title={theme === 'light' ? 'Dark mode' : 'Light mode'}>{theme === 'light' ? <Moon size={17}/> : <Sun size={17}/>}</button>
          <div className={styles.notificationWrap}>
            <button className={styles.utilityIcon} aria-label="Notifications" onClick={() => setNotifications((v) => !v)}><Bell size={17}/><i/></button>
            {notifications && <div className={styles.notifications}>
              <b>{text('Системийн төлөв', 'System status')}</b>
              <a href="/connections">{text('Сувгийн холболтуудаа шалгах', 'Review channel connections')}</a>
              <a href="/transactions">{text('Сүүлийн төлбөрүүд', 'Recent transactions')}</a>
              <a href="/admin">{text('Production readiness', 'Production readiness')}</a>
            </div>}
          </div>
          <div className={styles.avatar}>U</div>
          <button className={styles.logout} aria-label="Sign out" title={text('Гарах', 'Sign out')} onClick={signOut}><LogOut size={16}/></button>
        </div>
      </header>

      <main className={styles.content}>
        {(title || subtitle) && <div className={styles.pageHead}>
          <div><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>
          <div className={styles.secure}><ShieldCheck size={15}/>{text('Аюулгүй ажлын орчин', 'Secure workspace')}</div>
        </div>}
        {children}
      </main>
    </section>
  </div>
}
