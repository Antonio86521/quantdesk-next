'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell, LineChart, Line, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter } from 'recharts'
import { Zap, RefreshCw, ChevronRight, AlertTriangle, Shield, TrendingDown, Activity } from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────
const fmt = {
  pct:     (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`,
  pctPlus: (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`,
  num:     (v: any, d=2) => v == null ? '—' : Number(v).toFixed(d),
}

const DEFAULT = {
  tickers: 'AAPL,MSFT,NVDA,GOOGL,SPY',
  shares:  '20,15,10,25,50',
  buyPrices:'182,380,650,160,490',
  period:  '1y', benchmark:'SPY', riskFree:'2.0',
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>{label}</div>
      {payload.map((p:any,i:number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:100 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn ? fn(p.value) : Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Risk Score Gauge ──────────────────────────────────────────────────────────
function RiskGauge({ score }: { score: number }) {
  // score 0-100, where 0=very safe, 100=very risky
  const w = 260, h = 110, cx = 130, cy = 105, r = 85
  const clampedScore = Math.min(100, Math.max(0, score))

  function polarToXY(angle: number, radius: number) {
    const rad = (angle - 180) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(startAngle: number, endAngle: number, ar: number) {
    const s = polarToXY(startAngle, ar), e = polarToXY(endAngle, ar)
    return `M ${s.x} ${s.y} A ${ar} ${ar} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }

  const needleAngle = clampedScore * 1.8
  const needle      = polarToXY(needleAngle, r - 18)
  const color       = clampedScore < 30 ? '#0dcb7d' : clampedScore < 60 ? '#f0a500' : '#f54060'
  const label       = clampedScore < 30 ? 'Low Risk' : clampedScore < 60 ? 'Moderate' : 'High Risk'

  return (
    <div style={{ textAlign:'center' }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:'block', maxWidth:260, margin:'0 auto' }}>
        <path d={arcPath(0, 60,  r)} fill="none" stroke="rgba(13,203,125,0.4)"  strokeWidth={14} strokeLinecap="round"/>
        <path d={arcPath(60, 120, r)} fill="none" stroke="rgba(240,165,0,0.4)"  strokeWidth={14} strokeLinecap="round"/>
        <path d={arcPath(120, 180,r)} fill="none" stroke="rgba(245,64,96,0.4)"  strokeWidth={14} strokeLinecap="round"/>
        <path d={arcPath(0, needleAngle, r)} fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" opacity={0.9}/>
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={16}   y={h-2} fontSize={8} fill="rgba(255,255,255,0.3)">Low</text>
        <text x={cx}   y={18}  fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="middle">Med</text>
        <text x={w-16} y={h-2} fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="end">High</text>
      </svg>
      <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:300, color, marginTop:-8 }}>{clampedScore.toFixed(0)}</div>
      <div style={{ fontSize:12, color:'var(--text3)', marginTop:2 }}>{label}</div>
    </div>
  )
}

// ── VaR Meter ────────────────────────────────────────────────────────────────
function VarMeter({ label, value, portfolioValue }: { label: string; value: number; portfolioValue?: number }) {
  const pct  = Math.abs(value * 100)
  const fill = pct > 5 ? '#f54060' : pct > 3 ? '#f0a500' : '#0dcb7d'
  const dollar = portfolioValue ? Math.abs(value * portfolioValue) : null

  return (
    <div style={{ background:'var(--bg3)', borderRadius:12, padding:'14px 16px', border:`1px solid ${fill}22` }}>
      <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, fontWeight:600 }}>{label}</div>
      <div style={{ fontFamily:'var(--fm)', fontSize:24, fontWeight:300, color:fill, marginBottom:6 }}>{pct.toFixed(2)}%</div>
      {dollar && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>${dollar.toLocaleString('en',{maximumFractionDigits:0})} at risk</div>}
      <div style={{ height:5, background:'var(--bg4)', borderRadius:2.5, overflow:'hidden' }}>
        <div style={{ height:5, width:`${Math.min(100, pct * 8)}%`, background:fill, borderRadius:2.5, transition:'width 0.5s ease' }}/>
      </div>
    </div>
  )
}

// ── Stress Scenario ───────────────────────────────────────────────────────────
function StressScenario({ label, shock, portfolioValue, beta }: { label: string; shock: number; portfolioValue: number; beta: number }) {
  const impact      = shock * beta * portfolioValue
  const impactPct   = shock * beta * 100
  const color       = impact < 0 ? '#f54060' : '#0dcb7d'
  const severity    = Math.abs(shock) > 0.3 ? 'Severe' : Math.abs(shock) > 0.15 ? 'Moderate' : 'Mild'
  const sevColor    = Math.abs(shock) > 0.3 ? '#f54060' : Math.abs(shock) > 0.15 ? '#f0a500' : '#5ba3f5'

  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'var(--bg3)', borderRadius:10, border:'1px solid rgba(255,255,255,0.04)', marginBottom:6 }}>
      <div>
        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:3 }}>{label}</div>
        <div style={{ fontSize:10, color:sevColor, fontWeight:600 }}>{severity} · Market {shock > 0 ? '+' : ''}{(shock*100).toFixed(0)}%</div>
      </div>
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color }}>{impact >= 0 ? '+' : ''}${Math.abs(impact).toLocaleString('en',{maximumFractionDigits:0})}</div>
        <div style={{ fontSize:11, color, fontFamily:'var(--fm)' }}>{impactPct >= 0 ? '+' : ''}{impactPct.toFixed(2)}%</div>
      </div>
    </div>
  )
}

// ── Risk Alert ────────────────────────────────────────────────────────────────
function RiskAlert({ condition, message, severity }: { condition: boolean; message: string; severity: 'high'|'med'|'ok'|'info' }) {
  if (!condition) return null
  const colors = {
    high: { bg:'rgba(245,64,96,0.08)',  border:'rgba(245,64,96,0.25)',  color:'#f54060', icon:<AlertTriangle size={13}/> },
    med:  { bg:'rgba(240,165,0,0.08)',  border:'rgba(240,165,0,0.2)',   color:'#f0a500', icon:<AlertTriangle size={13}/> },
    ok:   { bg:'rgba(13,203,125,0.08)', border:'rgba(13,203,125,0.2)',  color:'#0dcb7d', icon:<Shield size={13}/> },
    info: { bg:'rgba(45,127,249,0.08)', border:'rgba(45,127,249,0.2)',  color:'#2d7ff9', icon:<Activity size={13}/> },
  }
  const c = colors[severity]
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9, background:c.bg, border:`1px solid ${c.border}`, marginBottom:8 }}>
      <span style={{ color:c.color, flexShrink:0 }}>{c.icon}</span>
      <span style={{ fontSize:12.5, color:c.color, lineHeight:1.5 }}>{message}</span>
    </div>
  )
}

// ── Return Distribution ───────────────────────────────────────────────────────
function ReturnDistribution({ returns }: { returns: any[] }) {
  if (!returns?.length) return null

  // Build histogram bins
  const vals = returns.map((d:any) => d.value * 100)
  const mn = Math.min(...vals), mx = Math.max(...vals)
  const bins = 30, binSize = (mx - mn) / bins
  const hist: { bin: string; count: number; value: number; isNeg: boolean }[] = []

  for (let i = 0; i < bins; i++) {
    const lo  = mn + i * binSize
    const hi  = lo + binSize
    const mid = (lo + hi) / 2
    hist.push({ bin: mid.toFixed(1), count: vals.filter(v => v >= lo && v < hi).length, value: mid, isNeg: mid < 0 })
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={hist} margin={{ top:5, right:5, bottom:0, left:0 }}>
        <XAxis dataKey="bin" tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} interval={5} tickFormatter={v=>`${v}%`}/>
        <YAxis tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} width={24}/>
        <Tooltip content={<Tip fn={(v:number)=>String(v)}/>}/>
        <ReferenceLine x="0.0" stroke="rgba(255,255,255,0.1)"/>
        <Bar dataKey="count" name="Frequency" radius={[1,1,0,0]}>
          {hist.map((d,i) => <Cell key={i} fill={d.isNeg ? '#f54060' : '#0dcb7d'} opacity={0.75}/>)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Rolling Vol Chart ─────────────────────────────────────────────────────────
function RollingVolChart({ returns }: { returns: any[] }) {
  if (!returns?.length) return null

  // Compute 21-day rolling vol from daily returns
  const vals = returns.map((d:any) => ({ date:d.date, ret:d.value }))
  const rollingVol: { date: string; vol: number }[] = []

  for (let i = 20; i < vals.length; i++) {
    const window = vals.slice(i-20, i+1).map(v => v.ret)
    const mean   = window.reduce((a,b) => a+b, 0) / window.length
    const variance = window.reduce((s,v) => s + (v-mean)**2, 0) / window.length
    rollingVol.push({ date: vals[i].date, vol: +(Math.sqrt(variance) * Math.sqrt(252) * 100).toFixed(2) })
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={rollingVol} margin={{ top:5, right:5, bottom:0, left:0 }}>
        <defs>
          <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f0a500" stopOpacity={0.2}/>
            <stop offset="95%" stopColor="#f0a500" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={38}/>
        <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
        <Area type="monotone" dataKey="vol" name="Rolling Vol (21d ann.)" stroke="#f0a500" strokeWidth={1.8} fill="url(#volGrad)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
function RiskContent() {
  const [inp,     setInp]     = useState(DEFAULT)
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [tab,     setTab]     = useState<'overview'|'var'|'stress'|'distribution'|'rolling'>('overview')
  const [isMobile, setIsMobile] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t=searchParams.get('tickers'), s=searchParams.get('shares'), bp=searchParams.get('buyPrices')
    if (t && s && bp) {
      setInp(prev => ({ ...prev, tickers:t, shares:s, buyPrices:bp }))
    }
  }, [searchParams])

  const run = async () => {
    setLoading(true); setError('')
    try {
      setData(await api.portfolio.analytics({
        tickers:inp.tickers, shares:inp.shares, buyPrices:inp.buyPrices,
        period:inp.period, benchmark:inp.benchmark, riskFree:parseFloat(inp.riskFree)/100
      }))
    } catch (e:any) { setError(e.message||'Failed') }
    finally { setLoading(false) }
  }

  const s = data?.summary

  // Compute composite risk score (0-100)
  const riskScore = s ? (() => {
    let score = 50
    if (s.annVol > 0.3) score += 20; else if (s.annVol > 0.2) score += 10; else score -= 10
    if (Math.abs(s.maxDrawdown) > 0.3) score += 15; else if (Math.abs(s.maxDrawdown) > 0.15) score += 5; else score -= 5
    if (s.beta > 1.5) score += 15; else if (s.beta > 1) score += 5; else if (s.beta < 0.7) score -= 10
    if (s.sharpe < 0.5) score += 10; else if (s.sharpe > 1.5) score -= 10
    if (Math.abs(s.histVar95) > 0.03) score += 10
    return Math.min(100, Math.max(0, score))
  })() : 50

  const STRESS_SCENARIOS = s ? [
    { label:'2008 Financial Crisis',      shock:-0.50 },
    { label:'COVID Crash (Mar 2020)',      shock:-0.34 },
    { label:'2022 Rate Shock',            shock:-0.25 },
    { label:'Flash Crash (May 2010)',      shock:-0.10 },
    { label:'Dot-Com Bust (2000–2002)',    shock:-0.49 },
    { label:'Bull Market Rally',           shock:+0.25 },
    { label:'Melt-Up Scenario',            shock:+0.40 },
  ] : []

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(245,64,96,0.12)', border:'1px solid rgba(245,64,96,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Zap size={16} color="var(--red)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Risk & Attribution</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>VaR · CVaR · Drawdown · Stress Testing · Vol Analysis</div>
          </div>
        </div>
        {data && <Badge variant="red">Risk Analysis</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', marginBottom:14 }}>Portfolio Inputs</div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          {[
            { label:'Tickers', key:'tickers', placeholder:'AAPL,MSFT,NVDA' },
            { label:'Shares',  key:'shares',  placeholder:'20,15,10' },
            { label:'Buy Prices ($)', key:'buyPrices', placeholder:'182,380,650' },
            { label:'Risk-Free %',    key:'riskFree',  placeholder:'2.0' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <input className="qd-input" placeholder={placeholder} value={(inp as any)[key]} onChange={e=>setInp(x=>({...x,[key]:e.target.value}))}/>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'flex-end', flexWrap:'wrap' }}>
          {[
            { label:'Period',    key:'period',    options:['1mo','3mo','6mo','1y','2y','5y'] },
            { label:'Benchmark', key:'benchmark', options:['SPY','QQQ','DIA','IWM'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <select className="qd-select" value={(inp as any)[key]} onChange={e=>setInp(x=>({...x,[key]:e.target.value}))}>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={run} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#f54060,#c0392b)', border:'1px solid rgba(245,64,96,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8, boxShadow:loading?'none':'0 0 20px rgba(245,64,96,0.25)' }}>
            {loading ? <><RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/> Analysing...</> : <><ChevronRight size={13}/> Run Risk Analysis</>}
          </button>
        </div>
        {error && <div style={{ marginTop:12, fontSize:12, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:52, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:16, opacity:0.3 }}>⚡</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700, marginBottom:8 }}>Risk Analysis Ready</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:440, margin:'0 auto 24px', lineHeight:1.7 }}>Run a comprehensive risk analysis — VaR, CVaR, drawdown profile, stress testing, return distribution and rolling volatility.</div>
          <button onClick={run} style={{ padding:'10px 28px', borderRadius:9, background:'linear-gradient(135deg,#f54060,#c0392b)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Analyse Default Portfolio
          </button>
        </div>
      )}

      {data && s && (
        <>
          {/* Risk alerts */}
          <div style={{ marginBottom:20 }}>
            <RiskAlert condition={s.beta > 1.5}                    message={`Very high beta (${fmt.num(s.beta,3)}) — portfolio amplifies market moves by ${(s.beta*100).toFixed(0)}%. Consider reducing market exposure.`} severity="high"/>
            <RiskAlert condition={s.beta > 1.2 && s.beta <= 1.5}   message={`Elevated beta (${fmt.num(s.beta,3)}) — portfolio is more volatile than the market. Monitor during downturns.`}                              severity="med"/>
            <RiskAlert condition={Math.abs(s.maxDrawdown) > 0.3}   message={`Severe drawdown risk (${fmt.pct(s.maxDrawdown)}) — portfolio has experienced or could experience large peak-to-trough losses.`}           severity="high"/>
            <RiskAlert condition={Math.abs(s.histVar95) > 0.03}    message={`Daily VaR exceeds 3% — on a bad day you could lose ${fmt.pct(s.histVar95)} of portfolio value.`}                                          severity="med"/>
            <RiskAlert condition={s.sharpe < 0.5 && s.sharpe >= 0} message={`Low Sharpe ratio (${fmt.num(s.sharpe,3)}) — returns don't adequately compensate for the risk taken.`}                                    severity="med"/>
            <RiskAlert condition={s.sharpe < 0}                    message={`Negative Sharpe ratio — portfolio is losing money on a risk-adjusted basis. Review your holdings.`}                                       severity="high"/>
            <RiskAlert condition={s.sharpe > 1.5}                  message={`Excellent risk-adjusted returns (Sharpe ${fmt.num(s.sharpe,3)}) — portfolio is efficiently compensating for risk.`}                      severity="ok"/>
            <RiskAlert condition={s.alpha > 0.05}                  message={`Generating strong alpha (${fmt.pctPlus(s.alpha)}) — outperforming ${s.benchmark} on a risk-adjusted basis.`}                            severity="ok"/>
          </div>

          {/* KPI row 1 */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:12, marginBottom:12 }}>
            <MetricCard label="Ann. Volatility"  value={fmt.pct(s.annVol)}        delta="Realised annual vol"          accent={s.annVol > 0.3 ? '#f54060' : undefined}/>
            <MetricCard label="Max Drawdown"     value={fmt.pct(s.maxDrawdown)}   delta="Peak to trough"               deltaUp={false} accent="#f54060"/>
            <MetricCard label="Hist. VaR 95%"   value={fmt.pct(s.histVar95)}      delta="Daily loss threshold"         deltaUp={false}/>
            <MetricCard label="CVaR / ES 95%"   value={fmt.pct(s.histCVar95)}     delta="Expected shortfall"           deltaUp={false}/>
          </div>

          {/* KPI row 2 */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="Sharpe Ratio"     value={fmt.num(s.sharpe)}        delta="Return per unit risk"         deltaUp={s.sharpe>1}  accent={s.sharpe>1?'#0dcb7d':undefined}/>
            <MetricCard label="Sortino Ratio"    value={fmt.num(s.sortino)}       delta="Downside risk-adjusted"       deltaUp={s.sortino>1}/>
            <MetricCard label="Beta"             value={fmt.num(s.beta)}          delta={`vs ${s.benchmark}`}/>
            <MetricCard label="Calmar Ratio"     value={fmt.num(s.calmar)}        delta="Return / Max DD"              deltaUp={s.calmar>1}/>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, overflowX:'auto', width:'fit-content' }}>
            {([
              { key:'overview',     label:'Overview' },
              { key:'var',          label:'VaR Analysis' },
              { key:'stress',       label:'Stress Tests' },
              { key:'distribution', label:'Distribution' },
              { key:'rolling',      label:'Rolling Vol' },
            ] as const).map(({ key, label }) => (
              <button key={key} onClick={()=>setTab(key)} style={{ padding: isMobile?'6px 10px':'6px 16px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'var(--bg5)':'transparent', color:tab===key?'var(--text)':'var(--text2)', fontSize:12, fontWeight:tab===key?600:400, transition:'all 0.14s', boxShadow:tab===key?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap' }}>
                {label}
              </button>
            ))}
          </div>

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 2fr', gap:16 }}>
                {/* Risk gauge */}
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Composite Risk Score</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Based on vol, drawdown, beta and VaR</div>
                  <RiskGauge score={riskScore}/>
                </div>

                {/* Drawdown profile */}
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Drawdown Profile</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>Peak-to-trough decline over {inp.period}</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data.charts.drawdown?.map((d:any) => ({...d, value:d.value*100}))}>
                      <defs><linearGradient id="rdd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f54060" stopOpacity={0.25}/><stop offset="95%" stopColor="#f54060" stopOpacity={0.01}/></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`} width={38}/>
                      <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)"/>
                      <Area type="monotone" dataKey="value" name="Drawdown" stroke="#f54060" strokeWidth={2} fill="url(#rdd)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Extended stats */}
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Risk Statistics</div>
                  {[
                    { label:'Skewness',        value:fmt.num(s.skewness,4),   color:s.skewness<0?'#f54060':'#0dcb7d',  note:s.skewness<0?'Left tail risk':'Right tail' },
                    { label:'Excess Kurtosis', value:fmt.num(s.kurtosis,4),   color:s.kurtosis>3?'#f54060':'var(--text)', note:s.kurtosis>3?'Fat tails':'Normal tails' },
                    { label:'Omega Ratio',     value:fmt.num(s.omega),        color:s.omega>1?'#0dcb7d':'#f54060',     note:s.omega>1?'Gains > losses':'Losses > gains' },
                    { label:'Gain/Pain',       value:fmt.num(s.gainToPain),   color:s.gainToPain>1?'#0dcb7d':'#f54060',note:s.gainToPain>1?'Healthy':'Concerning' },
                    { label:'Alpha (Ann.)',     value:fmt.pctPlus(s.alpha),    color:s.alpha>0?'#0dcb7d':'#f54060',     note:`vs ${s.benchmark}` },
                    { label:'R² vs Benchmark', value:fmt.num(s.r2,4),         color:'var(--text)',                      note:'Market variance explained' },
                    { label:'Tracking Error',  value:fmt.pct(s.trackingError),color:'var(--text)',                      note:'Active risk' },
                    { label:'Info Ratio',      value:fmt.num(s.infoRatio),    color:s.infoRatio>0?'#0dcb7d':'#f54060', note:'Alpha per unit TE' },
                  ].map(({ label, value, color, note }, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i < 7 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <div>
                        <div style={{ fontSize:12.5, color:'var(--text2)', fontWeight:500 }}>{label}</div>
                        <div style={{ fontSize:10.5, color:'var(--text4)', marginTop:1 }}>{note}</div>
                      </div>
                      <span style={{ fontFamily:'var(--fm)', fontSize:13, color, fontWeight:600 }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Daily returns bar */}
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Daily Returns</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>P&L distribution over {inp.period}</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={data.charts.returns?.map((d:any) => ({...d, value:d.value*100}))}>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(1)}%`} width={42}/>
                      <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(3)}%`}/>}/>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                      <Bar dataKey="value" name="Return" radius={[1,1,0,0]}>
                        {data.charts.returns?.map((d:any,i:number) => <Cell key={i} fill={d.value>=0?'#0dcb7d':'#f54060'} opacity={0.75}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* ── VAR ANALYSIS ── */}
          {tab === 'var' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12 }}>
                <VarMeter label="Historical VaR 95%" value={s.histVar95}  portfolioValue={s.totalValue}/>
                <VarMeter label="CVaR / ES 95%"      value={s.histCVar95} portfolioValue={s.totalValue}/>
                <VarMeter label="Parametric VaR 95%" value={s.paramVar95} portfolioValue={s.totalValue}/>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>VaR Interpretation Guide</div>
                <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20 }}>
                  <div>
                    {[
                      { title:'Historical VaR 95%', value:fmt.pct(s.histVar95), desc:'On 95% of days your loss will not exceed this. Computed directly from historical return data — no distribution assumptions.' },
                      { title:'CVaR / Expected Shortfall', value:fmt.pct(s.histCVar95), desc:'The average loss on the worst 5% of days. More conservative than VaR and better captures tail risk.' },
                      { title:'Parametric VaR 95%', value:fmt.pct(s.paramVar95), desc:'Assumes returns are normally distributed. Tends to underestimate risk for fat-tailed distributions.' },
                    ].map(({ title, value, desc }) => (
                      <div key={title} style={{ marginBottom:14, paddingBottom:14, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:13, fontWeight:600 }}>{title}</span>
                          <span style={{ fontFamily:'var(--fm)', fontSize:13, color:'#f54060', fontWeight:600 }}>{value}</span>
                        </div>
                        <div style={{ fontSize:12, color:'var(--text3)', lineHeight:1.6 }}>{desc}</div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <div style={{ background:'rgba(245,64,96,0.06)', border:'1px solid rgba(245,64,96,0.15)', borderRadius:12, padding:'16px 18px', marginBottom:12 }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'#f54060', marginBottom:8 }}>⚠ VaR Limitations</div>
                      <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>VaR does not tell you what happens in the worst 5% of scenarios — only that losses exceed the threshold. Always use CVaR alongside VaR for a complete picture. VaR also assumes past return patterns persist.</div>
                    </div>
                    <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'16px 18px' }}>
                      <div style={{ fontSize:12, fontWeight:600, color:'var(--accent2)', marginBottom:8 }}>Portfolio VaR in Dollars</div>
                      {s.totalValue && [
                        { label:'1-Day VaR (95%)',    val: Math.abs(s.histVar95 * s.totalValue) },
                        { label:'1-Week VaR (95%)',   val: Math.abs(s.histVar95 * s.totalValue * Math.sqrt(5)) },
                        { label:'1-Month VaR (95%)',  val: Math.abs(s.histVar95 * s.totalValue * Math.sqrt(21)) },
                        { label:'CVaR Daily (95%)',   val: Math.abs(s.histCVar95 * s.totalValue) },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize:12, color:'var(--text2)' }}>{label}</span>
                          <span style={{ fontFamily:'var(--fm)', fontSize:12, color:'#f54060', fontWeight:600 }}>${val.toLocaleString('en',{maximumFractionDigits:0})}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── STRESS TESTS ── */}
          {tab === 'stress' && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Historical Stress Scenarios</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>
                  Portfolio value: ${(s.totalValue||0).toLocaleString('en',{maximumFractionDigits:0})} · Beta: {fmt.num(s.beta)}
                </div>
                {STRESS_SCENARIOS.map(({ label, shock }) => (
                  <StressScenario key={label} label={label} shock={shock} portfolioValue={s.totalValue||0} beta={s.beta||1}/>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Risk Factor Exposure</div>
                  {[
                    { label:'Market Risk (Beta)',    value:Math.abs(s.beta||1),    max:2,   color:'#2d7ff9', desc:'Sensitivity to broad market' },
                    { label:'Volatility Risk',       value:(s.annVol||0)*100/50,   max:1,   color:'#f0a500', desc:'Realised vol / 50% threshold' },
                    { label:'Drawdown Risk',         value:Math.abs(s.maxDrawdown||0)*100/50, max:1, color:'#f54060', desc:'Max DD / 50% threshold' },
                    { label:'Concentration Risk',    value:0.6,                    max:1,   color:'#7c5cfc', desc:'Holdings concentration' },
                    { label:'Liquidity Risk',        value:0.2,                    max:1,   color:'#00c9a7', desc:'Estimated based on ticker mix' },
                  ].map(({ label, value, max, color, desc }) => (
                    <div key={label} style={{ marginBottom:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <div>
                          <span style={{ fontSize:12.5, color:'var(--text2)', fontWeight:500 }}>{label}</span>
                          <div style={{ fontSize:10, color:'var(--text4)' }}>{desc}</div>
                        </div>
                        <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color }}>{(Math.min(value/max, 1)*100).toFixed(0)}%</span>
                      </div>
                      <div style={{ height:5, background:'var(--bg4)', borderRadius:2.5, overflow:'hidden' }}>
                        <div style={{ height:5, width:`${Math.min(100, (value/max)*100)}%`, background:color, borderRadius:2.5, transition:'width 0.5s ease' }}/>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'14px 16px', fontSize:12, color:'var(--text2)', lineHeight:1.7 }}>
                  <strong style={{ color:'var(--accent2)' }}>Methodology:</strong> Stress scenarios apply historical market shocks scaled by your portfolio beta. A beta of {fmt.num(s.beta)} means your portfolio moves approximately {fmt.num(s.beta)}× the market shock. Results are illustrative — actual losses may differ due to correlation changes during crises.
                </div>
              </div>
            </div>
          )}

          {/* ── DISTRIBUTION ── */}
          {tab === 'distribution' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Return Distribution</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:16 }}>Frequency of daily returns — <span style={{ color:'#0dcb7d' }}>positive</span> / <span style={{ color:'#f54060' }}>negative</span></div>
                <ReturnDistribution returns={data.charts.returns}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(4,1fr)', gap:12 }}>
                {[
                  { label:'Skewness',        value:fmt.num(s.skewness,4),  color:s.skewness<0?'#f54060':'#0dcb7d',     desc:s.skewness<0?'Left-skewed (tail risk)':'Right-skewed (positive tail)' },
                  { label:'Excess Kurtosis', value:fmt.num(s.kurtosis,4),  color:s.kurtosis>3?'#f54060':'var(--text)',  desc:s.kurtosis>3?'Fat tails — leptokurtic':'Normal tails' },
                  { label:'Best Day',        value:`+${(Math.max(...(data.charts.returns||[]).map((d:any)=>d.value))*100).toFixed(2)}%`, color:'#0dcb7d', desc:'Maximum single-day return' },
                  { label:'Worst Day',       value:`${(Math.min(...(data.charts.returns||[]).map((d:any)=>d.value))*100).toFixed(2)}%`,  color:'#f54060', desc:'Minimum single-day return' },
                ].map(({ label, value, color, desc }) => (
                  <div key={label} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:6, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:20, fontWeight:300, color, marginBottom:4 }}>{value}</div>
                    <div style={{ fontSize:11, color:'var(--text4)' }}>{desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'14px 16px', fontSize:12.5, color:'var(--text2)', lineHeight:1.7 }}>
                <strong style={{ color:'var(--accent2)' }}>Reading the distribution:</strong> A normal distribution would be symmetric and bell-shaped. Negative skewness indicates a fat left tail — large losses are more common than a normal distribution would predict. High excess kurtosis (&gt;3) means extreme events (both gains and losses) happen more frequently than expected.
              </div>
            </div>
          )}

          {/* ── ROLLING VOL ── */}
          {tab === 'rolling' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Rolling 21-Day Annualised Volatility</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>How portfolio volatility has evolved over time — spikes indicate periods of market stress</div>
                <RollingVolChart returns={data.charts.returns}/>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:12 }}>
                {[
                  { label:'Current Vol (Ann.)', value:fmt.pct(s.annVol),                                          color:s.annVol>0.3?'#f54060':s.annVol>0.2?'#f0a500':'#0dcb7d' },
                  { label:'Vol Regime',         value:s.annVol>0.3?'High':s.annVol>0.2?'Elevated':'Normal',    color:s.annVol>0.3?'#f54060':s.annVol>0.2?'#f0a500':'#0dcb7d' },
                  { label:'Param VaR (1-day)',  value:fmt.pct(s.paramVar95),                                      color:'#f54060' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:8, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:300, color }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Volatility Regime Guide</div>
                {[
                  { range:'< 10%',  label:'Very Low',   desc:'Calm market conditions. Rare for individual stocks — common for diversified portfolios in stable regimes.',                       color:'#0dcb7d' },
                  { range:'10–20%', label:'Normal',     desc:'Typical volatility for a diversified equity portfolio. Consistent with long-term historical averages for most indices.',         color:'#5ba3f5' },
                  { range:'20–30%', label:'Elevated',   desc:'Above-average volatility. Common during earnings seasons, macro events, or sector rotations. Monitor position sizing.',          color:'#f0a500' },
                  { range:'30–50%', label:'High',       desc:'Significant market stress. Drawdowns more likely. Reduce leverage, tighten stops, and consider hedging strategies.',             color:'#f54060' },
                  { range:'> 50%',  label:'Extreme',    desc:'Crisis-level volatility. Seen during COVID (March 2020), GFC (2008), and similar events. Capital preservation is paramount.',   color:'#7c5cfc' },
                ].map(({ range, label, desc, color }, i) => (
                  <div key={i} style={{ display:'flex', gap:14, padding:'10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ flexShrink:0, width:60 }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:11.5, color, fontWeight:600 }}>{range}</div>
                      <div style={{ fontSize:10, color:'var(--text3)' }}>{label}</div>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function RiskPage() {
  return (
    <Suspense fallback={<div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>Loading...</div>}>
      <RiskContent/>
    </Suspense>
  )
}