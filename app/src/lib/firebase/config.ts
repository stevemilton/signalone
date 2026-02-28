import { initializeApp, getApps, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'
import { getDatabase, type Database } from 'firebase/database'
import { getStorage, type FirebaseStorage } from 'firebase/storage'
import { getMessaging, type Messaging } from 'firebase/messaging'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'placeholder',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'placeholder.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'placeholder',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '0',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '0:0:web:0',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://placeholder.firebaseio.com',
}

function getApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
}

let _auth: Auth | null = null
let _db: Firestore | null = null
let _rtdb: Database | null = null
let _storage: FirebaseStorage | null = null
let _messaging: Messaging | null = null

export const auth: Auth = new Proxy({} as Auth, {
  get(_, prop) {
    if (!_auth) _auth = getAuth(getApp())
    return (_auth as unknown as Record<string, unknown>)[prop as string]
  },
})

export const db: Firestore = new Proxy({} as Firestore, {
  get(_, prop) {
    if (!_db) _db = getFirestore(getApp())
    return (_db as unknown as Record<string, unknown>)[prop as string]
  },
})

export const rtdb: Database = new Proxy({} as Database, {
  get(_, prop) {
    if (!_rtdb) _rtdb = getDatabase(getApp())
    return (_rtdb as unknown as Record<string, unknown>)[prop as string]
  },
})

export const storage: FirebaseStorage = new Proxy({} as FirebaseStorage, {
  get(_, prop) {
    if (!_storage) _storage = getStorage(getApp())
    return (_storage as unknown as Record<string, unknown>)[prop as string]
  },
})

export const messaging: Messaging = new Proxy({} as Messaging, {
  get(_, prop) {
    if (typeof window === 'undefined') {
      throw new Error('Firebase Messaging is only available in the browser')
    }
    if (!_messaging) _messaging = getMessaging(getApp())
    return (_messaging as unknown as Record<string, unknown>)[prop as string]
  },
})

export default new Proxy({} as FirebaseApp, {
  get(_, prop) {
    const app = getApp()
    return (app as unknown as Record<string, unknown>)[prop as string]
  },
})
