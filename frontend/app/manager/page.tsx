'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Trash2, Edit3, TrendingUp, TrendingDown, Copy, ChevronRight, X, Check, Loader, RefreshCw, Activity } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import dynamic from 'next/dynamic'
const CSVImport = dynamic(() => import('@/components/CSVImport'), { ssr: false })
import { useAuth } from '@/context/AuthContext'
import { portfolioDb } from '@/lib/db'
import type { Portfolio } from '@/lib/supabase'
import { api } from '@/lib/api'

const STRATEGIES = ['Long Only','Long/Short','Momentum','Value','Dividend Income','Growth','Index Tracking','Options Overlay']
const COLORS     = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7','#e05c3a','#e83e8c']

type Holding = { ticker: string; shares: string; buyPrice: string }
type LiveData = { currentValue: number; totalCost: number; pnl: number; pnlPct: number; loading: boolean }

function fmtDollar(v: number) {
  return v >= 1e6 ? `$${(v/1e6).toFixed(2)}M` : v >= 1e3 ? `$${v.toLocaleString('en',{maximumFractionDigits:0})}` : `$${v.toFixed(2)}`
}
function fmtPct(v: number) { return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%` }

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (!data?.length || data.length < 2) return null
  const mn = Math.min(...data), mx = Math.max(...data), range = mx - mn || 1
  const pts = data.map((v,i) => `${(i/(data.length-1))*60},${16-((v-mn)/range)*16}`).join(' ')
  return (
    <svg width={60} height={16} style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={up?'#0dcb7d':'#f54060'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function LivePnLBadge({ live }: { live: LiveData | null }) {
  if (!live || live.loading) return <div style={{ width:60, height:16, borderRadius:4 }} className="skeleton"/>
  const up = live.pnl >= 0
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:2 }}>
      <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color:up?'#0dcb7d':'#f54060' }}>
        {fmtDollar(live.currentValue)}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
        {up ? <TrendingUp size={10} color="#0dcb7d"/> : <TrendingDown size={10} color="#f54060"/>}
        <span style={{ fontFamily:'var(--fm)', fontSize:11, color:up?'#0dcb7d':'#f54060', fontWeight:600 }}>
          {fmtPct(live.pnlPct)}
        </span>
      </div>
    </div>
  )
}

function PortfolioCard({ portfolio, live, onEdit, onDelete, onDuplicate, isMobile }: {
  portfolio: Portfolio; live: LiveData | null
  onEdit: (p: Portfolio) => void; onDelete: (id: string) => void
  onDuplicate: (p: Portfolio) => void; isMobile: boolean
}) {
  const totalCost = portfolio.holdings.reduce((s,h) => s + (+h.shares * +h.buyPrice), 0)
  const up = live ? live.pnl >= 0 : true

  return (
    <div style={{ background:'var(--bg2)', border:`1px solid ${live && !live.loading ? (up ? 'rgba(13,203,125,0.15)' : 'rgba(245,64,96,0.15)') : 'var(--b1)'}`, borderRadius:16, overflow:'hidden', transition:'all 0.2s', position:'relative' }}
      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(-2px)';el.style.boxShadow='0 12px 40px rgba(0,0,0,0.4)'}}
      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.transform='translateY(0)';el.style.boxShadow='none'}}
    >
      <div style={{ height:3, background:`linear-gradient(90deg,${portfolio.color},${portfolio.color}88)` }}/>

      <div style={{ padding:'16px 18px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:36, height:36, borderRadius:9, flexShrink:0, background:portfolio.color+'18', border:`1px solid ${portfolio.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FolderOpen size={16} color={portfolio.color} strokeWidth={1.5}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:2 }}>{portfolio.name}</div>
              <div style={{ fontSize:10.5, color:'var(--text3)' }}>{portfolio.holdings.length} positions · {portfolio.strategy}</div>
            </div>
          </div>
          <LivePnLBadge live={live}/>
        </div>

        {/* Live P&L bar */}
        {live && !live.loading && (
          <div style={{ background:'var(--bg3)', borderRadius:10, padding:'10px 12px', marginBottom:12, border:`1px solid ${up?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)'}` }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                { label:'Cost Basis', value:fmtDollar(live.totalCost), color:'var(--text2)' },
                { label:'Curr Value', value:fmtDollar(live.currentValue), color:up?'#0dcb7d':'#f54060' },
                { label:'Unrealised P&L', value:`${up?'+':''}${fmtDollar(live.pnl)}`, color:up?'#0dcb7d':'#f54060' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:8.5, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>{label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:12.5, fontWeight:600, color }}>{value}</div>
                </div>
              ))}
            </div>
            {/* P&L progress bar */}
            <div style={{ height:3, background:'var(--bg4)', borderRadius:2, marginTop:10, overflow:'hidden' }}>
              <div style={{ height:3, width:`${Math.min(100, Math.abs(live.pnlPct) * 3)}%`, background:up?'#0dcb7d':'#f54060', borderRadius:2, transition:'width 0.5s ease' }}/>
            </div>
          </div>
        )}

        {/* Holdings list */}
        <div style={{ display:'flex', flexDirection:'column', gap:4, marginBottom:14 }}>
          {portfolio.holdings.slice(0, 4).map((h,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 8px', background:'var(--bg3)', borderRadius:6 }}>
              <span style={{ fontFamily:'var(--fm)', fontSize:11.5, fontWeight:600, color:portfolio.color }}>{h.ticker}</span>
              <span style={{ fontSize:10.5, color:'var(--text3)' }}>{h.shares} sh @ ${h.buyPrice}</span>
              <span style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text2)' }}>{fmtDollar(+h.shares * +h.buyPrice)}</span>
            </div>
          ))}
          {portfolio.holdings.length > 4 && (
            <div style={{ fontSize:11, color:'var(--text3)', textAlign:'center', padding:'4px 0' }}>+{portfolio.holdings.length - 4} more positions</div>
          )}
        </div>

        {/* Actions */}
        <div style={{ display:'flex', gap:6 }}>
          <Link href={`/portfolio?tickers=${portfolio.holdings.map(h=>h.ticker).join(',')}&shares=${portfolio.holdings.map(h=>h.shares).join(',')}&buyPrices=${portfolio.holdings.map(h=>h.buyPrice).join(',')}`}
            style={{ flex:1, padding:'8px 10px', borderRadius:8, textAlign:'center', background:`${portfolio.color}18`, border:`1px solid ${portfolio.color}33`, color:portfolio.color, fontSize:12, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
            <TrendingUp size={12}/> Analyse
          </Link>
          <button onClick={()=>onDuplicate(portfolio)} style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer' }} title="Duplicate"><Copy size={12}/></button>
          <button onClick={()=>onEdit(portfolio)} style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer' }} title="Edit"><Edit3 size={12}/></button>
          <button onClick={()=>onDelete(portfolio.id)} style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid rgba(245,64,96,0.2)', color:'var(--red)', cursor:'pointer' }} title="Delete"><Trash2 size={12}/></button>
        </div>
      </div>
    </div>
  )
}

function PortfolioForm({ initial, onSave, onClose, saving, isMobile }: {
  initial?: Portfolio|null; onSave: (data:any)=>void; onClose:()=>void; saving:boolean; isMobile:boolean
}) {
  const [name,     setName]     = useState(initial?.name||'')
  const [desc,     setDesc]     = useState(initial?.description||'')
  const [strategy, setStrategy] = useState(initial?.strategy||STRATEGIES[0])
  const [color,    setColor]    = useState(initial?.color||COLORS[0])
  const [holdings, setHoldings] = useState<Holding[]>(initial?.holdings||[{ticker:'',shares:'',buyPrice:''}])

  const addRow    = () => setHoldings(h => [...h, {ticker:'',shares:'',buyPrice:''}])
  const removeRow = (i: number) => setHoldings(h => h.filter((_,idx) => idx !== i))
  const updateRow = (i: number, field: keyof Holding, val: string) =>
    setHoldings(h => h.map((r,idx) => idx === i ? {...r,[field]:val} : r))

  const save = () => {
    if (!name.trim()) return
    const valid = holdings.filter(h => h.ticker && h.shares && h.buyPrice)
    if (!valid.length) return
    onSave({ name, description:desc, strategy, color, holdings:valid })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding: isMobile?12:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:18, padding: isMobile?'16px':'24px 28px', width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:17, fontWeight:700 }}>{initial ? 'Edit Portfolio' : 'New Portfolio'}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text2)' }}><X size={18}/></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Portfolio Name *</div>
            <input className="qd-input" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Core Growth"/>
          </div>
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Strategy</div>
            <select className="qd-select" style={{ width:'100%' }} value={strategy} onChange={e=>setStrategy(e.target.value)}>
              {STRATEGIES.map(s=><option key={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Description</div>
          <input className="qd-input" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Short description"/>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:8, fontWeight:500 }}>Accent Color</div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {COLORS.map(c => (
              <button key={c} onClick={()=>setColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, border:'none', cursor:'pointer', boxShadow:color===c?`0 0 0 2px var(--bg2),0 0 0 4px ${c}`:'none', transition:'box-shadow 0.15s' }}/>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
            <div style={{ fontSize:10.5, color:'var(--text2)', fontWeight:500, textTransform:'uppercase', letterSpacing:'0.8px' }}>Holdings *</div>
            <button onClick={addRow} style={{ display:'flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:6, background:'var(--accent3)', border:'1px solid rgba(45,127,249,0.2)', color:'var(--accent2)', fontSize:11.5, fontWeight:600, cursor:'pointer' }}>
              <Plus size={11}/> Add Row
            </button>
          </div>
          {!isMobile && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:6 }}>
              {['Ticker','Shares','Buy Price ($)',''].map((h,i) => (
                <div key={i} style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', paddingLeft:2 }}>{h}</div>
              ))}
            </div>
          )}
          {holdings.map((h,i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
              <input className="qd-input" placeholder="AAPL"   value={h.ticker}   onChange={e=>updateRow(i,'ticker',e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }}/>
              <input className="qd-input" placeholder="20"     value={h.shares}   onChange={e=>updateRow(i,'shares',e.target.value)}/>
              <input className="qd-input" placeholder="182.00" value={h.buyPrice} onChange={e=>updateRow(i,'buyPrice',e.target.value)}/>
              <button onClick={()=>removeRow(i)} disabled={holdings.length===1} style={{ padding:'8px', borderRadius:7, background:'transparent', border:'1px solid rgba(245,64,96,0.2)', color:'var(--red)', cursor:'pointer', opacity:holdings.length===1?0.3:1 }}><X size={13}/></button>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--b2)', color:'var(--text2)', fontSize:13, fontWeight:500, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:`linear-gradient(135deg,${color},${color}bb)`, border:`1px solid ${color}55`, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            {saving ? <><Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Saving...</> : <><Check size={14}/>{initial ? 'Save Changes' : 'Create Portfolio'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManagerContent() {
  const { user } = useAuth()
  const [portfolios,  setPortfolios]  = useState<Portfolio[]>([])
  const [liveData,    setLiveData]    = useState<Record<string, LiveData>>({})
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)
  const [saving,      setSaving]      = useState(false)
  const [showForm,    setShowForm]    = useState(false)
  const [showCSV,     setShowCSV]     = useState(false)
  const [editTarget,  setEditTarget]  = useState<Portfolio|null>(null)
  const [search,      setSearch]      = useState('')
  const [error,       setError]       = useState('')
  const [lastUpdate,  setLastUpdate]  = useState('')
  const [isMobile,    setIsMobile]    = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const load = useCallback(async () => {
    if (!user) return; setLoading(true)
    try { setPortfolios(await portfolioDb.getAll(user.id)) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { if (user) load() }, [user, load])

  // Fetch live prices for all portfolios
  const fetchLivePrices = useCallback(async (ps: Portfolio[]) => {
    if (!ps.length) return
    setRefreshing(true)

    await Promise.all(ps.map(async (portfolio) => {
      // Mark as loading
      setLiveData(prev => ({ ...prev, [portfolio.id]: { currentValue:0, totalCost:0, pnl:0, pnlPct:0, loading:true } }))

      try {
        const tickers    = portfolio.holdings.map(h => h.ticker).join(',')
        const shares     = portfolio.holdings.map(h => h.shares).join(',')
        const buyPrices  = portfolio.holdings.map(h => h.buyPrice).join(',')
        const result     = await api.portfolio.analytics({ tickers, shares, buyPrices, period:'1y', benchmark:'SPY' })

        if (result?.summary) {
          const s = result.summary
          setLiveData(prev => ({
            ...prev,
            [portfolio.id]: {
              currentValue: s.totalValue,
              totalCost:    s.totalCost,
              pnl:          s.unrealisedPnl,
              pnlPct:       s.unrealisedPct * 100,
              loading:      false,
            }
          }))
        }
      } catch {
        const totalCost = portfolio.holdings.reduce((s,h) => s + (+h.shares * +h.buyPrice), 0)
        setLiveData(prev => ({ ...prev, [portfolio.id]: { currentValue:totalCost, totalCost, pnl:0, pnlPct:0, loading:false } }))
      }
    }))

    setLastUpdate(new Date().toLocaleTimeString())
    setRefreshing(false)
  }, [])

  useEffect(() => {
    if (portfolios.length) {
      fetchLivePrices(portfolios)
      const id = setInterval(() => fetchLivePrices(portfolios), 60_000)
      return () => clearInterval(id)
    }
  }, [portfolios, fetchLivePrices])

  const handleSave = async (data: any) => {
    if (!user) return; setSaving(true)
    try {
      if (editTarget) {
        const updated = await portfolioDb.update(editTarget.id, data)
        setPortfolios(ps => ps.map(p => p.id === editTarget.id ? updated : p))
      } else {
        const created = await portfolioDb.create(user.id, data)
        setPortfolios(ps => [created, ...ps])
      }
      setShowForm(false); setEditTarget(null)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio?')) return
    try { await portfolioDb.delete(id); setPortfolios(ps => ps.filter(p => p.id !== id)) }
    catch (e: any) { setError(e.message) }
  }

  const handleDuplicate = async (p: Portfolio) => {
    if (!user) return
    try {
      const created = await portfolioDb.create(user.id, { name:`${p.name} (Copy)`, description:p.description, strategy:p.strategy, color:p.color, holdings:p.holdings })
      setPortfolios(ps => [created, ...ps])
    } catch (e: any) { setError(e.message) }
  }

  const filtered = portfolios.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.strategy?.toLowerCase().includes(search.toLowerCase()) ||
    p.holdings?.some(h => h.ticker.toLowerCase().includes(search.toLowerCase()))
  )

  // Aggregate live stats
  const totalCurrentValue = Object.values(liveData).filter(d => !d.loading).reduce((s,d) => s + d.currentValue, 0)
  const totalCostAll      = Object.values(liveData).filter(d => !d.loading).reduce((s,d) => s + d.totalCost, 0)
  const totalPnl          = totalCurrentValue - totalCostAll
  const totalPnlPct       = totalCostAll > 0 ? (totalPnl / totalCostAll) * 100 : 0

  // Best/worst performer
  const liveEntries = Object.entries(liveData).filter(([,d]) => !d.loading)
  const bestId  = liveEntries.length ? liveEntries.reduce((a,b) => b[1].pnlPct > a[1].pnlPct ? b : a)[0] : null
  const worstId = liveEntries.length ? liveEntries.reduce((a,b) => b[1].pnlPct < a[1].pnlPct ? b : a)[0] : null

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>
      {showCSV && <CSVImport
        onImport={async(name,holdings) => {
          if (!user) return
          try {
            const created = await portfolioDb.create(user.id, {name, description:'Imported from CSV', strategy:'Long Only', color:'#0dcb7d', holdings})
            setPortfolios(ps => [created, ...ps])
          } catch (e: any) { setError(e.message) }
          setShowCSV(false)
        }}
        onClose={() => setShowCSV(false)}
      />}
      {showForm && <PortfolioForm initial={editTarget} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTarget(null)}} saving={saving} isMobile={isMobile}/>}

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Portfolio Manager</h1>
          <div style={{ fontSize:13, color:'var(--text2)', display:'flex', alignItems:'center', gap:6 }}>
            Live P&L tracking · Saved to your account
            {lastUpdate && <span style={{ fontSize:10.5, color:'var(--text4)', display:'flex', alignItems:'center', gap:3 }}><RefreshCw size={8}/> {lastUpdate}</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={()=>fetchLivePrices(portfolios)} disabled={refreshing} style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, background:'var(--bg3)', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:12, cursor:'pointer' }}>
            <RefreshCw size={12} style={{ animation:refreshing?'spin 0.8s linear infinite':'none' }}/> Refresh
          </button>
          <button onClick={()=>setShowCSV(true)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, background:'rgba(13,203,125,0.1)', border:'1px solid rgba(13,203,125,0.25)', color:'var(--green)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            📂 Import CSV
          </button>
          <button onClick={()=>{setEditTarget(null);setShowForm(true)}} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 0 20px rgba(45,127,249,0.25)' }}>
            <Plus size={14}/> New Portfolio
          </button>
        </div>
      </div>

      {error && <div style={{ marginBottom:16, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'var(--red)' }}>{error}</div>}

      {/* Live P&L summary strip */}
      {portfolios.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
          {[
            { label:'Total Value',      value: totalCurrentValue > 0 ? fmtDollar(totalCurrentValue) : '—',                                   color: 'var(--accent2)' },
            { label:'Total P&L',        value: totalCostAll > 0 ? `${totalPnl >= 0 ? '+' : ''}${fmtDollar(totalPnl)}` : '—',                color: totalPnl >= 0 ? '#0dcb7d' : '#f54060' },
            { label:'Return',           value: totalCostAll > 0 ? fmtPct(totalPnlPct) : '—',                                                  color: totalPnlPct >= 0 ? '#0dcb7d' : '#f54060' },
            { label:'Portfolios',       value: String(portfolios.length),                                                                      color: 'var(--text)' },
          ].map(({ label, value, color }, i) => (
            <div key={i} style={{ padding:'14px 18px', background:'var(--bg2)', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none', borderBottom: isMobile && i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, marginBottom:7 }}>{label}</div>
              <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?16:20, fontWeight:300, color }}>{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Best / Worst performer */}
      {liveEntries.length >= 2 && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:10, marginBottom:20 }}>
          {[
            { id:bestId,  label:'Best Performer',  icon:'🏆', color:'rgba(13,203,125,0.08)', border:'rgba(13,203,125,0.2)', textColor:'#0dcb7d' },
            { id:worstId, label:'Needs Attention',  icon:'⚠', color:'rgba(245,64,96,0.06)', border:'rgba(245,64,96,0.15)', textColor:'#f54060' },
          ].map(({ id, label, icon, color, border, textColor }) => {
            const p    = portfolios.find(p => p.id === id)
            const live = id ? liveData[id] : null
            if (!p || !live) return null
            return (
              <div key={label} style={{ background:color, border:`1px solid ${border}`, borderRadius:12, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:18 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:2 }}>{label}</div>
                    <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700 }}>{p.name}</div>
                  </div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:600, color:textColor }}>{fmtPct(live.pnlPct)}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text3)' }}>{live.pnl >= 0 ? '+' : ''}{fmtDollar(live.pnl)}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search */}
      <div style={{ marginBottom:18 }}>
        <input className="qd-input" placeholder="Search portfolios by name, strategy or ticker..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:420 }}/>
      </div>

      {/* Portfolio grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:300, borderRadius:14 }} className="skeleton"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:52, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>💼</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>{search ? 'No portfolios match' : 'No portfolios yet'}</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:380, margin:'0 auto 20px' }}>
            {search ? 'Try a different search.' : 'Create your first portfolio — holdings and live P&L saved to your account.'}
          </div>
          {!search && <button onClick={()=>setShowForm(true)} style={{ padding:'10px 24px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Create First Portfolio</button>}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:16 }}>
          {filtered.map(p => (
            <PortfolioCard key={p.id} portfolio={p} live={liveData[p.id]||null} isMobile={isMobile}
              onEdit={p => { setEditTarget(p); setShowForm(true) }}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {/* Compare table */}
      {portfolios.length >= 2 && (
        <div style={{ marginTop:32 }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={14} color="var(--accent2)"/> Portfolio Comparison
          </div>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ overflowX:'auto' }}>
              <table className="qd-table" style={{ minWidth: isMobile?600:'auto' }}>
                <thead>
                  <tr><th>Portfolio</th><th>Strategy</th><th>Positions</th><th>Cost Basis</th><th>Live Value</th><th>P&L</th><th>Return</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {portfolios.map(p => {
                    const live = liveData[p.id]
                    const cost = p.holdings.reduce((s,h) => s + (+h.shares * +h.buyPrice), 0)
                    return (
                      <tr key={p.id}>
                        <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:8,height:8,borderRadius:'50%',background:p.color,flexShrink:0 }}/><span style={{ fontWeight:600 }}>{p.name}</span></div></td>
                        <td><span style={{ fontSize:11, padding:'2px 8px', borderRadius:4, background:'var(--bg3)', color:'var(--text2)' }}>{p.strategy}</span></td>
                        <td className="mono">{p.holdings.length}</td>
                        <td className="mono">{fmtDollar(cost)}</td>
                        <td className="mono">{live && !live.loading ? fmtDollar(live.currentValue) : <span style={{ color:'var(--text4)' }}>—</span>}</td>
                        <td><span className="mono" style={{ color: live && !live.loading ? (live.pnl >= 0 ? '#0dcb7d' : '#f54060') : 'var(--text4)' }}>{live && !live.loading ? `${live.pnl >= 0 ? '+' : ''}${fmtDollar(live.pnl)}` : '—'}</span></td>
                        <td><span className="mono" style={{ color: live && !live.loading ? (live.pnlPct >= 0 ? '#0dcb7d' : '#f54060') : 'var(--text4)' }}>{live && !live.loading ? fmtPct(live.pnlPct) : '—'}</span></td>
                        <td>
                          <Link href={`/portfolio?tickers=${p.holdings.map(h=>h.ticker).join(',')}&shares=${p.holdings.map(h=>h.shares).join(',')}&buyPrices=${p.holdings.map(h=>h.buyPrice).join(',')}`}
                            style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'var(--accent2)', fontWeight:600, textDecoration:'none' }}>
                            Analyse <ChevronRight size={11}/>
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ManagerPage() {
  return <ProtectedRoute><ManagerContent/></ProtectedRoute>
}