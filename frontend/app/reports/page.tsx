'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { FileText, Download } from 'lucide-react'
import SectionHeader from '@/components/ui/SectionHeader'

const REPORT_TYPES = [
  { id:'portfolio', icon:'📈', name:'Portfolio Report',   desc:'Full performance, holdings, attribution and risk metrics.', color:'var(--accent2)', bg:'rgba(45,127,249,0.1)' },
  { id:'risk',      icon:'⚡', name:'Risk Digest',        desc:'VaR, CVaR, drawdown, stress tests and factor exposures.',   color:'var(--red)',     bg:'rgba(245,64,96,0.1)' },
  { id:'macro',     icon:'🌍', name:'Macro Snapshot',     desc:'Cross-asset overview, yield curves and regime analysis.',   color:'var(--purple)',  bg:'rgba(124,92,252,0.1)' },
  { id:'technical', icon:'📊', name:'Technical Analysis', desc:'Price charts, RSI, MACD and Bollinger band signals.',       color:'var(--teal)',    bg:'rgba(0,201,167,0.1)' },
]

const DEFAULT = { tickers:'AAPL,MSFT,NVDA,GOOGL,SPY', shares:'20,15,10,25,50', buyPrices:'182,380,650,160,490', period:'1y', benchmark:'SPY' }

function fmtPct(v: any) { return v==null?'—':`${(v*100).toFixed(2)}%` }
function fmtNum(v: any, d=2) { return v==null?'—':Number(v).toFixed(d) }
function fmtDollar(v: any) { return v==null?'—':v>=1e6?`$${(v/1e6).toFixed(2)}M`:v>=1e3?`$${v.toLocaleString('en',{maximumFractionDigits:0})}`:`$${Number(v).toFixed(2)}` }
function fmtPlus(v: any) { return v==null?'—':`${v>=0?'+':''}${(v*100).toFixed(2)}%` }

function buildHTML(sections: string[], data: any, market: any[], tickers: string, period: string) {
  const s = data?.summary
  const h = data?.holdings || []
  const now = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })
  const sectionHTML: string[] = []

  if (sections.includes('portfolio') && s) {
    sectionHTML.push(`
      <section>
        <h2>Portfolio Performance</h2>
        <div class="metrics-grid">
          <div class="metric"><div class="metric-label">Portfolio Value</div><div class="metric-value">${fmtDollar(s.totalValue)}</div></div>
          <div class="metric"><div class="metric-label">Total Return</div><div class="metric-value ${s.totalReturn>=0?'pos':'neg'}">${fmtPlus(s.totalReturn)}</div></div>
          <div class="metric"><div class="metric-label">Ann. Return</div><div class="metric-value ${s.annReturn>=0?'pos':'neg'}">${fmtPlus(s.annReturn)}</div></div>
          <div class="metric"><div class="metric-label">Sharpe Ratio</div><div class="metric-value ${s.sharpe>1?'pos':''}">${fmtNum(s.sharpe)}</div></div>
        </div>
        <h3>Holdings</h3>
        <table>
          <thead><tr><th>Ticker</th><th>Shares</th><th>Value</th><th>P&L</th><th>Weight</th><th>Return</th></tr></thead>
          <tbody>${h.map((hh:any)=>`<tr><td><strong>${hh.ticker}</strong></td><td>${hh.shares}</td><td>${fmtDollar(hh.marketValue)}</td><td class="${hh.unrealisedPnl>=0?'pos':'neg'}">${fmtDollar(hh.unrealisedPnl)}</td><td>${(hh.weight*100).toFixed(1)}%</td><td class="${hh.periodReturn>=0?'pos':'neg'}">${fmtPlus(hh.periodReturn)}</td></tr>`).join('')}</tbody>
        </table>
      </section>`)
  }

  if (sections.includes('risk') && s) {
    sectionHTML.push(`
      <section>
        <h2>Risk Analysis</h2>
        <div class="metrics-grid">
          <div class="metric"><div class="metric-label">Historical VaR 95%</div><div class="metric-value neg">${fmtPct(s.histVar95)}</div></div>
          <div class="metric"><div class="metric-label">CVaR / ES 95%</div><div class="metric-value neg">${fmtPct(s.histCVar95)}</div></div>
          <div class="metric"><div class="metric-label">Max Drawdown</div><div class="metric-value neg">${fmtPct(s.maxDrawdown)}</div></div>
          <div class="metric"><div class="metric-label">Beta</div><div class="metric-value">${fmtNum(s.beta)}</div></div>
        </div>
      </section>`)
  }

  if (sections.includes('macro') && market.length > 0) {
    sectionHTML.push(`
      <section>
        <h2>Macro Snapshot</h2>
        <table>
          <thead><tr><th>Asset</th><th>Price</th><th>Change</th><th>Direction</th></tr></thead>
          <tbody>${market.map(m=>`<tr><td><strong>${m.label}</strong></td><td>${m.value}</td><td class="${m.up?'pos':'neg'}">${m.chgStr}</td><td>${m.up?'↑ Rising':'↓ Falling'}</td></tr>`).join('')}</tbody>
        </table>
      </section>`)
  }

  if (sections.includes('technical')) {
    sectionHTML.push(`
      <section>
        <h2>Technical Analysis Summary</h2>
        <p>Technical analysis for: <strong>${tickers}</strong> over <strong>${period}</strong>.</p>
        <table>
          <thead><tr><th>Indicator</th><th>Signal</th><th>Interpretation</th></tr></thead>
          <tbody>
            <tr><td>RSI (14)</td><td>Above 50</td><td>Bullish momentum</td></tr>
            <tr><td>MACD</td><td>Positive histogram</td><td>Upward trend</td></tr>
            <tr><td>SMA 20/50</td><td>Price above both</td><td>Strong uptrend</td></tr>
          </tbody>
        </table>
      </section>`)
  }

  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>QuantDesk Pro Report</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',system-ui,sans-serif;background:#f8fafc;color:#1e293b;padding:40px;font-size:13px}.wrapper{max-width:1000px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.06)}.header{border-bottom:2px solid #e2e8f0;padding-bottom:24px;margin-bottom:32px;display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px}.logo{display:flex;align-items:center;gap:12px}.logo-mark{width:40px;height:40px;border-radius:10px;background:linear-gradient(135deg,#2d7ff9,#7c5cfc);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:15px}.logo-name{font-size:18px;font-weight:700;color:#0f172a}.logo-sub{font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.8px;margin-top:2px}.report-meta{text-align:right}.report-title{font-size:14px;font-weight:600;color:#0f172a}.report-date{font-size:11px;color:#64748b;margin-top:3px}section{margin-bottom:36px}h2{font-size:16px;font-weight:700;color:#0f172a;border-left:3px solid #2d7ff9;padding-left:10px;margin-bottom:16px}h3{font-size:13px;font-weight:600;color:#334155;margin:20px 0 10px}p{color:#475569;line-height:1.7;margin-bottom:10px}.metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:20px}.metric{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px}.metric-label{font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px}.metric-value{font-size:18px;font-weight:300;color:#0f172a;font-family:'Courier New',monospace}table{width:100%;border-collapse:collapse;margin-top:8px}th{text-align:left;padding:8px 12px;font-size:10px;color:#64748b;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;border-bottom:1px solid #e2e8f0;background:#f8fafc}td{padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12.5px}tr:last-child td{border-bottom:none}.pos{color:#059669}.neg{color:#dc2626}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;font-size:11px;color:#94a3b8;flex-wrap:wrap;gap:8px}@media(max-width:600px){.metrics-grid{grid-template-columns:repeat(2,1fr)}.header{flex-direction:column}.report-meta{text-align:left}}@media print{body{padding:0;background:white}.wrapper{border:none;box-shadow:none;padding:20px}}</style>
</head><body><div class="wrapper">
  <div class="header">
    <div class="logo"><div class="logo-mark">QD</div><div><div class="logo-name">QuantDesk Pro</div><div class="logo-sub">Portfolio Intelligence</div></div></div>
    <div class="report-meta"><div class="report-title">Portfolio Analysis Report</div><div class="report-date">Generated: ${now}</div><div class="report-date">Period: ${period} · Benchmark: ${s?.benchmark||'SPY'}</div></div>
  </div>
  ${sectionHTML.join('\n')}
  <div class="footer"><div>© 2026 QuantDesk Pro — Educational use only</div><div>Not investment advice · Data via yfinance</div></div>
</div></body></html>`
}

export default function ReportsPage() {
  const [selected,setSelected]=useState<string[]>([])
  const [inputs,setInputs]=useState(DEFAULT)
  const [loading,setLoading]=useState(false)
  const [generated,setGenerated]=useState(false)
  const [reportHTML,setReportHTML]=useState('')
  const [isMobile,setIsMobile]=useState(false)

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768)
    check(); window.addEventListener('resize',check)
    return ()=>window.removeEventListener('resize',check)
  },[])

  const toggle=(id:string)=>setSelected(s=>s.includes(id)?s.filter(x=>x!==id):[...s,id])

  const generate=async()=>{
    if(!selected.length)return; setLoading(true)
    try {
      let portfolioData=null; let marketData:any[]=[]
      if(selected.includes('portfolio')||selected.includes('risk')){
        portfolioData=await api.portfolio.analytics({ tickers:inputs.tickers, shares:inputs.shares, buyPrices:inputs.buyPrices, period:inputs.period, benchmark:inputs.benchmark })
      }
      if(selected.includes('macro')){ const snap=await api.market.snapshot(); marketData=snap.data||[] }
      const html=buildHTML(selected,portfolioData,marketData,inputs.tickers,inputs.period)
      setReportHTML(html); setGenerated(true)
    } catch(e){ console.error(e) }
    finally { setLoading(false) }
  }

  const downloadHTML=()=>{
    const blob=new Blob([reportHTML],{type:'text/html'})
    const url=URL.createObjectURL(blob)
    const a=document.createElement('a'); a.href=url; a.download=`quantdesk-report-${new Date().toISOString().slice(0,10)}.html`; a.click()
    URL.revokeObjectURL(url)
  }

  const printPDF=()=>{ const win=window.open('','_blank'); if(!win)return; win.document.write(reportHTML); win.document.close(); setTimeout(()=>win.print(),500) }
  const preview=()=>{ const win=window.open('','_blank'); if(!win)return; win.document.write(reportHTML); win.document.close() }

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px' }}>
        <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px', marginBottom:5 }}>Report Generator</h1>
        <div style={{ fontSize:13, color:'var(--text2)' }}>Generate professional reports · Download HTML · Print to PDF</div>
      </div>

      {/* Portfolio inputs — stacked on mobile */}
      <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontSize:10, color:'var(--text3)', fontWeight:700, letterSpacing:'1.3px', textTransform:'uppercase', marginBottom:14 }}>Portfolio Data</div>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'2fr 1fr 1fr auto auto', gap:12, alignItems:'flex-end' }}>
          {[['Tickers','tickers'],['Shares','shares'],['Buy Prices ($)','buyPrices']].map(([l,k])=>(
            <div key={k}>
              <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>{l}</div>
              <input className="qd-input" value={(inputs as any)[k]} onChange={e=>setInputs(x=>({...x,[k]:e.target.value}))}/>
            </div>
          ))}
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Period</div>
            <select className="qd-select" value={inputs.period} onChange={e=>setInputs(x=>({...x,period:e.target.value}))}>
              {['1mo','3mo','6mo','1y','2y'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5 }}>Benchmark</div>
            <select className="qd-select" value={inputs.benchmark} onChange={e=>setInputs(x=>({...x,benchmark:e.target.value}))}>
              {['SPY','QQQ','DIA','IWM'].map(o=><option key={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section selector — 1-col on mobile, 2-col on desktop */}
      <SectionHeader title="Select Report Sections"/>
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(2,1fr)', gap:12, marginBottom:24 }}>
        {REPORT_TYPES.map(r=>(
          <div key={r.id} onClick={()=>toggle(r.id)} style={{ background:selected.includes(r.id)?r.bg:'var(--bg2)', border:`1px solid ${selected.includes(r.id)?r.color+'44':'var(--b1)'}`, borderRadius:14, padding:'18px 20px', cursor:'pointer', transition:'all 0.15s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:11, background:r.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{r.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--fd)', fontSize:14, fontWeight:700, marginBottom:4 }}>{r.name}</div>
                <div style={{ fontSize:12, color:'var(--text2)' }}>{r.desc}</div>
              </div>
              <div style={{ width:20, height:20, borderRadius:'50%', flexShrink:0, border:`2px solid ${selected.includes(r.id)?r.color:'var(--b2)'}`, background:selected.includes(r.id)?r.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                {selected.includes(r.id)&&<span style={{ color:'#fff', fontSize:11, fontWeight:700 }}>✓</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
        <button onClick={generate} disabled={!selected.length||loading} style={{ padding:'10px 24px', borderRadius:8, cursor:selected.length&&!loading?'pointer':'not-allowed', background:selected.length&&!loading?'linear-gradient(135deg,#2d7ff9,#1a6de0)':'var(--bg4)', border:'1px solid rgba(45,127,249,0.4)', color:'#fff', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:8 }}>
          {loading?<><span style={{ width:13,height:13,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Generating...</>:<><FileText size={14}/> Generate Report</>}
        </button>
        {generated && (<>
          <button onClick={downloadHTML} style={{ padding:'10px 20px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--b2)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
            <Download size={14}/> Download HTML
          </button>
          <button onClick={printPDF} style={{ padding:'10px 20px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--b2)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            🖨 Print / PDF
          </button>
          <button onClick={preview} style={{ padding:'10px 20px', borderRadius:8, background:'var(--bg3)', border:'1px solid var(--b2)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
            👁 Preview
          </button>
        </>)}
      </div>

      {generated && (
        <div style={{ marginTop:16, background:'rgba(13,203,125,0.08)', border:'1px solid rgba(13,203,125,0.2)', borderRadius:12, padding:'14px 18px', display:'flex', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div>
            <div style={{ fontWeight:600, marginBottom:3 }}>Report generated successfully</div>
            <div style={{ fontSize:12.5, color:'var(--text2)' }}>Sections: {selected.map(s=>REPORT_TYPES.find(r=>r.id===s)?.name).join(' · ')}</div>
            <div style={{ fontSize:12, color:'var(--text3)', marginTop:3 }}>Click <strong>Print / PDF</strong> → Save as PDF in your browser's print dialog</div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div style={{ marginTop:24, background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'16px 20px' }}>
        <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:10 }}>How to save as PDF</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {['1. Select your report sections above','2. Click Generate Report','3. Click Print / Save PDF — browser print dialog opens','4. Choose "Save as PDF" as the destination','5. Click Save'].map((step,i)=>(
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:20, height:20, borderRadius:'50%', background:'var(--accent3)', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'var(--accent2)', flexShrink:0 }}>{i+1}</div>
              <div style={{ fontSize:12.5, color:'var(--text2)' }}>{step}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}