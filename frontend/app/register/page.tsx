'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { Eye, EyeOff, Check, TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react'

function RegisterForm() {
  const { register, user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const redirect = params.get('redirect') || '/manager'

  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { if (user) router.push(redirect) }, [user])

  const pwStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3
  const pwLabel = ['', 'Too short', 'Weak', 'Good', 'Strong'][pwStrength]
  const pwColor = ['', 'var(--red)', 'var(--amber)', 'var(--accent2)', 'var(--green)'][pwStrength]

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !password) { setError('Please fill in all fields.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); setError('')
    const res = await register(name, email, password)
    if (res.ok) router.push(redirect)
    else { setError(res.error || 'Registration failed.'); setLoading(false) }
  }

  const features = [
    'Full portfolio analytics with live data',
    'Monte Carlo with 10,000 simulated paths',
    'Options pricing · Greeks · IV surface',
    'Risk attribution · VaR · Stress testing',
    'Multi-portfolio manager & saved analysis',
    'Professional PDF report generation',
  ]

  const form = (
    <div style={{ width:'100%', maxWidth:420 }}>
      <div style={{ marginBottom:32 }}>
        <h1 style={{ fontSize: isMobile?22:26, fontWeight:700, letterSpacing:'-0.5px', marginBottom:8 }}>Create your account</h1>
        <div style={{ fontSize:13.5, color:'var(--text2)' }}>
          Already have an account?{' '}
          <Link href={`/login?redirect=${encodeURIComponent(redirect)}`} style={{ color:'var(--accent2)', fontWeight:600, textDecoration:'none' }}>
            Sign in →
          </Link>
        </div>
      </div>

      <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:15 }}>
        <div>
          <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500, display:'block', marginBottom:7 }}>Full name</label>
          <input className="qd-input" placeholder="Jane Smith" value={name} onChange={e=>setName(e.target.value)} autoComplete="name" autoFocus style={{ fontSize:14 }}/>
        </div>

        <div>
          <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500, display:'block', marginBottom:7 }}>Email address</label>
          <input className="qd-input" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" style={{ fontSize:14 }}/>
        </div>

        <div>
          <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500, display:'block', marginBottom:7 }}>Password</label>
          <div style={{ position:'relative' }}>
            <input className="qd-input" type={showPw?'text':'password'} placeholder="Min. 6 characters" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="new-password" style={{ fontSize:14, paddingRight:44 }}/>
            <button type="button" onClick={()=>setShowPw(x=>!x)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, display:'flex', alignItems:'center' }}>
              {showPw?<EyeOff size={15}/>:<Eye size={15}/>}
            </button>
          </div>
          {password.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:'flex', gap:3, marginBottom:4 }}>
                {[1,2,3,4].map(i=>(
                  <div key={i} style={{ flex:1, height:3, borderRadius:2, background:i<=pwStrength?pwColor:'var(--bg5)', transition:'background 0.2s' }}/>
                ))}
              </div>
              <div style={{ fontSize:10.5, color:pwColor }}>{pwLabel}</div>
            </div>
          )}
        </div>

        <div>
          <label style={{ fontSize:11.5, color:'var(--text2)', fontWeight:500, display:'block', marginBottom:7 }}>Confirm password</label>
          <input className="qd-input" type={showPw?'text':'password'} placeholder="Repeat password" value={confirm} onChange={e=>setConfirm(e.target.value)} autoComplete="new-password" style={{ fontSize:14, borderColor:confirm&&confirm!==password?'rgba(245,64,96,0.4)':'' }}/>
          {confirm && confirm!==password && <div style={{ fontSize:11, color:'var(--red)', marginTop:5 }}>Passwords don't match</div>}
        </div>

        {error && (
          <div style={{ background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.25)', borderRadius:9, padding:'10px 14px', fontSize:12.5, color:'var(--red)', display:'flex', alignItems:'center', gap:8 }}>
            <span>⚠</span> {error}
          </div>
        )}

        <button type="submit" disabled={loading} style={{ padding:'12px', borderRadius:9, border:'none', cursor:loading?'not-allowed':'pointer', background:loading?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', color:'#fff', fontSize:14, fontWeight:700, boxShadow:loading?'none':'0 0 24px rgba(45,127,249,0.3)', transition:'all 0.15s', marginTop:4, display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
          {loading
            ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Creating account...</>
            : 'Create account →'
          }
        </button>
      </form>

      <div style={{ marginTop:20, fontSize:11.5, color:'var(--text3)', textAlign:'center', lineHeight:1.6 }}>
        By creating an account you agree that this is an educational tool.<br/>No real money is ever involved.
      </div>
    </div>
  )

  /* ── MOBILE layout ── */
  if (isMobile) {
    return (
      <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
        {/* Top branding strip */}
        <div style={{ background:'linear-gradient(160deg, rgba(45,127,249,0.12) 0%, rgba(124,92,252,0.08) 50%, transparent 100%), var(--bg2)', borderBottom:'1px solid var(--b1)', padding:'20px 24px', display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fd)', fontWeight:800, fontSize:14, color:'#fff', boxShadow:'0 0 20px rgba(45,127,249,0.4)', flexShrink:0 }}>QD</div>
          <div>
            <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700, color:'var(--text)' }}>QuantDesk Pro</div>
            <div style={{ fontSize:9.5, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase' }}>Portfolio Intelligence</div>
          </div>
        </div>

        {/* Form */}
        <div style={{ flex:1, padding:'28px 24px 40px', display:'flex', flexDirection:'column', alignItems:'center' }}>
          {form}

          {/* Features below form on mobile */}
          <div style={{ marginTop:28, width:'100%', maxWidth:420 }}>
            <div style={{ fontSize:10.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, marginBottom:14 }}>What's included</div>
            {features.map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(13,203,125,0.15)', border:'1px solid rgba(13,203,125,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Check size={10} color="var(--green)" strokeWidth={2.5}/>
                </div>
                <div style={{ fontSize:12.5, color:'var(--text2)' }}>{f}</div>
              </div>
            ))}
          </div>

          <div style={{ fontSize:11, color:'var(--text4)', marginTop:'auto', paddingTop:28, width:'100%', maxWidth:420 }}>
            © 2026 QuantDesk Pro · Educational use only · Not investment advice
          </div>
        </div>
      </div>
    )
  }

  /* ── DESKTOP layout ── */
  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', alignItems:'stretch' }}>
      {/* Left branding panel */}
      <div style={{ width:480, flexShrink:0, background:'linear-gradient(160deg, rgba(45,127,249,0.12) 0%, rgba(124,92,252,0.08) 50%, transparent 100%), var(--bg2)', borderRight:'1px solid var(--b1)', padding:'48px 52px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-100, right:-100, width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:52 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fd)', fontWeight:800, fontSize:16, color:'#fff', boxShadow:'0 0 24px rgba(45,127,249,0.4)' }}>QD</div>
            <div>
              <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:700, color:'var(--text)' }}>QuantDesk Pro</div>
              <div style={{ fontSize:10, color:'var(--text3)', letterSpacing:'0.8px', textTransform:'uppercase', marginTop:1 }}>Portfolio Intelligence</div>
            </div>
          </div>

          <div style={{ fontFamily:'var(--fd)', fontSize:28, fontWeight:700, letterSpacing:'-0.8px', color:'var(--text)', lineHeight:1.25, marginBottom:14 }}>
            Start your free<br/>Pro account today
          </div>
          <div style={{ fontSize:13.5, color:'var(--text2)', lineHeight:1.7, marginBottom:36 }}>
            Get instant access to all 14 analytical modules — portfolio analytics, risk attribution, Monte Carlo simulation, derivatives pricing and more.
          </div>

          {features.map((f,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'rgba(13,203,125,0.15)', border:'1px solid rgba(13,203,125,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Check size={10} color="var(--green)" strokeWidth={2.5}/>
              </div>
              <div style={{ fontSize:13, color:'var(--text2)' }}>{f}</div>
            </div>
          ))}
        </div>

        <div style={{ fontSize:11, color:'var(--text4)', position:'relative', zIndex:1 }}>
          © 2026 QuantDesk Pro · Educational use only · Not investment advice
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:40 }}>
        {form}
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm/></Suspense>
}