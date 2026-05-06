'use client'
import { useEffect, useState } from 'react'

// ── Skeleton primitives ───────────────────────────────────────────────────────
function Bone({ w = '100%', h = 16, r = 6, mb = 0 }: { w?:string|number; h?:number; r?:number; mb?:number }) {
  return (
    <div style={{ width:w, height:h, borderRadius:r, background:'rgba(255,255,255,0.06)', marginBottom:mb, flexShrink:0 }}
      className="skeleton-bone"/>
  )
}

function SkeletonCard({ children, p = 16 }: { children: React.ReactNode; p?:number }) {
  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--b1)', borderRadius:14, padding:p, overflow:'hidden' }}>
      {children}
    </div>
  )
}

// ── Page skeletons ────────────────────────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div style={{ padding:'0 28px 52px', animation:'pulse 1.8s ease-in-out infinite' }}>
      <div style={{ margin:'24px 0 20px' }}><Bone w={200} h={28} r={8} mb={8}/><Bone w={320} h={14} r={6}/></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:16 }}>
        {[...Array(4)].map((_,i) => <SkeletonCard key={i}><Bone w={80} h={10} r={4} mb={12}/><Bone w={120} h={28} r={6} mb={8}/><Bone w={100} h={10} r={4}/></SkeletonCard>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16 }}>
        <SkeletonCard p={20}><Bone w={160} h={16} r={6} mb={16}/><Bone w="100%" h={200} r={10}/></SkeletonCard>
        <SkeletonCard p={20}><Bone w={120} h={16} r={6} mb={16}/>{[...Array(5)].map((_,i) => <Bone key={i} w="100%" h={36} r={8} mb={8}/>)}</SkeletonCard>
      </div>
    </div>
  )
}

export function TableSkeleton({ rows = 8, cols = 6 }: { rows?:number; cols?:number }) {
  return (
    <SkeletonCard p={0}>
      <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--b1)' }}>
        <Bone w={180} h={16} r={6}/>
      </div>
      <div style={{ padding:'8px 20px' }}>
        {[...Array(rows)].map((_,ri) => (
          <div key={ri} style={{ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:12, padding:'12px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
            {[...Array(cols)].map((_,ci) => <Bone key={ci} h={14} r={4}/>)}
          </div>
        ))}
      </div>
    </SkeletonCard>
  )
}

export function ChartSkeleton({ height = 260, title }: { height?:number; title?:string }) {
  return (
    <SkeletonCard p={20}>
      {title && <Bone w={200} h={16} r={6} mb={16}/>}
      <Bone w="100%" h={height} r={10}/>
    </SkeletonCard>
  )
}

export function MetricGridSkeleton({ count = 4 }: { count?:number }) {
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${count},1fr)`, gap:12 }}>
      {[...Array(count)].map((_,i) => (
        <SkeletonCard key={i} p={16}>
          <Bone w={80} h={10} r={4} mb={10}/>
          <Bone w={120} h={28} r={6} mb={8}/>
          <Bone w={100} h={10} r={4}/>
        </SkeletonCard>
      ))}
    </div>
  )
}

// ── Generic page skeleton ─────────────────────────────────────────────────────
export function PageSkeleton() {
  return (
    <div style={{ padding:'0 28px 52px' }}>
      <div style={{ margin:'24px 0 20px', display:'flex', alignItems:'center', gap:12 }}>
        <Bone w={34} h={34} r={9}/>
        <div><Bone w={200} h={22} r={7} mb={6}/><Bone w={280} h={13} r={5}/></div>
      </div>
      <MetricGridSkeleton count={4}/>
      <div style={{ marginTop:16 }}><ChartSkeleton height={220}/></div>
      <div style={{ marginTop:16 }}><TableSkeleton rows={6}/></div>
      <style>{`
        .skeleton-bone { animation: skeleton-pulse 1.8s ease-in-out infinite; }
        @keyframes skeleton-pulse { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>
    </div>
  )
}

// ── Suspense wrapper ──────────────────────────────────────────────────────────
export function WithSkeleton({ loading, skeleton, children }: { loading:boolean; skeleton:React.ReactNode; children:React.ReactNode }) {
  if (loading) return <>{skeleton}</>
  return <>{children}</>
}

export default PageSkeleton