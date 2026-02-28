import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json({ error: 'ID token is required' }, { status: 400 })
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // Fetch user document from Firestore
    const userDoc = await adminDb.collection('users').doc(uid).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const userData = userDoc.data()

    // Check if user is permanently banned
    if (userData?.sanctionLevel === 'banned_permanent') {
      return NextResponse.json(
        { error: 'Account permanently suspended. Contact support for assistance.' },
        { status: 403 }
      )
    }

    // Check if temporary ban has expired
    if (userData?.sanctionLevel === 'banned_3m' && userData?.sanctionExpiresAt) {
      if (Date.now() > userData.sanctionExpiresAt) {
        // Ban has expired, reset sanction
        await adminDb.collection('users').doc(uid).update({
          sanctionLevel: 'none',
          sanctionExpiresAt: null,
          updatedAt: Date.now(),
        })
        userData.sanctionLevel = 'none'
        userData.sanctionExpiresAt = null
      } else {
        return NextResponse.json(
          { error: 'Account temporarily suspended. Try again later.' },
          { status: 403 }
        )
      }
    }

    return NextResponse.json({ user: { id: uid, ...userData } }, { status: 200 })
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string }

    if (firebaseError.code === 'auth/id-token-expired') {
      return NextResponse.json({ error: 'Token expired. Please sign in again.' }, { status: 401 })
    }

    if (firebaseError.code === 'auth/argument-error' || firebaseError.code === 'auth/id-token-revoked') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    console.error('Login error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
