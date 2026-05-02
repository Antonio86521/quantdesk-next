'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import { Activity, TrendingUp, TrendingDown, RefreshCw, ChevronRight } from 'lucide-react'

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(v: any, d = 4) { return v == null ? '—' : Number(v).toFixed(d) }
function fmtPct(v: any)     { return v == null ? '—' : `${(v * 100).toFixed(2)}%` }

// ── Payoff chart ──────────────────────────────────────────────────────────────
function PayoffChart({ S, K, price, type }: { S: number; K: number; price: number; type: string }) {
  const w = 320, h = 140
  const range = S * 0.4
  const points = 80
  const prices = Array.from({ length: points }, (_, i) => S - range + (i / (points - 1)) * range * 2)

  const payoffs = prices.map(p => {
    const intrinsic = type === 'call' ? Math.max(0, p - K) : Math.max(0, K - p)
    return intrinsic - price
  })

  const minP = Math.min(...payoffs), maxP = Math.max(...payoffs)
  const padY = 16

  function toX(p: number) { return ((p - prices[0]) / (prices[prices.length - 1] - prices[0])) * (w - 40) + 20 }
  function toY(v: number) { return padY + ((maxP - v) / (maxP - minP)) * (h - padY * 2) }

  const polyPoints = prices.map((p, i) => `${toX(p)},${toY(payoffs[i])}`).join(' ')
  const zeroY = toY(0)
  const breakeven = type === 'call' ? K + price : K - price

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <defs>
        <linearGradient id="payoffGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0dcb7d" stopOpacity={0.2}/>
          <stop offset="100%" stopColor="#0dcb7d" stopOpacity={0}/>
        </linearGradient>
      </defs>
      {/* Zero line */}
      <line x1={20} y1={zeroY} x2={w-20} y2={zeroY} stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="4 3"/>
      {/* Strike line */}
      <line x1={toX(K)} y1={padY} x2={toX(K)} y2={h-padY} stroke="rgba(45,127,249,0.4)" strokeWidth={1} strokeDasharray="3 2"/>
      {/* Breakeven */}
      <line x1={toX(breakeven)} y1={padY} x2={toX(breakeven)} y2={h-padY} stroke="rgba(13,203,125,0.4)" strokeWidth={1} strokeDasharray="3 2"/>
      {/* Profit area fill */}
      <polyline points={polyPoints} fill="none" stroke="rgba(13,203,125,0.12)" strokeWidth={0}/>
      {/* Payoff line */}
      <polyline points={polyPoints} fill="none" stroke="#0dcb7d" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round"/>
      {/* Labels */}
      <text x={toX(K)} y={h-4} textAnchor="middle" fontSize={8} fill="#2d7ff9" opacity={0.7}>K=${K}</text>
      <text x={toX(breakeven)} y={padY-2} textAnchor="middle" fontSize={8} fill="#0dcb7d" opacity={0.7}>BE=${breakeven.toFixed(1)}</text>
      <text x={20} y={zeroY-4} fontSize={8} fill="rgba(255,255,255,0.3)">0</text>
    </svg>
  )
}

// ── Greeks gauge ──────────────────────────────────────────────────────────────
function GreekBar({ label, value, min, max, color }: { label: string; value: number; min: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:11, color:'var(--text3)', fontWeight:600 }}>{label}</span>
        <span style={{ fontFamily:'var(--fm)', fontSize:13, color }}>{value.toFixed(4)}</span>
      </div>
      <div style={{ height:4, background:'var(--bg4)', borderRadius:2, overflow:'hidden' }}>
        <div style={{ height:4, width:`${pct}%`, background:color, borderRadius:2, transition:'width 0.5s ease' }}/>
      </div>
    </div>
  )
}

// ── Sensitivity table ─────────────────────────────────────────────────────────
function SensitivityTable({ S, K, T, r, sigma, type }: any) {
  const sigmas = [sigma - 0.1, sigma - 0.05, sigma, sigma + 0.05, sigma + 0.1].filter(s => s > 0)
  const spots  = [S * 0.9, S * 0.95, S, S * 1.05, S * 1.1]

  return (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11.5 }}>
        <thead>
          <tr>
            <th style={{ padding:'8px 10px', background:'var(--bg3)', color:'var(--text3)', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'0.5px', textAlign:'left', borderBottom:'1px solid var(--b1)' }}>Spot ↓ / σ →</th>
            {sigmas.map(s => (
              <th key={s} style={{ padding:'8px 10px', background:'var(--bg3)', color: s === sigma ? 'var(--accent2)' : 'var(--text3)', fontWeight:600, fontSize:10, textTransform:'uppercase', borderBottom:'1px solid var(--b1)', textAlign:'center' }}>{(s*100).toFixed(0)}%</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {spots.map(sp => (
            <tr key={sp} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <td style={{ padding:'8px 10px', color: sp === S ? 'var(--accent2)' : 'var(--text2)', fontFamily:'var(--fm)', fontWeight: sp === S ? 600 : 400 }}>${sp.toFixed(1)}</td>
              {sigmas.map(sg => {
                // Simplified BS approximation for display
                const d1 = (Math.log(sp/K) + (r + 0.5*sg*sg)*T) / (sg * Math.sqrt(T))
                const d2 = d1 - sg * Math.sqrt(T)
                const N  = (x: number) => 0.5 * (1 + Math.sign(x) * (1 - Math.exp(-0.147*x*x*(4/Math.PI + 0.147*x*x)/(1+0.147*x*x))))
                const price = type === 'call'
                  ? sp * N(d1) - K * Math.exp(-r*T) * N(d2)
                  : K * Math.exp(-r*T) * N(-d2) - sp * N(-d1)
                const isCenter = sp === S && sg === sigma
                return (
                  <td key={sg} style={{ padding:'8px 10px', textAlign:'center', fontFamily:'var(--fm)', color: isCenter ? '#fff' : price > 0 ? 'var(--text)' : 'var(--text3)', background: isCenter ? 'rgba(45,127,249,0.12)' : 'transparent', fontWeight: isCenter ? 600 : 400 }}>
                    ${Math.max(0, price).toFixed(2)}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DerivativesPage() {
  const [form, setForm]       = useState({ S:'150', K:'155', T:'0.25', r:'0.05', sigma:'0.25', type:'call' })
  const [result, setResult]   = useState<any>(null)
  const [ivForm, setIvForm]   = useState({ marketPrice:'8.50', S:'150', K:'155', T:'0.25', r:'0.05', type:'call' })
  const [ivResult, setIvResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [ivLoading, setIvLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pricer'|'iv'|'sensitivity'>('pricer')
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const priceOption = async () => {
    setLoading(true)
    try { setResult(await api.options.price(+form.S, +form.K, +form.T, +form.r, +form.sigma, form.type)) }
    catch {}
    finally { setLoading(false) }
  }

  const calcIV = async () => {
    setIvLoading(true)
    try { setIvResult(await api.options.iv(+ivForm.marketPrice, +ivForm.S, +ivForm.K, +ivForm.T, +ivForm.r, ivForm.type)) }
    catch {}
    finally { setIvLoading(false) }
  }

  // Compute live Greeks from Black-Scholes
  const computeGreeks = useCallback(() => {
    const S = +form.S, K = +form.K, T = +form.T, r = +form.r, sigma = +form.sigma
    if (!S || !K || !T || !sigma) return null
    const sqrtT = Math.sqrt(T)
    const d1    = (Math.log(S/K) + (r + 0.5*sigma*sigma)*T) / (sigma*sqrtT)
    const d2    = d1 - sigma*sqrtT
    const N     = (x: number) => 0.5*(1+Math.sign(x)*(1-Math.exp(-0.147*x*x*(4/Math.PI+0.147*x*x)/(1+0.147*x*x))))
    const n     = (x: number) => Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI)
    const Nd1   = N(d1), Nd2 = N(d2)
    const nd1   = n(d1)
    const disc  = Math.exp(-r*T)

    if (form.type === 'call') {
      return {
        delta: Nd1,
        gamma: nd1 / (S*sigma*sqrtT),
        theta: (-(S*nd1*sigma)/(2*sqrtT) - r*K*disc*Nd2) / 365,
        vega:  S*nd1*sqrtT / 100,
        rho:   K*T*disc*Nd2 / 100,
      }
    } else {
      return {
        delta: Nd1 - 1,
        gamma: nd1 / (S*sigma*sqrtT),
        theta: (-(S*nd1*sigma)/(2*sqrtT) + r*K*disc*N(-d2)) / 365,
        vega:  S*nd1*sqrtT / 100,
        rho:   -K*T*disc*N(-d2) / 100,
      }
    }
  }, [form])

  const greeks = computeGreeks()
  const moneyness = form.S && form.K ? ((+form.S - +form.K) / +form.K * 100) : 0
  const moneynessLabel = moneyness > 2 ? 'In the Money' : moneyness < -2 ? 'Out of the Money' : 'At the Money'
  const moneynessColor = moneyness > 2 ? 'var(--green)' : moneyness < -2 ? 'var(--red)' : 'var(--amber)'

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(0,201,167,0.12)', border:'1px solid rgba(0,201,167,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Activity size={16} color="var(--teal)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Derivatives Pricer</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>Black-Scholes · Greeks · IV Solver · Sensitivity Analysis</div>
          </div>
        </div>
        {result && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ padding:'4px 12px', borderRadius:20, background:'rgba(0,201,167,0.1)', border:'1px solid rgba(0,201,167,0.2)', color:'var(--teal)', fontSize:12, fontWeight:600 }}>
              {form.type === 'call' ? '📈' : '📉'} {form.type.toUpperCase()}
            </div>
            <div style={{ padding:'4px 12px', borderRadius:20, background:`rgba(${moneyness > 2 ? '13,203,125' : moneyness < -2 ? '245,64,96' : '240,165,0'},0.1)`, fontSize:12, fontWeight:600, color:moneynessColor }}>
              {moneynessLabel}
            </div>
          </div>
        )}
      </div>

      {/* Tab selector */}
      <div style={{ display:'flex', gap:3, marginBottom:20, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3, width:'fit-content' }}>
        {[
          { key:'pricer',      label:'BS Pricer' },
          { key:'iv',          label:'IV Solver' },
          { key:'sensitivity', label:'Sensitivity' },
        ].map(({ key, label }) => (
          <button key={key} onClick={()=>setActiveTab(key as any)} style={{ padding:'6px 18px', borderRadius:7, border:'none', cursor:'pointer', background:activeTab===key?'var(--bg5)':'transparent', color:activeTab===key?'var(--text)':'var(--text2)', fontSize:12, fontWeight:activeTab===key?600:400, transition:'all 0.14s', boxShadow:activeTab===key?'0 2px 8px rgba(0,0,0,0.3)':'none', whiteSpace:'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── BS PRICER ── */}
      {activeTab === 'pricer' && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20 }}>

          {/* Inputs */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                Black-Scholes Pricer
              </div>

              {/* Option type toggle */}
              <div style={{ display:'flex', gap:0, marginBottom:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3 }}>
                {['call','put'].map(t => (
                  <button key={t} onClick={()=>setForm(x=>({...x,type:t}))} style={{ flex:1, padding:'8px', borderRadius:7, border:'none', cursor:'pointer', background:form.type===t?'var(--bg5)':'transparent', color:form.type===t?(t==='call'?'var(--green)':'var(--red)'):'var(--text2)', fontSize:13, fontWeight:600, textTransform:'capitalize', transition:'all 0.14s', boxShadow:form.type===t?'0 2px 8px rgba(0,0,0,0.3)':'none' }}>
                    {t === 'call' ? '📈 Call' : '📉 Put'}
                  </button>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  { label:'Spot Price (S)', key:'S', hint:'Current stock price' },
                  { label:'Strike Price (K)', key:'K', hint:'Option strike' },
                  { label:'Time to Expiry (T)', key:'T', hint:'In years e.g. 0.25 = 3mo' },
                  { label:'Risk-Free Rate (r)', key:'r', hint:'Annual e.g. 0.05 = 5%' },
                  { label:'Volatility (σ)', key:'sigma', hint:'Annual e.g. 0.25 = 25%' },
                ].map(({ label, key, hint }) => (
                  <div key={key}>
                    <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:3, fontWeight:500 }}>{label}</div>
                    <input className="qd-input" value={(form as any)[key]} onChange={e=>setForm(x=>({...x,[key]:e.target.value}))}/>
                    <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:3 }}>{hint}</div>
                  </div>
                ))}
                <div style={{ display:'flex', alignItems:'flex-end' }}>
                  <button onClick={priceOption} disabled={loading} style={{ width:'100%', padding:'10px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#00c9a7,#00a085)', border:'1px solid rgba(0,201,167,0.3)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                    {loading?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<ChevronRight size={13}/>}
                    {loading ? 'Pricing...' : 'Price Option'}
                  </button>
                </div>
              </div>

              {result && (
                <div style={{ background:'var(--bg3)', border:'1px solid rgba(0,201,167,0.2)', borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#00c9a7,transparent)' }}/>
                  <div style={{ fontSize:10, color:'var(--teal)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, fontWeight:600 }}>Option Price</div>
                  <div style={{ fontFamily:'var(--fm)', fontSize:36, fontWeight:300, color:'var(--teal)', marginBottom:4 }}>${Number(result.price).toFixed(4)}</div>
                  <div style={{ fontSize:11, color:'var(--text3)' }}>{form.type} · S=${form.S} · K=${form.K} · T=${form.T}y · σ={Math.round(+form.sigma*100)}%</div>
                </div>
              )}
            </div>

            {/* Greeks */}
            {greeks && (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Live Greeks</div>
                <GreekBar label="Delta (Δ)" value={greeks.delta} min={-1} max={1} color="#2d7ff9"/>
                <GreekBar label="Gamma (Γ)" value={greeks.gamma} min={0} max={0.1} color="#0dcb7d"/>
                <GreekBar label="Theta (Θ)" value={greeks.theta} min={-0.1} max={0} color="#f0a500"/>
                <GreekBar label="Vega (ν)"  value={greeks.vega}  min={0} max={1}   color="#7c5cfc"/>
                <GreekBar label="Rho (ρ)"   value={greeks.rho}   min={-1} max={1}  color="#f54060"/>
              </div>
            )}
          </div>

          {/* Payoff + info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {/* Payoff diagram */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Payoff at Expiry</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginBottom:14 }}>P&L diagram vs spot price — <span style={{ color:'#2d7ff9' }}>K=${form.K}</span> · <span style={{ color:'#0dcb7d' }}>breakeven</span></div>
              <PayoffChart S={+form.S} K={+form.K} price={result ? +result.price : 5} type={form.type}/>
            </div>

            {/* Greeks reference */}
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
              <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14 }}>Greeks Reference</div>
              <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                {[
                  { g:'Δ Delta',  c:'#2d7ff9', d:'Price change per $1 move in spot. 0→1 for calls, -1→0 for puts.' },
                  { g:'Γ Gamma',  c:'#0dcb7d', d:'Rate of delta change. Highest ATM near expiry.' },
                  { g:'Θ Theta',  c:'#f0a500', d:'Daily time decay. Long options lose value each day.' },
                  { g:'ν Vega',   c:'#7c5cfc', d:'P&L per 1% vol move. Long options gain from rising vol.' },
                  { g:'ρ Rho',    c:'#f54060', d:'Rate sensitivity. Less important than other Greeks.' },
                ].map(({ g, c, d }, i) => (
                  <div key={g} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color:c, width:56, flexShrink:0 }}>{g}</div>
                    <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.55 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── IV SOLVER ── */}
      {activeTab === 'iv' && (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:20 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Implied Volatility Solver</div>
            <div style={{ display:'flex', gap:0, marginBottom:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:9, padding:3 }}>
              {['call','put'].map(t => (
                <button key={t} onClick={()=>setIvForm(x=>({...x,type:t}))} style={{ flex:1, padding:'8px', borderRadius:7, border:'none', cursor:'pointer', background:ivForm.type===t?'var(--bg5)':'transparent', color:ivForm.type===t?(t==='call'?'var(--green)':'var(--red)'):'var(--text2)', fontSize:13, fontWeight:600, textTransform:'capitalize', transition:'all 0.14s' }}>
                  {t === 'call' ? '📈 Call' : '📉 Put'}
                </button>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              {[
                { label:'Market Price',     key:'marketPrice', hint:'Observed option price' },
                { label:'Spot Price (S)',   key:'S',           hint:'Current stock price' },
                { label:'Strike (K)',       key:'K',           hint:'Option strike price' },
                { label:'Time (T years)',   key:'T',           hint:'0.25 = 3 months' },
                { label:'Risk-Free Rate',  key:'r',           hint:'Annual e.g. 0.05' },
              ].map(({ label, key, hint }) => (
                <div key={key}>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:3, fontWeight:500 }}>{label}</div>
                  <input className="qd-input" value={(ivForm as any)[key]} onChange={e=>setIvForm(x=>({...x,[key]:e.target.value}))}/>
                  <div style={{ fontSize:9.5, color:'var(--text4)', marginTop:3 }}>{hint}</div>
                </div>
              ))}
              <div style={{ display:'flex', alignItems:'flex-end' }}>
                <button onClick={calcIV} disabled={ivLoading} style={{ width:'100%', padding:'10px', borderRadius:8, background:ivLoading?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.3)', color:'#fff', fontSize:13, fontWeight:600, cursor:ivLoading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  {ivLoading?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<ChevronRight size={13}/>}
                  Solve IV
                </button>
              </div>
            </div>
            {ivResult && (
              <div style={{ background:'var(--bg3)', border:'1px solid rgba(124,92,252,0.2)', borderRadius:12, padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg,#7c5cfc,transparent)' }}/>
                <div style={{ fontSize:10, color:'var(--purple)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6, fontWeight:600 }}>Implied Volatility</div>
                <div style={{ fontFamily:'var(--fm)', fontSize:36, fontWeight:300, color:'var(--purple)' }}>
                  {ivResult.impliedVol ? `${(ivResult.impliedVol*100).toFixed(2)}%` : 'No solution found'}
                </div>
                {ivResult.impliedVol && (
                  <div style={{ fontSize:11, color:'var(--text3)', marginTop:4 }}>
                    {ivResult.impliedVol < 0.2 ? 'Low vol — market expects calm' : ivResult.impliedVol > 0.5 ? 'High vol — market expects large moves' : 'Moderate volatility environment'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IV interpretation */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>IV Interpretation Guide</div>
            {[
              { range:'< 15%',  label:'Very Low',  desc:"Market expects minimal moves. Cheap options — good for buying vol strategies (straddles, strangles).", color:'#0dcb7d' },
              { range:'15–25%', label:'Low–Normal', desc:'Calm market conditions. Options fairly priced. Standard directional strategies work well.', color:'#5ba3f5' },
              { range:'25–40%', label:'Elevated',   desc:'Market pricing in uncertainty. Earnings, events likely. Selling premium becomes attractive.', color:'#f0a500' },
              { range:'40–60%', label:'High',       desc:'Significant fear or uncertainty. IV crush risk after events. Consider spreads over naked options.', color:'#f54060' },
              { range:'> 60%',  label:'Extreme',   desc:'Crisis-level fear. VIX regime. Tail risk hedges active. Options extremely expensive.', color:'#7c5cfc' },
            ].map(({ range, label, desc, color }, i) => (
              <div key={i} style={{ display:'flex', gap:12, padding:'12px 0', borderBottom: i < 4 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ flexShrink:0, textAlign:'right' }}>
                  <div style={{ fontFamily:'var(--fm)', fontSize:12, color, fontWeight:600, marginBottom:2 }}>{range}</div>
                  <div style={{ fontSize:10, color:'var(--text3)' }}>{label}</div>
                </div>
                <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SENSITIVITY ── */}
      {activeTab === 'sensitivity' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>Price Sensitivity Matrix</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginBottom:16 }}>Option price vs spot price and volatility — center cell is current inputs</div>
            <SensitivityTable S={+form.S} K={+form.K} T={+form.T} r={+form.r} sigma={+form.sigma} type={form.type}/>
          </div>
          <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'14px 16px', fontSize:12.5, color:'var(--text2)', lineHeight:1.7 }}>
            <strong style={{ color:'var(--accent2)' }}>How to read:</strong> Each cell shows the theoretical option price for a given spot / volatility combination. The highlighted center cell uses your current inputs. Moving right increases volatility (higher prices), moving down increases spot (higher calls, lower puts).
          </div>
        </div>
      )}
    </div>
  )
}