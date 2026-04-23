'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import SectionHeader from '@/components/ui/SectionHeader'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const STRIKES = [0.8,0.85,0.9,0.95,1.0,1.05,1.1,1.15,1.2]
const EXPIRIES = [0.083,0.167,0.25,0.5,0.75,1.0]

function mockIV(K_ratio:number, T:number, baseVol=0.25) {
  const skew = 0.15 * (1 - K_ratio) * (1/Math.sqrt(T))
  const smile = 0.08 * Math.pow(K_ratio - 1, 2)
  const term = -0.03 * Math.log(T + 0.1)
  return Math.max(0.05, baseVol + skew + smile + term)
}

export default function VolSurfacePage() {
  const [baseVol, setBaseVol] = useState(0.25)
  const [spot, setSpot]       = useState(150)

  const smileData = STRIKES.map(k => ({
    strike: `${(k*100).toFixed(0)}%`,
    ...Object.fromEntries(EXPIRIES.map(T => [`${(T*12).toFixed(0)}M`, +(mockIV(k,T,baseVol)*100).toFixed(2)]))
  }))

  const COLORS = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7']

  return (
    <div style={{ padding:'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px' }}>
        <h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Volatility Surface</h1>
        <div style={{ fontSize:13, color:'var(--text2)' }}>IV Smile · Term Structure · Strike vs Expiry Surface</div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:20, marginBottom:20 }}>
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:16 }}>Parameters</div>
          {[['Base Volatility',baseVol,setBaseVol,0.05,1.0,0.01],['Spot Price',spot,setSpot,50,500,1]].map(([l,v,s,mn,mx,step]:any)=>(
            <div key={l as string} style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'var(--text2)', marginBottom:6 }}><span>{l}</span><span style={{ fontFamily:'var(--fm)', color:'var(--accent2)' }}>{Number(v).toFixed(2)}</span></div>
              <input type="range" min={mn} max={mx} step={step} value={v} onChange={e=>s(parseFloat(e.target.value))} style={{ width:'100%', accentColor:'#2d7ff9' }}/>
            </div>
          ))}
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:4 }}>IV Smile by Expiry</div>
          <div style={{ fontSize:11, color:'var(--text2)', marginBottom:16 }}>Implied volatility vs moneyness for each expiry</div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={smileData}>
              <XAxis dataKey="strike" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false}/>
              <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v}%`} width={38}/>
              <Tooltip formatter={(v:any)=>`${Number(v).toFixed(2)}%`} contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }}/>
              <Legend iconType="circle" iconSize={8} formatter={v=><span style={{ fontSize:11, color:'var(--text2)' }}>{v}</span>}/>
              {EXPIRIES.map((T,i)=><Line key={T} type="monotone" dataKey={`${(T*12).toFixed(0)}M`} stroke={COLORS[i]} strokeWidth={1.8} dot={false}/>)}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <SectionHeader title="Surface Data" />
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
        <table className="qd-table">
          <thead><tr><th>Strike / Spot</th>{EXPIRIES.map(T=><th key={T}>{(T*12).toFixed(0)}M</th>)}</tr></thead>
          <tbody>
            {STRIKES.map((k,i)=>(
              <tr key={i}>
                <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color: k===1.0?'var(--accent2)':'var(--text)' }}>{(k*100).toFixed(0)}%</span></td>
                {EXPIRIES.map(T=>{
                  const iv = mockIV(k,T,baseVol)*100
                  return <td key={T}><span style={{ fontFamily:'var(--fm)', fontSize:12, color: iv>35?'var(--red)':iv<20?'var(--green)':'var(--text)' }}>{iv.toFixed(1)}%</span></td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}