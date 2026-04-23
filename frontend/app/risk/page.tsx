'use client'
import { useState } from 'react'
import { api } from '@/lib/api'
import MetricCard from '@/components/ui/MetricCard'
import Badge from '@/components/ui/Badge'
import SectionHeader from '@/components/ui/SectionHeader'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts'

const fmt = {
  pct:     (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`,
  pctPlus: (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`,
  num:     (v: any, d=2) => v == null ? '—' : Number(v).toFixed(d),
}

function Tip({ active, payload, label, fn }: any) {
  if (!active || !payload?.length) return null
  return <div style={{ background:'#101520', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, padding:'8px 12px', fontSize:11 }}>
    <div style={{ color:'#68809a', marginBottom:4 }}>{label}</div>
    {payload.map((p:any,i:number) => <div key={i} style={{ color:p.color||'#e4ecf7', display:'flex', gap:8 }}><span>{p.name}</span><span style={{ fontFamily:'var(--fm)' }}>{fn?fn(p.value):Number(p.value).toFixed(4)}</span></div>)}
  </div>
}

const DEFAULT = { tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'1y', benchmark:'SPY', riskFree:'2.0' }

export default function RiskPage() {
  const [inp, setInp] = useState(DEFAULT)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const run = async () => {
    setLoading(true); setError('')
    try { setData(await api.portfolio.analytics({ tickers:inp.tickers, shares:inp.shares, buyPrices:inp.buyPrices, period:inp.period, benchmark:inp.benchmark, riskFree:parseFloat(inp.riskFree)/100 })) }
    catch (e:any) { setError(e.message||'Failed') }
    finally { setLoading(false) }
  }

  const s = data?.summary

  return (
    <div style={{ padding:'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div><h1 style={{ fontSize:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Risk & Attribution</h1><div style={{ fontSize:13, color:'var(--text2)' }}>VaR · CVaR · Drawdown · Beta · Stress Testing</div></div>
        {data && <Badge variant="red">Risk Analysis</Badge>}
      </div>

      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr 1fr', gap:12, marginBottom:14 }}>
          {[['Tickers','tickers','AAPL,MSFT,NVDA'],['Shares','shares','20,15,10'],['Buy Prices ($)','buyPrices','182,380,650'],['Risk-Free %','riskFree','2.0']].map(([l,k,p])=>(
            <div key={k}><div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div><input className="qd-input" placeholder={p} value={(inp as any)[k]} onChange={e=>setInp(x=>({...x,[k]:e.target.value}))}/></div>
          ))}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'flex-end' }}>
          {[['Period','period',['1mo','3mo','6mo','1y','2y','5y']],['Benchmark','benchmark',['SPY','QQQ','DIA','IWM']]].map(([l,k,opts]:any)=>(
            <div key={k}><div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div><select className="qd-select" value={(inp as any)[k]} onChange={e=>setInp(x=>({...x,[k]:e.target.value}))}>{opts.map((o:string)=><option key={o}>{o}</option>)}</select></div>
          ))}
          <button onClick={run} disabled={loading} style={{ padding:'9px 24px', borderRadius:8, background:loading?'var(--bg4)':'linear-gradient(135deg,#f54060,#c0392b)', border:'1px solid rgba(245,64,96,0.4)', color:'#fff', fontSize:13, fontWeight:600, cursor:loading?'not-allowed':'pointer', display:'flex', alignItems:'center', gap:8 }}>
            {loading?<><span style={{ width:12,height:12,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>Analysing...</>:'Run Risk Analysis'}
          </button>
        </div>
        {error&&<div style={{ marginTop:12, fontSize:12, color:'var(--red)', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:7, padding:'8px 12px' }}>{error}</div>}
      </div>

      {!data&&!loading&&<div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:48, textAlign:'center' }}><div style={{ fontSize:32, marginBottom:12, opacity:0.4 }}>⚡</div><div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:8 }}>Risk Analysis Ready</div><div style={{ fontSize:13, color:'var(--text2)', maxWidth:400, margin:'0 auto' }}>Run a full risk analysis including VaR, CVaR, drawdown profile, beta, alpha and stress test metrics.</div></div>}

      {data&&s&&(<>
        <SectionHeader title="Value at Risk" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          <MetricCard label="Historical VaR 95%" value={fmt.pct(s.histVar95)}  delta="Daily loss exceeded 5% of time" deltaUp={false} accent="#f54060"/>
          <MetricCard label="CVaR / ES 95%"      value={fmt.pct(s.histCVar95)} delta="Average loss in worst 5%"       deltaUp={false} accent="#f54060"/>
          <MetricCard label="Parametric VaR 95%" value={fmt.pct(s.paramVar95)} delta="Normal distribution assumption"/>
        </div>

        <SectionHeader title="Risk Metrics" />
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
          <MetricCard label="Max Drawdown"    value={fmt.pct(s.maxDrawdown)}    delta="Peak to trough"      deltaUp={false}/>
          <MetricCard label="Ann. Volatility" value={fmt.pct(s.annVol)}          delta="Realised annual vol"/>
          <MetricCard label="Beta"            value={fmt.num(s.beta)}            delta={`vs ${s.benchmark}`}/>
          <MetricCard label="Tracking Error"  value={fmt.pct(s.trackingError)}   delta="Active risk"/>
          <MetricCard label="Sharpe Ratio"    value={fmt.num(s.sharpe)}          delta="Return per unit risk"  deltaUp={s.sharpe>1}/>
          <MetricCard label="Sortino Ratio"   value={fmt.num(s.sortino)}         delta="Downside-only vol"     deltaUp={s.sortino>1}/>
          <MetricCard label="Calmar Ratio"    value={fmt.num(s.calmar)}          delta="Return / Max DD"       deltaUp={s.calmar>1}/>
          <MetricCard label="Info Ratio"      value={fmt.num(s.infoRatio)}       delta="Active return / TE"    deltaUp={s.infoRatio>0}/>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Drawdown Profile</div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.charts.drawdown?.map((d:any)=>({...d,value:d.value*100}))}>
                <defs><linearGradient id="rdd" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f54060" stopOpacity={0.25}/><stop offset="95%" stopColor="#f54060" stopOpacity={0.01}/></linearGradient></defs>
                <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(0)}%`} width={38}/>
                <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(2)}%`}/>}/>
                <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)"/>
                <Area type="monotone" dataKey="value" name="Drawdown" stroke="#f54060" strokeWidth={1.8} fill="url(#rdd)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
            <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Extended Stats</div>
            {[['Skewness',fmt.num(s.skewness,3),s.skewness<0?'var(--red)':'var(--green)'],['Excess Kurtosis',fmt.num(s.kurtosis,3),s.kurtosis>3?'var(--red)':'var(--text)'],['Omega Ratio',fmt.num(s.omega),s.omega>1?'var(--green)':'var(--red)'],['Gain/Pain',fmt.num(s.gainToPain),s.gainToPain>1?'var(--green)':'var(--red)'],['Alpha (Ann.)',fmt.pctPlus(s.alpha),s.alpha>0?'var(--green)':'var(--red)'],['R² vs Bench',fmt.num(s.r2,3),'var(--text)']].map(([l,v,c],i)=>(
              <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'9px 0', borderBottom:i<5?'1px solid rgba(255,255,255,0.04)':'none' }}>
                <span style={{ fontSize:12, color:'var(--text2)' }}>{l}</span>
                <span style={{ fontFamily:'var(--fm)', fontSize:12.5, color:c as string }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
          <div style={{ fontFamily:'var(--fd)', fontSize:13.5, fontWeight:700, marginBottom:16 }}>Daily Returns</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={data.charts.returns?.map((d:any)=>({...d,value:d.value*100}))}>
              <XAxis dataKey="date" tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{ fontSize:9, fill:'#304560' }} tickLine={false} axisLine={false} tickFormatter={v=>`${v.toFixed(1)}%`} width={42}/>
              <Tooltip content={<Tip fn={(v:number)=>`${v.toFixed(3)}%`}/>}/>
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)"/>
              <Bar dataKey="value" name="Return" radius={[1,1,0,0]}>
                {data.charts.returns?.map((d:any,i:number)=><Cell key={i} fill={d.value>=0?'#0dcb7d':'#f54060'} opacity={0.75}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </>)}
    </div>
  )
}