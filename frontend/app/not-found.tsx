'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Home, ArrowLeft, Search, TrendingUp, BarChart3 } from 'lucide-react'

export default function NotFound() {
  const router = useRouter()

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px', position:'relative', overflow:'hidden' }}>

      {/* Background glow */}
      <div style={{ position:'absolute', top:'30%', left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.06) 0%, transparent 65%)', pointerEvents:'none' }}/>

      {/* Grid */}
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'52px 52px', pointerEvents:'none' }}/>

      <div style={{ position:'relative', zIndex:1, textAlign:'center', maxWidth:520 }}>

        {/* 404 number */}
        <div style={{ fontFamily:'var(--fm)', fontSize:'clamp(80px,20vw,140px)', fontWeight:200, color:'rgba(255,255,255,0.06)', lineHeight:1, marginBottom:0, letterSpacing:'-4px', userSelect:'none' }}>404</div>

        {/* Icon */}
        <div style={{ width:64, height:64, borderRadius:18, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center', margin:'-20px auto 24px' }}>
          <Search size={26} color="var(--accent2)" strokeWidth={1.5}/>
        </div>

        <h1 style={{ fontSize:'clamp(22px,5vw,32px)', fontWeight:700, letterSpacing:'-0.8px', color:'var(--text)', marginBottom:12 }}>
          Page not found
        </h1>

        <p style={{ fontSize:15, color:'var(--text3)', lineHeight:1.7, marginBottom:36, maxWidth:380, margin:'0 auto 36px' }}>
          This page doesn't exist or has been moved. Head back to the dashboard or try one of the modules below.
        </p>

        {/* Primary actions */}
        <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap', marginBottom:40 }}>
          <button onClick={() => router.back()} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 20px', borderRadius:10, background:'var(--bg3)', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:13.5, fontWeight:500, cursor:'pointer' }}>
            <ArrowLeft size={14}/> Go back
          </button>
          <Link href="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'11px 24px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:13.5, fontWeight:600, textDecoration:'none', boxShadow:'0 0 24px rgba(45,127,249,0.3)' }}>
            <Home size={14}/> Go to Dashboard
          </Link>
        </div>

        {/* Quick links */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, maxWidth:400, margin:'0 auto' }}>
          {[
            { href:'/portfolio',  label:'Portfolio',  icon:TrendingUp, color:'#2d7ff9' },
            { href:'/screener',   label:'Screener',   icon:Search,     color:'#0dcb7d' },
            { href:'/risk',       label:'Risk',       icon:BarChart3,  color:'#f54060' },
          ].map(({ href, label, icon:Icon, color }) => (
            <Link key={href} href={href} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:8, padding:'14px 10px', borderRadius:12, background:'var(--bg2)', border:'1px solid var(--b1)', textDecoration:'none', transition:'all 0.15s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor=color+'44'; el.style.background='var(--bg3)' }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.borderColor='var(--b1)'; el.style.background='var(--bg2)' }}
            >
              <Icon size={18} color={color} strokeWidth={1.5}/>
              <span style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}