import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { DashboardStats } from '@/types'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify non-citizen role
    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userData = userDoc.data()
    if (userData?.role === 'citizen') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const controlRoomId = searchParams.get('controlRoomId')

    // Get start of today (midnight UTC)
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    const todayTimestamp = today.getTime()

    // Build base query for today's alerts
    let blueBaseQuery: FirebaseFirestore.Query = adminDb
      .collection('alerts')
      .where('alertType', '==', 'blue')
      .where('createdAt', '>=', todayTimestamp)

    let redBaseQuery: FirebaseFirestore.Query = adminDb
      .collection('alerts')
      .where('alertType', '==', 'red')
      .where('createdAt', '>=', todayTimestamp)

    if (controlRoomId) {
      blueBaseQuery = blueBaseQuery.where('controlRoomId', '==', controlRoomId)
      redBaseQuery = redBaseQuery.where('controlRoomId', '==', controlRoomId)
    }

    // Execute queries in parallel
    const [
      blueRaisedSnapshot,
      redRaisedSnapshot,
      blueAcceptedSnapshot,
      redAcceptedSnapshot,
      usersCountSnapshot,
    ] = await Promise.all([
      blueBaseQuery.count().get(),
      redBaseQuery.count().get(),
      blueBaseQuery.where('status', 'in', ['accepted', 'searching', 'monitoring', 'closed']).count().get(),
      redBaseQuery.where('status', 'in', ['accepted', 'searching', 'monitoring', 'closed']).count().get(),
      adminDb.collection('users').where('role', '==', 'citizen').count().get(),
    ])

    const stats: DashboardStats = {
      blueAlertsToday: {
        raised: blueRaisedSnapshot.data().count,
        accepted: blueAcceptedSnapshot.data().count,
      },
      redAlertsToday: {
        raised: redRaisedSnapshot.data().count,
        accepted: redAcceptedSnapshot.data().count,
      },
      linkedUsers: usersCountSnapshot.data().count,
      systemStatus: 'online',
    }

    // Additional stats for the dashboard
    let activeAlertsQuery: FirebaseFirestore.Query = adminDb
      .collection('alerts')
      .where('status', 'in', ['pending', 'awaiting_review', 'accepted', 'searching', 'monitoring'])

    if (controlRoomId) {
      activeAlertsQuery = activeAlertsQuery.where('controlRoomId', '==', controlRoomId)
    }

    const activeAlertsSnapshot = await activeAlertsQuery.count().get()

    // Get available operators count
    let operatorsQuery: FirebaseFirestore.Query = adminDb
      .collection('operators')
      .where('status', '==', 'available')

    if (controlRoomId) {
      operatorsQuery = operatorsQuery.where('controlRoomId', '==', controlRoomId)
    }

    const availableOperatorsSnapshot = await operatorsQuery.count().get()

    return NextResponse.json(
      {
        stats,
        activeAlerts: activeAlertsSnapshot.data().count,
        availableOperators: availableOperatorsSnapshot.data().count,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}
