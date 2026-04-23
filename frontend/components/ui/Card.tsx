import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  title?: string
  subtitle?: string
  action?: ReactNode
  padding?: string
  style?: React.CSSProperties
}

export default function Card({ children, title, subtitle, action, padding = '18px 20px', style }: CardProps) {
  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--b1)',
      borderRadius: 14,
      overflow: 'hidden',
      ...style,
    }}>
      {(title || action) && (
        <div style={{
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '16px 20px 0',
          marginBottom: 14,
          gap: 12,
        }}>
          <div>
            {title && (
              <div style={{
                fontFamily: 'var(--fd)', fontSize: 13.5, fontWeight: 700,
                color: 'var(--text)', letterSpacing: '-0.2px',
              }}>
                {title}
              </div>
            )}
            {subtitle && (
              <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 3 }}>
                {subtitle}
              </div>
            )}
          </div>
          {action && <div style={{ flexShrink: 0 }}>{action}</div>}
        </div>
      )}
      <div style={{ padding: title ? `0 20px 18px` : padding }}>
        {children}
      </div>
    </div>
  )
}