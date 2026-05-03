'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'
import { Zap, RefreshCw, ChevronRight, AlertTriangle, Shield, Activity } from 'lucide-react'

const fmt = {
  pct:     (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`,
  pctPlus: (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`,
  num:     (v: any, d=2) => v == null ? '—' : Number(v).toFixed(d),
}

const DEFAULT = { tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'1y', benchmark:'SPY', riskFree:'2.0' }

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>{label}</div>
      {payload.map((p:any,i:number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:90 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn?fn(p.value):Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

function RiskGauge({ score }: { score: number }) {
  const w = 240, h = 100, cx = 120, cy = 96, r = 78
  const clamped = Math.min(100, Math.max(0, score))
  function xy(angle: number, radius: number) {
    const rad = (angle - 180) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }
  function arc(a1: number, a2: number, ar: number) {
    const s=xy(a1,ar), e=xy(a2,ar)
    return `M ${s.x} ${s.y} A ${ar} ${ar} 0 ${a2-a1>180?1:0} 1 ${e.x} ${e.y}`
  }
  const needleAngle = clamped * 1.8
  const needle = xy(needleAngle, r - 16)
  const color = clamped < 30 ? '#0dcb7d' : clamped < 60 ? '#f0a500' : '#f54060'
  return (
    <div style={{ textAlign:'center' }}>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:'block', maxWidth:220, margin:'0 auto' }}>
        <path d={arc(0,60,r)}   fill="none" stroke="rgba(13,203,125,0.35)"  strokeWidth={12} strokeLinecap="round"/>
        <path d={arc(60,120,r)} fill="none" stroke="rgba(240,165,0,0.35)"   strokeWidth={12} strokeLinecap="round"/>
        <path d={arc(120,180,r)}fill="none" stroke="rgba(245,64,96,0.35)"   strokeWidth={12} strokeLinecap="round"/>
        <path d={arc(0,needleAngle,r)} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round" opacity={0.9}/>
        <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r={5} fill={color}/>
        <text x={12}   y={h-2} fontSize={8} fill="rgba(255,255,255,0.3)">Low</text>
        <text x={cx}   y={14}  fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="middle">Med</text>
        <text x={w-12} y={h-2} fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="end">High</text>
      </svg>
      <div style={{ fontFamily:'var(--fm)', fontSize:26, fontWeight:300, color, marginTop:-6 }}>{clamped.toFixed(0)}</div>
      <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>{clamped<30?'Low Risk':clamped<60?'Moderate':'High Risk'}</div>
    </div>
  )
}

function RiskAlert({ condition, message, severity }: { condition: boolean; message: string; severity: 'high'|'med'|'ok'|'info' }) {
  if (!condition) return null
  const c = { high:{bg:'rgba(245,64,96,0.08)',border:'rgba(245,64,96,0.25)',color:'#f54060',icon:<AlertTriangle size={13}/>}, med:{bg:'rgba(240,165,0,0.08)',border:'rgba(240,165,0,0.2)',color:'#f0a500',icon:<AlertTriangle size={13}/>}, ok:{bg:'rgba(13,203,125,0.08)',border:'rgba(13,203,125,0.2)',color:'#0dcb7d',icon:<Shield size={13}/>}, info:{bg:'rgba(45,127,249,0.08)',border:'rgba(45,127,249,0.2)',color:'#2d7ff9',icon:<Activity size={13}/>} }[severity]
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', borderRadius:9, background:c.bg, border:`1px solid ${c.border}`, marginBottom:8 }}>
      <span style={{ color:c.color, flexShrink:0, marginTop:1 }}>{c.icon}</span>
      <span style={{ fontSize:12.5, color:c.color, lineHeight:1.5 }}>{message}</span>
    </div>
  )
}

function RollingVolChart({ returns, isMobile }: { returns: any[]; isMobile: boolean }) {
  if (!returns?.length) return null
  const vals = returns.map((d:any) => ({ date:d.date, ret:d.value }))
  const rollingVol: { date:string; vol:number }[] = []
  for (let i = 20; i < vals.length; i++) {
    const w = vals.slice(i-20,i+1).map(v=>v.ret)
    const mean = w.reduce((a,b)=>a+b,0)/w.length
    const variance = w.reduce((s,v)=>s+(v-mean)**2,0)/w.length
    rollingVol.push({ date:vals[i].date, vol:+(Math.sqrt(variance)*Math.sqrt(252)*100).toFixed(2) })
  }
  return (
    <ResponsiveContainer width="100%" height={isMobile?140:160}>
      <AreaChart data={rollingVol} margin={{ top:5, right:5, bottom:0, left:0 }}>
        <defs><linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f0a500" stopOpacity={0.2}/><stop offset="95%" stopColor="#f0a500" stopOpacity={0}/></linearGradient></defs>
        <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
        <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={36}/>
        <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
        <Area type="monotone" dataKey="vol" name="Rolling Vol" stroke="#f0a500" strokeWidth={1.8} fill="url(#vg)" dot={false}/>
      </AreaChart>
    </ResponsiveContainer>
  )
}

function RiskContent() {
  const [inp, setInp]     = useState(DEFAULT)
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab]     = useState<'overview'|'var'|'stress'|'rolling'>('overview')
  const [isMobile, setIsMobile] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    const t=searchParams.get('tickers'), s=searchParams.get('shares'), bp=searchParams.get('buyPrices')
    if (t && s && bp) setInp(prev=>({...prev,tickers:t,shares:s,buyPrices:bp}))
  }, [searchParams])

  const run = async () => {
    setLoading(true); setError('')
    try { setData(await api.portfolio.analytics({ tickers:inp.tickers, shares:inp.shares, buyPrices:inp.buyPrices, period:inp.period, benchmark:inp.benchmark, riskFree:parseFloat(inp.riskFree)/100 })) }
    catch(e:any) { setError(e.message||'Failed') }
    finally { setLoading(false) }
  }

  const s = data?.summary
  const riskScore = s ? (() => {
    let score = 50
    if (s.annVol > 0.3) score += 20; else if (s.annVol > 0.2) score += 10; else score -= 10
    if (Math.abs(s.maxDrawdown) > 0.3) score += 15; else if (Math.abs(s.maxDrawdown) > 0.15) score += 5; else score -= 5
    if (s.beta > 1.5) score += 15; else if (s.beta > 1) score += 5; else if (s.beta < 0.7) score -= 10
    if (s.sharpe < 0.5) score += 10; else if (s.sharpe > 1.5) score -= 10
    if (Math.abs(s.histVar95||0) > 0.03) score += 10
    return Math.min(100, Math.max(0, score))
  })() : 50

  const SCENARIOS = [
    { label:'2008 Crisis',      shock:-0.50 },
    { label:'COVID Mar 2020',   shock:-0.34 },
    { label:'2022 Rate Shock',  shock:-0.25 },
    { label:'Flash Crash 2010', shock:-0.10 },
    { label:'Dot-Com 2000-02',  shock:-0.49 },
    { label:'Bull Rally',       shock:+0.25 },
    { label:'Melt-Up',          shock:+0.40 },
  ]

  return (
    <div style={{ padding: isMobile?'0 12px 100px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'20px 0 16px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(245,64,96,0.12)', border:'1px solid rgba(245,64,96,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Zap size={15} color="var(--red)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?18:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:2 }}>Risk & Attribution</h1>
            <div style={{ fontSize:11, color:'var(--text3)' }}>VaR · CVaR · Drawdown · Stress Tests</div>
          </div>
        </div>
        {data && <Badge variant="red">Risk Analysis</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr 1fr 1fr', gap:10, marginBottom:12 }}>
          {[
            { label:'Tickers', key:'tickers', placeholder:'AAPL,MSFT,NVDA' },
            { label:'Shares',  key:'shares',  placeholder:'20,15,10' },
            { label:'Buy Prices ($)', key:'buyPrices', placeholder:'182,380,650' },
            { label:'Risk-Free %',    key:'riskFree',  placeholder:'2.0' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              <input className="qd-input" placeholder={placeholder} value={(inp as any)[key]} onChange={e=>setInp(x=>({...x,[key]:e.target.value}))} style={{ fontSize:13 }}/>
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'flex-end', flexWrap:'wrap' }}>
          <div style={{ display:'flex', gap:8, flex:1 }}>
            {[
              { label:'Period',    key:'period',    options:['1mo','3mo','6mo','1y','2y','5y'] },
              { label:'Benchmark', key:'benchmark', options:['SPY','QQQ','DIA','IWM'] },
            ].map(({ label, key, options }) => (
              <div key={key} style={{ flex:1 }}>
                <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
                <select className="qd-select" style={{ width:'100%' }} value={(inp as any)[key]} onChange={e=>setInp(x=>({...x,[key]:e.target.value}))}>
                  {options.map(o=><option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={run} disabled={loading} style={{ padding:'9px 18px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#f54060,#c0392b)', border:'1px solid rgba(245,64,96,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7, flexShrink:0, whiteSpace:'nowrap' }}>
            {loading?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<ChevronRight size={13}/>}
            {isMobile?(loading?'...':'Run'):(loading?'Analysing...':'Run Analysis')}
          </button>
        </div>
        {error && <div style={{ marginTop:10, fontSize:12, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?32:52, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:14, opacity:0.3 }}>⚡</div>
          <div style={{ fontFamily:'var(--fd)', fontSize: isMobile?16:18, fontWeight:700, marginBottom:8 }}>Risk Analysis Ready</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:380, margin:'0 auto 20px', lineHeight:1.7 }}>Run a full risk analysis — VaR, CVaR, drawdown, stress testing and rolling volatility.</div>
          <button onClick={run} style={{ padding:'10px 24px', borderRadius:9, background:'linear-gradient(135deg,#f54060,#c0392b)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Analyse Default Portfolio
          </button>
        </div>
      )}

      {data && s && (
        <>
          {/* Alerts — condensed on mobile */}
          <div style={{ marginBottom:16 }}>
            <RiskAlert condition={s.beta > 1.5}                    message={`Very high beta (${fmt.num(s.beta,3)}) — amplifies market moves by ${(s.beta*100).toFixed(0)}%.`} severity="high"/>
            <RiskAlert condition={s.beta > 1.2 && s.beta <= 1.5}   message={`Elevated beta (${fmt.num(s.beta,3)}) — more volatile than market.`} severity="med"/>
            <RiskAlert condition={Math.abs(s.maxDrawdown) > 0.3}   message={`Severe drawdown (${fmt.pct(s.maxDrawdown)}) — large peak-to-trough losses.`} severity="high"/>
            <RiskAlert condition={s.sharpe < 0}                    message="Negative Sharpe — losing money on risk-adjusted basis." severity="high"/>
            <RiskAlert condition={s.sharpe > 1.5}                  message={`Excellent Sharpe (${fmt.num(s.sharpe,3)}) — strong risk-adjusted returns.`} severity="ok"/>
            <RiskAlert condition={s.alpha > 0.05}                  message={`Strong alpha (${fmt.pctPlus(s.alpha)}) — outperforming ${s.benchmark}.`} severity="ok"/>
          </div>

          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:10 }}>
            <MetricCard label="Ann. Volatility" value={fmt.pct(s.annVol)}      delta="Realised vol"     accent={s.annVol>0.3?'#f54060':undefined}/>
            <MetricCard label="Max Drawdown"    value={fmt.pct(s.maxDrawdown)} delta="Peak to trough"  deltaUp={false} accent="#f54060"/>
            <MetricCard label="VaR 95%"         value={fmt.pct(s.histVar95)}   delta="Daily threshold" deltaUp={false}/>
            <MetricCard label="CVaR 95%"        value={fmt.pct(s.histCVar95)}  delta="Exp. shortfall"  deltaUp={false}/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
            <MetricCard label="Sharpe"   value={fmt.num(s.sharpe)}  delta="Return/risk"  deltaUp={s.sharpe>1} accent={s.sharpe>1?'#0dcb7d':undefined}/>
            <MetricCard label="Sortino"  value={fmt.num(s.sortino)} delta="Downside adj." deltaUp={s.sortino>1}/>
            <MetricCard label="Beta"     value={fmt.num(s.beta)}    delta={`vs ${s.benchmark}`}/>
            <MetricCard label="Calmar"   value={fmt.num(s.calmar)}  delta="Return/MaxDD"  deltaUp={s.calmar>1}/>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom:16, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <div style={{ display:'flex', gap:3, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content', minWidth: isMobile?'100%':undefined }}>
              {([
                { key:'overview', label:'Overview' },
                { key:'var',      label:'VaR' },
                { key:'stress',   label:'Stress' },
                { key:'rolling',  label:'Rolling Vol' },
              ] as const).map(({ key, label }) => (
                <button key={key} onClick={()=>setTab(key)} style={{ padding: isMobile?'7px 12px':'6px 16px', borderRadius:7, border:'none', cursor:'pointer', background:tab===key?'var(--bg5)':'transparent', color:tab===key?'var(--text)':'var(--text2)', fontSize:12, fontWeight:tab===key?600:400, transition:'all 0.14s', boxShadow:tab===key?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap', flex: isMobile?1:'none' }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* OVERVIEW */}
          {tab==='overview' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 2fr', gap:14 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Risk Score</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Vol · drawdown · beta · VaR</div>
                  <RiskGauge score={riskScore}/>
                </div>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Drawdown Profile</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Peak-to-trough · {inp.period}</div>
                  <ResponsiveContainer width="100%" height={isMobile?140:180}>
                    <AreaChart data={data.charts.drawdown?.map((d:any)=>({...d,value:d.value*100}))}>
                      <defs><linearGradient id="rdd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f54060" stopOpacity={0.25}/><stop offset="95%" stopColor="#f54060" stopOpacity={0.01}/></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`} width={36}/>
                      <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
                      <Area type="monotone" dataKey="value" name="Drawdown" stroke="#f54060" strokeWidth={2} fill="url(#rdd)" dot={false}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:14 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Risk Statistics</div>
                  {[
                    { label:'Skewness',    value:fmt.num(s.skewness,4),    color:s.skewness<0?'#f54060':'#0dcb7d', note:s.skewness<0?'Left tail':'Right tail' },
                    { label:'Kurtosis',    value:fmt.num(s.kurtosis,4),    color:s.kurtosis>3?'#f54060':'var(--text)', note:s.kurtosis>3?'Fat tails':'Normal' },
                    { label:'Omega',       value:fmt.num(s.omega),         color:s.omega>1?'#0dcb7d':'#f54060', note:s.omega>1?'Gains > losses':'Losses > gains' },
                    { label:'Gain/Pain',   value:fmt.num(s.gainToPain),    color:s.gainToPain>1?'#0dcb7d':'#f54060', note:s.gainToPain>1?'Healthy':'Concerning' },
                    { label:'Alpha',       value:fmt.pctPlus(s.alpha),     color:s.alpha>0?'#0dcb7d':'#f54060', note:`vs ${s.benchmark}` },
                    { label:'R²',          value:fmt.num(s.r2,4),          color:'var(--text)', note:'Market explained' },
                    { label:'Track Error', value:fmt.pct(s.trackingError), color:'var(--text)', note:'Active risk' },
                    { label:'Info Ratio',  value:fmt.num(s.infoRatio),     color:s.infoRatio>0?'#0dcb7d':'#f54060', note:'Alpha per TE' },
                  ].map(({ label, value, color, note }, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 0', borderBottom:i<7?'1px solid rgba(255,255,255,0.04)':'none' }}>
                      <div>
                        <div style={{ fontSize:12, color:'var(--text2)', fontWeight:500 }}>{label}</div>
                        <div style={{ fontSize:10, color:'var(--text4)' }}>{note}</div>
                      </div>
                      <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color, fontWeight:600 }}>{value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Daily Returns</div>
                  <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>P&L · {inp.period}</div>
                  <ResponsiveContainer width="100%" height={isMobile?160:200}>
                    <BarChart data={data.charts.returns?.map((d:any)=>({...d,value:d.value*100}))}>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(1)}%`} width={40}/>
                      <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(3)}%`}/>}/>
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                      <Bar dataKey="value" name="Return" radius={[1,1,0,0]}>
                        {data.charts.returns?.map((d:any,i:number)=><Cell key={i} fill={d.value>=0?'#0dcb7d':'#f54060'} opacity={0.75}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* VAR */}
          {tab==='var' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {[
                  { label:'Historical VaR 95%', value:s.histVar95,  tv:s.totalValue },
                  { label:'CVaR / ES 95%',       value:s.histCVar95, tv:s.totalValue },
                  { label:'Parametric VaR 95%',  value:s.paramVar95, tv:s.totalValue },
                ].map(({ label, value, tv }) => {
                  const pct = Math.abs((value||0)*100)
                  const fill = pct>5?'#f54060':pct>3?'#f0a500':'#0dcb7d'
                  const dollar = tv ? Math.abs((value||0)*tv) : null
                  return (
                    <div key={label} style={{ background:'var(--bg3)', borderRadius:12, padding:'14px', border:`1px solid ${fill}22`, gridColumn: label.includes('Param')?'span 2':undefined }}>
                      <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8, fontWeight:600 }}>{label}</div>
                      <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:300, color:fill, marginBottom:dollar?4:8 }}>{pct.toFixed(2)}%</div>
                      {dollar && <div style={{ fontSize:11, color:'var(--text3)', marginBottom:8 }}>${dollar.toLocaleString('en',{maximumFractionDigits:0})} at risk</div>}
                      <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                        <div style={{ height:4, width:`${Math.min(100,pct*8)}%`, background:fill, borderRadius:2 }}/>
                      </div>
                    </div>
                  )
                })}
              </div>

              {s.totalValue && (
                <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'16px' }}>
                  <div style={{ fontSize:12, fontWeight:600, color:'var(--accent2)', marginBottom:10 }}>VaR in Dollars (Portfolio: ${s.totalValue.toLocaleString('en',{maximumFractionDigits:0})})</div>
                  {[
                    { label:'1-Day VaR 95%',  val:Math.abs((s.histVar95||0)*s.totalValue) },
                    { label:'1-Week VaR 95%', val:Math.abs((s.histVar95||0)*s.totalValue*Math.sqrt(5)) },
                    { label:'1-Month VaR 95%',val:Math.abs((s.histVar95||0)*s.totalValue*Math.sqrt(21)) },
                    { label:'CVaR Daily 95%', val:Math.abs((s.histCVar95||0)*s.totalValue) },
                  ].map(({ label, val }) => (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <span style={{ fontSize:12.5, color:'var(--text2)' }}>{label}</span>
                      <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color:'#f54060', fontWeight:600 }}>${val.toLocaleString('en',{maximumFractionDigits:0})}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STRESS */}
          {tab==='stress' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Historical Stress Scenarios</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>Value: ${(s.totalValue||0).toLocaleString('en',{maximumFractionDigits:0})} · Beta: {fmt.num(s.beta)}</div>
                {SCENARIOS.map(({ label, shock }) => {
                  const impact = shock * (s.beta||1) * (s.totalValue||0)
                  const impactPct = shock * (s.beta||1) * 100
                  const color = impact < 0 ? '#f54060' : '#0dcb7d'
                  return (
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 12px', background:'var(--bg3)', borderRadius:9, marginBottom:6 }}>
                      <div>
                        <div style={{ fontSize:12.5, fontWeight:600, marginBottom:2 }}>{label}</div>
                        <div style={{ fontSize:10, color:Math.abs(shock)>0.3?'#f54060':Math.abs(shock)>0.15?'#f0a500':'#5ba3f5', fontWeight:600 }}>
                          {Math.abs(shock)>0.3?'Severe':Math.abs(shock)>0.15?'Moderate':'Mild'} · {shock>0?'+':''}{(shock*100).toFixed(0)}%
                        </div>
                      </div>
                      <div style={{ textAlign:'right' }}>
                        <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color }}>{impact>=0?'+':''}${Math.abs(impact).toLocaleString('en',{maximumFractionDigits:0})}</div>
                        <div style={{ fontSize:10.5, color, fontFamily:'var(--fm)' }}>{impactPct>=0?'+':''}{impactPct.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ROLLING VOL */}
          {tab==='rolling' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding: isMobile?'14px':'18px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Rolling 21-Day Annualised Volatility</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>Spikes indicate periods of market stress</div>
                <RollingVolChart returns={data.charts.returns} isMobile={isMobile}/>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                {[
                  { label:'Current Vol (Ann.)', value:fmt.pct(s.annVol),   color:s.annVol>0.3?'#f54060':s.annVol>0.2?'#f0a500':'#0dcb7d' },
                  { label:'Vol Regime',          value:s.annVol>0.3?'High':s.annVol>0.2?'Elevated':'Normal', color:s.annVol>0.3?'#f54060':s.annVol>0.2?'#f0a500':'#0dcb7d' },
                  { label:'Param VaR (1-day)',   value:fmt.pct(s.paramVar95), color:'#f54060' },
                  { label:'Calmar Ratio',        value:fmt.num(s.calmar),   color:s.calmar>1?'#0dcb7d':'var(--text)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px' }}>
                    <div style={{ fontSize:9.5, color:'var(--text3)', marginBottom:7, textTransform:'uppercase', letterSpacing:'0.5px', fontWeight:600 }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?18:22, fontWeight:300, color }}>{value}</div>
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