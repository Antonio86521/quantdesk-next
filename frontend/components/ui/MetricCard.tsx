'use client'
import { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string
  delta?: string
  deltaUp?: boolean | null
  sub?: string
  icon?: ReactNode
  accent?: string
  sparkData?: number[]
}

function Spark({ data, up }: { data: number[]; up: boolean }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 44, h = 20
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * h
    return `${x},${y}`
  }).join(' ')
  return (
    <svg width={w} height={h} style={{ overflow: 'visible', flexShrink: 0 }}>
      <polyline
        points={points}
        fill="none"
        stroke={up ? 'var(--green)' : 'var(--red)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />
    </svg>
  )
}

export default function MetricCard({
  label, value, delta, deltaUp, sub, icon, accent, sparkData
}: MetricCardProps) {
  const deltaColor = deltaUp === true
    ? 'var(--green)'
    : deltaUp === false
    ? 'var(--red)'
    : 'var(--text2)'

  const DeltaIcon = deltaUp === true ? TrendingUp : deltaUp === false ? TrendingDown : Minus

  return (
    <div style={{
      background: 'var(--bg3)',
      border: `1px solid ${accent ? `${accent}30` : 'var(--b1)'}`,
      borderRadius: 13,
      // ── Key fix: enough padding but not too cramped on mobile ──
      padding: '14px 14px 12px',
      transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
      cursor: 'default',
      position: 'relative',
      overflow: 'hidden',
      // Ensure the card never shrinks content below readable size
      minWidth: 0,
    }}
    onMouseEnter={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = accent ? `${accent}55` : 'var(--b2)'
      el.style.transform = 'translateY(-1px)'
      el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)'
    }}
    onMouseLeave={e => {
      const el = e.currentTarget as HTMLElement
      el.style.borderColor = accent ? `${accent}30` : 'var(--b1)'
      el.style.transform = 'translateY(0)'
      el.style.boxShadow = 'none'
    }}
    >
      {/* Subtle gradient top border */}
      {accent && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${accent}80, transparent)`,
        }} />
      )}

      {/* Label row */}
      <div style={{
        display: 'flex', alignItems: 'flex-start',
        justifyContent: 'space-between', gap: 6, marginBottom: 8,
      }}>
        <div style={{
          fontSize: 9.5,
          color: 'var(--text2)',
          fontWeight: 600,
          letterSpacing: '0.4px',
          textTransform: 'uppercase',
          lineHeight: 1.3,
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          // Allow label to wrap rather than overflow
          flexWrap: 'wrap',
          minWidth: 0,
        }}>
          {icon && <span style={{ opacity: 0.7, flexShrink: 0 }}>{icon}</span>}
          {label}
        </div>
        {sparkData && <Spark data={sparkData} up={deltaUp !== false} />}
      </div>

      {/* Value — key fix: use clamp so it scales down gracefully */}
      <div style={{
        fontFamily: 'var(--fm)',
        // clamp(18px, 5vw, 26px) — shrinks on very narrow cards
        fontSize: 'clamp(18px, 4.5vw, 26px)',
        fontWeight: 300,
        color: 'var(--text)',
        letterSpacing: '-0.8px',
        lineHeight: 1,
        marginBottom: 7,
        // Prevent overflow — truncate with ellipsis as last resort
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {value}
      </div>

      {delta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          fontSize: 11, color: deltaColor,
          // Also allow wrapping on very small cards
          flexWrap: 'wrap',
        }}>
          <DeltaIcon size={10} strokeWidth={2} style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{delta}</span>
        </div>
      )}

      {sub && !delta && (
        <div style={{
          fontSize: 10.5, color: 'var(--text3)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{sub}</div>
      )}
    </div>
  )
}