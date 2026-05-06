'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { TrendingUp, Search, Bell, ChevronRight, X, Check } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    icon: TrendingUp,
    color: '#2d7ff9',
    title: 'Analyse your portfolio',
    desc: 'Enter your tickers, shares and buy prices to see full performance analytics — Sharpe ratio, VaR, drawdown, alpha and more.',
    cta: 'Open Portfolio →',
    href: '/portfolio',
    tip: 'Try the defaults first — just click Analyse Portfolio to see how it works.',
  },
  {
    n: 2,
    icon: Search,
    color: '#0dcb7d',
    title: 'Screen stocks',
    desc: 'Scan multiple tickers for RSI signals, momentum, SMA crossovers and volatility across 8 built-in watchlists.',
    cta: 'Open Screener →',
    href: '/screener',
    tip: 'Select the S&P 500 Leaders watchlist and click Run Screener to see signals instantly.',
  },
  {
    n: 3,
    icon: Bell,
    color: '#f0a500',
    title: 'Set a price alert',
    desc: 'Get notified when any stock hits your target price. Set alerts for any ticker — above or below a price level.',
    cta: 'Open Alerts →',
    href: '/alerts',
    tip: 'Try setting an alert for AAPL above $200 to see how the system works.',
  },
]

const STORAGE_KEY = 'qd_onboarding_dismissed'

export default function OnboardingFlow({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const [completed, setCompleted] = useState<number[]>([])

  const current = STEPS[step]
  const Icon = current.icon

  const markComplete = (n: number) => {
    if (!completed.includes(n)) setCompleted(c => [...c, n])
  }

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    onDismiss()
  }

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid rgba(45,127,249,0.2)', borderRadius:18, overflow:'hidden', marginBottom:24, position:'relative' }}>
      {/* Top gradient bar */}
      <div style={{ height:3, background:'linear-gradient(90deg,#2d7ff9,#7c5cfc,#0dcb7d)' }}/>

      <div style={{ padding:'20px 24px' }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div>
            <div style={{ fontSize:11, color:'#2d7ff9', fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:4 }}>Getting started</div>
            <div style={{ fontSize:16, fontWeight:700, color:'var(--text)' }}>Welcome to QuantDesk Pro 👋</div>
          </div>
          <button onClick={dismiss} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text4)', padding:4, borderRadius:6 }}>
            <X size={16}/>
          </button>
        </div>

        {/* Step indicators */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          {STEPS.map((s, i) => (
            <button key={i} onClick={() => setStep(i)} style={{ flex:1, height:4, borderRadius:2, border:'none', cursor:'pointer', background: i === step ? '#2d7ff9' : completed.includes(s.n) ? '#0dcb7d' : 'var(--bg4)', transition:'all 0.3s' }}/>
          ))}
        </div>

        {/* Current step */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:20, alignItems:'start' }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:`${current.color}18`, border:`1px solid ${current.color}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <Icon size={16} color={current.color} strokeWidth={1.5}/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'var(--text4)', marginBottom:2 }}>Step {current.n} of {STEPS.length}</div>
                <div style={{ fontSize:15, fontWeight:700, color:'var(--text)' }}>{current.title}</div>
              </div>
            </div>

            <p style={{ fontSize:13.5, color:'var(--text3)', lineHeight:1.7, marginBottom:12 }}>{current.desc}</p>

            <div style={{ display:'flex', gap:6, alignItems:'flex-start', padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)', borderRadius:9, marginBottom:16 }}>
              <span style={{ fontSize:13 }}>💡</span>
              <span style={{ fontSize:12, color:'var(--text4)', lineHeight:1.6 }}>{current.tip}</span>
            </div>

            <div style={{ display:'flex', gap:8 }}>
              <Link href={current.href} onClick={() => markComplete(current.n)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:9, background:`linear-gradient(135deg,${current.color},${current.color}cc)`, color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none' }}>
                {current.cta}
              </Link>
              {step < STEPS.length - 1 && (
                <button onClick={() => setStep(s => s + 1)} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', fontSize:13, cursor:'pointer' }}>
                  Skip <ChevronRight size={13}/>
                </button>
              )}
              {step === STEPS.length - 1 && (
                <button onClick={dismiss} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'9px 14px', borderRadius:9, background:'transparent', border:'1px solid var(--b1)', color:'var(--text3)', fontSize:13, cursor:'pointer' }}>
                  Done <Check size={13}/>
                </button>
              )}
            </div>
          </div>

          {/* Step list */}
          <div style={{ display:'flex', flexDirection:'column', gap:6, minWidth:160 }}>
            {STEPS.map((s, i) => {
              const SIcon = s.icon
              const done = completed.includes(s.n)
              const active = i === step
              return (
                <button key={i} onClick={() => setStep(i)} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, border:`1px solid ${active?s.color+'33':'transparent'}`, background:active?`${s.color}0a`:'transparent', cursor:'pointer', textAlign:'left', transition:'all 0.14s' }}>
                  <div style={{ width:20, height:20, borderRadius:6, background:done?'rgba(13,203,125,0.15)':active?`${s.color}18`:'var(--bg4)', border:`1px solid ${done?'rgba(13,203,125,0.3)':active?s.color+'33':'var(--b1)'}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    {done ? <Check size={10} color="#0dcb7d"/> : <SIcon size={10} color={active?s.color:'var(--text4)'} strokeWidth={1.5}/>}
                  </div>
                  <span style={{ fontSize:12, color:active?'var(--text)':done?'var(--text3)':'var(--text4)', fontWeight:active?600:400 }}>{s.title}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export function useOnboarding() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) setShow(true)
  }, [])

  return { show, dismiss: () => setShow(false) }
}