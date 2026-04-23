'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import MetricCard from '@/components/ui/MetricCard'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  PieChart, Pie, Cell, Legend
} from 'recharts'

const fmt = {
  pct:        (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`,
  pctPlus:    (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`,
  num:        (v: any, d=2) => v == null ? '—' : Number(v).toFixed(d),
  dollar:     (v: any) => v == null ? '—' : v>=1e6 ? `$${(v/1e6).toFixed(2)}M` : v>=1e3 ? `$${v.toLocaleString('en',{maximumFractionDigits:0})}` : `$${Number(v).toFixed(2)}`,
  dollarPlus: (v: any) => v == null ? '—' : `${v>=0?'+':''}${fmt.dollar(v)}`,
}

const COLORS = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7','#e05c3a','#5ba3f5']

function ChartTip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn ? fn(p.value) : Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

const DEFAULT = { tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'1y', benchmark:'SPY', riskFree:'2.0' }

function PortfolioContent() {
  const [inputs, setInputs]   = useState(DEFAULT)
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [tab, setTab]         = useState<'performance'|'risk'|'holdings'|'technicals'>('performance')
  const [techTicker, setTechTicker] = useState('')
  const [techData, setTechData]     = useState<any>(null)
  const [techLoading, setTechLoading] = useState(false)
  const [autoRun, setAutoRun] = useState(false)

  const searchParams = useSearchParams()

  // Auto-populate from URL params (from Portfolio Manager "Analyse" button)
  useEffect(() => {
    const t  = searchParams.get('tickers')
    const s  = searchParams.get('shares')
    const bp = searchParams.get('buyPrices')
    const p  = searchParams.get('period')
    const b  = searchParams.get('benchmark')
    if (t && s && bp) {
      setInputs(prev => ({
        ...prev,
        tickers:   t,
        shares:    s,
        buyPrices: bp,
        period:    p || prev.period,
        benchmark: b || prev.benchmark,
      }))
      // Auto-trigger analysis
      setAutoRun(true)
    }
  }, [searchParams])

  // Run analysis automatically when inputs are set from URL
  useEffect(() => {
    if (autoRun) {
      setAutoRun(false)
      analyze()
    }
  }, [autoRun])

  const analyze = async () => {
    setLoading(true); setError('')
    try {
      const result = await api.portfolio.analytics({ tickers: inputs.tickers, shares: inputs.shares, buyPrices: inputs.buyPrices, period: inputs.period, benchmark: inputs.benchmark, riskFree: parseFloat(inputs.riskFree)/100 })
      setData(result)
      setTechTicker(inputs.tickers.split(',')[0].trim().toUpperCase())
    } catch (e: any) { setError(e.message||'Failed') }
    finally { setLoading(false) }
  }

  const loadTech = async (ticker: string) => {
    setTechLoading(true)
    try { setTechData(await api.technicals(ticker, inputs.period)) }
    catch { setTechData(null) }
    finally { setTechLoading(false) }
  }

  useEffect(() => { if (tab==='technicals' && techTicker) loadTech(techTicker) }, [tab, techTicker])

  const s = data?.summary
  const tickers = inputs.tickers.split(',').map(t => t.trim().toUpperCase())

  return (
    <div style={{ padding:'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Portfolio Analytics</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Performance · Attribution · Risk · Technicals · Python-powered</div>
        </div>
        {data && <Badge variant="green" dot>Live Analysis</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', marginBottom:14 }}>Portfolio Inputs</div>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          {[
            { label:'Tickers (comma-separated)', key:'tickers', placeholder:'AAPL,MSFT,NVDA' },
            { label:'Shares',                    key:'shares',    placeholder:'20,15,10' },
            { label:'Buy Prices ($)',             key:'buyPrices', placeholder:'182,380,650' },
            { label:'Risk-Free Rate (%)',         key:'riskFree',  placeholder:'2.0' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <input className="qd-input" placeholder={placeholder} value={(inputs as any)[key]} onChange={e => setInputs(p => ({ ...p, [key]: e.target.value }))} />
            </div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
          {[
            { label:'Period',    key:'period',    options:['1mo','3mo','6mo','1y','2y','5y'] },
            { label:'Benchmark', key:'benchmark', options:['SPY','QQQ','DIA','IWM'] },
          ].map(({ label, key, options }) => (
            <div key={key}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
              <select className="qd-select" value={(inputs as any)[key]} onChange={e => setInputs(p => ({ ...p, [key]: e.target.value }))}>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <button onClick={analyze} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, cursor: loading?'not-allowed':'pointer', background: loading?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, boxShadow: loading?'none':'0 0 20px rgba(45,127,249,0.25)', display:'flex', alignItems:'center', gap:8 }}>
            {loading ? <><span style={{ width:12, height:12, border:'2px solid rgba(255,255,255,0.3)', borderTop:'2px solid #fff', borderRadius:'50%', display:'inline-block', animation:'spin 0.8s linear infinite' }} />Analysing...</> : 'Analyse Portfolio'}
          </button>
        </div>
        {error && <div style={{ marginTop:12, fontSize:12, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
      </div>

      {/* Empty state */}
      {!data && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>📈</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Ready to analyse</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:400, margin:'0 auto' }}>Enter your portfolio details above and click Analyse Portfolio to see full performance, risk metrics, charts and technical analysis — all powered by your Python backend.</div>
        </div>
      )}

      {/* Results */}
      {data && s && (
        <>
          {/* Metrics */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
            <MetricCard label="Portfolio Value"  value={fmt.dollar(s.totalValue)}    delta={`${fmt.dollarPlus(s.unrealisedPnl)} unrealised`} deltaUp={s.unrealisedPnl>=0} accent="#2d7ff9" sparkData={data.charts.performance?.slice(-20).map((d:any)=>d.value)} />
            <MetricCard label="Total Return"     value={fmt.pctPlus(s.totalReturn)}   delta={`${inputs.period} period`} deltaUp={s.totalReturn>=0} />
            <MetricCard label="Ann. Return"      value={fmt.pctPlus(s.annReturn)}      delta="Annualised" deltaUp={s.annReturn>=0} />
            <MetricCard label="Ann. Volatility"  value={fmt.pct(s.annVol)}            delta="Realised vol" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="Sharpe Ratio"  value={fmt.num(s.sharpe)}     delta={s.sharpe>1?'Above threshold':'Risk-adjusted'} deltaUp={s.sharpe>1} accent={s.sharpe>1?'#0dcb7d':undefined} />
            <MetricCard label="Sortino Ratio" value={fmt.num(s.sortino)}    delta="Downside-adjusted" deltaUp={s.sortino>1} />
            <MetricCard label="Max Drawdown"  value={fmt.pct(s.maxDrawdown)} delta="Peak to trough" deltaUp={false} />
            <MetricCard label="Beta"          value={fmt.num(s.beta)}        delta={`vs ${s.benchmark}`} />
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
            {(['performance','risk','holdings','technicals'] as const).map(t => (
              <button key={t} onClick={()=>setTab(t)} style={{ padding:'7px 18px', borderRadius:7, border:'none', cursor:'pointer', background: tab===t?'var(--bg5)':'transparent', color: tab===t?'var(--text)':'var(--text2)', fontSize:12, fontWeight: tab===t?600:400, transition:'all 0.15s', textTransform:'capitalize', boxShadow: tab===t?'0 2px 8px rgba(0,0,0,0.3)':'none' }}>
                {t}
              </button>
            ))}
          </div>

          {/* Performance */}
          {tab==='performance' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Growth of $1 — Portfolio vs {s.benchmark}</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>Normalised performance over {inputs.period}</div>
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={data.charts.performance} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#2d7ff9" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#2d7ff9" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(2)}x`} width={45} />
                    <Tooltip content={<ChartTip fn={(v:number)=>`${v.toFixed(3)}x`} />} />
                    <ReferenceLine y={1} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
                    <Area type="monotone" dataKey="value" name="Portfolio" stroke="#2d7ff9" strokeWidth={2} fill="url(#pg)" dot={false} />
                    {data.charts.benchmark?.length>0 && <Line type="monotone" data={data.charts.benchmark} dataKey="value" name={s.benchmark} stroke="#304560" strokeWidth={1.5} dot={false} strokeDasharray="4 3" />}
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Drawdown</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data.charts.drawdown?.map((d:any)=>({...d, value:d.value*100}))}>
                      <defs><linearGradient id="ddg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f54060" stopOpacity={0.2}/><stop offset="95%" stopColor="#f54060" stopOpacity={0.01}/></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`} width={38} />
                      <Tooltip content={<ChartTip fn={(v:number)=>`${v.toFixed(2)}%`} />} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                      <Area type="monotone" dataKey="value" name="Drawdown" stroke="#f54060" strokeWidth={1.5} fill="url(#ddg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Daily Returns</div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={data.charts.returns?.map((d:any)=>({...d, value:d.value*100}))}>
                      <defs><linearGradient id="retg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d7ff9" stopOpacity={0.15}/><stop offset="95%" stopColor="#2d7ff9" stopOpacity={0.01}/></linearGradient></defs>
                      <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                      <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(1)}%`} width={42} />
                      <Tooltip content={<ChartTip fn={(v:number)=>`${v.toFixed(3)}%`} />} />
                      <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
                      <Area type="monotone" dataKey="value" name="Return" stroke="#2d7ff9" strokeWidth={1} fill="url(#retg)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Risk */}
          {tab==='risk' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                <MetricCard label="Hist. VaR 95%"  value={fmt.pct(s.histVar95)}    delta="Daily loss threshold" deltaUp={false} />
                <MetricCard label="CVaR / ES 95%"  value={fmt.pct(s.histCVar95)}   delta="Expected shortfall"   deltaUp={false} />
                <MetricCard label="Param VaR 95%"  value={fmt.pct(s.paramVar95)}   delta="Normal distribution"  />
                <MetricCard label="Alpha (Ann.)"   value={fmt.pctPlus(s.alpha)}    delta={`vs ${s.benchmark}`}  deltaUp={s.alpha>0} />
                <MetricCard label="R² vs Bench"    value={fmt.num(s.r2,3)}         delta="Correlation strength"  />
                <MetricCard label="Info Ratio"     value={fmt.num(s.infoRatio)}    delta="Active return / TE"    deltaUp={s.infoRatio>0} />
                <MetricCard label="Calmar Ratio"   value={fmt.num(s.calmar)}       delta="Return / Max DD"       deltaUp={s.calmar>1} />
                <MetricCard label="Omega Ratio"    value={fmt.num(s.omega)}        delta="Gain/loss ratio"       deltaUp={s.omega>1} />
                <MetricCard label="Tracking Error" value={fmt.pct(s.trackingError)} delta="Active risk" />
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Extended Statistics</div>
                <table className="qd-table">
                  <thead><tr><th>Metric</th><th>Value</th><th>Interpretation</th></tr></thead>
                  <tbody>
                    {[
                      { m:'Skewness',        v:fmt.num(s.skewness,3),  n: s.skewness>0?'Positive tail (right)':'Negative tail (left)' },
                      { m:'Excess Kurtosis', v:fmt.num(s.kurtosis,3),  n: s.kurtosis>0?'Fat tails — leptokurtic':'Thin tails — platykurtic' },
                      { m:'Gain / Pain',     v:fmt.num(s.gainToPain),  n: s.gainToPain>1?'Gains exceed losses':'Losses exceed gains' },
                      { m:'Beta',            v:fmt.num(s.beta),        n: s.beta>1?'More volatile than market':s.beta<0?'Inverse to market':'Defensive tilt' },
                      { m:'Alpha (Ann.)',    v:fmt.pctPlus(s.alpha),   n: s.alpha>0?'Outperforming benchmark':'Underperforming benchmark' },
                    ].map(({ m, v, n }, i) => (
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
          )}

          {/* Holdings */}
          {tab==='holdings' && (
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Holdings Breakdown</div>
                <table className="qd-table">
                  <thead><tr><th>Ticker</th><th>Shares</th><th>Cost</th><th>Price</th><th>Value</th><th>P&L</th><th>Weight</th><th>Return</th></tr></thead>
                  <tbody>
                    {data.holdings?.map((h:any, i:number) => (
                      <tr key={i}>
                        <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:COLORS[i%COLORS.length] }}>{h.ticker}</span></td>
                        <td className="mono">{h.shares}</td>
                        <td className="mono">${h.buyPrice.toFixed(2)}</td>
                        <td className="mono">${h.currentPrice.toFixed(2)}</td>
                        <td className="mono">{fmt.dollar(h.marketValue)}</td>
                        <td><span className="mono" style={{ color:h.unrealisedPnl>=0?'var(--green)':'var(--red)' }}>{fmt.dollarPlus(h.unrealisedPnl)}</span></td>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <div style={{ height:4, width:60, background:'var(--bg4)', borderRadius:2 }}>
                              <div style={{ height:4, width:`${h.weight*100}%`, background:COLORS[i%COLORS.length], borderRadius:2 }} />
                            </div>
                            <span className="mono" style={{ fontSize:11 }}>{(h.weight*100).toFixed(1)}%</span>
                          </div>
                        </td>
                        <td><span className="mono" style={{ color:h.periodReturn>=0?'var(--green)':'var(--red)' }}>{fmt.pctPlus(h.periodReturn)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Allocation</div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={data.holdings?.map((h:any)=>({ name:h.ticker, value:h.weight*100 }))} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={2} dataKey="value">
                      {data.holdings?.map((_:any, i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} stroke="var(--bg2)" strokeWidth={2} />)}
                    </Pie>
                    <Tooltip formatter={(v:any)=>`${Number(v).toFixed(1)}%`} contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span style={{ fontSize:11, color:'var(--text2)' }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Technicals */}
          {tab==='technicals' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', gap:8 }}>
                {tickers.map(t => (
                  <button key={t} onClick={()=>setTechTicker(t)} style={{ padding:'6px 16px', borderRadius:7, cursor:'pointer', background: techTicker===t?'var(--accent3)':'var(--bg3)', border:`1px solid ${techTicker===t?'rgba(45,127,249,0.3)':'var(--b1)'}`, color: techTicker===t?'var(--accent2)':'var(--text2)', fontSize:12.5, fontWeight: techTicker===t?600:400, transition:'all 0.14s' }}>
                    {t}
                  </button>
                ))}
              </div>
              {techLoading && <div style={{ textAlign:'center', padding:40, color:'var(--text2)' }}>Loading technicals...</div>}
              {techData && !techLoading && (
                <>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
                    {[
                      { l:'Close Price', v:`$${techData.latest.close?.toFixed(2)}` },
                      { l:'RSI (14)',    v:techData.latest.rsi14?.toFixed(1), a: techData.latest.rsi14>70?'#f54060':techData.latest.rsi14<30?'#0dcb7d':undefined },
                      { l:'SMA 20',     v:`$${techData.latest.sma20?.toFixed(2)}` },
                      { l:'SMA 50',     v:`$${techData.latest.sma50?.toFixed(2)}` },
                      { l:'Rvol 20D',   v:techData.latest.rvol20?`${techData.latest.rvol20?.toFixed(1)}%`:undefined },
                    ].map(({ l, v, a }:any) => (
                      <div key={l} style={{ background:'var(--bg3)', border:`1px solid ${a?a+'30':'var(--b1)'}`, borderRadius:12, padding:'14px 16px' }}>
                        <div style={{ fontSize:10.5, color:'var(--text2)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:8 }}>{l}</div>
                        <div style={{ fontFamily:'var(--fm)', fontSize:20, fontWeight:300, color:a||'var(--text)' }}>{v||'—'}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                    <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>{techTicker} — Price & Indicators</div>
                    <ResponsiveContainer width="100%" height={240}>
                      <LineChart data={techData.charts.close}>
                        <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`$${v.toFixed(0)}`} width={52} />
                        <Tooltip content={<ChartTip fn={(v:number)=>`$${v.toFixed(2)}`} />} />
                        <Line type="monotone" dataKey="value" name="Close" stroke="#2d7ff9" strokeWidth={2} dot={false} />
                        {techData.charts.sma20?.length>0 && <Line type="monotone" data={techData.charts.sma20} dataKey="value" name="SMA 20" stroke="#f0a500" strokeWidth={1.3} dot={false} />}
                        {techData.charts.sma50?.length>0 && <Line type="monotone" data={techData.charts.sma50} dataKey="value" name="SMA 50" stroke="#5ba3f5" strokeWidth={1.3} dot={false} />}
                        {techData.charts.bbUpper?.length>0 && <Line type="monotone" data={techData.charts.bbUpper} dataKey="value" name="BB Upper" stroke="#0dcb7d" strokeWidth={1} dot={false} strokeDasharray="3 2" />}
                        {techData.charts.bbLower?.length>0 && <Line type="monotone" data={techData.charts.bbLower} dataKey="value" name="BB Lower" stroke="#f54060" strokeWidth={1} dot={false} strokeDasharray="3 2" />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                      <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>RSI (14)</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={techData.charts.rsi}>
                          <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis domain={[0,100]} tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} width={28} />
                          <Tooltip content={<ChartTip fn={(v:number)=>v.toFixed(1)} />} />
                          <ReferenceLine y={70} stroke="rgba(245,64,96,0.4)" strokeDasharray="3 2" label={{ value:'70', fill:'#f54060', fontSize:9 }} />
                          <ReferenceLine y={30} stroke="rgba(13,203,125,0.4)" strokeDasharray="3 2" label={{ value:'30', fill:'#0dcb7d', fontSize:9 }} />
                          <Line type="monotone" dataKey="value" name="RSI" stroke="#2d7ff9" strokeWidth={1.8} dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                      <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>MACD</div>
                      <ResponsiveContainer width="100%" height={160}>
                        <LineChart data={techData.charts.macd}>
                          <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} width={40} />
                          <Tooltip content={<ChartTip fn={(v:number)=>v.toFixed(4)} />} />
                          <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                          <Line type="monotone" dataKey="value" name="MACD" stroke="#2d7ff9" strokeWidth={1.8} dot={false} />
                          {techData.charts.signal?.length>0 && <Line type="monotone" data={techData.charts.signal} dataKey="value" name="Signal" stroke="#f0a500" strokeWidth={1.5} dot={false} />}
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
      <PortfolioContent />
    </Suspense>
  )
}