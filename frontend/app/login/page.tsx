'use client'

import { useState, type FormEvent } from 'react'
import { ArrowRight, Check, LockKeyhole, Mail, ShieldCheck, Sparkles, UserPlus, WandSparkles } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import styles from './page.module.css'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        window.location.assign('/')
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } },
        })
        if (error) throw error
        if (data.session) window.location.assign('/')
        else setMessage('Бүртгэл үүслээ. Имэйлээр ирсэн баталгаажуулах холбоосоо нээгээд нэвтэрнэ үү.')
      }
    } catch (err: any) {
      setError(err?.message || 'Үйлдэл амжилтгүй боллоо.')
    } finally {
      setLoading(false)
    }
  }

  async function resetPassword() {
    setError('')
    setMessage('')
    if (!email) {
      setError('Нууц үг сэргээх имэйлээ эхлээд оруулна уу.')
      return
    }
    const redirectTo = `${window.location.origin}/login`
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })
    if (error) setError(error.message)
    else setMessage('Нууц үг сэргээх холбоос имэйл рүү илгээгдлээ.')
  }

  return (
    <main className={styles.page}>
      <div className={styles.mesh} />
      <section className={styles.showcase}>
        <div className={styles.brand}><div className={styles.brandMark}><WandSparkles size={20} /></div><div><b>AUTO BOOST</b><span>MONGOLIA</span></div></div>
        <div className={styles.showcaseCopy}>
          <span className={styles.kicker}><Sparkles size={14} /> AI ADS OPERATING SYSTEM</span>
          <h1>Meta зар сурталчилгааг<br /><em>Монгол хэлээр.</em></h1>
          <p>Campaign builder, secure Meta OAuth, AI quality review, spend protection, workspace-based data layer — нэг production SaaS дотор.</p>
          <div className={styles.benefits}>
            <Benefit text="Meta API-тай шууд холболт" />
            <Benefit text="PAUSED-first зардлын хамгаалалт" />
            <Benefit text="Workspace тусгаарлалт + RLS" />
            <Benefit text="Encrypted Meta token vault" />
          </div>
        </div>
        <div className={styles.security}><ShieldCheck size={17} /><span>Supabase Auth · Row Level Security · AES-256-GCM</span></div>
      </section>

      <section className={styles.authPane}>
        <div className={styles.authCard}>
          <div className={styles.mobileBrand}><div className={styles.brandMark}><WandSparkles size={19} /></div><b>AUTO BOOST</b></div>
          <div className={styles.modeSwitch}>
            <button className={mode === 'login' ? styles.activeMode : ''} onClick={() => { setMode('login'); setError(''); setMessage('') }}>Нэвтрэх</button>
            <button className={mode === 'signup' ? styles.activeMode : ''} onClick={() => { setMode('signup'); setError(''); setMessage('') }}>Бүртгүүлэх</button>
          </div>

          <div className={styles.authHead}>
            <span>{mode === 'login' ? 'WELCOME BACK' : 'CREATE WORKSPACE'}</span>
            <h2>{mode === 'login' ? 'Auto Boost-д нэвтрэх' : 'Шинэ аккаунт үүсгэх'}</h2>
            <p>{mode === 'login' ? 'Өөрийн workspace болон Meta Ads тохиргоондоо нэвтэрнэ.' : 'Бүртгүүлмэгц таны үндсэн workspace автоматаар үүснэ.'}</p>
          </div>

          <form onSubmit={submit} className={styles.form}>
            {mode === 'signup' && <label><span>Нэр</span><div className={styles.inputWrap}><UserPlus size={17} /><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Таны нэр" required /></div></label>}
            <label><span>Имэйл</span><div className={styles.inputWrap}><Mail size={17} /><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" autoComplete="email" required /></div></label>
            <label><span>Нууц үг</span><div className={styles.inputWrap}><LockKeyhole size={17} /><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ тэмдэгт" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={8} required /></div></label>

            {error && <div className={styles.error}>{error}</div>}
            {message && <div className={styles.success}>{message}</div>}

            <button className={styles.submit} disabled={loading}>{loading ? 'Түр хүлээнэ үү…' : mode === 'login' ? 'Нэвтрэх' : 'Бүртгэл үүсгэх'} <ArrowRight size={17} /></button>
          </form>

          {mode === 'login' && <button className={styles.reset} onClick={resetPassword}>Нууц үгээ мартсан уу?</button>}

          <div className={styles.terms}>Үргэлжлүүлснээр Auto Boost Mongolia-ийн үйлчилгээний нөхцөл болон нууцлалын бодлогыг зөвшөөрсөнд тооцно.</div>
        </div>
      </section>
    </main>
  )
}

function Benefit({ text }: { text: string }) {
  return <div><span><Check size={12} /></span><b>{text}</b></div>
}
