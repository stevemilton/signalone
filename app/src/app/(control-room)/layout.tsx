'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase/config'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'

export default function ControlRoomLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  usePushNotifications()
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected'>('connected')

  useEffect(() => {
    const handleOnline = () => setConnectionStatus('connected')
    const handleOffline = () => setConnectionStatus('disconnected')

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setConnectionStatus(navigator.onLine ? 'connected' : 'disconnected')

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/control-room/login')
    }
  }, [loading, user, router])

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      router.push('/control-room/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0f1e' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading Control Room...</p>
        </div>
      </div>
    )
  }

  // Login page should render without the header chrome
  const isLoginRoute = typeof window !== 'undefined' && window.location.pathname.includes('/login')

  if (isLoginRoute || !user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0f1e' }}>
        {children}
      </div>
    )
  }

  // Auth check for operator/supervisor role
  const allowedRoles = ['operator', 'supervisor', 'admin', 'control_room_manager']
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0a0f1e' }}>
        <div className="text-center">
          <h1 className="text-xl font-extrabold text-slate-200 mb-2">Access Denied</h1>
          <p className="text-sm text-slate-400 mb-6">
            You do not have permission to access the Control Room.
          </p>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#0a0f1e' }}>
      {/* Header Bar */}
      <header
        className="flex items-center justify-between px-6 py-3 border-b"
        style={{ backgroundColor: '#1e293b', borderColor: '#334155' }}
      >
        {/* Left: Logo */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white text-xs font-extrabold">S1</span>
            </div>
            <div>
              <h1 className="text-sm font-extrabold text-slate-200 leading-tight">E-SAF Civic</h1>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">Control Room</p>
            </div>
          </div>
        </div>

        {/* Center: Connection Status */}
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected'
                ? 'bg-green-500'
                : 'bg-red-500 animate-blink'
            }`}
          />
          <span className="text-[11px] uppercase tracking-wider text-slate-400">
            {connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Right: Operator info + Sign out */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-200">{user.fullName}</p>
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{user.role}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="px-3 py-1.5 text-[11px] uppercase tracking-wider font-semibold text-slate-400 border rounded-lg hover:text-slate-200 hover:border-slate-400 transition-colors"
            style={{ borderColor: '#334155' }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
