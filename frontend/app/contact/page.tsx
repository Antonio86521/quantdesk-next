'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { ArrowRight, Mail,  Send, Check } from 'lucide-react'

function Navbar() {
  return (
    <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(7,9,14,0.92)', backdropFilter:'blur(16px)', borderBottom:'1px solid rgba(255,255,255,0.06)', padding:'0 32px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64 }}>
      <Link href="/" style={{ textDecoration:'none' }}>
        <Image src="/logo.svg" alt="QuantDesk Pro" width={140} height={36} style={{ objectFit:'contain' }} priority/>
      </Link>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <Link href="/about"   style={{ padding:'8px 14px', color:'rgba(255,255,255,0.6)', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>About</Link>
        <Link href="/contact" style={{ padding:'8px 14px', color:'#fff', fontSize:13.5, textDecoration:'none', fontWeight:500 }}>Contact</Link>
        <Link href="/login"   style={{ padding:'8px 18px', borderRadius:8, border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.8)', fontSize:13, fontWeight:500, textDecoration:'none' }}>Sign in</Link>
        <Link href="/register" style={{ padding:'8px 18px', borderRadius:8, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none' }}>Get started</Link>
      </div>
    </nav>
  )
}

export default function ContactPage() {
  const [form, setForm]       = useState({ name:'', email:'', subject:'', message:'' })
  const [status, setStatus]   = useState<'idle'|'sending'|'sent'|'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setStatus('sending')
    try {
      // Send via mailto as fallback — replace with Resend API call if preferred
      const mailto = `mailto:atorralbasa@gmail.com?subject=${encodeURIComponent(`[QuantDesk Pro] ${form.subject || 'Contact form'}`)}&body=${encodeURIComponent(`Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`)}`
      window.location.href = mailto
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div style={{ background:'#07090e', color:'#e4ecf7', minHeight:'100vh', fontFamily:"'DM Sans', system-ui, sans-serif" }}>
      <Navbar/>

      <section style={{ padding:'140px 24px 120px', maxWidth:960, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:64 }}>
          <div style={{ fontSize:11, color:'#2d7ff9', fontWeight:700, letterSpacing:'2px', textTransform:'uppercase', marginBottom:16 }}>Contact</div>
          <h1 style={{ fontSize:'clamp(28px, 4vw, 48px)', fontWeight:700, letterSpacing:'-1px', color:'#fff', marginBottom:16 }}>Get in touch</h1>
          <p style={{ fontSize:16, color:'rgba(255,255,255,0.4)', maxWidth:480, margin:'0 auto' }}>For feedback, partnership enquiries, bug reports or just to say hello.</p>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1.6fr', gap:32, alignItems:'start' }}>

          {/* Left — contact info */}
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {[
              { icon:'✉', label:'Email', value:'atorralbasa@gmail.com', href:'mailto:atorralbasa@gmail.com', desc:'For general enquiries' },
              { icon:'⌥', label:'GitHub', value:'Antonio86521/quantdesk-next', href:'https://github.com/Antonio86521/quantdesk-next', desc:'Source code & issues' },
              { icon:'🌐', label:'Website', value:'quantdeskpro.com', href:'https://quantdeskpro.com', desc:'Live platform' },
            ].map(({ icon, label, value, href, desc }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ display:'flex', gap:14, padding:'20px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:14, textDecoration:'none', transition:'all 0.15s' }}
                onMouseEnter={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(45,127,249,0.25)';el.style.background='rgba(45,127,249,0.05)'}}
                onMouseLeave={e=>{const el=e.currentTarget as HTMLElement;el.style.borderColor='rgba(255,255,255,0.07)';el.style.background='rgba(255,255,255,0.03)'}}
              >
                <div style={{ fontSize:22, flexShrink:0, marginTop:2 }}>{icon}</div>
                <div>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{label}</div>
                  <div style={{ fontSize:13.5, color:'rgba(255,255,255,0.75)', fontWeight:500, marginBottom:3 }}>{value}</div>
                  <div style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }}>{desc}</div>
                </div>
              </a>
            ))}

            <div style={{ padding:'20px', background:'rgba(45,127,249,0.06)', border:'1px solid rgba(45,127,249,0.15)', borderRadius:14 }}>
              <div style={{ fontSize:13, fontWeight:600, color:'#5ba3f5', marginBottom:8 }}>Response time</div>
              <div style={{ fontSize:13, color:'rgba(255,255,255,0.4)', lineHeight:1.7 }}>I typically respond within 24–48 hours. For urgent issues, please mention it in the subject line.</div>
            </div>
          </div>

          {/* Right — form */}
          <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:20, padding:'36px 40px' }}>
            {status === 'sent' ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(13,203,125,0.12)', border:'1px solid rgba(13,203,125,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
                  <Check size={24} color="#0dcb7d"/>
                </div>
                <div style={{ fontSize:20, fontWeight:600, color:'#fff', marginBottom:10 }}>Message sent</div>
                <div style={{ fontSize:14, color:'rgba(255,255,255,0.4)', marginBottom:28 }}>Your email client should have opened. If not, email atorralbasa@gmail.com directly.</div>
                <button onClick={()=>setStatus('idle')} style={{ padding:'10px 24px', borderRadius:8, background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', color:'rgba(255,255,255,0.7)', fontSize:13, cursor:'pointer' }}>Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ fontSize:17, fontWeight:700, color:'#fff', marginBottom:28 }}>Send a message</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  {[
                    { label:'Your name', key:'name', placeholder:'Antonio Torralba', type:'text' },
                    { label:'Email address', key:'email', placeholder:'you@example.com', type:'email' },
                  ].map(({ label, key, placeholder, type }) => (
                    <div key={key}>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>{label}</div>
                      <input
                        type={type}
                        placeholder={placeholder}
                        value={(form as any)[key]}
                        onChange={e=>setForm(f=>({...f,[key]:e.target.value}))}
                        style={{ width:'100%', padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:13.5, outline:'none', boxSizing:'border-box' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ marginBottom:14 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Subject</div>
                  <select value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))} style={{ width:'100%', padding:'10px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color: form.subject?'#fff':'rgba(255,255,255,0.35)', fontSize:13.5, outline:'none' }}>
                    <option value="">Select a topic...</option>
                    <option value="General enquiry">General enquiry</option>
                    <option value="Bug report">Bug report</option>
                    <option value="Feature request">Feature request</option>
                    <option value="Partnership / B2B">Partnership / B2B</option>
                    <option value="Press / Media">Press / Media</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11, color:'rgba(255,255,255,0.4)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:8 }}>Message</div>
                  <textarea
                    rows={5}
                    placeholder="Tell me what's on your mind..."
                    value={form.message}
                    onChange={e=>setForm(f=>({...f,message:e.target.value}))}
                    style={{ width:'100%', padding:'12px 14px', borderRadius:9, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#fff', fontSize:13.5, outline:'none', resize:'vertical', boxSizing:'border-box', fontFamily:'inherit' }}
                  />
                </div>
                <button type="submit" disabled={status==='sending'} style={{ width:'100%', padding:'13px', borderRadius:10, background:'linear-gradient(135deg,#2d7ff9,#7c5cfc)', border:'none', color:'#fff', fontSize:14, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 0 28px rgba(45,127,249,0.25)' }}>
                  <Send size={14}/> {status==='sending'?'Opening email client...':'Send Message'}
                </button>
                <div style={{ fontSize:12, color:'rgba(255,255,255,0.2)', textAlign:'center', marginTop:12 }}>Opens your email client · Or email atorralbasa@gmail.com directly</div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}