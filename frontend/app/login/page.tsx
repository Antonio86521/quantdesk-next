'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'

function LoginForm() {
  const { login, user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/manager'

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  useEffect(() => { if (user) router.push(redirect) }, [user])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true); setError('')
    const res = await login(email, password)
    if (res.ok) router.push(redirect)
    else { setError(res.error || 'Login failed.'); setLoading(false) }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'stretch',
    }}>
      {/* Left panel — branding */}
      <div style={{
        width: 480, flexShrink: 0,
        background: 'linear-gradient(160deg, rgba(45,127,249,0.12) 0%, rgba(124,92,252,0.08) 50%, transparent 100%), var(--bg2)',
        borderRight: '1px solid var(--b1)',
        padding: '48px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glows */}
        <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-80, left:-80, width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:52 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fd)', fontWeight:800, fontSize:16, color:'#fff', boxShadow:'0 0 24px rgba(45,127,249,0.4)' }}>QD</div>
            <div>
              <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:700, color:'var(--text)' }}>QuantDesk Pro</div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', marginTop:1 }}>Portfolio Intelligence</div>
            </div>
          </div>

          <div style={{ fontFamily:'var(--fd)', fontSize:30, fontWeight:700, letterSpacing:'-0.8px', color:'var(--text)', lineHeight:1.2, marginBottom:14 }}>
            Professional<br />Portfolio Analytics
          </div>
          <div style={{ fontSize:14, color:'var(--text2)', lineHeight:1.7, marginBottom:40 }}>
            Institutional-grade tools for portfolio performance analysis, risk management and quantitative research.
          </div>

          {/* Features */}
          {[
            { icon: TrendingUp, text: 'Real-time portfolio analytics with Python backend' },
            { icon: Shield,     text: 'VaR, CVaR, drawdown and full risk attribution' },
            { icon: Zap,        text: 'Monte Carlo simulation with 10,000 paths' },
            { icon: BarChart3,  text: 'Options pricing, vol surface and factor exposure' },
          ].map(({ icon: Icon, text }, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ width:32, height:32, borderRadius:8, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.15)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={14} color="var(--accent2)" strokeWidth={1.5} />
              </div>
              <div style={{ fontSize:13, color:'var(--text2)' }}>{text}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize:11, color:'var(--text4)', position:'relative', zIndex:1 }}>
          © 2026 QuantDesk Pro · Educational use only · Not investment advice
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex:1, display:'flex', alignItems:'center', justifyContent:'center',
        padding: 40,
      }}>
        <div style={{ width:'100%', maxWidth:420 }}>
          <div style={{ marginBottom:32 }}>
            <h1 style={{ fontSize:26, fontWeight:700, letterSpacing:'-0.5px', marginBottom:8 }}>Sign in</h1>
            <div style={{ fontSize:13.5, color:'var(--text2)' }}>
              Don't have an account?{' '}
              <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} style={{ color:'var(--accent2)', fontWeight:600, textDecoration:'none' }}>
                Create one free →
              </Link>
            </div>
          </div>

          <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500, display:'block', marginBottom:7 }}>Email address</label>
              <input
                className="qd-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                autoFocus
                style={{ fontSize:14 }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:7 }}>
                <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500 }}>Password</label>
              </div>
              <div style={{ position:'relative' }}>
                <input
                  className="qd-input"
                  type={showPw ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  style={{ fontSize:14, paddingRight:44 }}
                />
                <button type="button" onClick={() => setShowPw(x => !x)} style={{
                  position:'absolute', right:12, top:'50%', transform:'translateY(-50%)',
                  background:'none', border:'none', cursor:'pointer', color:'var(--text3)',
                  padding:4, display:'flex', alignItems:'center',
                }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.25)',
                borderRadius:9, padding:'10px 14px',
                fontSize:12.5, color:'var(--red)', display:'flex', alignItems:'center', gap:8,
              }}>
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} style={{
              padding:'12px', borderRadius:9, border:'none', cursor: loading?'not-allowed':'pointer',
              background: loading ? 'var(--bg4)' : 'linear-gradient(135deg,#2d7ff9,#1a6de0)',
              color:'#fff', fontSize:14, fontWeight:700,
              boxShadow: loading ? 'none' : '0 0 24px rgba(45,127,249,0.3)',
              transition:'all 0.15s', marginTop:4,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            }}>
              {loading
                ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Signing in...</>
                : 'Sign in →'
              }
            </button>
          </form>

          {/* Demo hint */}
          <div style={{
            marginTop:24, padding:'12px 16px',
            background:'rgba(255,255,255,0.03)', border:'1px solid var(--b1)',
            borderRadius:10, fontSize:12, color:'var(--text3)', lineHeight:1.6,
          }}>
            <strong style={{ color:'var(--text2)' }}>New here?</strong> Click{' '}
            <Link href={`/register?redirect=${encodeURIComponent(redirect)}`} style={{ color:'var(--accent2)', fontWeight:600 }}>Create an account</Link>
            {' '}— it's free and takes 10 seconds. No email verification required.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}