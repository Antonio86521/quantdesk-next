// app/api/analyses/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null
  return { client, user }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { client, user } = auth
  const { data, error } = await client
    .from('saved_analyses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const auth = await getAuthenticatedClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { client, user } = auth
  const body = await req.json()
  const { name, tickers, shares, buyPrices, period, benchmark, note, tag } = body
  if (!name || !tickers || !shares || !buyPrices) {
    return NextResponse.json({ error: 'name, tickers, shares, buyPrices required' }, { status: 400 })
  }
  const { data, error } = await client
    .from('saved_analyses')
    .insert({
      user_id:    user.id,
      name,
      tickers,
      shares,
      buy_prices: buyPrices,
      period:     period || '1y',
      benchmark:  benchmark || 'SPY',
      note:       note || '',
      tag:        tag || 'research',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}