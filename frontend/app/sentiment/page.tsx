'use client'
import { useState, useEffect } from 'react'
import { Search, TrendingUp, TrendingDown, Minus, RefreshCw, AlertTriangle, FileText, Activity } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { api } from '@/lib/api'

const QUICK_TICKERS = ['AAPL','MSFT','NVDA','GOOGL','TSLA','META','AMZN','JPM','SPY','BRK-B']

function ScoreGauge({ score }: { score: number }) {
  const clamped = Math.max(-100, Math.min(100, score))
  const pct     = ((clamped + 100) / 200) * 100
  const color   = clamped > 30 ? '#0dcb7d' : clamped < -30 ? '#f54060' : '#f0a500'

  return (
    <div style={{ position:'relative', width:160, height:80, margin:'0 auto' }}>
      {/* Background arc */}
      <svg viewBox="0 0 160 80" style={{ width:'100%', height:'100%' }}>
        <path d="M 10 80 A 70 70 0 0 1 150 80" fill="none" stroke="var(--bg4)" strokeWidth="12" strokeLinecap="round"/>
        <path
          d="M 10 80 A 70 70 0 0 1 150 80"
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${(pct/100)*220} 220`}
          style={{ transition:'stroke-dasharray 0.8s ease, stroke 0.4s ease' }}
        />
        {/* Needle */}
        <line
          x1="80" y1="80"
          x2={80 + 55 * Math.cos(Math.PI - (pct/100)*Math.PI)}
          y2={80 - 55 * Math.sin((pct/100)*Math.PI)}
          stroke={color} strokeWidth="2.5" strokeLinecap="round"
          style={{ transition:'all 0.8s ease' }}
        />
        <circle cx="80" cy="80" r="4" fill={color}/>
      </svg>
      {/* Score label */}
      <div style={{ position:'absolute', bottom:0, left:'50%', transform:'translateX(-50%)', textAlign:'center' }}>
        <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:300, color, lineHeight:1 }}>{clamped > 0 ? '+' : ''}{clamped}</div>
        <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginTop:2 }}>Score</div>
      </div>
    </div>
  )
}

function SentimentCard({ data, onRefresh, loading }: { data: any; onRefresh: () => void; loading: boolean }) {
  const s   = data.sentiment
  const pd  = data.price_data
  const score = s.sentiment_score || 0

  const labelColor = score > 30 ? 'var(--green)' : score < -30 ? 'var(--red)' : 'var(--amber)'
  const labelBg    = score > 30 ? 'rgba(13,203,125,0.1)' : score < -30 ? 'rgba(245,64,96,0.1)' : 'rgba(240,165,0,0.1)'
  const Icon        = score > 10 ? TrendingUp : score < -10 ? TrendingDown : Minus

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, overflow:'hidden' }}>
      {/* Top accent */}
      <div style={{ height:3, background:`linear-gradient(90deg,${labelColor},transparent)` }}/>

      <div style={{ padding:'24px 24px 20px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:600, color:'var(--accent2)' }}>{data.ticker}</div>
              <div style={{ padding:'4px 12px', borderRadius:20, background:labelBg, border:`1px solid ${labelColor}33`, color:labelColor, fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:5 }}>
                <Icon size={11} strokeWidth={2}/> {s.sentiment_label}
              </div>
            </div>
            {pd.price && (
              <div style={{ fontFamily:'var(--fm)', fontSize:15, color:'var(--text2)' }}>
                ${pd.price?.toFixed(2)}
                {pd.return_3mo !== undefined && (
                  <span style={{ marginLeft:10, fontSize:12, color: pd.return_3mo >= 0 ? 'var(--green)' : 'var(--red)' }}>
                    {pd.return_3mo >= 0 ? '+' : ''}{pd.return_3mo?.toFixed(2)}% (3mo)
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onRefresh} disabled={loading} style={{ padding:'7px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer' }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 0.8s linear infinite' : 'none' }}/>
          </button>
        </div>

        {/* Gauge */}
        <div style={{ marginBottom:24 }}>
          <ScoreGauge score={score} />
        </div>

        {/* Meta badges */}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginBottom:24, flexWrap:'wrap' }}>
          {[
            { label:'Confidence', value: s.confidence },
            { label:'Momentum',   value: s.momentum   },
            { label:'Data',       value: s.data_quality},
          ].map(({ label, value }) => (
            <div key={label} style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:8, padding:'6px 12px', textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:3 }}>{label}</div>
              <div style={{ fontSize:12, fontWeight:600, color:'var(--text)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Analyst note */}
        <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
          <div style={{ fontSize:10, color:'var(--accent2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>Analyst Note</div>
          <div style={{ fontSize:13, color:'var(--text2)', lineHeight:1.7 }}>{s.analyst_note}</div>
        </div>

        {/* Themes + Risks */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20 }}>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Key Themes</div>
            {s.key_themes?.map((t: string, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--green)', flexShrink:0, marginTop:5 }}/>
                <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.5 }}>{t}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10 }}>Risk Factors</div>
            {s.risk_factors?.map((r: string, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:8 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:'var(--red)', flexShrink:0, marginTop:5 }}/>
                <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.5 }}>{r}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price metrics */}
        {(pd.rsi || pd.vol) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'RSI (14)',   value: pd.rsi ? pd.rsi.toFixed(1) : '—',  color: pd.rsi > 70 ? 'var(--red)' : pd.rsi < 30 ? 'var(--green)' : 'var(--text)' },
              { label:'Ann. Vol',  value: pd.vol ? `${pd.vol.toFixed(1)}%` : '—', color:'var(--text)' },
              { label:'Filings',   value: `${s.filing_count} recent`, color:'var(--text)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background:'var(--bg3)', borderRadius:9, padding:'11px 13px' }}>
                <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
                <div style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:300, color }}>{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* SEC Filings */}
        {data.filings?.length > 0 && (
          <div>
            <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:10, display:'flex', alignItems:'center', gap:6 }}>
              <FileText size={11}/> Recent SEC Filings
            </div>
            {data.filings.map((f: any, i: number) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom: i < data.filings.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ padding:'2px 8px', borderRadius:4, background:'var(--bg3)', border:'1px solid var(--b1)', fontSize:10.5, fontFamily:'var(--fm)', color:'var(--accent2)', flexShrink:0 }}>{f.form}</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{f.date || f.excerpt}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize:10, color:'var(--text4)', marginTop:16, textAlign:'right' }}>
          Generated {new Date(data.generated).toLocaleTimeString()} · Educational use only
        </div>
      </div>
    </div>
  )
}

export default function SentimentPage() {
  const [ticker,  setTicker]  = useState('')
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [isMobile,setIsMobile]= useState(false)
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const analyse = async (t?: string) => {
    const target = (t || ticker).toUpperCase().trim()
    if (!target) return
    setLoading(true); setError(''); setData(null)
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const res  = await fetch(`${BASE}/api/sentiment/${target}`)
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      setData(json)
      setHistory(h => [json, ...h.filter(x => x.ticker !== target)].slice(0, 5))
      setTicker(target)
    } catch(e: any) {
      setError(e.message || 'Failed to fetch sentiment data')
    } finally {
      setLoading(false) }
  }

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(124,92,252,0.15)', border:'1px solid rgba(124,92,252,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity size={16} color="var(--purple)" strokeWidth={1.5}/>
          </div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px' }}>Sentiment Alpha</h1>
          <div style={{ padding:'3px 10px', borderRadius:20, background:'rgba(124,92,252,0.1)', border:'1px solid rgba(124,92,252,0.2)', fontSize:10.5, color:'var(--purple)', fontWeight:600 }}>AI-Powered</div>
        </div>
        <div style={{ fontSize:13, color:'var(--text2)', maxWidth:560 }}>
          LLM-powered sentiment scoring from SEC filings, price momentum and market data. Institutional-grade signals for any ticker.
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 320px', gap:20, alignItems:'start' }}>

        {/* Left — search + result */}
        <div>
          {/* Search */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:16 }}>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ flex:1, position:'relative' }}>
                <Search size={14} color="var(--text3)" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}/>
                <input
                  className="qd-input"
                  placeholder="Enter ticker — AAPL, MSFT, NVDA..."
                  value={ticker}
                  onChange={e => setTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && analyse()}
                  style={{ paddingLeft:36, fontSize:15, fontFamily:'var(--fm)' }}
                />
              </div>
              <button onClick={() => analyse()} disabled={loading || !ticker} style={{ padding:'10px 22px', borderRadius:9, background: loading||!ticker?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor: loading||!ticker?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, whiteSpace:'nowrap' }}>
                {loading ? <><RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Analysing...</> : <>Analyse</>}
              </button>
            </div>

            {/* Quick picks */}
            <div style={{ display:'flex', gap:6, marginTop:12, flexWrap:'wrap' }}>
              <span style={{ fontSize:10.5, color:'var(--text3)', alignSelf:'center' }}>Quick:</span>
              {QUICK_TICKERS.map(t => (
                <button key={t} onClick={() => analyse(t)} style={{ padding:'4px 10px', borderRadius:6, background:'var(--bg3)', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:11.5, fontFamily:'var(--fm)', cursor:'pointer', transition:'all 0.14s' }}
                  onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(124,92,252,0.3)';el.style.color='var(--purple)'}}
                  onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text2)'}}
                >{t}</button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:8, color:'var(--red)', fontSize:13 }}>
              <AlertTriangle size={14}/> {error} — make sure your FastAPI backend is running.
            </div>
          )}

          {loading && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, padding:48, textAlign:'center' }}>
              <div style={{ width:40, height:40, borderRadius:'50%', border:'3px solid var(--bg4)', borderTop:'3px solid var(--purple)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
              <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:600, marginBottom:8 }}>Analysing {ticker}...</div>
              <div style={{ fontSize:13, color:'var(--text2)' }}>Fetching SEC filings · Scoring with LLM · Building report</div>
            </div>
          )}

          {data && !loading && (
            <SentimentCard data={data} onRefresh={() => analyse(data.ticker)} loading={loading}/>
          )}

          {!data && !loading && !error && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:16, padding:52, textAlign:'center' }}>
              <div style={{ fontSize:40, marginBottom:14 }}>🧠</div>
              <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700, marginBottom:8 }}>Sentiment Alpha</div>
              <div style={{ fontSize:13.5, color:'var(--text2)', maxWidth:400, margin:'0 auto', lineHeight:1.7 }}>
                Enter any ticker above to get an AI-powered sentiment score based on SEC filing activity, price momentum, and market data.
              </div>
            </div>
          )}
        </div>

        {/* Right — history + info */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Recent searches */}
          {history.length > 0 && (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Recent</div>
              {history.map((h, i) => {
                const score = h.sentiment?.sentiment_score || 0
                const color = score > 30 ? 'var(--green)' : score < -30 ? 'var(--red)' : 'var(--amber)'
                return (
                  <div key={i} onClick={() => { setData(h); setTicker(h.ticker) }} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 0', borderBottom: i < history.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor:'pointer' }}>
                    <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color:'var(--accent2)' }}>{h.ticker}</div>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontSize:12, color:'var(--text2)' }}>{h.sentiment?.sentiment_label}</div>
                      <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color }}>{score > 0 ? '+' : ''}{score}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* How it works */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>How It Works</div>
            {[
              { icon:'📄', title:'SEC Filings', desc:'Pulls 10-K, 10-Q and 8-K filings from EDGAR for the last 180 days' },
              { icon:'📈', title:'Price Momentum', desc:'RSI, 3-month return and volatility provide market context' },
              { icon:'🤖', title:'LLM Scoring', desc:'Llama 3.3 70B analyses all data and generates a -100 to +100 sentiment score' },
              { icon:'📊', title:'Structured Output', desc:'Key themes, risk factors and analyst note in institutional format' },
            ].map(({ icon, title, desc }) => (
              <div key={title} style={{ display:'flex', gap:10, marginBottom:14 }}>
                <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:12.5, fontWeight:600, marginBottom:3 }}>{title}</div>
                  <div style={{ fontSize:11.5, color:'var(--text2)', lineHeight:1.5 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Score legend */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Score Legend</div>
            {[
              { range:'+60 to +100', label:'Strong Buy',  color:'var(--green)' },
              { range:'+20 to +60',  label:'Buy',         color:'#5ba3f5' },
              { range:'-20 to +20',  label:'Neutral',     color:'var(--amber)' },
              { range:'-60 to -20',  label:'Sell',        color:'#f0836a' },
              { range:'-100 to -60', label:'Strong Sell', color:'var(--red)' },
            ].map(({ range, label, color }) => (
              <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.03)' }}>
                <div style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text3)' }}>{range}</div>
                <div style={{ fontSize:12, fontWeight:600, color }}>{label}</div>
              </div>
            ))}
          </div>

          <div style={{ background:'rgba(240,165,0,0.06)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:12, padding:'12px 14px', fontSize:11.5, color:'var(--amber)', lineHeight:1.6 }}>
            ⚠ Educational use only. Sentiment scores are AI-generated and do not constitute investment advice.
          </div>
        </div>
      </div>
    </div>
  )
}