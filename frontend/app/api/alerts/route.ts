// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

async function getAuthenticatedClient(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  const token = authHeader.replace('Bearer ', '')

  // Create a client with the user's JWT — this makes RLS work correctly
  const client = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  })

  // Verify the token is valid
  const { data: { user }, error } = await client.auth.getUser(token)
  if (error || !user) return null

  return { client, user }
}

export async function GET(req: NextRequest) {
  const auth = await getAuthenticatedClient(req)
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { client, user } = auth

  const { data, error } = await client
    .from('alerts')
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
  const { ticker, condition, targetPrice, note } = body

  if (!ticker || !condition || !targetPrice) {
    return NextResponse.json({ error: 'ticker, condition, targetPrice required' }, { status: 400 })
  }

  const { data, error } = await client
    .from('alerts')
    .insert({
      user_id:      user.id,
      ticker:       ticker.toUpperCase(),
      condition,
      target_price: targetPrice,
      note:         note || '',
      status:       'active',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}