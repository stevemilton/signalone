import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { WelfareBooking } from '@/types'

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { alertId, scheduledDate, scheduledTime, notes } = body

    // Validate required fields
    if (!alertId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields: alertId, scheduledDate, scheduledTime' },
        { status: 400 }
      )
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(scheduledDate)) {
      return NextResponse.json(
        { error: 'scheduledDate must be in YYYY-MM-DD format' },
        { status: 400 }
      )
    }

    // Validate time format (HH:MM)
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(scheduledTime)) {
      return NextResponse.json(
        { error: 'scheduledTime must be in HH:MM format' },
        { status: 400 }
      )
    }

    // Verify the alert exists
    const alertDoc = await adminDb.collection('alerts').doc(alertId).get()
    if (!alertDoc.exists) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Verify the scheduled date is in the future
    const scheduledDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`)
    if (scheduledDateTime.getTime() <= Date.now()) {
      return NextResponse.json(
        { error: 'Scheduled date and time must be in the future' },
        { status: 400 }
      )
    }

    // Check for duplicate booking for the same alert
    const existingBooking = await adminDb
      .collection('welfareBookings')
      .where('alertId', '==', alertId)
      .where('userId', '==', auth.uid)
      .where('status', '==', 'scheduled')
      .limit(1)
      .get()

    if (!existingBooking.empty) {
      return NextResponse.json(
        { error: 'A welfare booking already exists for this alert' },
        { status: 409 }
      )
    }

    const now = Date.now()
    const bookingRef = adminDb.collection('welfareBookings').doc()

    const bookingData: WelfareBooking = {
      id: bookingRef.id,
      userId: auth.uid,
      alertId,
      scheduledDate,
      scheduledTime,
      status: 'scheduled',
      notes: notes || null,
      officerId: null,
      createdAt: now,
    }

    await bookingRef.set(bookingData)

    return NextResponse.json({ booking: bookingData }, { status: 201 })
  } catch (error) {
    console.error('Create welfare booking error:', error)
    return NextResponse.json({ error: 'Failed to create welfare booking' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Verify role for viewing other users' bookings
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const userData = userDoc.data()

    let query: FirebaseFirestore.Query = adminDb.collection('welfareBookings')

    if (userData?.role === 'citizen') {
      // Citizens can only see their own bookings
      query = query.where('userId', '==', auth.uid)
    } else if (userId) {
      // Operators/admins can filter by user
      query = query.where('userId', '==', userId)
    }

    if (status) {
      query = query.where('status', '==', status)
    }

    query = query.orderBy('createdAt', 'desc').limit(Math.min(limit, 100))

    const snapshot = await query.get()
    const bookings = snapshot.docs.map((doc) => doc.data())

    return NextResponse.json({ bookings }, { status: 200 })
  } catch (error) {
    console.error('Get welfare bookings error:', error)
    return NextResponse.json({ error: 'Failed to fetch welfare bookings' }, { status: 500 })
  }
}
