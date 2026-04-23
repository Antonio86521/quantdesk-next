'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight, TrendingUp, Zap, Settings2, Waves, Dice5,
  Search, Globe, FolderOpen, BarChart3, FlaskConical,
  Radio, Bell, BookOpen, FileText, RefreshCw,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { api } from '@/lib/api'

type ModVariant = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal'

const MODULES: {
  href: string; icon: any; name: string
  desc: string; tag: string; variant: ModVariant
}[] = [
  { href:'/portfolio',   icon:TrendingUp,   name:'Portfolio Analytics',  desc:'Performance · Attribution · Technicals · Rolling metrics',   tag:'Core',    variant:'blue'   },
  { href:'/risk',        icon:Zap,          name:'Risk & Attribution',   desc:'VaR · CVaR · Stress Test · Factor Beta · Drawdown profile',  tag:'Risk',    variant:'red'    },
  { href:'/derivatives', icon:Settings2,    name:'Derivatives Pricer',   desc:'Black-Scholes · Binomial · Monte Carlo · IV solver',         tag:'Options', variant:'teal'   },
  { href:'/vol-surface', icon:Waves,        name:'Vol Surface',          desc:'IV Smile · Term structure · 3D surface · Put/Call skew',    tag:'Options', variant:'teal'   },
  { href:'/montecarlo',  icon:Dice5,        name:'Monte Carlo Lab',      desc:'GBM simulation · Payoff diagrams · 10K paths',              tag:'Quant',   variant:'purple' },
  { href:'/screener',    icon:Search,       name:'Stock Screener',       desc:'Multi-ticker signals · RSI · Momentum · Volume ratio',      tag:'Tools',   variant:'blue'   },
  { href:'/macro',       icon:Globe,        name:'Macro Dashboard',      desc:'Rates · FX · Commodities · Regime detection',               tag:'Macro',   variant:'purple' },
  { href:'/manager',     icon:FolderOpen,   name:'Portfolio Manager',    desc:'Create · Edit · Save portfolios · Fund mode · NAV',         tag:'Pro',     variant:'amber'  },
  { href:'/analysis',    icon:BarChart3,    name:'Saved Analysis',       desc:'Benchmark diagnostics · Export packs · Commentary',          tag:'Pro',     variant:'amber'  },
  { href:'/factor',      icon:FlaskConical, name:'Factor Exposure',      desc:'Fama-French regression · Style map · R² decomposition',    tag:'Quant',   variant:'purple' },
  { href:'/market',      icon:Radio,        name:'Market Overview',      desc:'Live cross-asset heatmap · Sectors · Yield curve',          tag:'Live',    variant:'green'  },
  { href:'/alerts',      icon:Bell,         name:'Price Alerts',         desc:'Threshold monitoring · Live triggers · Alert history',       tag:'Tools',   variant:'blue'   },
  { href:'/journal',     icon:BookOpen,     name:'Trade Journal',        desc:'Log trades · P&L curve · Win rate · Setup analytics',       tag:'Tools',   variant:'green'  },
  { href:'/reports',     icon:FileText,     name:'Report Generator',     desc:'Portfolio · Risk · Macro snapshot · HTML/PDF export',       tag:'Pro',     variant:'amber'  },
]

function ModuleCard({ href, icon: Icon, name, desc, tag, variant }: typeof MODULES[0]) {
  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--b1)',
        borderRadius:14, padding:'18px 18px 16px', cursor:'pointer',
        transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
        height:'100%', display:'flex', flexDirection:'column',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'rgba(45,127,249,0.3)'
        el.style.background = 'rgba(45,127,249,0.04)'
        el.style.transform = 'translateY(-3px)'
        el.style.boxShadow = '0 16px 48px rgba(0,0,0,0.45)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement
        el.style.borderColor = 'var(--b1)'
        el.style.background = 'var(--bg2)'
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'none'
      }}
      >
        <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,255,255,0.04)', border:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:13 }}>
          <Icon size={17} strokeWidth={1.5} color="var(--text2)" />
        </div>
        <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6 }}>{name}</div>
        <div style={{ fontSize:11.5, color:'var(--text2)', lineHeight:1.6, flex:1 }}>{desc}</div>
        <div style={{ marginTop:14 }}>
          <Badge variant={variant}>{tag}</Badge>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const [market,    setMarket]    = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  const fetchData = async () => {
    try {
      const [snap, watch] = await Promise.all([
        api.market.snapshot(),
        api.market.watchlist(),
      ])
      setMarket(snap.data   || [])
      setWatchlist(watch.data || [])
      setLastUpdate(new Date().toLocaleTimeString())
    } catch (e) {
      console.error('API error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60_000)
    return () => clearInterval(id)
  }, [])

  const n_up   = watchlist.filter(w => w.up).length
  const n_down = watchlist.filter(w => !w.up).length

  return (
    <div style={{ padding:'0 28px 52px' }}>

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(45,127,249,0.09) 0%, rgba(124,92,252,0.05) 45%, transparent 75%), var(--bg2)',
        border:'1px solid var(--b1)', borderRadius:18,
        padding:'30px 36px', margin:'22px 0 18px',
        display:'flex', alignItems:'center', justifyContent:'space-between', gap:32,
      }}>
        <div style={{ position:'absolute', top:-100, right:-100, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.1) 0%, transparent 65%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:10, color:'var(--accent2)', letterSpacing:'1.8px', textTransform:'uppercase', fontWeight:700, marginBottom:12, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', padding:'4px 12px', borderRadius:20 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent2)', display:'inline-block', animation:'pulse 2s ease-in-out infinite' }} />
            Market Intelligence Terminal
          </div>
          <h1 style={{ fontSize:32, fontWeight:700, letterSpacing:'-0.8px', color:'var(--text)', lineHeight:1.15, marginBottom:10 }}>
            {greeting} — welcome back
          </h1>
          <div style={{ fontSize:13, color:'var(--text2)', display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
            {['14 analytical modules','Real-time market data','Python-powered analytics','FastAPI backend'].map((t,i,arr) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
                {t}{i < arr.length-1 && <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--text4)', display:'inline-block' }} />}
              </span>
            ))}
          </div>
          {lastUpdate && (
            <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
              <RefreshCw size={9} /> Last updated {lastUpdate}
            </div>
          )}
        </div>

        {/* Live counters — from real watchlist data */}
        <div style={{ display:'flex', flexShrink:0, position:'relative', zIndex:1, background:'rgba(255,255,255,0.03)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
          {[
            { val: loading ? '—' : String(n_up),   lbl:'Advancing', color:'var(--green)'   },
            { val: loading ? '—' : String(n_down),  lbl:'Declining', color:'var(--red)'     },
            { val: '14',                             lbl:'Modules',   color:'var(--accent2)' },
          ].map(({ val, lbl, color }, i) => (
            <div key={i} style={{ padding:'18px 26px', textAlign:'center', borderRight: i<2 ? '1px solid var(--b1)' : 'none' }}>
              <div style={{ fontFamily:'var(--fm)', fontSize:26, fontWeight:300, letterSpacing:'-1px', color, lineHeight:1 }}>{val}</div>
              <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginTop:6, fontWeight:700 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Market strip — LIVE from API ─────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:24 }}>
        {(loading ? Array(6).fill(null) : market.slice(0,6)).map((m,i) => (
          <div key={i} style={{ padding:'15px 18px', borderRight: i<5?'1px solid rgba(255,255,255,0.04)':'none', background:'var(--bg2)', transition:'background 0.15s', minHeight:88 }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
          >
            {!m
              ? <div style={{ height:'100%', minHeight:60 }} className="skeleton" />
              : <>
                  <div style={{ fontSize:9, color:'var(--text3)', letterSpacing:'1px', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>{m.label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:19, fontWeight:300, color:'var(--text)', marginBottom:7, lineHeight:1 }}>{m.value}</div>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4, fontSize:10.5, fontWeight:700, fontFamily:'var(--fm)', color:m.up?'var(--green)':'var(--red)', background:m.up?'rgba(13,203,125,0.12)':'rgba(245,64,96,0.12)' }}>
                      {m.up ? '▲' : '▼'} {m.chgStr}
                    </div>
                    {m.history && (
                      <svg width={40} height={16} style={{ overflow:'visible' }}>
                        <polyline
                          points={m.history.map((v:number,j:number) => {
                            const mn = Math.min(...m.history), mx = Math.max(...m.history)
                            return `${(j/(m.history.length-1))*40},${16-((v-mn)/(mx-mn||1))*16}`
                          }).join(' ')}
                          fill="none" stroke={m.up?'var(--green)':'var(--red)'} strokeWidth="1.2" strokeLinecap="round" opacity="0.6"
                        />
                      </svg>
                    )}
                  </div>
                </>
            }
          </div>
        ))}
      </div>

      {/* ── Modules + Watchlist ──────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 284px', gap:20, alignItems:'start' }}>

        {/* Modules grid */}
        <div>
          <SectionHeader title="All Modules" action={
            <span style={{ fontSize:11, color:'var(--text3)' }}>14 tools · Python-powered</span>
          } />
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
            {MODULES.map(m => <ModuleCard key={m.href} {...m} />)}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Watchlist — LIVE from API */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:18 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700 }}>Watchlist</div>
              <Badge variant="green" dot>Live</Badge>
            </div>

            {loading
              ? [...Array(6)].map((_,i) => (
                  <div key={i} style={{ height:44, marginBottom:4, borderRadius:6 }} className="skeleton" />
                ))
              : watchlist.length === 0
              ? <div style={{ fontSize:12.5, color:'var(--text3)', padding:'8px 0' }}>No data — check backend is running.</div>
              : watchlist.map((w,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i<watchlist.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div>
                      <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:500 }}>{w.ticker}</div>
                      <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:2 }}>{w.chgStr}</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:13 }}>
                        ${w.price >= 1000 ? w.price.toLocaleString('en',{minimumFractionDigits:2, maximumFractionDigits:2}) : w.price?.toFixed(2)}
                      </div>
                      <div style={{ fontSize:10.5, color:w.up?'var(--green)':'var(--red)', marginTop:2 }}>
                        {w.up ? '▲' : '▼'} {w.chgStr}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>

          {/* Quick access */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:18 }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Quick Access</div>
            {[
              { href:'/portfolio', label:'Portfolio Analytics', sub:'Enter holdings → live analysis'  },
              { href:'/market',    label:'Market Overview',     sub:'Live cross-asset snapshot'        },
              { href:'/screener',  label:'Stock Screener',      sub:'RSI · Momentum signals'           },
              { href:'/montecarlo',label:'Monte Carlo Lab',     sub:'10,000 path simulation'           },
              { href:'/reports',   label:'Reports',             sub:'Generate & export PDF'            },
            ].map(({ href, label, sub }) => (
              <Link key={href} href={href} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 12px', borderRadius:8, marginBottom:4, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', transition:'all 0.14s', textDecoration:'none' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.05)'; el.style.borderColor='var(--b2)' }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.02)'; el.style.borderColor='rgba(255,255,255,0.04)' }}
              >
                <div>
                  <div style={{ fontSize:12.5, color:'var(--text)', fontWeight:500 }}>{label}</div>
                  <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:1 }}>{sub}</div>
                </div>
                <ArrowRight size={13} color="var(--text3)" />
              </Link>
            ))}
          </div>

          {/* Market status card — live */}
          {!loading && market.length > 0 && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:18 }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Market Pulse</div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {market.slice(0,4).map((m,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <span style={{ fontSize:12, color:'var(--text2)' }}>{m.label}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ fontFamily:'var(--fm)', fontSize:12.5 }}>{m.value}</span>
                      <span style={{ fontSize:11, fontFamily:'var(--fm)', color:m.up?'var(--green)':'var(--red)', minWidth:56, textAlign:'right' }}>
                        {m.up?'▲':'▼'} {m.chgStr}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:12, display:'flex', alignItems:'center', gap:4 }}>
                <RefreshCw size={9} /> Updated {lastUpdate}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}