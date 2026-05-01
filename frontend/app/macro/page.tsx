'use client'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'
import Badge from '@/components/ui/Badge'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar } from 'recharts'
import { RefreshCw, TrendingUp, TrendingDown, Minus, Globe, Activity } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────
type Snapshot = {
  label: string; ticker: string; value: string; raw: number
  change: number; chgStr: string; up: boolean; history: number[]
}

// ── Asset config ──────────────────────────────────────────────────────────────
const ASSET_GROUPS = [
  {
    group: 'Equities',
    color: '#0dcb7d',
    assets: [
      { label:'S&P 500',    ticker:'SPY',      desc:'US Large Cap' },
      { label:'NASDAQ 100', ticker:'QQQ',      desc:'US Tech' },
      { label:'Russell 2K', ticker:'IWM',      desc:'US Small Cap' },
      { label:'Dow Jones',  ticker:'DIA',      desc:'US Blue Chip' },
    ],
  },
  {
    group: 'Fixed Income',
    color: '#2d7ff9',
    assets: [
      { label:'10Y Treasury', ticker:'^TNX',    desc:'Long duration' },
      { label:'2Y Treasury',  ticker:'^IRX',    desc:'Short duration' },
      { label:'30Y Treasury', ticker:'^TYX',    desc:'Ultra long' },
    ],
  },
  {
    group: 'FX',
    color: '#f0a500',
    assets: [
      { label:'DXY Index', ticker:'DX-Y.NYB', desc:'Dollar strength' },
      { label:'EUR/USD',   ticker:'EURUSD=X', desc:'Euro pair' },
      { label:'GBP/USD',   ticker:'GBPUSD=X', desc:'Sterling pair' },
      { label:'USD/JPY',   ticker:'JPY=X',    desc:'Yen pair' },
    ],
  },
  {
    group: 'Commodities',
    color: '#e05c3a',
    assets: [
      { label:'Gold',    ticker:'GC=F',   desc:'Safe haven' },
      { label:'Silver',  ticker:'SI=F',   desc:'Industrial/precious' },
      { label:'WTI Oil', ticker:'CL=F',   desc:'Crude benchmark' },
      { label:'Copper',  ticker:'HG=F',   desc:'Economic proxy' },
    ],
  },
  {
    group: 'Volatility',
    color: '#f54060',
    assets: [
      { label:'VIX',  ticker:'^VIX',  desc:'Equity fear gauge' },
      { label:'MOVE', ticker:'^MOVE', desc:'Bond vol index' },
    ],
  },
  {
    group: 'Crypto',
    color: '#7c5cfc',
    assets: [
      { label:'Bitcoin',  ticker:'BTC-USD', desc:'Digital gold' },
      { label:'Ethereum', ticker:'ETH-USD', desc:'Smart contracts' },
    ],
  },
]

const ALL_ASSETS = ASSET_GROUPS.flatMap(g => g.assets.map(a => ({ ...a, groupColor: g.color, group: g.group })))
const PERIODS    = [{ label:'1M', value:'1mo' },{ label:'3M', value:'3mo' },{ label:'6M', value:'6mo' },{ label:'1Y', value:'1y' },{ label:'2Y', value:'2y' }]

// ── Helpers ───────────────────────────────────────────────────────────────────
function SparkLine({ data, up, color }: { data: number[]; up: boolean; color: string }) {
  if (!data?.length) return null
  const mn = Math.min(...data), mx = Math.max(...data)
  const pts = data.map((v,i) => `${(i/(data.length-1))*56},${20-((v-mn)/(mx-mn||1))*18}`).join(' ')
  return (
    <svg width="56" height="20" style={{ display:'block' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity={0.8}/>
    </svg>
  )
}

function Tip({ active, payload, label, fmt }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#0b0f17', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#304560', marginBottom:4 }}>{label}</div>
      {payload.map((p:any,i:number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:100 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fmt ? fmt(p.value) : Number(p.value).toFixed(3)}</span>
        </div>
      ))}
    </div>
  )
}

function RegimeIndicator({ snapshots }: { snapshots: Snapshot[] }) {
  const sp500 = snapshots.find(s => s.ticker === 'SPY')
  const vix   = snapshots.find(s => s.ticker === '^VIX')
  const tnx   = snapshots.find(s => s.ticker === '^TNX')
  const dxy   = snapshots.find(s => s.ticker === 'DX-Y.NYB')

  if (!sp500 || !vix) return null

  const riskOn  = sp500.up && vix.raw < 20
  const riskOff = !sp500.up && vix.raw > 25
  const regime  = riskOn ? 'Risk-On' : riskOff ? 'Risk-Off' : 'Neutral'
  const color   = riskOn ? 'var(--green)' : riskOff ? 'var(--red)' : 'var(--amber)'
  const bg      = riskOn ? 'rgba(13,203,125,0.08)' : riskOff ? 'rgba(245,64,96,0.08)' : 'rgba(240,165,0,0.08)'
  const border  = riskOn ? 'rgba(13,203,125,0.2)' : riskOff ? 'rgba(245,64,96,0.2)' : 'rgba(240,165,0,0.2)'

  const indicators = [
    { label:'S&P 500',   value:sp500.chgStr, up:sp500.up },
    { label:'VIX',       value:vix.value,    up:!vix.up, note:vix.raw<20?'Low':'High' },
    { label:'10Y Yield', value:tnx?.value||'—', up:tnx?.up||false },
    { label:'DXY',       value:dxy?.chgStr||'—', up:dxy?.up||false },
  ]

  return (
    <div style={{ background:bg, border:`1px solid ${border}`, borderRadius:14, padding:'16px 20px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background:color, boxShadow:`0 0 10px ${color}` }}/>
          <div>
            <div style={{ fontSize:11, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:2 }}>Market Regime</div>
            <div style={{ fontSize:18, fontWeight:700, color, fontFamily:'var(--fd)' }}>{regime}</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
          {indicators.map(({ label, value, up, note }) => (
            <div key={label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:3 }}>{label}</div>
              <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color:up?'var(--green)':'var(--red)' }}>{value}</div>
              {note && <div style={{ fontSize:9, color:'var(--text3)' }}>{note}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MacroPage() {
  const [snapshots, setSnapshots]   = useState<Snapshot[]>([])
  const [selected, setSelected]     = useState(ALL_ASSETS[8]) // Gold default
  const [chartData, setChartData]   = useState<any[]>([])
  const [loading, setLoading]       = useState(true)
  const [chartLoading, setChartLoading] = useState(false)
  const [period, setPeriod]         = useState('1y')
  const [isMobile, setIsMobile]     = useState(false)
  const [activeGroup, setActiveGroup] = useState<string|null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadSnapshot = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const r = await api.market.snapshot()
      setSnapshots(r.data || [])
      setLastUpdated(new Date())
    } finally {
      setLoading(false); setRefreshing(false)
    }
  }, [])

  const loadChart = useCallback(async () => {
    setChartLoading(true)
    try {
      const r    = await api.market.prices(selected.ticker, period)
      const data = (r.data || []).map((d:any) => ({
        date:   d.date,
        value:  d.close,
        volume: d.volume,
        high:   d.high,
        low:    d.low,
      }))
      setChartData(data)
    } catch { setChartData([]) }
    finally { setChartLoading(false) }
  }, [selected, period])

  useEffect(() => { loadSnapshot() }, [])
  useEffect(() => { loadChart() }, [loadChart])

  // Find snapshot for selected asset
  const selectedSnap = snapshots.find(s => s.ticker === selected.ticker)

  // Filter snapshots by active group
  const displayedSnaps = snapshots

  // Get color for selected asset
  const selectedColor = selected.groupColor || '#2d7ff9'

  // Calculate chart stats
  const chartStats = chartData.length > 1 ? (() => {
    const first = chartData[0].value, last = chartData[chartData.length-1].value
    const pct = ((last - first) / first) * 100
    const high = Math.max(...chartData.map((d:any) => d.value))
    const low  = Math.min(...chartData.map((d:any) => d.value))
    return { pct, high, low, first, last }
  })() : null

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'rgba(45,127,249,0.12)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Globe size={16} color="var(--accent2)" strokeWidth={1.5}/>
          </div>
          <div>
            <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:3 }}>Macro Dashboard</h1>
            <div style={{ fontSize:12, color:'var(--text3)' }}>
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Rates · FX · Commodities · Vol · Crypto'}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={()=>loadSnapshot(true)} disabled={refreshing} style={{ padding:'7px 12px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--b1)', color:'var(--text2)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
            <RefreshCw size={12} style={{ animation:refreshing?'spin 0.8s linear infinite':'none' }}/> Refresh
          </button>
          <Badge variant="green" dot>Live Data</Badge>
        </div>
      </div>

      {/* Regime indicator */}
      {snapshots.length > 0 && <RegimeIndicator snapshots={snapshots}/>}

      {/* Snapshot grid */}
      {loading ? (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {[1,2,3,4,5,6,7,8].map(i=><div key={i} style={{ height:100, borderRadius:12 }} className="skeleton"/>)}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:20 }}>
          {displayedSnaps.map((s,i) => {
            const asset    = ALL_ASSETS.find(a => a.ticker === s.ticker)
            const color    = asset?.groupColor || '#2d7ff9'
            const isActive = selected.ticker === s.ticker

            return (
              <div key={i} onClick={()=>{ const a = ALL_ASSETS.find(x=>x.ticker===s.ticker); if(a) setSelected(a) }}
                style={{ background:'var(--bg2)', border:`1px solid ${isActive?color+'44':'var(--b1)'}`, borderRadius:12, padding:'14px 16px', cursor:'pointer', transition:'all 0.15s', position:'relative', overflow:'hidden' }}>
                {isActive && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${color},transparent)` }}/>}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                  <div style={{ fontSize:9, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'1px', flex:1 }}>{s.label}</div>
                  <SparkLine data={s.history} up={s.up} color={s.up?'var(--green)':'var(--red)'}/>
                </div>
                <div style={{ fontFamily:'var(--fm)', fontSize: isMobile?15:19, fontWeight:300, marginBottom:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.value}</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:3, padding:'2px 7px', borderRadius:4, fontSize:10.5, fontWeight:700, color:s.up?'var(--green)':'var(--red)', background:s.up?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)' }}>
                  {s.up?'▲':'▼'} {s.chgStr}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Two-column layout */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'220px 1fr', gap:16 }}>

        {/* Left — asset selector */}
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'14px 12px', height:'fit-content' }}>
          <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:12, paddingLeft:6 }}>Assets</div>
          {ASSET_GROUPS.map(group => (
            <div key={group.group} style={{ marginBottom:8 }}>
              <div style={{ fontSize:9, color:'var(--text4)', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.2px', padding:'6px 6px 4px', display:'flex', alignItems:'center', gap:6 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background:group.color }}/>
                {group.group}
              </div>
              {group.assets.map(asset => {
                const snap    = snapshots.find(s => s.ticker === asset.ticker)
                const isActive = selected.ticker === asset.ticker
                return (
                  <button key={asset.ticker} onClick={()=>setSelected({ ...asset, groupColor:group.color, group:group.group })} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'7px 8px', borderRadius:7, marginBottom:1, border:`1px solid ${isActive?group.color+'33':'transparent'}`, background:isActive?group.color+'12':'transparent', color:isActive?group.color:'var(--text2)', fontSize:12, fontWeight:isActive?600:400, cursor:'pointer', transition:'all 0.12s', textAlign:'left' }}>
                    <span>{asset.label}</span>
                    {snap && (
                      <span style={{ fontFamily:'var(--fm)', fontSize:10.5, color:snap.up?'var(--green)':'var(--red)', fontWeight:600 }}>
                        {snap.up?'+':''}{snap.change.toFixed(2)}%
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Right — chart + details */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Chart header */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:4 }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700 }}>{selected.label}</div>
                  {selectedSnap && (
                    <div style={{ padding:'3px 10px', borderRadius:20, background:selectedSnap.up?'rgba(13,203,125,0.1)':'rgba(245,64,96,0.1)', border:`1px solid ${selectedSnap.up?'rgba(13,203,125,0.2)':'rgba(245,64,96,0.2)'}`, color:selectedSnap.up?'var(--green)':'var(--red)', fontSize:12, fontWeight:700, display:'flex', alignItems:'center', gap:4 }}>
                      {selectedSnap.up?<TrendingUp size={11}/>:<TrendingDown size={11}/>} {selectedSnap.chgStr}
                    </div>
                  )}
                </div>
                <div style={{ fontSize:12, color:'var(--text3)' }}>{selected.desc} · {selected.group}</div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {selectedSnap && (
                  <div style={{ fontFamily:'var(--fm)', fontSize:24, fontWeight:300, color:'var(--text)' }}>{selectedSnap.value}</div>
                )}
              </div>
            </div>

            {/* Period selector */}
            <div style={{ display:'flex', gap:4, marginBottom:16 }}>
              {PERIODS.map(p => (
                <button key={p.value} onClick={()=>setPeriod(p.value)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${period===p.value?'rgba(45,127,249,0.3)':'var(--b1)'}`, background:period===p.value?'rgba(45,127,249,0.1)':'transparent', color:period===p.value?'var(--accent2)':'var(--text2)', fontSize:11.5, cursor:'pointer', fontWeight:period===p.value?600:400, transition:'all 0.12s' }}>{p.label}</button>
              ))}
            </div>

            {/* Chart stats */}
            {chartStats && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8, marginBottom:16 }}>
                {[
                  { label:`${period} Return`, value:`${chartStats.pct>=0?'+':''}${chartStats.pct.toFixed(2)}%`, color:chartStats.pct>=0?'var(--green)':'var(--red)' },
                  { label:'Period High', value:chartStats.high.toFixed(2), color:'var(--green)' },
                  { label:'Period Low',  value:chartStats.low.toFixed(2),  color:'var(--red)' },
                  { label:'Start Price', value:chartStats.first.toFixed(2), color:'var(--text2)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg3)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:9.5, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:5 }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:15, fontWeight:300, color }}>{value}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Main chart */}
            {chartLoading ? (
              <div style={{ height: isMobile?180:260, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <div style={{ width:28, height:28, borderRadius:'50%', border:'2px solid var(--bg4)', borderTop:`2px solid ${selectedColor}`, animation:'spin 0.8s linear infinite' }}/>
              </div>
            ) : chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={isMobile?180:260}>
                <AreaChart data={chartData} margin={{ top:5, right:0, bottom:0, left:0 }}>
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={selectedColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={selectedColor} stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                  <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} width={55} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(1)}k`:v.toFixed(2)}/>
                  <Tooltip content={<Tip fmt={(v:number)=>v.toFixed(2)}/>}/>
                  <Area type="monotone" dataKey="value" name={selected.label} stroke={selectedColor} strokeWidth={2} fill="url(#chartGrad)" dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height:260, display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text3)', fontSize:13 }}>No chart data available</div>
            )}
          </div>

          {/* Cross-asset heatmap */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <Activity size={14} color="var(--accent2)" strokeWidth={1.5}/> Cross-Asset Performance
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:8 }}>
              {snapshots.map((s,i) => {
                const intensity = Math.min(Math.abs(s.change) / 3, 1)
                const bg        = s.up ? `rgba(13,203,125,${0.06+intensity*0.18})` : `rgba(245,64,96,${0.06+intensity*0.18})`
                const border    = s.up ? `rgba(13,203,125,${0.1+intensity*0.2})` : `rgba(245,64,96,${0.1+intensity*0.2})`
                return (
                  <div key={i} onClick={()=>{ const a=ALL_ASSETS.find(x=>x.ticker===s.ticker); if(a) setSelected(a) }}
                    style={{ background:bg, border:`1px solid ${border}`, borderRadius:9, padding:'10px 12px', cursor:'pointer', transition:'all 0.15s' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', marginBottom:4, fontWeight:500 }}>{s.label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:14, fontWeight:600, color:s.up?'var(--green)':'var(--red)' }}>
                      {s.up?'+':''}{s.change.toFixed(2)}%
                    </div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:10.5, color:'var(--text3)', marginTop:2 }}>{s.value}</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Yield curve proxy */}
          {(() => {
            const y2  = snapshots.find(s=>s.ticker==='^IRX')
            const y10 = snapshots.find(s=>s.ticker==='^TNX')
            const y30 = snapshots.find(s=>s.ticker==='^TYX')
            if (!y2 && !y10) return null
            const spread = y10 && y2 ? y10.raw - y2.raw : null
            const inverted = spread !== null && spread < 0
            const yieldData = [
              { tenor:'2Y',  yield:y2?.raw||0 },
              { tenor:'10Y', yield:y10?.raw||0 },
              { tenor:'30Y', yield:y30?.raw||0 },
            ].filter(d=>d.yield>0)

            return (
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
                  <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700 }}>Yield Curve</div>
                  {spread !== null && (
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ fontSize:11, color:'var(--text3)' }}>2s10s Spread:</div>
                      <div style={{ fontFamily:'var(--fm)', fontSize:13, fontWeight:600, color:inverted?'var(--red)':'var(--green)' }}>
                        {spread>=0?'+':''}{spread.toFixed(2)}%
                      </div>
                      {inverted && <div style={{ padding:'2px 8px', borderRadius:4, background:'rgba(245,64,96,0.1)', border:'1px solid rgba(245,64,96,0.2)', fontSize:10, color:'var(--red)', fontWeight:600 }}>Inverted</div>}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', alignItems:'flex-end', gap:16, height:80 }}>
                  {yieldData.map(({ tenor, yield: y }) => {
                    const maxY = Math.max(...yieldData.map(d=>d.yield))
                    const h    = Math.max(12, (y/maxY)*72)
                    return (
                      <div key={tenor} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:5 }}>
                        <div style={{ fontFamily:'var(--fm)', fontSize:11, color:'var(--text2)' }}>{y.toFixed(2)}%</div>
                        <div style={{ width:'100%', height:h, background:inverted?'rgba(245,64,96,0.3)':'rgba(45,127,249,0.3)', border:`1px solid ${inverted?'rgba(245,64,96,0.4)':'rgba(45,127,249,0.4)'}`, borderRadius:'4px 4px 0 0', transition:'height 0.4s ease' }}/>
                        <div style={{ fontSize:10, color:'var(--text3)' }}>{tenor}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()}
        </div>
      </div>
    </div>
  )
}
