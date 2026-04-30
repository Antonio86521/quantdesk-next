'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Bell, BellOff, Trash2, TrendingUp, TrendingDown, Activity, RefreshCw } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { useAuth } from '@/context/AuthContext'

type AlertCondition = 'above' | 'below'
type AlertStatus    = 'active' | 'triggered' | 'paused'

type PriceAlert = {
  id: string
  user_id: string
  ticker: string
  condition: AlertCondition
  target_price: number
  current_price: number | null
  status: AlertStatus
  note: string
  triggered_at: string | null
  created_at: string
}

function pctFromTarget(current: number | null, target: number) {
  if (!current) return null
  return ((current - target) / target) * 100
}

export default function AlertsPage() {
  const { user } = useAuth()
  const [alerts, setAlerts]         = useState<PriceAlert[]>([])
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [isMobile, setIsMobile]     = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [filter, setFilter]         = useState<'all' | AlertStatus>('all')
  const [form, setForm] = useState({ ticker:'', condition:'above' as AlertCondition, targetPrice:'', note:'' })
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Check if push already enabled
  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      navigator.serviceWorker.ready.then(reg => {
        reg.pushManager.getSubscription().then(sub => {
          setPushEnabled(!!sub)
        })
      })
    }
  }, [])

  const loadAlerts = useCallback(async () => {
    if (!user) return
    try {
      const res = await fetch('/api/alerts')
      const json = await res.json()
      if (json.data) setAlerts(json.data)
    } catch (e) {
      console.error('Failed to load alerts:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadAlerts()
    // Poll every 60s to reflect scheduler updates
    const id = setInterval(loadAlerts, 60_000)
    return () => clearInterval(id)
  }, [loadAlerts])

  // Register service worker + subscribe to push
  const enablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Push notifications are not supported in this browser.')
      return
    }
    setPushLoading(true)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Please allow notifications to receive push alerts.')
        setPushLoading(false)
        return
      }

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      await fetch('/api/alerts/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      })

      setPushEnabled(true)
    } catch (e) {
      console.error('Push subscribe error:', e)
      alert('Failed to enable push notifications.')
    } finally {
      setPushLoading(false)
    }
  }

  const addAlert = async () => {
    if (!form.ticker || !form.targetPrice) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker:      form.ticker.toUpperCase(),
          condition:   form.condition,
          targetPrice: +form.targetPrice,
          note:        form.note,
        }),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      setAlerts(a => [json.data, ...a])
      setForm({ ticker:'', condition:'above', targetPrice:'', note:'' })
      setShowForm(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const deleteAlert = async (id: string) => {
    setAlerts(a => a.filter(x => x.id !== id))
    await fetch(`/api/alerts/${id}`, { method: 'DELETE' })
  }

  const togglePause = async (alert: PriceAlert) => {
    const newStatus = alert.status === 'paused' ? 'active' : 'paused'
    setAlerts(a => a.map(x => x.id === alert.id ? { ...x, status: newStatus } : x))
    await fetch(`/api/alerts/${alert.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  const filtered = alerts.filter(a => filter === 'all' || a.status === filter)
  const counts = {
    active:    alerts.filter(a => a.status === 'active').length,
    triggered: alerts.filter(a => a.status === 'triggered').length,
    paused:    alerts.filter(a => a.status === 'paused').length,
  }

  if (!user) {
    return (
      <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>
        <div style={{ margin:'24px 0', background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🔔</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Sign in to use Alerts</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Alerts are saved to your account and checked every minute.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Price Alerts</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Checked every 60s · Email + push notifications · Saved to your account</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {/* Push enable button */}
          {!pushEnabled && (
            <button onClick={enablePush} disabled={pushLoading} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 16px', borderRadius:9, background:'rgba(13,203,125,0.1)', border:'1px solid rgba(13,203,125,0.25)', color:'var(--green)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              {pushLoading ? <RefreshCw size={13} style={{ animation:'spin 1s linear infinite' }}/> : <Bell size={13}/>}
              {pushLoading ? 'Enabling...' : 'Enable Push'}
            </button>
          )}
          {pushEnabled && (
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, background:'rgba(13,203,125,0.08)', border:'1px solid rgba(13,203,125,0.2)', color:'var(--green)', fontSize:12, fontWeight:600 }}>
              <Bell size={12}/> Push On
            </div>
          )}
          <button onClick={()=>setShowForm(x=>!x)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 0 20px rgba(45,127,249,0.25)' }}>
            <Plus size={14}/> New Alert
          </button>
        </div>
      </div>

      {/* Summary strip */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden', marginBottom:20 }}>
        {[
          { label:'Active',    value:counts.active,    color:'var(--accent2)', dot:'#2d7ff9' },
          { label:'Triggered', value:counts.triggered, color:'var(--green)',   dot:'#0dcb7d' },
          { label:'Paused',    value:counts.paused,    color:'var(--text2)',   dot:'#304560' },
        ].map(({ label, value, color, dot }, i) => (
          <div key={i} style={{ padding:'16px 20px', background:'var(--bg2)', borderRight:i<2?'1px solid rgba(255,255,255,0.04)':'none', textAlign:'center' }}>
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
          <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:14 }}>New Price Alert</div>
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr 1fr':'1fr 1fr 1fr 2fr', gap:12, marginBottom:12 }}>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Ticker</div>
              <input className="qd-input" placeholder="AAPL" value={form.ticker} onChange={e=>setForm(x=>({...x,ticker:e.target.value.toUpperCase()}))} style={{ textTransform:'uppercase' }}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Condition</div>
              <div style={{ display:'flex', gap:6 }}>
                {(['above','below'] as const).map(c=>(
                  <button key={c} onClick={()=>setForm(x=>({...x,condition:c}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${form.condition===c?(c==='above'?'rgba(13,203,125,0.4)':'rgba(245,64,96,0.4)'):'var(--b1)'}`, background:form.condition===c?(c==='above'?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)'):'var(--bg3)', color:form.condition===c?(c==='above'?'var(--green)':'var(--red)'):'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:4 }}>
                    {c==='above'?<TrendingUp size={11}/>:<TrendingDown size={11}/>} {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Target Price ($)</div>
              <input className="qd-input" placeholder="220.00" type="number" value={form.targetPrice} onChange={e=>setForm(x=>({...x,targetPrice:e.target.value}))}/>
            </div>
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Note (optional)</div>
              <input className="qd-input" placeholder="Breakout target, stop loss..." value={form.note} onChange={e=>setForm(x=>({...x,note:e.target.value}))}/>
            </div>
          </div>
          {error && <div style={{ marginBottom:12, fontSize:12.5, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:8, padding:'8px 12px' }}>{error}</div>}
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={addAlert} disabled={saving||!form.ticker||!form.targetPrice} style={{ padding:'9px 22px', borderRadius:8, background:saving||!form.ticker||!form.targetPrice?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7 }}>
              {saving?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<Bell size={13}/>}
              {saving?'Saving...':'Set Alert'}
            </button>
            <button onClick={()=>setShowForm(false)} style={{ padding:'9px 18px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
        {(['all','active','triggered','paused'] as const).map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{ padding:'6px 16px', borderRadius:7, border:'none', cursor:'pointer', background:filter===f?'var(--bg5)':'transparent', color:filter===f?'var(--text)':'var(--text2)', fontSize:12, fontWeight:filter===f?600:400, transition:'all 0.14s', textTransform:'capitalize', boxShadow:filter===f?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap' }}>
            {f==='all'?`All (${alerts.length})`:`${f.charAt(0).toUpperCase()+f.slice(1)} (${counts[f as AlertStatus]})`}
          </button>
        ))}
      </div>

      {/* Alert list */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:100, borderRadius:14 }} className="skeleton"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🔔</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>No alerts {filter!=='all'?`with status "${filter}"`:'yet'}</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Click New Alert to set your first price threshold.</div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(alert => {
            const dist     = pctFromTarget(alert.current_price, alert.target_price)
            const isTriggered = alert.status === 'triggered'
            const isPaused    = alert.status === 'paused'
            const isAbove     = alert.condition === 'above'
            const progress    = alert.current_price
              ? Math.min(100, Math.max(0, isAbove
                  ? (alert.current_price / alert.target_price) * 100
                  : (alert.target_price  / alert.current_price) * 100))
              : 0
            const isClose = dist !== null && Math.abs(dist) < 5

            return (
              <div key={alert.id} style={{ background:isTriggered?'rgba(13,203,125,0.04)':'var(--bg2)', border:`1px solid ${isTriggered?'rgba(13,203,125,0.2)':'var(--b1)'}`, borderRadius:14, padding:'16px 20px', opacity:isPaused?0.6:1, transition:'all 0.15s' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, flexWrap: isMobile?'wrap':'nowrap' }}>

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:600, color:'var(--accent2)' }}>{alert.ticker}</div>
                      <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12.5, color:isAbove?'var(--green)':'var(--red)', fontWeight:600 }}>
                        {isAbove?<TrendingUp size={13}/>:<TrendingDown size={13}/>}
                        {isAbove?'Price above':'Price below'} <span style={{ fontFamily:'var(--fm)' }}>${alert.target_price.toFixed(2)}</span>
                      </div>
                      {isTriggered && <Badge variant="green" dot>Triggered</Badge>}
                      {isPaused    && <Badge variant="ghost">Paused</Badge>}
                      {!isTriggered && !isPaused && <Badge variant="blue" dot>Active</Badge>}
                    </div>

                    {alert.current_price && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--text3)', marginBottom:5 }}>
                          <span>Current: <span style={{ fontFamily:'var(--fm)', color:'var(--text)' }}>${alert.current_price.toFixed(2)}</span></span>
                          <span>Target: <span style={{ fontFamily:'var(--fm)', color:isAbove?'var(--green)':'var(--red)' }}>${alert.target_price.toFixed(2)}</span></span>
                        </div>
                        <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:4, width:`${progress}%`, background:isTriggered?'var(--green)':isClose?'var(--amber)':isAbove?'var(--accent2)':'var(--red)', borderRadius:2, transition:'width 0.4s ease' }}/>
                        </div>
                        {dist !== null && (
                          <div style={{ fontSize:11, color:isClose?'var(--amber)':'var(--text3)', marginTop:4, display:'flex', alignItems:'center', gap:4 }}>
                            <Activity size={10}/>
                            {isClose && '⚠ '}{Math.abs(dist).toFixed(1)}% {dist>=0?'above':'below'} target
                            {isTriggered && alert.triggered_at && <span style={{ color:'var(--green)', marginLeft:8 }}>✅ Triggered {new Date(alert.triggered_at).toLocaleDateString()}</span>}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                      {alert.note && <div style={{ fontSize:12, color:'var(--text2)' }}>"{alert.note}"</div>}
                      <div style={{ fontSize:11, color:'var(--text3)' }}>Set {alert.created_at?.slice(0,10)}</div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button onClick={()=>togglePause(alert)} title={isPaused?'Resume':'Pause'} style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s', display:'flex', alignItems:'center' }}
                      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b2)';el.style.color='var(--text)'}}
                      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}
                    >
                      {isPaused?<Bell size={13}/>:<BellOff size={13}/>}
                    </button>
                    <button onClick={()=>deleteAlert(alert.id)} title="Delete" style={{ padding:'8px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', transition:'all 0.14s', display:'flex', alignItems:'center' }}
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
    </div>
  )
}

// Helper — converts VAPID public key to ArrayBuffer
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray.buffer
}