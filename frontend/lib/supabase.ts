import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase instance (use in components / client-side code)
export const supabase = createClient(url, key)

// Server-side Supabase instance with session/cookie support (use in route handlers)
export async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
    },
  })
}

export type Profile = {
  id: string
  name: string
  plan: 'free' | 'pro'
  created_at: string
}

export type Portfolio = {
  id: string
  user_id: string
  name: string
  description: string
  strategy: string
  color: string
  holdings: { ticker: string; shares: string; buyPrice: string }[]
  created_at: string
  updated_at: string
}

export type Alert = {
  id: string
  user_id: string
  ticker: string
  condition: 'above' | 'below'
  price: number
  status: 'active' | 'triggered'
  triggered_at: string | null
  created_at: string
}

export type Trade = {
  id: string
  user_id: string
  date: string
  ticker: string
  side: 'BUY' | 'SELL'
  qty: number
  price: number
  type: string
  notes: string
  created_at: string
}