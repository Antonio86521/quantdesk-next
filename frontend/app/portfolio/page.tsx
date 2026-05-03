'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import MetricCard from '@/components/ui/MetricCard'
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { TrendingUp, RefreshCw, ChevronRight } from 'lucide-react'

// ── Formatters ────────────────────────────────────────────────────────────────
const pct    = (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`
const plus   = (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`
const num    = (v: any, d = 2) => v == null ? '—' : Number(v).toFixed(d)
const dollar = (v: any) => {
  if (v == null) return '—'
  if (v >= 1e6) return `$${(v/1e6).toFixed(2)}M`
  if (v >= 1e3) return `$${v.toLocaleString('en',{maximumFractionDigits:0})}`
  return `$${Number(v).toFixed(2)}`
}
const dplus = (v: any) => v == null ? '—' : `${v>=0?'+':''}${dollar(v)}`

const COLORS = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7','#e05c3a','#5ba3f5']
const DEFAULT = {
  tickers:'AAPL,MSFT,NVDA,GOOGL,SPY',
  shares:'20,15,10,25,50',
  buyPrices:'182,380,650,160,490',
  period:'1y', benchmark:'SPY', riskFree:'2.0',
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:90 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn ? fn(p.value) : Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function PortfolioContent() {
  const [inputs, setInputs]         = useState(DEFAULT)
  const [data, setData]             = useState<any>(null)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [tab, setTab]               = useState<'performance'|'risk'|'holdings'|'technicals'>('performance')
  const [techTicker, setTechTicker] = useState('')
  const [techData, setTechData]     = useState<any>(null)
  const [techLoading, setTechLoading] = useState(false)
  const [autoRun, setAutoRun]       = useState(false)
  const [mob, setMob]               = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  useEffect(() => {
    const t = searchParams.get('tickers')
    const s = searchParams.get('shares')
    const bp = searchParams.get('buyPrices')
    const p  = searchParams.get('period')
    const b  = searchParams.get('benchmark')
    if (t && s && bp) {
      setInputs(prev => ({ ...prev, tickers:t, shares:s, buyPrices:bp, period:p||prev.period, benchmark:b||prev.benchmark }))
      setAutoRun(true)
    }
  }, [searchParams])

  useEffect(() => { if (autoRun) { setAutoRun(false); analyze() } }, [autoRun])

  const analyze = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.portfolio.analytics({
        tickers: inputs.tickers, shares: inputs.shares, buyPrices: inputs.buyPrices,
        period: inputs.period, benchmark: inputs.benchmark,
        riskFree: parseFloat(inputs.riskFree) / 100,
      })
      setData(r)
      setTechTicker(inputs.tickers.split(',')[0].trim().toUpperCase())
    } catch (e: any) { setError(e.message || 'Failed') }
    finally { setLoading(false) }
  }

  const loadTech = async (ticker: string) => {
    setTechLoading(true)
    try { setTechData(await api.technicals(ticker, inputs.period)) }
    catch { setTechData(null) }
    finally { setTechLoading(false) }
  }

  useEffect(() => { if (tab === 'technicals' && techTicker) loadTech(techTicker) }, [tab, techTicker])

  const s       = data?.summary
  const tickers = inputs.tickers.split(',').map(t => t.trim().toUpperCase())
  const cH      = mob ? 160 : 260   // chart height
  const pad     = mob ? '12px' : '16px 20px'

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: mob ? '0 12px 100px' : '0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'20px 0 16px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(45,127,249,0.12)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <TrendingUp size={15} color="var(--accent2)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize:mob?18:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:2 }}>Portfolio Analytics</h1>
            <div style={{ fontSize:11, color:'var(--text3)' }}>Performance · Risk · Attribution · Technicals</div>
          </div>
        </div>
        {data && <Badge variant="green" dot>Live</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:mob?'14px':'18px 20px', marginBottom:16 }}>
        <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr 1fr 1fr', gap:10, marginBottom:12 }}>
          {[
            { label:'Tickers',       key:'tickers',   placeholder:'AAPL,MSFT,NVDA', span:mob?1:2 },
            { label:'Shares',        key:'shares',    placeholder:'20,15,10',        span:1 },
            { label:'Buy Prices ($)',key:'buyPrices', placeholder:'182,380,650',     span:1 },
            { label:'Risk-Free %',   key:'riskFree',  placeholder:'2.0',             span:1 },
          ].map(({ label, key, placeholder, span }) => (
            <div key={key} style={{ gridColumn:`span ${span}` }}>
              <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px' }}>{label}</div>
              <input className="qd-input" placeholder={placeholder} value={(inputs as any)[key]} onChange={e => setInputs(p => ({ ...p, [key]: e.target.value }))}/>
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
                <select className="qd-select" style={{ width:'100%' }} value={(inputs as any)[key]} onChange={e => setInputs(p => ({ ...p, [key]: e.target.value }))}>
                  {options.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            ))}
          </div>
          <button onClick={analyze} disabled={loading} style={{ padding:'9px 18px', borderRadius:8, cursor:loading?'not-allowed':'pointer', background:loading?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:7, whiteSpace:'nowrap', flexShrink:0 }}>
            {loading ? <RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/> : <ChevronRight size={13}/>}
            {mob ? (loading?'...':'Analyse') : (loading?'Analysing...':'Analyse Portfolio')}
          </button>
        </div>
        {error && <div style={{ marginTop:10, fontSize:12, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:mob?32:52, textAlign:'center' }}>
          <div style={{ fontSize:36, marginBottom:14, opacity:0.3 }}>📈</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:mob?16:18, fontWeight:700, marginBottom:8 }}>Ready to Analyse</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:360, margin:'0 auto 20px', lineHeight:1.7 }}>Enter your portfolio and tap Analyse to see performance, risk and charts.</div>
          <button onClick={analyze} style={{ padding:'10px 24px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Analyse Default Portfolio
          </button>
        </div>
      )}

      {data && s && (
        <>
          {/* KPIs */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:10 }}>
            <MetricCard label="Portfolio Value" value={dollar(s.totalValue)}  delta={`${dplus(s.unrealisedPnl)} P&L`} deltaUp={s.unrealisedPnl>=0} accent="#2d7ff9"/>
            <MetricCard label="Total Return"    value={plus(s.totalReturn)}   delta={inputs.period} deltaUp={s.totalReturn>=0}/>
            <MetricCard label="Ann. Return"     value={plus(s.annReturn)}     delta="Annualised" deltaUp={s.annReturn>=0}/>
            <MetricCard label="Ann. Volatility" value={pct(s.annVol)}         delta="Realised vol"/>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:16 }}>
            <MetricCard label="Sharpe"  value={num(s.sharpe)}      delta={s.sharpe>1?'Above 1.0':'Risk-adj.'} deltaUp={s.sharpe>1} accent={s.sharpe>1?'#0dcb7d':undefined}/>
            <MetricCard label="Sortino" value={num(s.sortino)}     delta="Downside-adj." deltaUp={s.sortino>1}/>
            <MetricCard label="Max DD"  value={pct(s.maxDrawdown)} delta="Peak to trough" deltaUp={false}/>
            <MetricCard label="Beta"    value={num(s.beta)}        delta={`vs ${s.benchmark}`}/>
          </div>

          {/* Tabs */}
          <div style={{ marginBottom:16, overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
            <div style={{ display:'flex', gap:3, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, minWidth:'fit-content' }}>
              {(['performance','risk','holdings','technicals'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)} style={{ padding:mob?'7px 14px':'7px 18px', borderRadius:7, border:'none', cursor:'pointer', background:tab===t?'var(--bg5)':'transparent', color:tab===t?'var(--text)':'var(--text2)', fontSize:12, fontWeight:tab===t?600:400, transition:'all 0.15s', textTransform:'capitalize', boxShadow:tab===t?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap' }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ── PERFORMANCE ── */}
          {tab === 'performance' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:3 }}>Growth of $1 — Portfolio vs {s.benchmark}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginBottom:12 }}>Normalised · {inputs.period}</div>
                <ResponsiveContainer width="100%" height={cH}>
                  <AreaChart data={data.charts.performance} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2d7ff9" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#2d7ff9" stopOpacity={0.01}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(2)}x`} width={42}/>
                    <Tooltip content={<Tip fn={(v:number) => `${v.toFixed(3)}x`}/>}/>
                    <ReferenceLine y={1} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3"/>
                    <Area type="monotone" dataKey="value" name="Portfolio" stroke="#2d7ff9" strokeWidth={2} fill="url(#pg)" dot={false}/>
                    {data.charts.benchmark?.length > 0 && (
                      <Line type="monotone" data={data.charts.benchmark} dataKey="value" name={s.benchmark} stroke="#304560" strokeWidth={1.5} dot={false} strokeDasharray="4 3"/>
                    )}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { title:'Drawdown', key:'drawdown', color:'#f54060', id:'ddg', mul:100, fmt:(v:number) => `${v.toFixed(2)}%` },
                  { title:'Daily Returns', key:'returns', color:'#2d7ff9', id:'retg', mul:100, fmt:(v:number) => `${v.toFixed(3)}%` },
                ].map(({ title, key, color, id, mul, fmt: fmtFn }) => (
                  <div key={key} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                    <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:10 }}>{title}</div>
                    <ResponsiveContainer width="100%" height={mob?120:180}>
                      <AreaChart data={data.charts[key]?.map((d:any) => ({ ...d, value: d.value * mul }))}>
                        <defs>
                          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%"  stopColor={color} stopOpacity={0.2}/>
                            <stop offset="95%" stopColor={color} stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                        <YAxis tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(0)}%`} width={34}/>
                        <Tooltip content={<Tip fn={fmtFn}/>}/>
                        <Area type="monotone" dataKey="value" name={title} stroke={color} strokeWidth={1.5} fill={`url(#${id})`} dot={false}/>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ))}
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Statistics</div>
                <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr', gap:mob?0:16 }}>
                  {[
                    [['Total Return',plus(s.totalReturn),s.totalReturn>=0],['Ann. Return',plus(s.annReturn),s.annReturn>=0],['Ann. Volatility',pct(s.annVol),null],['Sharpe Ratio',num(s.sharpe),s.sharpe>1],['Max Drawdown',pct(s.maxDrawdown),false],['Alpha (Ann.)',plus(s.alpha),s.alpha>0]],
                    [['Sortino Ratio',num(s.sortino),s.sortino>1],['Calmar Ratio',num(s.calmar),s.calmar>1],['Omega Ratio',num(s.omega),s.omega>1],['Beta',num(s.beta),null],['R²',num(s.r2,3),null],['Info Ratio',num(s.infoRatio),s.infoRatio>0]],
                  ].map((col, ci) => (
                    <div key={ci}>
                      {col.map(([l,v,up]: any, i) => (
                        <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontSize:12.5, color:'var(--text2)' }}>{l}</span>
                          <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color: up===true?'var(--green)':up===false?'var(--red)':'var(--text)' }}>{v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── RISK ── */}
          {tab === 'risk' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                <MetricCard label="VaR 95%"    value={pct(s.histVar95)}   delta="Daily threshold" deltaUp={false}/>
                <MetricCard label="CVaR 95%"   value={pct(s.histCVar95)}  delta="Exp. shortfall"  deltaUp={false}/>
                <MetricCard label="Param VaR"  value={pct(s.paramVar95)}  delta="Normal dist."/>
                <MetricCard label="Alpha"      value={plus(s.alpha)}      delta={`vs ${s.benchmark}`} deltaUp={s.alpha>0}/>
                <MetricCard label="R²"         value={num(s.r2,3)}        delta="Correlation"/>
                <MetricCard label="Info Ratio" value={num(s.infoRatio)}   delta="Active / TE" deltaUp={s.infoRatio>0}/>
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Extended Statistics</div>
                <div style={{ overflowX:'auto' }}>
                  <table className="qd-table" style={{ minWidth:440 }}>
                    <thead><tr><th>Metric</th><th>Value</th><th>Interpretation</th></tr></thead>
                    <tbody>
                      {[
                        ['Skewness',     num(s.skewness,3), s.skewness>0?'Positive tail':'Negative tail'],
                        ['Kurtosis',     num(s.kurtosis,3), s.kurtosis>3?'Fat tails':'Normal tails'],
                        ['Gain/Pain',    num(s.gainToPain), s.gainToPain>1?'Gains > losses':'Losses > gains'],
                        ['Beta',         num(s.beta),       s.beta>1?'Above market':'Defensive'],
                        ['Alpha (Ann.)', plus(s.alpha),     s.alpha>0?'Outperforming':'Underperforming'],
                      ].map(([m,v,n], i) => (
                        <tr key={i}>
                          <td style={{ fontWeight:500 }}>{m}</td>
                          <td><span className="mono">{v}</span></td>
                          <td style={{ color:'var(--text2)', fontSize:11.5 }}>{n}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── HOLDINGS ── */}
          {tab === 'holdings' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Allocation</div>
                <ResponsiveContainer width="100%" height={mob?200:220}>
                  <PieChart>
                    <Pie
                      data={data.holdings?.map((h: any) => ({ name: h.ticker, value: h.weight * 100 }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={mob ? 50 : 55}
                      outerRadius={mob ? 80 : 88}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {data.holdings?.map((_: any, i: number) => (
                        <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} stroke="var(--bg2)" strokeWidth={2}/>
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: any) => `${Number(v).toFixed(1)}%`}
                      contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={mob ? 7 : 8}
                      formatter={v => <span style={{ fontSize:mob?10:11, color:'var(--text2)' }}>{v}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Holdings</div>
                <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                  <table className="qd-table" style={{ minWidth:520 }}>
                    <thead>
                      <tr><th>Ticker</th><th>Shares</th><th>Cost</th><th>Price</th><th>Value</th><th>P&L</th><th>Wt.</th><th>Ret.</th></tr>
                    </thead>
                    <tbody>
                      {data.holdings?.map((h: any, i: number) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily:'var(--fm)', fontWeight:700, color:COLORS[i%COLORS.length] }}>{h.ticker}</span></td>
                          <td className="mono">{h.shares}</td>
                          <td className="mono">${h.buyPrice.toFixed(2)}</td>
                          <td className="mono">${h.currentPrice.toFixed(2)}</td>
                          <td className="mono">{dollar(h.marketValue)}</td>
                          <td><span className="mono" style={{ color:h.unrealisedPnl>=0?'var(--green)':'var(--red)' }}>{dplus(h.unrealisedPnl)}</span></td>
                          <td><span className="mono">{(h.weight*100).toFixed(1)}%</span></td>
                          <td><span className="mono" style={{ color:h.periodReturn>=0?'var(--green)':'var(--red)' }}>{plus(h.periodReturn)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── TECHNICALS ── */}
          {tab === 'technicals' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {tickers.map(t => (
                  <button key={t} onClick={() => setTechTicker(t)} style={{ padding:mob?'6px 12px':'6px 16px', borderRadius:7, cursor:'pointer', background:techTicker===t?'rgba(45,127,249,0.1)':'var(--bg3)', border:`1px solid ${techTicker===t?'rgba(45,127,249,0.3)':'var(--b1)'}`, color:techTicker===t?'var(--accent2)':'var(--text2)', fontSize:mob?11:12.5, fontWeight:techTicker===t?600:400 }}>
                    {t}
                  </button>
                ))}
              </div>

              {techLoading && (
                <div style={{ padding:32, textAlign:'center', color:'var(--text2)', fontSize:13 }}>Loading {techTicker}...</div>
              )}

              {techData && !techLoading && (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10 }}>
                    {[
                      { l:'Close',  v:`$${techData.latest.close?.toFixed(2)}`,   a: undefined },
                      { l:'RSI 14', v:techData.latest.rsi14?.toFixed(1),          a: techData.latest.rsi14>70?'#f54060':techData.latest.rsi14<30?'#0dcb7d':undefined },
                      { l:'SMA 20', v:`$${techData.latest.sma20?.toFixed(2)}`,   a: undefined },
                      { l:'SMA 50', v:`$${techData.latest.sma50?.toFixed(2)}`,   a: undefined },
                    ].map(({ l, v, a }: any) => (
                      <div key={l} style={{ background:'var(--bg3)', border:`1px solid ${a?a+'22':'var(--b1)'}`, borderRadius:11, padding:'12px 14px' }}>
                        <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 }}>{l}</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:mob?17:20, fontWeight:300, color:a||'var(--text)' }}>{v||'—'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                    <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>{techTicker} — Price & MAs</div>
                    <ResponsiveContainer width="100%" height={mob?160:240}>
                      <LineChart data={techData.charts.close}>
                        <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                        <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v => `$${v.toFixed(0)}`} width={48}/>
                        <Tooltip content={<Tip fn={(v:number) => `$${v.toFixed(2)}`}/>}/>
                        <Line type="monotone" dataKey="value" name="Close"  stroke="#2d7ff9" strokeWidth={2}   dot={false}/>
                        {techData.charts.sma20?.length > 0 && <Line type="monotone" data={techData.charts.sma20} dataKey="value" name="SMA 20" stroke="#f0a500" strokeWidth={1.3} dot={false}/>}
                        {techData.charts.sma50?.length > 0 && <Line type="monotone" data={techData.charts.sma50} dataKey="value" name="SMA 50" stroke="#5ba3f5" strokeWidth={1.3} dot={false}/>}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                      <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:10 }}>RSI (14)</div>
                      <ResponsiveContainer width="100%" height={mob?120:160}>
                        <LineChart data={techData.charts.rsi}>
                          <XAxis dataKey="date" tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                          <YAxis domain={[0,100]} tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} width={26}/>
                          <Tooltip content={<Tip fn={(v:number) => v.toFixed(1)}/>}/>
                          <ReferenceLine y={70} stroke="rgba(245,64,96,0.4)"  strokeDasharray="3 2"/>
                          <ReferenceLine y={30} stroke="rgba(13,203,125,0.4)" strokeDasharray="3 2"/>
                          <Line type="monotone" dataKey="value" name="RSI" stroke="#2d7ff9" strokeWidth={1.8} dot={false}/>
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:pad }}>
                      <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:10 }}>MACD</div>
                      <ResponsiveContainer width="100%" height={mob?120:160}>
                        <LineChart data={techData.charts.macd}>
                          <XAxis dataKey="date" tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                          <YAxis tick={{ fontSize:8, fill:'#304560' }} tickLine={false} axisLine={false} width={36}/>
                          <Tooltip content={<Tip fn={(v:number) => v.toFixed(4)}/>}/>
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.06)"/>
                          <Line type="monotone" dataKey="value" name="MACD" stroke="#2d7ff9" strokeWidth={1.8} dot={false}/>
                          {techData.charts.signal?.length > 0 && <Line type="monotone" data={techData.charts.signal} dataKey="value" name="Signal" stroke="#f0a500" strokeWidth={1.5} dot={false}/>}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function PortfolioPage() {
  return (
    <Suspense fallback={<div style={{ padding:'40px', textAlign:'center', color:'var(--text2)' }}>Loading...</div>}>
      <PortfolioContent/>
    </Suspense>
  )
}