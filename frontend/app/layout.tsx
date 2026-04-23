'use client'
import './globals.css'
import { AuthProvider } from '@/context/AuthContext'
import Sidebar from '@/components/layout/Sidebar'
import Topbar from '@/components/layout/Topbar'
import { usePathname } from 'next/navigation'

const AUTH_ROUTES = ['/login', '/register']

function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const isAuth = AUTH_ROUTES.includes(path)

  if (isAuth) {
    return <>{children}</>
  }

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'var(--bg)' }}>
      <Sidebar />
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
        <Topbar />
        <main style={{ flex:1, overflowY:'auto', background:'var(--bg)' }}>
          <div className="page-enter">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}