'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, Shield, Globe, BarChart3, FlaskConical,
  Activity, Zap, Search, Settings2, ArrowRight, Menu, X,
} from 'lucide-react'

const FEATURES = [
  { icon:TrendingUp,   title:'Portfolio Analytics',  desc:'Sharpe, Sortino, Calmar, alpha/beta, rolling metrics — everything a quant needs.',      color:'#2d7ff9' },
  { icon:Shield,       title:'Risk & VaR',           desc:'Historical and parametric VaR, CVaR, stress testing against 2008, COVID, 2022.',         color:'#f54060' },
  { icon:Globe,        title:'Macro Dashboard',      desc:'Live rates, FX, commodities, yield curve and market regime detection.',                   color:'#7c5cfc' },
  { icon:Settings2,    title:'Derivatives Pricer',   desc:'Black-Scholes with live Greeks, IV solver, sensitivity matrix and payoff diagram.',       color:'#00c9a7' },
  { icon:FlaskConical, title:'Factor Exposure',      desc:'CAPM decomposition, systematic vs idiosyncratic risk, style factor radar.',               color:'#f0a500' },
  { icon:Activity,     title:'AI Sentiment',         desc:'LLM analysis of SEC filings — 10-K, 10-Q, 8-K — scored bullish to bearish.',            color:'#7c5cfc' },
  { icon:Zap,          title:'Monte Carlo Lab',      desc:'10,000-path GBM simulations with percentile bands and VaR overlay.',                     color:'#f54060' },
  { icon:Search,       title:'Stock Screener',       desc:'RSI, momentum, SMA crossover signals across 8 built-in watchlists.',                     color:'#2d7ff9' },
]

const STATS = [
  { value:'16',   label:'Modules' },
  { value:'10K',  label:'MC paths' },
  { value:'SEC',  label:'AI filing' },
  { value:'Live', label:'Data' },
]

const WHY = [
  { title:'Bloomberg-level analytics', desc:'Sharpe, VaR, CVaR, alpha, beta, factor decomp, stress testing — the full institutional toolkit.', icon:'📊' },
  { title:'AI-powered insights',       desc:'LLM reads SEC filings in real time and scores them bullish to bearish with risk themes extracted.', icon:'🤖' },
  { title:'No Bloomberg required',     desc:'Bloomberg costs $24K/year. QuantDesk Pro gives you 80% of the capability at 0% of the cost.', icon:'💰' },
  { title:'Built with standards',      desc:"Every metric follows CFA and quant finance standards. We simplify the interface, not the maths.", icon:'🧪' },
]

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:100,
        background: scrolled || menuOpen ? 'rgba(7,9,14,0.96)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(16px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid rgba(255,255,255,0.06)' : 'none',
        transition:'all 0.3s ease',
        padding:'0 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        height:60,
      }}>
        <Link href="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <Image src="/logo.svg" alt="QuantDesk Pro" width={120} height={32} style={{ objectFit:'contain', display:'block' }} priority/>
        </Link>

        {/* Desktop nav */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }} className="desktop-nav">
          <Link href="/about"    style={{ padding:'7px 12px', color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none', fontWeight:500 }}>About</Link>
          <Link href="/contact"  style={{ padding:'7px 12px', color:'rgba(255,255,255,0.6)', fontSize:13, textDecoration:'none', fontWeight:500 }}>Contact</Link>
          <Link href="/login"    style={{ padding:'7px 16px', borderRadius:7, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:12.5, fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          <Link href="/register" style={{ padding:'7px 16px', borderRadius:7, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>Get started free</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={()=>setMenuOpen(o=>!o)} className="mobile-nav-btn" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.8)', padding:4, display:'none' }}>
          {menuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </nav>

      {/* Mobile menu dropdown */}
      {menuOpen && (
        <div className="mobile-menu" style={{ position:'fixed', top:60, left:0, right:0, zIndex:99, background:'rgba(7,9,14,0.98)', borderBottom:'1px solid rgba(255,255,255,0.08)', padding:'16px 20px 24px', display:'none', flexDirection:'column', gap:4 }}>
          <Link href="/about"    onClick={()=>setMenuOpen(false)} style={{ display:'block', padding:'12px 0', color:'rgba(255,255,255,0.7)', fontSize:16, textDecoration:'none', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>About</Link>
          <Link href="/contact"  onClick={()=>setMenuOpen(false)} style={{ display:'block', padding:'12px 0', color:'rgba(255,255,255,0.7)', fontSize:16, textDecoration:'none', fontWeight:500, borderBottom:'1px solid rgba(255,255,255,0.06)' }}>Contact</Link>
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <Link href="/login"    onClick={()=>setMenuOpen(false)} style={{ flex:1, padding:'12px', borderRadius:9, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:14, fontWeight:500, textDecoration:'none', textAlign:'center' }}>Sign in</Link>
            <Link href="/register" onClick={()=>setMenuOpen(false)} style={{ flex:1, padding:'12px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:14, fontWeight:600, textDecoration:'none', textAlign:'center' }}>Get started free</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .desktop-nav { display: none !important; }
          .mobile-nav-btn { display: flex !important; }
          .mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}

function Footer() {
  return (
    <footer style={{ background:'#05070d', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'52px 20px 28px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        {/* Mobile: stacked, Desktop: 4-col grid */}
        <div className="footer-grid" style={{ display:'grid', gap:40, marginBottom:44 }}>
          <div>
            <Image src="/logo.svg" alt="QuantDesk Pro" width={130} height={34} style={{ objectFit:'contain', marginBottom:14 }}/>
            <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.8, maxWidth:280, marginBottom:20 }}>
              Institutional-grade portfolio analytics for independent investors.
            </div>
            <div style={{ display:'flex', gap:10 }}>
              {[
                { href:'https://github.com/Antonio86521/quantdesk-next', icon:'⌥' },
                { href:'mailto:atorralbasa@gmail.com', icon:'✉' },
              ].map(({ href, icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width:34, height:34, borderRadius:8, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'rgba(255,255,255,0.5)', textDecoration:'none' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="footer-links" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:32 }}>
            {[
              { heading:'Product', links:[
                { href:'/portfolio',  label:'Portfolio Analytics' },
                { href:'/risk',       label:'Risk & VaR' },
                { href:'/screener',   label:'Stock Screener' },
                { href:'/macro',      label:'Macro Dashboard' },
                { href:'/derivatives',label:'Derivatives' },
                { href:'/sentiment',  label:'AI Sentiment' },
                { href:'/reports',    label:'Reports' },
              ]},
              { heading:'Company', links:[
                { href:'/about',   label:'About' },
                { href:'/contact', label:'Contact' },
              ]},
              { heading:'Legal', links:[
                { href:'/terms',           label:'Terms of Service' },
                { href:'/privacy',         label:'Privacy Policy' },
                { href:'/risk-disclosure', label:'Risk Disclosure' },
              ]},
            ].map(({ heading, links }) => (
              <div key={heading}>
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.25)', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:14 }}>{heading}</div>
                {links.map(({ href, label }) => (
                  <Link key={href} href={href} style={{ display:'block', fontSize:13, color:'rgba(255,255,255,0.45)', textDecoration:'none', marginBottom:9, lineHeight:1.4 }}>
                    {label}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>© 2026 QuantDesk Pro. All rights reserved.</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)' }}>Not investment advice · Educational use only</div>
        </div>
      </div>

      <style>{`
        .footer-grid { grid-template-columns: 1fr; }
        .footer-links { grid-template-columns: 1fr 1fr 1fr; }
        @media (min-width: 768px) {
          .footer-grid { grid-template-columns: 1.5fr 2fr; }
        }
        @media (max-width: 480px) {
          .footer-links { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
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
      <section style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'100px 20px 72px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'15%', left:'50%', transform:'translateX(-50%)', width:'min(800px,120vw)', height:'min(800px,120vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.07) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:820, width:'100%' }}>
          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:20, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', marginBottom:24 }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#2d7ff9', display:'inline-block', flexShrink:0 }}/>
            <span style={{ fontSize:11.5, color:'#5ba3f5', fontWeight:500 }}>16 modules · Live data · AI-powered</span>
          </div>

          <h1 style={{ fontSize:'clamp(34px, 8vw, 72px)', fontWeight:700, letterSpacing:'clamp(-1px,-0.03em,-2px)', lineHeight:1.06, marginBottom:20, color:'#fff' }}>
            The quant toolkit<br/>
            <span style={{ background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              for independent investors
            </span>
          </h1>

          <p style={{ fontSize:'clamp(15px, 2.5vw, 19px)', color:'rgba(255,255,255,0.5)', lineHeight:1.7, maxWidth:520, margin:'0 auto 36px' }}>
            Institutional-grade analytics, risk management, derivatives pricing and AI sentiment — all in one platform. Free to use.
          </p>

          {/* CTAs — stack on mobile */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', boxShadow:'0 0 36px rgba(45,127,249,0.35)', width:'fit-content' }}>
              Get started free <ArrowRight size={15}/>
            </Link>
            <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:10, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.8)', fontSize:15, fontWeight:500, textDecoration:'none' }}>
              Sign in
            </Link>
          </div>

          {/* Stats strip — 4 cols, smaller on mobile */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:14, overflow:'hidden', maxWidth:480, margin:'0 auto' }}>
            {STATS.map(({ value, label }, i) => (
              <div key={label} style={{ padding:'14px 8px', textAlign:'center', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                <div style={{ fontFamily:"'DM Mono', monospace", fontSize:'clamp(16px,4vw,22px)', fontWeight:300, color:'#fff', marginBottom:3 }}>{value}</div>
                <div style={{ fontSize:'clamp(9px,2vw,11px)', color:'rgba(255,255,255,0.35)', textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding:'80px 20px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:52 }}>
          <div style={{ fontSize:10.5, color:'#2d7ff9', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', marginBottom:14 }}>Platform</div>
          <h2 style={{ fontSize:'clamp(24px, 5vw, 44px)', fontWeight:700, letterSpacing:'-0.8px', color:'#fff', marginBottom:14 }}>Everything you need to trade smarter</h2>
          <p style={{ fontSize:'clamp(14px,2vw,16px)', color:'rgba(255,255,255,0.4)', maxWidth:480, margin:'0 auto' }}>From portfolio tracking to Monte Carlo simulation and AI-powered SEC analysis.</p>
        </div>

        {/* 1-col mobile, 2-col tablet, 4-col desktop */}
        <div className="features-grid">
          {FEATURES.map(({ icon:Icon, title, desc, color }) => (
            <div key={title} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16, padding:'20px', position:'relative', overflow:'hidden' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.05)'; el.style.borderColor=color+'33'; el.style.transform='translateY(-2px)' }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.03)'; el.style.borderColor='rgba(255,255,255,0.07)'; el.style.transform='translateY(0)' }}
            >
              <div style={{ width:38, height:38, borderRadius:9, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <Icon size={17} color={color} strokeWidth={1.5}/>
              </div>
              <div style={{ fontSize:14.5, fontWeight:600, color:'#fff', marginBottom:7 }}>{title}</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.65 }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section style={{ padding:'72px 20px', background:'rgba(255,255,255,0.02)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:44 }}>
            <h2 style={{ fontSize:'clamp(22px, 5vw, 38px)', fontWeight:700, letterSpacing:'-0.6px', color:'#fff', marginBottom:12 }}>Why QuantDesk Pro?</h2>
            <p style={{ fontSize:'clamp(13px,2vw,15.5px)', color:'rgba(255,255,255,0.4)' }}>The tools used to cost $24,000/year. Now they're free.</p>
          </div>
          <div className="why-grid">
            {WHY.map(({ title, desc, icon }) => (
              <div key={title} style={{ padding:'24px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                <div style={{ fontSize:26, marginBottom:12 }}>{icon}</div>
                <div style={{ fontSize:15, fontWeight:600, color:'#fff', marginBottom:9 }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'100px 20px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'min(600px,90vw)', height:'min(600px,90vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:560, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(24px, 6vw, 48px)', fontWeight:700, letterSpacing:'-0.8px', color:'#fff', marginBottom:16, lineHeight:1.12 }}>
            Start analysing your portfolio today
          </h2>
          <p style={{ fontSize:'clamp(14px,2vw,16px)', color:'rgba(255,255,255,0.45)', marginBottom:32, lineHeight:1.7 }}>
            Free to use. No credit card required. All 16 modules on sign-up.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:600, textDecoration:'none', boxShadow:'0 0 36px rgba(45,127,249,0.35)' }}>
              Create free account <ArrowRight size={15}/>
            </Link>
            <Link href="/about" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 22px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.7)', fontSize:15, fontWeight:500, textDecoration:'none' }}>
              Learn more
            </Link>
          </div>
        </div>
      </section>

      <Footer/>

      <style>{`
        .features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }
        .why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .features-grid { grid-template-columns: repeat(4, 1fr); }
          .why-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 400px) {
          .features-grid { grid-template-columns: 1fr; }
          .why-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}