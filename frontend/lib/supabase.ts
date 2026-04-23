import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

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