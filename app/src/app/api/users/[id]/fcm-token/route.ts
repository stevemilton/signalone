import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { FieldValue } from 'firebase-admin/firestore'

const MAX_TOKENS = 10

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can only manage their own tokens
    if (auth.uid !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const userRef = adminDb.collection('users').doc(id)
    const userDoc = await userRef.get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const existing: string[] = userDoc.data()?.fcmTokens || []

    // Already registered — no-op
    if (existing.includes(token)) {
      return NextResponse.json({ ok: true })
    }

    // Cap at MAX_TOKENS: drop the oldest if at limit
    if (existing.length >= MAX_TOKENS) {
      const oldest = existing[0]
      await userRef.update({
        fcmTokens: FieldValue.arrayRemove(oldest),
      })
    }

    await userRef.update({
      fcmTokens: FieldValue.arrayUnion(token),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('FCM token registration error:', error)
    return NextResponse.json({ error: 'Failed to register token' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    if (auth.uid !== id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { token } = await request.json()
    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    await adminDb.collection('users').doc(id).update({
      fcmTokens: FieldValue.arrayRemove(token),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('FCM token removal error:', error)
    return NextResponse.json({ error: 'Failed to remove token' }, { status: 500 })
  }
}
