// app/api/alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getUserFromRequest(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  console.log('[alerts POST] user:', user?.id, 'auth header:', req.headers.get('authorization')?.slice(0, 20))
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { ticker, condition, targetPrice, note } = body

  if (!ticker || !condition || !targetPrice) {
    return NextResponse.json({ error: 'ticker, condition, targetPrice required' }, { status: 400 })
  }

  const { data, error } = await supabase
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