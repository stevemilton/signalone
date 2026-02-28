import { initializeApp, getApps, cert, type App } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getDatabase } from 'firebase-admin/database'
import { getMessaging } from 'firebase-admin/messaging'

function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0]

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    return initializeApp({ projectId: 'build-placeholder' })
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  })
}

// Lazy getters to avoid build-time initialization errors
export const adminAuth = new Proxy({} as ReturnType<typeof getAuth>, {
  get(_, prop) {
    const auth = getAuth(getAdminApp())
    return (auth as unknown as Record<string, unknown>)[prop as string]
  },
})

export const adminDb = new Proxy({} as ReturnType<typeof getFirestore>, {
  get(_, prop) {
    const db = getFirestore(getAdminApp())
    return (db as unknown as Record<string, unknown>)[prop as string]
  },
})

export const adminRtdb = new Proxy({} as ReturnType<typeof getDatabase>, {
  get(_, prop) {
    const rtdb = getDatabase(getAdminApp())
    return (rtdb as unknown as Record<string, unknown>)[prop as string]
  },
})

export const adminMessaging = new Proxy({} as ReturnType<typeof getMessaging>, {
  get(_, prop) {
    const messaging = getMessaging(getAdminApp())
    return (messaging as unknown as Record<string, unknown>)[prop as string]
  },
})
