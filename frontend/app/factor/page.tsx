'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import { FlaskConical, RefreshCw, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, ReferenceLine, Cell } from 'recharts'

function fmt(v: any, d = 2) { return v == null ? '—' : Number(v).toFixed(d) }
function fmtPct(v: any)     { return v == null ? '—' : `${(v*100).toFixed(2)}%` }
function fmtPlus(v: any)    { return v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%` }

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>{label}</div>
      {payload.map((p:any,i:number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:100 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

function RiskBar({ label, systematic, idio, total }: { label: string; systematic: number; idio: number; total: number }) {
  const sysPct = (systematic / total) * 100
  const idioPct = (idio / total) * 100
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:12, color:'var(--text2)' }}>{label}</span>
        <span style={{ fontFamily:'var(--fm)', fontSize:12, color:'var(--text)' }}>{total.toFixed(2)}%</span>
      </div>
      <div style={{ height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden', display:'flex' }}>
        <div style={{ height:6, width:`${sysPct}%`, background:'#2d7ff9', transition:'width 0.5s ease' }}/>
        <div style={{ height:6, width:`${idioPct}%`, background:'#7c5cfc', transition:'width 0.5s ease' }}/>
      </div>
      <div style={{ display:'flex', gap:14, marginTop:4 }}>
        <span style={{ fontSize:10, color:'#2d7ff9' }}>Systematic {sysPct.toFixed(0)}%</span>
        <span style={{ fontSize:10, color:'#7c5cfc' }}>Idiosyncratic {idioPct.toFixed(0)}%</span>
      </div>
    </div>
  )
}

export default function FactorPage() {
  const [inputs, setInputs] = useState({
    tickers: 'AAPL,MSFT,NVDA,GOOGL,SPY',
    shares:   '20,15,10,25,50',
    buyPrices:'182,380,650,160,490',
    period:   '1y',
    benchmark:'SPY',
  })
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'capm'|'risk'|'attribution'|'style'>('capm')
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const run = async () => {
    setLoading(true)
    try {
      setData(await api.portfolio.analytics({
        tickers:   inputs.tickers,
        shares:    inputs.shares,
        buyPrices: inputs.buyPrices,
        period:    inputs.period,
        benchmark: inputs.benchmark,
      }))
    } catch {}
    finally { setLoading(false) }
  }

  const s = data?.summary

  // Derived factor metrics
  const systematic = s ? Math.abs(s.beta) * 0.16 * 100 : 0 // approx systematic vol
  const idio       = s ? Math.max(0, (s.annVol||0)*100 - systematic) : 0
  const total      = s ? (s.annVol||0)*100 : 0

  // Style factor scores (synthetic from available metrics)
  const styleFactors = s ? [
    { factor:'Momentum', score: s.totalReturn > 0 ? Math.min(100, s.totalReturn * 100 * 3) : Math.max(0, 50 + s.totalReturn*100*3) },
    { factor:'Quality',  score: Math.min(100, Math.max(0, s.sharpe > 2 ? 90 : s.sharpe > 1 ? 70 : s.sharpe > 0 ? 50 : 20)) },
    { factor:'Low Vol',  score: Math.min(100, Math.max(0, 100 - (s.annVol||0)*200)) },
    { factor:'Value',    score: 50 }, // placeholder
    { factor:'Growth',   score: Math.min(100, Math.max(0, (s.annReturn||0)*200)) },
    { factor:'Size',     score: 50 }, // placeholder
  ] : []

  // Attribution — alpha vs beta contribution
  const betaContrib = s ? s.beta * 0.12 : 0 // approx market return
  const alphaContrib = s ? (s.alpha||0) : 0

  const barData = s ? data.holdings?.map((h:any, i:number) => ({
    name:   h.ticker,
    return: +(h.periodReturn * 100).toFixed(2),
    weight: +(h.weight * 100).toFixed(1),
  })) : []

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(124,92,252,0.12)', border:'1px solid rgba(124,92,252,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FlaskConical size={16} color="var(--purple)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Factor Exposure</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>CAPM · Risk Decomposition · Attribution · Style Factors</div>
          </div>
        </div>
        {data && <Badge variant="purple">Factor Model</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', marginBottom:14 }}>Portfolio Inputs</div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12, marginBottom:12 }}>
          {[
            { label:'Tickers', key:'tickers', placeholder:'AAPL,MSFT,NVDA' },
            { label:'Shares',  key:'shares',  placeholder:'20,15,10' },
            { label:'Buy Prices ($)', key:'buyPrices', placeholder:'182,380,650' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <input className="qd-input" placeholder={placeholder} value={(inputs as any)[key]} onChange={e=>setInputs(p=>({...p,[key]:e.target.value}))}/>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
          {[
            { label:'Period',    key:'period',    options:['1mo','3mo','6mo','1y','2y'] },
            { label:'Benchmark', key:'benchmark', options:['SPY','QQQ','DIA','IWM'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <select className="qd-select" value={(inputs as any)[key]} onChange={e=>setInputs(p=>({...p,[key]:e.target.value}))}>
                {options.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={run} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:loading?'none':'0 0 20px rgba(124,92,252,0.25)' }}>
            {loading?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<ChevronRight size={13}/>}
            {loading?'Computing...':'Compute Factors'}
          </button>
        </div>
      </div>

      {!data && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:14, opacity:0.3 }}>🧪</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Factor Analysis Ready</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:420, margin:'0 auto' }}>Decompose portfolio returns into systematic vs idiosyncratic components. Compute CAPM alpha, beta, R², and style factor exposures.</div>
        </div>
      )}

      {data && s && (
        <>
          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="Market Beta (β)" value={fmt(s.beta, 3)} delta={s.beta > 1 ? 'Amplifies market' : s.beta < 0 ? 'Inverse to market' : 'Defensive'} deltaUp={null as any} accent="#7c5cfc"/>
            <MetricCard label="Alpha (Ann.)"    value={fmtPlus(s.alpha)} delta={`vs ${s.benchmark}`} deltaUp={s.alpha > 0}/>
            <MetricCard label="R² (R-Squared)"  value={fmt(s.r2, 3)}    delta="Market variance explained"/>
            <MetricCard label="Info Ratio"       value={fmt(s.infoRatio)} delta="Active return / TE" deltaUp={s.infoRatio > 0}/>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
            {(['capm','risk','attribution','style'] as const).map(t => (
              <button key={t} onClick={()=>setActiveTab(t)} style={{ padding:'6px 16px', borderRadius:7, border:'none', cursor:'pointer', background:activeTab===t?'var(--bg5)':'transparent', color:activeTab===t?'var(--text)':'var(--text2)', fontSize:12, fontWeight:activeTab===t?600:400, transition:'all 0.14s', textTransform:'capitalize', boxShadow:activeTab===t?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap' }}>
                {t === 'capm' ? 'CAPM' : t === 'style' ? 'Style Factors' : t.charAt(0).toUpperCase()+t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── CAPM ── */}
          {activeTab === 'capm' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
                {/* CAPM stats */}
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>CAPM Factor Statistics</div>
                  {[
                    { label:'Market Beta (β)', value:fmt(s.beta, 4), desc:'Sensitivity to market returns', color: s.beta > 1 ? 'var(--accent2)' : s.beta < 0 ? 'var(--red)' : 'var(--text)' },
                    { label:'Alpha (Annualised)', value:fmtPlus(s.alpha), desc:`Excess return vs ${s.benchmark}`, color: s.alpha > 0 ? 'var(--green)' : 'var(--red)' },
                    { label:'R² (R-Squared)', value:fmt(s.r2, 4), desc:'% of variance explained by market', color:'var(--text)' },
                    { label:'Tracking Error', value:fmtPct(s.trackingError), desc:'Std dev of active returns', color:'var(--text)' },
                    { label:'Information Ratio', value:fmt(s.infoRatio, 4), desc:'Alpha per unit of tracking error', color: s.infoRatio > 0 ? 'var(--green)' : 'var(--red)' },
                    { label:'Sortino Ratio', value:fmt(s.sortino, 4), desc:'Downside risk-adjusted return', color: s.sortino > 1 ? 'var(--green)' : 'var(--text)' },
                  ].map(({ label, value, desc, color }, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'10px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap:12 }}>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{desc}</div>
                      </div>
                      <span style={{ fontFamily:'var(--fm)', fontSize:15, fontWeight:300, color, flexShrink:0 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Beta interpretation */}
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Beta Interpretation</div>
                  {[
                    { range:'β < 0',      label:'Inverse',    desc:'Moves opposite to market. Natural hedge. Useful in bear markets.', color:'#f54060' },
                    { range:'β = 0',      label:'Uncorrelated', desc:'No relationship with market. Pure alpha/idiosyncratic.', color:'var(--text3)' },
                    { range:'0 < β < 1',  label:'Defensive',  desc:'Less volatile than market. Common in utilities, healthcare, staples.', color:'#5ba3f5' },
                    { range:'β = 1',      label:'Market',     desc:'Moves in line with market. Benchmark-like exposure.', color:'var(--text2)' },
                    { range:'β > 1',      label:'Aggressive', desc:'Amplifies market moves. Higher risk/return. Tech, growth stocks.', color:'#0dcb7d' },
                    { range:'β > 2',      label:'Very High',  desc:'Extremely sensitive to market. Speculative, leveraged assets.', color:'#f0a500' },
                  ].map(({ range, label, desc, color }, i) => {
                    const isCurrent = s.beta >= 0 && (
                      (i === 2 && s.beta > 0 && s.beta < 1) ||
                      (i === 3 && s.beta >= 0.95 && s.beta <= 1.05) ||
                      (i === 4 && s.beta > 1 && s.beta <= 2) ||
                      (i === 5 && s.beta > 2) ||
                      (i === 0 && s.beta < 0)
                    )
                    return (
                      <div key={i} style={{ display:'flex', gap:10, padding:'9px 10px', borderRadius:8, marginBottom:3, background:isCurrent?'rgba(124,92,252,0.08)':'transparent', border:`1px solid ${isCurrent?'rgba(124,92,252,0.2)':'transparent'}` }}>
                        <div style={{ fontFamily:'var(--fm)', fontSize:11, color, width:60, flexShrink:0, paddingTop:1 }}>{range}</div>
                        <div>
                          <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{label} {isCurrent && <span style={{ fontSize:10, color:'var(--purple)', marginLeft:4 }}>← Your portfolio</span>}</div>
                          <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.5 }}>{desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── RISK DECOMPOSITION ── */}
          {activeTab === 'risk' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12 }}>
                <MetricCard label="Systematic Vol" value={`${systematic.toFixed(2)}%`} delta="β × market vol" accent="#2d7ff9"/>
                <MetricCard label="Idiosyncratic Vol" value={`${idio.toFixed(2)}%`} delta="Stock-specific risk" accent="#7c5cfc"/>
                <MetricCard label="Total Portfolio Vol" value={`${total.toFixed(2)}%`} delta="Annualised volatility"/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Risk Attribution by Holding</div>
                  {data.holdings?.map((h:any, i:number) => {
                    const holdingVol = Math.abs(h.periodReturn) * 100 * 0.6
                    const sys  = holdingVol * Math.min(1, Math.abs(s.beta || 1) * 0.7)
                    const idio = Math.max(0, holdingVol - sys)
                    return <RiskBar key={i} label={h.ticker} systematic={sys} idio={idio} total={holdingVol}/>
                  })}
                  <div style={{ display:'flex', gap:20, marginTop:10, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:10, height:4, borderRadius:2, background:'#2d7ff9' }}/>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>Systematic</span>
                    </div>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:10, height:4, borderRadius:2, background:'#7c5cfc' }}/>
                      <span style={{ fontSize:11, color:'var(--text3)' }}>Idiosyncratic</span>
                    </div>
                  </div>
                </div>

                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Risk Statistics</div>
                  {[
                    { label:'VaR 95% (Historical)',  value:fmtPct(s.histVar95),  desc:'Daily loss threshold at 95% confidence', neg:true },
                    { label:'CVaR / ES 95%',          value:fmtPct(s.histCVar95), desc:'Expected loss beyond VaR', neg:true },
                    { label:'Max Drawdown',           value:fmtPct(s.maxDrawdown), desc:'Peak to trough loss', neg:true },
                    { label:'Calmar Ratio',           value:fmt(s.calmar),        desc:'Ann. return / Max drawdown', pos: s.calmar > 1 },
                    { label:'Omega Ratio',            value:fmt(s.omega),         desc:'Probability-weighted gain/loss', pos: s.omega > 1 },
                    { label:'Gain to Pain',           value:fmt(s.gainToPain),    desc:'Sum of gains / |sum of losses|', pos: s.gainToPain > 1 },
                  ].map(({ label, value, desc, neg, pos }, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none', gap:12 }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:500, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:11, color:'var(--text3)' }}>{desc}</div>
                      </div>
                      <span style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:300, color: neg ? 'var(--red)' : pos ? 'var(--green)' : 'var(--text)', flexShrink:0 }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ATTRIBUTION ── */}
          {activeTab === 'attribution' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Return Attribution</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>How total return is split between market exposure and alpha</div>
                  {[
                    { label:'Total Portfolio Return', value:fmtPlus(s.totalReturn), color: s.totalReturn >= 0 ? 'var(--green)' : 'var(--red)', pct:100 },
                    { label:`Market Return (β × Rm)`, value:fmtPlus(betaContrib), color:'#2d7ff9', pct: s.totalReturn ? Math.abs(betaContrib/s.totalReturn)*100 : 50 },
                    { label:'Alpha (Active Return)',  value:fmtPlus(alphaContrib), color: alphaContrib >= 0 ? 'var(--green)' : 'var(--red)', pct: s.totalReturn ? Math.abs(alphaContrib/s.totalReturn)*100 : 50 },
                  ].map(({ label, value, color, pct }, i) => (
                    <div key={i} style={{ marginBottom:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                        <span style={{ fontSize:12.5, color:'var(--text2)' }}>{label}</span>
                        <span style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color }}>{value}</span>
                      </div>
                      <div style={{ height:5, background:'var(--bg4)', borderRadius:2.5, overflow:'hidden' }}>
                        <div style={{ height:5, width:`${Math.min(100, pct)}%`, background:color, borderRadius:2.5, opacity:0.7, transition:'width 0.5s ease' }}/>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Holding Returns</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>Individual contributor performance over {inputs.period}</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{ top:0, right:0, bottom:0, left:0 }}>
                      <XAxis dataKey="name" tick={{ fontSize:10, fill:'#304560' }} tickLine={false} axisLine={false}/>
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={40}/>
                      <Tooltip content={<Tip/>}/>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                      <Bar dataKey="return" name="Return %" radius={[3,3,0,0]}>
                        {barData?.map((entry:any, i:number) => (
                          <Cell key={i} fill={entry.return >= 0 ? '#0dcb7d' : '#f54060'} opacity={0.85}/>
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── STYLE FACTORS ── */}
          {activeTab === 'style' && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Style Factor Scores</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Estimated factor exposures based on portfolio metrics</div>
                <ResponsiveContainer width="100%" height={260}>
                  <RadarChart data={styleFactors} margin={{ top:10, right:20, bottom:10, left:20 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.06)"/>
                    <PolarAngleAxis dataKey="factor" tick={{ fontSize:11, fill:'#68809a' }}/>
                    <Radar name="Factor Score" dataKey="score" stroke="#7c5cfc" fill="#7c5cfc" fillOpacity={0.15} strokeWidth={2}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Factor Score Breakdown</div>
                {styleFactors.map(({ factor, score }) => (
                  <div key={factor} style={{ marginBottom:14 }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                      <span style={{ fontSize:12.5, color:'var(--text2)', fontWeight:500 }}>{factor}</span>
                      <span style={{ fontFamily:'var(--fm)', fontSize:13, color: score > 60 ? 'var(--green)' : score < 40 ? 'var(--red)' : 'var(--amber)' }}>{score.toFixed(0)}/100</span>
                    </div>
                    <div style={{ height:5, background:'var(--bg4)', borderRadius:2.5, overflow:'hidden' }}>
                      <div style={{ height:5, width:`${score}%`, background: score > 60 ? '#0dcb7d' : score < 40 ? '#f54060' : '#f0a500', borderRadius:2.5, transition:'width 0.5s ease' }}/>
                    </div>
                  </div>
                ))}
                <div style={{ marginTop:16, padding:'12px 14px', background:'rgba(124,92,252,0.06)', border:'1px solid rgba(124,92,252,0.15)', borderRadius:9, fontSize:11.5, color:'var(--text2)', lineHeight:1.6 }}>
                  ⚠ Style factor scores are estimated from available portfolio metrics. For precise Fama-French factor loadings, a dedicated multi-factor regression model is required.
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}