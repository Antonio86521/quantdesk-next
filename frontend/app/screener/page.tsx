'use client'
import { useState, useEffect, useMemo } from 'react'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import { Search, RefreshCw, ChevronUp, ChevronDown, Filter, TrendingUp, TrendingDown, Minus, Activity, BarChart3, ChevronRight } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Stock = {
  ticker: string; price: number; periodReturn: number; annVol: number
  rsi14: number|null; sma20: number|null; sma50: number|null; signals: string[]
}
type SortState = { key: string; dir: 1 | -1 }

// ── Watchlists ────────────────────────────────────────────────────────────────
const WATCHLISTS: Record<string, { label: string; tickers: string }> = {
  'mega_cap':   { label:'Mega Cap Tech',   tickers:'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,NFLX,AMD,INTC' },
  'sp500_top':  { label:'S&P 500 Leaders', tickers:'AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,JNJ,XOM,WMT,UNH,MA,HD' },
  'financials': { label:'Financials',      tickers:'JPM,BAC,GS,MS,WFC,C,BLK,AXP,V,MA,SCHW,USB' },
  'healthcare': { label:'Healthcare',      tickers:'JNJ,UNH,PFE,ABBV,MRK,LLY,BMY,AMGN,GILD,CVS' },
  'energy':     { label:'Energy',          tickers:'XOM,CVX,COP,EOG,SLB,PXD,MPC,VLO,OXY,HAL' },
  'crypto':     { label:'Crypto',          tickers:'BTC-USD,ETH-USD,BNB-USD,SOL-USD,ADA-USD,MATIC-USD' },
  'etfs':       { label:'Major ETFs',      tickers:'SPY,QQQ,DIA,IWM,GLD,SLV,TLT,HYG,VNQ,XLF' },
  'custom':     { label:'Custom',          tickers:'' },
}

// ── Filter presets ────────────────────────────────────────────────────────────
const SIGNAL_PRESETS = [
  { label:'All',         filter: () => true },
  { label:'Oversold',    filter: (s: Stock) => s.rsi14 !== null && s.rsi14 < 30 },
  { label:'Overbought',  filter: (s: Stock) => s.rsi14 !== null && s.rsi14 > 70 },
  { label:'Bullish',     filter: (s: Stock) => (s.signals||[]).includes('Above SMA20') && (s.signals||[]).includes('Above SMA50') },
  { label:'Bearish',     filter: (s: Stock) => s.price < (s.sma20||Infinity) && s.price < (s.sma50||Infinity) },
  { label:'Momentum',    filter: (s: Stock) => s.periodReturn > 5 },
  { label:'High Vol',    filter: (s: Stock) => s.annVol > 40 },
  { label:'Low Vol',     filter: (s: Stock) => s.annVol < 20 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function rsiColor(v: number|null) {
  if (v == null) return 'var(--text3)'
  if (v > 70) return '#f54060'
  if (v > 60) return '#f0a500'
  if (v < 30) return '#0dcb7d'
  if (v < 40) return '#5ba3f5'
  return 'var(--text)'
}

function rsiLabel(v: number|null) {
  if (v == null) return '—'
  if (v > 70) return 'Overbought'
  if (v > 60) return 'Elevated'
  if (v < 30) return 'Oversold'
  if (v < 40) return 'Oversold zone'
  return 'Neutral'
}

function rsiBar(v: number|null) {
  if (v == null) return null
  const pct = Math.min(100, Math.max(0, v))
  const color = v > 70 ? '#f54060' : v < 30 ? '#0dcb7d' : '#2d7ff9'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:48, height:4, background:'var(--bg4)', borderRadius:2, position:'relative', overflow:'hidden', flexShrink:0 }}>
        <div style={{ position:'absolute', left:`${Math.min(30/100*100, pct)}%`, width:2, height:4, background:'rgba(255,255,255,0.15)' }}/>
        <div style={{ position:'absolute', left:`${70}%`, width:2, height:4, background:'rgba(255,255,255,0.15)' }}/>
        <div style={{ height:4, width:`${pct}%`, background:color, borderRadius:2 }}/>
      </div>
      <span style={{ fontFamily:'var(--fm)', fontSize:11, color, fontWeight:600 }}>{v.toFixed(1)}</span>
    </div>
  )
}

function MiniSparkline({ value, size = 40 }: { value: number; size?: number }) {
  // Synthesise a mini sparkline shape from return value
  const up = value >= 0
  const pts = up
    ? `0,${size*0.7} ${size*0.3},${size*0.5} ${size*0.6},${size*0.3} ${size},${size*0.1}`
    : `0,${size*0.3} ${size*0.3},${size*0.5} ${size*0.6},${size*0.7} ${size},${size*0.9}`
  return (
    <svg width={size} height={size*0.6} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={up?'#0dcb7d':'#f54060'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={0.8}/>
    </svg>
  )
}

function SortIcon({ active, dir }: { active: boolean; dir: 1|-1 }) {
  if (!active) return <ChevronUp size={11} color="var(--text4)" style={{ opacity:0.4 }}/>
  return dir === -1 ? <ChevronDown size={11} color="var(--accent2)"/> : <ChevronUp size={11} color="var(--accent2)"/>
}

function SignalBadges({ signals, rsi, price, sma20, sma50 }: { signals:string[]; rsi:number|null; price:number; sma20:number|null; sma50:number|null }) {
  const badges = []
  if (rsi !== null && rsi < 30) badges.push({ label:'Oversold', color:'#0dcb7d', bg:'rgba(13,203,125,0.12)' })
  if (rsi !== null && rsi > 70) badges.push({ label:'Overbought', color:'#f54060', bg:'rgba(245,64,96,0.12)' })
  if (sma20 && price > sma20 && sma50 && price > sma50) badges.push({ label:'Uptrend', color:'#2d7ff9', bg:'rgba(45,127,249,0.12)' })
  if (sma20 && price < sma20 && sma50 && price < sma50) badges.push({ label:'Downtrend', color:'#f54060', bg:'rgba(245,64,96,0.1)' })
  if (sma20 && price > sma20 && sma50 && price < sma50) badges.push({ label:'Mixed', color:'#f0a500', bg:'rgba(240,165,0,0.1)' })
  if (!badges.length) badges.push({ label:'Neutral', color:'var(--text3)', bg:'var(--bg4)' })
  return (
    <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
      {badges.slice(0,2).map(({ label, color, bg }) => (
        <span key={label} style={{ padding:'2px 7px', borderRadius:4, fontSize:10, fontWeight:700, color, background:bg, whiteSpace:'nowrap' }}>{label}</span>
      ))}
    </div>
  )
}

function StatCard({ label, value, color, sub }: { label:string; value:string; color?:string; sub?:string }) {
  return (
    <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px', border:'1px solid var(--b1)' }}>
      <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontFamily:'var(--fm)', fontSize:20, fontWeight:300, color:color||'var(--text)', lineHeight:1, marginBottom:3 }}>{value}</div>
      {sub && <div style={{ fontSize:10.5, color:'var(--text4)' }}>{sub}</div>}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScreenerPage() {
  const [watchlist,   setWatchlist]   = useState('sp500_top')
  const [customTickers, setCustomTickers] = useState('')
  const [period,      setPeriod]      = useState('3mo')
  const [data,        setData]        = useState<Stock[]>([])
  const [loading,     setLoading]     = useState(false)
  const [sort,        setSort]        = useState<SortState>({ key:'periodReturn', dir:-1 })
  const [signalFilter, setSignalFilter] = useState('All')
  const [search,      setSearch]      = useState('')
  const [viewMode,    setViewMode]    = useState<'table'|'cards'>('table')
  const [selectedStock, setSelectedStock] = useState<Stock|null>(null)
  const [isMobile,    setIsMobile]    = useState(false)
  const [lastRun,     setLastRun]     = useState('')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const activeTickers = watchlist === 'custom' ? customTickers : WATCHLISTS[watchlist]?.tickers

  const run = async () => {
    if (!activeTickers) return
    setLoading(true); setSelectedStock(null)
    try {
      const r = await api.screener(activeTickers, period)
      setData(r.data || [])
      setLastRun(new Date().toLocaleTimeString())
    } catch {}
    finally { setLoading(false) }
  }

  const toggleSort = (key: string) =>
    setSort(s => s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir:-1 })

  // Filter + sort
  const filtered = useMemo(() => {
    const preset = SIGNAL_PRESETS.find(p => p.label === signalFilter)
    return [...data]
      .filter(s => !search || s.ticker.toUpperCase().includes(search.toUpperCase()))
      .filter(s => preset ? preset.filter(s) : true)
      .sort((a,b) => ((a[sort.key as keyof Stock] as number||0) - (b[sort.key as keyof Stock] as number||0)) * sort.dir)
  }, [data, sort, signalFilter, search])

  // Aggregate stats
  const stats = useMemo(() => {
    if (!data.length) return null
    const up      = data.filter(s => s.periodReturn > 0).length
    const down    = data.filter(s => s.periodReturn < 0).length
    const avgRet  = data.reduce((s,d) => s + d.periodReturn, 0) / data.length
    const avgVol  = data.reduce((s,d) => s + d.annVol, 0) / data.length
    const oversold  = data.filter(s => s.rsi14 !== null && s.rsi14 < 30).length
    const overbought = data.filter(s => s.rsi14 !== null && s.rsi14 > 70).length
    const best  = data.reduce((a,b) => b.periodReturn > a.periodReturn ? b : a)
    const worst = data.reduce((a,b) => b.periodReturn < a.periodReturn ? b : a)
    const highestVol  = data.reduce((a,b) => b.annVol > a.annVol ? b : a)
    return { up, down, avgRet, avgVol, oversold, overbought, best, worst, highestVol, total:data.length }
  }, [data])

  // Columns config
  const COLS = [
    { key:'ticker',       label:'Ticker',       sortable:true,  w:90  },
    { key:'price',        label:'Price',        sortable:true,  w:90  },
    { key:'periodReturn', label:'Return %',     sortable:true,  w:100 },
    { key:'annVol',       label:'Ann. Vol',     sortable:true,  w:90  },
    { key:'rsi14',        label:'RSI (14)',      sortable:true,  w:140 },
    { key:'sma_rel',      label:'vs SMA20/50',  sortable:false, w:130 },
    { key:'signal',       label:'Signal',       sortable:false, w:120 },
    { key:'sparkline',    label:'Trend',        sortable:false, w:60  },
  ]

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(45,127,249,0.12)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Search size={16} color="var(--accent2)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Stock Screener</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              RSI · Momentum · SMA crossovers · Volatility · Multi-signal
              {lastRun && <span style={{ marginLeft:8, color:'var(--text4)', display:'inline-flex', alignItems:'center', gap:4 }}><RefreshCw size={9}/> {lastRun}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:6 }}>
          {/* View toggle */}
          <div style={{ display:'flex', gap:2, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:8, padding:2 }}>
            {(['table','cards'] as const).map(v => (
              <button key={v} onClick={()=>setViewMode(v)} style={{ padding:'5px 10px', borderRadius:6, border:'none', cursor:'pointer', background:viewMode===v?'var(--bg5)':'transparent', color:viewMode===v?'var(--text)':'var(--text3)', fontSize:11, transition:'all 0.14s' }}>
                {v === 'table' ? '≡ Table' : '⊞ Cards'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12, marginBottom:12 }}>

          {/* Watchlist selector */}
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Watchlist</div>
            <select className="qd-select" style={{ width:'100%' }} value={watchlist} onChange={e=>setWatchlist(e.target.value)}>
              {Object.entries(WATCHLISTS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>

          {/* Period */}
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Period</div>
            <select className="qd-select" style={{ width:'100%' }} value={period} onChange={e=>setPeriod(e.target.value)}>
              {['1mo','3mo','6mo','1y','2y'].map(o => <option key={o}>{o}</option>)}
            </select>
          </div>

          {/* Run button */}
          <div style={{ display:'flex', alignItems:'flex-end' }}>
            <button onClick={run} disabled={loading} style={{ width:'100%', padding:'9px 20px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:loading?'none':'0 0 20px rgba(45,127,249,0.25)' }}>
              {loading ? <><RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Scanning...</> : <><Search size={13}/> Run Screener</>}
            </button>
          </div>
        </div>

        {/* Custom tickers */}
        {watchlist === 'custom' && (
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Custom Tickers</div>
            <input className="qd-input" placeholder="AAPL,MSFT,NVDA,GOOGL..." value={customTickers} onChange={e=>setCustomTickers(e.target.value)}/>
          </div>
        )}

        {/* Ticker preview */}
        {watchlist !== 'custom' && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {WATCHLISTS[watchlist]?.tickers.split(',').map(t => (
              <span key={t} style={{ padding:'2px 8px', borderRadius:5, background:'var(--bg3)', border:'1px solid var(--b1)', fontSize:10.5, fontFamily:'var(--fm)', color:'var(--text2)' }}>{t.trim()}</span>
            ))}
          </div>
        )}
      </div>

      {/* Empty state */}
      {!data.length && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:52, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16, opacity:0.3 }}>🔍</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700, marginBottom:8 }}>Screener Ready</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:440, margin:'0 auto 24px', lineHeight:1.7 }}>Select a watchlist and click Run Screener to scan for RSI signals, momentum, SMA crossovers and volatility data across multiple securities.</div>
          <button onClick={run} style={{ padding:'10px 28px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Scan {WATCHLISTS[watchlist]?.label}
          </button>
        </div>
      )}

      {/* Results */}
      {data.length > 0 && (
        <>
          {/* Market summary strip */}
          {stats && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr) repeat(2,1fr)', gap:10, marginBottom:16 }}>
              <StatCard label="Total Screened" value={String(stats.total)} sub={`${period} period`}/>
              <StatCard label="Advancing" value={String(stats.up)} color="#0dcb7d" sub={`${((stats.up/stats.total)*100).toFixed(0)}% of universe`}/>
              <StatCard label="Declining" value={String(stats.down)} color="#f54060" sub={`${((stats.down/stats.total)*100).toFixed(0)}% of universe`}/>
              <StatCard label="Avg Return" value={`${stats.avgRet>=0?'+':''}${stats.avgRet.toFixed(2)}%`} color={stats.avgRet>=0?'#0dcb7d':'#f54060'} sub="Universe average"/>
              <StatCard label="Best Performer" value={`+${stats.best.periodReturn.toFixed(2)}%`} color="#0dcb7d" sub={stats.best.ticker}/>
              <StatCard label="Worst Performer" value={`${stats.worst.periodReturn.toFixed(2)}%`} color="#f54060" sub={stats.worst.ticker}/>
            </div>
          )}

          {/* RSI heatmap strip */}
          {stats && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>RSI Landscape</div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[...data].sort((a,b) => (a.rsi14||50) - (b.rsi14||50)).map(s => {
                  const rsi   = s.rsi14 || 50
                  const color = rsi > 70 ? '#f54060' : rsi < 30 ? '#0dcb7d' : rsi > 60 ? '#f0a500' : rsi < 40 ? '#5ba3f5' : 'var(--text3)'
                  const bg    = rsi > 70 ? 'rgba(245,64,96,0.1)' : rsi < 30 ? 'rgba(13,203,125,0.1)' : 'var(--bg3)'
                  return (
                    <div key={s.ticker} onClick={()=>setSelectedStock(s)} style={{ padding:'4px 10px', borderRadius:6, background:bg, border:`1px solid ${color}33`, cursor:'pointer', transition:'all 0.14s' }}>
                      <div style={{ fontSize:10, fontFamily:'var(--fm)', fontWeight:700, color }}>{s.ticker}</div>
                      <div style={{ fontSize:9, color, fontFamily:'var(--fm)' }}>{rsi.toFixed(0)}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ display:'flex', gap:16, marginTop:10 }}>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:8,height:8,borderRadius:2,background:'#0dcb7d' }}/><span style={{ fontSize:10.5, color:'var(--text3)' }}>Oversold (&lt;30) — {stats.oversold}</span></div>
                <div style={{ display:'flex', alignItems:'center', gap:5 }}><div style={{ width:8,height:8,borderRadius:2,background:'#f54060' }}/><span style={{ fontSize:10.5, color:'var(--text3)' }}>Overbought (&gt;70) — {stats.overbought}</span></div>
              </div>
            </div>
          )}

          {/* Filters + search */}
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flexShrink:0 }}>
              <Search size={12} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text4)' }}/>
              <input className="qd-input" placeholder="Filter ticker..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:30, width:140 }}/>
            </div>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
              {SIGNAL_PRESETS.map(p => (
                <button key={p.label} onClick={()=>setSignalFilter(p.label)} style={{ padding:'5px 12px', borderRadius:20, border:`1px solid ${signalFilter===p.label?'rgba(45,127,249,0.3)':'var(--b1)'}`, background:signalFilter===p.label?'rgba(45,127,249,0.1)':'transparent', color:signalFilter===p.label?'var(--accent2)':'var(--text3)', fontSize:11, fontWeight:signalFilter===p.label?600:400, cursor:'pointer', transition:'all 0.12s', whiteSpace:'nowrap' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <div style={{ marginLeft:'auto', fontSize:11, color:'var(--text4)' }}>{filtered.length} of {data.length} shown</div>
          </div>

          {/* Selected stock detail panel */}
          {selectedStock && (
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, padding:'16px 20px', marginBottom:16, position:'relative', overflow:'hidden' }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#2d7ff9,#7c5cfc)' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:44, height:44, borderRadius:10, background:'rgba(45,127,249,0.12)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--fm)', fontWeight:700, fontSize:13, color:'var(--accent2)' }}>{selectedStock.ticker.slice(0,3)}</div>
                  <div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:700 }}>{selectedStock.ticker}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{period} scan · {lastRun}</div>
                  </div>
                </div>
                <button onClick={()=>setSelectedStock(null)} style={{ background:'transparent', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:16 }}>✕</button>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(6,1fr)', gap:10, marginTop:14 }}>
                {[
                  { label:'Price',      value:`$${selectedStock.price?.toFixed(2)}`, color:'var(--text)' },
                  { label:'Return',     value:`${selectedStock.periodReturn>=0?'+':''}${selectedStock.periodReturn?.toFixed(2)}%`, color:selectedStock.periodReturn>=0?'#0dcb7d':'#f54060' },
                  { label:'Ann. Vol',   value:`${selectedStock.annVol?.toFixed(1)}%`, color:selectedStock.annVol>35?'#f54060':selectedStock.annVol>20?'#f0a500':'#0dcb7d' },
                  { label:'RSI (14)',   value:selectedStock.rsi14?.toFixed(1)||'—', color:rsiColor(selectedStock.rsi14) },
                  { label:'SMA 20',     value:selectedStock.sma20?`$${selectedStock.sma20?.toFixed(2)}`:'—', color:selectedStock.price>=(selectedStock.sma20||0)?'#0dcb7d':'#f54060' },
                  { label:'SMA 50',     value:selectedStock.sma50?`$${selectedStock.sma50?.toFixed(2)}`:'—', color:selectedStock.price>=(selectedStock.sma50||0)?'#0dcb7d':'#f54060' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg3)', borderRadius:9, padding:'10px 12px' }}>
                    <div style={{ fontSize:9.5, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:600, color }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Technical analysis summary */}
              <div style={{ marginTop:12, padding:'12px 14px', background:'var(--bg3)', borderRadius:9, fontSize:12.5, color:'var(--text2)', lineHeight:1.7 }}>
                <strong style={{ color:'var(--text)' }}>{selectedStock.ticker} Analysis:</strong>{' '}
                {selectedStock.rsi14 !== null && selectedStock.rsi14 < 30
                  ? `RSI at ${selectedStock.rsi14?.toFixed(1)} signals oversold conditions — potential mean reversion candidate.`
                  : selectedStock.rsi14 !== null && selectedStock.rsi14 > 70
                  ? `RSI at ${selectedStock.rsi14?.toFixed(1)} signals overbought — momentum may be extended, consider risk management.`
                  : `RSI at ${selectedStock.rsi14?.toFixed(1)} is neutral — no extreme reading.`}
                {selectedStock.sma20 && selectedStock.sma50 && ` Price is ${selectedStock.price > selectedStock.sma20 ? 'above' : 'below'} the 20-day SMA and ${selectedStock.price > selectedStock.sma50 ? 'above' : 'below'} the 50-day SMA.`}
                {selectedStock.periodReturn > 10 ? ' Strong positive momentum over the period.' : selectedStock.periodReturn < -10 ? ' Significant underperformance over the period.' : ''}
              </div>
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {viewMode === 'table' && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
              <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', minWidth:isMobile?700:900 }}>
                  <thead>
                    <tr style={{ background:'var(--bg3)', borderBottom:'1px solid var(--b1)' }}>
                      {COLS.map(col => (
                        <th key={col.key} onClick={()=>col.sortable&&toggleSort(col.key)}
                          style={{ padding:'10px 14px', textAlign:'left', fontSize:9.5, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', cursor:col.sortable?'pointer':'default', userSelect:'none', whiteSpace:'nowrap', minWidth:col.w }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                            {col.label}
                            {col.sortable && <SortIcon active={sort.key===col.key} dir={sort.dir}/>}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => {
                      const isSelected = selectedStock?.ticker === r.ticker
                      return (
                        <tr key={i} onClick={()=>setSelectedStock(isSelected?null:r)}
                          style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', background: isSelected?'rgba(45,127,249,0.06)':i%2===0?'transparent':'rgba(255,255,255,0.01)', transition:'background 0.12s' }}
                          onMouseEnter={e=>{if(!isSelected)(e.currentTarget as HTMLElement).style.background='rgba(255,255,255,0.04)'}}
                          onMouseLeave={e=>{if(!isSelected)(e.currentTarget as HTMLElement).style.background=i%2===0?'transparent':'rgba(255,255,255,0.01)'}}
                        >
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ fontFamily:'var(--fm)', fontWeight:700, fontSize:13, color:isSelected?'var(--accent2)':'var(--text)' }}>{r.ticker}</div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ fontFamily:'var(--fm)', fontSize:13 }}>${r.price?.toFixed(2)}</span>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              {r.periodReturn >= 0 ? <TrendingUp size={11} color="#0dcb7d"/> : <TrendingDown size={11} color="#f54060"/>}
                              <span style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color:r.periodReturn>=0?'#0dcb7d':'#f54060' }}>
                                {r.periodReturn>=0?'+':''}{r.periodReturn?.toFixed(2)}%
                              </span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <div style={{ width:36, height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                                <div style={{ height:4, width:`${Math.min(100, r.annVol*2)}%`, background:r.annVol>35?'#f54060':r.annVol>20?'#f0a500':'#0dcb7d', borderRadius:2 }}/>
                              </div>
                              <span style={{ fontFamily:'var(--fm)', fontSize:12, color:r.annVol>35?'#f54060':r.annVol>20?'#f0a500':'#0dcb7d' }}>{r.annVol?.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            {rsiBar(r.rsi14)}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ fontSize:11, lineHeight:1.6 }}>
                              <div style={{ color:r.price>=(r.sma20||0)?'#0dcb7d':'#f54060', fontFamily:'var(--fm)', fontSize:10.5 }}>
                                SMA20: ${r.sma20?.toFixed(2)||'—'} {r.price>=(r.sma20||0)?'▲':'▼'}
                              </div>
                              <div style={{ color:r.price>=(r.sma50||0)?'#0dcb7d':'#f54060', fontFamily:'var(--fm)', fontSize:10.5 }}>
                                SMA50: ${r.sma50?.toFixed(2)||'—'} {r.price>=(r.sma50||0)?'▲':'▼'}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <SignalBadges signals={r.signals||[]} rsi={r.rsi14} price={r.price} sma20={r.sma20} sma50={r.sma50}/>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <MiniSparkline value={r.periodReturn}/>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CARDS VIEW ── */}
          {viewMode === 'cards' && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12 }}>
              {filtered.map((r, i) => {
                const up = r.periodReturn >= 0
                const isSelected = selectedStock?.ticker === r.ticker
                return (
                  <div key={i} onClick={()=>setSelectedStock(isSelected?null:r)}
                    style={{ background:'var(--bg2)', border:`1px solid ${isSelected?'rgba(45,127,249,0.3)':'var(--b1)'}`, borderRadius:14, padding:'16px 18px', cursor:'pointer', transition:'all 0.15s', position:'relative', overflow:'hidden' }}
                    onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(-2px)';(e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(0,0,0,0.4)'}}
                    onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.transform='translateY(0)';(e.currentTarget as HTMLElement).style.boxShadow='none'}}
                  >
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:up?'linear-gradient(90deg,#0dcb7d,transparent)':'linear-gradient(90deg,#f54060,transparent)' }}/>

                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                      <div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:700, marginBottom:2 }}>{r.ticker}</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:20, fontWeight:300 }}>${r.price?.toFixed(2)}</div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:600, color:up?'#0dcb7d':'#f54060' }}>
                          {up?'+':''}{r.periodReturn?.toFixed(2)}%
                        </div>
                        <div style={{ fontSize:10, color:'var(--text4)', marginTop:3 }}>{period} return</div>
                      </div>
                    </div>

                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
                      <div style={{ background:'var(--bg3)', borderRadius:7, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>RSI 14</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color:rsiColor(r.rsi14) }}>{r.rsi14?.toFixed(1)||'—'}</div>
                        <div style={{ fontSize:9.5, color:rsiColor(r.rsi14), marginTop:2 }}>{rsiLabel(r.rsi14)}</div>
                      </div>
                      <div style={{ background:'var(--bg3)', borderRadius:7, padding:'8px 10px' }}>
                        <div style={{ fontSize:9, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Ann. Vol</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color:r.annVol>35?'#f54060':r.annVol>20?'#f0a500':'#0dcb7d' }}>{r.annVol?.toFixed(1)}%</div>
                        <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:2 }}>{r.annVol>35?'High vol':r.annVol>20?'Moderate':'Low vol'}</div>
                      </div>
                    </div>

                    <div style={{ display:'flex', gap:5, marginBottom:10 }}>
                      <div style={{ flex:1, background:'var(--bg3)', borderRadius:6, padding:'6px 8px', fontSize:10 }}>
                        <div style={{ color:'var(--text4)', marginBottom:2 }}>SMA20</div>
                        <div style={{ fontFamily:'var(--fm)', color:r.price>=(r.sma20||0)?'#0dcb7d':'#f54060', fontWeight:600 }}>
                          {r.price>=(r.sma20||0)?'▲':'▼'} ${r.sma20?.toFixed(2)||'—'}
                        </div>
                      </div>
                      <div style={{ flex:1, background:'var(--bg3)', borderRadius:6, padding:'6px 8px', fontSize:10 }}>
                        <div style={{ color:'var(--text4)', marginBottom:2 }}>SMA50</div>
                        <div style={{ fontFamily:'var(--fm)', color:r.price>=(r.sma50||0)?'#0dcb7d':'#f54060', fontWeight:600 }}>
                          {r.price>=(r.sma50||0)?'▲':'▼'} ${r.sma50?.toFixed(2)||'—'}
                        </div>
                      </div>
                    </div>

                    <SignalBadges signals={r.signals||[]} rsi={r.rsi14} price={r.price} sma20={r.sma20} sma50={r.sma50}/>
                  </div>
                )
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ marginTop:16, display:'flex', gap:16, flexWrap:'wrap', fontSize:11, color:'var(--text4)' }}>
            <span><span style={{ color:'#0dcb7d' }}>●</span> RSI &lt; 30 = Oversold</span>
            <span><span style={{ color:'#f54060' }}>●</span> RSI &gt; 70 = Overbought</span>
            <span><span style={{ color:'#f0a500' }}>●</span> RSI 60–70 = Elevated</span>
            <span><span style={{ color:'#0dcb7d' }}>▲</span> Price above SMA</span>
            <span><span style={{ color:'#f54060' }}>▼</span> Price below SMA</span>
            <span style={{ marginLeft:'auto' }}>Click any row/card for detail panel</span>
          </div>
        </>
      )}
    </div>
  )
}
