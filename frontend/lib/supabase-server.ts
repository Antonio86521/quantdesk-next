// lib/supabase-server.ts
// Use this ONLY in server components and API route handlers (not in 'use client' files)

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getSupabase() {
  const cookieStore = await cookies()
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
    },
  })
}