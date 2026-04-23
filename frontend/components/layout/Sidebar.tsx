'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, Zap, Settings2, Waves,
  Dice5, Search, Globe, FolderOpen, BarChart3, FlaskConical,
  Radio, Bell, BookOpen, FileText, Shield, Lock, LogOut, LogIn,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type NavItem = {
  href: string; icon: any; label: string
  badge?: string; protected?: boolean
}

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { href:'/',        icon:LayoutDashboard, label:'Dashboard' },
      { href:'/market',  icon:Radio,           label:'Market Overview', badge:'Live' },
      { href:'/alerts',  icon:Bell,            label:'Alerts',          badge:'3' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { href:'/portfolio',  icon:TrendingUp,   label:'Portfolio' },
      { href:'/risk',       icon:Shield,       label:'Risk & Attribution' },
      { href:'/screener',   icon:Search,       label:'Screener' },
      { href:'/macro',      icon:Globe,        label:'Macro Dashboard' },
      { href:'/factor',     icon:FlaskConical, label:'Factor Exposure' },
    ],
  },
  {
    group: 'Options & Quant',
    items: [
      { href:'/derivatives', icon:Settings2, label:'Derivatives' },
      { href:'/vol-surface', icon:Waves,     label:'Vol Surface' },
      { href:'/montecarlo',  icon:Dice5,     label:'Monte Carlo' },
    ],
  },
  {
    group: 'Portfolio Suite',
    items: [
      { href:'/manager',  icon:FolderOpen, label:'Portfolio Manager', protected:true },
      { href:'/analysis', icon:BarChart3,  label:'Saved Analysis',    protected:true },
      { href:'/journal',  icon:BookOpen,   label:'Trade Journal' },
      { href:'/reports',  icon:FileText,   label:'Reports' },
    ],
  },
]

export default function Sidebar() {
  const path   = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  // Don't show sidebar on login/register
  if (path === '/login' || path === '/register') return null

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  return (
    <aside style={{
      width:224, minWidth:224, height:'100vh',
      background:'var(--bg2)', borderRight:'1px solid var(--b1)',
      display:'flex', flexDirection:'column', overflow:'hidden', zIndex:40,
    }}>

      {/* Logo */}
      <div style={{ padding:'18px 16px 16px', borderBottom:'1px solid var(--b1)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, flexShrink:0, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fd)', fontWeight:800, fontSize:14, color:'#fff', boxShadow:'0 0 20px rgba(45,127,249,0.45)' }}>QD</div>
          <div>
            <div style={{ fontFamily:'var(--fd)', fontSize:14.5, fontWeight:700, color:'var(--text)', letterSpacing:'-0.3px', lineHeight:1 }}>QuantDesk</div>
            <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'1px', textTransform:'uppercase', marginTop:3 }}>Pro · Analytics</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 8px 8px' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom:2 }}>
            <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', padding:'12px 8px 5px' }}>
              {group}
            </div>
            {items.map(({ href, icon:Icon, label, badge, protected:isProtected }) => {
              const active  = path === href
              const locked  = isProtected && !user

              return (
                <Link key={href} href={locked ? `/login?redirect=${href}` : href} style={{
                  display:'flex', alignItems:'center', gap:9,
                  padding:'8px 10px', borderRadius:8, marginBottom:1,
                  color: active ? 'var(--accent2)' : locked ? 'var(--text3)' : 'var(--text2)',
                  background: active ? 'linear-gradient(90deg,rgba(45,127,249,0.12),rgba(45,127,249,0.06))' : 'transparent',
                  border:`1px solid ${active?'rgba(45,127,249,0.2)':'transparent'}`,
                  fontSize:12.5, fontWeight:active?600:400,
                  transition:'all 0.14s', textDecoration:'none', position:'relative',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = locked ? 'rgba(255,255,255,0.02)' : 'var(--bg3)'
                    el.style.color = locked ? 'var(--text2)' : 'var(--text)'
                    el.style.borderColor = 'var(--b1)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    const el = e.currentTarget as HTMLElement
                    el.style.background = 'transparent'
                    el.style.color = locked ? 'var(--text3)' : 'var(--text2)'
                    el.style.borderColor = 'transparent'
                  }
                }}
                >
                  {active && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:16, borderRadius:'0 3px 3px 0', background:'var(--accent)' }} />}
                  <Icon size={14} strokeWidth={active?2:1.5} style={{ flexShrink:0, marginLeft:active?4:0, opacity: locked?0.5:1 }} />
                  <span style={{ flex:1, opacity: locked?0.6:1 }}>{label}</span>

                  {/* Lock icon for protected pages when not logged in */}
                  {locked && (
                    <Lock size={10} color="var(--text3)" style={{ flexShrink:0 }} />
                  )}

                  {/* Badges */}
                  {badge && !locked && (
                    <span style={{
                      fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:10,
                      background: badge==='Live' ? 'rgba(13,203,125,0.15)' : 'rgba(245,64,96,0.15)',
                      color: badge==='Live' ? 'var(--green)' : 'var(--red)',
                      border:`1px solid ${badge==='Live'?'rgba(13,203,125,0.2)':'rgba(245,64,96,0.2)'}`,
                    }}>
                      {badge==='Live' ? '● Live' : badge}
                    </span>
                  )}

                  {/* Pro badge for protected pages when logged in */}
                  {isProtected && user && (
                    <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:'rgba(45,127,249,0.1)', color:'var(--accent2)', border:'1px solid rgba(45,127,249,0.2)' }}>
                      PRO
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User panel */}
      <div style={{ padding:10, borderTop:'1px solid var(--b1)', flexShrink:0 }}>
        {user ? (
          /* Logged in */
          <div>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0, boxShadow:'0 0 8px rgba(13,203,125,0.6)', animation:'pulse 2s ease-in-out infinite' }} />
              </div>
            </div>
            <button onClick={handleLogout} style={{
              width:'100%', display:'flex', alignItems:'center', gap:8,
              padding:'8px 10px', borderRadius:8, border:'1px solid var(--b1)',
              background:'transparent', color:'var(--text2)', fontSize:12,
              fontWeight:500, cursor:'pointer', transition:'all 0.14s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(245,64,96,0.08)'; el.style.color='var(--red)'; el.style.borderColor='rgba(245,64,96,0.2)' }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--text2)'; el.style.borderColor='var(--b1)' }}
            >
              <LogOut size={13} /> Sign out
            </button>
          </div>
        ) : (
          /* Not logged in */
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8, padding:'0 2px' }}>
              Sign in to access Portfolio Manager & Saved Analysis
            </div>
            <Link href="/login" style={{
              display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              padding:'9px', borderRadius:9, border:'1px solid rgba(45,127,249,0.3)',
              background:'rgba(45,127,249,0.08)', color:'var(--accent2)',
              fontSize:12.5, fontWeight:600, textDecoration:'none', transition:'all 0.14s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(45,127,249,0.15)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(45,127,249,0.08)'}
            >
              <LogIn size={13} /> Sign in
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}