import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { User } from '@/types'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can view their own profile, operators/admins can view any
    const requestingUserDoc = await adminDb.collection('users').doc(auth.uid).get()
    const requestingUser = requestingUserDoc.data()

    if (auth.uid !== id && requestingUser?.role === 'citizen') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userDoc = await adminDb.collection('users').doc(id).get()

    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data() as User

    // If citizen is requesting another citizen's profile (e.g. from operator view), strip sensitive fields
    if (requestingUser?.role === 'operator' && userData.role === 'citizen') {
      const { emergencyContactName, emergencyContactPhone, address, ...safeData } = userData
      // Operators can see emergency contact info for active alerts - but we include it
      // as they need it for their work. Only strip address for privacy.
      return NextResponse.json({
        user: {
          ...safeData,
          emergencyContactName,
          emergencyContactPhone,
          address: undefined,
        },
      }, { status: 200 })
    }

    return NextResponse.json({ user: userData }, { status: 200 })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Users can only update their own profile, unless admin
    const requestingUserDoc = await adminDb.collection('users').doc(auth.uid).get()
    const requestingUser = requestingUserDoc.data()

    if (auth.uid !== id && requestingUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userDoc = await adminDb.collection('users').doc(id).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const now = Date.now()

    // Fields that citizens can update
    const citizenUpdatableFields = [
      'fullName',
      'phone',
      'address',
      'emergencyContactName',
      'emergencyContactPhone',
      'photoUrl',
      'riskPostcode',
      'safetyZone',
      'locationName',
      'what3words',
      'termsAcceptedAt',
    ]

    // Admin-only fields
    const adminOnlyFields = [
      'role',
      'sanctionLevel',
      'sanctionExpiresAt',
      'controlRoomId',
      'idVerified',
    ]

    const updates: Record<string, unknown> = { updatedAt: now }

    for (const [key, value] of Object.entries(body)) {
      if (citizenUpdatableFields.includes(key)) {
        updates[key] = value
      } else if (adminOnlyFields.includes(key) && requestingUser?.role === 'admin') {
        updates[key] = value
      }
    }

    // Only updatedAt means no valid fields were provided
    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    await adminDb.collection('users').doc(id).update(updates)

    const updatedDoc = await adminDb.collection('users').doc(id).get()

    return NextResponse.json({ user: updatedDoc.data() }, { status: 200 })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}
