'use client'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Mail } from 'lucide-react'

function Navbar() {
  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(7,9,14,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
      <Link href="/" style={{ textDecoration:'none' }}>
        <Image src="/logo.svg" alt="QuantDesk Pro" width={140} height={36} style={{ objectFit:'contain' }} priority/>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Link href="/about"   style={{ padding:'8px 14px', color:'#fff', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>About</Link>
        <Link href="/contact" style={{ padding:'8px 14px', color:'rgba(255,255,255,0.6)', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>Contact</Link>
        <Link href="/login"   style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500, textDecoration:'none' }}>Sign in</Link>
        <Link href="/register" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none' }}>Get started</Link>
      </div>
    </nav>
  )
}

export default function AboutPage() {
  return (
    <div style={{ background:'#07090e', color:'#e4ecf7', minHeight:'100vh', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <Navbar/>

      {/* Hero */}
      <section style={{ padding:'140px 24px 80px', maxWidth:800, margin:'0 auto', textAlign:'center' }}>
        <div style={{ fontSize:11, color:'#2d7ff9', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', marginBottom:16 }}>About</div>
        <h1 style={{ fontSize:'clamp(32px, 5vw, 56px)', fontWeight:700, letterSpacing:'-1.5px', lineHeight:1.1, color:'#fff', marginBottom:20 }}>
          Built by an investor,<br/>
          <span style={{ background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>for investors</span>
        </h1>
        <p style={{ fontSize:18, color:'rgba(255,255,255,0.45)', lineHeight:1.8, maxWidth:580, margin:'0 auto' }}>
          QuantDesk Pro started with a simple frustration: the best portfolio analytics tools cost $24,000 a year. Independent investors deserved better.
        </p>
      </section>

      {/* Story */}
      <section style={{ padding:'20px 24px 80px', maxWidth:720, margin:'0 auto' }}>
        <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'44px 48px' }}>
          {[
            { heading:'The problem', text:"Bloomberg Terminal costs $24,000 per year. FactSet and Refinitiv aren't far behind. For hedge funds and investment banks, that's a rounding error. For independent investors, portfolio managers at smaller firms, and finance students — it's completely out of reach." },
            { heading:'The solution', text:'QuantDesk Pro brings the same analytical rigour — Sharpe ratios, VaR, CVaR, factor decomposition, Monte Carlo simulation, stress testing, derivatives pricing — into a clean, modern interface that anyone can use. For free.' },
            { heading:'The technology', text:'Built on Next.js and Python/FastAPI with a real quant analytics engine. The risk metrics follow CFA Institute standards. The AI sentiment module reads SEC filings in real time using a large language model. The Excel export generates genuine institutional-quality workbooks.' },
            { heading:'The mission', text:"We believe access to good financial analytics shouldn't be gated behind a six-figure subscription. Every independent investor, finance student, and small advisory firm deserves the same tools that Wall Street uses." },
          ].map(({ heading, text }, i) => (
            <div key={heading} style={{ marginBottom: i < 3 ? 36 : 0 }}>
              <div style={{ fontSize:13, fontWeight:700, color:'#2d7ff9', textTransform:'uppercase', letterSpacing:'1px', marginBottom:10 }}>{heading}</div>
              <p style={{ fontSize:15.5, color:'rgba(255,255,255,0.55)', lineHeight:1.85 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ padding:'20px 24px 80px', maxWidth:800, margin:'0 auto' }}>
        <h2 style={{ fontSize:28, fontWeight:700, letterSpacing:'-0.5px', color:'#fff', marginBottom:32, textAlign:'center' }}>Built with</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12 }}>
          {[
            { name:'Next.js 16',    desc:'Frontend framework',       color:'#ffffff' },
            { name:'Python/FastAPI',desc:'Analytics backend',        color:'#2d7ff9' },
            { name:'Supabase',      desc:'Auth & database',          color:'#0dcb7d' },
            { name:'Llama 3.3 70B', desc:'AI sentiment analysis',    color:'#7c5cfc' },
            { name:'yfinance',      desc:'Market data',              color:'#f0a500' },
            { name:'openpyxl',      desc:'Excel report generation',  color:'#00c9a7' },
            { name:'Recharts',      desc:'Data visualisation',       color:'#f54060' },
            { name:'Vercel + Render',desc:'Deployment',              color:'#5ba3f5' },
          ].map(({ name, desc, color }) => (
            <div key={name} style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'18px 20px' }}>
              <div style={{ fontSize:14, fontWeight:600, color, marginBottom:5 }}>{name}</div>
              <div style={{ fontSize:12.5, color:'rgba(255,255,255,0.35)' }}>{desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:'60px 24px 120px', textAlign:'center' }}>
        <h2 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.8px', color:'#fff', marginBottom:14 }}>Ready to get started?</h2>
        <p style={{ fontSize:15.5, color:'rgba(255,255,255,0.4)', marginBottom:32 }}>Free to use. No credit card. All 16 modules.</p>
        <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
          <Link href="/register" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 28px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:14, fontWeight:600, textDecoration:'none', boxShadow:'0 0 32px rgba(45,127,249,0.3)' }}>
            Create free account <ArrowRight size={15}/>
          </Link>
          <Link href="/contact" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'13px 24px', borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontSize:14, fontWeight:500, textDecoration:'none' }}>
            Get in touch
          </Link>
        </div>
      </section>
    </div>
  )
}