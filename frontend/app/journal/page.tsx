'use client'
import { useState } from 'react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { Plus, TrendingUp, TrendingDown } from 'lucide-react'

type Trade = { id:number; date:string; ticker:string; side:'BUY'|'SELL'; qty:number; price:number; notes:string }

const SAMPLE: Trade[] = [
  { id:1, date:'2026-04-22', ticker:'NVDA', side:'BUY',  qty:200, price:198.50, notes:'Breaking out of consolidation, strong AI demand' },
  { id:2, date:'2026-04-21', ticker:'META', side:'SELL', qty:500, price:671.20, notes:'Taking profits after earnings gap up' },
  { id:3, date:'2026-04-18', ticker:'AAPL', side:'BUY',  qty:150, price:269.80, notes:'Buying dip on services growth story' },
  { id:4, date:'2026-04-15', ticker:'TSLA', side:'BUY',  qty:100, price:210.00, notes:'Speculative position on robotaxi catalyst' },
]

export default function JournalPage() {
  const [trades, setTrades] = useState<Trade[]>(SAMPLE)
  const [form, setForm] = useState({ ticker:'', side:'BUY' as 'BUY'|'SELL', qty:'', price:'', notes:'' })
  const [showForm, setShowForm] = useState(false)

  const add = () => {
    if (!form.ticker || !form.qty || !form.price) return
    setTrades(t => [{ id:Date.now(), date:new Date().toISOString().slice(0,10), ticker:form.ticker.toUpperCase(), side:form.side, qty:+form.qty, price:+form.price, notes:form.notes }, ...t])
    setForm({ ticker:'', side:'BUY', qty:'', price:'', notes:'' })
    setShowForm(false)
  }

  const wins  = trades.filter(t=>t.side==='SELL').length
  const total = trades.length
  const totalValue = trades.reduce((s,t)=>{
    const v = t.qty*t.price
    return t.side==='SELL'?s-v:s+v
  }, 0)

  return (
    <div style={{ padding:'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div><h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Trade Journal</h1><div style={{ fontSize:13, color:'var(--text2)' }}>Log trades · Track performance · Review setups</div></div>
        <button onClick={()=>setShowForm(x=>!x)} style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}>
          <Plus size={14}/> Log Trade
        </button>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { l:'Total Trades',  v:String(total),          c:'var(--text)' },
          { l:'Win Rate',      v:`${total?Math.round(wins/total*100):0}%`, c:'var(--green)' },
          { l:'Net Exposure',  v:`$${Math.abs(totalValue).toLocaleString('en',{maximumFractionDigits:0})}`, c:'var(--accent2)' },
          { l:'Active Tickers', v:String(new Set(trades.map(t=>t.ticker)).size), c:'var(--text)' },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:10.5, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{l}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize:24, fontWeight:300, color:c }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr 1fr 2fr', gap:12, marginBottom:12, alignItems:'flex-end' }}>
            {[['Ticker','ticker','AAPL'],['Qty','qty','100'],['Price ($)','price','150.00'],['Notes','notes','Setup rationale...']].map(([l,k,p]:[string,string,string],i)=>(
              i<3?<div key={k}><div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div><input className="qd-input" placeholder={p} value={(form as any)[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/></div>:null
            ))}
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Side</div>
              <div style={{ display:'flex', gap:6 }}>
                {(['BUY','SELL'] as const).map(s=>(
                  <button key={s} onClick={()=>setForm(x=>({...x,side:s}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${form.side===s?(s==='BUY'?'rgba(13,203,125,0.3)':'rgba(245,64,96,0.3)'):'var(--b1)'}`, background: form.side===s?(s==='BUY'?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)'):'var(--bg3)', color: form.side===s?(s==='BUY'?'var(--green)':'var(--red)'):'var(--text2)', fontSize:12.5, fontWeight:600, cursor:'pointer' }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginBottom:12 }}><div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Notes</div><input className="qd-input" placeholder="Setup rationale, thesis, notes..." value={form.notes} onChange={e=>setForm(x=>({...x,notes:e.target.value}))}/></div>
          <button onClick={add} style={{ padding:'8px 20px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>Save Trade</button>
        </div>
      )}

      <SectionHeader title={`Trade Log (${trades.length})`} />
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
        <table className="qd-table">
          <thead><tr><th>Date</th><th>Ticker</th><th>Side</th><th>Qty</th><th>Price</th><th>Value</th><th>Notes</th></tr></thead>
          <tbody>
            {trades.map(t=>(
              <tr key={t.id}>
                <td style={{ color:'var(--text2)', fontSize:11.5 }}>{t.date}</td>
                <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:'var(--accent2)' }}>{t.ticker}</span></td>
                <td><span style={{ fontFamily:'var(--fm)', fontSize:11, fontWeight:700, padding:'2px 7px', borderRadius:4, color:t.side==='BUY'?'var(--green)':'var(--red)', background:t.side==='BUY'?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)' }}>{t.side}</span></td>
                <td className="mono">{t.qty}</td>
                <td className="mono">${t.price.toFixed(2)}</td>
                <td className="mono">${(t.qty*t.price).toLocaleString('en',{maximumFractionDigits:0})}</td>
                <td style={{ color:'var(--text2)', fontSize:11.5, maxWidth:200 }}>{t.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
