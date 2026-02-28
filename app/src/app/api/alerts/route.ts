import { NextResponse } from 'next/server'
import { adminDb, adminRtdb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import { findControlRoom } from '@/lib/utils/postcode'
import type { Alert, RealtimeAlertState, User } from '@/types'

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user data
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const user = userDoc.data() as User

    // Check sanctions — blocked users cannot create alerts
    if (['banned_3m', 'banned_permanent'].includes(user.sanctionLevel)) {
      // Check if temporary ban has expired
      if (user.sanctionLevel === 'banned_3m' && user.sanctionExpiresAt && Date.now() > user.sanctionExpiresAt) {
        await adminDb.collection('users').doc(auth.uid).update({
          sanctionLevel: 'none',
          sanctionExpiresAt: null,
          updatedAt: Date.now(),
        })
      } else {
        return NextResponse.json(
          { error: 'Your account is sanctioned. You cannot create alerts.' },
          { status: 403 }
        )
      }
    }

    // Rate limiting: max 2 alerts per 24 hours
    const todayStr = new Date().toISOString().split('T')[0]
    if (user.lastAlertDate === todayStr && user.alertsToday >= 2) {
      return NextResponse.json(
        { error: 'Alert limit reached. Maximum 2 alerts per 24 hours.' },
        { status: 429 }
      )
    }

    // Check if user already has an active alert
    if (user.activeAlertId) {
      return NextResponse.json(
        { error: 'You already have an active alert. Please wait for it to be resolved.' },
        { status: 409 }
      )
    }

    const body = await request.json()
    const {
      alertType,
      location,
      locationName,
      riskPostcode,
      what3words,
      additionalInfo,
      passengerFeelsSafe,
      userName,
      userAge,
      userPhoto,
    } = body

    // Validate required fields
    if (!alertType || !location || !riskPostcode) {
      return NextResponse.json(
        { error: 'Missing required fields: alertType, location, riskPostcode' },
        { status: 400 }
      )
    }

    if (!['blue', 'red'].includes(alertType)) {
      return NextResponse.json({ error: 'alertType must be "blue" or "red"' }, { status: 400 })
    }

    if (!location.lat || !location.lng) {
      return NextResponse.json({ error: 'Location must include lat and lng' }, { status: 400 })
    }

    // Find control room by postcode
    const controlRoom = findControlRoom(riskPostcode)
    if (!controlRoom) {
      return NextResponse.json(
        { error: 'No control room found for your area. Service may not be available in your location.' },
        { status: 404 }
      )
    }

    // Find an available operator in the control room
    const operatorsSnapshot = await adminDb
      .collection('operators')
      .where('controlRoomId', '==', controlRoom.id)
      .where('status', '==', 'available')
      .limit(1)
      .get()

    let assignedOperatorId: string | null = null
    if (!operatorsSnapshot.empty) {
      const operatorDoc = operatorsSnapshot.docs[0]
      assignedOperatorId = operatorDoc.data().userId
    }

    const now = Date.now()
    const alertRef = adminDb.collection('alerts').doc()
    const alertId = alertRef.id

    const alertData: Alert = {
      id: alertId,
      alertType,
      userId: auth.uid,
      operatorId: assignedOperatorId,
      controlRoomId: controlRoom.id,
      status: assignedOperatorId ? 'awaiting_review' : 'pending',
      operatorStatus: null,
      location: {
        lat: location.lat,
        lng: location.lng,
        accuracy: location.accuracy || 0,
        timestamp: location.timestamp || now,
      },
      locationName: locationName || '',
      riskPostcode,
      what3words: what3words || '',
      additionalInfo: additionalInfo || '',
      passengerFeelsSafe: passengerFeelsSafe ?? true,
      userName: alertType === 'red' ? (userName || user.fullName) : null,
      userAge: alertType === 'red' ? (userAge || null) : null,
      userPhoto: alertType === 'red' ? (userPhoto || user.photoUrl) : null,
      createdAt: now,
      acceptedAt: null,
      locatedAt: null,
      closedAt: null,
      classification: null,
      operatorNotes: null,
      escalations: [],
      incidentLog: [
        {
          timestamp: now,
          message: `${alertType === 'blue' ? 'Blue' : 'Red'} alert created`,
          actor: 'system',
        },
      ],
      groupId: null,
      duration: null,
    }

    // Create alert in Firestore
    await alertRef.set(alertData)

    // Create real-time state in RTDB
    const realtimeState: RealtimeAlertState = {
      alertType,
      status: alertData.status,
      operatorStatus: null,
      additionalInfo: additionalInfo || '',
      passengerFeelsSafe: passengerFeelsSafe ?? true,
      location: alertData.location,
      updatedAt: now,
    }
    await adminRtdb.ref(`activeAlerts/${alertId}`).set(realtimeState)

    // Update user record
    const alertsToday = user.lastAlertDate === todayStr ? user.alertsToday + 1 : 1
    await adminDb.collection('users').doc(auth.uid).update({
      activeAlertId: alertId,
      alertsToday,
      lastAlertDate: todayStr,
      updatedAt: now,
    })

    // If operator was assigned, update operator status
    if (assignedOperatorId && !operatorsSnapshot.empty) {
      const operatorDoc = operatorsSnapshot.docs[0]
      await adminDb.collection('operators').doc(operatorDoc.id).update({
        status: 'busy',
        activeAlerts: [...(operatorDoc.data().activeAlerts || []), alertId],
      })
    }

    return NextResponse.json({ alertId, alert: alertData }, { status: 201 })
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const controlRoomId = searchParams.get('controlRoomId')
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    let query: FirebaseFirestore.Query = adminDb.collection('alerts')

    if (role === 'operator' || role === 'supervisor') {
      // Operators/supervisors see alerts for their control room
      if (controlRoomId) {
        query = query.where('controlRoomId', '==', controlRoomId)
      }
    } else {
      // Citizens see their own alerts
      query = query.where('userId', '==', auth.uid)
    }

    if (status) {
      const statuses = status.split(',')
      if (statuses.length === 1) {
        query = query.where('status', '==', statuses[0])
      } else {
        query = query.where('status', 'in', statuses)
      }
    }

    query = query.orderBy('createdAt', 'desc').limit(Math.min(limit, 100))

    const snapshot = await query.get()
    const alerts = snapshot.docs.map((doc) => doc.data())

    return NextResponse.json({ alerts }, { status: 200 })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}
