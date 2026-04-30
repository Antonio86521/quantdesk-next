// app/api/alerts/trigger/route.ts
// Called by FastAPI scheduler when a price alert trips

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'

const resend = new Resend(process.env.RESEND_API_KEY)

// Use service role key so we can read user email
const supabase = createClient(
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

    // 1. Get user email from Supabase auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId)
    if (userError || !user?.email) {
      console.error('[trigger] Failed to get user:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const email = user.email
    const direction = condition === 'above' ? '↑ crossed above' : '↓ dropped below'
    const pctDiff   = (((currentPrice - targetPrice) / targetPrice) * 100).toFixed(2)

    // 2. Send email via Resend
    const { error: emailError } = await resend.emails.send({
      from:    'QuantDesk Pro <alerts@yourdomain.com>', // ← change to your verified domain
      to:      email,
      subject: `🔔 Alert Triggered: ${ticker} ${direction} $${targetPrice}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background:#07090e;font-family:'Segoe UI',system-ui,sans-serif;">
          <div style="max-width:520px;margin:0 auto;padding:32px 24px;">

            <!-- Logo -->
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:32px;">
              <div style="width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2d7ff9,#7c5cfc);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;color:#fff;">QD</div>
              <div>
                <div style="font-size:16px;font-weight:700;color:#e4ecf7;">QuantDesk Pro</div>
                <div style="font-size:10px;color:#304560;text-transform:uppercase;letter-spacing:0.8px;">Price Alert</div>
              </div>
            </div>

            <!-- Alert card -->
            <div style="background:#0b0f17;border:1px solid rgba(255,255,255,0.055);border-radius:16px;padding:28px;margin-bottom:20px;">
              <div style="font-size:11px;color:#304560;text-transform:uppercase;letter-spacing:1.2px;font-weight:700;margin-bottom:16px;">Alert Triggered</div>

              <div style="font-size:36px;font-weight:300;color:#e4ecf7;font-family:'Courier New',monospace;margin-bottom:8px;">${ticker}</div>

              <div style="font-size:16px;color:${condition === 'above' ? '#0dcb7d' : '#f54060'};font-weight:600;margin-bottom:20px;">
                ${direction} $${targetPrice.toFixed(2)}
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">
                <div style="background:#101520;border-radius:10px;padding:14px;">
                  <div style="font-size:10px;color:#304560;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Current Price</div>
                  <div style="font-size:22px;font-weight:300;color:#e4ecf7;font-family:'Courier New',monospace;">$${currentPrice.toFixed(2)}</div>
                </div>
                <div style="background:#101520;border-radius:10px;padding:14px;">
                  <div style="font-size:10px;color:#304560;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:6px;">Target Price</div>
                  <div style="font-size:22px;font-weight:300;color:#e4ecf7;font-family:'Courier New',monospace;">$${targetPrice.toFixed(2)}</div>
                </div>
              </div>

              <div style="background:#151c28;border-radius:8px;padding:12px 14px;margin-bottom:16px;">
                <div style="font-size:11px;color:#68809a;">
                  ${condition === 'above' ? '📈' : '📉'} Price is <strong style="color:${condition === 'above' ? '#0dcb7d' : '#f54060'};">${Math.abs(+pctDiff)}% ${condition === 'above' ? 'above' : 'below'}</strong> your target
                </div>
              </div>

              ${note ? `<div style="background:rgba(45,127,249,0.08);border:1px solid rgba(45,127,249,0.15);border-radius:8px;padding:12px 14px;margin-bottom:16px;"><div style="font-size:10px;color:#5ba3f5;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Your Note</div><div style="font-size:13px;color:#68809a;">${note}</div></div>` : ''}

              <div style="font-size:11px;color:#304560;">Triggered at ${new Date().toUTCString()}</div>
            </div>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:28px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quantdesk-next.vercel.app'}/alerts"
                style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#2d7ff9,#1a6de0);border-radius:9px;color:#fff;font-size:14px;font-weight:600;text-decoration:none;">
                View All Alerts →
              </a>
            </div>

            <!-- Footer -->
            <div style="text-align:center;font-size:11px;color:#1e3048;">
              © 2026 QuantDesk Pro · Educational use only · Not investment advice<br>
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://quantdesk-next.vercel.app'}/alerts" style="color:#304560;">Manage alerts</a>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (emailError) {
      console.error('[trigger] Email error:', emailError)
      // Don't fail the whole request — push might still work
    } else {
      console.log(`[trigger] Email sent to ${email} for ${ticker}`)
    }

    // 3. Send Web Push notification (if user has a push subscription)
    const { data: pushSub } = await supabase
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
            body:  `${ticker} ${direction} $${targetPrice.toFixed(2)} — now at $${currentPrice.toFixed(2)}`,
            icon:  '/icon-192.png',
            url:   '/alerts',
          })
        )
        console.log(`[trigger] Push notification sent for ${ticker}`)
      } catch (pushErr) {
        console.error('[trigger] Push error:', pushErr)
      }
    }

    return NextResponse.json({ ok: true, ticker, email })

  } catch (err: any) {
    console.error('[trigger] Unexpected error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}