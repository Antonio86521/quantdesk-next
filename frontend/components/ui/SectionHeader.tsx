import { ReactNode } from 'react'

export default function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      margin: '28px 0 14px',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        fontSize: 10, fontWeight: 700, letterSpacing: '1.5px',
        textTransform: 'uppercase', color: 'var(--text3)',
        flex: 1,
      }}>
        {title}
        <div style={{
          flex: 1, height: 1,
          background: 'linear-gradient(90deg, var(--b1), transparent)',
        }} />
      </div>
      {action && <div style={{ marginLeft: 14, flexShrink: 0 }}>{action}</div>}
    </div>
  )
}