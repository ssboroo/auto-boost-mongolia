'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useUi } from './ui/UiProvider'

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { text } = useUi()
  const [loading, setLoading] = useState(true)
  const [, setUser] = useState<User | null>(null)
  const isLogin = pathname === '/login'
  const isPublic = isLogin || ['/privacy', '/terms', '/data-deletion'].includes(pathname)

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const nextUser = data.session?.user || null
      setUser(nextUser)
      setLoading(false)
      if (!nextUser && !isPublic) router.replace('/login')
      if (nextUser && isLogin) router.replace('/')
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user || null
      setUser(nextUser)
      setLoading(false)
      if (!nextUser && !isPublic) router.replace('/login')
      if (nextUser && isLogin) router.replace('/')
    })
    return () => { active = false; listener.subscription.unsubscribe() }
  }, [isLogin, isPublic, router])

  if (isPublic) return <>{children}</>

  if (loading) return <div className="authLoadingScreen"><div className="authLoadingMark"><Sparkles size={23}/></div><b>BOOST.MN</b><span>{text('Workspace нээж байна…','Opening workspace…')}</span></div>

  return <>{children}</>
}
