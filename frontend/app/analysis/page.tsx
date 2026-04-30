'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, RefreshCw, Download, ChevronDown, ChevronUp, BarChart3, AlertTriangle, BookOpen } from 'lucide-react'

type SavedEntry = {
  id: number; name: string; date: string; tickers: string; shares: string
  buyPrices: string; period: string; benchmark: string; note: string; tag: string
}

const SAVED: SavedEntry[] = [
  { id:1, name:'Q1 2026 — Core Growth',  date:'2026-03-31', tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'1y',  benchmark:'SPY', note:'Quarterly review. Strong tech performance driven by AI wave.', tag:'quarterly' },
  { id:2, name:'April Risk Check',        date:'2026-04-15', tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'6mo', benchmark:'SPY', note:'Mid-month risk review. VaR within limits, beta slightly elevated.', tag:'risk' },
  { id:3, name:'Tech Momentum Portfolio', date:'2026-03-01', tickers:'NVDA,META,TSLA,PLTR',       shares:'30,20,40,200',  buyPrices:'650,280,210,25',      period:'6mo', benchmark:'QQQ', note:'High beta tech portfolio. Strong momentum but concentrated.', tag:'research' },
]

const COLORS = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7']

function fmtPct(v: any)     { return v==null?'—':`${(v*100).toFixed(2)}%` }
function fmtPctPlus(v: any) { return v==null?'—':`${v>=0?'+':''}${(v*100).toFixed(2)}%` }
function fmtNum(v: any,d=2) { return v==null?'—':Number(v).toFixed(d) }
function fmtDollar(v: any)  { return v==null?'—':v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${v.toLocaleString('en',{maximumFractionDigits:0})}`:`$${Number(v).toFixed(2)}` }

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
    <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
    {payload.map((p:any,i:number) => <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:120 }}><span>{p.name}</span><span style={{ fontFamily:'var(--fm)' }}>{fn?fn(p.value):Number(p.value).toFixed(4)}</span></div>)}
  </div>
}

function AnalysisPanel({ entry, onClose, isMobile }: { entry: SavedEntry; onClose: () => void; isMobile: boolean }) {
  const [data, setData]     = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]       = useState<'overview'|'performance'|'risk'|'holdings'>('overview')

  useEffect(() => {
    api.portfolio.analytics({ tickers:entry.tickers, shares:entry.shares, buyPrices:entry.buyPrices, period:entry.period, benchmark:entry.benchmark })
      .then(setData).finally(() => setLoading(false))
  }, [entry])

  const s = data?.summary

  return (
    <div style={{ marginTop:16, background:'var(--bg3)', border:'1px solid var(--b2)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <BarChart3 size={15} color="var(--accent2)" />
          <span style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>{entry.name}</span>
          {loading && <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}><RefreshCw size={10} style={{ animation:'spin 1s linear infinite' }}/> Loading...</span>}
          {data && <Badge variant="green" dot>Live</Badge>}
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:18, lineHeight:1 }}>×</button>
      </div>

      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>
          <div style={{ fontSize:28, marginBottom:12, opacity:0.4 }}>📊</div>
          <div>Fetching data from Python backend...</div>
        </div>
      )}

      {data && s && (
        <div style={{ padding:'16px 20px' }}>
          {/* Tabs — scrollable on mobile */}
          <div style={{ display:'flex', gap:3, marginBottom:16, background:'var(--bg5)', border:'1px solid var(--b1)', borderRadius:8, padding:3, overflowX:'auto' }}>
            {(['overview','performance','risk','holdings'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding: isMobile?'6px 12px':'6px 16px', borderRadius:6, border:'none', cursor:'pointer', background:tab===t?'var(--bg2)':'transparent', color:tab===t?'var(--text)':'var(--text2)', fontSize:11.5, fontWeight:tab===t?600:400, transition:'all 0.14s', textTransform:'capitalize', boxShadow:tab===t?'0 2px 6px rgba(0,0,0,0.25)':'none', whiteSpace:'nowrap' }}>{t}</button>
            ))}
          </div>

          {tab==='overview' && (<>
            {/* 2-col on mobile, 4-col on desktop */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:14 }}>
              <MetricCard label="Portfolio Value" value={fmtDollar(s.totalValue)}    delta={`${fmtPctPlus(s.unrealisedPnl/s.totalCost)} on cost`} deltaUp={s.unrealisedPnl>=0}/>
              <MetricCard label="Total Return"    value={fmtPctPlus(s.totalReturn)}  delta={`${entry.period} period`} deltaUp={s.totalReturn>=0}/>
              <MetricCard label="Sharpe Ratio"    value={fmtNum(s.sharpe)}           delta={s.sharpe>1?'Above threshold':'Below threshold'} deltaUp={s.sharpe>1}/>
              <MetricCard label="Max Drawdown"    value={fmtPct(s.maxDrawdown)}      delta="Peak to trough" deltaUp={false}/>
            </div>

            {entry.note && (
              <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:10, padding:'12px 16px', marginBottom:14, display:'flex', gap:10 }}>
                <BookOpen size={14} color="var(--accent2)" style={{ flexShrink:0, marginTop:1 }}/>
                <div>
                  <div style={{ fontSize:10.5, color:'var(--accent2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:3 }}>Analyst Note</div>
                  <div style={{ fontSize:12.5, color:'var(--text2)', lineHeight:1.6 }}>{entry.note}</div>
                </div>
              </div>
            )}

            {/* Stats — stacked on mobile, side-by-side on desktop */}
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
              {[
                [['Ann. Return',fmtPctPlus(s.annReturn),s.annReturn>=0],['Ann. Volatility',fmtPct(s.annVol),null],['Sortino Ratio',fmtNum(s.sortino),s.sortino>1],['Calmar Ratio',fmtNum(s.calmar),s.calmar>1],['Beta',fmtNum(s.beta),null],['Alpha (Ann.)',fmtPctPlus(s.alpha),s.alpha>0]],
                [['VaR 95%',fmtPct(s.histVar95),false],['CVaR 95%',fmtPct(s.histCVar95),false],['Omega Ratio',fmtNum(s.omega),s.omega>1],['R² vs Benchmark',fmtNum(s.r2,3),null],['Tracking Error',fmtPct(s.trackingError),null],['Info Ratio',fmtNum(s.infoRatio),s.infoRatio>0]],
              ].map((col, ci) => (
                <div key={ci}>
                  {col.map(([l,v,up]:any, i) => (
                    <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none' }}>
                      <span style={{ fontSize:12.5, color:'var(--text2)' }}>{l}</span>
                      <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color:up===true?'var(--green)':up===false?'var(--red)':'var(--text)' }}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>)}

          {tab==='performance' && (
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 18px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:14 }}>Growth of $1 vs {entry.benchmark}</div>
                <ResponsiveContainer width="100%" height={isMobile?180:220}>
                  <AreaChart data={data.charts.performance}>
                    <defs><linearGradient id={`ag${entry.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2d7ff9" stopOpacity={0.15}/><stop offset="95%" stopColor="#2d7ff9" stopOpacity={0.01}/></linearGradient></defs>
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(2)}x`} width={45}/>
                    <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(3)}x`}/>}/>
                    <ReferenceLine y={1} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3"/>
                    <Area type="monotone" dataKey="value" name="Portfolio" stroke="#2d7ff9" strokeWidth={2} fill={`url(#ag${entry.id})`} dot={false}/>
                    {data.charts.benchmark?.length>0 && <Line type="monotone" data={data.charts.benchmark} dataKey="value" name={entry.benchmark} stroke="#344d68" strokeWidth={1.4} dot={false} strokeDasharray="4 3"/>}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 18px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:14 }}>Drawdown</div>
                <ResponsiveContainer width="100%" height={isMobile?140:160}>
                  <AreaChart data={data.charts.drawdown?.map((d:any)=>({...d,value:d.value*100}))}>
                    <defs><linearGradient id={`dd${entry.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f54060" stopOpacity={0.2}/><stop offset="95%" stopColor="#f54060" stopOpacity={0.01}/></linearGradient></defs>
                    <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                    <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`} width={38}/>
                    <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
                    <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                    <Area type="monotone" dataKey="value" name="Drawdown" stroke="#f54060" strokeWidth={1.5} fill={`url(#dd${entry.id})`} dot={false}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tab==='risk' && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap:10 }}>
                <MetricCard label="VaR 95%"  value={fmtPct(s.histVar95)}  delta="Historical daily" deltaUp={false} accent="#f54060"/>
                <MetricCard label="CVaR 95%" value={fmtPct(s.histCVar95)} delta="Expected shortfall" deltaUp={false} accent="#f54060"/>
                <MetricCard label="Ann. Vol" value={fmtPct(s.annVol)}     delta="Realised volatility"/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { cond:s.beta>1.2,        msg:`High market beta (${fmtNum(s.beta)}) — portfolio more volatile than market`, sev:'warn' },
                  { cond:s.sharpe<0.5,      msg:`Low Sharpe ratio (${fmtNum(s.sharpe)}) — poor risk-adjusted return`, sev:'warn' },
                  { cond:s.maxDrawdown<-0.2, msg:`Significant drawdown (${fmtPct(s.maxDrawdown)}) — consider stop-loss levels`, sev:'warn' },
                  { cond:s.sharpe>1.5,      msg:`Excellent Sharpe ratio (${fmtNum(s.sharpe)}) — strong risk-adjusted performance`, sev:'ok' },
                  { cond:s.alpha>0.05,      msg:`Strong alpha generation (${fmtPctPlus(s.alpha)}) — outperforming benchmark`, sev:'ok' },
                ].filter(x=>x.cond).map(({ msg, sev },i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:9, background:sev==='warn'?'rgba(240,165,0,0.08)':'rgba(13,203,125,0.08)', border:`1px solid ${sev==='warn'?'rgba(240,165,0,0.2)':'rgba(13,203,125,0.2)'}` }}>
                    <AlertTriangle size={13} color={sev==='warn'?'var(--amber)':'var(--green)'}/>
                    <span style={{ fontSize:12.5, color:sev==='warn'?'var(--amber)':'var(--green)' }}>{msg}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==='holdings' && (
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr', gap:14 }}>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden' }}>
                <div style={{ overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
                  <table className="qd-table" style={{ minWidth: isMobile?400:'auto' }}>
                    <thead><tr><th>Ticker</th><th>Weight</th><th>P&L</th><th>Return</th></tr></thead>
                    <tbody>
                      {data.holdings?.map((h:any,i:number) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:COLORS[i%COLORS.length] }}>{h.ticker}</span></td>
                          <td><span className="mono" style={{ fontSize:11 }}>{(h.weight*100).toFixed(1)}%</span></td>
                          <td><span className="mono" style={{ color:h.unrealisedPnl>=0?'var(--green)':'var(--red)' }}>{h.unrealisedPnl>=0?'+':''}{fmtDollar(h.unrealisedPnl)}</span></td>
                          <td><span className="mono" style={{ color:h.periodReturn>=0?'var(--green)':'var(--red)' }}>{fmtPctPlus(h.periodReturn)}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:12, padding:'14px 16px' }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:12 }}>Allocation</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={data.holdings?.map((h:any)=>({ name:h.ticker, value:h.weight*100 }))} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                      {data.holdings?.map((_:any,i:number) => <Cell key={i} fill={COLORS[i%COLORS.length]} stroke="var(--bg2)" strokeWidth={2}/>)}
                    </Pie>
                    <Tooltip formatter={(v:any)=>`${Number(v).toFixed(1)}%`} contentStyle={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:11 }}/>
                    <Legend iconType="circle" iconSize={7} formatter={v=><span style={{ fontSize:10.5, color:'var(--text2)' }}>{v}</span>}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div style={{ display:'flex', gap:8, marginTop:16, paddingTop:14, borderTop:'1px solid var(--b1)', flexWrap:'wrap' }}>
            <Link href={`/portfolio?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buyPrices}&period=${entry.period}&benchmark=${entry.benchmark}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', color:'var(--accent2)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>
              <TrendingUp size={13}/> Full Analytics
            </Link>
            <Link href={`/risk?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buyPrices}&period=${entry.period}&benchmark=${entry.benchmark}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', color:'var(--red)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>
              Risk Details
            </Link>
            <Link href={`/reports?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buyPrices}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'var(--bg4)', border:'1px solid var(--b2)', color:'var(--text2)', fontSize:12.5, fontWeight:500, textDecoration:'none' }}>
              <Download size={12}/> Export
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AnalysisPage() {
  const [saved]         = useState<SavedEntry[]>(SAVED)
  const [open, setOpen] = useState<number|null>(null)
  const [search, setSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const filtered = saved.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.tag.toLowerCase().includes(search.toLowerCase()) ||
    s.tickers.toLowerCase().includes(search.toLowerCase())
  )

  const tagVariant = (tag: string) =>
    tag==='quarterly'?'blue':tag==='risk'?'red':tag==='research'?'purple':'ghost'

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Saved Analysis</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Saved portfolio snapshots · Live data reload · Export</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:12, marginBottom:22, alignItems:'center', flexWrap:'wrap' }}>
        <input className="qd-input" placeholder="Search by name, tag or ticker..." value={search} onChange={e=>setSearch(e.target.value)} style={{ maxWidth:380 }}/>
        <span style={{ fontSize:12, color:'var(--text3)' }}>{filtered.length} entries</span>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(entry => (
          <div key={entry.id}>
            <div style={{ background:'var(--bg2)', border:`1px solid ${open===entry.id?'rgba(45,127,249,0.25)':'var(--b1)'}`, borderRadius:14, padding:'18px 22px', transition:'border-color 0.15s' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap: isMobile?'wrap':'nowrap' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                    <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700 }}>{entry.name}</div>
                    <Badge variant={tagVariant(entry.tag) as any}>{entry.tag}</Badge>
                  </div>
                  <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>{entry.date} · {entry.period} · Benchmark: {entry.benchmark}</div>
                  <div style={{ fontSize:12.5, color:'var(--text2)', marginBottom:10, lineHeight:1.55 }}>{entry.note}</div>
                  <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--fm)' }}>
                    {entry.tickers.split(',').map((t,i) => (
                      <span key={i} style={{ display:'inline-block', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:4, padding:'1px 7px', marginRight:5, marginBottom:3, color:'var(--text2)' }}>{t}</span>
                    ))}
                  </div>
                </div>

                <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'flex-start', flexWrap:'wrap' }}>
                  {!isMobile && (
                    <Link href={`/portfolio?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buyPrices}&period=${entry.period}&benchmark=${entry.benchmark}`}
                      style={{ padding:'7px 14px', borderRadius:8, background:'rgba(45,127,249,0.08)', border:'1px solid rgba(45,127,249,0.2)', color:'var(--accent2)', fontSize:12, fontWeight:600, textDecoration:'none', whiteSpace:'nowrap' }}>
                      Open Full →
                    </Link>
                  )}
                  <button onClick={()=>setOpen(open===entry.id?null:entry.id)} style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px', borderRadius:8, background:open===entry.id?'rgba(45,127,249,0.1)':'var(--bg3)', border:`1px solid ${open===entry.id?'rgba(45,127,249,0.25)':'var(--b1)'}`, color:open===entry.id?'var(--accent2)':'var(--text2)', fontSize:12, fontWeight:600, cursor:'pointer', transition:'all 0.14s' }}>
                    {open===entry.id?<><ChevronUp size={12}/> Close</>:<><ChevronDown size={12}/> Analyse</>}
                  </button>
                </div>
              </div>
            </div>

            {open===entry.id && <AnalysisPanel entry={entry} onClose={()=>setOpen(null)} isMobile={isMobile}/>}
          </div>
        ))}
      </div>

      {filtered.length===0 && (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>📊</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>No results</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Try a different search term.</div>
        </div>
      )}
    </div>
  )
}