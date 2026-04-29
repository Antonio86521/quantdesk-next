'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Loader, TrendingUp, TrendingDown } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { useAuth } from '@/context/AuthContext'
import { tradeDb } from '@/lib/db'
import type { Trade } from '@/lib/supabase'

export default function JournalPage() {
  const { user } = useAuth()
  const [trades, setTrades]   = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ticker:'', side:'BUY' as 'BUY'|'SELL', qty:'', price:'', type:'Stock', notes:'' })
  const [error, setError] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { if (user) load(); else setLoading(false) }, [user])

  const load = async () => {
    if (!user) return
    setLoading(true)
    try { setTrades(await tradeDb.getAll(user.id)) }
    catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  const add = async () => {
    if (!form.ticker || !form.qty || !form.price) return
    setSaving(true)
    try {
      const t = user
        ? await tradeDb.create(user.id, { ticker:form.ticker.toUpperCase(), side:form.side, qty:+form.qty, price:+form.price, type:form.type, notes:form.notes, date:new Date().toISOString().slice(0,10) })
        : { id:Date.now().toString(), user_id:'', date:new Date().toISOString().slice(0,10), ticker:form.ticker.toUpperCase(), side:form.side, qty:+form.qty, price:+form.price, type:form.type, notes:form.notes, created_at:new Date().toISOString() } as Trade
      setTrades(ts => [t, ...ts])
      setForm({ ticker:'', side:'BUY', qty:'', price:'', type:'Stock', notes:'' })
      setShowForm(false)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const remove = async (id: string) => {
    try {
      if (user) await tradeDb.delete(id)
      setTrades(ts => ts.filter(t => t.id !== id))
    } catch (e: any) { setError(e.message) }
  }

  const totalTrades   = trades.length
  const totalBought   = trades.filter(t=>t.side==='BUY').reduce((s,t)=>s+t.qty*t.price,0)
  const totalSold     = trades.filter(t=>t.side==='SELL').reduce((s,t)=>s+t.qty*t.price,0)
  const uniqueTickers = new Set(trades.map(t=>t.ticker)).size

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Trade Journal</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Log trades · Track performance · {user ? 'Saved to your account' : 'Sign in to save permanently'}</div>
        </div>
        <button onClick={()=>setShowForm(x=>!x)} style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Log Trade
        </button>
      </div>

      {error && <div style={{ marginBottom:16, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:10, padding:'10px 14px', fontSize:12.5, color:'var(--red)' }}>{error}</div>}

      {/* Stats — 2-col on mobile, 4-col on desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { l:'Total Trades',   v:String(totalTrades),   c:'var(--text)' },
          { l:'Unique Tickers', v:String(uniqueTickers), c:'var(--accent2)' },
          { l:'Total Bought',   v:totalBought>=1e3?`$${totalBought.toLocaleString('en',{maximumFractionDigits:0})}`:`$${totalBought.toFixed(2)}`, c:'var(--red)' },
          { l:'Total Sold',     v:totalSold>=1e3?`$${totalSold.toLocaleString('en',{maximumFractionDigits:0})}`:`$${totalSold.toFixed(2)}`, c:'var(--green)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10.5, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{l}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?18:22, fontWeight:300, color:c, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            {(['BUY','SELL'] as const).map(s=>(
              <button key={s} onClick={()=>setForm(x=>({...x,side:s}))} style={{ flex:1, padding:'10px', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:13, border:`1px solid ${form.side===s?(s==='BUY'?'rgba(13,203,125,0.4)':'rgba(245,64,96,0.4)'):'var(--b1)'}`, background:form.side===s?(s==='BUY'?'rgba(13,203,125,0.12)':'rgba(245,64,96,0.12)'):'var(--bg3)', color:form.side===s?(s==='BUY'?'var(--green)':'var(--red)'):'var(--text2)' }}>
                {s}
              </button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : '1fr 1fr 1fr 1fr', gap:12, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Ticker</div>
              <input className="qd-input" placeholder="AAPL" value={form.ticker} onChange={e=>setForm(x=>({...x,ticker:e.target.value.toUpperCase()}))}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Qty</div>
              <input className="qd-input" placeholder="100" value={form.qty} onChange={e=>setForm(x=>({...x,qty:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Price ($)</div>
              <input className="qd-input" placeholder="150.00" value={form.price} onChange={e=>setForm(x=>({...x,price:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Type</div>
              <select className="qd-select" style={{ width:'100%' }} value={form.type} onChange={e=>setForm(x=>({...x,type:e.target.value}))}>
                {['Stock','ETF','Crypto','Options','Forex'].map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Notes</div>
            <input className="qd-input" placeholder="Setup rationale, thesis, notes..." value={form.notes} onChange={e=>setForm(x=>({...x,notes:e.target.value}))}/>
          </div>
          {form.qty && form.price && (
            <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:'10px 14px', marginBottom:12, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:12.5, color:'var(--text2)' }}>Total Value</span>
              <span style={{ fontFamily:'var(--fm)', fontSize:15, color:form.side==='BUY'?'var(--red)':'var(--green)' }}>
                {form.side==='BUY'?'-':'+'}${(+form.qty*+form.price).toLocaleString('en',{minimumFractionDigits:2,maximumFractionDigits:2})}
              </span>
            </div>
          )}
          <button onClick={add} disabled={saving||!form.ticker||!form.qty||!form.price} style={{ padding:'9px 24px', borderRadius:8, background:form.side==='BUY'?'linear-gradient(135deg,#0dcb7d,#0aa866)':'linear-gradient(135deg,#f54060,#c0392b)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            {saving?<Loader size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:(form.side==='BUY'?<TrendingUp size={13}/>:<TrendingDown size={13}/>)}
            {saving?'Saving...':form.side==='BUY'?`Buy ${form.ticker||'—'}`:`Sell ${form.ticker||'—'}`}
          </button>
        </div>
      )}

      <SectionHeader title={`Trade Log (${trades.length})`}/>

      {loading ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
          {[1,2,3,4].map(i=><div key={i} style={{ height:48, margin:'4px 8px', borderRadius:6 }} className="skeleton"/>)}
        </div>
      ) : trades.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:40, textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:10, opacity:0.4 }}>📓</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:600, marginBottom:6 }}>No trades logged yet</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Click Log Trade to record your first trade.</div>
        </div>
      ) : (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
          <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <table className="qd-table" style={{ minWidth: isMobile ? 600 : 'auto' }}>
              <thead><tr><th>Date</th><th>Ticker</th><th>Side</th><th>Type</th><th>Qty</th><th>Price</th><th>Value</th><th>Notes</th><th></th></tr></thead>
              <tbody>
                {trades.map(t=>(
                  <tr key={t.id}>
                    <td style={{ color:'var(--text2)', fontSize:11.5 }}>{t.date}</td>
                    <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:'var(--accent2)' }}>{t.ticker}</span></td>
                    <td><span style={{ fontFamily:'var(--fm)', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, color:t.side==='BUY'?'var(--green)':'var(--red)', background:t.side==='BUY'?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)' }}>{t.side}</span></td>
                    <td><span style={{ fontSize:11.5, color:'var(--text2)' }}>{t.type}</span></td>
                    <td className="mono">{t.qty}</td>
                    <td className="mono">${Number(t.price).toFixed(2)}</td>
                    <td className="mono">${(t.qty*t.price).toLocaleString('en',{maximumFractionDigits:0})}</td>
                    <td style={{ color:'var(--text2)', fontSize:11.5, maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.notes}</td>
                    <td>
                      <button onClick={()=>remove(t.id)} style={{ background:'transparent', border:'none', cursor:'pointer', padding:4, color:'var(--text3)', transition:'color 0.14s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.color='var(--red)'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.color='var(--text3)'}
                      ><Trash2 size={13}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
