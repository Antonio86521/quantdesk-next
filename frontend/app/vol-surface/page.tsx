'use client'
import { useState, useEffect, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine } from 'recharts'
import { Waves, ChevronRight } from 'lucide-react'

// ── Constants ─────────────────────────────────────────────────────────────────
const STRIKES  = [0.70, 0.75, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.25, 1.30]
const EXPIRIES = [
  { label:'1W',  T:0.019 },
  { label:'1M',  T:0.083 },
  { label:'2M',  T:0.167 },
  { label:'3M',  T:0.25  },
  { label:'6M',  T:0.5   },
  { label:'9M',  T:0.75  },
  { label:'1Y',  T:1.0   },
  { label:'2Y',  T:2.0   },
]
const COLORS = ['#f54060','#f0836a','#f0a500','#e8c84a','#0dcb7d','#2d7ff9','#7c5cfc','#00c9a7']

// ── IV Model ──────────────────────────────────────────────────────────────────
function mockIV(K: number, T: number, base: number, skew: number, term: number): number {
  const s = skew * (1 - K) * (1 / Math.sqrt(T + 0.05))
  const m = 0.06 * Math.pow(K - 1, 2) / Math.sqrt(T + 0.1)
  const t = term * Math.log(T + 0.1) * 0.015
  return Math.max(0.03, base + s + m + t)
}

// ── Tooltip ───────────────────────────────────────────────────────────────────
function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px', fontSize:11 }}>
      <div style={{ color:'#5ba3f5', marginBottom:6, fontWeight:600 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display:'flex', justifyContent:'space-between', gap:16, marginBottom:3, color:p.color }}>
          <span>{p.name || p.dataKey}</span>
          <span style={{ fontFamily:'var(--fm)', fontWeight:600 }}>{Number(p.value).toFixed(2)}%</span>
        </div>
      ))}
    </div>
  )
}

function MetricPill({ label, value, color, sub }: { label:string; value:string; color?:string; sub?:string }) {
  return (
    <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:11, padding:'12px 14px' }}>
      <div style={{ fontSize:9.5, color:'var(--text4)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6, fontWeight:600 }}>{label}</div>
      <div style={{ fontFamily:'var(--fm)', fontSize:18, fontWeight:300, color:color||'var(--text)', marginBottom:sub?3:0 }}>{value}</div>
      {sub && <div style={{ fontSize:10.5, color:'var(--text4)' }}>{sub}</div>}
    </div>
  )
}

function ivToColor(iv: number): string {
  if (iv > 50) return 'rgba(245,64,96,0.7)'
  if (iv > 40) return 'rgba(245,64,96,0.45)'
  if (iv > 35) return 'rgba(240,165,0,0.55)'
  if (iv > 28) return 'rgba(240,165,0,0.3)'
  if (iv > 22) return 'rgba(91,163,245,0.2)'
  if (iv > 16) return 'rgba(13,203,125,0.2)'
  return 'rgba(13,203,125,0.35)'
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function VolSurfacePage() {
  const [baseVol,    setBaseVol]    = useState(0.25)
  const [skewFactor, setSkewFactor] = useState(0.15)
  const [termFactor, setTermFactor] = useState(0.03)
  const [spot,       setSpot]       = useState(150)
  const [tab,        setTab]        = useState<'smile'|'term'|'surface'|'skew'>('smile')
  const [hoveredExp, setHoveredExp] = useState<string|null>(null)
  const [mob,        setMob]        = useState(false)

  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768)
    fn(); window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const surface = useMemo(() => STRIKES.map(k => ({
    strikeRatio: k,
    strikeLabel: `${(k*100).toFixed(0)}%`,
    strikeAbs:   `$${(k*spot).toFixed(0)}`,
    moneyness:   k < 1 ? 'OTM Put' : k > 1 ? 'OTM Call' : 'ATM',
    ...Object.fromEntries(EXPIRIES.map(({ label, T }) => [label, +(mockIV(k,T,baseVol,skewFactor,termFactor)*100).toFixed(2)])),
  })), [baseVol, skewFactor, termFactor, spot])

  const termStructure = useMemo(() => EXPIRIES.map(({ label, T }) => ({
    expiry: label,
    'ATM':        +(mockIV(1.00, T, baseVol, skewFactor, termFactor)*100).toFixed(2),
    '90% Strike': +(mockIV(0.90, T, baseVol, skewFactor, termFactor)*100).toFixed(2),
    '110% Strike':+(mockIV(1.10, T, baseVol, skewFactor, termFactor)*100).toFixed(2),
  })), [baseVol, skewFactor, termFactor])

  const skewData = useMemo(() => EXPIRIES.map(({ label, T }) => {
    const atm  = mockIV(1.00, T, baseVol, skewFactor, termFactor)*100
    const put  = mockIV(0.90, T, baseVol, skewFactor, termFactor)*100
    const call = mockIV(1.10, T, baseVol, skewFactor, termFactor)*100
    return { expiry:label, 'Put Skew':+(put-atm).toFixed(2), 'Risk Reversal':+(put-call).toFixed(2), 'Smile Premium':+((put+call)/2-atm).toFixed(2) }
  }), [baseVol, skewFactor, termFactor])

  const atmIV1M  = mockIV(1.0, 0.083, baseVol, skewFactor, termFactor)*100
  const atmIV3M  = mockIV(1.0, 0.25,  baseVol, skewFactor, termFactor)*100
  const atmIV1Y  = mockIV(1.0, 1.0,   baseVol, skewFactor, termFactor)*100
  const skew25d  = (mockIV(0.90,0.25,baseVol,skewFactor,termFactor) - mockIV(1.10,0.25,baseVol,skewFactor,termFactor))*100
  const termSlope = atmIV1Y - atmIV1M

  return (
    <div style={{ padding:mob?'0 12px 100px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'20px 0 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:'rgba(0,201,167,0.12)', border:'1px solid rgba(0,201,167,0.25)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Waves size={15} color="#00c9a7" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize:mob?18:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:2 }}>Volatility Surface</h1>
            <div style={{ fontSize:11, color:'var(--text3)' }}>IV Smile · Term Structure · Skew · Risk Reversal · Heatmap</div>
          </div>
        </div>
        <div style={{ padding:'5px 12px', borderRadius:8, background:'rgba(0,201,167,0.08)', border:'1px solid rgba(0,201,167,0.2)', fontSize:11.5, color:'#00c9a7', fontWeight:600 }}>∿ Parametric Model</div>
      </div>

      {/* Controls + metrics */}
      <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'220px 1fr', gap:14, marginBottom:16 }}>

        {/* Parameters */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
          <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:14 }}>Model Parameters</div>
          {([
            { label:'ATM Volatility', value:baseVol,    set:setBaseVol,    min:0.05, max:1.0,   step:0.01,  fmt:(v:number)=>`${(v*100).toFixed(0)}%`, color:'#2d7ff9' },
            { label:'Skew Factor',    value:skewFactor,  set:setSkewFactor, min:0,    max:0.5,   step:0.01,  fmt:(v:number)=>`${v.toFixed(2)}`,         color:'#7c5cfc' },
            { label:'Term Factor',    value:termFactor,  set:setTermFactor, min:-0.1, max:0.1,   step:0.005, fmt:(v:number)=>`${v.toFixed(3)}`,         color:'#f0a500' },
            { label:'Spot Price',     value:spot,        set:setSpot,       min:20,   max:1000,  step:5,     fmt:(v:number)=>`$${v}`,                    color:'#0dcb7d' },
          ] as any[]).map(({ label, value, set, min, max, step, fmt, color }) => (
            <div key={label} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontSize:11.5, color:'var(--text2)' }}>{label}</span>
                <span style={{ fontFamily:'var(--fm)', fontSize:12, color, fontWeight:600 }}>{fmt(value)}</span>
              </div>
              <input type="range" min={min} max={max} step={step} value={value} onChange={e=>set(parseFloat(e.target.value))} style={{ width:'100%', accentColor:color, cursor:'pointer' }}/>
            </div>
          ))}
          <div style={{ padding:'10px 12px', background:'rgba(0,201,167,0.06)', border:'1px solid rgba(0,201,167,0.15)', borderRadius:9, fontSize:11.5, color:'var(--text3)', lineHeight:1.6 }}>
            <strong style={{ color:'#00c9a7' }}>Model:</strong> SVI-inspired parametric surface with put-call skew, smile convexity and term structure.
          </div>
        </div>

        {/* Right: metrics + regime */}
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${mob?2:5},1fr)`, gap:10 }}>
            <MetricPill label="ATM IV 1M"   value={`${atmIV1M.toFixed(1)}%`} color="#2d7ff9" sub="Short-dated"/>
            <MetricPill label="ATM IV 3M"   value={`${atmIV3M.toFixed(1)}%`} color="#7c5cfc" sub="Medium-dated"/>
            <MetricPill label="ATM IV 1Y"   value={`${atmIV1Y.toFixed(1)}%`} color="#00c9a7" sub="Long-dated"/>
            <MetricPill label="25d Skew 3M" value={`${skew25d>=0?'+':''}${skew25d.toFixed(1)}%`} color={skew25d>0?'#f54060':'#0dcb7d'} sub="Put − Call"/>
            <MetricPill label="Term Slope"  value={`${termSlope>=0?'+':''}${termSlope.toFixed(1)}%`} color={termSlope>0?'#0dcb7d':'#f54060'} sub="1Y − 1M ATM"/>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:`repeat(${mob?1:3},1fr)`, gap:10 }}>
            {[
              { title:'Skew Regime',    color:'rgba(45,127,249,0.06)',  border:'rgba(45,127,249,0.16)',  tc:'var(--accent2)', label: skew25d > 3 ? 'Elevated Put Skew' : skew25d < -3 ? 'Call Skew' : 'Balanced', desc: skew25d > 3 ? 'Market paying up for downside — risk-off sentiment.' : skew25d < -3 ? 'Demand for upside calls — bullish positioning.' : 'Put-call skew balanced — no strong directional conviction.' },
              { title:'Term Structure', color:'rgba(124,92,252,0.06)', border:'rgba(124,92,252,0.16)', tc:'var(--purple)',   label: termSlope > 2 ? 'Contango (Normal)' : termSlope < -2 ? 'Backwardation' : 'Flat', desc: termSlope > 2 ? 'Long-dated IV above short-dated — normal uncertainty premium.' : termSlope < -2 ? 'Short-dated IV elevated — near-term event risk.' : 'Flat structure — uniform uncertainty across tenors.' },
              { title:'Vol Regime',     color:'rgba(0,201,167,0.06)',  border:'rgba(0,201,167,0.16)',  tc:'#00c9a7',        label: baseVol > 0.35 ? 'High Vol Regime' : baseVol < 0.18 ? 'Low Vol / Complacency' : 'Normal Vol', desc: baseVol > 0.35 ? 'Elevated ATM vol — stress or uncertainty conditions.' : baseVol < 0.18 ? 'Compressed vol. VIX may spike suddenly.' : 'Vol within normal historical range.' },
            ].map(({ title, color, border, tc, label, desc }) => (
              <div key={title} style={{ background:color, border:`1px solid ${border}`, borderRadius:11, padding:'12px 14px' }}>
                <div style={{ fontSize:10, color:tc, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:5 }}>{title}</div>
                <div style={{ fontSize:13, fontWeight:600, color:'#fff', marginBottom:4 }}>{label}</div>
                <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.55 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom:14, overflowX:'auto' }}>
        <div style={{ display:'flex', gap:3, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, minWidth:'fit-content' }}>
          {(['smile','term','surface','skew'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ flex:mob?1:'none', padding:mob?'7px 10px':'7px 20px', borderRadius:7, border:'none', cursor:'pointer', background:tab===t?'var(--bg5)':'transparent', color:tab===t?'var(--text)':'var(--text3)', fontSize:12, fontWeight:tab===t?600:400, transition:'all 0.14s', whiteSpace:'nowrap', boxShadow:tab===t?'0 2px 8px rgba(0,0,0,0.3)':'none', textTransform:'capitalize' }}>
              {t === 'smile' ? 'IV Smile' : t === 'term' ? 'Term Structure' : t === 'surface' ? 'Full Surface' : 'Skew Analysis'}
            </button>
          ))}
        </div>
      </div>

      {/* ── IV SMILE ── */}
      {tab === 'smile' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:mob?'14px':'16px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:3 }}>Implied Volatility Smile</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>IV across strikes for each expiry — click an expiry to highlight it</div>
            <ResponsiveContainer width="100%" height={mob?200:300}>
              <LineChart data={surface} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <XAxis dataKey="strikeLabel" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={38}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend iconType="circle" iconSize={7} formatter={v=><span style={{ fontSize:10.5, color:'var(--text3)' }}>{v}</span>}/>
                {EXPIRIES.map(({ label }, i) => (
                  <Line key={label} type="monotone" dataKey={label} stroke={COLORS[i]}
                    strokeWidth={hoveredExp===label ? 2.8 : 1.5}
                    opacity={hoveredExp && hoveredExp!==label ? 0.2 : 1}
                    dot={false}/>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Expiry pills */}
          <div style={{ display:'grid', gridTemplateColumns:`repeat(${mob?4:8},1fr)`, gap:8 }}>
            {EXPIRIES.map(({ label, T }, i) => {
              const iv = mockIV(1.0, T, baseVol, skewFactor, termFactor)*100
              const active = hoveredExp === label
              return (
                <div key={label} onClick={() => setHoveredExp(active?null:label)}
                  style={{ background:active?`${COLORS[i]}18`:'var(--bg3)', border:`1px solid ${active?COLORS[i]+'55':'var(--b1)'}`, borderRadius:9, padding:'10px 8px', textAlign:'center', cursor:'pointer', transition:'all 0.15s' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:COLORS[i], marginBottom:4 }}>{label}</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:300 }}>{iv.toFixed(1)}%</div>
                  <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:2 }}>ATM IV</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── TERM STRUCTURE ── */}
      {tab === 'term' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:mob?'14px':'16px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:3 }}>ATM Term Structure</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>IV across expiries for ATM, 90% and 110% strikes</div>
            <ResponsiveContainer width="100%" height={mob?200:280}>
              <LineChart data={termStructure} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <XAxis dataKey="expiry" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={38}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend iconType="circle" iconSize={7} formatter={v=><span style={{ fontSize:10.5, color:'var(--text3)' }}>{v}</span>}/>
                <Line type="monotone" dataKey="90% Strike"  name="90% Strike (Put)"  stroke="#f54060" strokeWidth={1.8} dot={{ r:3, fill:'#f54060' }}/>
                <Line type="monotone" dataKey="ATM"         name="100% ATM"           stroke="#2d7ff9" strokeWidth={2.2} dot={{ r:4, fill:'#2d7ff9' }}/>
                <Line type="monotone" dataKey="110% Strike" name="110% Strike (Call)" stroke="#0dcb7d" strokeWidth={1.8} dot={{ r:3, fill:'#0dcb7d' }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'12px 18px', borderBottom:'1px solid var(--b1)', fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>Term Structure Data</div>
            <div style={{ overflowX:'auto' }}>
              <table className="qd-table" style={{ minWidth:mob?520:'auto' }}>
                <thead>
                  <tr><th>Expiry</th><th>90% (Put OTM)</th><th>ATM</th><th>110% (Call OTM)</th><th>Put Skew</th><th>Call Skew</th><th>Risk Reversal</th></tr>
                </thead>
                <tbody>
                  {EXPIRIES.map(({ label, T }) => {
                    const put  = mockIV(0.90, T, baseVol, skewFactor, termFactor)*100
                    const atm  = mockIV(1.00, T, baseVol, skewFactor, termFactor)*100
                    const call = mockIV(1.10, T, baseVol, skewFactor, termFactor)*100
                    const ps = put-atm, cs = call-atm, rr = put-call
                    return (
                      <tr key={label}>
                        <td><span style={{ fontFamily:'var(--fm)', fontWeight:700, color:'var(--accent2)' }}>{label}</span></td>
                        <td><span className="mono" style={{ color:'#f54060' }}>{put.toFixed(2)}%</span></td>
                        <td><span className="mono" style={{ color:'#2d7ff9', fontWeight:700 }}>{atm.toFixed(2)}%</span></td>
                        <td><span className="mono" style={{ color:'#0dcb7d' }}>{call.toFixed(2)}%</span></td>
                        <td><span className="mono" style={{ color:ps>0?'#f54060':'var(--text)' }}>{ps>=0?'+':''}{ps.toFixed(2)}%</span></td>
                        <td><span className="mono" style={{ color:cs>0?'#0dcb7d':'var(--text)' }}>{cs>=0?'+':''}{cs.toFixed(2)}%</span></td>
                        <td><span className="mono" style={{ color:rr>0?'#f54060':'#0dcb7d' }}>{rr>=0?'+':''}{rr.toFixed(2)}%</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── FULL SURFACE HEATMAP ── */}
      {tab === 'surface' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
            <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--b1)' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:3 }}>Full IV Surface — Heatmap</div>
              <div style={{ fontSize:11, color:'var(--text3)' }}>IV (%) · Strike (rows) vs Expiry (cols) · <span style={{ color:'#f54060' }}>■</span> High  <span style={{ color:'#0dcb7d' }}>■</span> Low</div>
            </div>
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', minWidth:mob?560:'auto' }}>
                <thead>
                  <tr style={{ background:'var(--bg3)' }}>
                    <th style={{ padding:'10px 14px', textAlign:'left', fontSize:9.5, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--b1)', whiteSpace:'nowrap' }}>Strike / Spot</th>
                    {EXPIRIES.map(({ label }) => (
                      <th key={label} style={{ padding:'10px 10px', textAlign:'center', fontSize:9.5, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', borderBottom:'1px solid var(--b1)', whiteSpace:'nowrap' }}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {surface.map((row, ri) => (
                    <tr key={ri} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding:'10px 14px' }}>
                        <div style={{ fontFamily:'var(--fm)', fontWeight:700, fontSize:12.5, color:row.strikeRatio===1.0?'var(--accent2)':'var(--text)' }}>{row.strikeLabel}</div>
                        <div style={{ fontSize:10, color:'var(--text4)', marginTop:2 }}>{row.strikeAbs} · {row.moneyness}</div>
                      </td>
                      {EXPIRIES.map(({ label }) => {
                        const iv = row[label as keyof typeof row] as number
                        return (
                          <td key={label} style={{ padding:'8px 10px', textAlign:'center', background:ivToColor(iv), transition:'background 0.3s' }}>
                            <div style={{ fontFamily:'var(--fm)', fontSize:12, fontWeight:row.strikeRatio===1.0?700:400 }}>{iv.toFixed(1)}%</div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:10 }}>
            <span style={{ fontSize:11.5, fontWeight:600, color:'var(--text2)' }}>IV Scale:</span>
            {[
              { label:'< 16%',  bg:'rgba(13,203,125,0.35)',  color:'#0dcb7d' },
              { label:'16–22%', bg:'rgba(13,203,125,0.2)',   color:'#0dcb7d' },
              { label:'22–28%', bg:'rgba(91,163,245,0.2)',   color:'#5ba3f5' },
              { label:'28–35%', bg:'rgba(240,165,0,0.3)',    color:'#f0a500' },
              { label:'35–50%', bg:'rgba(245,64,96,0.45)',   color:'#f54060' },
              { label:'> 50%',  bg:'rgba(245,64,96,0.7)',    color:'#f54060' },
            ].map(({ label, bg, color }) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <div style={{ width:14, height:14, borderRadius:3, background:bg }}/>
                <span style={{ fontSize:11, color, fontFamily:'var(--fm)' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SKEW ANALYSIS ── */}
      {tab === 'skew' && (
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:mob?'14px':'16px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:3 }}>Skew & Risk Reversal by Expiry</div>
            <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>Put skew · Risk reversal · Smile premium across term</div>
            <ResponsiveContainer width="100%" height={mob?180:240}>
              <BarChart data={skewData} margin={{ top:5, right:5, bottom:0, left:0 }}>
                <XAxis dataKey="expiry" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}/>
                <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={38}/>
                <Tooltip content={<ChartTip/>}/>
                <Legend iconType="circle" iconSize={7} formatter={v=><span style={{ fontSize:10.5, color:'var(--text3)' }}>{v}</span>}/>
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                <Bar dataKey="Put Skew"       fill="#f54060" opacity={0.75} radius={[3,3,0,0]}/>
                <Bar dataKey="Risk Reversal"  fill="#2d7ff9" opacity={0.75} radius={[3,3,0,0]}/>
                <Bar dataKey="Smile Premium"  fill="#7c5cfc" opacity={0.6}  radius={[3,3,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:mob?'1fr':'1fr 1fr', gap:12 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 18px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:12 }}>Glossary</div>
              {[
                { term:'Put Skew',       color:'#f54060', desc:'OTM put IV minus ATM IV. Positive = market paying for downside protection.' },
                { term:'Risk Reversal',  color:'#2d7ff9', desc:'Put IV minus call IV. Positive = puts more expensive — bearish skew.' },
                { term:'Smile Premium',  color:'#7c5cfc', desc:'Average OTM IV minus ATM. Measures smile convexity.' },
                { term:'Term Structure', color:'#0dcb7d', desc:'Shape of ATM IV across expiries. Upward = normal. Inverted = near-term stress.' },
                { term:'Vol of Vol',     color:'#f0a500', desc:'Higher smile = market expects large moves in either direction.' },
              ].map(({ term, color, desc }, i) => (
                <div key={i} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom:i<4?'1px solid rgba(255,255,255,0.04)':'none' }}>
                  <div style={{ width:3, borderRadius:2, background:color, flexShrink:0, minHeight:28 }}/>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:600, color:'var(--text)', marginBottom:3 }}>{term}</div>
                    <div style={{ fontSize:11.5, color:'var(--text3)', lineHeight:1.55 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.16)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontSize:10.5, color:'var(--accent2)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Current 3M Skew</div>
                <div style={{ fontFamily:'var(--fm)', fontSize:28, fontWeight:200, color:skew25d>0?'#f54060':'#0dcb7d', marginBottom:6 }}>{skew25d>=0?'+':''}{skew25d.toFixed(2)}%</div>
                <div style={{ fontSize:12.5, color:'var(--text3)', lineHeight:1.65 }}>
                  {skew25d > 5 ? 'Strongly elevated put skew. Markets pricing significant tail risk — typical pre-earnings or macro uncertainty.' : skew25d > 2 ? 'Moderate put premium. Normal in uncertain markets — portfolio managers hedging downside.' : skew25d > 0 ? 'Slight put bias. Normal market conditions with modest demand for protection.' : 'Call skew dominant — unusual. Seen in melt-up environments or heavily shorted names.'}
                </div>
              </div>
              <div style={{ background:'rgba(240,165,0,0.06)', border:'1px solid rgba(240,165,0,0.15)', borderRadius:10, padding:'12px 14px', fontSize:11.5, color:'var(--amber)', lineHeight:1.65 }}>
                ⚠ Parametric model for illustration. Real surfaces should be calibrated to live options market data (CBOE, broker feeds). Adjust parameters above to model different vol regimes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}