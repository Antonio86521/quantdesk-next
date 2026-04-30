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

// ── Convert Supabase user to our User type ─────────────────────────────────
// Uses metadata first (no extra DB call), falls back to profile data
function toUser(su: SupabaseUser, profile?: any): User {
  return {
    id:        su.id,
    email:     su.email || '',
    name:      profile?.name || su.user_metadata?.name || su.email?.split('@')[0] || 'User',
    plan:      profile?.plan || 'pro',
    createdAt: profile?.created_at || su.created_at || '',
  }
}

// ── Fast user set — uses metadata, no DB call ──────────────────────────────
function setUserFast(su: SupabaseUser, setUser: (u: User) => void) {
  setUser(toUser(su))
}

// ── Load full profile from DB (background, non-blocking) ──────────────────
async function loadProfileBackground(su: SupabaseUser, setUser: (u: User) => void) {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('name, plan, created_at')
      .eq('id', su.id)
      .single()
    if (data) setUser(toUser(su, data))
  } catch {
    // silently fail — metadata version is fine
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,    setUser]    = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Get session — set user immediately from metadata (fast)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session?.user) {
        setUserFast(session.user, setUser)
        // Load full profile in background — doesn't block UI
        loadProfileBackground(session.user, setUser)
      }
      setLoading(false) // ← unblocks UI immediately
    })

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session)
        if (session?.user) {
          setUserFast(session.user, setUser)
          loadProfileBackground(session.user, setUser)
        } else {
          setUser(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  // ── Login ──────────────────────────────────────────────────────────────────
  const login = async (email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.includes('Invalid login')) return { ok: false, error: 'Incorrect email or password.' }
      if (error.message.includes('Email not confirmed')) return { ok: false, error: 'Please confirm your email first.' }
      return { ok: false, error: error.message }
    }
    // Set user immediately from auth response — no extra DB call needed
    if (data.user) {
      setUserFast(data.user, setUser)
      // Load profile in background after redirect
      loadProfileBackground(data.user, setUser)
    }
    return { ok: true }
  }

  // ── Register ───────────────────────────────────────────────────────────────
  const register = async (name: string, email: string, password: string): Promise<{ ok: boolean; error?: string }> => {
    if (!name.trim())         return { ok: false, error: 'Name is required.' }
    if (!email.trim())        return { ok: false, error: 'Email is required.' }
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

    if (data.user) {
      // Upsert profile in background
      supabase.from('profiles').upsert({ id: data.user.id, name, plan: 'pro' }).then(() => {
        loadProfileBackground(data.user!, setUser)
      })
      setUserFast(data.user, setUser)
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