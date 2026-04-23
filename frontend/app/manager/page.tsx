'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FolderOpen, Trash2, Edit3, TrendingUp, BarChart3, Copy, ChevronRight, X, Check, Loader } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useAuth } from '@/context/AuthContext'
import { portfolioDb } from '@/lib/db'
import type { Portfolio } from '@/lib/supabase'

const STRATEGIES = ['Long Only','Long/Short','Momentum','Value','Dividend Income','Growth','Index Tracking','Options Overlay']
const COLORS = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7','#e05c3a','#e83e8c']

type Holding = { ticker: string; shares: string; buyPrice: string }

function PortfolioCard({ portfolio, onEdit, onDelete, onDuplicate }: {
  portfolio: Portfolio
  onEdit: (p: Portfolio) => void
  onDelete: (id: string) => void
  onDuplicate: (p: Portfolio) => void
}) {
  const totalCost = portfolio.holdings.reduce((s, h) => s + (+h.shares * +h.buyPrice), 0)

  return (
    <div style={{
      background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16,
      overflow:'hidden', transition:'all 0.2s', position:'relative',
    }}
    onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor=portfolio.color+'44'; el.style.transform='translateY(-2px)'; el.style.boxShadow='0 12px 40px rgba(0,0,0,0.4)' }}
    onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor='var(--b1)'; el.style.transform='translateY(0)'; el.style.boxShadow='none' }}
    >
      <div style={{ height:3, background:`linear-gradient(90deg,${portfolio.color},${portfolio.color}88)` }} />
      <div style={{ padding:'18px 20px' }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:10, flexShrink:0, background:portfolio.color+'18', border:`1px solid ${portfolio.color}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <FolderOpen size={18} color={portfolio.color} strokeWidth={1.5}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700, marginBottom:3 }}>{portfolio.name}</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>Created {portfolio.created_at?.slice(0,10)}</div>
            </div>
          </div>
          <Badge variant={portfolio.strategy==='Growth'?'blue':portfolio.strategy==='Momentum'?'purple':portfolio.strategy==='Dividend Income'?'green':'amber'}>
            {portfolio.strategy}
          </Badge>
        </div>

        {portfolio.description && (
          <div style={{ fontSize:12.5, color:'var(--text2)', marginBottom:14, lineHeight:1.55 }}>{portfolio.description}</div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'var(--b1)', borderRadius:10, overflow:'hidden', marginBottom:14 }}>
          {[
            { label:'Positions',  value: String(portfolio.holdings.length) },
            { label:'Total Cost', value: totalCost>=1e6?`$${(totalCost/1e6).toFixed(2)}M`:`$${totalCost.toLocaleString('en',{maximumFractionDigits:0})}` },
            { label:'Avg Size',   value: portfolio.holdings.length?`$${(totalCost/portfolio.holdings.length).toLocaleString('en',{maximumFractionDigits:0})}`:'—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ background:'var(--bg3)', padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>{label}</div>
              <div style={{ fontFamily:'var(--fm)', fontSize:15, fontWeight:300 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:5, marginBottom:16 }}>
          {portfolio.holdings.map((h, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 10px', background:'var(--bg3)', borderRadius:7, border:'1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ fontFamily:'var(--fm)', fontSize:12, fontWeight:600, color:portfolio.color }}>{h.ticker}</span>
              <span style={{ fontSize:11.5, color:'var(--text2)' }}>{h.shares} @ ${h.buyPrice}</span>
              <span style={{ fontFamily:'var(--fm)', fontSize:11.5 }}>${(+h.shares*+h.buyPrice).toLocaleString('en',{maximumFractionDigits:0})}</span>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:8 }}>
          <Link href={`/portfolio?tickers=${portfolio.holdings.map(h=>h.ticker).join(',')}&shares=${portfolio.holdings.map(h=>h.shares).join(',')}&buyPrices=${portfolio.holdings.map(h=>h.buyPrice).join(',')}`}
            style={{ flex:1, padding:'9px 12px', borderRadius:9, textAlign:'center', background:`linear-gradient(135deg,${portfolio.color}22,${portfolio.color}11)`, border:`1px solid ${portfolio.color}33`, color:portfolio.color, fontSize:12.5, fontWeight:600, textDecoration:'none', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}
            onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=`${portfolio.color}30`}
            onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=`linear-gradient(135deg,${portfolio.color}22,${portfolio.color}11)`}
          >
            <TrendingUp size={13} strokeWidth={2}/> Analyse
          </Link>
          <button onClick={()=>onDuplicate(portfolio)} title="Duplicate" style={{ padding:'9px 11px', borderRadius:9, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b2)';el.style.color='var(--accent2)'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
          ><Copy size={13}/></button>
          <button onClick={()=>onEdit(portfolio)} title="Edit" style={{ padding:'9px 11px', borderRadius:9, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b2)';el.style.color='var(--text)'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
          ><Edit3 size={13}/></button>
          <button onClick={()=>onDelete(portfolio.id)} title="Delete" style={{ padding:'9px 11px', borderRadius:9, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s' }}
            onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(245,64,96,0.3)';el.style.color='var(--red)'}}
            onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
          ><Trash2 size={13}/></button>
        </div>
      </div>
    </div>
  )
}

function PortfolioForm({ initial, onSave, onClose, saving }: {
  initial?: Portfolio | null
  onSave: (data: any) => void
  onClose: () => void
  saving: boolean
}) {
  const [name, setName]         = useState(initial?.name||'')
  const [desc, setDesc]         = useState(initial?.description||'')
  const [strategy, setStrategy] = useState(initial?.strategy||STRATEGIES[0])
  const [color, setColor]       = useState(initial?.color||COLORS[0])
  const [holdings, setHoldings] = useState<Holding[]>(initial?.holdings||[{ ticker:'',shares:'',buyPrice:'' }])

  const addRow = () => setHoldings(h=>[...h,{ticker:'',shares:'',buyPrice:''}])
  const removeRow = (i:number) => setHoldings(h=>h.filter((_,idx)=>idx!==i))
  const updateRow = (i:number,field:keyof Holding,val:string) => setHoldings(h=>h.map((r,idx)=>idx===i?{...r,[field]:val}:r))

  const save = () => {
    if (!name.trim()) return
    const valid = holdings.filter(h=>h.ticker&&h.shares&&h.buyPrice)
    if (!valid.length) return
    onSave({ name, description:desc, strategy, color, holdings:valid })
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:18, padding:'24px 28px', width:'100%', maxWidth:680, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:17, fontWeight:700 }}>{initial?'Edit Portfolio':'New Portfolio'}</div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text2)' }}><X size={18}/></button>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
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
          <div style={{ display:'flex', gap:8 }}>
            {COLORS.map(c=>(
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:6 }}>
            {['Ticker','Shares','Buy Price ($)',''].map((h,i)=>(
              <div key={i} style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'0.5px', textTransform:'uppercase', paddingLeft:2 }}>{h}</div>
            ))}
          </div>
          {holdings.map((h,i)=>(
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:8, marginBottom:8 }}>
              <input className="qd-input" placeholder="AAPL" value={h.ticker} onChange={e=>updateRow(i,'ticker',e.target.value.toUpperCase())} style={{ textTransform:'uppercase' }}/>
              <input className="qd-input" placeholder="20"    value={h.shares}   onChange={e=>updateRow(i,'shares',e.target.value)}/>
              <input className="qd-input" placeholder="182.00" value={h.buyPrice} onChange={e=>updateRow(i,'buyPrice',e.target.value)}/>
              <button onClick={()=>removeRow(i)} disabled={holdings.length===1} style={{ padding:'8px', borderRadius:7, background:'transparent', border:'1px solid rgba(245,64,96,0.2)', color:'var(--red)', cursor:'pointer', opacity:holdings.length===1?0.3:1 }}><X size={13}/></button>
            </div>
          ))}
        </div>

        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--b2)', color:'var(--text2)', fontSize:13, fontWeight:500, cursor:'pointer' }}>Cancel</button>
          <button onClick={save} disabled={saving} style={{ padding:'10px 24px', borderRadius:8, background:`linear-gradient(135deg,${color},${color}bb)`, border:`1px solid ${color}55`, color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            {saving ? <><Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Saving...</> : <><Check size={14}/>{initial?'Save Changes':'Create Portfolio'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

function ManagerContent() {
  const { user } = useAuth()
  const [portfolios, setPortfolios] = useState<Portfolio[]>([])
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [showForm, setShowForm]     = useState(false)
  const [editTarget, setEditTarget] = useState<Portfolio|null>(null)
  const [search, setSearch]         = useState('')
  const [error, setError]           = useState('')

  useEffect(() => {
    if (user) load()
  }, [user])

  const load = async () => {
    if (!user) return
    setLoading(true)
    try {
      setPortfolios(await portfolioDb.getAll(user.id))
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (data: any) => {
    if (!user) return
    setSaving(true)
    try {
      if (editTarget) {
        const updated = await portfolioDb.update(editTarget.id, data)
        setPortfolios(ps => ps.map(p => p.id===editTarget.id ? updated : p))
      } else {
        const created = await portfolioDb.create(user.id, data)
        setPortfolios(ps => [created, ...ps])
      }
      setShowForm(false)
      setEditTarget(null)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this portfolio?')) return
    try {
      await portfolioDb.delete(id)
      setPortfolios(ps => ps.filter(p => p.id !== id))
    } catch (e: any) {
      setError(e.message)
    }
  }

  const handleDuplicate = async (p: Portfolio) => {
    if (!user) return
    try {
      const created = await portfolioDb.create(user.id, {
        name: `${p.name} (Copy)`, description: p.description,
        strategy: p.strategy, color: p.color, holdings: p.holdings,
      })
      setPortfolios(ps => [created, ...ps])
    } catch (e: any) {
      setError(e.message)
    }
  }

  const filtered = portfolios.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.strategy?.toLowerCase().includes(search.toLowerCase()) ||
    p.holdings?.some(h => h.ticker.toLowerCase().includes(search.toLowerCase()))
  )

  const totalValue = portfolios.reduce((s,p) => s + p.holdings.reduce((hs,h) => hs+(+h.shares*+h.buyPrice), 0), 0)

  return (
    <div style={{ padding:'0 28px 52px' }}>
      {showForm && <PortfolioForm initial={editTarget} onSave={handleSave} onClose={()=>{ setShowForm(false); setEditTarget(null) }} saving={saving}/>}

      <div style={{ margin:'24px 0 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Portfolio Manager</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Create · Edit · Analyse · All saved to your account</div>
        </div>
        <button onClick={()=>{ setEditTarget(null); setShowForm(true) }} style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 20px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 0 20px rgba(45,127,249,0.25)' }}>
          <Plus size={14} strokeWidth={2.5}/> New Portfolio
        </button>
      </div>

      {error && <div style={{ marginBottom:16, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'var(--red)' }}>{error}</div>}

      {/* Summary */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:24 }}>
        {[
          { label:'Portfolios',     value:String(portfolios.length),     color:'var(--accent2)' },
          { label:'Total Positions', value:String(portfolios.reduce((s,p)=>s+p.holdings.length,0)), color:'var(--text)' },
          { label:'Total Invested',  value:totalValue>=1e6?`$${(totalValue/1e6).toFixed(2)}M`:`$${totalValue.toLocaleString('en',{maximumFractionDigits:0})}`, color:'var(--green)' },
          { label:'Unique Tickers',  value:String(new Set(portfolios.flatMap(p=>p.holdings.map(h=>h.ticker))).size), color:'var(--purple)' },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{ padding:'16px 20px', background:'var(--bg2)', borderRight:i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
            <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, marginBottom:8 }}>{label}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:300, color }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom:20 }}>
        <input className="qd-input" placeholder="Search portfolios..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:380 }}/>
      </div>

      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {[1,2,3].map(i => <div key={i} style={{ height:280, borderRadius:14 }} className="skeleton"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:52, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>💼</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>
            {search ? 'No portfolios match' : 'No portfolios yet'}
          </div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:380, margin:'0 auto 20px' }}>
            {search ? 'Try a different search.' : 'Create your first portfolio — it will be saved to your account.'}
          </div>
          {!search && (
            <button onClick={()=>setShowForm(true)} style={{ padding:'10px 24px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Create First Portfolio
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
          {filtered.map(p => (
            <PortfolioCard key={p.id} portfolio={p}
              onEdit={p => { setEditTarget(p); setShowForm(true) }}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
            />
          ))}
        </div>
      )}

      {portfolios.length >= 2 && (
        <>
          <SectionHeader title="Quick Compare"/>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
            <table className="qd-table">
              <thead><tr><th>Portfolio</th><th>Strategy</th><th>Positions</th><th>Total Cost</th><th>Tickers</th><th>Action</th></tr></thead>
              <tbody>
                {portfolios.map(p => {
                  const cost = p.holdings.reduce((s,h)=>s+(+h.shares*+h.buyPrice),0)
                  return (
                    <tr key={p.id}>
                      <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:8, height:8, borderRadius:'50%', background:p.color, flexShrink:0 }}/><span style={{ fontWeight:600 }}>{p.name}</span></div></td>
                      <td><Badge variant={p.strategy==='Growth'?'blue':p.strategy==='Momentum'?'purple':'green'}>{p.strategy}</Badge></td>
                      <td className="mono">{p.holdings.length}</td>
                      <td className="mono">{cost>=1e6?`$${(cost/1e6).toFixed(2)}M`:`$${cost.toLocaleString('en',{maximumFractionDigits:0})}`}</td>
                      <td style={{ color:'var(--text3)', fontSize:11, fontFamily:'var(--fm)' }}>{p.holdings.map(h=>h.ticker).join(', ')}</td>
                      <td><Link href={`/portfolio?tickers=${p.holdings.map(h=>h.ticker).join(',')}&shares=${p.holdings.map(h=>h.shares).join(',')}&buyPrices=${p.holdings.map(h=>h.buyPrice).join(',')}`} style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, color:'var(--accent2)', fontWeight:600, textDecoration:'none' }}>Analyse <ChevronRight size={11}/></Link></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

export default function ManagerPage() {
  return <ProtectedRoute><ManagerContent/></ProtectedRoute>
}