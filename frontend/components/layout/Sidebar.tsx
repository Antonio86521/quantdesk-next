'use client'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, TrendingUp, Zap, Settings2, Waves,
  Dice5, Search, Globe, FolderOpen, BarChart3, FlaskConical,
  Radio, Bell, BookOpen, FileText, Lock, LogOut, LogIn, X, Activity, Target,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

type NavItem = { href: string; icon: any; label: string; badge?: string; protected?: boolean }

const PUBLIC_PATHS = ['/', '/about', '/contact', '/login', '/register', '/terms', '/privacy', '/risk-disclosure']

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: 'Overview',
    items: [
      { href:'/dashboard', icon:LayoutDashboard, label:'Dashboard' },
      { href:'/market',    icon:Radio,           label:'Market Overview', badge:'Live' },
      { href:'/alerts',    icon:Bell,            label:'Alerts', badge:'3' },
    ],
  },
  {
    group: 'Analytics',
    items: [
      { href:'/portfolio',  icon:TrendingUp,   label:'Portfolio' },
      { href:'/risk',       icon:Zap,          label:'Risk & Attribution' },
      { href:'/screener',   icon:Search,       label:'Screener' },
      { href:'/macro',      icon:Globe,        label:'Macro Dashboard' },
      { href:'/factor',     icon:FlaskConical, label:'Factor Exposure' },
      { href:'/sentiment',  icon:Activity,     label:'Sentiment Alpha', badge:'AI' },
    ],
  },
  {
    group: 'Options & Quant',
    items: [
      { href:'/derivatives', icon:Settings2, label:'Derivatives' },
      { href:'/vol-surface', icon:Waves,     label:'Vol Surface' },
      { href:'/montecarlo',  icon:Dice5,     label:'Monte Carlo' },
      { href:'/kelly',       icon:Target,    label:'Kelly / Position Sizer' },
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

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const path   = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/')
    onClose?.()
  }

  const handleNav = () => onClose?.()

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>

      {/* ── Logo ── */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid var(--b1)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <Link href="/dashboard" onClick={handleNav} style={{ textDecoration:'none', display:'flex', alignItems:'center' }}>
          <Image
            src="/logo.svg"
            alt="QuantDesk Pro"
            width={150}
            height={40}
            style={{ objectFit:'contain', objectPosition:'left center' }}
            priority
          />
        </Link>
        {onClose && (
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4, flexShrink:0 }}>
            <X size={18}/>
          </button>
        )}
      </div>

      {/* ── Nav ── */}
      <nav style={{ flex:1, overflowY:'auto', padding:'6px 8px 8px' }}>
        {NAV.map(({ group, items }) => (
          <div key={group} style={{ marginBottom:2 }}>
            <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', padding:'12px 8px 5px' }}>{group}</div>
            {items.map(({ href, icon:Icon, label, badge, protected:isProtected }) => {
              const active = path === href
              const locked = isProtected && !user
              const isAI   = badge === 'AI'
              return (
                <Link key={href} href={locked ? `/login?redirect=${href}` : href}
                  onClick={handleNav}
                  style={{
                    display:'flex', alignItems:'center', gap:9,
                    padding:'9px 10px', borderRadius:8, marginBottom:1,
                    color: active?'var(--accent2)':locked?'var(--text3)':'var(--text2)',
                    background: active?'linear-gradient(90deg,rgba(45,127,249,0.12),rgba(45,127,249,0.06))':'transparent',
                    border:`1px solid ${active?'rgba(45,127,249,0.2)':'transparent'}`,
                    fontSize:13, fontWeight:active?600:400,
                    transition:'all 0.14s', textDecoration:'none', position:'relative',
                  }}
                >
                  {active && <div style={{ position:'absolute', left:0, top:'50%', transform:'translateY(-50%)', width:3, height:16, borderRadius:'0 3px 3px 0', background:'var(--accent)' }}/>}
                  <Icon size={15} strokeWidth={active?2:1.5} style={{ flexShrink:0, opacity:locked?0.5:1 }}/>
                  <span style={{ flex:1, opacity:locked?0.6:1 }}>{label}</span>
                  {locked && <Lock size={10} color="var(--text3)"/>}
                  {badge && !locked && !isAI && (
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:10,
                      background:badge==='Live'?'rgba(13,203,125,0.15)':'rgba(245,64,96,0.15)',
                      color:badge==='Live'?'var(--green)':'var(--red)',
                      border:`1px solid ${badge==='Live'?'rgba(13,203,125,0.2)':'rgba(245,64,96,0.2)'}` }}>
                      {badge==='Live'?'● Live':badge}
                    </span>
                  )}
                  {isAI && (
                    <span style={{ fontSize:9.5, fontWeight:700, padding:'1px 6px', borderRadius:10, background:'rgba(124,92,252,0.15)', color:'var(--purple)', border:'1px solid rgba(124,92,252,0.2)' }}>
                      ✦ AI
                    </span>
                  )}
                  {isProtected && user && (
                    <span style={{ fontSize:9, fontWeight:700, padding:'1px 5px', borderRadius:4, background:'rgba(45,127,249,0.1)', color:'var(--accent2)', border:'1px solid rgba(45,127,249,0.2)' }}>PRO</span>
                  )}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* ── User panel ── */}
      <div style={{ padding:10, borderTop:'1px solid var(--b1)', flexShrink:0 }}>
        {user ? (
          <div>
            <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'10px 12px', marginBottom:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:30, height:30, borderRadius:'50%', flexShrink:0, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth:0, flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user.email}</div>
                </div>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'var(--green)', flexShrink:0, boxShadow:'0 0 8px rgba(13,203,125,0.6)' }}/>
              </div>
            </div>
            <button onClick={handleLogout}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:'1px solid var(--b1)', background:'transparent', color:'var(--text2)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.14s' }}
              onMouseEnter={e => { const el=e.currentTarget as HTMLElement; el.style.background='rgba(245,64,96,0.08)'; el.style.color='var(--red)'; el.style.borderColor='rgba(245,64,96,0.2)' }}
              onMouseLeave={e => { const el=e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--text2)'; el.style.borderColor='var(--b1)' }}
            >
              <LogOut size={13}/> Sign out
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8, padding:'0 2px' }}>Sign in to access Pro features</div>
            <Link href="/login" onClick={handleNav} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'9px', borderRadius:9, border:'1px solid rgba(45,127,249,0.3)', background:'rgba(45,127,249,0.08)', color:'var(--accent2)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>
              <LogIn size={13}/> Sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Sidebar() {
  const path = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => { setMobileOpen(false) }, [path])

  useEffect(() => {
    const handler = () => setMobileOpen(o => !o)
    window.addEventListener('toggle-sidebar', handler)
    return () => window.removeEventListener('toggle-sidebar', handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  // Hide sidebar on public/landing pages
  if (PUBLIC_PATHS.includes(path)) return null

  return (
    <>
      <aside className="desktop-sidebar" style={{
        width:224, minWidth:224, height:'100vh',
        background:'var(--bg2)', borderRight:'1px solid var(--b1)',
        display:'flex', flexDirection:'column', overflow:'hidden', zIndex:40,
      }}>
        <SidebarContent/>
      </aside>

      {mobileOpen && (
        <>
          <div className="sidebar-overlay" onClick={() => setMobileOpen(false)}/>
          <aside style={{
            position:'fixed', top:0, left:0, bottom:0, width:280, zIndex:40,
            background:'var(--bg2)', borderRight:'1px solid var(--b2)',
            display:'flex', flexDirection:'column', overflow:'hidden',
            animation:'slideIn 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow:'4px 0 40px rgba(0,0,0,0.5)',
          }}>
            <SidebarContent onClose={() => setMobileOpen(false)}/>
          </aside>
        </>
      )}

      <style>{`
        .desktop-sidebar { display: flex !important; }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
      `}</style>
    </>
  )
}

export function useSidebarToggle() {
  return () => window.dispatchEvent(new CustomEvent('toggle-sidebar'))
}