'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'

export default function MarketPage() {
  const [data, setData]   = useState<any[]>([])
  const [watch, setWatch] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    Promise.all([api.market.snapshot(), api.market.watchlist('AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,JNJ,XOM,WMT,UNH,NFLX,ADBE')])
      .then(([s,w]) => { setData(s.data||[]); setWatch(w.data||[]) })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Market Overview</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Live cross-asset snapshot · Sectors · Major indices</div>
        </div>
        <Badge variant="green" dot>Live</Badge>
      </div>

      <SectionHeader title="Cross-Asset Snapshot" />
      {/* 2-col on mobile, 4-col on desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10, marginBottom:24 }}>
        {loading ? [...Array(8)].map((_,i)=><div key={i} style={{ height:90, borderRadius:12 }} className="skeleton"/>) :
          data.map((m,i) => (
            <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:13, padding:'15px 17px', transition:'all 0.15s' }}
              onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--b2)';(e.currentTarget as HTMLElement).style.transform='translateY(-1px)'}}
              onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--b1)';(e.currentTarget as HTMLElement).style.transform='translateY(0)'}}
            >
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8, fontWeight:700 }}>{m.label}</div>
              <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?16:21, fontWeight:300, marginBottom:7, letterSpacing:'-0.5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.value}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 8px', borderRadius:4, fontSize:10.5, fontWeight:700, color:m.up?'var(--green)':'var(--red)', background:m.up?'rgba(13,203,125,0.12)':'rgba(245,64,96,0.12)' }}>
                {m.up?'▲':'▼'} {m.chgStr}
              </div>
            </div>
          ))
        }
      </div>

      <SectionHeader title="Equities Watchlist" />
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
        <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
          <table className="qd-table">
            <thead><tr><th>Ticker</th><th>Price</th><th>Change</th><th>Direction</th></tr></thead>
            <tbody>
              {loading ? [...Array(6)].map((_,i)=><tr key={i}><td colSpan={4}><div style={{ height:32, borderRadius:4 }} className="skeleton"/></td></tr>) :
                watch.map((w,i) => (
                  <tr key={i}>
                    <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:'var(--accent2)' }}>{w.ticker}</span></td>
                    <td><span className="mono">${w.price?.toFixed(2)}</span></td>
                    <td><span className="mono" style={{ color:w.up?'var(--green)':'var(--red)' }}>{w.chgStr}</span></td>
                    <td><span style={{ fontSize:16 }}>{w.up?'▲':'▼'}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}