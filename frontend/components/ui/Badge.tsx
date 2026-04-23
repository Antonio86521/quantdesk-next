type Variant = 'blue' | 'green' | 'red' | 'amber' | 'purple' | 'teal' | 'pink' | 'ghost'

const V: Record<Variant, { bg: string; color: string; border: string }> = {
  blue:   { bg: 'rgba(45,127,249,0.12)',  color: '#5ba3f5', border: 'rgba(45,127,249,0.22)' },
  green:  { bg: 'rgba(13,203,125,0.12)',  color: '#0dcb7d', border: 'rgba(13,203,125,0.22)' },
  red:    { bg: 'rgba(245,64,96,0.12)',   color: '#f54060', border: 'rgba(245,64,96,0.22)'  },
  amber:  { bg: 'rgba(240,165,0,0.12)',   color: '#f0a500', border: 'rgba(240,165,0,0.22)'  },
  purple: { bg: 'rgba(124,92,252,0.12)',  color: '#7c5cfc', border: 'rgba(124,92,252,0.22)' },
  teal:   { bg: 'rgba(0,201,167,0.12)',   color: '#00c9a7', border: 'rgba(0,201,167,0.22)'  },
  pink:   { bg: 'rgba(232,62,140,0.12)',  color: '#e83e8c', border: 'rgba(232,62,140,0.22)' },
  ghost:  { bg: 'rgba(255,255,255,0.05)', color: '#68809a', border: 'rgba(255,255,255,0.08)'},
}

export default function Badge({
  children,
  variant = 'blue',
  dot = false,
}: {
  children: React.ReactNode
  variant?: Variant
  dot?: boolean
}) {
  const s = V[variant]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 5,
      fontSize: 10.5, fontWeight: 600, letterSpacing: '0.2px',
      background: s.bg, color: s.color,
      border: `1px solid ${s.border}`,
      whiteSpace: 'nowrap',
    }}>
      {dot && (
        <span style={{
          width: 4, height: 4, borderRadius: '50%',
          background: s.color, display: 'inline-block',
        }} />
      )}
      {children}
    </span>
  )
}