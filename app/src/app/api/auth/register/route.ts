import { NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase/admin'
import { sendWelcomeEmail } from '@/lib/email/send'
import type { User } from '@/types'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { fullName, email, password, phone, address, emergencyContactName, emergencyContactPhone } = body

    // Validate required fields
    const requiredFields = { fullName, email, password, phone, address, emergencyContactName, emergencyContactPhone }
    const missingFields = Object.entries(requiredFields)
      .filter(([, value]) => !value || (typeof value === 'string' && value.trim() === ''))
      .map(([key]) => key)

    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Validate password length
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    // Create Firebase Auth user
    const authUser = await adminAuth.createUser({
      email: email.trim(),
      password,
      displayName: fullName.trim(),
    })

    const now = Date.now()

    // Create Firestore user document
    const userData: User = {
      id: authUser.uid,
      email: email.trim(),
      role: 'citizen',
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      emergencyContactName: emergencyContactName.trim(),
      emergencyContactPhone: emergencyContactPhone.trim(),
      photoUrl: null,
      idDocumentUrl: null,
      riskPostcode: '',
      controlRoomId: null,
      safetyZone: '',
      locationName: '',
      what3words: '',
      idVerified: false,
      termsAcceptedAt: null,
      sanctionLevel: 'none',
      sanctionExpiresAt: null,
      alertsToday: 0,
      lastAlertDate: null,
      activeAlertId: null,
      fcmTokens: [],
      createdAt: now,
      updatedAt: now,
    }

    await adminDb.collection('users').doc(authUser.uid).set(userData)

    // Set custom claims for role-based access
    await adminAuth.setCustomUserClaims(authUser.uid, { role: 'citizen' })

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(userData)

    return NextResponse.json({ user: userData }, { status: 201 })
  } catch (error: unknown) {
    const firebaseError = error as { code?: string; message?: string }

    if (firebaseError.code === 'auth/email-already-exists') {
      return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    }

    if (firebaseError.code === 'auth/invalid-email') {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    console.error('Registration error:', error)
    return NextResponse.json({ error: 'Failed to register user' }, { status: 500 })
  }
}
