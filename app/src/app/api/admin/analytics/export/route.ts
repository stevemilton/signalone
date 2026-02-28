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

    // Fetch alerts and control rooms in parallel
    const [alertsSnap, controlRoomsSnap] = await Promise.all([
      adminDb
        .collection('alerts')
        .where('createdAt', '>=', dateFrom)
        .where('createdAt', '<=', dateTo)
        .orderBy('createdAt', 'desc')
        .get(),
      adminDb.collection('controlRooms').get(),
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

    // Build CSV
    const headers = [
      'ID',
      'Type',
      'Status',
      'Classification',
      'Response Time (s)',
      'Duration (s)',
      'Control Room',
      'Escalations',
      'Created At',
    ]

    const escCsv = (val: string) => {
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        return `"${val.replace(/"/g, '""')}"`
      }
      return val
    }

    const rows = alerts.map((a) => {
      const responseTime =
        a.acceptedAt && a.createdAt
          ? String(Math.round((a.acceptedAt - a.createdAt) / 1000))
          : ''
      const duration = a.duration != null ? String(a.duration) : ''
      const crName = a.controlRoomId ? (crMap.get(a.controlRoomId) ?? a.controlRoomId) : ''
      const escalations = a.escalations ? String(a.escalations.length) : '0'
      const createdAt = new Date(a.createdAt).toISOString()

      return [
        a.id,
        a.alertType ?? '',
        a.status ?? '',
        a.classification ?? '',
        responseTime,
        duration,
        crName,
        escalations,
        createdAt,
      ]
        .map(escCsv)
        .join(',')
    })

    const csv = [headers.join(','), ...rows].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="alerts-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (error) {
    console.error('Admin analytics export error:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}
