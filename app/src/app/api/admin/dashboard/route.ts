import { NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'
import { verifyAuth } from '@/lib/auth/verify'
import type { Alert } from '@/types'

export async function GET(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userDoc = await adminDb.collection('users').doc(auth.uid).get()
    const user = userDoc.data()
    if (!user || (user.role !== 'admin' && user.role !== 'supervisor')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const now = Date.now()
    const todayMidnight = new Date()
    todayMidnight.setHours(0, 0, 0, 0)
    const todayMs = todayMidnight.getTime()

    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000
    const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000

    // Run independent queries in parallel
    const [
      citizenSnap,
      prevMonthSnap,
      controlRoomSnap,
      alertsTodaySnap,
      activeIncidentsSnap,
      recentAlertsSnap,
    ] = await Promise.all([
      adminDb.collection('users').where('role', '==', 'citizen').get(),
      adminDb
        .collection('users')
        .where('role', '==', 'citizen')
        .where('createdAt', '>=', sixtyDaysAgo)
        .where('createdAt', '<', thirtyDaysAgo)
        .get(),
      adminDb.collection('controlRooms').where('isActive', '==', true).get(),
      adminDb
        .collection('alerts')
        .where('createdAt', '>=', todayMs)
        .get(),
      adminDb
        .collection('incidents')
        .where('reviewedBy', '==', null)
        .get(),
      adminDb
        .collection('alerts')
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get(),
    ])

    const totalUsers = citizenSnap.size

    // Month-over-month growth: compare citizens created in last 30 days vs previous 30 days
    const currentMonthUsers = citizenSnap.docs.filter(
      (d) => (d.data().createdAt ?? 0) >= thirtyDaysAgo
    ).length
    const prevMonthUsers = prevMonthSnap.size
    const userGrowth =
      prevMonthUsers > 0
        ? Math.round(((currentMonthUsers - prevMonthUsers) / prevMonthUsers) * 100)
        : currentMonthUsers > 0
          ? 100
          : 0

    const recentAlerts = recentAlertsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Alert[]

    return NextResponse.json({
      totalUsers,
      userGrowth,
      activeControlRooms: controlRoomSnap.size,
      alertsToday: alertsTodaySnap.size,
      activeIncidents: activeIncidentsSnap.size,
      recentAlerts,
      systemHealth: {
        firebaseStatus: 'online' as const,
        rtdbLatency: 0,
        activeConnections: 0,
      },
    })
  } catch (error) {
    console.error('Admin dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
