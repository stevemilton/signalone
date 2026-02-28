import { getToken, onMessage, type MessagePayload } from 'firebase/messaging'
import { messaging } from './config'

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY

/**
 * Request notification permission, register the service worker, and return an FCM token.
 * Returns null if permission is denied or messaging is unavailable.
 */
export async function requestFcmToken(): Promise<string | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null
  if (!VAPID_KEY) {
    console.warn('FCM: NEXT_PUBLIC_FIREBASE_VAPID_KEY not set')
    return null
  }

  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return null

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    })

    return token || null
  } catch (error) {
    console.error('FCM: failed to get token', error)
    return null
  }
}

/**
 * Listen for foreground FCM messages. Returns an unsubscribe function.
 */
export function onForegroundMessage(callback: (payload: MessagePayload) => void): () => void {
  return onMessage(messaging, callback)
}
