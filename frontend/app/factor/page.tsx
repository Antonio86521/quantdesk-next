'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'

export default function FactorPage() {
  const [tickers, setTickers] = useState('AAPL,MSFT,NVDA,GOOGL,SPY')
  const [shares, setShares]   = useState('20,15,10,25,50')
  const [buyPrices, setBuyPrices] = useState('182,380,650,160,490')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    try { setData(await api.portfolio.analytics({ tickers, shares, buyPrices, period:'1y', benchmark:'SPY' })) }
    catch {}
    finally { setLoading(false) }
  }

  const s = data?.summary

  return (
    <div style={{ padding:'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div><h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Factor Exposure</h1><div style={{ fontSize:13, color:'var(--text2)' }}>Beta · Alpha · R² · Systematic vs Idiosyncratic Risk</div></div>
        {data && <Badge variant="purple">Factor Model</Badge>}
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:12, marginBottom:14 }}>
          {[['Tickers',tickers,setTickers],['Shares',shares,setShares],['Buy Prices',buyPrices,setBuyPrices]].map(([l,v,s]:any)=>(
            <div key={l}><div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div><input className="qd-input" value={v} onChange={e=>s(e.target.value)}/></div>
          ))}
        </div>
        <button onClick={run} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#7c5cfc,#5a3de0)', border:'1px solid rgba(124,92,252,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer' }}>
          {loading?'Analysing...':'Compute Factor Exposure'}
        </button>
      </div>

      {!data&&!loading&&<div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}><div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🧪</div><div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Factor Analysis Ready</div><div style={{ fontSize:13, color:'var(--text2)', maxWidth:400, margin:'0 auto' }}>Compute market beta, alpha, R², and systematic risk decomposition for your portfolio.</div></div>}

      {data&&s&&(<>
        <SectionHeader title="Market Factor (CAPM)" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          <MetricCard label="Market Beta"   value={s.beta?.toFixed(3)||'—'} delta="Market sensitivity" accent="#7c5cfc"/>
          <MetricCard label="Alpha (Ann.)"  value={`${((s.alpha||0)*100).toFixed(2)}%`} delta={`vs ${s.benchmark}`} deltaUp={s.alpha>0}/>
          <MetricCard label="R² (R-Squared)" value={s.r2?.toFixed(3)||'—'} delta="% variance explained by market"/>
          <MetricCard label="Tracking Error" value={`${((s.trackingError||0)*100).toFixed(2)}%`} delta="Active risk vs benchmark"/>
        </div>

        <SectionHeader title="Risk Decomposition" />
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
          {[
            { label:'Systematic Risk (β × σ_m)', value:`${(Math.abs(s.beta||1)*8).toFixed(1)}%`, desc:'Risk attributable to market exposure', color:'var(--accent2)' },
            { label:'Idiosyncratic Risk',          value:`${((s.annVol||0)*100 - Math.abs(s.beta||1)*8).toFixed(1)}%`, desc:'Stock-specific risk not explained by market', color:'var(--purple)' },
            { label:'Total Volatility',            value:`${((s.annVol||0)*100).toFixed(2)}%`, desc:'Combined systematic and idiosyncratic risk', color:'var(--text)' },
            { label:'Information Ratio',           value:s.infoRatio?.toFixed(3)||'—', desc:'Active return divided by tracking error', color: s.infoRatio>0?'var(--green)':'var(--red)' },
          ].map(({ label, value, desc, color }, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom: i<3?'1px solid rgba(255,255,255,0.04)':'none' }}>
              <div><div style={{ fontSize:13, fontWeight:500, marginBottom:3 }}>{label}</div><div style={{ fontSize:11.5, color:'var(--text2)' }}>{desc}</div></div>
              <span style={{ fontFamily:'var(--fm)', fontSize:16, fontWeight:300, color }}>{value}</span>
            </div>
          ))}
        </div>
      </>)}
    </div>
  )
}