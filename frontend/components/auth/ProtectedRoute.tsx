'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  // Extra grace period — wait a tick after loading before deciding to redirect
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!loading) {
      // Small delay to let onAuthStateChange fire after getSession
      const t = setTimeout(() => setReady(true), 100)
      return () => clearTimeout(t)
    }
  }, [loading])

  useEffect(() => {
    if (ready && !user) {
      router.push('/login?redirect=' + encodeURIComponent(window.location.pathname))
    }
  }, [ready, user, router])

  // Show spinner while loading OR during grace period
  if (loading || !ready) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid var(--bg5)',
          borderTop: '3px solid var(--accent)',
          animation: 'spin 0.8s linear infinite',
        }} />
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>Checking session...</div>
      </div>
    )
  }

  if (!user) return null

  return <>{children}</>
}