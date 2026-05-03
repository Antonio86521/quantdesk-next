'use client'
import { useState, useEffect } from 'react'
import {
  Search, TrendingUp, TrendingDown, Minus, RefreshCw,
  AlertTriangle, FileText, Activity, BarChart3, Shield,
  Zap, ChevronRight, Clock, BookOpen,
} from 'lucide-react'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const QUICK_TICKERS = ['AAPL','MSFT','NVDA','GOOGL','TSLA','META','AMZN','JPM','SPY','BRK-B']

// ── Score helpers ─────────────────────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 60)  return '#0dcb7d'
  if (s >= 20)  return '#5ba3f5'
  if (s >= -20) return '#f0a500'
  if (s >= -60) return '#f0836a'
  return '#f54060'
}
function scoreLabel(s: number) {
  if (s >= 60)  return 'Strong Buy'
  if (s >= 20)  return 'Bullish'
  if (s >= -20) return 'Neutral'
  if (s >= -60) return 'Bearish'
  return 'Strong Sell'
}
function scoreIcon(s: number) {
  if (s > 10)  return TrendingUp
  if (s < -10) return TrendingDown
  return Minus
}

// ── Gauge ─────────────────────────────────────────────────────────────────────
function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score))
  const pct     = ((clamped + 100) / 200) * 100
  const color   = scoreColor(clamped)
  const label   = scoreLabel(clamped)
  const arcLen  = 220

  return (
    <div style={{ position:'relative', width:200, height:108, margin:'0 auto' }}>
      <svg viewBox="0 0 200 108" style={{ width:'100%', height:'100%' }}>
        {/* Track */}
        <path d="M 16 100 A 84 84 0 0 1 184 100" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="14" strokeLinecap="round"/>
        {/* Zones */}
        <path d="M 16 100 A 84 84 0 0 1 184 100" fill="none" stroke="url(#zoneGrad)" strokeWidth="14" strokeLinecap="round" opacity="0.15"/>
        {/* Fill */}
        <path
          d="M 16 100 A 84 84 0 0 1 184 100"
          fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
          strokeDasharray={`${(pct/100)*arcLen} ${arcLen}`}
          style={{ transition:'all 0.9s cubic-bezier(0.34,1.56,0.64,1)', filter:`drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Tick marks */}
        {[-100,-60,-20,20,60,100].map((v,i) => {
          const p = ((v+100)/200)
          const angle = Math.PI - p*Math.PI
          const ix = 100 + 84*Math.cos(angle)
          const iy = 100 - 84*Math.sin(angle)
          const ox = 100 + 72*Math.cos(angle)
          const oy = 100 - 72*Math.sin(angle)
          return <line key={i} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
        })}
        {/* Needle */}
        <line
          x1="100" y1="100"
          x2={100 + 66 * Math.cos(Math.PI - (pct/100)*Math.PI)}
          y2={100 - 66 * Math.sin((pct/100)*Math.PI)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition:'all 0.9s cubic-bezier(0.34,1.56,0.64,1)' }}
        />
        <circle cx="100" cy="100" r="5" fill={color} style={{ filter:`drop-shadow(0 0 4px ${color})` }}/>
        <circle cx="100" cy="100" r="3" fill="#07090e"/>
        {/* Zone labels */}
        <text x="18"  y="108" fontSize="7" fill="rgba(255,255,255,0.25)" textAnchor="middle">−100</text>
        <text x="100" y="14"  fontSize="7" fill="rgba(255,255,255,0.25)" textAnchor="middle">0</text>
        <text x="182" y="108" fontSize="7" fill="rgba(255,255,255,0.25)" textAnchor="middle">+100</text>
        <defs>
          <linearGradient id="zoneGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#f54060"/>
            <stop offset="40%"  stopColor="#f0a500"/>
            <stop offset="60%"  stopColor="#f0a500"/>
            <stop offset="100%" stopColor="#0dcb7d"/>
          </linearGradient>
        </defs>
      </svg>
      {/* Center label */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none' }}>
        <div style={{ fontFamily:'var(--fm)', fontSize:32, fontWeight:200, color, lineHeight:1, letterSpacing:'-1px' }}>{clamped>0?'+':''}{clamped}</div>
        <div style={{ fontSize:10.5, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginTop:2 }}>{label}</div>
      </div>
    </div>
  )
}

// ── Signal Bar ────────────────────────────────────────────────────────────────
function SignalBar({ label, value, max = 100, color, icon }: { label:string; value:number; max?:number; color:string; icon?:string }) {
  const pct = Math.min(100, Math.max(0, (value/max)*100))
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:11.5, color:'var(--text2)', display:'flex', alignItems:'center', gap:5 }}>{icon && <span>{icon}</span>}{label}</span>
        <span style={{ fontFamily:'var(--fm)', fontSize:12, color, fontWeight:600 }}>{value.toFixed(0)}{max!==100?'':''}</span>
      </div>
      <div style={{ height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:5, width:`${pct}%`, background:`linear-gradient(90deg,${color}88,${color})`, borderRadius:3, transition:'width 0.8s ease' }}/>
      </div>
    </div>
  )
}

// ── Sentiment Card ────────────────────────────────────────────────────────────
function SentimentCard({ data, onRefresh, loading, mob }: { data:any; onRefresh:()=>void; loading:boolean; mob:boolean }) {
  const s     = data.sentiment
  const pd    = data.price_data
  const score = s.sentiment_score || 0
  const color = scoreColor(score)
  const Icon  = scoreIcon(score)
  const [activeTab, setActiveTab] = useState<'overview'|'signals'|'filings'|'technicals'>('overview')

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, overflow:'hidden' }}>
      {/* Accent bar */}
      <div style={{ height:3, background:`linear-gradient(90deg,${color},${color}00)` }}/>

      <div style={{ padding: mob?'18px 16px':'24px' }}>

        {/* Header row */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
              <span style={{ fontFamily:'var(--fm)', fontSize:mob?22:28, fontWeight:700, color:'var(--accent2)' }}>{data.ticker}</span>
              <span style={{ padding:'4px 12px', borderRadius:20, background:`${color}18`, border:`1px solid ${color}33`, color, fontSize:11.5, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
                <Icon size={11} strokeWidth={2}/> {s.sentiment_label || scoreLabel(score)}
              </span>
              {pd.price && (
                <span style={{ fontFamily:'var(--fm)', fontSize:14, color:'var(--text2)' }}>
                  ${pd.price?.toFixed(2)}
                  {pd.return_3mo !== undefined && (
                    <span style={{ marginLeft:8, color:pd.return_3mo>=0?'var(--green)':'var(--red)', fontSize:12 }}>
                      {pd.return_3mo>=0?'+':''}{pd.return_3mo?.toFixed(2)}% 3mo
                    </span>
                  )}
                </span>
              )}
            </div>
            <div style={{ fontSize:11.5, color:'var(--text3)', display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10}/> {new Date(data.generated).toLocaleTimeString()} · AI-generated · Educational only
            </div>
          </div>
          <button onClick={onRefresh} disabled={loading} style={{ padding:'7px 12px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <RefreshCw size={12} style={{ animation:loading?'spin 0.8s linear infinite':'none' }}/> Refresh
          </button>
        </div>

        {/* Gauge */}
        <div style={{ marginBottom:20 }}>
          <ScoreGauge score={score}/>
        </div>

        {/* Meta badges */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:20 }}>
          {[
            { label:'Confidence',    value:s.confidence,    icon:'🎯' },
            { label:'Momentum',      value:s.momentum,      icon:'📈' },
            { label:'Data Quality',  value:s.data_quality,  icon:'📊' },
          ].map(({ label, value, icon }) => (
            <div key={label} style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'10px 12px', textAlign:'center' }}>
              <div style={{ fontSize:16, marginBottom:4 }}>{icon}</div>
              <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:4 }}>{label}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text)' }}>{value || '—'}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:2, background:'var(--bg3)', borderRadius:9, padding:3, marginBottom:18, overflowX:'auto' }}>
          {([
            { key:'overview',   label:'Overview',   icon:<BarChart3 size={11}/> },
            { key:'signals',    label:'Signals',    icon:<Activity size={11}/> },
            { key:'filings',    label:'Filings',    icon:<FileText size={11}/> },
            { key:'technicals', label:'Technicals', icon:<Zap size={11}/> },
          ] as const).map(({ key, label, icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{ flex:1, padding:mob?'6px 8px':'6px 14px', borderRadius:7, border:'none', cursor:'pointer', background:activeTab===key?'var(--bg5)':'transparent', color:activeTab===key?'var(--text)':'var(--text3)', fontSize:11.5, fontWeight:activeTab===key?600:400, display:'flex', alignItems:'center', justifyContent:'center', gap:5, whiteSpace:'nowrap', transition:'all 0.14s' }}>
              {icon} {label}
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && (
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {/* Analyst note */}
            <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.16)', borderRadius:12, padding:'16px' }}>
              <div style={{ fontSize:10, color:'var(--accent2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:8, display:'flex', alignItems:'center', gap:5 }}>
                <BookOpen size={10}/> AI Analyst Note
              </div>
              <div style={{ fontSize:13.5, color:'var(--text)', lineHeight:1.75 }}>{s.analyst_note}</div>
            </div>

            {/* Themes + Risks side by side */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div style={{ background:'var(--bg3)', borderRadius:12, padding:'14px' }}>
                <div style={{ fontSize:10, color:'#0dcb7d', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                  ✦ Key Themes
                </div>
                {s.key_themes?.map((t: string, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#0dcb7d', flexShrink:0, marginTop:5 }}/>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.55 }}>{t}</div>
                  </div>
                ))}
              </div>
              <div style={{ background:'var(--bg3)', borderRadius:12, padding:'14px' }}>
                <div style={{ fontSize:10, color:'#f54060', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, display:'flex', alignItems:'center', gap:5 }}>
                  ⚠ Risk Factors
                </div>
                {s.risk_factors?.map((r: string, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                    <div style={{ width:5, height:5, borderRadius:'50%', background:'#f54060', flexShrink:0, marginTop:5 }}/>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.55 }}>{r}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {[
                { label:'SEC Filings',    value:`${s.filing_count || '—'} recent`,    color:'var(--accent2)' },
                { label:'Price 3mo',      value:pd.return_3mo!=null?`${pd.return_3mo>=0?'+':''}${pd.return_3mo?.toFixed(2)}%`:'—', color:pd.return_3mo>=0?'var(--green)':'var(--red)' },
                { label:'RSI Signal',     value:pd.rsi?`${pd.rsi.toFixed(1)}`:'—',   color:pd.rsi>70?'var(--red)':pd.rsi<30?'var(--green)':'var(--text)' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:17, fontWeight:300, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SIGNALS TAB ── */}
        {activeTab === 'signals' && (
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg3)', borderRadius:12, padding:'16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Signal Breakdown</div>
              <SignalBar label="Overall Sentiment" value={score+100} max={200} color={scoreColor(score)} icon="🎯"/>
              {pd.return_3mo != null && <SignalBar label="Price Momentum (3mo)" value={Math.min(100,Math.max(0,(pd.return_3mo+50)*1))} color={pd.return_3mo>=0?'#0dcb7d':'#f54060'} icon="📈"/>}
              {pd.rsi && <SignalBar label="RSI Signal" value={pd.rsi} color={pd.rsi>70?'#f54060':pd.rsi<30?'#0dcb7d':'#f0a500'} icon="📊"/>}
              {pd.vol && <SignalBar label="Volatility (Ann.)" value={Math.min(100,pd.vol)} color={pd.vol>40?'#f54060':pd.vol>20?'#f0a500':'#0dcb7d'} icon="⚡"/>}
            </div>

            {/* Score interpretation */}
            <div style={{ background:'var(--bg3)', borderRadius:12, padding:'16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Score Legend</div>
              {[
                { range:'+60 → +100', label:'Strong Buy',  color:'#0dcb7d', desc:'Very bullish filings + strong price momentum' },
                { range:'+20 → +60',  label:'Bullish',     color:'#5ba3f5', desc:'Positive outlook with moderate confidence' },
                { range:'-20 → +20',  label:'Neutral',     color:'#f0a500', desc:'Mixed signals — insufficient directional bias' },
                { range:'-60 → -20',  label:'Bearish',     color:'#f0836a', desc:'Negative language in filings, weak momentum' },
                { range:'-100 → -60', label:'Strong Sell', color:'#f54060', desc:'Significant risk language, poor fundamentals' },
              ].map(({ range, label, color, desc }) => (
                <div key={label} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'9px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ width:3, height:40, borderRadius:2, background:color, flexShrink:0, marginTop:2 }}/>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                      <span style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text3)' }}>{range}</span>
                      <span style={{ fontSize:12, fontWeight:700, color }}>{label}</span>
                    </div>
                    <div style={{ fontSize:11.5, color:'var(--text3)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── FILINGS TAB ── */}
        {activeTab === 'filings' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'rgba(45,127,249,0.05)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:10, padding:'12px 14px', fontSize:12.5, color:'var(--text2)', lineHeight:1.65 }}>
              <strong style={{ color:'var(--accent2)' }}>How filings are analysed:</strong> The AI reads 10-K (annual), 10-Q (quarterly) and 8-K (material event) reports filed with the SEC over the last 180 days. It scores language tone, identifies risk disclosures, management commentary and forward guidance.
            </div>

            {data.filings?.length > 0 ? (
              <div style={{ background:'var(--bg3)', borderRadius:12, overflow:'hidden' }}>
                {data.filings.map((f: any, i: number) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom:i<data.filings.length-1?'1px solid rgba(255,255,255,0.05)':'none' }}>
                    <div style={{ padding:'3px 10px', borderRadius:5, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', fontSize:11, fontFamily:'var(--fm)', fontWeight:700, color:'var(--accent2)', flexShrink:0 }}>{f.form}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12.5, color:'var(--text)', marginBottom:2 }}>{f.date || '—'}</div>
                      {f.excerpt && <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.5 }}>{f.excerpt}</div>}
                    </div>
                    <ChevronRight size={13} color="var(--text4)"/>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding:32, textAlign:'center', color:'var(--text3)', fontSize:13 }}>
                No recent filings found for {data.ticker} in the last 180 days.
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[
                { form:'10-K', desc:'Annual report — comprehensive overview of company performance, risk factors, financials.' },
                { form:'10-Q', desc:'Quarterly report — updated financials and management commentary every 3 months.' },
                { form:'8-K',  desc:'Material event — earnings, M&A, leadership changes. Often market-moving.' },
                { form:'DEF 14A', desc:'Proxy statement — executive compensation, shareholder votes.' },
              ].map(({ form, desc }) => (
                <div key={form} style={{ background:'var(--bg3)', borderRadius:10, padding:'12px' }}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:12, fontWeight:700, color:'var(--accent2)', marginBottom:5 }}>{form}</div>
                  <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.55 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TECHNICALS TAB ── */}
        {activeTab === 'technicals' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
              {[
                { label:'Current Price',  value:pd.price?`$${pd.price?.toFixed(2)}`:'—',        color:'var(--text)',  desc:'Last close' },
                { label:'RSI (14-day)',   value:pd.rsi?pd.rsi.toFixed(1):'—',                    color:pd.rsi>70?'#f54060':pd.rsi<30?'#0dcb7d':'var(--text)', desc:pd.rsi>70?'Overbought':pd.rsi<30?'Oversold':'Neutral' },
                { label:'Ann. Volatility',value:pd.vol?`${pd.vol.toFixed(1)}%`:'—',               color:pd.vol>40?'#f54060':pd.vol>20?'#f0a500':'#0dcb7d', desc:pd.vol>40?'High vol':'Normal vol' },
                { label:'3mo Return',     value:pd.return_3mo!=null?`${pd.return_3mo>=0?'+':''}${pd.return_3mo?.toFixed(2)}%`:'—', color:pd.return_3mo>=0?'#0dcb7d':'#f54060', desc:'Price momentum' },
              ].map(({ label, value, color, desc }) => (
                <div key={label} style={{ background:'var(--bg3)', borderRadius:12, padding:'14px' }}>
                  <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:20, fontWeight:300, color, marginBottom:4 }}>{value}</div>
                  <div style={{ fontSize:10.5, color:'var(--text4)' }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* RSI explanation */}
            <div style={{ background:'var(--bg3)', borderRadius:12, padding:'16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Technical Context</div>
              {[
                { label:'RSI > 70',   color:'#f54060', note:'Overbought — price may be due for pullback. AI may discount bullish sentiment.' },
                { label:'RSI 40–70',  color:'#f0a500', note:'Neutral zone — RSI not adding strong directional signal.' },
                { label:'RSI < 30',   color:'#0dcb7d', note:'Oversold — potential reversal candidate. AI weighs against bearish filings.' },
                { label:'Vol > 40%',  color:'#f54060', note:'High volatility — wider range of outcomes. Confidence score may be lower.' },
                { label:'Vol < 20%',  color:'#0dcb7d', note:'Low volatility — more predictable price action. Higher confidence in signal.' },
              ].map(({ label, color, note },i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'8px 0', borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none' }}>
                  <span style={{ fontFamily:'var(--fm)', fontSize:11.5, color, fontWeight:600, flexShrink:0, minWidth:80 }}>{label}</span>
                  <span style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.55 }}>{note}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function SentimentPage() {
  const [ticker,  setTicker]  = useState('')
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [mob,     setMob]     = useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const analyse = async (t?: string) => {
    const target = (t || ticker).toUpperCase().trim()
    if (!target) return
    setLoading(true); setError(''); setData(null)
    try {
      const res  = await fetch(`${BASE}/api/sentiment/${target}`, {
        method:'GET',
        headers:{ 'Content-Type':'application/json' },
      })
      if (!res.ok) {
        const msg = await res.text().catch(() => `API error ${res.status}`)
        throw new Error(msg || `API error ${res.status}`)
      }
      const json = await res.json()
      setData(json)
      setHistory(h => [json, ...h.filter(x => x.ticker !== target)].slice(0, 8))
      setTicker(target)
    } catch(e: any) {
      setError(e.message || 'Failed to fetch sentiment. Check your backend is running.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: mob?'0 12px 100px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'20px 0 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8, flexWrap:'wrap' }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(124,92,252,0.15)', border:'1px solid rgba(124,92,252,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Activity size={15} color="var(--purple)" strokeWidth={1.5}/>
          </div>
          <h1 style={{ fontSize:mob?18:24, fontWeight:700, letterSpacing:'-0.5px' }}>Sentiment Alpha</h1>
          <span style={{ padding:'3px 10px', borderRadius:20, background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.2)', fontSize:10.5, color:'var(--purple)', fontWeight:700 }}>✦ AI-Powered</span>
        </div>
        <div style={{ fontSize:13, color:'var(--text3)', maxWidth:560, lineHeight:1.6 }}>
          LLM-powered sentiment scoring from SEC filings, price momentum and market data. Institutional-grade signals for any ticker.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: mob?'1fr':'1fr 300px', gap:16, alignItems:'start' }}>

        {/* ── LEFT ── */}
        <div>
          {/* Search box */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <div style={{ flex:1, position:'relative' }}>
                <Search size={13} color="var(--text3)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}/>
                <input
                  className="qd-input"
                  placeholder="Enter ticker — AAPL, MSFT, NVDA..."
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && analyse()}
                  style={{ paddingLeft:36, fontSize:14, fontFamily:'var(--fm)' }}
                />
              </div>
              <button onClick={() => analyse()} disabled={loading || !ticker} style={{ padding:'10px 20px', borderRadius:9, background:loading||!ticker?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading||!ticker?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap', boxShadow:loading||!ticker?'none':'0 0 20px rgba(124,92,252,0.3)' }}>
                {loading ? <><RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>{mob?'...':'Analysing...'}</> : 'Analyse'}
              </button>
            </div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:10.5, color:'var(--text4)', flexShrink:0 }}>Quick:</span>
              {QUICK_TICKERS.map(t => (
                <button key={t} onClick={() => analyse(t)} style={{ padding:'4px 10px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:11, fontFamily:'var(--fm)', cursor:'pointer', transition:'all 0.12s' }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(124,92,252,0.35)';el.style.color='var(--purple)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text2)'}}
                >{t}</button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{ background:'rgba(245,64,96,0.07)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', alignItems:'flex-start', gap:8, color:'var(--red)', fontSize:12.5, lineHeight:1.6 }}>
              <AlertTriangle size={14} style={{ flexShrink:0, marginTop:1 }}/>{error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, padding:mob?36:52, textAlign:'center' }}>
              <div style={{ width:44, height:44, borderRadius:'50%', border:'3px solid rgba(124,92,252,0.15)', borderTop:'3px solid var(--purple)', animation:'spin 0.8s linear infinite', margin:'0 auto 18px' }}/>
              <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Analysing {ticker}...</div>
              <div style={{ fontSize:13, color:'var(--text3)', lineHeight:1.65 }}>
                Fetching SEC filings · Scoring with LLM<br/>Building institutional report
              </div>
            </div>
          )}

          {/* Result */}
          {data && !loading && (
            <SentimentCard data={data} onRefresh={() => analyse(data.ticker)} loading={loading} mob={mob}/>
          )}

          {/* Empty state */}
          {!data && !loading && !error && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, padding:mob?32:52, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:14, opacity:0.6 }}>🧠</div>
              <div style={{ fontFamily:'var(--fd)', fontSize:mob?16:18, fontWeight:700, marginBottom:8 }}>AI Sentiment Analysis</div>
              <div style={{ fontSize:13, color:'var(--text3)', maxWidth:380, margin:'0 auto 20px', lineHeight:1.7 }}>
                Enter any US ticker to get an AI-powered sentiment score from SEC filings, price momentum and volatility data.
              </div>
              <div style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap' }}>
                {['AAPL','NVDA','TSLA'].map(t => (
                  <button key={t} onClick={() => analyse(t)} style={{ padding:'8px 18px', borderRadius:8, background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.2)', color:'var(--purple)', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--fm)' }}>{t}</button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* History */}
          {history.length > 0 && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontSize:10.5, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Recent</div>
              {history.map((h, i) => {
                const sc = h.sentiment?.sentiment_score || 0
                const c  = scoreColor(sc)
                const active = data?.ticker === h.ticker
                return (
                  <div key={i} onClick={() => { setData(h); setTicker(h.ticker) }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom:i<history.length-1?'1px solid rgba(255,255,255,0.04)':'none', cursor:'pointer', opacity:active?1:0.75, transition:'opacity 0.14s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {active && <div style={{ width:3, height:20, borderRadius:2, background:'var(--purple)', flexShrink:0 }}/>}
                      <div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:700, color:'var(--accent2)' }}>{h.ticker}</div>
                        <div style={{ fontSize:10.5, color:'var(--text4)' }}>{scoreLabel(sc)}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color:c }}>{sc>0?'+':''}{sc}</div>
                  </div>
                )
              })}
            </div>
          )}

          {/* How it works */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
            <div style={{ fontSize:10.5, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>How It Works</div>
            {[
              { icon:'📄', title:'SEC Filings',     desc:'10-K, 10-Q, 8-K from EDGAR · last 180 days' },
              { icon:'📈', title:'Price Momentum',  desc:'RSI, 3mo return, annualised volatility' },
              { icon:'🤖', title:'LLM Analysis',    desc:'Llama 3.3 70B scores language and context' },
              { icon:'📊', title:'Structured Score', desc:'−100 to +100 with themes, risks and analyst note' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:10, marginBottom:12 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{title}</div>
                  <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Disclaimer */}
          <div style={{ background:'rgba(240,165,0,0.06)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:10, padding:'12px 14px', fontSize:11.5, color:'var(--amber)', lineHeight:1.6 }}>
            ⚠ AI-generated · Educational use only · Not investment advice · Always do your own research
          </div>
        </div>
      </div>
    </div>
  )
}