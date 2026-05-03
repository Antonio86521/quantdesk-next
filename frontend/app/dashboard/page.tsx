'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import {
  ArrowRight, TrendingUp, Zap, Settings2, Waves, Dice5,
  Search, Globe, FolderOpen, BarChart3, FlaskConical,
  Radio, Bell, BookOpen, FileText, RefreshCw, Target,
  Activity, TrendingDown, Minus, ChevronRight,
} from 'lucide-react'
import Badge from '@/components/ui/Badge'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

type ModVariant = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal'

const MODULES: { href:string; icon:any; name:string; desc:string; tag:string; variant:ModVariant; color:string }[] = [
  { href:'/portfolio',   icon:TrendingUp,   name:'Portfolio Analytics',  desc:'Performance · Attribution · Technicals · Rolling metrics',  tag:'Core',    variant:'blue',   color:'#2d7ff9' },
  { href:'/risk',        icon:Zap,          name:'Risk & Attribution',   desc:'VaR · CVaR · Stress Test · Factor Beta · Drawdown',        tag:'Risk',    variant:'red',    color:'#f54060' },
  { href:'/derivatives', icon:Settings2,    name:'Derivatives Pricer',   desc:'Black-Scholes · Greeks · IV solver · Sensitivity',          tag:'Options', variant:'teal',   color:'#00c9a7' },
  { href:'/vol-surface', icon:Waves,        name:'Vol Surface',          desc:'IV Smile · Term structure · 3D surface · Put/Call skew',   tag:'Options', variant:'teal',   color:'#00c9a7' },
  { href:'/montecarlo',  icon:Dice5,        name:'Monte Carlo Lab',      desc:'GBM simulation · Payoff diagrams · 10K paths',             tag:'Quant',   variant:'purple', color:'#7c5cfc' },
  { href:'/screener',    icon:Search,       name:'Stock Screener',       desc:'Multi-ticker signals · RSI · Momentum · Volume ratio',     tag:'Tools',   variant:'blue',   color:'#2d7ff9' },
  { href:'/macro',       icon:Globe,        name:'Macro Dashboard',      desc:'Rates · FX · Commodities · Yield curve · Regime',          tag:'Macro',   variant:'purple', color:'#7c5cfc' },
  { href:'/manager',     icon:FolderOpen,   name:'Portfolio Manager',    desc:'Create · Edit · Save portfolios · Fund mode · NAV',        tag:'Pro',     variant:'amber',  color:'#f0a500' },
  { href:'/analysis',    icon:BarChart3,    name:'Saved Analysis',       desc:'Benchmark diagnostics · Export packs · Commentary',         tag:'Pro',     variant:'amber',  color:'#f0a500' },
  { href:'/factor',      icon:FlaskConical, name:'Factor Exposure',      desc:'CAPM · Beta · Alpha · Style factors · Risk decomp',        tag:'Quant',   variant:'purple', color:'#7c5cfc' },
  { href:'/market',      icon:Radio,        name:'Market Overview',      desc:'Live cross-asset heatmap · Sectors · Yield curve',         tag:'Live',    variant:'green',  color:'#0dcb7d' },
  { href:'/alerts',      icon:Bell,         name:'Price Alerts',         desc:'Threshold monitoring · Email + push · 60s checks',         tag:'Tools',   variant:'blue',   color:'#2d7ff9' },
  { href:'/sentiment',   icon:Activity,     name:'Sentiment Alpha',      desc:'SEC filings · LLM scoring · Institutional signals',        tag:'AI',      variant:'purple', color:'#7c5cfc' },
  { href:'/kelly',       icon:Target,       name:'Kelly / Position Sizer',desc:'Optimal sizing · Risk of ruin · Growth simulator',       tag:'Tools',   variant:'green',  color:'#0dcb7d' },
  { href:'/journal',     icon:BookOpen,     name:'Trade Journal',        desc:'Log trades · P&L curve · Win rate · Setup analytics',      tag:'Tools',   variant:'green',  color:'#0dcb7d' },
  { href:'/reports',     icon:FileText,     name:'Report Generator',     desc:'Portfolio · Risk · Macro snapshot · HTML/PDF export',      tag:'Pro',     variant:'amber',  color:'#f0a500' },
]

const TAG_COLORS: Record<string, string> = {
  Core:'#2d7ff9', Risk:'#f54060', Options:'#00c9a7', Quant:'#7c5cfc',
  Tools:'#5ba3f5', Macro:'#7c5cfc', Pro:'#f0a500', Live:'#0dcb7d', AI:'#7c5cfc',
}

function SparkLine({ data, up }: { data: number[]; up: boolean }) {
  if (!data?.length || data.length < 2) return null
  const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1
  const pts = data.map((v,i) => `${(i/(data.length-1))*48},${14-((v-mn)/range)*14}`).join(' ')
  return (
    <svg width={48} height={14} style={{ display:'block', flexShrink:0 }}>
      <polyline points={pts} fill="none" stroke={up?'#0dcb7d':'#f54060'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity={0.8}/>
    </svg>
  )
}

function ModuleCard({ href, icon:Icon, name, desc, tag, color }: typeof MODULES[0]) {
  const [hovered, setHovered] = useState(false)
  const tagColor = TAG_COLORS[tag] || '#2d7ff9'
  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: hovered ? `rgba(${color === '#2d7ff9' ? '45,127,249' : color === '#f54060' ? '245,64,96' : color === '#0dcb7d' ? '13,203,125' : color === '#7c5cfc' ? '124,92,252' : color === '#f0a500' ? '240,165,0' : '0,201,167'},0.06)` : 'var(--bg2)',
          border: `1px solid ${hovered ? color + '44' : 'var(--b1)'}`,
          borderRadius:14, padding:'16px 16px 14px',
          cursor:'pointer', transition:'all 0.18s cubic-bezier(0.4,0,0.2,1)',
          height:'100%', display:'flex', flexDirection:'column',
          transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
          boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.4)` : 'none',
          position:'relative', overflow:'hidden',
        }}
      >
        {hovered && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }}/>}
        <div style={{ width:36, height:36, borderRadius:9, background:`${color}18`, border:`1px solid ${color}33`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, flexShrink:0 }}>
          <Icon size={16} strokeWidth={1.5} color={color}/>
        </div>
        <div style={{ fontFamily:'var(--fd)', fontSize:12.5, fontWeight:700, color:'var(--text)', marginBottom:5, lineHeight:1.3 }}>{name}</div>
        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.55, flex:1 }}>{desc}</div>
        <div style={{ marginTop:12, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ padding:'2px 8px', borderRadius:20, background:`${tagColor}18`, border:`1px solid ${tagColor}33`, fontSize:9.5, fontWeight:700, color:tagColor, letterSpacing:'0.5px' }}>{tag}</div>
          <ChevronRight size={12} color="var(--text4)" style={{ opacity: hovered ? 1 : 0, transition:'opacity 0.15s' }}/>
        </div>
      </div>
    </Link>
  )
}

export default function Dashboard() {
  const { user }    = useAuth()
  const [market,    setMarket]    = useState<any[]>([])
  const [watchlist, setWatchlist] = useState<any[]>([])
  const [loading,   setLoading]   = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')
  const [isMobile,  setIsMobile]  = useState(false)
  const [tagFilter, setTagFilter] = useState('All')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const hour     = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name?.split(' ')[0] || ''

  const fetchData = useCallback(async () => {
    try {
      const [snap, watch] = await Promise.all([api.market.snapshot(), api.market.watchlist()])
      setMarket(snap.data || [])
      setWatchlist(watch.data || [])
      setLastUpdate(new Date().toLocaleTimeString())
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 60_000)
    return () => clearInterval(id)
  }, [fetchData])

  const n_up   = watchlist.filter(w => w.up).length
  const n_down = watchlist.filter(w => !w.up).length

  const tags = ['All', ...Array.from(new Set(MODULES.map(m => m.tag)))]
  const filtered = tagFilter === 'All' ? MODULES : MODULES.filter(m => m.tag === tagFilter)

  // Market regime detection
  const sp500 = market.find(m => m.ticker === 'SPY')
  const vix   = market.find(m => m.ticker === '^VIX')
  const regime = sp500 && vix ? (sp500.up && vix.raw < 20 ? { label:'Risk-On', color:'#0dcb7d', bg:'rgba(13,203,125,0.08)', border:'rgba(13,203,125,0.2)' } : !sp500.up && vix.raw > 25 ? { label:'Risk-Off', color:'#f54060', bg:'rgba(245,64,96,0.08)', border:'rgba(245,64,96,0.2)' } : { label:'Neutral', color:'#f0a500', bg:'rgba(240,165,0,0.08)', border:'rgba(240,165,0,0.2)' }) : null

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <div style={{
        position:'relative', overflow:'hidden',
        background:'linear-gradient(135deg, rgba(45,127,249,0.08) 0%, rgba(124,92,252,0.04) 50%, transparent 80%), var(--bg2)',
        border:'1px solid var(--b1)', borderRadius:18,
        padding: isMobile ? '20px 18px' : '28px 32px',
        margin:'20px 0 16px',
      }}>
        {/* Background orbs */}
        <div style={{ position:'absolute', top:-80, right:-80, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(45,127,249,0.12) 0%, transparent 65%)', pointerEvents:'none' }}/>
        <div style={{ position:'absolute', bottom:-60, left:'30%', width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,92,252,0.08) 0%, transparent 65%)', pointerEvents:'none' }}/>

        <div style={{ display:'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent:'space-between', gap:16, flexDirection: isMobile ? 'column' : 'row', position:'relative', zIndex:1 }}>
          <div>
            {/* Live pill */}
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, fontSize:10, color:'var(--accent2)', letterSpacing:'1.6px', textTransform:'uppercase', fontWeight:700, marginBottom:12, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', padding:'4px 12px', borderRadius:20 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent2)', display:'inline-block', animation:'pulse 2s ease-in-out infinite' }}/>
              Market Intelligence Terminal
            </div>

            <h1 style={{ fontSize: isMobile ? 22 : 30, fontWeight:700, letterSpacing:'-0.5px', lineHeight:1.2, marginBottom:10 }}>
              {greeting}{firstName ? ` — ${firstName}` : ' — welcome back'}
            </h1>

            <div style={{ fontSize:12.5, color:'var(--text2)', display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {['16 analytical modules','Real-time market data','Python-powered analytics','FastAPI backend'].map((t,i,arr) => (
                <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
                  {t}{i < arr.length - 1 && <span style={{ width:3, height:3, borderRadius:'50%', background:'var(--text4)', display:'inline-block' }}/>}
                </span>
              ))}
            </div>

            {lastUpdate && (
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:8, display:'flex', alignItems:'center', gap:4 }}>
                <RefreshCw size={8}/> Updated {lastUpdate}
              </div>
            )}
          </div>

          {/* Counters */}
          <div style={{ display:'flex', flexShrink:0, background:'rgba(255,255,255,0.03)', border:'1px solid var(--b1)', borderRadius:13, overflow:'hidden' }}>
            {[
              { val: loading ? '—' : String(n_up),   lbl:'Advancing', color:'#0dcb7d' },
              { val: loading ? '—' : String(n_down),  lbl:'Declining', color:'#f54060' },
              { val: '16',                             lbl:'Modules',   color:'var(--accent2)' },
            ].map(({ val, lbl, color }, i) => (
              <div key={i} style={{ padding: isMobile ? '14px 18px' : '16px 24px', textAlign:'center', borderRight: i < 2 ? '1px solid var(--b1)' : 'none' }}>
                <div style={{ fontFamily:'var(--fm)', fontSize: isMobile ? 22 : 26, fontWeight:300, color, lineHeight:1 }}>{val}</div>
                <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginTop:5, fontWeight:700 }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Regime badge */}
        {regime && (
          <div style={{ position:'relative', zIndex:1, marginTop:16, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'5px 12px', borderRadius:20, background:regime.bg, border:`1px solid ${regime.border}`, fontSize:11, fontWeight:700, color:regime.color }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:regime.color }}/>
              Market Regime: {regime.label}
            </div>
            {sp500 && (
              <div style={{ fontSize:11, color:'var(--text3)' }}>
                S&P {sp500.up ? '▲' : '▼'} {sp500.chgStr} · VIX {vix?.value}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MARKET STRIP ─────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(6,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
        {(loading ? Array(6).fill(null) : market.slice(0, 6)).map((m, i) => (
          <Link key={i} href="/macro" style={{ textDecoration:'none' }}>
            <div
              style={{ padding: isMobile ? '12px 10px' : '14px 16px', borderRight: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none', background:'var(--bg2)', transition:'background 0.15s', minHeight: isMobile ? 76 : 88, cursor:'pointer' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg2)'}
            >
              {!m
                ? <div style={{ height:'100%', minHeight:60 }} className="skeleton"/>
                : <>
                    <div style={{ fontSize:8, color:'var(--text4)', letterSpacing:'0.8px', textTransform:'uppercase', fontWeight:700, marginBottom:6 }}>{m.label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize: isMobile ? 14 : 18, fontWeight:300, lineHeight:1, marginBottom:6 }}>{m.value}</div>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:4 }}>
                      <div style={{ display:'inline-flex', alignItems:'center', gap:2, padding:'1px 5px', borderRadius:3, fontSize:9.5, fontWeight:700, fontFamily:'var(--fm)', color:m.up?'#0dcb7d':'#f54060', background:m.up?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)' }}>
                        {m.up?'▲':'▼'} {m.chgStr}
                      </div>
                      {m.history && !isMobile && <SparkLine data={m.history} up={m.up}/>}
                    </div>
                  </>
              }
            </div>
          </Link>
        ))}
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 272px', gap:20, alignItems:'start' }}>

        {/* Left — modules */}
        <div>
          {/* Module filter tabs */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {tags.map(t => (
                <button key={t} onClick={() => setTagFilter(t)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${tagFilter === t ? (TAG_COLORS[t] || 'var(--accent2)') + '44' : 'var(--b1)'}`, background:tagFilter === t ? (TAG_COLORS[t] || 'var(--accent2)') + '18' : 'transparent', color:tagFilter === t ? (TAG_COLORS[t] || 'var(--accent2)') : 'var(--text3)', fontSize:11, fontWeight:tagFilter === t ? 700 : 400, cursor:'pointer', transition:'all 0.14s', whiteSpace:'nowrap' }}>
                  {t}
                </button>
              ))}
            </div>
            <span style={{ fontSize:11, color:'var(--text4)' }}>{filtered.length} modules</span>
          </div>

          {/* Module grid */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10 }}>
            {filtered.map(m => <ModuleCard key={m.href} {...m}/>)}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Watchlist */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Watchlist</div>
              <Badge variant="green" dot>Live</Badge>
            </div>
            {loading
              ? [...Array(7)].map((_,i) => <div key={i} style={{ height:38, marginBottom:4, borderRadius:6 }} className="skeleton"/>)
              : watchlist.length === 0
              ? <div style={{ fontSize:12, color:'var(--text3)', padding:'8px 0' }}>Backend offline — no data</div>
              : watchlist.map((w, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 0', borderBottom: i < watchlist.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:12.5, fontWeight:600 }}>{w.ticker}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {w.history && <SparkLine data={w.history||[]} up={w.up}/>}
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:12.5 }}>${w.price >= 1000 ? w.price.toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2}) : w.price?.toFixed(2)}</div>
                      <div style={{ fontSize:10, color:w.up?'#0dcb7d':'#f54060', marginTop:1 }}>{w.up?'▲':'▼'} {w.chgStr}</div>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>

          {/* Quick access */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Quick Access</div>
            {[
              { href:'/portfolio',  label:'Portfolio Analytics', sub:'Enter holdings → live analysis',  color:'#2d7ff9' },
              { href:'/market',     label:'Market Overview',     sub:'Live cross-asset snapshot',        color:'#0dcb7d' },
              { href:'/screener',   label:'Stock Screener',      sub:'RSI · Momentum signals',           color:'#5ba3f5' },
              { href:'/sentiment',  label:'Sentiment Alpha',     sub:'AI SEC filing analysis',           color:'#7c5cfc' },
              { href:'/reports',    label:'Report Generator',    sub:'Generate & export PDF',            color:'#f0a500' },
            ].map(({ href, label, sub, color }) => (
              <Link key={href} href={href} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'9px 10px', borderRadius:8, marginBottom:4, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)', transition:'all 0.14s', textDecoration:'none' }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background=`${color}10`; el.style.borderColor=`${color}33` }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background='rgba(255,255,255,0.02)'; el.style.borderColor='rgba(255,255,255,0.04)' }}
              >
                <div>
                  <div style={{ fontSize:12.5, fontWeight:500 }}>{label}</div>
                  <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:1 }}>{sub}</div>
                </div>
                <ArrowRight size={12} color="var(--text4)"/>
              </Link>
            ))}
          </div>

          {/* Market pulse */}
          {!loading && market.length > 0 && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Market Pulse</div>
                <Link href="/macro" style={{ fontSize:10.5, color:'var(--accent2)', textDecoration:'none', display:'flex', alignItems:'center', gap:3 }}>View all <ChevronRight size={10}/></Link>
              </div>
              {market.slice(0, 5).map((m, i) => (
                <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'7px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <span style={{ fontSize:11.5, color:'var(--text2)' }}>{m.label}</span>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontFamily:'var(--fm)', fontSize:12 }}>{m.value}</span>
                    <span style={{ fontSize:10.5, fontFamily:'var(--fm)', color:m.up?'#0dcb7d':'#f54060', minWidth:52, textAlign:'right' }}>{m.up?'▲':'▼'} {m.chgStr}</span>
                  </div>
                </div>
              ))}
              <div style={{ fontSize:10, color:'var(--text4)', marginTop:10, display:'flex', alignItems:'center', gap:4 }}>
                <RefreshCw size={8}/> {lastUpdate}
              </div>
            </div>
          )}

          {/* Platform stats */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Platform</div>
            {[
              { label:'Analytical Modules', value:'16', color:'var(--accent2)' },
              { label:'Data Provider',      value:'yfinance', color:'var(--text)' },
              { label:'AI Model',           value:'Llama 3.3 70B', color:'#7c5cfc' },
              { label:'Backend',            value:'FastAPI + Python', color:'#0dcb7d' },
              { label:'Auth & Storage',     value:'Supabase', color:'#5ba3f5' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ fontSize:11.5, color:'var(--text3)' }}>{label}</span>
                <span style={{ fontSize:11.5, color, fontWeight:500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}