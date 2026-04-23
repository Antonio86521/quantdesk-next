'use client'
import { useState, useCallback } from 'react'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine,
  Cell, Legend, ComposedChart
} from 'recharts'
import MetricCard from '@/components/ui/MetricCard'
import SectionHeader from '@/components/ui/SectionHeader'
import Badge from '@/components/ui/Badge'

// ── GBM engine ────────────────────────────────────────────────────────────────
function randn(): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

function runGBM(S0: number, mu: number, sigma: number, T: number, steps: number, nPaths: number) {
  const dt   = T / steps
  const drift = (mu - 0.5 * sigma * sigma) * dt
  const diff  = sigma * Math.sqrt(dt)
  const paths: Float64Array[] = []

  for (let p = 0; p < nPaths; p++) {
    const path = new Float64Array(steps + 1)
    path[0] = S0
    for (let t = 1; t <= steps; t++) {
      path[t] = path[t - 1] * Math.exp(drift + diff * randn())
    }
    paths.push(path)
  }
  return paths
}

function percentile(sorted: number[], p: number) {
  const idx = Math.floor(p * sorted.length)
  return sorted[Math.max(0, Math.min(sorted.length - 1, idx))]
}

function buildPercentileBands(paths: Float64Array[], sampleSteps: number) {
  const nSteps = paths[0].length
  const step   = Math.max(1, Math.floor(nSteps / sampleSteps))
  const result: any[] = []

  for (let t = 0; t < nSteps; t += step) {
    const vals = paths.map(p => p[t]).sort((a, b) => a - b)
    result.push({
      t,
      p5:   percentile(vals, 0.05),
      p25:  percentile(vals, 0.25),
      p50:  percentile(vals, 0.50),
      p75:  percentile(vals, 0.75),
      p95:  percentile(vals, 0.95),
      mean: vals.reduce((s, v) => s + v, 0) / vals.length,
    })
  }
  return result
}

function buildDistribution(finals: number[], bins: number) {
  const sorted = [...finals].sort((a, b) => a - b)
  const min    = sorted[0], max = sorted[sorted.length - 1]
  const step   = (max - min) / bins
  const hist: any[] = []

  for (let i = 0; i < bins; i++) {
    const lo = min + i * step
    const hi = lo + step
    const count = finals.filter(v => v >= lo && (i === bins - 1 ? v <= hi : v < hi)).length
    hist.push({ lo, hi, mid: (lo + hi) / 2, count, pct: count / finals.length * 100 })
  }
  return hist
}

function buildPayoff(S0: number, finals: number[], type: 'call'|'put'|'straddle', K: number) {
  const sorted = [...finals].sort((a, b) => a - b)
  const min = sorted[0], max = sorted[sorted.length - 1]
  const step = (max - min) / 80
  const data: any[] = []

  for (let S = min; S <= max; S += step) {
    let payoff = 0
    if (type === 'call')    payoff = Math.max(0, S - K)
    if (type === 'put')     payoff = Math.max(0, K - S)
    if (type === 'straddle') payoff = Math.max(S - K, K - S)
    data.push({ price: +S.toFixed(2), payoff: +payoff.toFixed(2) })
  }
  return data
}

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:140 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn ? fn(p.value) : Number(p.value).toFixed(2)}</span>
        </div>
      ))}
    </div>
  )
}

export default function MonteCarloPage() {
  const [form, setForm] = useState({
    S0: '150', mu: '0.10', sigma: '0.25',
    T: '1', steps: '252', paths: '10000',
    K: '155', payoffType: 'call' as 'call'|'put'|'straddle',
  })
  const [results, setResults] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [tab, setTab] = useState<'paths'|'distribution'|'payoff'|'stats'>('paths')
  const [progress, setProgress] = useState(0)

  const run = useCallback(() => {
    setRunning(true)
    setProgress(0)

    // Use setTimeout to allow UI to update before heavy computation
    setTimeout(() => {
      const S0    = +form.S0
      const mu    = +form.mu
      const sigma = +form.sigma
      const T     = +form.T
      const steps = +form.steps
      const nPaths = Math.min(+form.paths, 10000)
      const K     = +form.K

      setProgress(10)
      const paths  = runGBM(S0, mu, sigma, T, steps, nPaths)
      setProgress(50)

      const finals = paths.map(p => p[p.length - 1])
      const sorted = [...finals].sort((a, b) => a - b)

      const mean     = finals.reduce((s, v) => s + v, 0) / finals.length
      const variance = finals.reduce((s, v) => s + (v - mean) ** 2, 0) / finals.length
      const std      = Math.sqrt(variance)
      const var95    = percentile(sorted, 0.05)
      const var99    = percentile(sorted, 0.01)
      const cvar95   = sorted.slice(0, Math.floor(0.05 * sorted.length)).reduce((s, v) => s + v, 0) / Math.floor(0.05 * sorted.length)
      const maxVal   = sorted[sorted.length - 1]
      const minVal   = sorted[0]
      const probProfit = finals.filter(f => f > S0).length / finals.length
      const probGain10 = finals.filter(f => f > S0 * 1.1).length / finals.length
      const probLoss10 = finals.filter(f => f < S0 * 0.9).length / finals.length
      const medianFinal = percentile(sorted, 0.5)

      setProgress(70)
      const bandData   = buildPercentileBands(paths, 120)
      const distData   = buildDistribution(finals, 60)
      const payoffData = buildPayoff(S0, finals, form.payoffType, K)

      setProgress(90)

      // Sample paths for display (show 200 representative paths)
      const sampleIdx = Array.from({ length: 200 }, (_, i) => Math.floor(i * nPaths / 200))
      const displayStep = Math.max(1, Math.floor(steps / 150))
      const pathLines: any[] = []
      for (let t = 0; t <= steps; t += displayStep) {
        const pt: any = { t }
        sampleIdx.forEach((pi, i) => { pt[`p${i}`] = paths[pi][t] })
        pathLines.push(pt)
      }

      setResults({ mean, std, var95, var99, cvar95, maxVal, minVal, probProfit, probGain10, probLoss10, medianFinal, bandData, distData, payoffData, pathLines, finals, sorted, nPaths, S0, K })
      setProgress(100)
      setRunning(false)
    }, 50)
  }, [form])

  const fmtD = (v: number) => `$${v.toFixed(2)}`

  return (
    <div style={{ padding:'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Monte Carlo Lab</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>GBM Simulation · 10,000 Paths · Percentile Bands · Risk Metrics · Payoff Analysis</div>
        </div>
        {results && <Badge variant="purple" dot>{results.nPaths.toLocaleString()} paths</Badge>}
      </div>

      {/* Inputs */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', marginBottom:14 }}>Simulation Parameters</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
          {[
            ['Spot Price (S₀)', 'S0',    '150'],
            ['Annual Drift (μ)', 'mu',   '0.10'],
            ['Volatility (σ)',   'sigma', '0.25'],
            ['Time Horizon (T)', 'T',    '1.0'],
            ['Time Steps',       'steps','252'],
            ['Simulated Paths',  'paths','10000'],
            ['Strike Price (K)', 'K',    '155'],
          ].map(([l, k, p]) => (
            <div key={k}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{l}</div>
              <input className="qd-input" value={(form as any)[k]} placeholder={p}
                onChange={e => setForm(x => ({ ...x, [k]: e.target.value }))} />
            </div>
          ))}
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Payoff Type</div>
            <div style={{ display:'flex', gap:6 }}>
              {(['call','put','straddle'] as const).map(t => (
                <button key={t} onClick={() => setForm(x => ({ ...x, payoffType: t }))} style={{
                  flex:1, padding:'8px 4px', borderRadius:7, border:`1px solid ${form.payoffType===t?'rgba(124,92,252,0.3)':'var(--b1)'}`,
                  background: form.payoffType===t?'rgba(124,92,252,0.1)':'var(--bg3)',
                  color: form.payoffType===t?'var(--purple)':'var(--text2)',
                  fontSize:11, fontWeight:600, cursor:'pointer', textTransform:'capitalize',
                }}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <button onClick={run} disabled={running} style={{
            padding:'10px 28px', borderRadius:8, cursor:running?'not-allowed':'pointer',
            background: running?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)',
            border:'1px solid rgba(124,92,252,0.4)', color:'#fff', fontSize:13, fontWeight:600,
            display:'flex', alignItems:'center', gap:8, boxShadow: running?'none':'0 0 20px rgba(124,92,252,0.25)',
            transition:'all 0.15s',
          }}>
            {running
              ? <><span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Running {progress}%...</>
              : <>🎲 Run {Number(form.paths).toLocaleString()} Path Simulation</>
            }
          </button>

          {running && (
            <div style={{ flex:1, maxWidth:300 }}>
              <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#7c5cfc,#2d7ff9)', borderRadius:2, transition:'width 0.3s ease' }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!results && !running && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:52, textAlign:'center' }}>
          <div style={{ fontSize:40, marginBottom:14 }}>🎲</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700, marginBottom:8 }}>Monte Carlo Lab</div>
          <div style={{ fontSize:13.5, color:'var(--text2)', maxWidth:480, margin:'0 auto', lineHeight:1.7 }}>
            Configure your GBM parameters above and run up to 10,000 simulated price paths. Analyse percentile bands, final price distribution, VaR, and option payoff diagrams.
          </div>
        </div>
      )}

      {/* Results */}
      {results && (
        <>
          {/* Key metrics */}
          <SectionHeader title="Simulation Results" action={
            <span style={{ fontSize:11, color:'var(--text3)' }}>{results.nPaths.toLocaleString()} paths · {form.steps} steps · {form.T}Y horizon</span>
          } />

          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:12 }}>
            <MetricCard label="Mean Final Price"   value={`$${results.mean.toFixed(2)}`}         delta={`${((results.mean/results.S0-1)*100).toFixed(1)}% expected return`} deltaUp={results.mean>results.S0} accent="#7c5cfc" />
            <MetricCard label="Median Final Price" value={`$${results.medianFinal.toFixed(2)}`}  delta="50th percentile" />
            <MetricCard label="Std Dev (Finals)"   value={`$${results.std.toFixed(2)}`}          delta="Cross-path dispersion" />
            <MetricCard label="Prob. of Profit"    value={`${(results.probProfit*100).toFixed(1)}%`} delta="Paths ending above S₀" deltaUp={results.probProfit>0.5} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
            <MetricCard label="VaR 95%"       value={`$${results.var95.toFixed(2)}`}  delta="5th percentile outcome"       deltaUp={false} accent="#f54060" />
            <MetricCard label="VaR 99%"       value={`$${results.var99.toFixed(2)}`}  delta="1st percentile outcome"       deltaUp={false} accent="#f54060" />
            <MetricCard label="CVaR 95%"      value={`$${results.cvar95.toFixed(2)}`} delta="Average of worst 5%"          deltaUp={false} />
            <MetricCard label="Prob +10% Gain" value={`${(results.probGain10*100).toFixed(1)}%`} delta="Paths gaining >10%" deltaUp={results.probGain10>0.3} />
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
            {(['paths','distribution','payoff','stats'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding:'7px 20px', borderRadius:7, border:'none', cursor:'pointer',
                background: tab===t?'var(--bg5)':'transparent',
                color: tab===t?'var(--text)':'var(--text2)',
                fontSize:12, fontWeight: tab===t?600:400, transition:'all 0.15s',
                textTransform:'capitalize',
                boxShadow: tab===t?'0 2px 8px rgba(0,0,0,0.3)':'none',
              }}>{t === 'paths' ? '📈 Paths' : t === 'distribution' ? '📊 Distribution' : t === 'payoff' ? '💰 Payoff' : '📋 Stats'}</button>
            ))}
          </div>

          {/* ── PATHS TAB ── */}
          {tab === 'paths' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              {/* Percentile band chart */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Percentile Bands — All {results.nPaths.toLocaleString()} Paths</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>P5 / P25 / Median / P75 / P95 — shaded regions show probability mass</div>
                <ResponsiveContainer width="100%" height={320}>
                  <ComposedChart data={results.bandData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="band90" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#7c5cfc" stopOpacity={0.08} />
                        <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="band50" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#7c5cfc" stopOpacity={0.18} />
                        <stop offset="100%" stopColor="#7c5cfc" stopOpacity={0.06} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `D${v}`} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${v.toFixed(0)}`} width={52} />
                    <Tooltip content={<Tip fn={fmtD} />} />
                    <ReferenceLine y={results.S0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 3"
                      label={{ value:'S₀', fill:'#68809a', fontSize:9, position:'right' }} />
                    {/* P5-P95 outer band */}
                    <Area type="monotone" dataKey="p95" name="P95" stroke="none" fill="url(#band90)" legendType="none" />
                    <Area type="monotone" dataKey="p5"  name="P5"  stroke="none" fill="var(--bg2)"  legendType="none" />
                    {/* P25-P75 inner band */}
                    <Area type="monotone" dataKey="p75" name="P75" stroke="rgba(124,92,252,0.3)" strokeWidth={1} fill="url(#band50)" legendType="none" />
                    <Area type="monotone" dataKey="p25" name="P25" stroke="rgba(124,92,252,0.3)" strokeWidth={1} fill="var(--bg2)" legendType="none" />
                    {/* Lines */}
                    <Line type="monotone" dataKey="p95"  name="P95"    stroke="#f54060"  strokeWidth={1.2} dot={false} strokeDasharray="3 2" />
                    <Line type="monotone" dataKey="p75"  name="P75"    stroke="#f0a500"  strokeWidth={1.2} dot={false} />
                    <Line type="monotone" dataKey="p50"  name="Median" stroke="#e4ecf7"  strokeWidth={2.2} dot={false} />
                    <Line type="monotone" dataKey="mean" name="Mean"   stroke="#7c5cfc"  strokeWidth={1.8} dot={false} strokeDasharray="5 2" />
                    <Line type="monotone" dataKey="p25"  name="P25"    stroke="#0dcb7d"  strokeWidth={1.2} dot={false} />
                    <Line type="monotone" dataKey="p5"   name="P5"     stroke="#2d7ff9"  strokeWidth={1.2} dot={false} strokeDasharray="3 2" />
                    <Legend iconType="line" iconSize={12} formatter={v => <span style={{ fontSize:10.5, color:'var(--text2)' }}>{v}</span>} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Sample paths (200 shown) */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>200 Representative Paths</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>Randomly sampled from {results.nPaths.toLocaleString()} total simulations</div>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={results.pathLines}>
                    <XAxis dataKey="t" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `D${v}`} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${v.toFixed(0)}`} width={52} />
                    <ReferenceLine y={results.S0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                    {Array.from({ length: 200 }, (_, i) => (
                      <Line key={i} type="monotone" dataKey={`p${i}`}
                        stroke={`hsla(${220 + i * 0.8},70%,${55 + (i%20)}%,0.25)`}
                        strokeWidth={0.8} dot={false} legendType="none" />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── DISTRIBUTION TAB ── */}
          {tab === 'distribution' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Final Price Distribution</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>Histogram of {results.nPaths.toLocaleString()} terminal prices — 60 bins</div>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={results.distData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <XAxis dataKey="mid" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${Number(v).toFixed(0)}`} interval={9} />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${v.toFixed(0)}`} width={40} />
                    <Tooltip content={<Tip fn={(v: number) => `${v.toFixed(2)}%`} />} />
                    <ReferenceLine x={results.S0}       stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3"
                      label={{ value:'S₀', fill:'#e4ecf7', fontSize:9 }} />
                    <ReferenceLine x={results.mean}     stroke="#7c5cfc" strokeDasharray="4 2"
                      label={{ value:'Mean', fill:'#7c5cfc', fontSize:9 }} />
                    <ReferenceLine x={results.var95}    stroke="#f54060" strokeDasharray="4 2"
                      label={{ value:'VaR 95%', fill:'#f54060', fontSize:9 }} />
                    <Bar dataKey="pct" name="Frequency %" radius={[2,2,0,0]}>
                      {results.distData.map((d: any, i: number) => (
                        <Cell key={i}
                          fill={d.mid < results.var95 ? '#f54060' : d.mid > results.S0 * 1.1 ? '#0dcb7d' : '#2d7ff9'}
                          opacity={0.75} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ display:'flex', gap:16, marginTop:12 }}>
                  {[
                    { label:'Red zone', desc:`Below VaR 95% ($${results.var95.toFixed(0)})`, color:'var(--red)' },
                    { label:'Blue zone', desc:'Normal range', color:'var(--accent2)' },
                    { label:'Green zone', desc:`Above +10% ($${(results.S0*1.1).toFixed(0)})`, color:'var(--green)' },
                  ].map(({ label, desc, color }) => (
                    <div key={label} style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <div style={{ width:10, height:10, borderRadius:2, background:color, flexShrink:0 }} />
                      <div><div style={{ fontSize:11, fontWeight:600, color }}>{label}</div><div style={{ fontSize:10.5, color:'var(--text3)' }}>{desc}</div></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return distribution */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>Return Distribution</div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>Terminal returns as percentage of initial price</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={buildDistribution(results.finals.map((f: number) => (f / results.S0 - 1) * 100), 50)}
                    margin={{ top:5, right:5, bottom:0, left:0 }}
                  >
                    <XAxis dataKey="mid" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${Number(v).toFixed(0)}%`} interval={9} />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} width={36} />
                    <Tooltip formatter={(v: any) => `${Number(v).toFixed(2)}%`} contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }} />
                    <ReferenceLine x={0} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
                    <Bar dataKey="pct" name="Frequency %" radius={[2,2,0,0]}>
                      {buildDistribution(results.finals.map((f:number)=>(f/results.S0-1)*100),50).map((d:any,i:number)=>(
                        <Cell key={i} fill={d.mid>=0?'#0dcb7d':'#f54060'} opacity={0.75}/>
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── PAYOFF TAB ── */}
          {tab === 'payoff' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>
                  Option Payoff Diagram — {form.payoffType.charAt(0).toUpperCase()+form.payoffType.slice(1)} at K=${form.K}
                </div>
                <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>
                  Payoff as a function of terminal price — based on {results.nPaths.toLocaleString()} simulated outcomes
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={results.payoffData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                    <defs>
                      <linearGradient id="payg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#0dcb7d" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0dcb7d" stopOpacity={0.01} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="price" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${Number(v).toFixed(0)}`} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `$${Number(v).toFixed(0)}`} width={52} />
                    <Tooltip content={<Tip fn={fmtD} />} />
                    <ReferenceLine x={results.K}  stroke="#f0a500" strokeDasharray="4 2"
                      label={{ value:`K=$${results.K}`, fill:'#f0a500', fontSize:9, position:'top' }} />
                    <ReferenceLine x={results.S0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 3"
                      label={{ value:`S₀=$${results.S0}`, fill:'#68809a', fontSize:9, position:'top' }} />
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
                    <Area type="monotone" dataKey="payoff" name="Payoff" stroke="#0dcb7d" strokeWidth={2.2} fill="url(#payg)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Profit probability at different strikes */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Probability Profile at Different Strikes</div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[0.85,0.90,0.95,1.0,1.05,1.10,1.15,1.20,1.25,1.30].map(m => {
                      const strike = results.S0 * m
                      const prob = form.payoffType === 'put'
                        ? results.finals.filter((f:number) => f < strike).length / results.finals.length * 100
                        : results.finals.filter((f:number) => f > strike).length / results.finals.length * 100
                      return { strike: `$${strike.toFixed(0)}`, prob: +prob.toFixed(1) }
                    })}
                  >
                    <XAxis dataKey="strike" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}
                      tickFormatter={v => `${v}%`} width={38} />
                    <Tooltip formatter={(v: any) => `${Number(v).toFixed(1)}%`} contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }} />
                    <Bar dataKey="prob" name="Probability of Profit %" radius={[3,3,0,0]}>
                      {[0.85,0.90,0.95,1.0,1.05,1.10,1.15,1.20,1.25,1.30].map((m, i) => (
                        <Cell key={i}
                          fill={m <= 1.0 ? '#0dcb7d' : m <= 1.10 ? '#2d7ff9' : '#7c5cfc'}
                          opacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ── STATS TAB ── */}
          {tab === 'stats' && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Distribution Statistics</div>
                <table className="qd-table">
                  <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                  <tbody>
                    {[
                      ['Paths Simulated',   results.nPaths.toLocaleString()],
                      ['Initial Price (S₀)', `$${results.S0.toFixed(2)}`],
                      ['Mean Final Price',  `$${results.mean.toFixed(2)}`],
                      ['Median Final Price',`$${results.medianFinal.toFixed(2)}`],
                      ['Std Dev',          `$${results.std.toFixed(2)}`],
                      ['Min Final Price',  `$${results.minVal.toFixed(2)}`],
                      ['Max Final Price',  `$${results.maxVal.toFixed(2)}`],
                      ['P5 Outcome',       `$${percentile(results.sorted,0.05).toFixed(2)}`],
                      ['P25 Outcome',      `$${percentile(results.sorted,0.25).toFixed(2)}`],
                      ['P75 Outcome',      `$${percentile(results.sorted,0.75).toFixed(2)}`],
                      ['P95 Outcome',      `$${percentile(results.sorted,0.95).toFixed(2)}`],
                    ].map(([l,v],i)=>(
                      <tr key={i}><td style={{ fontWeight:500 }}>{l}</td><td><span className="mono">{v}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Risk & Probability Metrics</div>
                <table className="qd-table">
                  <thead><tr><th>Metric</th><th>Value</th></tr></thead>
                  <tbody>
                    {[
                      ['VaR 95%',            `$${results.var95.toFixed(2)}`],
                      ['VaR 99%',            `$${results.var99.toFixed(2)}`],
                      ['CVaR 95%',           `$${results.cvar95.toFixed(2)}`],
                      ['VaR 95% (return)',   `${((results.var95/results.S0-1)*100).toFixed(2)}%`],
                      ['Prob. of Profit',    `${(results.probProfit*100).toFixed(1)}%`],
                      ['Prob. +10% gain',    `${(results.probGain10*100).toFixed(1)}%`],
                      ['Prob. -10% loss',    `${(results.probLoss10*100).toFixed(1)}%`],
                      ['Expected Return',    `${((results.mean/results.S0-1)*100).toFixed(2)}%`],
                      ['Coefficient of Var.', `${(results.std/results.mean*100).toFixed(1)}%`],
                      ['Sharpe (simulated)', `${((results.mean/results.S0-1)/(results.std/results.mean)).toFixed(3)}`],
                    ].map(([l,v],i)=>(
                      <tr key={i}><td style={{ fontWeight:500 }}>{l}</td><td><span className="mono">{v}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}