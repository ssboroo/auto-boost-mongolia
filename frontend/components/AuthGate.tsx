'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Sparkles } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
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

  return <>{children}</>
}
