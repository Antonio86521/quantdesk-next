'use client'
import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, RefreshCw, Download, ChevronDown, ChevronUp, BarChart3, AlertTriangle, BookOpen, Plus, Trash2, Search, Save, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabase'

type SavedEntry = {
  id: string
  user_id: string
  name: string
  tickers: string
  shares: string
  buy_prices: string
  period: string
  benchmark: string
  note: string
  tag: string
  created_at: string
}

const COLORS  = ['#2d7ff9','#7c5cfc','#0dcb7d','#f0a500','#f54060','#00c9a7']
const TAGS    = ['research','quarterly','risk','momentum','watchlist','other']
const PERIODS = ['1mo','3mo','6mo','1y','2y']
const BENCHES = ['SPY','QQQ','DIA','IWM']

function fmtPct(v: any)     { return v==null?'—':`${(v*100).toFixed(2)}%` }
function fmtPlus(v: any)    { return v==null?'—':`${v>=0?'+':''}${(v*100).toFixed(2)}%` }
function fmtNum(v: any,d=2) { return v==null?'—':Number(v).toFixed(d) }
function fmtDollar(v: any)  { return v==null?'—':v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${v.toLocaleString('en',{maximumFractionDigits:0})}`:`$${Number(v).toFixed(2)}` }

async function authFetch(url: string, options: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const token = session?.access_token
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  })
}

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
      <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
      {payload.map((p:any,i:number) => (
        <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8, justifyContent:'space-between', minWidth:120 }}>
          <span>{p.name}</span>
          <span style={{ fontFamily:'var(--fm)' }}>{fn?fn(p.value):Number(p.value).toFixed(4)}</span>
        </div>
      ))}
    </div>
  )
}

function AnalysisPanel({ entry, onClose, isMobile }: { entry: SavedEntry; onClose: () => void; isMobile: boolean }) {
  const [data, setData]   = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]     = useState<'overview'|'performance'|'risk'|'holdings'>('overview')

  useEffect(() => {
    api.portfolio.analytics({
      tickers: entry.tickers,
      shares: entry.shares,
      buyPrices: entry.buy_prices,
      period: entry.period,
      benchmark: entry.benchmark,
    }).then(setData).finally(() => setLoading(false))
  }, [entry])

  const s = data?.summary

  return (
    <div style={{ marginTop:12, background:'var(--bg3)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, overflow:'hidden' }}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)', display:'flex', alignItems:'center', justifyContent:'space-between', background:'var(--bg4)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <BarChart3 size={15} color="var(--accent2)"/>
          <span style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700 }}>{entry.name}</span>
          {loading && <span style={{ fontSize:11, color:'var(--text3)', display:'flex', alignItems:'center', gap:5 }}><RefreshCw size={10} style={{ animation:'spin 1s linear infinite' }}/> Loading...</span>}
          {data && <Badge variant="green" dot>Live</Badge>}
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text3)', fontSize:20, lineHeight:1, padding:'0 4px' }}>×</button>
      </div>

      {loading && (
        <div style={{ padding:40, textAlign:'center', color:'var(--text2)' }}>
          <div style={{ width:32, height:32, borderRadius:'50%', border:'3px solid var(--bg4)', borderTop:'3px solid var(--accent2)', animation:'spin 0.8s linear infinite', margin:'0 auto 16px' }}/>
          <div style={{ fontSize:13 }}>Fetching live data...</div>
        </div>
      )}

      {data && s && (
        <div style={{ padding:'16px 20px' }}>
          <div style={{ display:'flex', gap:3, marginBottom:16, background:'var(--bg5)', border:'1px solid var(--b1)', borderRadius:8, padding:3, overflowX:'auto' }}>
            {(['overview','performance','risk','holdings'] as const).map(t=>(
              <button key={t} onClick={()=>setTab(t)} style={{ padding: isMobile?'6px 12px':'6px 16px', borderRadius:6, border:'none', cursor:'pointer', background:tab===t?'var(--bg2)':'transparent', color:tab===t?'var(--text)':'var(--text2)', fontSize:11.5, fontWeight:tab===t?600:400, transition:'all 0.14s', textTransform:'capitalize', boxShadow:tab===t?'0 2px 6px rgba(0,0,0,0.25)':'none', whiteSpace:'nowrap' }}>{t}</button>
            ))}
          </div>

          {tab==='overview' && (
            <>
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:10, marginBottom:14 }}>
                <MetricCard label="Portfolio Value" value={fmtDollar(s.totalValue)}   delta={`${fmtPlus(s.unrealisedPnl/s.totalCost)} on cost`} deltaUp={s.unrealisedPnl>=0}/>
                <MetricCard label="Total Return"    value={fmtPlus(s.totalReturn)}    delta={`${entry.period} period`} deltaUp={s.totalReturn>=0}/>
                <MetricCard label="Sharpe Ratio"    value={fmtNum(s.sharpe)}          delta={s.sharpe>1?'Above threshold':'Below threshold'} deltaUp={s.sharpe>1}/>
                <MetricCard label="Max Drawdown"    value={fmtPct(s.maxDrawdown)}     delta="Peak to trough" deltaUp={false}/>
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
              <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:16 }}>
                {[
                  [['Ann. Return',fmtPlus(s.annReturn),s.annReturn>=0],['Ann. Volatility',fmtPct(s.annVol),null],['Sortino Ratio',fmtNum(s.sortino),s.sortino>1],['Calmar Ratio',fmtNum(s.calmar),s.calmar>1],['Beta',fmtNum(s.beta),null],['Alpha (Ann.)',fmtPlus(s.alpha),s.alpha>0]],
                  [['VaR 95%',fmtPct(s.histVar95),false],['CVaR 95%',fmtPct(s.histCVar95),false],['Omega Ratio',fmtNum(s.omega),s.omega>1],['R² vs Benchmark',fmtNum(s.r2,3),null],['Tracking Error',fmtPct(s.trackingError),null],['Info Ratio',fmtNum(s.infoRatio),s.infoRatio>0]],
                ].map((col,ci) => (
                  <div key={ci}>
                    {col.map(([l,v,up]:any,i) => (
                      <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none' }}>
                        <span style={{ fontSize:12.5, color:'var(--text2)' }}>{l}</span>
                        <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color:up===true?'var(--green)':up===false?'var(--red)':'var(--text)' }}>{v}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}

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
                  { cond:s.beta>1.2,         msg:`High market beta (${fmtNum(s.beta)}) — portfolio more volatile than market`, sev:'warn' },
                  { cond:s.sharpe<0.5,       msg:`Low Sharpe ratio (${fmtNum(s.sharpe)}) — poor risk-adjusted return`, sev:'warn' },
                  { cond:s.maxDrawdown<-0.2, msg:`Significant drawdown (${fmtPct(s.maxDrawdown)}) — consider stop-loss levels`, sev:'warn' },
                  { cond:s.sharpe>1.5,       msg:`Excellent Sharpe ratio (${fmtNum(s.sharpe)}) — strong risk-adjusted performance`, sev:'ok' },
                  { cond:s.alpha>0.05,       msg:`Strong alpha generation (${fmtPlus(s.alpha)}) — outperforming benchmark`, sev:'ok' },
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
                <div style={{ overflowX:'auto' }}>
                  <table className="qd-table" style={{ minWidth: isMobile?400:'auto' }}>
                    <thead><tr><th>Ticker</th><th>Weight</th><th>P&L</th><th>Return</th></tr></thead>
                    <tbody>
                      {data.holdings?.map((h:any,i:number) => (
                        <tr key={i}>
                          <td><span style={{ fontFamily:'var(--fm)', fontWeight:600, color:COLORS[i%COLORS.length] }}>{h.ticker}</span></td>
                          <td><span className="mono" style={{ fontSize:11 }}>{(h.weight*100).toFixed(1)}%</span></td>
                          <td><span className="mono" style={{ color:h.unrealisedPnl>=0?'var(--green)':'var(--red)' }}>{h.unrealisedPnl>=0?'+':''}{fmtDollar(h.unrealisedPnl)}</span></td>
                          <td><span className="mono" style={{ color:h.periodReturn>=0?'var(--green)':'var(--red)' }}>{fmtPlus(h.periodReturn)}</span></td>
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
            <Link href={`/portfolio?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buy_prices}&period=${entry.period}&benchmark=${entry.benchmark}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(45,127,249,0.1)', border:'1px solid rgba(45,127,249,0.2)', color:'var(--accent2)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>
              <TrendingUp size={13}/> Full Analytics
            </Link>
            <Link href={`/risk?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buy_prices}&period=${entry.period}&benchmark=${entry.benchmark}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', color:'var(--red)', fontSize:12.5, fontWeight:600, textDecoration:'none' }}>
              Risk Details
            </Link>
            <Link href={`/reports?tickers=${entry.tickers}&shares=${entry.shares}&buyPrices=${entry.buy_prices}`}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, background:'var(--bg4)', border:'1px solid var(--b2)', color:'var(--text2)', fontSize:12.5, fontWeight:500, textDecoration:'none' }}>
              <Download size={12}/> Export Report
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function SaveForm({ onSave, onCancel, isMobile }: { onSave: (entry: any) => void; onCancel: () => void; isMobile: boolean }) {
  const [form, setForm] = useState({
    name: '', tickers: 'AAPL,MSFT,NVDA,GOOGL,SPY',
    shares: '20,15,10,25,50', buyPrices: '182,380,650,160,490',
    period: '1y', benchmark: 'SPY', note: '', tag: 'research',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const handleSave = async () => {
    if (!form.name || !form.tickers || !form.shares || !form.buyPrices) {
      setError('Name, tickers, shares and buy prices are required'); return
    }
    setSaving(true); setError('')
    try {
      const res  = await authFetch('/api/analyses', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (json.error) { setError(json.error); return }
      onSave(json.data)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:14, padding:'20px 22px', marginBottom:20 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, display:'flex', alignItems:'center', gap:8 }}>
          <Save size={14} color="var(--accent2)"/> Save New Analysis
        </div>
        <button onClick={onCancel} style={{ background:'transparent', border:'none', cursor:'pointer', color:'var(--text3)' }}><X size={16}/></button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
        <div style={{ gridColumn:'1/-1' }}>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Analysis Name *</div>
          <input className="qd-input" placeholder="e.g. Q2 2026 Core Portfolio" value={form.name} onChange={e=>setForm(x=>({...x,name:e.target.value}))}/>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Tickers (comma-separated) *</div>
          <input className="qd-input" placeholder="AAPL,MSFT,NVDA" value={form.tickers} onChange={e=>setForm(x=>({...x,tickers:e.target.value}))}/>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Shares *</div>
          <input className="qd-input" placeholder="20,15,10" value={form.shares} onChange={e=>setForm(x=>({...x,shares:e.target.value}))}/>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Buy Prices ($) *</div>
          <input className="qd-input" placeholder="182,380,650" value={form.buyPrices} onChange={e=>setForm(x=>({...x,buyPrices:e.target.value}))}/>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Tag</div>
          <select className="qd-select" style={{ width:'100%' }} value={form.tag} onChange={e=>setForm(x=>({...x,tag:e.target.value}))}>
            {TAGS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Period</div>
          <select className="qd-select" style={{ width:'100%' }} value={form.period} onChange={e=>setForm(x=>({...x,period:e.target.value}))}>
            {PERIODS.map(p=><option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Benchmark</div>
          <select className="qd-select" style={{ width:'100%' }} value={form.benchmark} onChange={e=>setForm(x=>({...x,benchmark:e.target.value}))}>
            {BENCHES.map(b=><option key={b}>{b}</option>)}
          </select>
        </div>
        <div style={{ gridColumn:'1/-1' }}>
          <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Analyst Note (optional)</div>
          <textarea className="qd-input" placeholder="Add context, thesis or observations..." value={form.note} onChange={e=>setForm(x=>({...x,note:e.target.value}))} style={{ height:72, resize:'vertical' }}/>
        </div>
      </div>

      {error && <div style={{ marginBottom:12, fontSize:12.5, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:8, padding:'8px 12px' }}>{error}</div>}

      <div style={{ display:'flex', gap:8 }}>
        <button onClick={handleSave} disabled={saving} style={{ padding:'9px 22px', borderRadius:8, background:saving?'var(--bg4)':'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:saving?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:7 }}>
          {saving?<RefreshCw size={13} style={{ animation:'spin 0.8s linear infinite' }}/>:<Save size={13}/>}
          {saving?'Saving...':'Save Analysis'}
        </button>
        <button onClick={onCancel} style={{ padding:'9px 18px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text2)', fontSize:13, cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  const { user } = useAuth()
  const [entries, setEntries]   = useState<SavedEntry[]>([])
  const [loading, setLoading]   = useState(true)
  const [open, setOpen]         = useState<string|null>(null)
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch]     = useState('')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [isMobile, setIsMobile] = useState(false)
  const [deleting, setDeleting] = useState<string|null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const loadEntries = useCallback(async () => {
    if (!user) return
    try {
      const res  = await authFetch('/api/analyses')
      const json = await res.json()
      if (json.data) setEntries(json.data)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }, [user])

  useEffect(() => { loadEntries() }, [loadEntries])

  const handleSave = (entry: SavedEntry) => {
    setEntries(e => [entry, ...e])
    setShowForm(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this analysis?')) return
    setDeleting(id)
    try {
      await authFetch(`/api/analyses/${id}`, { method: 'DELETE' })
      setEntries(e => e.filter(x => x.id !== id))
      if (open === id) setOpen(null)
    } finally { setDeleting(null) }
  }

  const tagColor = (tag: string) => {
    const m: Record<string,string> = { quarterly:'blue', risk:'red', research:'purple', momentum:'green', watchlist:'ghost' }
    return (m[tag] || 'ghost') as any
  }

  const allTags = ['all', ...Array.from(new Set(entries.map(e => e.tag)))]

  const filtered = entries.filter(e => {
    const matchTag    = tagFilter === 'all' || e.tag === tagFilter
    const matchSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.tickers.toLowerCase().includes(search.toLowerCase())
    return matchTag && matchSearch
  })

  if (!user) {
    return (
      <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>
        <div style={{ margin:'24px 0', background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>📊</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Sign in to save analyses</div>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Save portfolio snapshots and reload them with live data anytime.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Saved Analysis</h1>
          <div style={{ fontSize:13, color:'var(--text2)' }}>Portfolio snapshots · Live data reload · Export to report</div>
        </div>
        <button onClick={()=>setShowForm(x=>!x)} style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', boxShadow:'0 0 20px rgba(45,127,249,0.25)' }}>
          <Plus size={14}/> Save Analysis
        </button>
      </div>

      {/* Save form */}
      {showForm && <SaveForm onSave={handleSave} onCancel={()=>setShowForm(false)} isMobile={isMobile}/>}

      {/* Search + filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:1, maxWidth:360 }}>
          <Search size={13} color="var(--text3)" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)' }}/>
          <input className="qd-input" placeholder="Search by name or ticker..." value={search} onChange={e=>setSearch(e.target.value)} style={{ paddingLeft:32 }}/>
        </div>
        <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
          {allTags.map(t => (
            <button key={t} onClick={()=>setTagFilter(t)} style={{ padding:'5px 12px', borderRadius:6, border:`1px solid ${tagFilter===t?'rgba(45,127,249,0.3)':'var(--b1)'}`, background:tagFilter===t?'rgba(45,127,249,0.1)':'var(--bg3)', color:tagFilter===t?'var(--accent2)':'var(--text2)', fontSize:11.5, cursor:'pointer', textTransform:'capitalize', fontWeight:tagFilter===t?600:400 }}>
              {t}
            </button>
          ))}
        </div>
        <span style={{ fontSize:12, color:'var(--text3)' }}>{filtered.length} saved</span>
      </div>

      {/* Entries */}
      {loading ? (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[1,2,3].map(i=><div key={i} style={{ height:120, borderRadius:14 }} className="skeleton"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}>
          <div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>📊</div>
          <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>
            {entries.length === 0 ? 'No saved analyses yet' : 'No results'}
          </div>
          <div style={{ fontSize:13, color:'var(--text2)', marginBottom:20 }}>
            {entries.length === 0 ? 'Click "Save Analysis" to save your first portfolio snapshot.' : 'Try a different search or filter.'}
          </div>
          {entries.length === 0 && (
            <button onClick={()=>setShowForm(true)} style={{ padding:'9px 22px', borderRadius:9, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:7 }}>
              <Plus size={13}/> Save Your First Analysis
            </button>
          )}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {filtered.map(entry => (
            <div key={entry.id}>
              <div style={{ background:'var(--bg2)', border:`1px solid ${open===entry.id?'rgba(45,127,249,0.25)':'var(--b1)'}`, borderRadius:14, padding:'18px 22px', transition:'border-color 0.15s' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap: isMobile?'wrap':'nowrap' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap' }}>
                      <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700 }}>{entry.name}</div>
                      <Badge variant={tagColor(entry.tag)}>{entry.tag}</Badge>
                    </div>
                    <div style={{ fontSize:12, color:'var(--text3)', marginBottom:8 }}>
                      {new Date(entry.created_at).toLocaleDateString('en-GB', { year:'numeric', month:'short', day:'numeric' })} · {entry.period} · vs {entry.benchmark}
                    </div>
                    {entry.note && <div style={{ fontSize:12.5, color:'var(--text2)', marginBottom:10, lineHeight:1.55 }}>{entry.note}</div>}
                    <div style={{ fontSize:11, color:'var(--text3)', fontFamily:'var(--fm)' }}>
                      {entry.tickers.split(',').map((t,i) => (
                        <span key={i} style={{ display:'inline-block', background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:4, padding:'1px 7px', marginRight:5, marginBottom:3, color:'var(--text2)' }}>{t.trim()}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8, flexShrink:0, alignItems:'flex-start', flexWrap:'wrap' }}>
                    <button onClick={()=>handleDelete(entry.id)} disabled={deleting===entry.id} style={{ padding:'7px 10px', borderRadius:8, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', cursor:'pointer', display:'flex', alignItems:'center' }}
                      onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(245,64,96,0.3)';el.style.color='var(--red)'}}
                      onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='var(--b1)';el.style.color='var(--text3)'}}>
                      {deleting===entry.id?<RefreshCw size={12} style={{ animation:'spin 0.8s linear infinite' }}/>:<Trash2 size={12}/>}
                    </button>
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
      )}
    </div>
  )
}