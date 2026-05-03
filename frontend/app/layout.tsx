'use client'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, TrendingUp, Search, Radio, FolderOpen } from 'lucide-react'

const AUTH_ROUTES = ['/login', '/register']

const BOTTOM_NAV = [
  { href:'/',          icon:LayoutDashboard, label:'Home'      },
  { href:'/portfolio', icon:TrendingUp,      label:'Portfolio' },
  { href:'/screener',  icon:Search,          label:'Screener'  },
  { href:'/market',    icon:Radio,           label:'Market'    },
  { href:'/manager',   icon:FolderOpen,      label:'Manager'   },
]

function AppShell({ children }: { children: React.ReactNode }) {
  const path   = usePathname()
  const router = useRouter()
  const isAuth = AUTH_ROUTES.includes(path)

  if (isAuth) return <>{children}</>

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar/>
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar/>
        <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>
      <nav className="bottom-nav">
        {BOTTOM_NAV.map(({ href, icon:Icon, label }) => {
          const active = path === href
          return (
            <button key={href} onClick={() => router.push(href)} style={{
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:4, flex:1, padding:'8px 4px',
              background:'none', border:'none', cursor:'pointer',
              color: active ? 'var(--accent2)' : 'var(--text3)',
              transition:'color 0.14s',
            }}>
              <div style={{
                padding:'4px 16px', borderRadius:20,
                background: active ? 'rgba(45,127,249,0.15)' : 'transparent',
                transition:'background 0.14s',
              }}>
                <Icon size={20} strokeWidth={active?2:1.5}/>
              </div>
              <span style={{ fontSize:10, fontWeight:active?600:400, letterSpacing:'0.2px' }}>{label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* ── Viewport & PWA ── */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"/>
        <meta name="theme-color" content="#07090e"/>
        <meta name="apple-mobile-web-app-capable" content="yes"/>
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
        <meta name="apple-mobile-web-app-title" content="QuantDesk Pro"/>
        <meta name="application-name" content="QuantDesk Pro"/>

        {/* ── Primary SEO ── */}
        <title>QuantDesk Pro — Portfolio Intelligence Platform</title>
        <meta name="description" content="Institutional-grade portfolio analytics for serious traders. Live P&L tracking, VaR, stress testing, factor exposure, Monte Carlo simulation and AI-powered sentiment analysis from SEC filings."/>
        <meta name="keywords" content="portfolio analytics, stock screener, VaR calculator, factor exposure, portfolio risk, quantitative finance, options pricer, Monte Carlo simulation, Bloomberg alternative"/>
        <meta name="author" content="QuantDesk Pro"/>
        <meta name="robots" content="index, follow"/>
        <link rel="canonical" href="https://quantdeskpro.com"/>

        {/* ── Open Graph (LinkedIn, Facebook, WhatsApp) ── */}
        <meta property="og:type"        content="website"/>
        <meta property="og:url"         content="https://quantdeskpro.com"/>
        <meta property="og:site_name"   content="QuantDesk Pro"/>
        <meta property="og:title"       content="QuantDesk Pro — Portfolio Intelligence Platform"/>
        <meta property="og:description" content="Institutional-grade portfolio analytics. Live P&L, VaR, stress testing, factor exposure, Monte Carlo simulation and AI sentiment analysis. Free to use."/>
        <meta property="og:image"       content="https://quantdeskpro.com/og-image.png"/>
        <meta property="og:image:width"  content="1200"/>
        <meta property="og:image:height" content="630"/>
        <meta property="og:image:alt"   content="QuantDesk Pro — Portfolio Intelligence Platform"/>

        {/* ── Twitter / X card ── */}
        <meta name="twitter:card"        content="summary_large_image"/>
        <meta name="twitter:site"        content="@quantdeskpro"/>
        <meta name="twitter:title"       content="QuantDesk Pro — Portfolio Intelligence Platform"/>
        <meta name="twitter:description" content="Institutional-grade portfolio analytics. Live P&L, VaR, stress testing, Monte Carlo simulation and AI sentiment. Free to use."/>
        <meta name="twitter:image"       content="https://quantdeskpro.com/og-image.png"/>

        {/* ── Favicons ── */}
        <link rel="icon"             href="/favicon.svg" type="image/svg+xml"/>
        <link rel="icon"             href="/favicon.ico" sizes="any"/>
        <link rel="apple-touch-icon" href="/apple-icon.png"/>
        <link rel="manifest"         href="/manifest.json"/>
      </head>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}