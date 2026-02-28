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

    const { searchParams } = new URL(request.url)
    const now = new Date()
    const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dateFrom = searchParams.get('dateFrom')
      ? new Date(searchParams.get('dateFrom')!).getTime()
      : defaultFrom.getTime()
    const dateTo = searchParams.get('dateTo')
      ? new Date(searchParams.get('dateTo')!).getTime() + 24 * 60 * 60 * 1000 - 1
      : now.getTime()

    // Fetch alerts in date range and supporting data in parallel
    const [alertsSnap, controlRoomsSnap, welfareSnap] = await Promise.all([
      adminDb
        .collection('alerts')
        .where('createdAt', '>=', dateFrom)
        .where('createdAt', '<=', dateTo)
        .get(),
      adminDb.collection('controlRooms').get(),
      adminDb.collection('welfareBookings').get(),
    ])

    const alerts = alertsSnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Alert[]

    // Build control room id→name map
    const crMap = new Map<string, string>()
    controlRoomsSnap.docs.forEach((doc) => {
      crMap.set(doc.id, doc.data().name)
    })

    // Build set of alert IDs that have welfare bookings
    const alertsWithWelfare = new Set<string>()
    welfareSnap.docs.forEach((doc) => {
      const data = doc.data()
      if (data.alertId) alertsWithWelfare.add(data.alertId)
    })

    // Total alerts
    const totalAlerts = alerts.length

    // Avg response time (seconds) for accepted alerts
    const acceptedAlerts = alerts.filter((a) => a.acceptedAt && a.createdAt)
    const avgResponseTime =
      acceptedAlerts.length > 0
        ? Math.round(
            acceptedAlerts.reduce(
              (sum, a) => sum + (a.acceptedAt! - a.createdAt) / 1000,
              0
            ) / acceptedAlerts.length
          )
        : 0

    // Classification breakdown
    const classificationBreakdown = { genuine: 0, false_alert: 0, malicious: 0, unclear: 0 }
    let classifiedCount = 0
    for (const a of alerts) {
      if (a.classification && a.classification in classificationBreakdown) {
        classificationBreakdown[a.classification as keyof typeof classificationBreakdown]++
        classifiedCount++
      }
    }

    // Genuine rate
    const genuineRate =
      classifiedCount > 0
        ? Math.round((classificationBreakdown.genuine / classifiedCount) * 100)
        : 0

    // Escalation rate
    const escalatedCount = alerts.filter(
      (a) => a.escalations && a.escalations.length > 0
    ).length
    const escalationRate =
      totalAlerts > 0 ? Math.round((escalatedCount / totalAlerts) * 100) : 0

    // Alerts by hour (24 buckets)
    const alertsByHour = new Array(24).fill(0)
    for (const a of alerts) {
      const hour = new Date(a.createdAt).getHours()
      alertsByHour[hour]++
    }

    // Alerts by day of week (Mon=0 ... Sun=6)
    const alertsByDay = new Array(7).fill(0)
    for (const a of alerts) {
      const jsDay = new Date(a.createdAt).getDay() // 0=Sun
      const day = jsDay === 0 ? 6 : jsDay - 1 // shift to Mon=0
      alertsByDay[day]++
    }

    // Alert type split
    const alertTypeSplit = { blue: 0, red: 0 }
    for (const a of alerts) {
      if (a.alertType === 'blue') alertTypeSplit.blue++
      else if (a.alertType === 'red') alertTypeSplit.red++
    }

    // Control room comparison
    const crStats = new Map<
      string,
      { alerts: number; responseTimes: number[]; genuine: number; classified: number }
    >()
    for (const a of alerts) {
      const crId = a.controlRoomId
      if (!crId) continue
      if (!crStats.has(crId)) {
        crStats.set(crId, { alerts: 0, responseTimes: [], genuine: 0, classified: 0 })
      }
      const stats = crStats.get(crId)!
      stats.alerts++
      if (a.acceptedAt && a.createdAt) {
        stats.responseTimes.push((a.acceptedAt - a.createdAt) / 1000)
      }
      if (a.classification) {
        stats.classified++
        if (a.classification === 'genuine') stats.genuine++
      }
    }

    const controlRoomComparison = Array.from(crStats.entries()).map(
      ([id, stats]) => ({
        id,
        name: crMap.get(id) ?? id,
        alerts: stats.alerts,
        avgResponseTime:
          stats.responseTimes.length > 0
            ? Math.round(
                stats.responseTimes.reduce((a, b) => a + b, 0) /
                  stats.responseTimes.length
              )
            : 0,
        genuineRate:
          stats.classified > 0
            ? Math.round((stats.genuine / stats.classified) * 100)
            : 0,
      })
    )

    // Welfare uptake: % of closed alerts that have a matching welfare booking
    const closedAlerts = alerts.filter((a) => a.status === 'closed')
    const closedWithWelfare = closedAlerts.filter((a) =>
      alertsWithWelfare.has(a.id)
    ).length
    const welfareUptake =
      closedAlerts.length > 0
        ? Math.round((closedWithWelfare / closedAlerts.length) * 100)
        : 0

    return NextResponse.json({
      totalAlerts,
      avgResponseTime,
      genuineRate,
      escalationRate,
      alertsByHour,
      alertsByDay,
      classificationBreakdown,
      alertTypeSplit,
      controlRoomComparison,
      welfareUptake,
    })
  } catch (error) {
    console.error('Admin analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}
