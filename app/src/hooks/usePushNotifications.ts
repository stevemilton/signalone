'use client'

import { useEffect, useRef } from 'react'
import { useAuthStore } from '@/stores/auth-store'
import { requestFcmToken, onForegroundMessage } from '@/lib/firebase/messaging'
import type { MessagePayload } from 'firebase/messaging'

/**
 * React hook for FCM push notification lifecycle.
 * - Requests permission and registers FCM token on auth
 * - Listens for foreground messages and delegates to optional callback
 * - Prevents duplicate registrations via useRef
 */
export function usePushNotifications(
  onForeground?: (payload: MessagePayload) => void
) {
  const user = useAuthStore((s) => s.user)
  const registeredRef = useRef(false)

  // Register FCM token when user authenticates
  useEffect(() => {
    if (!user || registeredRef.current) return

    let cancelled = false

    async function register() {
      const token = await requestFcmToken()
      if (!token || cancelled) return

      registeredRef.current = true

      try {
        const idToken = await (await import('firebase/auth')).getAuth().currentUser?.getIdToken()
        if (!idToken) return

        await fetch(`/api/users/${user!.id}/fcm-token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ token }),
        })
      } catch (error) {
        console.error('FCM: failed to register token', error)
        registeredRef.current = false
      }
    }

    register()

    return () => {
      cancelled = true
    }
  }, [user])

  // Listen for foreground messages
  useEffect(() => {
    if (!user || !onForeground) return
    return onForegroundMessage(onForeground)
  }, [user, onForeground])
}
