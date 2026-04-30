'use client'
import { useState, useEffect } from 'react'
import { Plus, Bell, BellOff, Trash2, TrendingUp, TrendingDown, Activity } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'

type AlertCondition = 'above' | 'below'
type AlertStatus    = 'active' | 'triggered' | 'paused'

type PriceAlert = {
  id: string
  ticker: string
  condition: AlertCondition
  targetPrice: number
  currentPrice: number | null
  status: AlertStatus
  createdAt: string
  note: string
}

const SAMPLE_ALERTS: PriceAlert[] = [
  { id:'1', ticker:'AAPL',  condition:'above', targetPrice:220,  currentPrice:213.49, status:'active',    createdAt:'2026-04-28', note:'Breakout above key resistance' },
  { id:'2', ticker:'NVDA',  condition:'below', targetPrice:800,  currentPrice:875.20, status:'active',    createdAt:'2026-04-27', note:'Dip buy level — support zone' },
  { id:'3', ticker:'TSLA',  condition:'above', targetPrice:300,  currentPrice:302.15, status:'triggered', createdAt:'2026-04-25', note:'Momentum breakout target' },
  { id:'4', ticker:'MSFT',  condition:'below', targetPrice:380,  currentPrice:412.30, status:'active',    createdAt:'2026-04-26', note:'Stop loss level' },
  { id:'5', ticker:'GOOGL', condition:'above', targetPrice:190,  currentPrice:178.90, status:'paused',    createdAt:'2026-04-20', note:'Q2 earnings breakout play' },
]

function pct(current: number | null, target: number) {
  if (!current) return null
  return ((current - target) / target) * 100
}

export default function AlertsPage() {
  const [alerts, setAlerts]     = useState<PriceAlert[]>(SAMPLE_ALERTS)
  const [showForm, setShowForm] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [form, setForm] = useState({ ticker:'', condition:'above' as AlertCondition, targetPrice:'', note:'' })
  const [filter, setFilter] = useState<'all' | AlertStatus>('all')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const addAlert = () => {
    if (!form.ticker || !form.targetPrice) return
    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      ticker: form.ticker.toUpperCase(),
      condition: form.condition,
      targetPrice: +form.targetPrice,
      currentPrice: null,
      status: 'active',
      createdAt: new Date().toISOString().slice(0,10),
      note: form.note,
    }
    setAlerts(a => [newAlert, ...a])
    setForm({ ticker:'', condition:'above', targetPrice:'', note:'' })
    setShowForm(false)
  }

  const deleteAlert = (id: string) => setAlerts(a => a.filter(x => x.id !== id))

  const togglePause = (id: string) => setAlerts(a => a.map(x =>
    x.id === id ? { ...x, status: x.status === 'paused' ? 'active' : 'paused' } : x
  ))

  const filtered = alerts.filter(a => filter === 'all' || a.status === filter)

  const counts = {
    active:    alerts.filter(a => a.status === 'active').length,
    triggered: alerts.filter(a => a.status === 'triggered').length,
    paused:    alerts.filter(a => a.status === 'paused').length,
  }

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Price Alerts</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Set price thresholds · Monitor targets · Track triggers</div>
        </div>
        <button onClick={() => setShowForm(x => !x)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 0 20px rgba(45,127,249,0.25)' }}>
          <Plus size={14}/> New Alert
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
        {[
          { label:'Active',    value:counts.active,    color:'var(--accent2)', dot:'#2d7ff9' },
          { label:'Triggered', value:counts.triggered, color:'var(--green)',   dot:'#0dcb7d' },
          { label:'Paused',    value:counts.paused,    color:'var(--text2)',   dot:'#304560' },
        ].map(({ label, value, color, dot }, i) => (
          <div key={i} style={{ padding:'16px 20px', background:'var(--bg2)', borderRight: i<2?'1px solid rgba(255,255,255,0.04)':'none', textAlign:'center' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700, marginBottom:8 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:dot }}/>
              {label}
            </div>
            <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?20:26, fontWeight:300, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:14, color:'var(--text)' }}>New Price Alert</div>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 2fr', gap:12, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Ticker</div>
              <input className="qd-input" placeholder="AAPL" value={form.ticker} onChange={e => setForm(x => ({ ...x, ticker: e.target.value.toUpperCase() }))} style={{ textTransform:'uppercase' }}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Condition</div>
              <div style={{ display:'flex', gap:6 }}>
                {(['above','below'] as const).map(c => (
                  <button key={c} onClick={() => setForm(x => ({ ...x, condition:c }))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${form.condition===c?(c==='above'?'rgba(13,203,125,0.4)':'rgba(245,64,96,0.4)'):'var(--b1)'}`, background: form.condition===c?(c==='above'?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)'):'var(--bg3)', color: form.condition===c?(c==='above'?'var(--green)':'var(--red)'):'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    {c==='above' ? <TrendingUp size={11}/> : <TrendingDown size={11}/>} {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Target Price ($)</div>
              <input className="qd-input" placeholder="220.00" type="number" value={form.targetPrice} onChange={e => setForm(x => ({ ...x, targetPrice: e.target.value }))}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Note (optional)</div>
              <input className="qd-input" placeholder="Breakout target, stop loss, etc." value={form.note} onChange={e => setForm(x => ({ ...x, note: e.target.value }))}/>
            </div>
          </div>

          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addAlert} disabled={!form.ticker || !form.targetPrice} style={{ padding:'9px 22px', borderRadius:8, background:!form.ticker||!form.targetPrice?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:!form.ticker||!form.targetPrice?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7 }}>
              <Bell size={13}/> Set Alert
            </button>
            <button onClick={() => setShowForm(false)} style={{ padding:'9px 18px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
        {(['all','active','triggered','paused'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding:'6px 16px', borderRadius:7, border:'none', cursor:'pointer', background:filter===f?'var(--bg5)':'transparent', color:filter===f?'var(--text)':'var(--text2)', fontSize:12, fontWeight:filter===f?600:400, transition:'all 0.14s', textTransform:'capitalize', boxShadow:filter===f?'0 2px 8px rgba(0,0,0,0.3)':'none' }}>
            {f === 'all' ? `All (${alerts.length})` : `${f.charAt(0).toUpperCase()+f.slice(1)} (${counts[f]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {filtered.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🔔</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>No alerts {filter !== 'all' ? `with status "${filter}"` : 'yet'}</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Click New Alert to set your first price threshold.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(alert => {
            const dist = pct(alert.currentPrice, alert.targetPrice)
            const isTriggered = alert.status === 'triggered'
            const isPaused    = alert.status === 'paused'
            const isAbove     = alert.condition === 'above'
            const progress    = alert.currentPrice
              ? Math.min(100, Math.max(0, isAbove
                  ? (alert.currentPrice / alert.targetPrice) * 100
                  : (alert.targetPrice / alert.currentPrice) * 100))
              : 0

            return (
              <div key={alert.id} style={{
                background: isTriggered ? 'rgba(13,203,125,0.04)' : 'var(--bg2)',
                border: `1px solid ${isTriggered ? 'rgba(13,203,125,0.2)' : isPaused ? 'var(--b1)' : 'var(--b1)'}`,
                borderRadius:14, padding:'16px 20px',
                opacity: isPaused ? 0.6 : 1,
                transition:'all 0.15s',
              }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap: isMobile?'wrap':'nowrap' }}>

                  {/* Left — ticker + details */}
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:600, color:'var(--accent2)' }}>{alert.ticker}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12.5, color: isAbove?'var(--green)':'var(--red)', fontWeight:600 }}>
                        {isAbove ? <TrendingUp size={13}/> : <TrendingDown size={13}/>}
                        {isAbove ? 'Price above' : 'Price below'} <span style={{ fontFamily:'var(--fm)' }}>${alert.targetPrice.toFixed(2)}</span>
                      </div>
                      {isTriggered && <Badge variant="green" dot>Triggered</Badge>}
                      {isPaused    && <Badge variant="ghost">Paused</Badge>}
                      {!isTriggered && !isPaused && <Badge variant="blue" dot>Active</Badge>}
                    </div>

                    {/* Price progress bar */}
                    {alert.currentPrice && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:5 }}>
                          <span>Current: <span style={{ fontFamily:'var(--fm)', color:'var(--text)' }}>${alert.currentPrice.toFixed(2)}</span></span>
                          <span>Target: <span style={{ fontFamily:'var(--fm)', color: isAbove?'var(--green)':'var(--red)' }}>${alert.targetPrice.toFixed(2)}</span></span>
                        </div>
                        <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:4, width:`${progress}%`, background: isTriggered ? 'var(--green)' : isAbove ? 'var(--accent2)' : 'var(--red)', borderRadius:2, transition:'width 0.4s ease' }}/>
                        </div>
                        {dist !== null && (
                          <div style={{ fontSize:11, color: Math.abs(dist) < 5 ? 'var(--amber)' : 'var(--text3)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                            <Activity size={10}/>
                            {Math.abs(dist) < 5 && '⚠ '}{Math.abs(dist).toFixed(1)}% {dist >= 0 ? 'above' : 'below'} target
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      {alert.note && <div style={{ fontSize:12, color:'var(--text2)' }}>"{alert.note}"</div>}
                      <div style={{ fontSize:11, color:'var(--text3)' }}>Set {alert.createdAt}</div>
                    </div>
                  </div>

                  {/* Right — actions */}
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={() => togglePause(alert.id)} title={isPaused?'Resume':'Pause'} style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s', display:'flex', alignItems:'center' }}
                      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b2)';el.style.color='var(--text)'}}
                      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
                    >
                      {isPaused ? <Bell size={13}/> : <BellOff size={13}/>}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} title="Delete" style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s', display:'flex', alignItems:'center' }}
                      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(245,64,96,0.3)';el.style.color='var(--red)'}}
                      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
                    >
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Info box */}
      <div style={{ marginTop:24, background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
        <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:10 }}>How alerts work</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {[
            'Set a ticker, condition (above/below), and target price',
            'Alerts are monitored against live market data when you\'re in the app',
            'Yellow warning appears when price is within 5% of your target',
            'Triggered alerts stay visible so you can review your trade setups',
            'Pause alerts temporarily without deleting them',
          ].map((tip, i) => (
            <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
              <div style={{ width:18, height:18, borderRadius:'50%', background:'var(--accent3)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--accent2)', flexShrink:0, marginTop:1 }}>{i+1}</div>
              <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.55 }}>{tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}