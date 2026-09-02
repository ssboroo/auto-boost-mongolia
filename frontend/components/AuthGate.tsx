'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { ChevronUp, LogOut, Sparkles, UserRound } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const isPublic = pathname === '/login'

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const nextUser = data.session?.user || null
      setUser(nextUser)
      setLoading(false)
      if (!nextUser && !isPublic) router.replace('/login')
      if (nextUser && isPublic) router.replace('/')
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null
      setUser(nextUser)
      setLoading(false)
      if (!nextUser && !isPublic) router.replace('/login')
      if (nextUser && isPublic) router.replace('/')
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [isPublic, router])

  async function signOut() {
    setMenuOpen(false)
    await supabase.auth.signOut()
    window.location.assign('/login')
  }

  if (isPublic) return <>{children}</>

  if (loading || !user) {
    return (
      <div className="authLoadingScreen">
        <div className="authLoadingMark"><Sparkles size={23} /></div>
        <b>AUTO BOOST MONGOLIA</b>
        <span>Workspace нээж байна…</span>
      </div>
    )
  }

  return (
    <>
      {children}
      <div className="globalAccountDock">
        {menuOpen && (
          <div className="globalAccountMenu">
            <span>{user.email || 'Auto Boost хэрэглэгч'}</span>
            <button type="button" onClick={signOut}><LogOut size={15} /> Системээс гарах</button>
          </div>
        )}
        <button type="button" className="globalAccountButton" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
          <UserRound size={15} /><span>Миний аккаунт</span><ChevronUp size={14} />
        </button>
      </div>
    </>
  )
}
