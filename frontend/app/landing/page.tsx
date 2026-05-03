'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import {
  TrendingUp, Shield, Globe, FlaskConical,
  Activity, Zap, Search, Settings2, ArrowRight, Menu, X,
  ChevronRight,
} from 'lucide-react'

const FEATURES = [
  { icon:TrendingUp,   title:'Portfolio Analytics',  desc:'Sharpe, Sortino, Calmar, alpha/beta, rolling metrics.',      color:'#2d7ff9', href:'/portfolio',   tag:'Free' },
  { icon:Shield,       title:'Risk & VaR',           desc:'Historical VaR, CVaR, stress testing, drawdown analysis.',   color:'#f54060', href:'/risk',        tag:'Free' },
  { icon:Search,       title:'Stock Screener',       desc:'RSI, momentum, SMA crossover signals, 8 watchlists.',        color:'#2d7ff9', href:'/screener',    tag:'Free' },
  { icon:Globe,        title:'Macro Dashboard',      desc:'Live rates, FX, commodities, yield curve, regime detection.',color:'#7c5cfc', href:'/macro',       tag:'Free' },
  { icon:Settings2,    title:'Derivatives Pricer',   desc:'Black-Scholes with live Greeks, IV solver, payoff diagram.',  color:'#00c9a7', href:'/derivatives', tag:'Free' },
  { icon:FlaskConical, title:'Factor Exposure',      desc:'CAPM decomposition, systematic vs idiosyncratic risk.',       color:'#f0a500', href:'/factor',      tag:'Free' },
  { icon:Activity,     title:'AI Sentiment',         desc:'LLM analysis of SEC filings — scored bullish to bearish.',   color:'#7c5cfc', href:'/sentiment',   tag:'AI'   },
  { icon:Zap,          title:'Monte Carlo Lab',      desc:'10,000-path GBM simulations with percentile bands.',          color:'#f54060', href:'/montecarlo',  tag:'Free' },
]

const STATS = [
  { value:'16',   label:'Modules' },
  { value:'10K',  label:'MC paths' },
  { value:'SEC',  label:'AI filing' },
  { value:'Free', label:'Always'   },
]

const WHY = [
  { title:'Bloomberg-level analytics', desc:'VaR, CVaR, alpha, beta, factor decomp, stress testing — the full institutional toolkit.', icon:'📊' },
  { title:'AI-powered insights',       desc:'LLM reads SEC filings in real time and scores them bullish to bearish.',                   icon:'🤖' },
  { title:'No Bloomberg required',     desc:'Bloomberg costs $24K/year. QuantDesk gives you 80% of the capability for free.',          icon:'💰' },
  { title:'Built with standards',      desc:"Every metric follows CFA standards. We simplify the interface, not the maths.",           icon:'🧪' },
]

const STEPS = [
  { n:'01', title:'Pick a module',    desc:'No account needed. Tap any card below to open it instantly.' },
  { n:'02', title:'Enter your data',  desc:'Add tickers, shares and buy prices — or use the built-in defaults.' },
  { n:'03', title:'Run the analysis', desc:'Tap Analyse and get institutional-grade results in seconds.' },
  { n:'04', title:'Save your work',   desc:'Create a free account to save portfolios and export reports.' },
]

// ── Navbar ─────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled,  setScrolled]  = useState(false)
  const [menuOpen,  setMenuOpen]  = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  return (
    <>
      <nav style={{
        position:'fixed', top:0, left:0, right:0, zIndex:200,
        background: scrolled || menuOpen ? 'rgba(5,7,12,0.97)' : 'transparent',
        backdropFilter: scrolled || menuOpen ? 'blur(20px)' : 'none',
        borderBottom: scrolled || menuOpen ? '1px solid rgba(255,255,255,0.07)' : 'none',
        transition:'all 0.3s ease',
        padding:'0 20px', display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
      }}>
        <Link href="/" style={{ textDecoration:'none', flexShrink:0 }}>
          <Image src="/logo.svg" alt="QuantDesk Pro" width={130} height={34} style={{ objectFit:'contain', display:'block' }} priority/>
        </Link>

        {/* Desktop */}
        <div className="qd-desktop-nav" style={{ display:'flex', alignItems:'center', gap:6 }}>
          <Link href="/about"    style={{ padding:'7px 12px', color:'rgba(255,255,255,0.55)', fontSize:13, textDecoration:'none', fontWeight:500, transition:'color 0.14s' }}>About</Link>
          <Link href="/contact"  style={{ padding:'7px 12px', color:'rgba(255,255,255,0.55)', fontSize:13, textDecoration:'none', fontWeight:500, transition:'color 0.14s' }}>Contact</Link>
          <Link href="/login"    style={{ padding:'7px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.14)', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500, textDecoration:'none' }}>Sign in</Link>
          <Link href="/register" style={{ padding:'7px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none', boxShadow:'0 0 16px rgba(45,127,249,0.35)' }}>Get started free</Link>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(o => !o)} className="qd-mobile-btn" style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.8)', padding:6, display:'none', borderRadius:8 }}>
          {menuOpen ? <X size={22}/> : <Menu size={22}/>}
        </button>
      </nav>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="qd-mobile-menu" style={{
          position:'fixed', top:60, left:0, right:0, bottom:0, zIndex:199,
          background:'rgba(5,7,12,0.99)', display:'none', flexDirection:'column',
          padding:'32px 24px 40px', overflowY:'auto',
        }}>
          <div style={{ flex:1, display:'flex', flexDirection:'column', gap:4 }}>
            {[
              { href:'/portfolio',   label:'Portfolio Analytics', sub:'Sharpe, VaR, returns' },
              { href:'/risk',        label:'Risk & VaR',          sub:'Stress tests, drawdown' },
              { href:'/screener',    label:'Stock Screener',       sub:'RSI, momentum signals' },
              { href:'/macro',       label:'Macro Dashboard',      sub:'Rates, FX, commodities' },
              { href:'/derivatives', label:'Derivatives Pricer',   sub:'Greeks, IV solver' },
              { href:'/sentiment',   label:'AI Sentiment',         sub:'SEC filing analysis' },
              { href:'/about',       label:'About',                sub:'' },
              { href:'/contact',     label:'Contact',              sub:'' },
            ].map(({ href, label, sub }) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 0', borderBottom:'1px solid rgba(255,255,255,0.05)', textDecoration:'none' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#fff' }}>{label}</div>
                  {sub && <div style={{ fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:2 }}>{sub}</div>}
                </div>
                <ChevronRight size={16} color="rgba(255,255,255,0.2)"/>
              </Link>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginTop:32 }}>
            <Link href="/login"    onClick={() => setMenuOpen(false)} style={{ padding:'14px', borderRadius:12, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.85)', fontSize:14.5, fontWeight:500, textDecoration:'none', textAlign:'center' }}>Sign in</Link>
            <Link href="/register" onClick={() => setMenuOpen(false)} style={{ padding:'14px', borderRadius:12, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:14.5, fontWeight:700, textDecoration:'none', textAlign:'center', boxShadow:'0 0 24px rgba(45,127,249,0.4)' }}>Get started</Link>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 680px) {
          .qd-desktop-nav { display: none !important; }
          .qd-mobile-btn  { display: flex !important; }
          .qd-mobile-menu { display: flex !important; }
        }
      `}</style>
    </>
  )
}

// ── Footer ─────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ background:'#030508', borderTop:'1px solid rgba(255,255,255,0.06)', padding:'52px 20px 36px' }}>
      <div style={{ maxWidth:1100, margin:'0 auto' }}>
        <div className="qd-footer-grid" style={{ display:'grid', gap:44, marginBottom:44 }}>
          <div>
            <Image src="/logo.svg" alt="QuantDesk Pro" width={130} height={34} style={{ objectFit:'contain', marginBottom:16 }}/>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.8, maxWidth:260, marginBottom:20 }}>
              Institutional-grade portfolio analytics for independent investors.
            </p>
            <div style={{ display:'flex', gap:10 }}>
              {[
                { href:'https://github.com/Antonio86521/quantdesk-next', icon:'⌥' },
                { href:'mailto:atorralbasa@gmail.com', icon:'✉' },
              ].map(({ href, icon }) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                  style={{ width:36, height:36, borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'rgba(255,255,255,0.45)', textDecoration:'none' }}>
                  {icon}
                </a>
              ))}
            </div>
          </div>

          <div className="qd-footer-links" style={{ display:'grid', gap:32 }}>
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
                <div style={{ fontSize:10, color:'rgba(255,255,255,0.22)', fontWeight:700, letterSpacing:'1.8px', textTransform:'uppercase', marginBottom:14 }}>{heading}</div>
                {links.map(({ href, label }) => (
                  <Link key={href} href={href} style={{ display:'block', fontSize:13, color:'rgba(255,255,255,0.42)', textDecoration:'none', marginBottom:9, lineHeight:1.4 }}>{label}</Link>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:24, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>© 2026 QuantDesk Pro. All rights reserved.</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.18)' }}>Not investment advice · Educational use only</div>
        </div>
      </div>
      <style>{`
        .qd-footer-grid { grid-template-columns: 1fr; }
        .qd-footer-links { grid-template-columns: 1fr 1fr 1fr; }
        @media (min-width: 768px) { .qd-footer-grid { grid-template-columns: 1.4fr 2fr; } }
        @media (max-width: 500px)  { .qd-footer-links { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </footer>
  )
}

export { Footer, Navbar }

// ── Main Landing Page ───────────────────────────────────────────────────────
export default function LandingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading) return null
  if (user) return null

  return (
    <div style={{ background:'#07090e', color:'#e4ecf7', minHeight:'100vh', fontFamily:"'DM Sans', system-ui, -apple-system, sans-serif" }}>
      <Navbar/>

      {/* ── HERO ── */}
      <section style={{ minHeight:'100svh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', padding:'80px 20px 60px', position:'relative', overflow:'hidden' }}>
        {/* Glow orbs */}
        <div style={{ position:'absolute', top:'8%', left:'50%', transform:'translateX(-50%)', width:'min(700px,130vw)', height:'min(700px,130vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.08) 0%, transparent 60%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:'10%', right:'-10%', width:'min(400px,80vw)', height:'min(400px,80vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 60%)', pointerEvents:'none' }}/>
        {/* Grid */}
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)', backgroundSize:'52px 52px', pointerEvents:'none' }}/>

        <div style={{ position:'relative', zIndex:1, maxWidth:800, width:'100%' }}>
          {/* Pill badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'6px 16px', borderRadius:40, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.22)', marginBottom:28 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#2d7ff9', display:'inline-block', flexShrink:0, boxShadow:'0 0 6px #2d7ff9' }}/>
            <span style={{ fontSize:11.5, color:'#7db8ff', fontWeight:500, letterSpacing:'0.2px' }}>16 modules · Live data · AI-powered · No login needed</span>
          </div>

          <h1 style={{ fontSize:'clamp(32px, 9vw, 74px)', fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.04, marginBottom:18, color:'#fff' }}>
            The quant toolkit<br/>
            <span style={{ background:'linear-gradient(135deg, #2d7ff9 20%, #7c5cfc 80%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>
              for independent investors
            </span>
          </h1>

          <p style={{ fontSize:'clamp(15px, 2.8vw, 18px)', color:'rgba(255,255,255,0.48)', lineHeight:1.75, maxWidth:500, margin:'0 auto 36px' }}>
            Institutional-grade analytics, risk management and AI sentiment — all free. No account required to explore.
          </p>

          {/* CTA buttons — full width on mobile */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
            <Link href="/portfolio" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 28px', borderRadius:12, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 0 40px rgba(45,127,249,0.4)', letterSpacing:'-0.2px', flex:'0 1 auto' }}>
              Try the app free <ArrowRight size={15}/>
            </Link>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 22px', borderRadius:12, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.13)', color:'rgba(255,255,255,0.78)', fontSize:15, fontWeight:500, textDecoration:'none', flex:'0 1 auto' }}>
              Create account
            </Link>
          </div>

          {/* Stats — 4 col, compact on mobile */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, overflow:'hidden', maxWidth:440, margin:'0 auto' }}>
            {STATS.map(({ value, label }, i) => (
              <div key={label} style={{ padding:'16px 8px', textAlign:'center', borderRight:i<3?'1px solid rgba(255,255,255,0.06)':'none' }}>
                <div style={{ fontFamily:"'DM Mono', 'Courier New', monospace", fontSize:'clamp(17px,4.5vw,24px)', fontWeight:300, color:'#fff', marginBottom:4 }}>{value}</div>
                <div style={{ fontSize:'clamp(8.5px,2vw,10.5px)', color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.6px' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding:'72px 20px 60px', maxWidth:880, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:44 }}>
          <div style={{ fontSize:10.5, color:'#2d7ff9', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:12 }}>Getting started</div>
          <h2 style={{ fontSize:'clamp(20px,5vw,36px)', fontWeight:700, letterSpacing:'-0.6px', color:'#fff', marginBottom:10 }}>No setup. No account needed.</h2>
          <p style={{ fontSize:'clamp(13px,2vw,15px)', color:'rgba(255,255,255,0.38)' }}>Tap any module below and start immediately.</p>
        </div>
        <div className="qd-steps-grid">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={{ width:38, height:38, borderRadius:10, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.22)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'DM Mono','Courier New',monospace", fontSize:11, fontWeight:700, color:'#5ba3f5', flexShrink:0 }}>{n}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:700, color:'#fff', marginBottom:5 }}>{title}</div>
                <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.38)', lineHeight:1.65 }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULES ── */}
      <section style={{ padding:'0 20px 80px', maxWidth:1100, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ fontSize:10.5, color:'#2d7ff9', fontWeight:700, letterSpacing:'2.5px', textTransform:'uppercase', marginBottom:12 }}>Platform</div>
          <h2 style={{ fontSize:'clamp(20px,5vw,38px)', fontWeight:700, letterSpacing:'-0.7px', color:'#fff', marginBottom:10 }}>Tap any module to open it</h2>
          <p style={{ fontSize:'clamp(13px,2vw,15px)', color:'rgba(255,255,255,0.38)' }}>All modules are free. No login required.</p>
        </div>

        {/* Guest notice — compact on mobile */}
        <div style={{ background:'rgba(45,127,249,0.07)', border:'1px solid rgba(45,127,249,0.18)', borderRadius:14, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <span style={{ fontSize:20 }}>💡</span>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:13, fontWeight:600, color:'#7db8ff', marginBottom:2 }}>Exploring as a guest</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,0.42)', lineHeight:1.55 }}>All analytics work without signing in. <Link href="/register" style={{ color:'#2d7ff9', textDecoration:'none', fontWeight:600 }}>Create a free account</Link> to save work & export reports.</div>
          </div>
          <Link href="/register" style={{ padding:'8px 16px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:12.5, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
            Sign up free
          </Link>
        </div>

        {/* Module cards */}
        <div className="qd-features-grid">
          {FEATURES.map(({ icon:Icon, title, desc, color, href, tag }) => (
            <Link key={title} href={href} style={{ textDecoration:'none', display:'block' }}>
              <div
                className="qd-feature-card"
                style={{ background:'rgba(255,255,255,0.028)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:18, padding:'20px', position:'relative', overflow:'hidden', cursor:'pointer', transition:'all 0.22s ease', height:'100%', display:'flex', flexDirection:'column' }}
              >
                {/* Accent top bar */}
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color}cc,transparent)` }}/>

                {/* Tag */}
                <span style={{ position:'absolute', top:14, right:14, fontSize:9, fontWeight:700, padding:'2px 8px', borderRadius:5, background:tag==='AI'?'rgba(124,92,252,0.15)':'rgba(13,203,125,0.1)', color:tag==='AI'?'#a78bfa':'#34d399', border:`1px solid ${tag==='AI'?'rgba(124,92,252,0.25)':'rgba(52,211,153,0.2)'}`, letterSpacing:'0.8px', textTransform:'uppercase' }}>
                  {tag==='AI'?'✦ AI':'Free'}
                </span>

                {/* Icon */}
                <div style={{ width:42, height:42, borderRadius:12, background:`${color}15`, border:`1px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, flexShrink:0 }}>
                  <Icon size={18} color={color} strokeWidth={1.5}/>
                </div>

                <div style={{ fontSize:14.5, fontWeight:700, color:'#f0f4ff', marginBottom:7, paddingRight:42, lineHeight:1.3 }}>{title}</div>
                <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.38)', lineHeight:1.65, marginBottom:16, flex:1 }}>{desc}</div>

                <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12.5, fontWeight:600, color }}>
                  Open <ChevronRight size={13}/>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── WHY ── */}
      <section style={{ padding:'68px 20px', background:'rgba(255,255,255,0.018)', borderTop:'1px solid rgba(255,255,255,0.05)', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth:900, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <h2 style={{ fontSize:'clamp(20px,5vw,36px)', fontWeight:700, letterSpacing:'-0.6px', color:'#fff', marginBottom:10 }}>Why QuantDesk Pro?</h2>
            <p style={{ fontSize:'clamp(13px,2vw,15px)', color:'rgba(255,255,255,0.38)' }}>The tools used to cost $24,000/year. Now they're free.</p>
          </div>
          <div className="qd-why-grid">
            {WHY.map(({ title, desc, icon }) => (
              <div key={title} style={{ padding:'24px 22px', background:'rgba(255,255,255,0.022)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:16 }}>
                <div style={{ fontSize:28, marginBottom:14 }}>{icon}</div>
                <div style={{ fontSize:14.5, fontWeight:700, color:'#f0f4ff', marginBottom:9 }}>{title}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,0.38)', lineHeight:1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding:'96px 20px', textAlign:'center', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:'min(560px,90vw)', height:'min(560px,90vw)', borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.09) 0%, transparent 60%)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:520, margin:'0 auto' }}>
          <h2 style={{ fontSize:'clamp(22px,6vw,46px)', fontWeight:800, letterSpacing:'-0.8px', color:'#fff', marginBottom:16, lineHeight:1.1 }}>
            Ready to go deeper?
          </h2>
          <p style={{ fontSize:'clamp(14px,2vw,16px)', color:'rgba(255,255,255,0.42)', marginBottom:36, lineHeight:1.75 }}>
            Save portfolios, set alerts and export Excel reports — all free.
          </p>
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 28px', borderRadius:12, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:15, fontWeight:700, textDecoration:'none', boxShadow:'0 0 40px rgba(45,127,249,0.38)' }}>
              Create free account <ArrowRight size={15}/>
            </Link>
            <Link href="/portfolio" style={{ display:'inline-flex', alignItems:'center', gap:9, padding:'14px 22px', borderRadius:12, background:'rgba(255,255,255,0.045)', border:'1px solid rgba(255,255,255,0.12)', color:'rgba(255,255,255,0.72)', fontSize:15, fontWeight:500, textDecoration:'none' }}>
              Explore without signing up
            </Link>
          </div>
        </div>
      </section>

      <Footer/>

      <style>{`
        /* ── Module grid ── */
        .qd-features-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        /* ── Why grid ── */
        .qd-why-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        /* ── Steps ── */
        .qd-steps-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px 36px;
        }
        /* ── Desktop: 4 col ── */
        @media (min-width: 768px) {
          .qd-features-grid { grid-template-columns: repeat(4,1fr); gap: 14px; }
          .qd-why-grid      { grid-template-columns: repeat(4,1fr); gap: 20px; }
          .qd-steps-grid    { grid-template-columns: repeat(4,1fr); gap: 28px 40px; }
        }
        /* ── Very small phones ── */
        @media (max-width: 380px) {
          .qd-features-grid { grid-template-columns: 1fr; }
          .qd-why-grid      { grid-template-columns: 1fr; }
          .qd-steps-grid    { grid-template-columns: 1fr; }
        }
        /* ── Card hover (desktop only) ── */
        @media (hover: hover) {
          .qd-feature-card:hover {
            background: rgba(255,255,255,0.055) !important;
            transform: translateY(-4px) !important;
            box-shadow: 0 16px 40px rgba(0,0,0,0.45) !important;
          }
        }
        /* ── Mobile active press feel ── */
        @media (hover: none) {
          .qd-feature-card:active {
            transform: scale(0.97) !important;
            opacity: 0.85 !important;
          }
        }
        /* ── Touch-friendly tap targets ── */
        @media (max-width: 680px) {
          .qd-feature-card { padding: 16px !important; border-radius: 14px !important; }
        }
      `}</style>
    </div>
  )
}