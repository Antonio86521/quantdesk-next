'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, Shield, Globe, BarChart3, FlaskConical,
  Activity, Zap, Search, Settings2, ChevronRight,
  ArrowRight, Check,
} from 'lucide-react'

const FEATURES = [
  { icon:TrendingUp,   title:'Portfolio Analytics',    desc:'Performance attribution, Sharpe, Sortino, Calmar, alpha/beta, rolling metrics — everything a quant needs.',       color:'#2d7ff9' },
  { icon:Shield,       title:'Risk & VaR',             desc:'Historical and parametric VaR, CVaR, stress testing against 2008, COVID, 2022 rate shock and more.',              color:'#f54060' },
  { icon:Globe,        title:'Macro Dashboard',        desc:'Live rates, FX, commodities, yield curve and market regime detection across 20+ global assets.',                  color:'#7c5cfc' },
  { icon:Settings2,    title:'Derivatives Pricer',     desc:'Black-Scholes pricer with live Greeks, IV solver, sensitivity matrix and payoff diagram.',                        color:'#00c9a7' },
  { icon:FlaskConical, title:'Factor Exposure',        desc:'CAPM decomposition, systematic vs idiosyncratic risk, style factor radar and return attribution.',                 color:'#f0a500' },
  { icon:Activity,     title:'AI Sentiment',           desc:'LLM-powered analysis of SEC filings — 10-K, 10-Q, 8-K — scored bullish to bearish with key themes extracted.',   color:'#7c5cfc' },
  { icon:Zap,          title:'Monte Carlo Lab',        desc:'10,000-path GBM simulations with percentile bands, VaR overlay and payoff diagrams.',                            color:'#f54060' },
  { icon:Search,       title:'Stock Screener',         desc:'Multi-ticker RSI, momentum, SMA crossover signals across 8 built-in watchlists.',                                 color:'#2d7ff9' },
]

const STATS = [
  { value:'16',   label:'Analytical modules' },
  { value:'10K',  label:'Monte Carlo paths' },
  { value:'SEC',  label:'Filing AI analysis' },
  { value:'Live', label:'Market data' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <nav style={{
      position:'fixed', top:0, left:0, right:0, zIndex:100,
      background: scrolled ? 'rgba(7,9,14,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : 'none',
      transition:'all 0.3s ease',
      padding:'0 32px',
      display:'flex', alignItems:'center', justifyContent:'space-between',
      height:64,
    }}>
      <Link href="/" style={{ textDecoration:'none' }}>
        <Image src="/logo.svg" alt="QuantDesk Pro" width={140} height={36} style={{ objectFit:'contain' }} priority/>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Link href="/about"   style={{ padding:'8px 14px', color:'rgba(255,255,255,0.6)', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>About</Link>
        <Link href="/contact" style={{ padding:'8px 14px', color:'rgba(255,255,255,0.6)', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>Contact</Link>
        <Link href="/login"   style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500, textDecoration:'none' }}>Sign in</Link>
        <Link href="/register" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none', boxShadow:'0 0 20px rgba(45,127,249,0.3)' }}>Get started free</Link>
      </div>
    </nav>
  )
}

function Footer() {
  return (
    <footer style={{ background:'#05070d', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'60px 32px 32px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:48, marginBottom:52 }}>

          {/* Brand */}
          <div>
            <Image src="/logo.svg" alt="QuantDesk Pro" width={140} height={36} style={{ objectFit:'contain', marginBottom:16 }}/>
            <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.4)', lineHeight:1.8, maxWidth:280, marginBottom:24 }}>
              Institutional-grade portfolio analytics for independent investors. Built by quants, designed for everyone.
            </div>
            <div style={{ display:'flex', gap:12 }}>
              {[
                { href:'https://github.com/Antonio86521/quantdesk-next', label:'GitHub', icon:'⌥' },
                { href:'mailto:atorralbasa@gmail.com', label:'Email', icon:'✉' },
              ].map(({ href, label, icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'rgba(255,255,255,0.5)', textDecoration:'none', transition:'all 0.15s' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>Product</div>
            {[
              { href:'/portfolio',  label:'Portfolio Analytics' },
              { href:'/risk',       label:'Risk & Attribution' },
              { href:'/screener',   label:'Stock Screener' },
              { href:'/macro',      label:'Macro Dashboard' },
              { href:'/derivatives',label:'Derivatives Pricer' },
              { href:'/sentiment',  label:'AI Sentiment' },
              { href:'/montecarlo', label:'Monte Carlo Lab' },
              { href:'/reports',    label:'Report Generator' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ display:'block', fontSize:13.5, color:'rgba(255,255,255,0.45)', textDecoration:'none', marginBottom:10, transition:'color 0.14s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}
              >{label}</Link>
            ))}
          </div>

          {/* Company */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>Company</div>
            {[
              { href:'/about',   label:'About' },
              { href:'/contact', label:'Contact' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ display:'block', fontSize:13.5, color:'rgba(255,255,255,0.45)', textDecoration:'none', marginBottom:10, transition:'color 0.14s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}
              >{label}</Link>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div style={{ fontSize:11, color:'rgba(255,255,255,0.25)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:18 }}>Legal</div>
            {[
              { href:'/terms',   label:'Terms of Service' },
              { href:'/privacy', label:'Privacy Policy' },
              { href:'/risk-disclosure', label:'Risk Disclosure' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{ display:'block', fontSize:13.5, color:'rgba(255,255,255,0.45)', textDecoration:'none', marginBottom:10, transition:'color 0.14s' }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.8)'}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='rgba(255,255,255,0.45)'}
              >{label}</Link>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:28, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.2)' }}>© 2026 QuantDesk Pro. All rights reserved.</div>
          <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.2)' }}>Not investment advice · Data via yfinance · Educational use only</div>
        </div>
      </div>
    </footer>
  )
}

export { Footer, Navbar }

export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading) return null
  if (user) return null

  return (
    <div style={{ background:'#07090e', color:'#e4ecf7', minHeight:'100vh', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <Navbar/>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'120px 24px 80px', position:'relative', overflow:'hidden' }}>
        {/* Background orbs */}
        <div style={{ position:'absolute', top:'10%', left:'50%', transform:'translateX(-50%)', width:800, height:800, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.07) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'30%', left:'20%', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.05) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', top:'40%', right:'15%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.05) 0%, transparent 65%)', pointerEvents:'none' }}/>

        {/* Grid overlay */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:820 }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:20, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', marginBottom:28 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#2d7ff9', display:'inline-block' }}/>
            <span style={{ fontSize:12.5, color:'#5ba3f5', fontWeight:500, letterSpacing:'0.3px' }}>16 analytical modules · Live market data · AI-powered</span>
          </div>

          <h1 style={{ fontSize:'clamp(38px, 6vw, 72px)', fontWeight:700, letterSpacing:'-2px', lineHeight:1.05, marginBottom:24, color:'#fff' }}>
            The quant toolkit<br/>
            <span style={{ background:'linear-gradient(135deg, #2d7ff9, #7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              for independent investors
            </span>
          </h1>

          <p style={{ fontSize:'clamp(16px, 2vw, 20px)', color:'rgba(255,255,255,0.5)', lineHeight:1.7, maxWidth:580, margin:'0 auto 44px', fontWeight:400 }}>
            Institutional-grade portfolio analytics, risk management, derivatives pricing and AI sentiment analysis — all in one platform. Free to use.
          </p>

          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:56 }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', boxShadow:'0 0 40px rgba(45,127,249,0.35)', letterSpacing:'-0.2px' }}>
              Get started free <ArrowRight size={16}/>
            </Link>
            <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 28px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.8)', fontSize:15, fontWeight:500, textDecoration:'none' }}>
              Sign in
            </Link>
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:0, justifyContent:'center', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden', maxWidth:520, margin:'0 auto' }}>
            {STATS.map(({ value, label }, i) => (
              <div key={label} style={{ flex:1, padding:'18px 16px', textAlign:'center', borderRight: i < STATS.length-1 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:22, fontWeight:300, color:'#fff', marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:11, color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.8px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'100px 24px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div style={{ fontSize:11, color:'#2d7ff9', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', marginBottom:16 }}>Platform</div>
          <h2 style={{ fontSize:'clamp(28px, 4vw, 44px)', fontWeight:700, letterSpacing:'-1px', color:'#fff', marginBottom:16 }}>Everything you need to trade smarter</h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:520, margin:'0 auto' }}>From basic portfolio tracking to Monte Carlo simulation and AI-powered SEC analysis — all in one place.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:16 }}>
          {FEATURES.map(({ icon:Icon, title, desc, color }) => (
            <div key={title} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'24px', transition:'all 0.2s', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.05)'; el.style.borderColor=color+'33'; el.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.03)'; el.style.borderColor='rgba(255,255,255,0.07)'; el.style.transform='translateY(0)' }}
            >
              <div style={{ width:40, height:40, borderRadius:10, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16 }}>
                <Icon size={18} color={color} strokeWidth={1.5}/>
              </div>
              <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:8 }}>{title}</div>
              <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SOCIAL PROOF / DIFFERENTIATORS ── */}
      <section style={{ padding:'80px 24px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:52 }}>
            <h2 style={{ fontSize:'clamp(24px, 3.5vw, 38px)', fontWeight:700, letterSpacing:'-0.8px', color:'#fff', marginBottom:14 }}>Why QuantDesk Pro?</h2>
            <p style={{ fontSize:15.5, color:'rgba(255,255,255,0.4)' }}>The tools used to cost $24,000/year. Now they're free.</p>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(260px, 1fr))', gap:24 }}>
            {[
              { title:'Bloomberg-level analytics', desc:'Sharpe, Sortino, Calmar, VaR, CVaR, alpha, beta, factor decomposition, stress testing — the full institutional toolkit.', icon:'📊' },
              { title:'AI-powered insights',       desc:'Our LLM reads SEC filings in real time — 10-K, 10-Q, 8-K — and scores them bullish to bearish with key risk themes extracted automatically.', icon:'🤖' },
              { title:'No Bloomberg required',     desc:'Bloomberg Terminal costs $24K/year. QuantDesk Pro gives you 80% of the capability at 0% of the cost. Free forever for core features.', icon:'💰' },
              { title:'Built by quants',           desc:"Every metric follows CFA and quant finance standards. We don't simplify the maths — we simplify the interface.", icon:'🧪' },
            ].map(({ title, desc, icon }) => (
              <div key={title} style={{ padding:'28px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                <div style={{ fontSize:28, marginBottom:14 }}>{icon}</div>
                <div style={{ fontSize:16, fontWeight:600, color:'#fff', marginBottom:10 }}>{title}</div>
                <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'120px 24px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:600, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(28px, 4vw, 48px)', fontWeight:700, letterSpacing:'-1px', color:'#fff', marginBottom:18, lineHeight:1.1 }}>
            Start analysing your portfolio today
          </h2>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.45)', marginBottom:36, lineHeight:1.7 }}>
            Free to use. No credit card required. All 16 modules available on sign-up.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 32px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', boxShadow:'0 0 40px rgba(45,127,249,0.35)' }}>
              Create free account <ArrowRight size={16}/>
            </Link>
            <Link href="/about" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 24px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:500, textDecoration:'none' }}>
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <Footer/>
    </div>
  )
}