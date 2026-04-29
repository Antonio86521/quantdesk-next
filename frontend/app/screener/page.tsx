'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'

export default function ScreenerPage() {
  const [tickers, setTickers] = useState('AAPL,MSFT,NVDA,GOOGL,AMZN,META,TSLA,JPM,V,JNJ,XOM,WMT,UNH,MA,HD')
  const [period, setPeriod]   = useState('3mo')
  const [data, setData]       = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [sort, setSort]       = useState<{key:string;dir:1|-1}>({ key:'periodReturn', dir:-1 })
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const run = async () => {
    setLoading(true)
    try { const r = await api.screener(tickers, period); setData(r.data||[]) }
    catch {}
    finally { setLoading(false) }
  }

  const sorted = [...data].sort((a,b) => ((a[sort.key]||0)-(b[sort.key]||0))*sort.dir)
  const toggleSort = (key: string) => setSort(s => s.key===key ? { key, dir: s.dir===1?-1:1 } : { key, dir:-1 })
  const rsiColor = (v: number|null) => v==null?'var(--text2)':v>70?'var(--red)':v<30?'var(--green)':'var(--text)'
  const signalBadge = (signals: string[]) => {
    if (signals.includes('Oversold'))  return <Badge variant="green">Oversold</Badge>
    if (signals.includes('Overbought')) return <Badge variant="red">Overbought</Badge>
    if (signals.includes('Above SMA20') && signals.includes('Above SMA50')) return <Badge variant="blue">Bullish</Badge>
    return <Badge variant="ghost">Neutral</Badge>
  }

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px' }}>
        <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Stock Screener</h1>
        <div style={{ fontSize:13, color:'var(--text2)' }}>Multi-ticker signals · RSI · Momentum · Moving averages · Volume</div>
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        {/* Stack vertically on mobile */}
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto auto', gap:12, alignItems:'flex-end' }}>
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Tickers (comma-separated)</div>
            <input className="qd-input" value={tickers} onChange={e=>setTickers(e.target.value)} placeholder="AAPL,MSFT,NVDA..."/>
          </div>
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Period</div>
            <select className="qd-select" value={period} onChange={e=>setPeriod(e.target.value)}>
              {['1mo','3mo','6mo','1y'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <button onClick={run} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            {loading?<><span style={{ width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>Scanning...</>:'Run Screener'}
          </button>
        </div>
      </div>

      {!data.length && !loading && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>🔍</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Screener Ready</div>
          <div style={{ fontSize:13, color:'var(--text2)', maxWidth:400, margin:'0 auto' }}>Add your tickers and run the screener to see RSI signals, momentum, SMA crossovers and more.</div>
        </div>
      )}

      {sorted.length > 0 && (
        <>
          <SectionHeader title={`Results — ${sorted.length} securities`} />
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, overflow:'hidden' }}>
            {/* Always horizontally scrollable on mobile */}
            <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
              <table className="qd-table" style={{ minWidth: isMobile ? 620 : 'auto' }}>
                <thead>
                  <tr>
                    {[['Ticker','ticker'],['Price','price'],['Return %','periodReturn'],['Ann. Vol','annVol'],['RSI 14','rsi14'],['SMA 20','sma20'],['SMA 50','sma50'],['Signal','signals']].map(([l,k])=>(
                      <th key={k} onClick={()=>k!=='signals'&&toggleSort(k)} style={{ cursor:k!=='signals'?'pointer':'default', userSelect:'none' }}>
                        {l} {sort.key===k?(sort.dir===-1?'↓':'↑'):''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((r,i)=>(
                    <tr key={i}>
                      <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:'var(--accent2)' }}>{r.ticker}</span></td>
                      <td><span className="mono">${r.price?.toFixed(2)}</span></td>
                      <td><span className="mono" style={{ color:r.periodReturn>=0?'var(--green)':'var(--red)' }}>{r.periodReturn>=0?'+':''}{r.periodReturn?.toFixed(2)}%</span></td>
                      <td><span className="mono">{r.annVol?.toFixed(1)}%</span></td>
                      <td><span className="mono" style={{ color:rsiColor(r.rsi14) }}>{r.rsi14?.toFixed(1)||'—'}</span></td>
                      <td><span className="mono" style={{ color: r.price>r.sma20?'var(--green)':'var(--red)' }}>${r.sma20?.toFixed(2)||'—'}</span></td>
                      <td><span className="mono" style={{ color: r.price>r.sma50?'var(--green)':'var(--red)' }}>${r.sma50?.toFixed(2)||'—'}</span></td>
                      <td>{signalBadge(r.signals||[])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
