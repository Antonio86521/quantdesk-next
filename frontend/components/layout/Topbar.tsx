'use client'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { tradeDb } from '@/lib/db'
import { useRouter } from 'next/navigation'
import { Download, Plus, Search, Bell, X, TrendingUp, ArrowRight, Check } from 'lucide-react'

// ── Ticker tape data (live-ish — updated by API on dashboard) ────────────────
const TICKERS = [
  { sym:'SPX',     val:'5,842.3', chg:'+0.41%', up:true  },
  { sym:'NDX',     val:'20,312',  chg:'+0.67%', up:true  },
  { sym:'DJIA',    val:'43,218',  chg:'-0.12%', up:false },
  { sym:'VIX',     val:'18.4',    chg:'-0.8',   up:false },
  { sym:'BTC/USD', val:'78,925',  chg:'+3.37%', up:true  },
  { sym:'DXY',     val:'98.59',   chg:'+0.18%', up:true  },
  { sym:'UST 10Y', val:'4.29%',   chg:'+5bp',   up:true  },
  { sym:'XAU/USD', val:'3,287',   chg:'+0.88%', up:true  },
  { sym:'WTI',     val:'62.84',   chg:'-0.43%', up:false },
  { sym:'EUR/USD', val:'1.1342',  chg:'+0.38%', up:true  },
  { sym:'GBP/USD', val:'1.3218',  chg:'+0.21%', up:true  },
  { sym:'ETH/USD', val:'1,642',   chg:'+0.34%', up:true  },
]

const QUICK_LINKS = [
  { label:'Portfolio Analytics', href:'/portfolio',   hint:'Performance · Attribution' },
  { label:'Stock Screener',      href:'/screener',    hint:'RSI · Momentum signals'    },
  { label:'Risk & Attribution',  href:'/risk',        hint:'VaR · CVaR · Drawdown'    },
  { label:'Monte Carlo Lab',     href:'/montecarlo',  hint:'10K path simulation'       },
  { label:'Macro Dashboard',     href:'/macro',       hint:'Rates · FX · Commodities'  },
  { label:'Derivatives Pricer',  href:'/derivatives', hint:'Black-Scholes · Greeks'    },
  { label:'Vol Surface',         href:'/vol-surface', hint:'IV smile · Term structure'  },
  { label:'Market Overview',     href:'/market',      hint:'Live cross-asset heatmap'  },
  { label:'Factor Exposure',     href:'/factor',      hint:'Fama-French regression'    },
  { label:'Trade Journal',       href:'/journal',     hint:'Log & analyse trades'      },
  { label:'Portfolio Manager',   href:'/manager',     hint:'Create & manage portfolios'},
  { label:'Reports',             href:'/reports',     hint:'Generate PDF reports'      },
]

const NOTIFICATIONS = [
  { id:1, type:'alert',   title:'AAPL crossed $275',    body:'Price alert triggered at $275.00',    time:'2m ago',  read:false },
  { id:2, type:'info',    title:'Market opened',        body:'NYSE opened — VIX at 18.4',           time:'45m ago', read:false },
  { id:3, type:'success', title:'Portfolio analysed',   body:'Core Growth portfolio updated',       time:'2h ago',  read:true  },
  { id:4, type:'alert',   title:'NVDA crossed $285',    body:'Price alert triggered at $285.00',    time:'3h ago',  read:true  },
  { id:5, type:'info',    title:'Fed minutes released', body:'FOMC minutes available — rates held', time:'1d ago',  read:true  },
]

const ASSET_TYPES = ['Stock', 'ETF', 'Crypto', 'Options', 'Forex']

export default function Topbar() {
  const router = useRouter()
  const { user } = useAuth()
  const [time, setTime]           = useState('')
  const [marketOpen, setMarketOpen] = useState(false)

  // Search
  const [showSearch, setShowSearch] = useState(false)
  const [query, setQuery]           = useState('')
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  // Notifications
  const [showNotifs, setShowNotifs] = useState(false)
  const [notifs, setNotifs]         = useState(NOTIFICATIONS)
  const notifRef = useRef<HTMLDivElement>(null)
  const unread   = notifs.filter(n => !n.read).length

  // New Trade
  const [showTrade, setShowTrade] = useState(false)
  const [trade, setTrade]         = useState({ ticker:'', side:'BUY' as 'BUY'|'SELL', qty:'', price:'', type:'Stock', notes:'' })
  const [tradeSaved, setTradeSaved] = useState(false)

  // Export
  const [showExport, setShowExport] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  // Clock
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      const h = String(d.getHours()).padStart(2,'0')
      const m = String(d.getMinutes()).padStart(2,'0')
      const s = String(d.getSeconds()).padStart(2,'0')
      setTime(`${h}:${m}:${s} EST`)
      const day = d.getDay(), mins = d.getHours()*60+d.getMinutes()
      setMarketOpen(day>=1 && day<=5 && mins>=570 && mins<960)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSearch(false)
      if (notifRef.current  && !notifRef.current.contains(e.target  as Node)) setShowNotifs(false)
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setShowExport(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (showSearch) setTimeout(() => inputRef.current?.focus(), 50)
  }, [showSearch])

  // Keyboard shortcut for search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setShowSearch(true) }
      if (e.key === 'Escape') { setShowSearch(false); setShowNotifs(false); setShowExport(false) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const filtered = query.trim()
    ? QUICK_LINKS.filter(l => l.label.toLowerCase().includes(query.toLowerCase()) || l.hint.toLowerCase().includes(query.toLowerCase()))
    : QUICK_LINKS

  const markAllRead = () => setNotifs(ns => ns.map(n => ({ ...n, read:true })))

  const submitTrade = async () => {
    if (!trade.ticker || !trade.qty || !trade.price) return
    // Save to Supabase if logged in, localStorage as fallback
    if (user) {
      await tradeDb.create(user.id, {
        ticker: trade.ticker.toUpperCase(),
        side: trade.side,
        qty: +trade.qty,
        price: +trade.price,
        type: trade.type,
        notes: trade.notes,
        date: new Date().toISOString().slice(0,10),
      })
    } else {
      const existing = JSON.parse(localStorage.getItem('qd_trades') || '[]')
      existing.unshift({ id:Date.now(), date:new Date().toISOString().slice(0,10), ticker:trade.ticker.toUpperCase(), side:trade.side, qty:+trade.qty, price:+trade.price, type:trade.type, notes:trade.notes })
      localStorage.setItem('qd_trades', JSON.stringify(existing))
    }
    setTradeSaved(true)
    setTimeout(() => {
      setTradeSaved(false)
      setShowTrade(false)
      setTrade({ ticker:'', side:'BUY', qty:'', price:'', type:'Stock', notes:'' })
    }, 1200)
  }

  const exportCSV = () => {
    const trades = JSON.parse(localStorage.getItem('qd_trades') || '[]')
    if (!trades.length) { alert('No trades logged yet. Use New Trade to log some first.'); return }
    const header = 'Date,Ticker,Side,Qty,Price,Type,Notes'
    const rows   = trades.map((t:any) => `${t.date},${t.ticker},${t.side},${t.qty},${t.price},${t.type},"${t.notes}"`)
    const csv    = [header, ...rows].join('\n')
    const blob   = new Blob([csv], { type:'text/csv' })
    const url    = URL.createObjectURL(blob)
    const a      = document.createElement('a')
    a.href       = url
    a.download   = `quantdesk-trades-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const exportWatchlist = () => {
    const data = [['Ticker','Category'],['AAPL','Equity'],['MSFT','Equity'],['NVDA','Equity'],['GOOGL','Equity'],['AMZN','Equity'],['META','Equity'],['TSLA','Equity'],['SPY','ETF']]
    const csv  = data.map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type:'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `quantdesk-watchlist-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    setShowExport(false)
  }

  const tape = [...TICKERS, ...TICKERS]

  const iconBtn = (onClick: () => void, children: React.ReactNode, badge?: number, active?: boolean) => (
    <button onClick={onClick} style={{
      position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
      width:34, height:34, borderRadius:8,
      background: active ? 'rgba(45,127,249,0.12)' : 'transparent',
      border:`1px solid ${active ? 'rgba(45,127,249,0.25)' : 'var(--b1)'}`,
      color: active ? 'var(--accent2)' : 'var(--text2)',
      cursor:'pointer', transition:'all 0.14s', flexShrink:0,
    }}
    onMouseEnter={e => {
      if (!active) {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'var(--bg3)'
        el.style.color = 'var(--text)'
        el.style.borderColor = 'var(--b2)'
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        const el = e.currentTarget as HTMLElement
        el.style.background = 'transparent'
        el.style.color = 'var(--text2)'
        el.style.borderColor = 'var(--b1)'
      }
    }}
    >
      {children}
      {badge != null && badge > 0 && (
        <span style={{ position:'absolute', top:4, right:4, width:7, height:7, borderRadius:'50%', background:'var(--red)', border:'1.5px solid var(--bg2)' }} />
      )}
    </button>
  )

  return (
    <>
      {/* ── Topbar ──────────────────────────────────────────────── */}
      <header style={{
        height:50, background:'rgba(11,15,23,0.97)',
        backdropFilter:'blur(20px)',
        borderBottom:'1px solid var(--b1)',
        display:'flex', alignItems:'center',
        gap:0, flexShrink:0,
        position:'sticky', top:0, zIndex:50,
      }}>

        {/* Ticker tape */}
        <div style={{
          flex:1, overflow:'hidden', minWidth:0,
          borderRight:'1px solid var(--b1)',
          height:'100%', display:'flex', alignItems:'center',
          padding:'0 16px',
          maskImage:'linear-gradient(90deg,transparent,black 5%,black 95%,transparent)',
        }}>
          <div style={{
            display:'flex', gap:32, whiteSpace:'nowrap',
            fontFamily:'var(--fm)', fontSize:11,
            animation:'ticker 40s linear infinite',
          }}>
            <style>{`@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
            {tape.map((t,i) => (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
                <span style={{ color:'var(--text3)', fontSize:10 }}>{t.sym}</span>
                <span style={{ color:'var(--text)', fontWeight:500 }}>{t.val}</span>
                <span style={{ color:t.up?'var(--green)':'var(--red)', fontSize:10 }}>
                  {t.up?'▲':'▼'} {t.chg}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Right controls */}
        <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 16px', flexShrink:0 }}>

          {/* Market status */}
          <div style={{
            display:'flex', alignItems:'center', gap:5,
            fontSize:10, fontWeight:600, letterSpacing:'0.5px',
            color: marketOpen ? 'var(--green)' : 'var(--text3)',
            background: marketOpen ? 'rgba(13,203,125,0.08)' : 'rgba(255,255,255,0.03)',
            border:`1px solid ${marketOpen ? 'rgba(13,203,125,0.15)' : 'var(--b1)'}`,
            padding:'4px 9px', borderRadius:20, marginRight:4,
          }}>
            <span style={{ width:5, height:5, borderRadius:'50%', background: marketOpen?'var(--green)':'var(--text3)', display:'inline-block', ...(marketOpen?{animation:'pulse 2s ease-in-out infinite'}:{}) }} />
            {marketOpen ? 'Market Open' : 'Market Closed'}
          </div>

          {/* Clock */}
          <div style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text3)', whiteSpace:'nowrap', padding:'0 10px', borderRight:'1px solid var(--b1)', letterSpacing:'0.3px' }}>
            {time}
          </div>

          {/* Search */}
          <div ref={searchRef} style={{ position:'relative' }}>
            {iconBtn(() => setShowSearch(x => !x), <Search size={13} strokeWidth={1.5}/>, undefined, showSearch)}
          </div>

          {/* Notifications */}
          <div ref={notifRef} style={{ position:'relative' }}>
            {iconBtn(() => setShowNotifs(x => !x), <Bell size={13} strokeWidth={1.5}/>, unread, showNotifs)}
          </div>

          {/* Export */}
          <div ref={exportRef} style={{ position:'relative' }}>
            <button onClick={() => setShowExport(x => !x)} style={{
              display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:8,
              background: showExport ? 'var(--bg3)' : 'transparent',
              border:`1px solid ${showExport ? 'var(--b2)' : 'var(--b2)'}`,
              color:'var(--text2)', fontSize:12, fontWeight:500, cursor:'pointer', transition:'all 0.14s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background='var(--bg3)'; el.style.color='var(--text)'; el.style.borderColor='var(--b3)' }}
            onMouseLeave={e => { if(!showExport){ const el = e.currentTarget as HTMLElement; el.style.background='transparent'; el.style.color='var(--text2)'; el.style.borderColor='var(--b2)' }}}
            >
              <Download size={12} strokeWidth={1.5} />
              Export
            </button>
          </div>

          {/* New Trade */}
          <button onClick={() => setShowTrade(true)} style={{
            display:'flex', alignItems:'center', gap:6,
            padding:'6px 16px', borderRadius:8,
            background:'linear-gradient(135deg,#2d7ff9,#1a6de0)',
            border:'1px solid rgba(45,127,249,0.4)', color:'#fff',
            fontSize:12, fontWeight:600, cursor:'pointer',
            boxShadow:'0 0 16px rgba(45,127,249,0.25)', transition:'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow='0 0 24px rgba(45,127,249,0.4)'; el.style.transform='translateY(-1px)' }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow='0 0 16px rgba(45,127,249,0.25)'; el.style.transform='translateY(0)' }}
          >
            <Plus size={13} strokeWidth={2} />
            New Trade
          </button>
        </div>
      </header>

      {/* ── Search overlay ─────────────────────────────────────── */}
      {showSearch && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(4px)', display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:80 }}
          onClick={e => { if(e.target === e.currentTarget) setShowSearch(false) }}
        >
          <div style={{ width:'100%', maxWidth:600, background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:16, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
            {/* Input */}
            <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', borderBottom:'1px solid var(--b1)' }}>
              <Search size={16} color="var(--text2)" strokeWidth={1.5} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search pages, modules, tools... (⌘K)"
                style={{ flex:1, background:'transparent', border:'none', outline:'none', fontSize:15, color:'var(--text)', fontFamily:'var(--fb)' }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && filtered.length > 0) {
                    router.push(filtered[0].href)
                    setShowSearch(false)
                    setQuery('')
                  }
                }}
              />
              {query && <button onClick={() => setQuery('')} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={14}/></button>}
              <kbd style={{ fontSize:10, color:'var(--text3)', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:4, padding:'2px 6px' }}>ESC</kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight:400, overflowY:'auto', padding:'6px 8px' }}>
              {!query && <div style={{ fontSize:10.5, color:'var(--text3)', padding:'6px 10px 4px', fontWeight:600, letterSpacing:'0.8px', textTransform:'uppercase' }}>All Modules</div>}
              {filtered.length === 0
                ? <div style={{ padding:'24px', textAlign:'center', color:'var(--text2)', fontSize:13 }}>No results for "{query}"</div>
                : filtered.map(l => (
                    <button key={l.href} onClick={() => { router.push(l.href); setShowSearch(false); setQuery('') }} style={{
                      display:'flex', alignItems:'center', justifyContent:'space-between',
                      width:'100%', padding:'10px 12px', borderRadius:9,
                      background:'transparent', border:'none', cursor:'pointer',
                      transition:'background 0.12s', textAlign:'left',
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize:13.5, fontWeight:500, color:'var(--text)' }}>{l.label}</div>
                        <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>{l.hint}</div>
                      </div>
                      <ArrowRight size={13} color="var(--text3)" />
                    </button>
                  ))
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Notifications panel ────────────────────────────────── */}
      {showNotifs && (
        <div ref={notifRef} style={{
          position:'fixed', top:58, right:16, zIndex:100,
          width:360, background:'var(--bg2)',
          border:'1px solid var(--b2)', borderRadius:14,
          boxShadow:'0 16px 60px rgba(0,0,0,0.5)',
          overflow:'hidden',
        }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--b1)' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700 }}>
              Notifications {unread > 0 && <span style={{ fontSize:11, fontWeight:600, background:'var(--red)', color:'#fff', borderRadius:10, padding:'1px 7px', marginLeft:6 }}>{unread}</span>}
            </div>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize:11.5, color:'var(--accent2)', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight:380, overflowY:'auto' }}>
            {notifs.map(n => (
              <div key={n.id} onClick={() => setNotifs(ns => ns.map(x => x.id===n.id ? {...x,read:true} : x))} style={{
                display:'flex', gap:12, padding:'12px 16px', cursor:'pointer',
                background: n.read ? 'transparent' : 'rgba(45,127,249,0.04)',
                borderBottom:'1px solid rgba(255,255,255,0.04)',
                transition:'background 0.14s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = n.read ? 'transparent' : 'rgba(45,127,249,0.04)'}
              >
                {/* Icon */}
                <div style={{
                  width:32, height:32, borderRadius:8, flexShrink:0,
                  background: n.type==='alert'?'rgba(245,64,96,0.1)':n.type==='success'?'rgba(13,203,125,0.1)':'rgba(45,127,249,0.1)',
                  border:`1px solid ${n.type==='alert'?'rgba(245,64,96,0.2)':n.type==='success'?'rgba(13,203,125,0.2)':'rgba(45,127,249,0.2)'}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:14,
                }}>
                  {n.type==='alert'?'🔔':n.type==='success'?'✅':'ℹ️'}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ fontSize:13, fontWeight: n.read?400:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.title}</div>
                    {!n.read && <span style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', flexShrink:0 }} />}
                  </div>
                  <div style={{ fontSize:12, color:'var(--text2)', marginTop:2 }}>{n.body}</div>
                  <div style={{ fontSize:10.5, color:'var(--text3)', marginTop:4 }}>{n.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ padding:'10px 16px', borderTop:'1px solid var(--b1)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <button onClick={() => { router.push('/alerts'); setShowNotifs(false) }} style={{ fontSize:12, color:'var(--accent2)', background:'none', border:'none', cursor:'pointer', fontWeight:500 }}>
              Manage alerts →
            </button>
            <button onClick={() => setNotifs(ns => ns.map(n => ({...n,read:true})))} style={{ fontSize:12, color:'var(--text3)', background:'none', border:'none', cursor:'pointer' }}>
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* ── Export dropdown ────────────────────────────────────── */}
      {showExport && (
        <div ref={exportRef} style={{
          position:'fixed', top:58, right:16, zIndex:100,
          width:280, background:'var(--bg2)',
          border:'1px solid var(--b2)', borderRadius:14,
          boxShadow:'0 16px 60px rgba(0,0,0,0.5)',
          overflow:'hidden',
        }}>
          <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Export Data</div>
          <div style={{ padding:'8px' }}>
            {[
              { label:'Trade Journal CSV',   sub:'All logged trades with P&L', fn: exportCSV },
              { label:'Watchlist CSV',        sub:'Current watchlist tickers',   fn: exportWatchlist },
              { label:'Portfolio Report PDF', sub:'Full analytics PDF',          fn: () => { router.push('/reports'); setShowExport(false) } },
            ].map(({ label, sub, fn }) => (
              <button key={label} onClick={fn} style={{
                display:'flex', flexDirection:'column', alignItems:'flex-start',
                width:'100%', padding:'10px 12px', borderRadius:9,
                background:'transparent', border:'none', cursor:'pointer',
                transition:'background 0.12s', textAlign:'left',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg3)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <div style={{ fontSize:13, fontWeight:500, color:'var(--text)', display:'flex', alignItems:'center', gap:7 }}>
                  <Download size={12} color="var(--accent2)" /> {label}
                </div>
                <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:2 }}>{sub}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── New Trade modal ────────────────────────────────────── */}
      {showTrade && (
        <div style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
          onClick={e => { if(e.target===e.currentTarget) setShowTrade(false) }}
        >
          <div style={{ width:'100%', maxWidth:480, background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:18, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 22px', borderBottom:'1px solid var(--b1)', background:'var(--bg3)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <TrendingUp size={15} color="#fff" strokeWidth={2} />
                </div>
                <div>
                  <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700 }}>Log New Trade</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Saved to Trade Journal</div>
                </div>
              </div>
              <button onClick={() => setShowTrade(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4 }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding:'20px 22px' }}>
              {/* Buy/Sell toggle */}
              <div style={{ display:'flex', gap:8, marginBottom:18 }}>
                {(['BUY','SELL'] as const).map(s => (
                  <button key={s} onClick={() => setTrade(x => ({...x, side:s}))} style={{
                    flex:1, padding:'10px', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:13,
                    border:`1px solid ${trade.side===s?(s==='BUY'?'rgba(13,203,125,0.4)':'rgba(245,64,96,0.4)'):'var(--b1)'}`,
                    background: trade.side===s?(s==='BUY'?'rgba(13,203,125,0.12)':'rgba(245,64,96,0.12)'):'var(--bg3)',
                    color: trade.side===s?(s==='BUY'?'var(--green)':'var(--red)'):'var(--text2)',
                    transition:'all 0.14s',
                  }}>{s}</button>
                ))}
              </div>

              {/* Fields */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
                <div>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Ticker *</div>
                  <input className="qd-input" placeholder="AAPL" value={trade.ticker} onChange={e => setTrade(x => ({...x, ticker:e.target.value.toUpperCase()}))} style={{ textTransform:'uppercase' }} />
                </div>
                <div>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Asset Type</div>
                  <select className="qd-select" style={{ width:'100%' }} value={trade.type} onChange={e => setTrade(x => ({...x, type:e.target.value}))}>
                    {ASSET_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Quantity *</div>
                  <input className="qd-input" placeholder="100" value={trade.qty} onChange={e => setTrade(x => ({...x, qty:e.target.value}))} />
                </div>
                <div>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Price ($) *</div>
                  <input className="qd-input" placeholder="150.00" value={trade.price} onChange={e => setTrade(x => ({...x, price:e.target.value}))} />
                </div>
              </div>

              <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Notes / Setup Rationale</div>
                <input className="qd-input" placeholder="e.g. Breaking out of consolidation, AI demand catalyst..." value={trade.notes} onChange={e => setTrade(x => ({...x, notes:e.target.value}))} />
              </div>

              {/* Total */}
              {trade.qty && trade.price && (
                <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:'10px 14px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:12.5, color:'var(--text2)' }}>Total Value</span>
                  <span style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:300, color: trade.side==='BUY'?'var(--green)':'var(--red)' }}>
                    {trade.side==='BUY'?'-':'+'}${(+trade.qty * +trade.price).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
                  </span>
                </div>
              )}

              {/* Submit */}
              <button onClick={submitTrade} disabled={!trade.ticker||!trade.qty||!trade.price||tradeSaved} style={{
                width:'100%', padding:'12px', borderRadius:9, border:'none',
                cursor: !trade.ticker||!trade.qty||!trade.price ? 'not-allowed' : 'pointer',
                background: tradeSaved ? 'rgba(13,203,125,0.15)' : !trade.ticker||!trade.qty||!trade.price ? 'var(--bg4)' : trade.side==='BUY' ? 'linear-gradient(135deg,#0dcb7d,#0aa866)' : 'linear-gradient(135deg,#f54060,#c0392b)',
                border: tradeSaved ? '1px solid rgba(13,203,125,0.3)' : 'none',
                color: tradeSaved ? 'var(--green)' : '#fff',
                fontSize:14, fontWeight:700, transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              }}>
                {tradeSaved
                  ? <><Check size={16} /> Trade Logged Successfully</>
                  : `${trade.side === 'BUY' ? 'Buy' : 'Sell'} ${trade.ticker || '—'}`
                }
              </button>

              <div style={{ marginTop:10, textAlign:'center', fontSize:11.5, color:'var(--text3)' }}>
                Trade will be saved to your{' '}
                <button onClick={() => { router.push('/journal'); setShowTrade(false) }} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--accent2)', fontSize:11.5, fontWeight:500 }}>
                  Trade Journal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}