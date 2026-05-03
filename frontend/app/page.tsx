'use client'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import LandingPage from './landing/page'

export default function RootPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard')
  }, [user, loading, router])

  if (loading) return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#07090e' }}>
      <div style={{ width:32, height:32, borderRadius:'50%', border:'2px solid rgba(45,127,249,0.2)', borderTop:'2px solid #2d7ff9', animation:'spin 0.8s linear infinite' }}/>
    </div>
  )

  if (user) return null
  return <LandingPage/>
}