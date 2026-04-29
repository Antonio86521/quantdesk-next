'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import SectionHeader from '@/components/ui/SectionHeader'

export default function DerivativesPage() {
  const [form, setForm] = useState({ S:'150', K:'155', T:'0.25', r:'0.05', sigma:'0.25', type:'call' })
  const [result, setResult] = useState<any>(null)
  const [ivForm, setIvForm] = useState({ marketPrice:'8.50', S:'150', K:'155', T:'0.25', r:'0.05', type:'call' })
  const [ivResult, setIvResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const priceOption = async () => {
    setLoading(true)
    try { setResult(await api.options.price(+form.S,+form.K,+form.T,+form.r,+form.sigma,form.type)) }
    catch {}
    finally { setLoading(false) }
  }

  const calcIV = async () => {
    try { setIvResult(await api.options.iv(+ivForm.marketPrice,+ivForm.S,+ivForm.K,+ivForm.T,+ivForm.r,ivForm.type)) }
    catch {}
  }

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px' }}>
        <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Derivatives Pricer</h1>
        <div style={{ fontSize:13, color:'var(--text2)' }}>Black-Scholes · Greeks · Implied Volatility Solver</div>
      </div>

      {/* 1-col on mobile, 2-col on desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:20 }}>
        {/* BS Pricer */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Black-Scholes Pricer</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {[['Spot Price (S)','S'],['Strike Price (K)','K'],['Time to Expiry (T years)','T'],['Risk-Free Rate','r'],['Volatility (σ)','sigma']].map(([l,k])=>(
              <div key={k}>
                <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div>
                <input className="qd-input" value={(form as any)[k]} onChange={e=>setForm(x=>({...x,[k]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Option Type</div>
              <div style={{ display:'flex', gap:8 }}>
                {['call','put'].map(t=>(
                  <button key={t} onClick={()=>setForm(x=>({...x,type:t}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${form.type===t?'rgba(45,127,249,0.3)':'var(--b1)'}`, background: form.type===t?'var(--accent3)':'var(--bg3)', color: form.type===t?'var(--accent2)':'var(--text2)', fontSize:12.5, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={priceOption} disabled={loading} style={{ width:'100%', padding:'10px', borderRadius:8, background:'linear-gradient(135deg,#00c9a7,#00a085)', border:'1px solid rgba(0,201,167,0.3)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Price Option
          </button>
          {result && (
            <div style={{ marginTop:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Option Price</div>
              <div style={{ fontFamily:'var(--fm)', fontSize:32, fontWeight:300, color:'var(--teal)' }}>${Number(result.price).toFixed(4)}</div>
            </div>
          )}
        </div>

        {/* IV Solver */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:16 }}>Implied Volatility Solver</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
            {[['Market Price','marketPrice'],['Spot Price (S)','S'],['Strike Price (K)','K'],['Time to Expiry (T)','T'],['Risk-Free Rate','r']].map(([l,k])=>(
              <div key={k}>
                <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div>
                <input className="qd-input" value={(ivForm as any)[k]} onChange={e=>setIvForm(x=>({...x,[k]:e.target.value}))}/>
              </div>
            ))}
            <div>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Option Type</div>
              <div style={{ display:'flex', gap:8 }}>
                {['call','put'].map(t=>(
                  <button key={t} onClick={()=>setIvForm(x=>({...x,type:t}))} style={{ flex:1, padding:'8px', borderRadius:7, border:`1px solid ${ivForm.type===t?'rgba(45,127,249,0.3)':'var(--b1)'}`, background: ivForm.type===t?'var(--accent3)':'var(--bg3)', color: ivForm.type===t?'var(--accent2)':'var(--text2)', fontSize:12.5, fontWeight:600, cursor:'pointer', textTransform:'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={calcIV} style={{ width:'100%', padding:'10px', borderRadius:8, background:'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.3)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            Solve Implied Volatility
          </button>
          {ivResult && (
            <div style={{ marginTop:16, background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:6 }}>Implied Volatility</div>
              <div style={{ fontFamily:'var(--fm)', fontSize:32, fontWeight:300, color:'var(--purple)' }}>
                {ivResult.impliedVol ? `${(ivResult.impliedVol*100).toFixed(2)}%` : 'No solution found'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reference — 2-col on mobile, 3-col on desktop */}
      <SectionHeader title="Black-Scholes Reference" />
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap:12 }}>
        {[
          { title:'Delta (Δ)', desc:'Rate of change of option price w.r.t. underlying price. Ranges from 0 to 1 for calls, -1 to 0 for puts.', color:'var(--accent2)' },
          { title:'Gamma (Γ)', desc:'Rate of change of delta. Highest for at-the-money options near expiry.', color:'var(--green)' },
          { title:'Theta (Θ)', desc:'Time decay — how much value the option loses per day. Always negative for long options.', color:'var(--amber)' },
          { title:'Vega (ν)',  desc:'Sensitivity to volatility. A 1% increase in vol increases option price by vega amount.', color:'var(--purple)' },
          { title:'Rho (ρ)',   desc:'Sensitivity to risk-free rate. Calls increase, puts decrease with rising rates.', color:'var(--teal)' },
          { title:'IV',        desc:"Implied volatility — the market's expectation of future volatility implied by current option prices.", color:'var(--red)' },
        ].map(({ title, desc, color }) => (
          <div key={title} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'16px 18px' }}>
            <div style={{ fontFamily:'var(--fm)', fontSize:15, fontWeight:500, color, marginBottom:8 }}>{title}</div>
            <div style={{ fontSize:12, color:'var(--text2)', lineHeight:1.6 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}