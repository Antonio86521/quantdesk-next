'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

export type User = {
  id: string
  email: string
  name: string
  plan: 'free' | 'pro'
  createdAt: string
}

type AuthCtx = {
  user:     User | null
  session:  Session | null
  loading:  boolean
  login:    (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  register: (name: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout:   () => Promise<void>
}

const AuthContext = createContext<AuthCtx | null>(null)

function toUser(su: SupabaseUser, profile?: any): User {
  return {
    id:        su.id,
    email:     su.email || '',
    name:      profile?.name || su.user_metadata?.name || su.email?.split('@')[0] || 'User',
    plan:      profile?.plan || 'pro',
    createdAt: profile?.created_at || su.created_at || '',
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // ── Load profile helper ────────────────────────────────────────────────────
  const loadProfile = async (su: SupabaseUser) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', su.id)
      .single()
    setUser(toUser(su, data))
  }

  // ── Rehydrate on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) loadProfile(session.user).finally(() => setLoading(false))
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) await loadProfile(session.user)
        else setUser(null)
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      // Friendly error messages
      if (error.message.includes('Invalid login')) return { ok: false, error: 'Incorrect email or password.' }
      if (error.message.includes('Email not confirmed')) return { ok: false, error: 'Please confirm your email first.' }
      return { ok: false, error: error.message }
    }
    if (data.user) await loadProfile(data.user)
    return { ok: true }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!name.trim())  return { ok: false, error: 'Name is required.' }
    if (!email.trim()) return { ok: false, error: 'Email is required.' }
    if (!email.includes('@')) return { ok: false, error: 'Enter a valid email address.' }
    if (password.length < 6)  return { ok: false, error: 'Password must be at least 6 characters.' }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      if (error.message.includes('already registered')) return { ok: false, error: 'An account with this email already exists.' }
      return { ok: false, error: error.message }
    }

    // Update profile name immediately
    if (data.user) {
      await supabase.from('profiles').upsert({ id: data.user.id, name, plan: 'pro' })
      await loadProfile(data.user)
    }

    return { ok: true }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}