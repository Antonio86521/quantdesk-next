'use client'
import { useState, useRef } from 'react'
import { Upload, X, Check, AlertTriangle } from 'lucide-react'

type Holding = { ticker: string; shares: string; buyPrice: string }

type CSVImportProps = {
  onImport: (name: string, holdings: Holding[]) => void
  onClose: () => void
}

const FORMATS = [
  {
    name: 'Fidelity',
    detect: (h: string[]) => h.some(x => x.toLowerCase().includes('symbol')) && h.some(x => x.toLowerCase().includes('quantity')),
    map: (row: Record<string,string>): Holding | null => {
      const ticker = row['Symbol'] || row['symbol'] || ''
      const shares = row['Quantity'] || row['quantity'] || ''
      const price  = row['Average Cost Basis'] || row['Cost Basis Per Share'] || row['Last Price'] || '0'
      if (!ticker || !shares) return null
      return { ticker: ticker.trim().toUpperCase(), shares: shares.replace(/,/g,'').trim(), buyPrice: price.replace(/[$,]/g,'').trim() || '0' }
    }
  },
  {
    name: 'Schwab',
    detect: (h: string[]) => h.some(x => x.toLowerCase().includes('symbol')) && h.some(x => x.toLowerCase().includes('shares')),
    map: (row: Record<string,string>): Holding | null => {
      const ticker = row['Symbol'] || ''
      const shares = row['Shares'] || row['Quantity'] || ''
      const price  = row['Average Cost'] || row['Price'] || '0'
      if (!ticker || !shares) return null
      return { ticker: ticker.trim().toUpperCase(), shares: shares.replace(/,/g,'').trim(), buyPrice: price.replace(/[$,]/g,'').trim() || '0' }
    }
  },
  {
    name: 'Robinhood',
    detect: (h: string[]) => h.some(x => x.toLowerCase() === 'symbol') && h.some(x => x.toLowerCase().includes('average')),
    map: (row: Record<string,string>): Holding | null => {
      const ticker = row['Symbol'] || ''
      const shares = row['Shares Owned'] || row['Quantity'] || ''
      const price  = row['Average Cost'] || row['Average Buy Price'] || '0'
      if (!ticker || !shares) return null
      return { ticker: ticker.trim().toUpperCase(), shares: shares.replace(/,/g,'').trim(), buyPrice: price.replace(/[$,]/g,'').trim() || '0' }
    }
  },
  {
    name: 'Generic CSV',
    detect: () => true,
    map: (row: Record<string,string>): Holding | null => {
      const ticker = row['Symbol'] || row['Ticker'] || row['Stock'] || row['symbol'] || row['ticker'] || ''
      const shares = row['Shares'] || row['Quantity'] || row['Units'] || row['shares'] || row['quantity'] || ''
      const price  = row['Price'] || row['Cost'] || row['Buy Price'] || row['Average Cost'] || row['price'] || '0'
      if (!ticker || !shares) return null
      return { ticker: ticker.trim().toUpperCase(), shares: shares.replace(/,/g,'').trim(), buyPrice: price.replace(/[$,]/g,'').trim() || '0' }
    }
  }
]

function parseCSV(text: string): { headers: string[]; rows: Record<string,string>[] } {
  const lines = text.split('\n').filter(l => l.trim())
  if (lines.length < 2) return { headers: [], rows: [] }

  const parseRow = (line: string): string[] => {
    const result: string[] = []
    let current = '', inQuotes = false
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = '' }
      else current += char
    }
    result.push(current.trim())
    return result
  }

  let headerIdx = 0
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes(',') && !lines[i].startsWith('$') && !lines[i].match(/^\d/)) { headerIdx = i; break }
  }

  const headers = parseRow(lines[headerIdx])
  const rows: Record<string,string>[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const values = parseRow(lines[i])
    if (values.every(v => !v)) continue
    const row: Record<string,string> = {}
    headers.forEach((h, idx) => { row[h] = values[idx] || '' })
    rows.push(row)
  }
  return { headers, rows }
}

export default function CSVImport({ onImport, onClose }: CSVImportProps) {
  const [step, setStep]             = useState<'upload'|'preview'|'done'>('upload')
  const [holdings, setHoldings]     = useState<Holding[]>([])
  const [detected, setDetected]     = useState('')
  const [portfolioName, setPortfolioName] = useState('')
  const [error, setError]           = useState('')
  const [dragOver, setDragOver]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const processFile = (file: File) => {
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const { headers, rows } = parseCSV(text)
        if (!headers.length) { setError('Could not parse CSV — make sure it has headers.'); return }
        const format = FORMATS.find(f => f.detect(headers)) || FORMATS[FORMATS.length - 1]
        setDetected(format.name)
        const mapped = rows
          .map(row => format.map(row))
          .filter((h): h is Holding => h !== null && h.ticker.length > 0 && h.ticker.length <= 6 && +h.shares > 0)
        if (!mapped.length) { setError('No valid holdings found. Check your CSV format.'); return }
        setHoldings(mapped)
        setPortfolioName(file.name.replace('.csv','').replace(/_/g,' '))
        setStep('preview')
      } catch { setError('Failed to parse CSV file.') }
    }
    reader.readAsText(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file?.name.endsWith('.csv')) processFile(file)
    else setError('Please upload a .csv file.')
  }

  const updateHolding = (i: number, field: keyof Holding, val: string) =>
    setHoldings(hs => hs.map((h, idx) => idx === i ? { ...h, [field]: val } : h))

  const removeHolding = (i: number) => setHoldings(hs => hs.filter((_, idx) => idx !== i))

  const confirm = () => {
    if (!portfolioName.trim()) { setError('Enter a portfolio name.'); return }
    const valid = holdings.filter(h => h.ticker && +h.shares > 0)
    if (!valid.length) { setError('No valid holdings.'); return }
    onImport(portfolioName, valid)
    setStep('done')
  }

  const totalValue = holdings.reduce((s, h) => s + (+h.shares * +h.buyPrice), 0)

  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ width:'100%', maxWidth:680, background:'var(--bg2)', border:'1px solid var(--b2)', borderRadius:18, overflow:'hidden', boxShadow:'0 24px 80px rgba(0,0,0,0.6)', maxHeight:'90vh', display:'flex', flexDirection:'column' }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:'1px solid var(--b1)', background:'var(--bg3)', flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:8, background:'linear-gradient(135deg,#0dcb7d,#0aa866)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Upload size={15} color="#fff" strokeWidth={2}/>
            </div>
            <div>
              <div style={{ fontFamily:'var(--fd)', fontSize:15, fontWeight:700 }}>Import Portfolio from CSV</div>
              <div style={{ fontSize:11, color:'var(--text3)', marginTop:1 }}>Supports Fidelity · Schwab · Robinhood · Generic CSV</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text2)' }}><X size={18}/></button>
        </div>

        <div style={{ overflowY:'auto', flex:1 }}>

          {/* Upload */}
          {step === 'upload' && (
            <div style={{ padding:'24px' }}>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                style={{ border:`2px dashed ${dragOver?'var(--accent2)':'var(--b2)'}`, borderRadius:14, padding:'40px 24px', textAlign:'center', cursor:'pointer', background:dragOver?'rgba(45,127,249,0.05)':'var(--bg3)', transition:'all 0.15s', marginBottom:20 }}
              >
                <input ref={fileRef} type="file" accept=".csv" onChange={e => { const f = e.target.files?.[0]; if(f) processFile(f) }} style={{ display:'none' }}/>
                <div style={{ fontSize:36, marginBottom:12 }}>📂</div>
                <div style={{ fontFamily:'var(--fd)', fontSize:16, fontWeight:600, marginBottom:6 }}>Drop your CSV file here</div>
                <div style={{ fontSize:13, color:'var(--text2)', marginBottom:16 }}>or click to browse</div>
                <div style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'8px 20px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', color:'#fff', fontSize:13, fontWeight:600 }}>
                  <Upload size={13}/> Choose File
                </div>
              </div>

              {error && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:9, marginBottom:16, fontSize:12.5, color:'var(--red)' }}><AlertTriangle size={13}/> {error}</div>}

              <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:12, padding:'16px 18px' }}>
                <div style={{ fontSize:11, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:12 }}>Supported Brokerages</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
                  {['Fidelity','Charles Schwab','Interactive Brokers','Robinhood','TD Ameritrade','Generic CSV'].map(b => (
                    <div key={b} style={{ display:'flex', alignItems:'center', gap:6, fontSize:12.5, color:'var(--text2)' }}>
                      <Check size={11} color="var(--green)"/> {b}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop:14, fontSize:11.5, color:'var(--text3)', lineHeight:1.6 }}>
                  Your CSV needs: <strong style={{ color:'var(--text2)' }}>Symbol/Ticker</strong> and <strong style={{ color:'var(--text2)' }}>Shares/Quantity</strong> columns. Buy price is optional.
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {step === 'preview' && (
            <div style={{ padding:'20px 24px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
                {[
                  { label:'Format Detected', value:detected,                   color:'var(--green)'   },
                  { label:'Holdings Found',  value:String(holdings.length),    color:'var(--accent2)' },
                  { label:'Total Cost',      value:totalValue>0?`$${totalValue.toLocaleString('en',{maximumFractionDigits:0})}`:'—', color:'var(--text)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:10, padding:'12px 14px' }}>
                    <div style={{ fontSize:10, color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:6 }}>{label}</div>
                    <div style={{ fontFamily:'var(--fm)', fontSize:17, fontWeight:300, color }}>{value}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:14 }}>
                <div style={{ fontSize:10.5, color:'var(--text2)', marginBottom:5, fontWeight:500 }}>Portfolio Name</div>
                <input className="qd-input" value={portfolioName} onChange={e => setPortfolioName(e.target.value)} placeholder="My Imported Portfolio"/>
              </div>

              {error && <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:'rgba(245,64,96,0.08)', border:'1px solid rgba(245,64,96,0.2)', borderRadius:9, marginBottom:14, fontSize:12.5, color:'var(--red)' }}><AlertTriangle size={13}/> {error}</div>}

              <div style={{ background:'var(--bg3)', border:'1px solid var(--b1)', borderRadius:12, overflow:'hidden', marginBottom:16 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', borderBottom:'1px solid var(--b1)' }}>
                  {['Ticker','Shares','Buy Price ($)',''].map((h,i) => (
                    <div key={i} style={{ padding:'8px 12px', fontSize:10, color:'var(--text3)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.5px', background:'var(--bg4)' }}>{h}</div>
                  ))}
                </div>
                <div style={{ maxHeight:280, overflowY:'auto' }}>
                  {holdings.map((h, i) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                      <div style={{ padding:'6px 8px' }}><input className="qd-input" value={h.ticker} onChange={e => updateHolding(i,'ticker',e.target.value.toUpperCase())} style={{ padding:'4px 8px', fontSize:12.5, fontFamily:'var(--fm)', fontWeight:600 }}/></div>
                      <div style={{ padding:'6px 8px' }}><input className="qd-input" value={h.shares} onChange={e => updateHolding(i,'shares',e.target.value)} style={{ padding:'4px 8px', fontSize:12.5 }}/></div>
                      <div style={{ padding:'6px 8px' }}><input className="qd-input" value={h.buyPrice} onChange={e => updateHolding(i,'buyPrice',e.target.value)} style={{ padding:'4px 8px', fontSize:12.5 }}/></div>
                      <div style={{ padding:'6px 8px', display:'flex', alignItems:'center' }}>
                        <button onClick={() => removeHolding(i)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text3)', padding:4 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.color='var(--red)'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.color='var(--text3)'}
                        ><X size={12}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => setStep('upload')} style={{ padding:'10px 20px', borderRadius:8, background:'transparent', border:'1px solid var(--b2)', color:'var(--text2)', fontSize:13, fontWeight:500, cursor:'pointer' }}>← Back</button>
                <button onClick={confirm} style={{ flex:1, padding:'10px', borderRadius:8, background:'linear-gradient(135deg,#0dcb7d,#0aa866)', border:'none', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                  <Check size={14}/> Import {holdings.length} Holdings
                </button>
              </div>
            </div>
          )}

          {/* Done */}
          {step === 'done' && (
            <div style={{ padding:'48px 24px', textAlign:'center' }}>
              <div style={{ fontSize:48, marginBottom:16 }}>✅</div>
              <div style={{ fontFamily:'var(--fd)', fontSize:18, fontWeight:700, marginBottom:8 }}>Portfolio Imported!</div>
              <div style={{ fontSize:13.5, color:'var(--text2)', marginBottom:24 }}>
                <strong>{portfolioName}</strong> with {holdings.length} holdings saved to your account.
              </div>
              <button onClick={onClose} style={{ padding:'10px 28px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#1a6de0)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                View Portfolio Manager
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}