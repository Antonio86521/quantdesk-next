// app/api/alerts/trigger/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { alertId, userId, ticker, condition, targetPrice, currentPrice, note } = body

    if (!alertId || !userId || !ticker) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get user email
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const email      = user.email
    const direction  = condition === 'above' ? '↑ crossed above' : '↓ dropped below'
    const pctDiff    = (((currentPrice - targetPrice) / targetPrice) * 100).toFixed(2)
    const appUrl     = process.env.NEXT_PUBLIC_APP_URL || 'https://quantdesk-next.vercel.app'

    // Send email
    await resend.emails.send({
      from:    'QuantDesk Pro <onboarding@resend.dev>',
      to:      email,
      subject: `🔔 Alert Triggered: ${ticker} ${direction} $${targetPrice}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#07090e;color:#e4ecf7;">
          <div style="margin-bottom:24px;">
            <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2d7ff9,#7c5cfc);display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#fff;">QD</div>
            <span style="margin-left:12px;font-size:16px;font-weight:700;">QuantDesk Pro</span>
          </div>
          <div style="background:#0b0f17;border:1px solid rgba(255,255,255,0.055);border-radius:16px;padding:28px;margin-bottom:20px;">
            <div style="font-size:11px;color:#304560;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:16px;">Alert Triggered</div>
            <div style="font-size:36px;font-weight:300;color:#e4ecf7;font-family:monospace;margin-bottom:8px;">${ticker}</div>
            <div style="font-size:16px;color:${condition === 'above' ? '#0dcb7d' : '#f54060'};font-weight:600;margin-bottom:20px;">${direction} $${Number(targetPrice).toFixed(2)}</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
              <div style="background:#101520;border-radius:10px;padding:14px;">
                <div style="font-size:10px;color:#304560;text-transform:uppercase;margin-bottom:6px;">Current Price</div>
                <div style="font-size:22px;font-weight:300;font-family:monospace;">$${Number(currentPrice).toFixed(2)}</div>
              </div>
              <div style="background:#101520;border-radius:10px;padding:14px;">
                <div style="font-size:10px;color:#304560;text-transform:uppercase;margin-bottom:6px;">Target Price</div>
                <div style="font-size:22px;font-weight:300;font-family:monospace;">$${Number(targetPrice).toFixed(2)}</div>
              </div>
            </div>
            ${note ? `<div style="background:rgba(45,127,249,0.08);border:1px solid rgba(45,127,249,0.15);border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#68809a;">${note}</div>` : ''}
            <div style="font-size:11px;color:#304560;">Triggered at ${new Date().toUTCString()}</div>
          </div>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${appUrl}/alerts" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2d7ff9,#1a6de0);border-radius:9px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">View All Alerts →</a>
          </div>
          <div style="text-align:center;font-size:11px;color:#1e3048;">© 2026 QuantDesk Pro · Educational use only · Not investment advice</div>
        </div>
      `,
    })

    // Send push notification if subscription exists
    const { data: pushSub } = await supabaseAdmin
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single()

    if (pushSub?.subscription) {
      try {
        const webpush = await import('web-push')
        webpush.default.setVapidDetails(
          `mailto:${process.env.VAPID_EMAIL || 'alerts@quantdesk.pro'}`,
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          process.env.VAPID_PRIVATE_KEY!
        )
        await webpush.default.sendNotification(
          pushSub.subscription,
          JSON.stringify({
            title: `🔔 ${ticker} Alert Triggered`,
            body:  `${ticker} ${direction} $${Number(targetPrice).toFixed(2)} — now at $${Number(currentPrice).toFixed(2)}`,
            icon:  '/icon-192.png',
            url:   '/alerts',
          })
        )
      } catch (pushErr) {
        console.error('[trigger] Push error:', pushErr)
      }
    }

    return NextResponse.json({ ok: true, ticker, email })
  } catch (err: any) {
    console.error('[trigger] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}