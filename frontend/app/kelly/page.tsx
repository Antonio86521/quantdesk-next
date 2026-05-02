'use client'
import { useState, useEffect, useMemo } from 'react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { Target, AlertTriangle } from 'lucide-react'

type Method = 'kelly' | 'fixed' | 'volatility' | 'atr'
type SimPoint = { trade: number; value: number }
type SimData = { full: SimPoint[]; half: SimPoint[]; quarter: SimPoint[]; frac: SimPoint[] }

function fmt(v: number, d = 2)  { return isNaN(v) ? '—' : v.toFixed(d) }
function fmtPct(v: number)      { return isNaN(v) ? '—' : `${(v * 100).toFixed(2)}%` }
function fmtDollar(v: number)   { return isNaN(v) || !isFinite(v) ? '—' : v >= 1e6 ? `$${(v / 1e6).toFixed(2)}M` : v >= 1e3 ? `$${v.toLocaleString('en', { maximumFractionDigits: 0 })}` : `$${v.toFixed(2)}` }

function computeKelly(winRate: number, avgWin: number, avgLoss: number): number {
  if (avgLoss === 0) return 0
  const p = winRate / 100
  const b = avgWin / avgLoss
  return Math.max(0, (p * b - (1 - p)) / b)
}

function simulateGrowth(f: number, winRate: number, avgWin: number, avgLoss: number, trades = 100): SimPoint[] {
  const p = winRate / 100
  const b = avgWin / avgLoss
  const q = 1 - p
  const results: SimPoint[] = []
  let equity = 1.0
  for (let i = 0; i <= trades; i += 5) {
    const g = Math.pow((1 + f * b), p * 5) * Math.pow(Math.max(0.001, 1 - f), q * 5)
    equity = i === 0 ? 1 : (results[results.length - 1]?.value ?? 1) * g
    results.push({ trade: i, value: +equity.toFixed(4) })
  }
  return results
}

function ruinProbability(f: number, winRate: number, avgWin: number, avgLoss: number): number {
  const p = winRate / 100
  const b = avgWin / avgLoss
  if (f <= 0 || f >= 1) return f <= 0 ? 1 : 0
  const edge = p * b - (1 - p)
  if (edge <= 0) return 1
  return Math.exp(-2 * edge / (f * (1 + b)))
}

function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>Trade {label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:100 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{Number(p.value).toFixed(3)}x</span>
        </div>
      ))}
    </div>
  )
}

function KellyGauge({ kelly, fraction }: { kelly: number; fraction: number }) {
  const w = 280, h = 120, cx = 140, cy = 110, r = 90

  function polarToXY(angle: number, radius: number) {
    const rad = (angle - 180) * Math.PI / 180
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
  }

  function arcPath(startAngle: number, endAngle: number, ar: number) {
    const s = polarToXY(startAngle, ar), e = polarToXY(endAngle, ar)
    return `M ${s.x} ${s.y} A ${ar} ${ar} 0 ${endAngle - startAngle > 180 ? 1 : 0} 1 ${e.x} ${e.y}`
  }

  const kellyAngle = Math.min(180, kelly * 100 * 1.8)
  const fracAngle  = Math.min(180, fraction * 100 * 1.8)
  const needle     = polarToXY(fracAngle, r - 16)
  const color      = fraction > kelly ? '#f54060' : fraction > kelly * 0.75 ? '#f0a500' : '#0dcb7d'

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <path d={arcPath(0, 180, r)} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={12} strokeLinecap="round"/>
      <path d={arcPath(0, Math.min(180, kelly * 50 * 1.8), r)} fill="none" stroke="rgba(13,203,125,0.3)" strokeWidth={12} strokeLinecap="round"/>
      <path d={arcPath(Math.min(180, kelly * 50 * 1.8), kellyAngle, r)} fill="none" stroke="rgba(240,165,0,0.4)" strokeWidth={12} strokeLinecap="round"/>
      <path d={arcPath(kellyAngle, 180, r)} fill="none" stroke="rgba(245,64,96,0.25)" strokeWidth={12} strokeLinecap="round"/>
      <path d={arcPath(0, fracAngle, r - 2)} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={`${fracAngle * 1.57} 1000`} opacity={0.9}/>
      <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke={color} strokeWidth={2.5} strokeLinecap="round"/>
      <circle cx={cx} cy={cy} r={5} fill={color}/>
      <text x={14} y={h - 4} fontSize={8} fill="rgba(255,255,255,0.3)">0%</text>
      <text x={cx} y={16} fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="middle">50%</text>
      <text x={w - 14} y={h - 4} fontSize={8} fill="rgba(255,255,255,0.3)" textAnchor="end">100%</text>
      {kelly > 0 && kelly < 1 && (() => {
        const kp = polarToXY(kellyAngle, r + 6)
        return <text x={kp.x} y={kp.y} fontSize={8} fill="#f0a500" textAnchor="middle">K</text>
      })()}
    </svg>
  )
}

export default function KellyPage() {
  const [winRate,       setWinRate]       = useState('55')
  const [avgWin,        setAvgWin]        = useState('1.5')
  const [avgLoss,       setAvgLoss]       = useState('1.0')
  const [fraction,      setFraction]      = useState('0.5')
  const [portfolioSize, setPortfolioSize] = useState('100000')
  const [riskPct,       setRiskPct]       = useState('1.0')
  const [entryPrice,    setEntryPrice]    = useState('150')
  const [stopLoss,      setStopLoss]      = useState('144')
  const [method,        setMethod]        = useState<Method>('kelly')
  const [atrValue,      setAtrValue]      = useState('3.5')
  const [isMobile,      setIsMobile]      = useState(false)
  const [activeTab,     setActiveTab]     = useState<'kelly' | 'sizer' | 'simulator'>('kelly')

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const kelly      = useMemo(() => computeKelly(+winRate, +avgWin, +avgLoss), [winRate, avgWin, avgLoss])
  const frac       = useMemo(() => kelly * +fraction, [kelly, fraction])
  const edge       = useMemo(() => { const p = +winRate/100, b = +avgWin/+avgLoss; return p * b - (1 - p) }, [winRate, avgWin, avgLoss])
  const expectancy = useMemo(() => (+winRate/100) * +avgWin - (1 - +winRate/100) * +avgLoss, [winRate, avgWin, avgLoss])
  const ruin       = useMemo(() => ruinProbability(frac, +winRate, +avgWin, +avgLoss), [frac, winRate, avgWin, avgLoss])

  const kellyVariants = useMemo(() => [
    { label:'Full Kelly',    f:kelly,       color:'#f0a500', risk:'Aggressive — high variance, optimal long-run growth' },
    { label:'Half Kelly',    f:kelly * 0.5, color:'#0dcb7d', risk:'Recommended — good growth with lower drawdowns' },
    { label:'Quarter Kelly', f:kelly * 0.25,color:'#2d7ff9', risk:'Conservative — suboptimal growth, very safe' },
    { label:'Your Fraction', f:frac,        color:'#7c5cfc', risk:`${(+fraction * 100).toFixed(0)}% of Kelly` },
  ], [kelly, frac, fraction])

  const simData = useMemo((): SimData | null => {
    if (kelly <= 0) return null
    return {
      full:    simulateGrowth(kelly,        +winRate, +avgWin, +avgLoss),
      half:    simulateGrowth(kelly * 0.5,  +winRate, +avgWin, +avgLoss),
      quarter: simulateGrowth(kelly * 0.25, +winRate, +avgWin, +avgLoss),
      frac:    simulateGrowth(frac,         +winRate, +avgWin, +avgLoss),
    }
  }, [kelly, frac, winRate, avgWin, avgLoss])

  const chartData = useMemo(() => {
    if (!simData?.full?.length) return []
    return simData.full.map((d, i) => ({
      trade:   d.trade,
      full:    d.value,
      half:    simData.half[i]?.value,
      quarter: simData.quarter[i]?.value,
      custom:  simData.frac[i]?.value,
    }))
  }, [simData])

  const sizing = useMemo(() => {
    const pSize = +portfolioSize, entry = +entryPrice, stop = +stopLoss, risk = +riskPct / 100
    const stopDist = Math.abs(entry - stop), stopPct = stopDist / entry
    if (!pSize || !entry || !stop || stopDist === 0) return null
    const riskAmount  = pSize * risk
    const fixedShares = Math.floor(riskAmount / stopDist)
    const kellyShares = Math.floor((pSize * kelly * +fraction) / entry)
    const volShares   = Math.floor(riskAmount / (entry * stopPct * 2))
    const atrShares   = +atrValue > 0 ? Math.floor(riskAmount / (+atrValue * 2)) : 0
    const methods: Record<Method, { shares: number; value: number; label: string }> = {
      fixed:      { shares:fixedShares,  value:fixedShares * entry,  label:'Fixed Fractional' },
      kelly:      { shares:kellyShares,  value:kellyShares * entry,  label:'Kelly Criterion' },
      volatility: { shares:volShares,    value:volShares * entry,    label:'Volatility-Adjusted' },
      atr:        { shares:atrShares,    value:atrShares * entry,    label:'ATR-Based' },
    }
    const selected = methods[method]
    return {
      riskAmount, stopDist, stopPct, selected, all: methods,
      riskPctOfPortfolio: selected.value / pSize,
      maxLoss:      selected.shares * stopDist,
      potentialGain:selected.shares * stopDist * (+avgWin / +avgLoss),
      rr: +avgWin / +avgLoss,
    }
  }, [portfolioSize, entryPrice, stopLoss, riskPct, kelly, fraction, method, avgWin, avgLoss, atrValue])

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(13,203,125,0.12)', border:'1px solid rgba(13,203,125,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Target size={16} color="var(--green)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 20 : 24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Kelly Criterion & Position Sizer</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Optimal bet sizing · Risk management · Growth simulation</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
        {([
          { key:'kelly',     label:'Kelly Calculator' },
          { key:'sizer',     label:'Position Sizer' },
          { key:'simulator', label:'Growth Simulator' },
        ] as const).map(({ key, label }) => (
          <button key={key} onClick={() => setActiveTab(key)} style={{ padding: isMobile ? '6px 12px' : '6px 18px', borderRadius:7, border:'none', cursor:'pointer', background:activeTab === key ? 'var(--bg5)' : 'transparent', color:activeTab === key ? 'var(--text)' : 'var(--text2)', fontSize:12, fontWeight:activeTab === key ? 600 : 400, transition:'all 0.14s', boxShadow:activeTab === key ? '0 2px 8px rgba(0,0,0,0.3)' : 'none', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── KELLY CALCULATOR ── */}
      {activeTab === 'kelly' && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Trade Statistics</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  { label:'Win Rate (%)',          val:winRate,  set:setWinRate,  hint:'% of trades that are winners' },
                  { label:'Avg Win (R multiples)', val:avgWin,   set:setAvgWin,   hint:'e.g. 1.5 = win 1.5× your risk' },
                  { label:'Avg Loss (R multiples)',val:avgLoss,  set:setAvgLoss,  hint:'Usually 1.0 (1× your risk)' },
                ].map(({ label, val, set, hint }) => (
                  <div key={label}>
                    <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
                    <input className="qd-input" value={val} onChange={e => set(e.target.value)} style={{ fontFamily:'var(--fm)', fontSize:16 }}/>
                    <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:3 }}>{hint}</div>
                  </div>
                ))}
                <div>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Kelly Fraction</div>
                  <select className="qd-select" style={{ width:'100%' }} value={fraction} onChange={e => setFraction(e.target.value)}>
                    <option value="1.0">Full Kelly (1.0×)</option>
                    <option value="0.5">Half Kelly (0.5×)</option>
                    <option value="0.25">Quarter Kelly (0.25×)</option>
                    <option value="0.33">Third Kelly (0.33×)</option>
                  </select>
                </div>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px', border:`1px solid ${edge > 0 ? 'rgba(13,203,125,0.2)' : 'rgba(245,64,96,0.2)'}` }}>
                  <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Edge</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:300, color:edge > 0 ? 'var(--green)' : 'var(--red)' }}>{fmtPct(edge)}</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>{edge > 0 ? 'Positive edge' : 'No edge — do not trade'}</div>
                </div>
                <div style={{ background:'var(--bg3)', borderRadius:10, padding:'12px 14px' }}>
                  <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>Expectancy</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:22, fontWeight:300, color:expectancy > 0 ? 'var(--green)' : 'var(--red)' }}>{fmt(expectancy)}R</div>
                  <div style={{ fontSize:10, color:'var(--text3)', marginTop:3 }}>Per trade average</div>
                </div>
              </div>
            </div>

            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Risk of Ruin</div>
              <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:12 }}>
                <div style={{ fontFamily:'var(--fm)', fontSize:36, fontWeight:300, color:ruin < 0.05 ? 'var(--green)' : ruin < 0.2 ? 'var(--amber)' : 'var(--red)' }}>
                  {isFinite(ruin) ? fmtPct(ruin) : '0%'}
                </div>
                <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>
                  {ruin < 0.01 ? 'Very low — sound sizing' : ruin < 0.05 ? 'Low — acceptable' : ruin < 0.15 ? 'Moderate — reduce size' : 'High — dangerous'}
                </div>
              </div>
              <div style={{ height:6, background:'var(--bg4)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:6, width:`${Math.min(100, (isFinite(ruin) ? ruin : 0) * 500)}%`, background:ruin < 0.05 ? '#0dcb7d' : ruin < 0.2 ? '#f0a500' : '#f54060', borderRadius:3, transition:'width 0.4s ease' }}/>
              </div>
            </div>
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Sizing Gauge</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:10 }}>
                <span style={{ color:'#0dcb7d' }}>● Safe</span> <span style={{ color:'#f0a500', margin:'0 8px' }}>● Optimal</span> <span style={{ color:'#f54060' }}>● Over-bet</span>
              </div>
              <KellyGauge kelly={kelly} fraction={frac}/>
              <div style={{ textAlign:'center', marginTop:8 }}>
                <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:300, color:'#7c5cfc' }}>{fmtPct(frac)}</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>Recommended position size</div>
              </div>
            </div>

            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Kelly Variants</div>
              {kellyVariants.map(({ label, f, color, risk }) => (
                <div key={label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <div>
                    <div style={{ fontSize:13, fontWeight:600, color, marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{risk}</div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:300, color }}>{fmtPct(f)}</div>
                    <div style={{ fontSize:10.5, color:'var(--text3)' }}>{fmtDollar(+portfolioSize * f)}</div>
                  </div>
                </div>
              ))}
            </div>

            {edge <= 0 && (
              <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'14px 16px', borderRadius:12, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)' }}>
                <AlertTriangle size={14} color="var(--red)" style={{ flexShrink:0, marginTop:1 }}/>
                <div style={{ fontSize:12.5, color:'var(--red)', lineHeight:1.6 }}>
                  <strong>No mathematical edge.</strong> Kelly recommends zero position size. Review your win rate and R:R ratio.
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── POSITION SIZER ── */}
      {activeTab === 'sizer' && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Trade Setup</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {([
                  { label:'Portfolio Size ($)', val:portfolioSize, set:setPortfolioSize, hint:'Total account value' },
                  { label:'Risk Per Trade (%)', val:riskPct,       set:setRiskPct,       hint:'% of portfolio to risk' },
                  { label:'Entry Price ($)',    val:entryPrice,    set:setEntryPrice,    hint:'Your buy price' },
                  { label:'Stop Loss ($)',      val:stopLoss,      set:setStopLoss,      hint:'Your exit if wrong' },
                ] as { label:string; val:string; set:(v:string)=>void; hint:string }[]).map(({ label, val, set, hint }) => (
                  <div key={label}>
                    <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{label}</div>
                    <input className="qd-input" value={val} onChange={e => set(e.target.value)} style={{ fontFamily:'var(--fm)' }}/>
                    <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:3 }}>{hint}</div>
                  </div>
                ))}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>ATR Value (for ATR method)</div>
                  <input className="qd-input" value={atrValue} onChange={e => setAtrValue(e.target.value)} style={{ fontFamily:'var(--fm)' }}/>
                </div>
              </div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:8, fontWeight:500 }}>Sizing Method</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                {([
                  { key:'kelly',      label:'Kelly Criterion',     desc:'Based on edge' },
                  { key:'fixed',      label:'Fixed Fractional',    desc:'% risk per trade' },
                  { key:'volatility', label:'Volatility-Adjusted', desc:'Scale by stop %' },
                  { key:'atr',        label:'ATR-Based',           desc:'Scale by ATR' },
                ] as { key:Method; label:string; desc:string }[]).map(({ key, label, desc }) => (
                  <button key={key} onClick={() => setMethod(key)} style={{ padding:'10px 12px', borderRadius:9, border:`1px solid ${method === key ? 'rgba(13,203,125,0.3)' : 'var(--b1)'}`, background:method === key ? 'rgba(13,203,125,0.08)' : 'var(--bg3)', cursor:'pointer', textAlign:'left', transition:'all 0.14s' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:method === key ? 'var(--green)' : 'var(--text2)', marginBottom:2 }}>{label}</div>
                    <div style={{ fontSize:10.5, color:'var(--text3)' }}>{desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {sizing && (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Method Comparison</div>
                {Object.entries(sizing.all).map(([k, m]) => (
                  <div key={k} onClick={() => setMethod(k as Method)} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 12px', borderRadius:9, marginBottom:6, background:method === k ? 'rgba(13,203,125,0.06)' : 'transparent', border:`1px solid ${method === k ? 'rgba(13,203,125,0.2)' : 'transparent'}`, cursor:'pointer', transition:'all 0.14s' }}>
                    <div>
                      <div style={{ fontSize:12.5, fontWeight:method === k ? 600 : 400, color:method === k ? 'var(--green)' : 'var(--text2)' }}>{m.label}</div>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>{m.shares} shares</div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <div style={{ fontFamily:'var(--fm)', fontSize:14, color:method === k ? 'var(--green)' : 'var(--text)' }}>{fmtDollar(m.value)}</div>
                      <div style={{ fontSize:10.5, color:'var(--text3)' }}>{fmtPct(m.value / +portfolioSize)} of portfolio</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {sizing ? (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid rgba(13,203,125,0.2)', borderRadius:14, padding:'24px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#0dcb7d,transparent)' }}/>
                <div style={{ fontSize:10, color:'var(--green)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8, fontWeight:600 }}>{sizing.selected.label}</div>
                <div style={{ fontFamily:'var(--fm)', fontSize:44, fontWeight:300, color:'var(--green)', marginBottom:4, lineHeight:1 }}>{sizing.selected.shares}</div>
                <div style={{ fontSize:14, color:'var(--text2)', marginBottom:20 }}>shares to buy</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {[
                    { label:'Position Value',  value:fmtDollar(sizing.selected.value),   color:'var(--text)' },
                    { label:'% of Portfolio',  value:fmtPct(sizing.riskPctOfPortfolio),  color:'var(--text)' },
                    { label:'Max Loss',        value:fmtDollar(sizing.maxLoss),           color:'var(--red)' },
                    { label:'Potential Gain',  value:fmtDollar(sizing.potentialGain),     color:'var(--green)' },
                    { label:'Stop Distance',   value:`$${sizing.stopDist.toFixed(2)} (${fmtPct(sizing.stopPct)})`, color:'var(--text2)' },
                    { label:'R:R Ratio',       value:`1:${fmt(sizing.rr)}`,               color:sizing.rr >= 2 ? 'var(--green)' : 'var(--amber)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px' }}>
                      <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:4 }}>{label}</div>
                      <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:300, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {sizing.rr < 1.5 && (
                <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'12px 16px', borderRadius:10, background:'rgba(240,165,0,0.08)', border:'1px solid rgba(240,165,0,0.2)' }}>
                  <AlertTriangle size={13} color="var(--amber)" style={{ flexShrink:0, marginTop:1 }}/>
                  <div style={{ fontSize:12, color:'var(--amber)', lineHeight:1.6 }}>R/R of 1:{fmt(sizing.rr)} is below the 1:2 minimum. Widen your target or tighten your stop.</div>
                </div>
              )}

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Position Sizing Rules</div>
                {[
                  { rule:'Never risk more than 2% per trade', ok:+riskPct <= 2 },
                  { rule:'Minimum 1:2 risk/reward ratio',     ok:sizing.rr >= 2 },
                  { rule:'Position < 10% of portfolio',       ok:sizing.riskPctOfPortfolio < 0.1 },
                  { rule:'Positive edge (Kelly > 0)',         ok:kelly > 0 },
                  { rule:'Win rate above breakeven',          ok:+winRate > (1 / (1 + sizing.rr)) * 100 },
                ].map(({ rule, ok }, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', background:ok ? 'rgba(13,203,125,0.12)' : 'rgba(245,64,96,0.12)', border:`1px solid ${ok ? 'rgba(13,203,125,0.3)' : 'rgba(245,64,96,0.3)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, flexShrink:0 }}>
                      {ok ? '✓' : '✗'}
                    </div>
                    <span style={{ fontSize:12.5, color:ok ? 'var(--text2)' : 'var(--red)' }}>{rule}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>🎯</div>
              <div style={{ fontSize:13, color:'var(--text2)' }}>Fill in trade setup to calculate position size</div>
            </div>
          )}
        </div>
      )}

      {/* ── GROWTH SIMULATOR ── */}
      {activeTab === 'simulator' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:4, flexWrap:'wrap', gap:8 }}>
              <div>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700 }}>Equity Growth Simulation</div>
                <div style={{ fontSize:11, color:'var(--text3)', marginTop:2 }}>100 trades · {winRate}% win rate · {avgWin}R avg win · {avgLoss}R avg loss</div>
              </div>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[['Full Kelly','#f0a500'],['Half Kelly','#0dcb7d'],['¼ Kelly','#2d7ff9'],['Custom','#7c5cfc']].map(([label, color]) => (
                  <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                    <div style={{ width:20, height:2, background:color, borderRadius:1 }}/>
                    <span style={{ fontSize:10.5, color:'var(--text3)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ height:16 }}/>
            {chartData.length > 0 && edge > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile ? 220 : 300}>
                <AreaChart data={chartData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="sg1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f0a500" stopOpacity={0.1}/><stop offset="95%" stopColor="#f0a500" stopOpacity={0}/></linearGradient>
                    <linearGradient id="sg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0dcb7d" stopOpacity={0.1}/><stop offset="95%" stopColor="#0dcb7d" stopOpacity={0}/></linearGradient>
                    <linearGradient id="sg3" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d7ff9" stopOpacity={0.1}/><stop offset="95%" stopColor="#2d7ff9" stopOpacity={0}/></linearGradient>
                  </defs>
                  <XAxis dataKey="trade" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}/>
                  <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v => `${v.toFixed(1)}x`} width={42}/>
                  <Tooltip content={<Tip/>}/>
                  <ReferenceLine y={1} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3"/>
                  <Area type="monotone" dataKey="full"    name="Full Kelly" stroke="#f0a500" strokeWidth={1.5} fill="url(#sg1)" dot={false}/>
                  <Area type="monotone" dataKey="half"    name="Half Kelly" stroke="#0dcb7d" strokeWidth={2}   fill="url(#sg2)" dot={false}/>
                  <Area type="monotone" dataKey="quarter" name="¼ Kelly"    stroke="#2d7ff9" strokeWidth={1.5} fill="url(#sg3)" dot={false}/>
                  <Area type="monotone" dataKey="custom"  name="Custom"     stroke="#7c5cfc" strokeWidth={2}   fill="none"      dot={false} strokeDasharray="5 3"/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:300, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:13 }}>
                {edge <= 0 ? 'No positive edge — adjust win rate or R:R to see simulation' : 'Enter trade statistics to simulate growth'}
              </div>
            )}
          </div>

          {chartData.length > 0 && edge > 0 && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:12 }}>
              {[
                { label:'Full Kelly', key:'full'    as const, color:'#f0a500', sub:'Highest return, highest variance' },
                { label:'Half Kelly', key:'half'    as const, color:'#0dcb7d', sub:'Best risk-adjusted' },
                { label:'¼ Kelly',    key:'quarter' as const, color:'#2d7ff9', sub:'Safe but slower' },
                { label:'Custom',     key:'custom'  as const, color:'#7c5cfc', sub:`${(+fraction*100).toFixed(0)}% of Kelly` },
              ].map(({ label, key, color, sub }) => {
                const last = chartData[chartData.length - 1]
                const val  = last?.[key]
                return (
                  <div key={label} style={{ background:'var(--bg2)', border:`1px solid ${color}22`, borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }}/>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:8 }}>{label} · 100 trades</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:24, fontWeight:300, color, marginBottom:4 }}>{val ? `${val.toFixed(2)}x` : '—'}</div>
                    <div style={{ fontSize:10.5, color:'var(--text3)' }}>{sub}</div>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Kelly Criterion — Theory</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
              <div>
                <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.8, marginBottom:12 }}>
                  The Kelly Criterion, developed by John Kelly Jr. at Bell Labs in 1956, gives the mathematically optimal fraction of capital to bet to maximise long-run growth rate.
                </div>
                <div style={{ background:'var(--bg3)', borderRadius:10, padding:'14px 16px', fontFamily:'var(--fm)', fontSize:14, color:'var(--accent2)', textAlign:'center', marginBottom:12 }}>
                  f* = (p × b − q) / b
                </div>
                <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.7 }}>
                  where <strong style={{ color:'var(--text2)' }}>p</strong> = win probability, <strong style={{ color:'var(--text2)' }}>q</strong> = 1−p, <strong style={{ color:'var(--text2)' }}>b</strong> = avg win / avg loss
                </div>
              </div>
              <div>
                {[
                  { title:'Why not Full Kelly?', desc:'Full Kelly maximises long-run growth but produces enormous drawdowns. A 50% drawdown is mathematically expected. Most practitioners use half or quarter Kelly.' },
                  { title:'Why not bet tiny?',   desc:'Betting far below Kelly leaves significant growth on the table. The compound effect of under-betting means you reach goals much more slowly.' },
                  { title:'Key assumption',      desc:"Kelly assumes you know your edge precisely. In practice, edges are estimated — so using a fraction provides a safety margin against estimation error." },
                ].map(({ title, desc }) => (
                  <div key={title} style={{ marginBottom:12, paddingBottom:12, borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <div style={{ fontSize:12.5, fontWeight:600, marginBottom:4 }}>{title}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}