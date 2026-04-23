import { supabase } from './supabase'
import type { Portfolio, Alert, Trade } from './supabase'

// ── PORTFOLIOS ─────────────────────────────────────────────────────────────

export const portfolioDb = {
  async getAll(userId: string): Promise<Portfolio[]> {
    const { data, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId: string, p: Omit<Portfolio, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .insert({ ...p, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async update(id: string, p: Partial<Portfolio>): Promise<Portfolio> {
    const { data, error } = await supabase
      .from('portfolios')
      .update({ ...p, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('portfolios').delete().eq('id', id)
    if (error) throw error
  },
}

// ── ALERTS ─────────────────────────────────────────────────────────────────

export const alertDb = {
  async getAll(userId: string): Promise<Alert[]> {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId: string, a: { ticker: string; condition: 'above' | 'below'; price: number }): Promise<Alert> {
    const { data, error } = await supabase
      .from('alerts')
      .insert({ ...a, user_id: userId, status: 'active' })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('alerts').delete().eq('id', id)
    if (error) throw error
  },

  async markTriggered(id: string): Promise<void> {
    const { error } = await supabase
      .from('alerts')
      .update({ status: 'triggered', triggered_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw error
  },
}

// ── TRADES ─────────────────────────────────────────────────────────────────

export const tradeDb = {
  async getAll(userId: string): Promise<Trade[]> {
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  },

  async create(userId: string, t: {
    ticker: string; side: 'BUY' | 'SELL'
    qty: number; price: number; type: string; notes: string; date: string
  }): Promise<Trade> {
    const { data, error } = await supabase
      .from('trades')
      .insert({ ...t, user_id: userId })
      .select()
      .single()
    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('trades').delete().eq('id', id)
    if (error) throw error
  },
}