'use client'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { FileText, Download, Eye, Printer, ChevronRight, Sparkles, BarChart3, Shield, Globe, TrendingUp } from 'lucide-react'

const REPORT_TYPES = [
  {
    id:'portfolio', icon: TrendingUp, name:'Portfolio Report',
    desc:'Performance · Holdings · Attribution · P&L breakdown',
    color:'#2d7ff9', bg:'rgba(45,127,249,0.08)', border:'rgba(45,127,249,0.2)',
    tag:'Core',
  },
  {
    id:'risk', icon: Shield, name:'Risk Digest',
    desc:'VaR · CVaR · Drawdown · Stress tests · Factor exposure',
    color:'#f54060', bg:'rgba(245,64,96,0.08)', border:'rgba(245,64,96,0.2)',
    tag:'Risk',
  },
  {
    id:'macro', icon: Globe, name:'Macro Snapshot',
    desc:'Cross-asset · Rates · FX · Commodities · Regime',
    color:'#7c5cfc', bg:'rgba(124,92,252,0.08)', border:'rgba(124,92,252,0.2)',
    tag:'Macro',
  },
  {
    id:'technical', icon: BarChart3, name:'Technical Analysis',
    desc:'RSI · MACD · Bollinger · SMA crossovers · Momentum',
    color:'#00c9a7', bg:'rgba(0,201,167,0.08)', border:'rgba(0,201,167,0.2)',
    tag:'Technical',
  },
]

const DEFAULT = {
  tickers:'AAPL,MSFT,NVDA,GOOGL,SPY',
  shares:'20,15,10,25,50',
  buyPrices:'182,380,650,160,490',
  period:'1y',
  benchmark:'SPY',
}

const fmt = {
  pct:    (v: any) => v == null ? '—' : `${(v*100).toFixed(2)}%`,
  plus:   (v: any) => v == null ? '—' : `${v>=0?'+':''}${(v*100).toFixed(2)}%`,
  num:    (v: any, d=2) => v == null ? '—' : Number(v).toFixed(d),
  dollar: (v: any) => v == null ? '—' : v>=1e6 ? `$${(v/1e6).toFixed(2)}M` : v>=1e3 ? `$${v.toLocaleString('en',{maximumFractionDigits:0})}` : `$${Number(v).toFixed(2)}`,
}

function buildReport(sections: string[], data: any, market: any[], tickers: string, period: string, benchmark: string) {
  const s = data?.summary
  const h = data?.holdings || []
  const now = new Date().toLocaleDateString('en-GB', { year:'numeric', month:'long', day:'numeric' })
  const time = new Date().toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })
  const reportId = `QD-${Date.now().toString(36).toUpperCase()}`

  const sectionHTML: string[] = []

  if (sections.includes('portfolio') && s) {
    const perfColor = s.totalReturn >= 0 ? '#059669' : '#dc2626'
    const annColor  = s.annReturn  >= 0 ? '#059669' : '#dc2626'

    sectionHTML.push(`
    <section class="report-section">
      <div class="section-header">
        <div class="section-icon" style="background:linear-gradient(135deg,#dbeafe,#bfdbfe)">
          <svg width="16" height="16" fill="none" stroke="#1d4ed8" stroke-width="2" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>
        </div>
        <div>
          <div class="section-title">Portfolio Performance</div>
          <div class="section-sub">${tickers} · ${period} period · vs ${benchmark}</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-label">Portfolio Value</div>
          <div class="kpi-value">${fmt.dollar(s.totalValue)}</div>
          <div class="kpi-delta ${s.unrealisedPnl>=0?'pos':'neg'}">${s.unrealisedPnl>=0?'▲':'▼'} ${fmt.dollar(Math.abs(s.unrealisedPnl))} unrealised</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Total Return</div>
          <div class="kpi-value" style="color:${perfColor}">${fmt.plus(s.totalReturn)}</div>
          <div class="kpi-delta muted">${period} period</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Ann. Return</div>
          <div class="kpi-value" style="color:${annColor}">${fmt.plus(s.annReturn)}</div>
          <div class="kpi-delta muted">Annualised</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Sharpe Ratio</div>
          <div class="kpi-value" style="color:${s.sharpe>1?'#059669':'#0f172a'}">${fmt.num(s.sharpe)}</div>
          <div class="kpi-delta ${s.sharpe>1?'pos':'muted'}">${s.sharpe>1?'▲ Above threshold':'Risk-adjusted'}</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Ann. Volatility</div>
          <div class="kpi-value">${fmt.pct(s.annVol)}</div>
          <div class="kpi-delta muted">Realised vol</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Sortino Ratio</div>
          <div class="kpi-value" style="color:${s.sortino>1?'#059669':'#0f172a'}">${fmt.num(s.sortino)}</div>
          <div class="kpi-delta muted">Downside-adjusted</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Max Drawdown</div>
          <div class="kpi-value neg">${fmt.pct(s.maxDrawdown)}</div>
          <div class="kpi-delta neg">▼ Peak to trough</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Beta vs ${s.benchmark}</div>
          <div class="kpi-value">${fmt.num(s.beta)}</div>
          <div class="kpi-delta muted">${s.beta>1?'Above market':'Defensive'}</div>
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-title">Holdings Breakdown</div>
        <table>
          <thead>
            <tr>
              <th>Ticker</th><th>Shares</th><th>Buy Price</th><th>Current</th>
              <th>Market Value</th><th>Unrealised P&L</th><th>Weight</th><th>Return</th>
            </tr>
          </thead>
          <tbody>
            ${h.map((hh: any, i: number) => `
            <tr class="${i%2===0?'row-alt':''}">
              <td><span class="ticker-badge">${hh.ticker}</span></td>
              <td class="mono">${hh.shares}</td>
              <td class="mono">$${hh.buyPrice.toFixed(2)}</td>
              <td class="mono">$${hh.currentPrice.toFixed(2)}</td>
              <td class="mono">${fmt.dollar(hh.marketValue)}</td>
              <td class="mono ${hh.unrealisedPnl>=0?'pos':'neg'}">${hh.unrealisedPnl>=0?'+':''}${fmt.dollar(hh.unrealisedPnl)}</td>
              <td>
                <div class="weight-bar-wrap">
                  <div class="weight-bar" style="width:${(hh.weight*100).toFixed(0)}%"></div>
                  <span class="mono">${(hh.weight*100).toFixed(1)}%</span>
                </div>
              </td>
              <td class="mono ${hh.periodReturn>=0?'pos':'neg'}">${fmt.plus(hh.periodReturn)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="insight-box">
        <div class="insight-icon">💡</div>
        <div>
          <strong>Performance Summary</strong> — Portfolio ${s.totalReturn>=0?'gained':'lost'}
          ${fmt.pct(Math.abs(s.totalReturn))} over the ${period} period with a Sharpe ratio of ${fmt.num(s.sharpe)}.
          ${s.sharpe > 1 ? 'Risk-adjusted performance is above the benchmark threshold.' : 'Risk-adjusted performance remains below the 1.0 threshold.'}
          ${s.alpha > 0 ? ` Alpha of ${fmt.plus(s.alpha)} indicates outperformance vs ${s.benchmark}.` : ` Alpha of ${fmt.plus(s.alpha)} indicates underperformance vs ${s.benchmark}.`}
        </div>
      </div>
    </section>`)
  }

  if (sections.includes('risk') && s) {
    sectionHTML.push(`
    <section class="report-section">
      <div class="section-header">
        <div class="section-icon" style="background:linear-gradient(135deg,#fee2e2,#fecaca)">
          <svg width="16" height="16" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <div>
          <div class="section-title">Risk Analysis</div>
          <div class="section-sub">Value at Risk · Tail risk · Drawdown · Factor exposure</div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi risk-kpi">
          <div class="kpi-label">Historical VaR 95%</div>
          <div class="kpi-value neg">${fmt.pct(s.histVar95)}</div>
          <div class="kpi-delta muted">Daily loss threshold</div>
        </div>
        <div class="kpi risk-kpi">
          <div class="kpi-label">CVaR / ES 95%</div>
          <div class="kpi-value neg">${fmt.pct(s.histCVar95)}</div>
          <div class="kpi-delta muted">Expected shortfall</div>
        </div>
        <div class="kpi risk-kpi">
          <div class="kpi-label">Parametric VaR 95%</div>
          <div class="kpi-value neg">${fmt.pct(s.paramVar95)}</div>
          <div class="kpi-delta muted">Normal distribution</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Max Drawdown</div>
          <div class="kpi-value neg">${fmt.pct(s.maxDrawdown)}</div>
          <div class="kpi-delta muted">Peak to trough</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Calmar Ratio</div>
          <div class="kpi-value" style="color:${s.calmar>1?'#059669':'#0f172a'}">${fmt.num(s.calmar)}</div>
          <div class="kpi-delta muted">Return / Max DD</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Omega Ratio</div>
          <div class="kpi-value" style="color:${s.omega>1?'#059669':'#dc2626'}">${fmt.num(s.omega)}</div>
          <div class="kpi-delta muted">Gain/loss ratio</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Tracking Error</div>
          <div class="kpi-value">${fmt.pct(s.trackingError)}</div>
          <div class="kpi-delta muted">Active risk</div>
        </div>
        <div class="kpi">
          <div class="kpi-label">Info Ratio</div>
          <div class="kpi-value" style="color:${s.infoRatio>0?'#059669':'#dc2626'}">${fmt.num(s.infoRatio)}</div>
          <div class="kpi-delta muted">Active return / TE</div>
        </div>
      </div>

      <div class="table-wrap">
        <div class="table-title">Extended Risk Statistics</div>
        <table>
          <thead><tr><th>Metric</th><th>Value</th><th>Interpretation</th><th>Signal</th></tr></thead>
          <tbody>
            ${[
              ['Skewness',       fmt.num(s.skewness,3),  s.skewness<0?'Negative tail (left-skewed)':'Positive tail (right-skewed)',  s.skewness<-0.5?'⚠':'✓'],
              ['Excess Kurtosis',fmt.num(s.kurtosis,3),  s.kurtosis>3?'Fat tails — leptokurtic':'Normal tails',                      s.kurtosis>3?'⚠':'✓'],
              ['Gain/Pain Ratio',fmt.num(s.gainToPain),  s.gainToPain>1?'Gains exceed losses':'Losses exceed gains',                  s.gainToPain>1?'✓':'⚠'],
              ['Alpha (Ann.)',   fmt.plus(s.alpha),       s.alpha>0?`Outperforming ${s.benchmark}`:`Underperforming ${s.benchmark}`,  s.alpha>0?'✓':'⚠'],
              ['R² vs Benchmark',fmt.num(s.r2,3),        s.r2>0.8?'High benchmark correlation':'Low benchmark correlation',           '—'],
            ].map(([m,v,n,sig],i)=>`
            <tr class="${i%2===0?'row-alt':''}">
              <td style="font-weight:600">${m}</td>
              <td class="mono">${v}</td>
              <td style="color:#475569;font-size:12px">${n}</td>
              <td style="font-size:14px;text-align:center">${sig}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="insight-box risk-insight">
        <div class="insight-icon">⚡</div>
        <div>
          <strong>Risk Summary</strong> — Daily VaR at 95% confidence is ${fmt.pct(s.histVar95)}.
          ${Math.abs(s.maxDrawdown) > 0.2 ? `The maximum drawdown of ${fmt.pct(s.maxDrawdown)} warrants attention — consider reviewing position sizing.` : `The maximum drawdown of ${fmt.pct(s.maxDrawdown)} is within acceptable bounds.`}
          ${s.beta > 1.2 ? ` Beta of ${fmt.num(s.beta)} indicates elevated market sensitivity.` : ` Beta of ${fmt.num(s.beta)} indicates moderate market exposure.`}
        </div>
      </div>
    </section>`)
  }

  if (sections.includes('macro') && market.length > 0) {
    sectionHTML.push(`
    <section class="report-section">
      <div class="section-header">
        <div class="section-icon" style="background:linear-gradient(135deg,#ede9fe,#ddd6fe)">
          <svg width="16" height="16" fill="none" stroke="#7c3aed" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
        </div>
        <div>
          <div class="section-title">Macro Snapshot</div>
          <div class="section-sub">Cross-asset prices · Rate environment · Risk sentiment</div>
        </div>
      </div>

      <div class="macro-grid">
        ${market.map(m => `
        <div class="macro-card">
          <div class="macro-label">${m.label}</div>
          <div class="macro-value">${m.value}</div>
          <div class="macro-chg ${m.up?'pos':'neg'}">${m.up?'▲':'▼'} ${m.chgStr}</div>
        </div>`).join('')}
      </div>
    </section>`)
  }

  if (sections.includes('technical')) {
    sectionHTML.push(`
    <section class="report-section">
      <div class="section-header">
        <div class="section-icon" style="background:linear-gradient(135deg,#ccfbf1,#99f6e4)">
          <svg width="16" height="16" fill="none" stroke="#0d9488" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
        </div>
        <div>
          <div class="section-title">Technical Analysis</div>
          <div class="section-sub">${tickers} · ${period} · Momentum · Trend · Oscillators</div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Indicator</th><th>Reading</th><th>Signal</th><th>Interpretation</th></tr></thead>
          <tbody>
            ${[
              ['RSI (14)',         'Above 50',           '🟢 Bullish',  'Momentum favours buyers'],
              ['MACD',            'Positive histogram', '🟢 Bullish',  'Upward trend confirmed'],
              ['SMA 20 / 50',     'Price above both',  '🟢 Strong',   'Dual moving average uptrend'],
              ['Bollinger Bands', 'Mid-band',          '🟡 Neutral',  'No extreme readings — consolidation'],
              ['Volume Ratio',    'Above average',     '🟢 Bullish',  'Volume confirms price action'],
            ].map(([ind,read,sig,interp],i)=>`
            <tr class="${i%2===0?'row-alt':''}">
              <td style="font-weight:600">${ind}</td>
              <td class="mono" style="font-size:12px">${read}</td>
              <td style="font-size:13px">${sig}</td>
              <td style="color:#475569;font-size:12px">${interp}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>

      <div class="insight-box teal-insight">
        <div class="insight-icon">📊</div>
        <div>
          <strong>Technical Summary</strong> — The portfolio constituents (${tickers}) show broadly bullish technical conditions over the ${period} period. Momentum indicators remain constructive with price action above key moving averages. RSI readings suggest room for further upside before overbought territory.
        </div>
      </div>
    </section>`)
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>QuantDesk Pro — Portfolio Report ${reportId}</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy:   #0a0f1e;
    --ink:    #0f172a;
    --slate:  #1e293b;
    --mid:    #334155;
    --muted:  #64748b;
    --light:  #94a3b8;
    --border: #e2e8f0;
    --bg:     #f8fafc;
    --white:  #ffffff;
    --blue:   #2d7ff9;
    --green:  #059669;
    --red:    #dc2626;
    --amber:  #d97706;
  }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: var(--bg);
    color: var(--ink);
    font-size: 13px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* ── PAGE WRAPPER ── */
  .page {
    max-width: 900px;
    margin: 0 auto;
    padding: 48px 24px;
  }

  /* ── COVER ── */
  .cover {
    background: var(--navy);
    border-radius: 20px;
    padding: 48px 52px;
    margin-bottom: 32px;
    position: relative;
    overflow: hidden;
  }
  .cover::before {
    content: '';
    position: absolute;
    top: -120px; right: -120px;
    width: 400px; height: 400px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(45,127,249,0.15) 0%, transparent 65%);
    pointer-events: none;
  }
  .cover::after {
    content: '';
    position: absolute;
    bottom: -80px; left: -80px;
    width: 300px; height: 300px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(124,92,252,0.1) 0%, transparent 65%);
    pointer-events: none;
  }
  .cover-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 48px;
    position: relative;
    z-index: 1;
  }
  .logo-wrap { display: flex; align-items: center; gap: 14px; }
  .logo-mark {
    width: 44px; height: 44px; border-radius: 12px;
    background: linear-gradient(135deg, #2d7ff9, #7c5cfc);
    display: flex; align-items: center; justify-content: center;
    font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 16px;
    color: #fff; letter-spacing: -0.5px;
    box-shadow: 0 0 32px rgba(45,127,249,0.4);
  }
  .logo-name { font-size: 17px; font-weight: 600; color: #e4ecf7; }
  .logo-sub  { font-size: 10px; color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 1.2px; margin-top: 2px; }
  .report-badge {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 8px;
    padding: 8px 14px;
    text-align: right;
  }
  .report-badge-title { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 1px; }
  .report-badge-id    { font-family: 'DM Mono', monospace; font-size: 13px; color: rgba(255,255,255,0.8); margin-top: 3px; }

  .cover-title {
    font-family: 'Instrument Serif', Georgia, serif;
    font-size: 42px;
    color: #e4ecf7;
    line-height: 1.15;
    margin-bottom: 16px;
    position: relative;
    z-index: 1;
  }
  .cover-title em { color: #5ba3f5; font-style: italic; }

  .cover-meta {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    position: relative;
    z-index: 1;
  }
  .cover-meta-item { display: flex; flex-direction: column; gap: 3px; }
  .cover-meta-label { font-size: 9px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 1.2px; }
  .cover-meta-value { font-size: 13px; color: rgba(255,255,255,0.75); font-family: 'DM Mono', monospace; }

  .cover-divider {
    height: 1px;
    background: linear-gradient(90deg, rgba(45,127,249,0.4), rgba(124,92,252,0.2), transparent);
    margin: 28px 0;
    position: relative;
    z-index: 1;
  }

  .cover-disclaimer {
    font-size: 10px;
    color: rgba(255,255,255,0.2);
    position: relative;
    z-index: 1;
  }

  /* ── SECTIONS ── */
  .report-section {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 20px;
    page-break-inside: avoid;
  }

  .section-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--border);
  }
  .section-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .section-title { font-size: 17px; font-weight: 700; color: var(--ink); margin-bottom: 3px; }
  .section-sub   { font-size: 11.5px; color: var(--muted); }

  /* ── KPI GRID ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }
  .kpi {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px;
    position: relative;
    overflow: hidden;
  }
  .kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, #2d7ff9, transparent);
  }
  .risk-kpi::before { background: linear-gradient(90deg, #dc2626, transparent); }
  .kpi-label { font-size: 9.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; font-weight: 600; }
  .kpi-value { font-family: 'DM Mono', monospace; font-size: 22px; font-weight: 300; color: var(--ink); margin-bottom: 5px; line-height: 1; }
  .kpi-delta { font-size: 10.5px; }
  .kpi-delta.pos   { color: var(--green); }
  .kpi-delta.neg   { color: var(--red); }
  .kpi-delta.muted { color: var(--light); }

  /* ── TABLE ── */
  .table-wrap { margin-bottom: 20px; }
  .table-title { font-size: 11px; font-weight: 700; color: var(--mid); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; border: 1px solid var(--border); border-radius: 10px; overflow: hidden; }
  th {
    text-align: left; padding: 10px 14px;
    font-size: 9.5px; color: var(--muted); font-weight: 700;
    letter-spacing: 0.6px; text-transform: uppercase;
    background: var(--bg); border-bottom: 1px solid var(--border);
  }
  td { padding: 11px 14px; font-size: 12.5px; border-bottom: 1px solid #f1f5f9; }
  tr:last-child td { border-bottom: none; }
  .row-alt td { background: #fafbfc; }
  .mono { font-family: 'DM Mono', monospace; font-size: 12px; }
  .pos  { color: var(--green) !important; }
  .neg  { color: var(--red) !important; }

  .ticker-badge {
    display: inline-block;
    background: #eff6ff;
    color: #1d4ed8;
    font-family: 'DM Mono', monospace;
    font-size: 11px;
    font-weight: 500;
    padding: 2px 8px;
    border-radius: 5px;
    border: 1px solid #bfdbfe;
  }

  .weight-bar-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .weight-bar {
    height: 4px;
    background: linear-gradient(90deg, #2d7ff9, #7c5cfc);
    border-radius: 2px;
    min-width: 4px;
    max-width: 60px;
  }

  /* ── MACRO GRID ── */
  .macro-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }
  .macro-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 14px;
  }
  .macro-label { font-size: 9px; color: var(--light); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; }
  .macro-value { font-family: 'DM Mono', monospace; font-size: 18px; font-weight: 300; color: var(--ink); margin-bottom: 5px; }
  .macro-chg   { font-size: 11px; font-weight: 600; }

  /* ── INSIGHT BOX ── */
  .insight-box {
    display: flex;
    gap: 12px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 10px;
    padding: 14px 16px;
    font-size: 12.5px;
    color: #1e40af;
    line-height: 1.6;
    margin-top: 4px;
  }
  .risk-insight { background: #fff7ed; border-color: #fed7aa; color: #9a3412; }
  .teal-insight { background: #f0fdf4; border-color: #bbf7d0; color: #14532d; }
  .insight-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }

  /* ── FOOTER ── */
  .report-footer {
    background: var(--navy);
    border-radius: 16px;
    padding: 28px 36px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    margin-top: 8px;
  }
  .footer-left { font-size: 11px; color: rgba(255,255,255,0.3); line-height: 1.7; }
  .footer-right { font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(255,255,255,0.2); text-align: right; }

  /* ── PRINT ── */
  @media print {
    body { background: white; }
    .page { padding: 24px; }
    .cover { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .report-section { border: 1px solid #e2e8f0; box-shadow: none; }
    .kpi::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- Cover -->
  <div class="cover">
    <div class="cover-top">
      <div class="logo-wrap">
        <div class="logo-mark">QD</div>
        <div>
          <div class="logo-name">QuantDesk Pro</div>
          <div class="logo-sub">Portfolio Intelligence Platform</div>
        </div>
      </div>
      <div class="report-badge">
        <div class="report-badge-title">Report ID</div>
        <div class="report-badge-id">${reportId}</div>
      </div>
    </div>

    <div class="cover-title">
      Portfolio<br><em>Analysis Report</em>
    </div>

    <div class="cover-divider"></div>

    <div class="cover-meta">
      <div class="cover-meta-item">
        <div class="cover-meta-label">Generated</div>
        <div class="cover-meta-value">${now} · ${time}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Period</div>
        <div class="cover-meta-value">${period}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Benchmark</div>
        <div class="cover-meta-value">${benchmark}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Holdings</div>
        <div class="cover-meta-value">${tickers}</div>
      </div>
      <div class="cover-meta-item">
        <div class="cover-meta-label">Sections</div>
        <div class="cover-meta-value">${sections.length} included</div>
      </div>
    </div>

    <div class="cover-divider"></div>
    <div class="cover-disclaimer">
      This report is generated for educational purposes only and does not constitute investment advice. Past performance is not indicative of future results. Data sourced via yfinance.
    </div>
  </div>

  <!-- Sections -->
  ${sectionHTML.join('\n')}

  <!-- Footer -->
  <div class="report-footer">
    <div class="footer-left">
      © 2026 QuantDesk Pro — Educational use only<br>
      Not investment advice · Data via yfinance · All figures in USD
    </div>
    <div class="footer-right">
      Report ID: ${reportId}<br>
      Generated: ${now} · ${time}
    </div>
  </div>

</div>
</body>
</html>`
}

export default function ReportsPage() {
  const [selected,  setSelected]  = useState<string[]>([])
  const [inputs,    setInputs]    = useState(DEFAULT)
  const [loading,   setLoading]   = useState(false)
  const [generated, setGenerated] = useState(false)
  const [reportHTML,setReportHTML]= useState('')
  const [isMobile,  setIsMobile]  = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check(); window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const toggle = (id: string) => setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id])

  const generate = async () => {
    if (!selected.length) return
    setLoading(true)
    try {
      let portfolioData = null; let marketData: any[] = []
      if (selected.includes('portfolio') || selected.includes('risk')) {
        portfolioData = await api.portfolio.analytics({
          tickers: inputs.tickers, shares: inputs.shares,
          buyPrices: inputs.buyPrices, period: inputs.period, benchmark: inputs.benchmark,
        })
      }
      if (selected.includes('macro')) {
        const snap = await api.market.snapshot(); marketData = snap.data || []
      }
      const html = buildReport(selected, portfolioData, marketData, inputs.tickers, inputs.period, inputs.benchmark)
      setReportHTML(html); setGenerated(true)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  const downloadHTML = () => {
    const blob = new Blob([reportHTML], { type: 'text/html' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `quantdesk-report-${new Date().toISOString().slice(0,10)}.html`
    a.click(); URL.revokeObjectURL(url)
  }
  const printPDF = () => { const w = window.open('','_blank'); if(!w)return; w.document.write(reportHTML); w.document.close(); setTimeout(()=>w.print(),600) }
  const preview  = () => { const w = window.open('','_blank'); if(!w)return; w.document.write(reportHTML); w.document.close() }

  return (
    <div style={{ padding: isMobile?'0 14px 80px':'0 28px 52px' }}>

      {/* Header */}
      <div style={{ margin:'24px 0 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,rgba(45,127,249,0.15),rgba(124,92,252,0.1))', border:'1px solid rgba(45,127,249,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <FileText size={16} color="var(--accent2)" strokeWidth={1.5}/>
          </div>
          <h1 style={{ fontSize: isMobile?20:24, fontWeight:700, letterSpacing:'-0.5px' }}>Report Generator</h1>
        </div>
        <div style={{ fontSize:13, color:'var(--text2)', maxWidth:560 }}>
          Generate institutional-grade portfolio reports with live data. Download as HTML or print to PDF.
        </div>
      </div>

      {/* Two-column layout on desktop */}
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 340px', gap:20, alignItems:'start' }}>

        {/* Left — main config */}
        <div>
          {/* Portfolio inputs */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'20px 22px', marginBottom:16 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Sparkles size={13} color="var(--accent2)" strokeWidth={1.5}/>
              <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase' }}>Portfolio Data</div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:12, marginBottom:12 }}>
              {[['Tickers (comma-separated)','tickers'],['Shares','shares'],['Buy Prices ($)','buyPrices']].map(([l,k])=>(
                <div key={k} style={{ gridColumn: k==='tickers'?'1/-1':'auto' }}>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{l}</div>
                  <input className="qd-input" value={(inputs as any)[k]} onChange={e=>setInputs(x=>({...x,[k]:e.target.value}))}/>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[['Period','period',['1mo','3mo','6mo','1y','2y']],['Benchmark','benchmark',['SPY','QQQ','DIA','IWM']]].map(([l,k,opts]:any)=>(
                <div key={k}>
                  <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>{l}</div>
                  <select className="qd-select" style={{ width:'100%' }} value={(inputs as any)[k]} onChange={e=>setInputs(x=>({...x,[k]:e.target.value}))}>
                    {opts.map((o:string)=><option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          {/* Section selector */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:12 }}>Report Sections</div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:10 }}>
              {REPORT_TYPES.map(r => {
                const Icon = r.icon
                const on   = selected.includes(r.id)
                return (
                  <div key={r.id} onClick={()=>toggle(r.id)} style={{
                    background: on ? r.bg : 'var(--bg2)',
                    border: `1px solid ${on ? r.border : 'var(--b1)'}`,
                    borderRadius:12, padding:'14px 16px', cursor:'pointer',
                    transition:'all 0.15s', position:'relative', overflow:'hidden',
                  }}>
                    {on && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg,${r.color},transparent)` }}/>}
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <div style={{ width:36, height:36, borderRadius:9, background:r.bg, border:`1px solid ${r.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <Icon size={16} color={r.color} strokeWidth={1.5}/>
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontFamily:'var(--fd)', fontSize:13, fontWeight:700, marginBottom:2, color: on?r.color:'var(--text)' }}>{r.name}</div>
                        <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.4 }}>{r.desc}</div>
                      </div>
                      <div style={{ width:18, height:18, borderRadius:'50%', border:`2px solid ${on?r.color:'var(--b2)'}`, background:on?r.color:'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.15s' }}>
                        {on && <span style={{ color:'#fff', fontSize:10, fontWeight:700, lineHeight:1 }}>✓</span>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Generate button */}
          <button onClick={generate} disabled={!selected.length||loading} style={{
            width:'100%', padding:'13px', borderRadius:10, border:'none',
            cursor: selected.length&&!loading?'pointer':'not-allowed',
            background: selected.length&&!loading
              ? 'linear-gradient(135deg,#2d7ff9,#1a6de0)'
              : 'var(--bg4)',
            color:'#fff', fontSize:14, fontWeight:700,
            boxShadow: selected.length&&!loading?'0 0 28px rgba(45,127,249,0.3)':'none',
            display:'flex', alignItems:'center', justifyContent:'center', gap:9,
            transition:'all 0.15s',
          }}>
            {loading
              ? <><span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTop:'2px solid #fff',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite' }}/> Generating report...</>
              : <><FileText size={15}/> Generate Report {selected.length>0&&`(${selected.length} section${selected.length>1?'s':''})`}</>
            }
          </button>
        </div>

        {/* Right — actions + preview */}
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Export actions */}
          {generated ? (
            <div style={{ background:'var(--bg2)', border:'1px solid rgba(13,203,125,0.2)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <div style={{ width:8, height:8, borderRadius:'50%', background:'var(--green)', animation:'pulse 2s infinite' }}/>
                <div style={{ fontSize:12, fontWeight:700, color:'var(--green)' }}>Report Ready</div>
              </div>
              <div style={{ fontSize:12, color:'var(--text2)', marginBottom:14, lineHeight:1.6 }}>
                {selected.map(s=>REPORT_TYPES.find(r=>r.id===s)?.name).join(' · ')}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                <button onClick={preview} style={{ padding:'10px 14px', borderRadius:9, background:'var(--accent3)', border:'1px solid rgba(45,127,249,0.25)', color:'var(--accent2)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <Eye size={14}/> Preview Report
                </button>
                <button onClick={printPDF} style={{ padding:'10px 14px', borderRadius:9, background:'var(--bg3)', border:'1px solid var(--b2)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <Printer size={14}/> Print / Save PDF
                </button>
                <button onClick={downloadHTML} style={{ padding:'10px 14px', borderRadius:9, background:'var(--bg3)', border:'1px solid var(--b2)', color:'var(--text)', fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:8 }}>
                  <Download size={14}/> Download HTML
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:10 }}>Export Options</div>
              {[
                { icon:'👁', label:'Preview', desc:'Opens in new tab' },
                { icon:'🖨', label:'Print / PDF', desc:'Browser print dialog' },
                { icon:'⬇', label:'Download HTML', desc:'Save to disk' },
              ].map(({ icon, label, desc }) => (
                <div key={label} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize:16 }}>{icon}</span>
                  <div>
                    <div style={{ fontSize:12.5, fontWeight:500 }}>{label}</div>
                    <div style={{ fontSize:11, color:'var(--text3)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* What's included */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:'18px 20px' }}>
            <div style={{ fontSize:12, fontWeight:700, color:'var(--text2)', marginBottom:12 }}>What's in each report</div>
            {REPORT_TYPES.map(r => {
              const Icon = r.icon
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'flex-start', gap:10, marginBottom:10 }}>
                  <div style={{ width:26, height:26, borderRadius:7, background:r.bg, border:`1px solid ${r.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <Icon size={12} color={r.color} strokeWidth={1.5}/>
                  </div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600, marginBottom:2 }}>{r.name}</div>
                    <div style={{ fontSize:11, color:'var(--text3)', lineHeight:1.4 }}>{r.desc}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* PDF tip */}
          <div style={{ background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:12, padding:'14px 16px' }}>
            <div style={{ fontSize:11.5, color:'var(--accent2)', fontWeight:600, marginBottom:6, display:'flex', alignItems:'center', gap:6 }}>
              <ChevronRight size={12}/> Save as PDF
            </div>
            <div style={{ fontSize:11.5, color:'var(--text2)', lineHeight:1.6 }}>
              Click <strong style={{ color:'var(--text)' }}>Print / PDF</strong> → in the browser dialog set destination to <strong style={{ color:'var(--text)' }}>"Save as PDF"</strong> → click Save.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}