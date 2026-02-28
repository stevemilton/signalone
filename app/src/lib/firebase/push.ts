import { adminDb, adminMessaging } from './admin'
import { FieldValue } from 'firebase-admin/firestore'

interface PushOptions {
  title: string
  body: string
  url?: string
}

/**
 * Send a push notification to all devices registered for a user.
 * Fire-and-forget: never throws, never blocks API responses.
 * Automatically removes stale tokens on delivery failure.
 */
export async function sendPushToUser(userId: string, options: PushOptions): Promise<void> {
  try {
    const userDoc = await adminDb.collection('users').doc(userId).get()
    if (!userDoc.exists) return

    const tokens: string[] = userDoc.data()?.fcmTokens || []
    if (tokens.length === 0) return

    const response = await adminMessaging.sendEachForMulticast({
      tokens,
      data: {
        title: options.title,
        body: options.body,
        url: options.url || '/',
      },
    })

    // Clean up stale tokens
    const staleTokens: string[] = []
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        const code = resp.error?.code
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token'
        ) {
          staleTokens.push(tokens[idx])
        }
      }
    })

    if (staleTokens.length > 0) {
      await adminDb
        .collection('users')
        .doc(userId)
        .update({ fcmTokens: FieldValue.arrayRemove(...staleTokens) })
    }
  } catch (error) {
    console.error('Push notification failed (non-blocking):', error)
  }
}
