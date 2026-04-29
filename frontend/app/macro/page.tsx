'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
    <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
    {payload.map((p:any,i:number) => <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8 }}><span>{p.name}</span><span style={{ fontFamily:'var(--fm)' }}>{fn?fn(p.value):p.value?.toFixed(3)}</span></div>)}
  </div>
}

const MACRO_ASSETS = [
  { label:'10Y Treasury', ticker:'^TNX',     category:'Rates',  color:'#2d7ff9' },
  { label:'2Y Treasury',  ticker:'^IRX',     category:'Rates',  color:'#5ba3f5' },
  { label:'DXY Index',    ticker:'DX-Y.NYB', category:'FX',     color:'#f0a500' },
  { label:'EUR/USD',      ticker:'EURUSD=X', category:'FX',     color:'#00c9a7' },
  { label:'Gold',         ticker:'GC=F',     category:'Commod', color:'#f0a500' },
  { label:'WTI Oil',      ticker:'CL=F',     category:'Commod', color:'#e05c3a' },
  { label:'VIX',          ticker:'^VIX',     category:'Vol',    color:'#f54060' },
  { label:'S&P 500',      ticker:'SPY',      category:'Equity', color:'#0dcb7d' },
]

export default function MacroPage() {
  const [snapshots, setSnapshots] = useState<any[]>([])
  const [selected, setSelected]   = useState(MACRO_ASSETS[0])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [period, setPeriod]       = useState('1y')
  const [isMobile, setIsMobile]   = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => { loadSnapshot() }, [])
  useEffect(() => { if (selected) loadChart() }, [selected, period])

  const loadSnapshot = async () => {
    const r = await api.market.snapshot()
    setSnapshots(r.data || [])
    setLoading(false)
  }

  const loadChart = async () => {
    try {
      const r = await api.market.prices(selected.ticker, period)
      setChartData(r.data?.map((d:any) => ({ date: d.date, value: d.close })) || [])
    } catch { setChartData([]) }
  }

  return (
    <div style={{ padding: isMobile ? '0 14px 80px' : '0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Macro Dashboard</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Rates · FX · Commodities · Volatility · Equity Indices</div>
        </div>
        <Badge variant="green" dot>Live Data</Badge>
      </div>

      {/* Asset grid — 2-col mobile, 4-col desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {snapshots.map((s,i) => (
          <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--b2)'}}
            onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.borderColor='var(--b1)'}}
          >
            <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:8 }}>{s.label}</div>
            <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?16:20, fontWeight:300, marginBottom:7, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.value}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4, fontSize:10.5, fontWeight:700, color:s.up?'var(--green)':'var(--red)', background:s.up?'rgba(13,203,125,0.12)':'rgba(245,64,96,0.12)' }}>
              {s.up?'▲':'▼'} {s.chgStr}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <SectionHeader title="Price Chart" action={
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {['3mo','6mo','1y','2y'].map(p=>(
            <button key={p} onClick={()=>setPeriod(p)} style={{ padding:'4px 10px', borderRadius:6, border:`1px solid ${period===p?'rgba(45,127,249,0.3)':'var(--b1)'}`, background:period===p?'var(--accent3)':'transparent', color:period===p?'var(--accent2)':'var(--text2)', fontSize:11.5, cursor:'pointer' }}>{p}</button>
          ))}
        </div>
      }/>

      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '160px 1fr', gap:16 }}>
        {/* Asset selector — horizontal scroll on mobile */}
        <div style={{ display:'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 6 : 0, overflowX: isMobile ? 'auto' : 'visible', paddingBottom: isMobile ? 4 : 0 }}>
          {MACRO_ASSETS.map(a => (
            <button key={a.ticker} onClick={()=>setSelected(a)} style={{ display:'block', flexShrink:0, padding:'9px 12px', borderRadius:8, marginBottom: isMobile ? 0 : 4, border:`1px solid ${selected.ticker===a.ticker?'rgba(45,127,249,0.3)':'transparent'}`, background:selected.ticker===a.ticker?'var(--accent3)':'transparent', color:selected.ticker===a.ticker?'var(--accent2)':'var(--text2)', fontSize:12, fontWeight:selected.ticker===a.ticker?600:400, cursor:'pointer', textAlign:'left', transition:'all 0.14s', whiteSpace:'nowrap' }}>
              {a.label}
            </button>
          ))}
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>{selected.label}</div>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={isMobile ? 200 : 280}>
              <AreaChart data={chartData}>
                <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={selected.color} stopOpacity={0.15}/><stop offset="95%" stopColor={selected.color} stopOpacity={0.01}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} width={50}/>
                <Tooltip content={<Tip fn={(v:number)=>v.toFixed(2)}/>}/>
                <Area type="monotone" dataKey="value" name={selected.label} stroke={selected.color} strokeWidth={2} fill="url(#mg)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : <div style={{ height: isMobile?200:280, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)' }}>Loading chart data...</div>}
        </div>
      </div>
    </div>
  )
}
