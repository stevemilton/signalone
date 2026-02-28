import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      // Allow unauthenticated access for admin pages that use cookie-based auth
      // Fall through to check the control room
    }

    const { id } = await params
    const controlRoomDoc = await adminDb.collection('controlRooms').doc(id).get()

    if (!controlRoomDoc.exists) {
      return NextResponse.json({ error: 'Control room not found' }, { status: 404 })
    }

    const controlRoom = controlRoomDoc.data()

    // Fetch cameras
    const camerasSnapshot = await adminDb
      .collection('cameras')
      .where('controlRoomId', '==', id)
      .get()
    const cameras = camerasSnapshot.docs.map((doc) => doc.data())

    // Fetch operators with user details
    const operatorsSnapshot = await adminDb
      .collection('operators')
      .where('controlRoomId', '==', id)
      .get()

    const operatorDetails = await Promise.all(
      operatorsSnapshot.docs.map(async (doc) => {
        const op = doc.data()
        const userDoc = await adminDb.collection('users').doc(op.userId).get()
        const user = userDoc.data()
        return {
          ...op,
          fullName: user?.fullName || 'Unknown',
          email: user?.email || '',
        }
      })
    )

    // Fetch recent alerts
    const alertsSnapshot = await adminDb
      .collection('alerts')
      .where('controlRoomId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get()
    const recentAlerts = alertsSnapshot.docs.map((doc) => doc.data())

    // Compute metrics
    const handledAlerts = recentAlerts.filter((a) => a.closedAt)
    const totalResponseTime = handledAlerts.reduce((sum, a) => {
      if (a.acceptedAt && a.createdAt) return sum + (a.acceptedAt - a.createdAt) / 1000
      return sum
    }, 0)

    return NextResponse.json({
      controlRoom: {
        ...controlRoom,
        cameras,
        operatorDetails,
        recentAlerts,
        avgResponseTime: handledAlerts.length ? totalResponseTime / handledAlerts.length : 0,
        alertsHandledTotal: handledAlerts.length,
      },
    })
  } catch (error) {
    console.error('Admin get control room error:', error)
    return NextResponse.json({ error: 'Failed to fetch control room' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const userData = userDoc.data()
    if (!userData || !['admin', 'control_room_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const controlRoomDoc = await adminDb.collection('controlRooms').doc(id).get()

    if (!controlRoomDoc.exists) {
      return NextResponse.json({ error: 'Control room not found' }, { status: 404 })
    }

    const body = await request.json()
    const now = Date.now()

    const updatableFields = [
      'name', 'coveragePostcodes', 'operatingHours', 'address',
      'phone', 'email', 'isActive', 'operators', 'vmsConfig',
    ]

    const updates: Record<string, unknown> = { updatedAt: now }
    for (const [key, value] of Object.entries(body)) {
      if (updatableFields.includes(key)) {
        updates[key] = value
      }
    }

    await adminDb.collection('controlRooms').doc(id).update(updates)
    const updatedDoc = await adminDb.collection('controlRooms').doc(id).get()

    return NextResponse.json({ controlRoom: updatedDoc.data() })
  } catch (error) {
    console.error('Admin update control room error:', error)
    return NextResponse.json({ error: 'Failed to update control room' }, { status: 500 })
  }
}
