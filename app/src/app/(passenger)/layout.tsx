'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { usePushNotifications } from '@/hooks/usePushNotifications'
import { InstallPrompt } from '@/components/shared/InstallPrompt'
import type { MessagePayload } from 'firebase/messaging'

function ConnectionIndicator() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    setOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (online) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white text-center text-xs py-1.5 font-semibold">
      No internet connection
    </div>
  )
}

export default function PassengerLayout({ children }: { children: React.ReactNode }) {
  useAuth()

  const handleForegroundMessage = useCallback((payload: MessagePayload) => {
    const { title, body } = payload.data || {}
    if (title && Notification.permission === 'granted') {
      new Notification(title, { body: body || '', icon: '/icon-192.png' })
    }
  }, [])

  usePushNotifications(handleForegroundMessage)

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-slate-50 relative">
      <ConnectionIndicator />
      {children}
      <InstallPrompt />
    </div>
  )
}
